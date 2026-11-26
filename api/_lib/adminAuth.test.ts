import test from 'node:test';
import assert from 'node:assert/strict';
import adminLoginHandler from '../admin-login.ts';
import adminLogoutHandler from '../admin-logout.ts';
import { createAdminToken, hasActiveAdminSession, sanitizeAdminProfile } from './adminAuth.ts';

const adminConfig = {
  ADMIN_PASSWORD: 'ExampleAdminPassword!123',
  ADMIN_TOKEN_SECRET: 'test-only-secret-not-used-in-production',
  SUPABASE_URL: 'https://supabase.example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-role',
};

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

test('createAdminToken rejects blank passwords and signs tokens for matching credentials', async () => {
  assert.equal(createAdminToken('   ', adminConfig), null);
  const token = createAdminToken(adminConfig.ADMIN_PASSWORD, adminConfig);
  assert.ok(token);
  assert.equal(typeof token, 'string');
  assert.equal(await hasActiveAdminSession('invalid-token', adminConfig), false);
  assert.equal(await hasActiveAdminSession(`${token.split('.')[0]}.tampered`, adminConfig), false);
});

function createRes() {
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
    json(payload: Record<string, unknown>) {
      this.body = payload;
      return payload;
    },
    body: undefined as Record<string, unknown> | undefined,
  } as any;
}

test('admin login respects a shared rate-limit denial', async (t) => {
  const decision = t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(new URL(String(input)).pathname, '/rest/v1/rpc/sparky_consume_rate_limit');
    const payload = JSON.parse(String(init?.body));
    assert.match(payload.bucket_key, /^[a-f0-9]{64}$/);
    assert.equal(payload.request_limit, 5);
    assert.equal(payload.window_seconds, 900);
    return Response.json({ allowed: false, retryAfter: 30 });
  });
  const response = createRes();
  await adminLoginHandler({
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.55' },
    body: { password: adminConfig.ADMIN_PASSWORD },
  } as any, response, adminConfig);
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers['Retry-After'], '30');
  assert.equal(decision.mock.callCount(), 1);
});

test('admin sessions require registration and disappear after logout', async (t) => {
  const sessions = new Set<string>();
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const operation = new URL(String(input)).pathname.split('/').at(-1);
    const { session_id } = JSON.parse(String(init?.body));
    switch (operation) {
      case 'sparky_consume_rate_limit': return Response.json({ allowed: true, retryAfter: 900 });
      case 'sparky_create_admin_session':
        sessions.add(session_id);
        return Response.json(true);
      case 'sparky_admin_session_active': return Response.json(sessions.has(session_id));
      case 'sparky_revoke_admin_session':
        sessions.delete(session_id);
        return Response.json(true);
      default: throw new Error(`Unexpected mocked operation ${operation}`);
    }
  });
  const unregistered = createAdminToken(adminConfig.ADMIN_PASSWORD, adminConfig);
  assert.ok(unregistered);
  assert.equal(await hasActiveAdminSession(unregistered, adminConfig), false);

  const response = createRes();
  await adminLoginHandler({ method: 'POST', headers: {}, body: { password: adminConfig.ADMIN_PASSWORD } } as any, response, adminConfig);
  assert.equal(response.statusCode, 200);
  const token = response.body?.token;
  assert.equal(typeof token, 'string');
  assert.equal(await hasActiveAdminSession(token, adminConfig), true);

  const logout = createRes();
  await adminLogoutHandler({ method: 'POST', headers: { authorization: `Bearer ${token}` } } as any, logout, adminConfig);
  assert.equal(logout.statusCode, 200);
  assert.equal(await hasActiveAdminSession(token, adminConfig), false);
});
