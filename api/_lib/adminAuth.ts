import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const TOKEN_TTL_SECONDS = 60 * 60;

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

  const { password, pass, email, parent_email, cpf, ...rest } = profile as Record<string, any>;
  const sanitized: Record<string, any> = { ...rest };

  if (profile.terms_log && typeof profile.terms_log === 'object') {
    sanitized.terms_log = {
      ...(profile.terms_log as Record<string, any>),
      ip: maskIpAddress((profile.terms_log as Record<string, any>).ip),
    };
  }

  return sanitized as T;
}

export function createAdminToken(password: unknown): string | null {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!configuredPassword || !secret || secret.length < 32 || typeof password !== 'string') return null;

  const cleanPassword = password.trim();
  if (!cleanPassword || cleanPassword.length > 128) return null;

  const submittedHash = createHmac('sha256', secret).update(cleanPassword).digest();
  const configuredHash = createHmac('sha256', secret).update(configuredPassword).digest();
  if (!timingSafeEqual(submittedHash, configuredHash)) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const sessionId = randomBytes(16).toString('hex');
  const payload = Buffer.from(JSON.stringify({
    type: 'admin',
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
    sid: sessionId,
  })).toString('base64url');

  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isAdminTokenValid(token: string | undefined): boolean {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || secret.length < 32 || !token) return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;

  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const validType = decoded.type === 'admin';
    const validExp = typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
    const validIat = typeof decoded.iat === 'number' && decoded.iat <= Math.floor(Date.now() / 1000);
    return validType && validExp && validIat;
  } catch {
    return false;
  }
}