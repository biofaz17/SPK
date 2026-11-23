import type { SupabaseClient } from '@supabase/supabase-js';
import { Payment, type Order } from 'mercadopago';
import type { AdminPayment, AdminPayments, AdminPaymentStatus } from '../../adminTypes';
import {
  createMercadoPagoConfig, isCheckoutAttemptId, isMercadoPagoOrderId, logPaymentFailure,
  parseExternalReference, parseLegacyOrderReference,
} from './payment.ts';

export const adminPaymentPeriodDays = 30;
const pageSize = 20;
const maxPages = 5;
const maxPaymentDetails = 10;
const queryBudgetMs = 8000;
const millisecondsPerDay = 86400000;

type QueryPeriod = { begin: string; end: string; deadline: number };
type SourceStatus = 'available' | 'partial' | 'unavailable';
type SearchPage<T> = { items: T[] | undefined; total: number; offset: number };
type SourceResult<T = AdminPayment> = { status: SourceStatus; entries: T[] };
type ProviderPayment = NonNullable<Awaited<ReturnType<Payment['search']>>['results']>[number];
type PaymentFields = Pick<ProviderPayment,
  'external_reference' | 'transaction_amount' | 'date_created' | 'currency_id'
  | 'status' | 'status_detail' | 'transaction_amount_refunded'> & { id?: string | number };
type OrderSearchResponse = Awaited<ReturnType<Order['search']>>;
type ProviderOrder = NonNullable<OrderSearchResponse['data']>[number];
type OrderReservation = { reference: string; profile_id: string; tier: string; provider_order_id: string | null };

async function readPages<T>(
  operation: string,
  deadline: number,
  loadPage: (offset: number, timeout: number) => Promise<SearchPage<T>>,
): Promise<SourceResult<T>> {
  const entries: T[] = [];
  let loadedPage = false;
  let offset = 0;
  try {
    for (let page = 0; page < maxPages; page++) {
      const timeout = deadline - Date.now();
      if (timeout <= 0) break;
      const { items, total, offset: receivedOffset } = await loadPage(offset, timeout);
      if (!Array.isArray(items)) throw new Error('Missing search results');
      if (Number.isInteger(receivedOffset) && receivedOffset !== offset) throw new Error('Unexpected search offset');
      loadedPage = true;
      entries.push(...items);
      offset += items.length;
      if (Number.isSafeInteger(total) && total >= 0) {
        if (offset >= total) return { status: 'available', entries };
        if (items.length === 0) break;
      } else if (items.length < pageSize) {
        return { status: 'available', entries };
      }
    }
  } catch (error) {
    logPaymentFailure(operation, error);
  }
  return { status: loadedPage ? 'partial' : 'unavailable', entries };
}

function moneyInCents(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function dateInPeriod(value: unknown, { begin, end }: QueryPeriod): string | null {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp < Date.parse(begin) || timestamp > Date.parse(end)) return null;
  return new Date(timestamp).toISOString();
}

function paymentId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  return null;
}

function paymentStatus(payment: PaymentFields): AdminPaymentStatus {
  const { status, status_detail: detail, transaction_amount_refunded: refunded } = payment;
  if (status === 'charged_back' || status === 'in_mediation') return 'disputed';
  if (status === 'refunded' || detail === 'partially_refunded' || (moneyInCents(refunded) ?? 0) > 0) return 'refunded';
  if (status === 'approved' || status === 'rejected' || status === 'cancelled') return status;
  if (status === 'pending' || status === 'in_process' || status === 'authorized') return 'pending';
  return 'other';
}

function orderStatus(order: ProviderOrder, amountCents: number): AdminPaymentStatus {
  const { status, status_detail: detail, total_paid_amount: paid, transactions } = order;
  if (status === 'charged_back' || status === 'in_mediation' || detail === 'charged_back'
    || transactions?.payments?.some(payment => payment.status === 'charged_back' || payment.status === 'in_mediation')) return 'disputed';
  if (status === 'refunded' || detail === 'refunded' || detail === 'partially_refunded'
    || transactions?.payments?.some(payment => (moneyInCents(payment.refunded_amount) ?? 0) > 0)) return 'refunded';
  if (status === 'processed' && detail === 'accredited' && moneyInCents(paid) === amountCents) return 'approved';
  if (status === 'failed') return 'rejected';
  if (status === 'canceled' || status === 'expired') return 'cancelled';
  if (status === 'created' || status === 'processing' || status === 'action_required') return 'pending';
  return 'other';
}

function toPayment(payment: PaymentFields, period: QueryPeriod): AdminPayment | null {
  const { external_reference: externalReference } = payment;
  const reference = parseExternalReference(externalReference);
  const id = paymentId(payment.id);
  const amountCents = moneyInCents(payment.transaction_amount);
  const createdAt = dateInPeriod(payment.date_created, period);
  // Preference checkouts use a JSON reference. Orders use a UUID or the old sparky_S/P reference.
  if (!id || !reference?.userId || reference.userId.length > 100 || !amountCents || !createdAt
    || payment.currency_id !== 'BRL'
    || externalReference !== JSON.stringify({ userId: reference.userId, tier: reference.tier })) return null;
  return { id, source: 'payment', profileId: reference.userId, tier: reference.tier, status: paymentStatus(payment), amountCents, createdAt };
}

async function loadPayments(accessToken: string, period: QueryPeriod): Promise<SourceResult> {
  const client = new Payment(createMercadoPagoConfig(accessToken));
  const result = await readPages('search_admin_payments', period.deadline, async (offset, timeout) => {
    const response = await client.search({
      options: {
        range: 'date_created', sort: 'date_created', criteria: 'desc', limit: pageSize, offset,
        begin_date: period.begin, end_date: period.end,
      },
      requestOptions: { timeout },
    });
    return { items: response.results, total: response.paging?.total ?? NaN, offset: response.paging?.offset ?? NaN };
  });
  const entries: AdminPayment[] = [];
  const needsLiveMode = new Set<string>();
  for (const payment of result.entries) {
    if (payment.live_mode === false) continue;
    const entry = toPayment(payment, period);
    if (!entry) continue;
    if (payment.live_mode === true) entries.push(entry);
    else needsLiveMode.add(entry.id);
  }

  // Some search responses omit live_mode. Verify those payments before reporting them.
  const deadline = period.deadline - Date.now();
  let status = result.status;
  if (needsLiveMode.size && deadline <= 0) return { status: 'partial', entries };
  if (needsLiveMode.size > maxPaymentDetails) status = 'partial';
  const details = await Promise.allSettled(Array.from(needsLiveMode).slice(0, maxPaymentDetails).map(async id => {
    const detail = await client.get({ id, requestOptions: { timeout: deadline } });
    if (paymentId(detail.id) !== id || typeof detail.live_mode !== 'boolean') throw new Error('Payment mode unavailable');
    if (!detail.live_mode) return null;
    const entry = toPayment(detail, period);
    if (!entry) throw new Error('Payment details unavailable');
    return entry;
  }));
  for (const detail of details) {
    if (detail.status === 'rejected') {
      logPaymentFailure('verify_admin_payment_mode', detail.reason);
      status = 'partial';
    } else if (detail.value) {
      entries.push(detail.value);
    }
  }
  return { status, entries };
}

async function loadOrders(supabase: SupabaseClient, accessToken: string, period: QueryPeriod): Promise<SourceResult> {
  const result = await readPages('search_admin_orders', period.deadline, async (offset, timeout) => {
    // Mercado Pago's current SDK does not forward query parameters from Order.search.
    const url = new URL('https://api.mercadopago.com/v1/orders');
    url.search = new URLSearchParams({
      begin_date: period.begin, end_date: period.end, limit: String(pageSize), offset: String(offset),
    }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw Object.assign(new Error('Order search failed'), { status: response.status });
    const { data, paging } = await response.json() as OrderSearchResponse;
    return { items: data, total: Number(paging?.total ?? NaN), offset: Number(paging?.offset ?? NaN) };
  });
  const realOrders = result.entries.flatMap(order => {
    const id = order.id;
    const createdAt = dateInPeriod(order.created_date, period);
    const amountCents = moneyInCents(order.total_amount);
    if (!isMercadoPagoOrderId(id) || id.startsWith('ORDTST') || order.type !== 'online' || order.currency !== 'BRL'
      || !createdAt || !amountCents) return [];
    return [{ order, id, createdAt, amountCents }];
  });
  const references = [...new Set(realOrders.map(entry => entry.order.external_reference).filter(isCheckoutAttemptId))];
  const reservations = new Map<string, OrderReservation>();
  let status = result.status;
  if (references.length) {
    const remaining = period.deadline - Date.now();
    if (remaining <= 0) {
      status = 'partial';
    } else {
      try {
        const { data, error } = await supabase.from('mercado_pago_orders')
          .select('reference,profile_id,tier,provider_order_id').in('reference', references)
          .abortSignal(AbortSignal.timeout(remaining));
        if (error) throw error;
        for (const reservation of (data ?? []) as OrderReservation[]) reservations.set(reservation.reference, reservation);
      } catch (error) {
        logPaymentFailure('load_admin_order_references', error);
        status = 'partial';
      }
    }
  }

  const entries = realOrders.flatMap(({ order, id, createdAt, amountCents }): AdminPayment[] => {
    const externalReference = order.external_reference;
    const reservation = externalReference ? reservations.get(externalReference) : undefined;
    const reference = isCheckoutAttemptId(externalReference)
      ? { userId: reservation?.profile_id, tier: reservation?.tier }
      : parseLegacyOrderReference(externalReference);
    if (!reference?.userId || (reference.tier !== 'STARTER' && reference.tier !== 'PRO')) return [];
    if (reservation?.provider_order_id && reservation.provider_order_id !== id) return [];
    return [{
      id, source: 'order', profileId: reference.userId, tier: reference.tier,
      status: orderStatus(order, amountCents), amountCents, createdAt,
    }];
  });
  return { status, entries };
}

export async function loadAdminPayments(supabase: SupabaseClient, accessToken: string): Promise<AdminPayments> {
  const end = Date.now();
  const period: QueryPeriod = {
    begin: new Date(end - adminPaymentPeriodDays * millisecondsPerDay).toISOString(),
    end: new Date(end).toISOString(),
    deadline: end + queryBudgetMs,
  };
  const results = await Promise.allSettled([loadPayments(accessToken, period), loadOrders(supabase, accessToken, period)]);
  const entries = new Map<string, AdminPayment>();
  const statuses = results.map((result, index): SourceStatus => {
    if (result.status === 'rejected') {
      logPaymentFailure(index === 0 ? 'load_admin_payments' : 'load_admin_orders', result.reason);
      return 'unavailable';
    }
    for (const entry of result.value.entries) {
      const key = `${entry.source}:${entry.id}`;
      if (!entries.has(key)) entries.set(key, entry);
    }
    return result.value.status;
  });
  const status = statuses.every(value => value === 'available') ? 'available'
    : statuses.every(value => value === 'unavailable') ? 'unavailable' : 'partial';
  return {
    status,
    periodDays: adminPaymentPeriodDays,
    entries: Array.from(entries.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
