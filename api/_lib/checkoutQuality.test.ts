import assert from 'node:assert/strict';
import test from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import checkout from '../create-checkout.ts';
import type { PaymentEnvironment } from './payment.ts';

const profileId = 'explorador-teste';
const attemptId = '11111111-1111-4111-8111-111111111111';
const reference = '22222222-2222-4222-8222-222222222222';
const orderId = 'ORDTST01K9SN1Q5959CGN8QGW00EH7V5';
const checkoutUrl = 'https://www.mercadopago.com.br/checkout/test';
const email = 'comprador@example.com';
const settings: PaymentEnvironment = {
  MP_ACCESS_TOKEN: 'fake-mercado-pago-token',
  MP_CHECKOUT_API: 'orders',
  SUPABASE_URL: 'https://db.sparky.example',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-supabase-token',
};

async function submitCheckout(APP_URL: string, checkoutDetails: Record<string, unknown> = {}) {
  let status: number | undefined;
  let response: unknown;
  const req = {
    method: 'POST',
    body: {
      userId: profileId, tier: 'PRO', checkoutAttemptId: attemptId,
      payer: { name: 'Comprador Teste', email, identification: { number: '12345678909' } },
      ...checkoutDetails,
    },
  } as VercelRequest;
  const res = {
    status(code: number) { status = code; return this; },
    json(body: unknown) { response = body; },
  } as VercelResponse;
  await checkout(req, res, { ...settings, APP_URL });
  return { status, response };
}

test('Orders requires an HTTPS domain origin before contacting Supabase or Mercado Pago', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Checkout must reject invalid configuration before fetching');
  });
  for (const url of ['http://sparky.example', 'https://localhost', 'https://127.0.0.1', 'https://sparky.example/checkout',
    'https://sparky.example/?preview=1', 'https://sparky.example/#/admin', 'https://user@sparky.example']) {
    assert.equal((await submitCheckout(url)).status, 503, url);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('Orders creates the web checkout through the official SDK and sends its quality fields', async t => {
  type OrderRequest = { payer: { email: string }; config: { statement_descriptor: string; online: object } };
  let sent: OrderRequest | undefined;
  let requestHeaders: Headers | undefined;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? 'GET';
    if (url.hostname === 'api.mercadopago.com' && url.pathname === '/v1/orders' && method === 'POST') {
      sent = JSON.parse(String(init?.body));
      requestHeaders = new Headers(init?.headers);
      return Response.json({ id: orderId, checkout_url: checkoutUrl }, { status: 201 });
    }
    if (url.pathname === '/rest/v1/profiles') return Response.json([{ id: profileId }]);
    if (url.pathname === '/rest/v1/mercado_pago_orders') {
      if (method === 'POST') return new Response(null, { status: 201 });
      if (method === 'PATCH') return Response.json({ reference });
      return Response.json({ reference, tier: 'PRO', provider_order_id: null, checkout_url: null });
    }
    throw new Error('Unexpected request: ' + url.pathname);
  });

  const appUrl = 'https://sparky.example/';
  const deviceId = 'test-device-session-123';
  assert.deepEqual(await submitCheckout(appUrl, {
    deviceId,
    additional_info: { 'payer.registration_date': '2025-01-01T00:00:00Z' },
  }), { status: 200, response: { initPoint: checkoutUrl, orderId } });
  assert.equal(requestHeaders?.get('X-Idempotency-Key'), reference);
  assert.equal(requestHeaders?.get('X-Meli-Session-Id'), deviceId);
  assert.match(requestHeaders?.get('User-Agent') ?? '', /^MercadoPago Node\.js SDK v\d+/);
  assert.match(requestHeaders?.get('X-Tracking-Id') ?? '', /,type:SDK\d/);
  assert.ok(requestHeaders?.get('X-Product-Id'));
  assert.equal(sent?.payer.email, email);
  assert.ok(sent && !Object.hasOwn(sent, 'additional_info'));
  assert.equal(sent?.config.statement_descriptor, 'TEKTOK TI');
  assert.deepEqual(sent?.config.online, {
    success_url: 'https://sparky.example/',
    failure_url: 'https://sparky.example/?status=failure',
    pending_url: 'https://sparky.example/?status=pending',
    auto_return: 'all',
    transaction_security: { validation: 'on_fraud_risk', liability_shift: 'required' },
  });

  for (const missingOrInvalidId of [null, '', 'device\r\nUnexpected: value', 'x'.repeat(4097)]) {
    assert.equal((await submitCheckout(appUrl, { deviceId: missingOrInvalidId })).status, 200);
    assert.equal(requestHeaders?.get('X-Meli-Session-Id'), null);
  }
});
