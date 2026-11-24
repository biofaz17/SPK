import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmApprovedOrder, confirmApprovedPayment, isMercadoPagoOrderId, logPaymentFailure, type PaymentEnvironment } from './_lib/payment.ts';
import { readSignedPaymentId } from './_lib/paymentWebhookSignature.ts';

export default async function handler(req: VercelRequest, res: VercelResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const type = req.query.type || req.body?.type;
  if (type && !['payment', 'order', 'orders_v2'].includes(type)) return res.status(200).json({ received: true });

  const secret = (env ?? process.env).MP_WEBHOOK_SECRET?.trim();
  if (!secret) return res.status(503).json({ error: 'Payment notification secret is not configured' });

  try {
    const signedId = readSignedPaymentId(req.query['data.id'], req.headers['x-signature'], req.headers['x-request-id'], secret);
    if (!signedId) return res.status(401).json({ error: 'Invalid payment notification signature' });

    // The signed manifest uses lowercase IDs. Order lookups use the uppercase ID returned by Mercado Pago.
    const orderId = signedId.toUpperCase();
    if (isMercadoPagoOrderId(orderId)) {
      await confirmApprovedOrder(orderId, undefined, env);
    } else if ((!type || type === 'payment') && /^\d+$/.test(signedId)) {
      await confirmApprovedPayment(signedId, undefined, env);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    logPaymentFailure('process_payment_notification', error);
    return res.status(502).json({ error: 'Unable to process payment notification' });
  }
}
