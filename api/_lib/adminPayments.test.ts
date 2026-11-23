import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadAdminPayments } from './adminPayments.ts';

const profileId = 'explorador';
const reference = 'aebdbb5b-4de2-4f2d-a3ac-480888fe88c5';
const orderId = 'ORD01K9SN1Q5959CGN8QGW00EH7V5';
const orderCreatedAt = new Date(Date.now() - 60000).toISOString();
const paymentCreatedAt = new Date(Date.now() - 120000).toISOString();
const order = {
  id: orderId, type: 'online', currency: 'BRL', external_reference: reference, created_date: orderCreatedAt,
  status: 'processed', status_detail: 'accredited', total_amount: '49.99', total_paid_amount: '49.99',
};
const payment = {
  id: 123, currency_id: 'BRL', external_reference: JSON.stringify({ userId: profileId, tier: 'STARTER' }),
  date_created: paymentCreatedAt, transaction_amount: 19.99, status: 'approved',
  payer: { email: 'example@example.com' },
};

test('admin payments traverse Checkout Pro pages and exclude duplicate, unrelated and test entries', async t => {
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(init?.method ?? 'GET', 'GET');
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname === '/v1/orders') {
      assert.deepEqual([...url.searchParams.keys()].sort(), ['begin_date', 'end_date', 'limit', 'offset']);
      assert.equal(url.searchParams.get('limit'), '20');
      assert.equal(
        Date.parse(url.searchParams.get('end_date')!) - Date.parse(url.searchParams.get('begin_date')!),
        30 * 86400000,
      );
      const offset = url.searchParams.get('offset');
      if (offset === '0') {
        return Response.json({
          data: Array.from({ length: 20 }, () => ({ ...order, id: orderId.replace('ORD', 'ORDTST') })),
          paging: { total: '21', offset: '0', limit: '20' },
        });
      }
      assert.equal(offset, '20');
      return Response.json({
        data: [order],
        paging: { total: '21', offset: '20', limit: '20' },
      });
    }
    if (url.pathname === '/rest/v1/mercado_pago_orders') {
      assert.equal(url.searchParams.get('reference'), `in.(${reference})`);
      return Response.json([{
        reference, profile_id: profileId, tier: 'PRO', provider_order_id: orderId,
      }]);
    }
    if (url.pathname === '/v1/payments/search') {
      assert.equal(url.searchParams.get('range'), 'date_created');
      assert.equal(url.searchParams.get('offset'), '0');
      return Response.json({
        results: [
          payment,
          payment,
          { ...payment, id: 456, live_mode: false },
          { ...payment, id: 789, external_reference: reference, live_mode: true },
        ],
        paging: { total: 4, limit: 20, offset: 0 },
      });
    }
    assert.equal(url.pathname, '/v1/payments/123');
    return Response.json({ ...payment, live_mode: true, transaction_amount_refunded: 5 });
  });
  const supabase = createClient('https://sparky.example', 'test-token', { auth: { persistSession: false } });

  assert.deepEqual(await loadAdminPayments(supabase, 'test-token'), {
    status: 'available',
    periodDays: 30,
    entries: [
      {
        id: orderId, source: 'order', profileId, tier: 'PRO', status: 'approved', amountCents: 4999,
        createdAt: orderCreatedAt,
      },
      {
        id: '123', source: 'payment', profileId, tier: 'STARTER', status: 'refunded', amountCents: 1999,
        createdAt: paymentCreatedAt,
      },
    ],
  });
});

test('admin payments mark incomplete coverage when a provider refuses the request', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname === '/v1/orders') return Response.json({}, { status: 403 });
    assert.equal(url.pathname, '/v1/payments/search');
    return Response.json({ results: [{ ...payment, live_mode: true }], paging: { total: 1, limit: 20, offset: 0 } });
  });
  const supabase = createClient('https://sparky.example', 'test-token', { auth: { persistSession: false } });

  const result = await loadAdminPayments(supabase, 'test-token');
  assert.equal(result.status, 'partial');
  assert.deepEqual(result.entries.map(entry => entry.id), ['123']);
});
