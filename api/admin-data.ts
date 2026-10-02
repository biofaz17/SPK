import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { isAdminTokenValid, isAllowedAdminOrigin, sanitizeAdminProfile } from './_lib/adminAuth.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (origin && !isAllowedAdminOrigin(origin, host)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
  if (!isAdminTokenValid(token)) return res.status(401).json({ error: 'Unauthorized' });

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return res.status(503).json({ error: 'Admin data service is not configured' });

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,subscription,last_active,progress,terms_log,terms_accepted_version')
    .order('last_active', { ascending: false });

  if (error) return res.status(500).json({ error: 'Unable to load profiles' });

  const profiles = Array.isArray(data) ? data.map((profile) => sanitizeAdminProfile(profile)) : [];

  return res.status(200).json({ profiles });
}