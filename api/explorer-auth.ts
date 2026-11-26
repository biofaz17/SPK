import type { ApiRequest, ApiResponse } from './_lib/http';
import { createHash, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isAllowedAdminOrigin } from './_lib/adminAuth.ts';
import { consumeRateLimit, createSecurityClient, type ServerSecurityConfig, type ServerSecurityEnvironment } from './_lib/serverSecurity.ts';

export interface ExplorerAuthEnvironment extends ServerSecurityEnvironment {
  VITE_SUPABASE_ANON_KEY?: string;
}

type Profile = { auth_user_id: string | null };
type AuthFailure = { code?: string; status?: number };
type ProfileMetadata =
  | { action: 'migrate'; id: string }
  | { action: 'register'; id: string; name: string; parent_email: string; age: number };

const credentialsMessage = 'Nome ou senha incorretos.';
const duplicateMessage = 'Este nome de explorador já existe!';
const unavailableMessage = 'O serviço de contas está indisponível. Tente novamente em instantes.';
const rateLimitMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
const serverAuth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const attemptWindowSeconds = 10 * 60;

class RequestError extends Error {
  readonly status: number;
  readonly retryAfter?: number;

  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function countAttempt(env: ServerSecurityConfig, scope: string, key: string, limit: number) {
  const decision = await consumeRateLimit(env, scope, key, limit, attemptWindowSeconds);
  if (!decision.allowed) {
    throw new RequestError(429, rateLimitMessage, decision.retryAfter);
  }
}

function upstreamError(operation: string, error?: AuthFailure | null) {
  if (error?.status === 429) return new RequestError(429, rateLimitMessage);
  console.error('[explorer-auth]', { operation, code: error?.code, status: error?.status });
  return new RequestError(503, unavailableMessage);
}

async function findProfile(admin: SupabaseClient, id: string): Promise<Profile | null> {
  const { data, error } = await admin.from('profiles').select('auth_user_id').eq('id', id).maybeSingle();
  if (error) throw upstreamError('find_profile', error);
  return data;
}

function legacyAuthPassword(id: string, password: string) {
  // Keep the existing password usable even when it falls outside Auth's password length limits.
  const digest = createHash('sha256').update('sparky-explorer-password:v1\0').update(id).update('\0').update(password);
  return `Sparky1!${digest.digest('base64url')}`;
}

async function signIn(auth: SupabaseClient, userId: string, email: string, password: string) {
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error?.code === 'invalid_credentials' || error?.code === 'user_banned') {
    throw new RequestError(401, credentialsMessage);
  }
  if (error?.code === 'email_not_confirmed') {
    throw new RequestError(403, 'Confirme seu e-mail de acesso antes de entrar.');
  }
  if (error || !data.session || data.user?.id !== userId) throw upstreamError('sign_in', error);
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
}

async function signInLinked(admin: SupabaseClient, auth: SupabaseClient, id: string, userId: string, password: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) throw upstreamError('find_auth_user', error);
  const metadata = data.user.app_metadata.sparky_profile;
  if (metadata?.action === 'migrate' && metadata.id === id) {
    password = legacyAuthPassword(id, password);
  }
  return signIn(auth, userId, data.user.email, password);
}

async function createAuthUser(admin: SupabaseClient, profile: ProfileMetadata, password: string) {
  const { data, error } = await admin.rpc('sparky_auth_ready');
  if (error || data !== true) throw upstreamError('check_auth_schema', error);

  const email = `explorer-${randomUUID()}@sparky.invalid`;
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { sparky_profile: profile },
  });
  return { ...result, email };
}

async function register(
  admin: SupabaseClient,
  auth: SupabaseClient,
  profile: Extract<ProfileMetadata, { action: 'register' }>,
  password: string,
) {
  if (await findProfile(admin, profile.id)) throw new RequestError(409, duplicateMessage);
  const { data, error, email } = await createAuthUser(admin, profile, password);
  if (error?.code === 'weak_password') {
    throw new RequestError(400, 'Escolha uma senha mais forte com letras, números e símbolos.');
  }
  if (error || !data.user) {
    if (await findProfile(admin, profile.id)) throw new RequestError(409, duplicateMessage);
    throw upstreamError('create_user', error);
  }
  return signIn(auth, data.user.id, email, password);
}

async function login(admin: SupabaseClient, auth: SupabaseClient, id: string, password: string, env: ServerSecurityConfig) {
  const profile = await findProfile(admin, id);
  if (profile?.auth_user_id) return signInLinked(admin, auth, id, profile.auth_user_id, password);
  if (!profile) throw new RequestError(401, credentialsMessage);

  await countAttempt(env, 'explorer-legacy', id, 10);
  const derivedPassword = legacyAuthPassword(id, password);
  const { data: verified, error: verificationError } = await admin.rpc('sparky_verify_legacy_password', {
    profile_id: id,
    derived_password: derivedPassword,
  });
  if (verificationError) throw upstreamError('verify_legacy_password', verificationError);
  if (verified !== true) {
    // A concurrent login can finish the migration while verification waits for the profile lock.
    const linked = await findProfile(admin, id);
    if (linked?.auth_user_id) return signInLinked(admin, auth, id, linked.auth_user_id, password);
    throw new RequestError(401, credentialsMessage);
  }
  const { data, error, email } = await createAuthUser(admin, { action: 'migrate', id }, derivedPassword);
  if (error || !data.user) {
    const linked = await findProfile(admin, id);
    if (linked?.auth_user_id) return signInLinked(admin, auth, id, linked.auth_user_id, password);
    throw upstreamError('migrate_user', error);
  }
  return signIn(auth, data.user.id, email, derivedPassword);
}

export default async function handler(req: ApiRequest, res: ApiResponse, env?: ExplorerAuthEnvironment) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!isAllowedAdminOrigin(origin, host)) return res.status(403).json({ error: 'Origem não permitida.' });

  try {
    if (Number(req.headers['content-length']) > 4096) throw new RequestError(413, 'Dados de acesso muito longos.');
    const contentType = req.headers['content-type']?.toString().split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'application/json') throw new RequestError(415, 'Envie os dados de acesso em JSON.');
    const body = req.body as Record<string, unknown> | undefined;
    const { action, password } = body ?? {};
    if (action !== 'login' && action !== 'register') throw new RequestError(400, 'Operação de acesso inválida.');
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 256 || name.includes('\0') || typeof password !== 'string' || !password || password.length > 1024) {
      throw new RequestError(400, 'Digite o nome de explorador e a senha.');
    }
    const id = name.toLowerCase().replace(/\s/g, '_');
    let registration: Extract<ProfileMetadata, { action: 'register' }> | undefined;
    if (action === 'register') {
      if (name.length < 3 || id.length > 32 || !/^[\p{L}\p{M}\p{N}_ -]+$/u.test(name)) {
        throw new RequestError(400, 'Use de 3 a 32 caracteres no nome, com letras, números, espaços, hífen ou sublinhado.');
      }
      if (password.length < 6) {
        throw new RequestError(400, 'Crie uma senha de pelo menos 6 caracteres.');
      }
      if (Buffer.byteLength(password, 'utf8') > 72 || password.includes('\0')) {
        throw new RequestError(400, 'Escolha uma senha mais curta, sem caracteres de controle.');
      }
      const parentEmail = typeof body?.parentEmail === 'string' ? body.parentEmail.trim() : '';
      if (parentEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail) || parentEmail.includes('\0')) {
        throw new RequestError(400, 'Digite um e-mail válido do responsável.');
      }
      const age = body?.age;
      if (typeof age !== 'number' || !Number.isInteger(age) || age < 5 || age > 15) {
        throw new RequestError(400, 'Digite uma idade entre 5 e 15 anos.');
      }
      registration = { action, id, name, parent_email: parentEmail, age };
    }

    const config = env ?? process.env;
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY } = config;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VITE_SUPABASE_ANON_KEY) {
      throw new RequestError(503, 'O serviço de contas do Supabase ainda não está configurado.');
    }

    const address = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
    await countAttempt(config, `explorer-${action}`, address, action === 'register' ? 10 : 30);
    const admin = createSecurityClient(config);
    const auth = createClient(SUPABASE_URL, VITE_SUPABASE_ANON_KEY, { auth: serverAuth });
    const tokens = registration
      ? await register(admin, auth, registration, password)
      : await login(admin, auth, id, password, config);
    return res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.retryAfter !== undefined) res.setHeader('Retry-After', String(error.retryAfter));
      return res.status(error.status).json({ error: error.message });
    }
    const unavailable = upstreamError('unexpected_failure');
    return res.status(unavailable.status).json({ error: unavailable.message });
  }
}
