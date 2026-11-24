import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminAccounts } from '../../adminTypes';

export class AdminAccountsSetupError extends Error {
  constructor() {
    super('Apply supabase-admin.sql to enable the account dashboard');
  }
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function loadAdminAccounts(
  supabase: SupabaseClient,
  query: Record<string, string | string[] | undefined>,
): Promise<AdminAccounts> {
  const search = first(query.q)?.trim().replaceAll('\0', '') ?? '';
  const plan = first(query.plan);
  const view = first(query.view);
  const page = Number(first(query.page));

  const { data, error } = await supabase.rpc('sparky_admin_accounts', {
    search_term: Array.from(search).slice(0, 100).join(''),
    plan_filter: plan === 'FREE' || plan === 'STARTER' || plan === 'PRO' ? plan : null,
    account_view: view === 'new' || view === 'legacy' ? view : 'all',
    requested_page: Number.isInteger(page) && page > 0 && page <= 2147483647 ? page : 1,
  });

  if (error?.code === 'PGRST202') throw new AdminAccountsSetupError();
  if (error || !data?.summary || !Array.isArray(data.profiles)) {
    throw new Error('Unable to load admin accounts');
  }

  return data;
}
