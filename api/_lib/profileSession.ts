import { createClient } from '@supabase/supabase-js';

export interface ProfileSessionEnvironment {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

type AuthenticatedProfile = { id: string; subscription: string | null } | { status: 401 | 422 | 503; error: string };

export async function getAuthenticatedProfile(
  authorization: unknown,
  env: ProfileSessionEnvironment | NodeJS.ProcessEnv,
): Promise<AuthenticatedProfile> {
  const token = typeof authorization === 'string' && authorization.length <= 8192
    ? /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/i.exec(authorization)?.[1] : undefined;
  const unauthorized = { status: 401, error: 'A valid session is required' } as const;
  if (!token) return unauthorized;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const unavailable = { status: 503, error: 'Unable to verify profile' } as const;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return unavailable;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      if ([400, 401, 403, 404].includes(authError.status ?? 0)) return unauthorized;
      throw authError;
    }
    if (!user?.id) return unauthorized;

    const { data, error } = await supabase.from('profiles').select('id,subscription').eq('auth_user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!data) return { status: 422, error: 'A registered profile is required' };
    return { id: data.id, subscription: data.subscription ?? null };
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    console.error(JSON.stringify({ event: 'verify_profile_failed', ...(typeof status === 'number' ? { status } : {}) }));
    return unavailable;
  }
}
