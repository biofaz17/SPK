import test from 'node:test';
import assert from 'node:assert/strict';
import adminLoginHandler from '../admin-login.ts';
import { createAdminToken, isAdminTokenValid, sanitizeAdminProfile } from './adminAuth.ts';

test('sanitizeAdminProfile removes secrets and masks IP addresses', () => {
  const profile = {
    id: 'user-123',
    name: 'Ana',
    password: 'senha-secreta',
    email: 'ana@example.com',
    subscription: 'PRO',
    last_active: Date.now(),
    terms_log: { ip: '203.0.113.42', country: 'BR' },
    progress: { stars: 12 },
  };

  const sanitized = sanitizeAdminProfile(profile as any);

  assert.equal(sanitized.password, undefined);
  assert.equal(sanitized.email, undefined);
  assert.equal(sanitized.terms_log.ip, '203.0.113.0');
  assert.equal(sanitized.progress.stars, 12);
});

test('createAdminToken rejects blank passwords and returns valid tokens for matching credentials', () => {
  process.env.ADMIN_PASSWORD = 'StrongPassword!123';
  process.env.ADMIN_TOKEN_SECRET = '1234567890123456789012345678901234567890';

  assert.equal(createAdminToken('   '), null);

  const token = createAdminToken('StrongPassword!123');
  assert.ok(token);
  assert.equal(typeof token, 'string');
  assert.equal(isAdminTokenValid(token), true);
  assert.equal(isAdminTokenValid('invalid-token'), false);
  assert.equal(isAdminTokenValid(`${token.split('.')[0]}.tampered`), false);
});

test('admin login blocks brute force after repeated invalid attempts', async () => {
  process.env.ADMIN_PASSWORD = 'StrongPassword!123';
  process.env.ADMIN_TOKEN_SECRET = '1234567890123456789012345678901234567890';

  const createRes = () => {
    const headers: Record<string, string> = {};
    return {
      headers,
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: Record<string, any>) {
        this.body = payload;
        return payload;
      },
      body: undefined as any,
    } as any;
  };

  const reqBase = {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.55' },
    body: { password: 'wrong-password' },
  } as any;

  for (let i = 0; i < 5; i += 1) {
    const res = createRes();
    adminLoginHandler(reqBase, res);
    if (i < 4) {
      assert.equal(res.statusCode, 401);
    }
  }

  const blocked = createRes();
  adminLoginHandler(reqBase, blocked);
  assert.equal(blocked.statusCode, 429);
});
