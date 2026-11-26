import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Order, Payment } from 'mercadopago';

export type PaidTier = 'STARTER' | 'PRO';

type OrderReference = { userId: string; tier: PaidTier };
type Reservation = { reference: string; tier: PaidTier; provider_order_id: string | null; checkout_url: string | null };
type PaymentVerification = { status: 'approved'; subscription: PaidTier } | { status: 'pending' | 'rejected' | 'cancelled' };

export interface PaymentEnvironment {
  MP_ACCESS_TOKEN?: string;
  MP_WEBHOOK_SECRET?: string;
  MP_CHECKOUT_API?: string;
  MP_PAYMENT_MODE?: string;
  APP_URL?: string;
  VERCEL_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export const paymentPrices: Record<PaidTier, number> = { STARTER: 19.99, PRO: 49.99 };
const orderTable = 'mercado_pago_orders';

export function createMercadoPagoConfig(accessToken: string) {
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000, maxRetries: 0 } });
}

export function isMercadoPagoOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^ORD(?:TST)?[0-9A-HJKMNP-TV-Z]{26}$/.test(value);
}

export function isMercadoPagoOrderForMode(value: unknown, mode?: string): value is string {
  return isMercadoPagoOrderId(value) && value.startsWith('ORDTST') === (mode === 'test');
}

export function isMercadoPagoPaymentId(value: unknown): value is string {
  return typeof value === 'string' && /^\d{1,32}$/.test(value);
}

export function isCheckoutAttemptId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value);
}

function orderStore(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } }).from(orderTable);
}

export async function reserveOrder(
  userId: string, tier: PaidTier, attemptId: string, supabaseUrl: string, serviceRoleKey: string,
): Promise<Reservation | null> {
  const store = orderStore(supabaseUrl, serviceRoleKey);
  const { error: insertError } = await store.upsert({
    profile_id: userId,
    tier,
    checkout_attempt_id: attemptId,
  }, { onConflict: 'profile_id,checkout_attempt_id', ignoreDuplicates: true, defaultToNull: false });
  if (insertError) throw new Error('Order reservation failed');

  const { data, error } = await store.select('reference,tier,provider_order_id,checkout_url')
    .eq('profile_id', userId).eq('checkout_attempt_id', attemptId).single();
  if (error || !data) throw new Error('Order reservation unavailable');
  return data.tier === tier ? data : null;
}

export async function linkProviderOrder(
  reference: string, orderId: string, checkoutUrl: string, supabaseUrl: string, serviceRoleKey: string,
): Promise<void> {
  const { data, error } = await orderStore(supabaseUrl, serviceRoleKey)
    .update({ provider_order_id: orderId, checkout_url: checkoutUrl })
    .eq('reference', reference)
    .or(`provider_order_id.is.null,provider_order_id.eq.${orderId}`)
    .select('reference').maybeSingle();
  if (error || !data) throw new Error('Provider order could not be linked');
}

function legacyOrderReference(userId: string, tier: PaidTier): string | null {
  const bytes = Buffer.from(userId, 'utf8');
  if (bytes.length === 0 || bytes.toString('utf8') !== userId) return null;
  const reference = `sparky_${tier === 'STARTER' ? 'S' : 'P'}_${bytes.toString('base64url')}`;
  return reference.length <= 64 ? reference : null;
}

export function parseLegacyOrderReference(value: unknown): OrderReference | null {
  if (typeof value !== 'string' || value.length > 64) return null;
  const match = /^sparky_([SP])_([A-Za-z0-9_-]+)$/.exec(value);
  if (!match) return null;
  const tier = match[1] === 'S' ? 'STARTER' : 'PRO';
  const userId = Buffer.from(match[2], 'base64url').toString('utf8');
  return legacyOrderReference(userId, tier) === value ? { userId, tier } : null;
}

export async function resolveOrderReference(
  value: unknown, orderId: string, supabaseUrl: string, serviceRoleKey: string,
): Promise<OrderReference | null> {
  if (!isCheckoutAttemptId(value)) return parseLegacyOrderReference(value);
  const { data, error } = await orderStore(supabaseUrl, serviceRoleKey)
    .select('profile_id,tier,provider_order_id').eq('reference', value).maybeSingle();
  if (error) throw new Error('Order reference could not be loaded');
  if (!data || (data.provider_order_id && data.provider_order_id !== orderId)) return null;
  return { userId: data.profile_id, tier: data.tier };
}

export function logPaymentFailure(operation: string, error: unknown): void {
  const upstreamStatus = (error as { status?: unknown } | null)?.status;
  console.error(JSON.stringify({
    integration: 'mercado_pago',
    operation,
    ...(typeof upstreamStatus === 'number' ? { upstreamStatus } : {}),
  }));
}

export function parseExternalReference(value: unknown): OrderReference | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed.userId !== 'string' || !['STARTER', 'PRO'].includes(parsed.tier)) return null;
    return { userId: parsed.userId, tier: parsed.tier };
  } catch {
    return null;
  }
}

type PaymentEnvironmentWithProcess = PaymentEnvironment | NodeJS.ProcessEnv;

async function grantSubscription(
  { userId, tier }: { userId: string; tier: PaidTier },
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<PaidTier | null> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const update = supabase.from('profiles').update({ subscription: tier }).eq('id', userId);
  const eligible = tier === 'STARTER' ? update.or('subscription.is.null,subscription.neq.PRO') : update;
  const { data, error } = await eligible.select('id').maybeSingle();
  if (error) throw new Error('Unable to update subscription');
  if (data) return tier;
  if (tier === 'PRO') return null;

  const current = await supabase.from('profiles').select('id').eq('id', userId).eq('subscription', 'PRO').maybeSingle();
  if (current.error) throw new Error('Unable to check subscription');
  return current.data ? 'PRO' : null;
}

export async function confirmApprovedPayment(
  paymentId: string,
  expectedUserId?: string,
  env: PaymentEnvironmentWithProcess = process.env,
): Promise<PaymentVerification | null> {
  const { MP_ACCESS_TOKEN: accessToken, SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = env;
  if (!accessToken || !supabaseUrl || !serviceRoleKey) throw new Error('Payment service is not configured');

  const payment = await new Payment(createMercadoPagoConfig(accessToken)).get({ id: paymentId });
  if (payment.currency_id !== 'BRL' || payment.live_mode !== (env.MP_PAYMENT_MODE !== 'test')) return null;

  const reference = parseExternalReference(payment.external_reference);
  if (!reference || (expectedUserId && reference.userId !== expectedUserId)) return null;
  if (Number(payment.transaction_amount) !== paymentPrices[reference.tier]) return null;
  if (payment.status === 'rejected') return { status: 'rejected' };
  if (payment.status === 'cancelled') return { status: 'cancelled' };
  if (['pending', 'in_process', 'authorized', 'in_mediation'].includes(payment.status ?? '')) return { status: 'pending' };
  if (payment.status !== 'approved') return null;

  const subscription = await grantSubscription(reference, supabaseUrl, serviceRoleKey);
  return subscription ? { status: 'approved', subscription } : null;
}

export async function confirmApprovedOrder(
  orderId: string,
  expectedUserId?: string,
  env: PaymentEnvironmentWithProcess = process.env,
): Promise<PaymentVerification | null> {
  if (!isMercadoPagoOrderForMode(orderId, env.MP_PAYMENT_MODE)) return null;
  const { MP_ACCESS_TOKEN: accessToken, SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = env;
  if (!accessToken || !supabaseUrl || !serviceRoleKey) throw new Error('Payment service is not configured');

  const order = await new Order(createMercadoPagoConfig(accessToken)).get({ id: orderId });
  if (order.id !== orderId || order.type !== 'online' || order.currency !== 'BRL') return null;

  const reference = await resolveOrderReference(order.external_reference, orderId, supabaseUrl, serviceRoleKey);
  if (!reference || (expectedUserId && reference.userId !== expectedUserId)) return null;
  const expectedPrice = paymentPrices[reference.tier];
  if (Number(order.total_amount) !== expectedPrice) return null;
  if (order.status === 'failed') return { status: 'rejected' };
  if (order.status === 'canceled') return { status: 'cancelled' };
  if (['created', 'processing', 'action_required'].includes(order.status ?? '')) return { status: 'pending' };
  if (order.status !== 'processed' || order.status_detail !== 'accredited' || Number(order.total_paid_amount) !== expectedPrice) return null;

  const subscription = await grantSubscription(reference, supabaseUrl, serviceRoleKey);
  return subscription ? { status: 'approved', subscription } : null;
}
