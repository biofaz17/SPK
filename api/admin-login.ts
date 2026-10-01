import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminToken } from './_lib/adminAuth';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const address = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const current = attempts.get(address);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts' });
  }

  const token = createAdminToken(req.body?.password);
  if (!token) {
    attempts.set(address, current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  attempts.delete(address);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ token });
}