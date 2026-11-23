import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminToken, isAllowedAdminOrigin, type AdminAuthEnvironment } from './_lib/adminAuth.ts';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export default function handler(req: VercelRequest, res: VercelResponse, env?: AdminAuthEnvironment) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (origin && !isAllowedAdminOrigin(origin, host)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const config = env ?? process.env;
  if (!config.ADMIN_PASSWORD?.trim() || (config.ADMIN_TOKEN_SECRET?.length ?? 0) < 32) {
    return res.status(503).json({ error: 'Admin login service is not configured' });
  }

  const address = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
  const now = Date.now();

  const current = attempts.get(address);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts' });
  }

  const password = req.body && typeof req.body === 'object' ? req.body.password : undefined;
  if (typeof password !== 'string' || !password.trim() || password.length > 128) {
    const next = current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS };
    attempts.set(address, next);
    return res.status(400).json({ error: 'Invalid password payload' });
  }

  const token = createAdminToken(password, config);
  if (!token) {
    const next = current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS };
    attempts.set(address, next);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  attempts.delete(address);
  return res.status(200).json({ token });
}
