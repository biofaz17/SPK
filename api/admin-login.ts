import type { ApiRequest, ApiResponse } from './_lib/http';
import { createAdminToken, isAllowedAdminOrigin, registerAdminSession, type AdminAuthEnvironment } from './_lib/adminAuth.ts';
import { consumeRateLimit } from './_lib/serverSecurity.ts';

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;

export default async function handler(req: ApiRequest, res: ApiResponse, env?: AdminAuthEnvironment) {
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
  try {
    const rate = await consumeRateLimit(config, 'admin-login', address, MAX_ATTEMPTS, WINDOW_SECONDS);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfter));
      return res.status(429).json({ error: 'Too many attempts' });
    }

    const password = req.body && typeof req.body === 'object' ? req.body.password : undefined;
    if (typeof password !== 'string' || !password.trim() || password.length > 128) {
      return res.status(400).json({ error: 'Invalid password payload' });
    }
    const token = createAdminToken(password, config);
    if (!token) return res.status(401).json({ error: 'Invalid credentials' });

    await registerAdminSession(token, config);
    return res.status(200).json({ token });
  } catch {
    return res.status(503).json({ error: 'Admin login service is unavailable' });
  }
}
