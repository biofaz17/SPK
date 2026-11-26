import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import type { ApiRequest, ApiResponse } from './http';
import handler from '../payment-webhook.ts';
import type { PaymentEnvironment } from './payment.ts';

const webhookSecret = 'fixture-webhook-secret';
const parameters: PaymentEnvironment = {
  MP_ACCESS_TOKEN: 'fixture-token',
  MP_WEBHOOK_SECRET: webhookSecret,
  MP_PAYMENT_MODE: 'test',
  SUPABASE_URL: 'https://sparky.example',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-key',
};
const defaultRequestId = 'edb36e94-359d-4006-9b7a-ad53bfdd372f';
const leaseToken = '828dd05d-ac9e-4d54-b15e-3a8d112696f2';
const timestamp = '1742505638683';
const orderId = 'ORDTST01K9SN1Q5959CGN8QGW00EH7V5';

function signedHeaders(id: string, lowercase = true, requestId = defaultRequestId) {
  const manifest = `id:${lowercase ? id.toLowerCase() : id};request-id:${requestId};ts:${timestamp};`;
  const hash = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  return { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${hash}` };
}

async function postNotification(
  query: ApiRequest['query'], headers: ApiRequest['headers'], body: unknown, env = parameters,
) {
  let statusCode = 200;
  const request: ApiRequest = { method: 'POST', query, headers, body };
  const response: ApiResponse = {
    status(code) { statusCode = code; return this; },
    setHeader() {},
    json() {},
    end() {},
  };
  await handler(request, response, env);
  return statusCode;
}

test('webhook rejects unsigned, tampered and ambiguous payment notifications before provider access', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Invalid notifications must not reach the provider');
  });
  const headers = signedHeaders(orderId);

  assert.equal(await postNotification({ type: 'order', 'data.id': orderId }, headers, {}, {}), 503);
  assert.equal(await postNotification({ type: 'order', 'data.id': orderId }, {}, {}), 401);
  assert.equal(await postNotification({ type: 'order' }, headers, { data: { id: orderId } }), 401);
  assert.equal(await postNotification({ type: 'order', 'data.id': [orderId, orderId] }, headers, {}), 401);
  assert.equal(await postNotification({ type: 'order', 'data.id': orderId }, { 'x-signature': headers['x-signature'] }, {}), 401);
  assert.equal(await postNotification({ type: 'payment', 'data.id': '456' }, signedHeaders('123'), {}), 401);
  assert.equal(await postNotification({ type: 'chargebacks' }, {}, {}, {}), 200);
  assert.equal(fetch.mock.callCount(), 0);
});

test('webhook verifies Mercado Pago signatures for Orders and Preferences before looking up the signed ID', async t => {
  const paths: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname === '/rest/v1/rpc/sparky_claim_mercado_pago_webhook') return Response.json(leaseToken);
    if (url.pathname === '/rest/v1/mercado_pago_webhook_deliveries' && init?.method === 'PATCH') {
      assert.equal(url.searchParams.get('lease_token'), `eq.${leaseToken}`);
      return Response.json({ delivery_key: 'completed' });
    }
    paths.push(url.pathname);
    if (url.pathname === '/v1/orders/' + orderId) {
      return Response.json({ id: orderId, type: 'online', currency: 'BRL' });
    }
    if (url.pathname === '/v1/payments/123') return Response.json({ currency_id: 'BRL' });
    return Response.json({}, { status: 500 });
  });
  t.mock.method(console, 'error', () => {});

  const order = { type: 'order', 'data.id': orderId };
  assert.equal(await postNotification(order, signedHeaders(orderId), { data: { id: '456' } }), 200);
  assert.equal(await postNotification(order, signedHeaders(orderId, false, 'alternate-request-id'), {}), 200);
  assert.equal(await postNotification({ type: 'payment', 'data.id': '123' }, signedHeaders('123'), {}), 200);
  assert.equal(await postNotification({ type: 'payment', 'data.id': '456' }, signedHeaders('456'), {}), 502);
  assert.deepEqual(paths, ['/v1/orders/' + orderId, '/v1/orders/' + orderId, '/v1/payments/123', '/v1/payments/456']);
});

test('webhook skips completed deliveries and leaves failed deliveries eligible for retry', async t => {
  let receipt: 'available' | 'busy' | 'processed' = 'available';
  let lookupCount = 0;
  let savedKey: string | undefined;
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname === '/rest/v1/rpc/sparky_claim_mercado_pago_webhook') {
      const key: unknown = JSON.parse(String(init?.body)).p_delivery_key;
      assert.ok(typeof key === 'string');
      savedKey ??= key;
      assert.equal(key, savedKey);
      assert.match(key, /^[0-9a-f]{64}$/);
      return Response.json(receipt === 'available' ? leaseToken : receipt);
    }
    if (url.pathname === '/rest/v1/mercado_pago_webhook_deliveries' && init?.method === 'PATCH') {
      assert.equal(url.searchParams.get('delivery_key'), `eq.${savedKey}`);
      assert.equal(url.searchParams.get('lease_token'), `eq.${leaseToken}`);
      receipt = 'processed';
      return Response.json({ delivery_key: savedKey });
    }
    assert.equal(url.pathname, `/v1/orders/${orderId}`);
    lookupCount += 1;
    return lookupCount === 1
      ? Response.json({}, { status: 502 })
      : Response.json({ id: orderId, type: 'online', currency: 'BRL' });
  });

  const query = { type: 'order', 'data.id': orderId };
  const headers = signedHeaders(orderId);
  assert.equal(await postNotification(query, headers, {}), 502);
  assert.equal(receipt, 'available');
  receipt = 'busy';
  assert.equal(await postNotification(query, headers, {}), 503);
  assert.equal(lookupCount, 1);
  receipt = 'available';
  assert.equal(await postNotification(query, headers, {}), 200);
  assert.equal(receipt, 'processed');
  assert.equal(await postNotification(query, headers, {}), 200);
  assert.equal(lookupCount, 2);
});
