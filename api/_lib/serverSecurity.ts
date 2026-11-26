import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export interface ServerSecurityEnvironment {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export type ServerSecurityConfig = ServerSecurityEnvironment | NodeJS.ProcessEnv;

export function createSecurityClient(env: ServerSecurityConfig) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Security storage is not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function consumeRateLimit(
  env: ServerSecurityConfig,
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Security storage is not configured');
  const bucket = createHmac('sha256', secret).update(scope).update('\0').update(key).digest('hex');
  const { data, error } = await createSecurityClient(env).rpc('sparky_consume_rate_limit', {
    bucket_key: bucket,
    request_limit: limit,
    window_seconds: windowSeconds,
  });
  if (error || typeof data?.allowed !== 'boolean' || !Number.isInteger(data.retryAfter)) {
    throw new Error('Unable to check rate limit');
  }
  return { allowed: data.allowed, retryAfter: data.retryAfter };
}
