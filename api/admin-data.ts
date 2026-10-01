import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { isAdminTokenValid } from './_lib/adminAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined;
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
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ profiles: data || [] });
}