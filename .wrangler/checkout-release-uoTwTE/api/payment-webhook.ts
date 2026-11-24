import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmApprovedOrder, confirmApprovedPayment, isMercadoPagoOrderId, logPaymentFailure, type PaymentEnvironment } from './_lib/payment';

export default async function handler(req: VercelRequest, res: VercelResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const type = req.query.type || req.body?.type;
  if (type && !['payment', 'order', 'orders_v2'].includes(type)) return res.status(200).json({ received: true });
  const resourceId = req.query['data.id']?.toString() || req.body?.data?.id?.toString();
  if (!resourceId) return res.status(200).json({ received: true });

  try {
    if (type === 'order' || type === 'orders_v2' || isMercadoPagoOrderId(resourceId)) {
      await confirmApprovedOrder(resourceId, undefined, env);
    } else {
      await confirmApprovedPayment(resourceId, undefined, env);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    logPaymentFailure('process_payment_notification', error);
    return res.status(502).json({ error: 'Unable to process payment notification' });
  }
}
