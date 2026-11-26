import type { ApiRequest, ApiResponse } from './_lib/http';
import { createClient } from '@supabase/supabase-js';
import type { AdminPayments } from '../adminTypes';
import { AdminAccountsSetupError, loadAdminAccounts } from './_lib/adminAccounts';
import { hasActiveAdminSession, isAllowedAdminOrigin, readAdminBearer, type AdminAuthEnvironment } from './_lib/adminAuth.ts';
import { adminPaymentPeriodDays, loadAdminPayments } from './_lib/adminPayments';
import type { PaymentEnvironment } from './_lib/payment';

export default async function handler(req: ApiRequest, res: ApiResponse, env?: AdminAuthEnvironment & PaymentEnvironment) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!isAllowedAdminOrigin(origin, host)) return res.status(403).json({ error: 'Forbidden origin' });

  try {
    if (!await hasActiveAdminSession(readAdminBearer(req.headers.authorization), env)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch {
    return res.status(503).json({ error: 'Admin session service is unavailable' });
  }

  const query = req.query ?? {};
  if (query.section !== undefined && query.section !== 'accounts' && query.section !== 'payments') {
    return res.status(400).json({ error: 'Invalid admin section' });
  }

  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, MP_ACCESS_TOKEN: accessToken } = env ?? process.env;
  if (!url || !serviceRoleKey) return res.status(503).json({ error: 'Admin data service is not configured' });

  try {
    const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
    if (query.section === 'payments') {
      const payments: AdminPayments = accessToken
        ? await loadAdminPayments(supabase, accessToken)
        : { status: 'unconfigured', entries: [], periodDays: adminPaymentPeriodDays };
      return res.status(200).json(payments);
    }

    return res.status(200).json(await loadAdminAccounts(supabase, query));
  } catch (error) {
    if (error instanceof AdminAccountsSetupError) {
      return res.status(503).json({ error: 'Admin accounts migration required', code: 'ADMIN_ACCOUNTS_SETUP' });
    }
    return res.status(502).json({ error: 'Unable to load admin data' });
  }
}
