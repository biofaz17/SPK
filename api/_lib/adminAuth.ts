import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

export function createAdminToken(password: unknown): string | null {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!configuredPassword || !secret || secret.length < 32 || typeof password !== 'string') return null;

  const submittedHash = createHmac('sha256', secret).update(password).digest();
  const configuredHash = createHmac('sha256', secret).update(configuredPassword).digest();
  if (!timingSafeEqual(submittedHash, configuredHash)) return null;

  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString('base64url');
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
    return typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}