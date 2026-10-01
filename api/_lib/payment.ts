import { createClient } from '@supabase/supabase-js';

export type PaidTier = 'STARTER' | 'PRO';

const prices: Record<PaidTier, number> = { STARTER: 19.99, PRO: 49.99 };

function parseExternalReference(value: unknown): { userId: string; tier: PaidTier } | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed.userId !== 'string' || !['STARTER', 'PRO'].includes(parsed.tier)) return null;
    return { userId: parsed.userId, tier: parsed.tier };
  } catch {
    return null;
  }
}

export async function confirmApprovedPayment(paymentId: string, expectedUserId?: string): Promise<PaidTier | null> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!accessToken || !supabaseUrl || !serviceRoleKey) throw new Error('Payment service is not configured');

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!paymentResponse.ok) throw new Error('Unable to verify payment');

  const payment = await paymentResponse.json();
  if (payment.status !== 'approved' || payment.currency_id !== 'BRL') return null;

  const reference = parseExternalReference(payment.external_reference);
  if (!reference || (expectedUserId && reference.userId !== expectedUserId)) return null;
  if (Number(payment.transaction_amount) !== prices[reference.tier]) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('profiles')
    .update({ subscription: reference.tier })
    .eq('id', reference.userId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error('Unable to update subscription');
  return data ? reference.tier : null;
}