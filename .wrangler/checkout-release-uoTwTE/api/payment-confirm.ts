import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmApprovedOrder, confirmApprovedPayment, isMercadoPagoOrderId, logPaymentFailure, type PaymentEnvironment } from './_lib/payment';

export default async function handler(req: VercelRequest, res: VercelResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { orderId, paymentId, userId } = req.body || {};
  const orderRequested = orderId !== undefined;
  if (typeof userId !== 'string' || !userId || (orderRequested ? !isMercadoPagoOrderId(orderId) : typeof paymentId !== 'string')) {
    return res.status(400).json({ error: 'Invalid confirmation request' });
  }

  try {
    const verification = orderRequested
      ? await confirmApprovedOrder(orderId, userId, env)
      : await confirmApprovedPayment(paymentId, userId, env);
    if (verification?.status !== 'approved') {
      return res.status(409).json({ error: 'Payment is not approved for this account', ...verification });
    }
    return res.status(200).json(verification);
  } catch (error) {
    logPaymentFailure('confirm_payment', error);
    return res.status(502).json({ error: 'Unable to confirm payment' });
  }
}
