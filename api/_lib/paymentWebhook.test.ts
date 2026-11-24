import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import test from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../payment-webhook.ts';
import type { PaymentEnvironment } from './payment.ts';

const webhookSecret = 'fixture-webhook-secret';
const parameters: PaymentEnvironment = {
  MP_ACCESS_TOKEN: 'fixture-token',
  MP_WEBHOOK_SECRET: webhookSecret,
  SUPABASE_URL: 'https://sparky.example',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-key',
};
const requestId = 'edb36e94-359d-4006-9b7a-ad53bfdd372f';
const timestamp = '1742505638683';
const orderId = 'ORDTST01K9SN1Q5959CGN8QGW00EH7V5';

function signedHeaders(id: string, lowercase = true) {
  const manifest = `id:${lowercase ? id.toLowerCase() : id};request-id:${requestId};ts:${timestamp};`;
  const hash = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  return { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${hash}` };
}

async function postNotification(
  query: VercelRequest['query'], headers: VercelRequest['headers'], body: unknown, env = parameters,
) {
  const request: VercelRequest = Object.assign(new IncomingMessage(new Socket()), { method: 'POST', query, headers, body, cookies: {} });
  const response: VercelResponse = Object.assign(new ServerResponse(request), {
    status(code: number) { response.statusCode = code; return response; },
    json: () => response,
    send: () => response,
    redirect: () => response,
  });
  await handler(request, response, env);
  return response.statusCode;
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
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : input);
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
  assert.equal(await postNotification(order, signedHeaders(orderId, false), {}), 200);
  assert.equal(await postNotification({ type: 'payment', 'data.id': '123' }, signedHeaders('123'), {}), 200);
  assert.equal(await postNotification({ type: 'payment', 'data.id': '456' }, signedHeaders('456'), {}), 502);
  assert.deepEqual(paths, ['/v1/orders/' + orderId, '/v1/orders/' + orderId, '/v1/payments/123', '/v1/payments/456']);
});
