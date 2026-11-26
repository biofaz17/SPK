import type { ApiRequest, ApiResponse } from './_lib/http';
import { isAllowedAdminOrigin, readAdminBearer, revokeAdminSession, type AdminAuthEnvironment } from './_lib/adminAuth.ts';

export default async function handler(req: ApiRequest, res: ApiResponse, env?: AdminAuthEnvironment) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!isAllowedAdminOrigin(origin, host)) return res.status(403).json({ error: 'Forbidden origin' });
  const token = readAdminBearer(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await revokeAdminSession(token, env);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ error: 'Admin session service is unavailable' });
  }
}
