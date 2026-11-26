import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApiRequest, ApiResponse } from './http';
import checkout from '../create-checkout.ts';
import confirm from '../payment-confirm.ts';
import type { PaymentEnvironment } from './payment.ts';

const profileId = 'explorador-teste';
const authUserId = '33333333-3333-4333-8333-333333333333';
const authorization = 'Bearer fixture.access.token';
const attemptId = '11111111-1111-4111-8111-111111111111';
const reference = '22222222-2222-4222-8222-222222222222';
const sandboxOrderId = 'ORDTST01K9SN1Q5959CGN8QGW00EH7V5';
const orderId = sandboxOrderId.replace('ORDTST', 'ORD');
const checkoutUrl = 'https://www.mercadopago.com.br/checkout/test';
const email = 'comprador@example.com';
const settings: PaymentEnvironment = {
  MP_ACCESS_TOKEN: 'fake-mercado-pago-token',
  MP_CHECKOUT_API: 'orders',
  SUPABASE_URL: 'https://db.sparky.example',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-supabase-token',
};

async function paymentRequest(
  handler: typeof checkout, body: Record<string, unknown>, env: PaymentEnvironment, bearer: string | null,
) {
  let status: number | undefined;
  let response: unknown;
  let retryAfter: string | undefined;
  const req: ApiRequest = {
    method: 'POST',
    headers: bearer ? { authorization: bearer } : {},
    query: {},
    body,
  };
  const res: ApiResponse = {
    status(code: number) { status = code; return this; },
    setHeader(name, value) { if (name === 'Retry-After') retryAfter = value; },
    json(body: unknown) { response = body; },
    end() {},
  };
  await handler(req, res, env);
  return { status, response, ...(retryAfter === undefined ? {} : { retryAfter }) };
}

function submitCheckout(APP_URL: string, checkoutDetails: Record<string, unknown> = {}, bearer: string | null = authorization, mode?: string) {
  return paymentRequest(checkout, {
    tier: 'PRO', checkoutAttemptId: attemptId,
    payer: { name: 'Comprador Teste', email, identification: { number: '12345678909' } },
    ...checkoutDetails,
  }, { ...settings, APP_URL, MP_PAYMENT_MODE: mode }, bearer);
}

function authenticateAndCheckQuota(url: URL, init?: RequestInit, allowed = true): Response | undefined {
  if (url.pathname === '/auth/v1/user') {
    assert.equal(new Headers(init?.headers).get('Authorization'), authorization);
    return Response.json({ id: authUserId });
  }
  if (url.pathname === '/rest/v1/profiles' && (init?.method ?? 'GET') === 'GET') {
    assert.equal(url.searchParams.get('auth_user_id'), `eq.${authUserId}`);
    return Response.json([{ id: profileId }]);
  }
  if (url.pathname === '/rest/v1/rpc/sparky_consume_rate_limit') {
    return Response.json({ allowed, retryAfter: allowed ? 0 : 30 });
  }
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
  let providerOrderId = orderId;
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? 'GET';
    const profile = authenticateAndCheckQuota(url, init);
    if (profile) return profile;
    if (url.hostname === 'api.mercadopago.com' && url.pathname === '/v1/orders' && method === 'POST') {
      sent = JSON.parse(String(init?.body));
      requestHeaders = new Headers(init?.headers);
      return Response.json({ id: providerOrderId, checkout_url: checkoutUrl }, { status: 201 });
    }
    if (url.pathname === '/rest/v1/mercado_pago_orders') {
      if (method === 'POST') {
        assert.equal(JSON.parse(String(init?.body)).profile_id, profileId);
        return new Response(null, { status: 201 });
      }
      if (method === 'PATCH') return Response.json({ reference });
      return Response.json({ reference, tier: 'PRO', provider_order_id: null, checkout_url: null });
    }
    throw new Error('Unexpected request: ' + url.pathname);
  });

  const appUrl = 'https://sparky.example/';
  const deviceId = 'test-device-session-123';
  assert.deepEqual(await submitCheckout(appUrl, {
    deviceId,
    userId: 'perfil-de-outro-explorador',
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
  providerOrderId = sandboxOrderId;
  assert.equal((await submitCheckout(appUrl)).status, 502);
  assert.deepEqual(await submitCheckout(appUrl, {}, authorization, 'test'), {
    status: 200, response: { initPoint: checkoutUrl, orderId: sandboxOrderId },
  });
});

test('checkout and confirmation require a valid Supabase session before contacting payment services', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : input);
    assert.equal(url.pathname, '/auth/v1/user');
    return Response.json({ code: 'bad_jwt', message: 'Invalid JWT' }, { status: 401 });
  });
  assert.equal((await submitCheckout('https://sparky.example', { userId: profileId }, null)).status, 401);
  assert.equal((await paymentRequest(confirm, { orderId, userId: profileId }, settings, null)).status, 401);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal((await submitCheckout('https://sparky.example')).status, 401);
  assert.equal((await paymentRequest(confirm, { orderId }, settings, authorization)).status, 401);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('payment confirmation checks the authenticated profile for both Orders and legacy payments', async t => {
  const foreignProfileId = 'outro-explorador';
  let owner = foreignProfileId;
  let grants = 0;
  let expectedOrderId = orderId;
  let liveMode = true;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const profile = authenticateAndCheckQuota(url, init);
    if (profile) return profile;
    if (url.pathname === `/v1/orders/${expectedOrderId}`) {
      return Response.json({ id: expectedOrderId, type: 'online', currency: 'BRL', status: 'processed', status_detail: 'accredited',
        external_reference: reference, total_amount: '49.99', total_paid_amount: '49.99' });
    }
    if (url.pathname === '/rest/v1/mercado_pago_orders') {
      return Response.json([{ profile_id: owner, tier: 'PRO', provider_order_id: expectedOrderId }]);
    }
    if (url.pathname === '/v1/payments/123') {
      return Response.json({ currency_id: 'BRL', status: 'approved', live_mode: liveMode, transaction_amount: 49.99,
        external_reference: JSON.stringify({ userId: owner, tier: 'PRO' }) });
    }
    if (url.pathname === '/rest/v1/profiles' && init?.method === 'PATCH') {
      assert.equal(url.searchParams.get('id'), `eq.${profileId}`);
      grants += 1;
      return Response.json({ id: profileId });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });

  const confirmations = [{ orderId }, { paymentId: '123' }];
  for (const request of confirmations) {
    const result = await paymentRequest(confirm, { ...request, userId: foreignProfileId }, settings, authorization);
    assert.deepEqual(result, { status: 409, response: { error: 'Payment is not approved for this account' } });
  }
  assert.equal(grants, 0);

  owner = profileId;
  for (const request of confirmations) {
    const result = await paymentRequest(confirm, request, settings, authorization);
    assert.deepEqual(result, { status: 200, response: { status: 'approved', subscription: 'PRO' } });
  }
  assert.equal(grants, 2);

  expectedOrderId = sandboxOrderId;
  liveMode = false;
  for (const request of [{ orderId: sandboxOrderId }, { paymentId: '123' }]) {
    assert.equal((await paymentRequest(confirm, request, settings, authorization)).status, 409);
    assert.equal((await paymentRequest(confirm, request, { ...settings, MP_PAYMENT_MODE: 'test' }, authorization)).status, 200);
  }
  assert.equal(grants, 4);
});

test('checkout and confirmation limit payment operations by authenticated profile', async t => {
  const buckets = new Map<number, string>();
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname === '/rest/v1/rpc/sparky_consume_rate_limit') {
      const request = JSON.parse(String(init?.body));
      assert.equal(request.window_seconds, 60);
      assert.match(request.bucket_key, /^[0-9a-f]{64}$/);
      buckets.set(request.request_limit, request.bucket_key);
    }
    const profile = authenticateAndCheckQuota(url, init, false);
    assert.ok(profile, `Unexpected request: ${url.pathname}`);
    return profile;
  });

  assert.deepEqual(await submitCheckout('https://sparky.example'), {
    status: 429, response: { error: 'Too many checkout requests' }, retryAfter: '30',
  });
  assert.deepEqual(await paymentRequest(confirm, { orderId }, settings, authorization), {
    status: 429, response: { error: 'Too many payment confirmation requests' }, retryAfter: '30',
  });
  assert.deepEqual([...buckets.keys()], [10, 30]);
  assert.notEqual(buckets.get(10), buckets.get(30));
});
