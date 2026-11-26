import type { ApiRequest, ApiResponse } from './_lib/http';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  confirmApprovedOrder, confirmApprovedPayment, isCheckoutAttemptId, isMercadoPagoOrderId, isMercadoPagoPaymentId,
  logPaymentFailure, type PaymentEnvironment,
} from './_lib/payment.ts';
import { readSignedPaymentId } from './_lib/paymentWebhookSignature.ts';

export default async function handler(req: ApiRequest, res: ApiResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const type = req.query.type || req.body?.type;
  if (type && !['payment', 'order', 'orders_v2'].includes(type)) return res.status(200).json({ received: true });

  const { MP_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env ?? process.env;
  const secret = MP_WEBHOOK_SECRET?.trim();
  if (!secret) return res.status(503).json({ error: 'Payment notification secret is not configured' });

  try {
    const requestId = req.headers['x-request-id'];
    const signedId = readSignedPaymentId(req.query['data.id'], req.headers['x-signature'], requestId, secret);
    if (!signedId || typeof requestId !== 'string') return res.status(401).json({ error: 'Invalid payment notification signature' });

    // The signed manifest uses lowercase IDs. Order lookups use the uppercase ID returned by Mercado Pago.
    const orderId = signedId.toUpperCase();
    const isOrder = isMercadoPagoOrderId(orderId);
    if (!isOrder && ((type && type !== 'payment') || !isMercadoPagoPaymentId(signedId))) {
      return res.status(200).json({ received: true });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Webhook receipt storage is not configured');

    const deliveryKey = createHash('sha256').update(JSON.stringify([orderId, requestId])).digest('hex');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: claim, error: claimError } = await supabase.rpc('sparky_claim_mercado_pago_webhook', { p_delivery_key: deliveryKey });
    if (claimError) throw claimError;
    if (claim === 'processed') return res.status(200).json({ received: true });
    if (claim === 'busy') return res.status(503).json({ error: 'Payment notification is already being processed' });
    if (!isCheckoutAttemptId(claim)) throw new Error('Unexpected webhook receipt claim');

    if (isOrder) {
      await confirmApprovedOrder(orderId, undefined, env);
    } else {
      await confirmApprovedPayment(signedId, undefined, env);
    }

    const { data: receipt, error: receiptError } = await supabase.from('mercado_pago_webhook_deliveries')
      .update({ processed_at: new Date().toISOString() }).eq('delivery_key', deliveryKey)
      .eq('lease_token', claim).is('processed_at', null).select('delivery_key').maybeSingle();
    if (receiptError || !receipt) throw new Error('Unable to complete webhook receipt');
    return res.status(200).json({ received: true });
  } catch (error) {
    logPaymentFailure('process_payment_notification', error);
    return res.status(502).json({ error: 'Unable to process payment notification' });
  }
}
