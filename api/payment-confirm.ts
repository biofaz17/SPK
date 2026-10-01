import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmApprovedPayment } from './_lib/payment';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { paymentId, userId } = req.body || {};
  if (typeof paymentId !== 'string' || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid confirmation request' });

  try {
    const subscription = await confirmApprovedPayment(paymentId, userId);
    if (!subscription) return res.status(409).json({ error: 'Payment is not approved for this account' });
    return res.status(200).json({ subscription });
  } catch {
    return res.status(502).json({ error: 'Unable to confirm payment' });
  }
}