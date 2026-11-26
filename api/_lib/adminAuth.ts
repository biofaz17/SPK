import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createSecurityClient, type ServerSecurityEnvironment } from './serverSecurity.ts';

const TOKEN_TTL_SECONDS = 60 * 60;

export interface AdminAuthEnvironment extends ServerSecurityEnvironment {
  ADMIN_PASSWORD?: string;
  ADMIN_TOKEN_SECRET?: string;
}

type AdminSession = { sid: string; exp: number };
type AdminAuthConfig = AdminAuthEnvironment | NodeJS.ProcessEnv;
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function sanitizeText(value: unknown, maxLength = 128): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > maxLength) return null;
  return clean.replace(/[<>]/g, '');
}

export function isAllowedAdminOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true;

  const allowedHosts = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ]);

  try {
    const normalizedOrigin = new URL(origin).origin;
    if (host) {
      allowedHosts.add(`http://${host}`);
      allowedHosts.add(`https://${host}`);
    }
    return allowedHosts.has(normalizedOrigin);
  } catch {
    return false;
  }
}

export function maskIpAddress(ip: unknown): string {
  if (typeof ip !== 'string') return 'IP Oculto';
  const normalized = ip.trim();
  if (!normalized) return 'IP Oculto';

  const ipv4 = normalized.split('.');
  if (ipv4.length === 4) {
    const [first, second, third] = ipv4;
    if ([first, second, third].every(part => /^\d{1,3}$/.test(part))) {
      return `${first}.${second}.${third}.0`;
    }
  }

  if (normalized.includes(':')) return 'IPv6 mascarado';
  return 'IP Oculto';
}

export function sanitizeAdminProfile<T extends Record<string, any>>(profile: T): T {
  if (!profile || typeof profile !== 'object') return profile;

  const { password, legacy_password_verifier, pass, email, parent_email, cpf, ...rest } = profile as Record<string, any>;
  const sanitized: Record<string, any> = { ...rest };

  if (profile.terms_log && typeof profile.terms_log === 'object') {
    sanitized.terms_log = {
      ...(profile.terms_log as Record<string, any>),
      ip: maskIpAddress((profile.terms_log as Record<string, any>).ip),
    };
  }

  return sanitized as T;
}

export function createAdminToken(password: unknown, env: AdminAuthConfig = process.env): string | null {
  const configuredPassword = env.ADMIN_PASSWORD?.trim();
  const secret = env.ADMIN_TOKEN_SECRET;
  if (!configuredPassword || !secret || secret.length < 32 || typeof password !== 'string') return null;

  const cleanPassword = password.trim();
  if (!cleanPassword || cleanPassword.length > 128) return null;

  const submittedHash = createHmac('sha256', secret).update(cleanPassword).digest();
  const configuredHash = createHmac('sha256', secret).update(configuredPassword).digest();
  if (!timingSafeEqual(submittedHash, configuredHash)) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const sessionId = randomUUID();
  const payload = Buffer.from(JSON.stringify({
    type: 'admin',
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
    sid: sessionId,
  })).toString('base64url');

  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSignedSession(token: string | undefined, env: AdminAuthConfig): AdminSession | null {
  const secret = env.ADMIN_TOKEN_SECRET;
  if (!secret || secret.length < 32 || !token || token.length > 512) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded?.type !== 'admin' || typeof decoded.sid !== 'string' || !sessionIdPattern.test(decoded.sid)
      || !Number.isInteger(decoded.exp) || !Number.isInteger(decoded.iat)
      || decoded.exp <= now || decoded.iat > now || decoded.exp - decoded.iat !== TOKEN_TTL_SECONDS) {
      return null;
    }
    return { sid: decoded.sid, exp: decoded.exp };
  } catch {
    return null;
  }
}

export function readAdminBearer(authorization: string | string[] | undefined): string | undefined {
  return typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim() : undefined;
}

export async function registerAdminSession(token: string, env: AdminAuthConfig) {
  const session = readSignedSession(token, env);
  if (!session) throw new Error('Invalid administrative session');
  const { data, error } = await createSecurityClient(env).rpc('sparky_create_admin_session', {
    session_id: session.sid,
    expires_epoch: session.exp,
  });
  if (error || data !== true) throw new Error('Unable to register administrative session');
}

export async function hasActiveAdminSession(token: string | undefined, env: AdminAuthConfig = process.env) {
  const session = readSignedSession(token, env);
  if (!session) return false;
  const { data, error } = await createSecurityClient(env).rpc('sparky_admin_session_active', { session_id: session.sid });
  if (error || typeof data !== 'boolean') throw new Error('Unable to check administrative session');
  return data;
}

export async function revokeAdminSession(token: string, env: AdminAuthConfig = process.env) {
  const session = readSignedSession(token, env);
  if (!session) return;
  const { data, error } = await createSecurityClient(env).rpc('sparky_revoke_admin_session', { session_id: session.sid });
  if (error || data !== true) throw new Error('Unable to revoke administrative session');
}
