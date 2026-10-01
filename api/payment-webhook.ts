import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmApprovedPayment } from './_lib/payment';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const paymentId = req.query['data.id']?.toString() || req.body?.data?.id?.toString();
  if (!paymentId) return res.status(200).json({ received: true });

  try {
    await confirmApprovedPayment(paymentId);
    return res.status(200).json({ received: true });
  } catch {
    return res.status(502).json({ error: 'Unable to process payment notification' });
  }
}