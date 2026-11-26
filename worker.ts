import type { ApiRequest, ApiResponse } from './api/_lib/http';
import vercelConfig from './vercel.json' with { type: 'json' };
import type { AdminAuthEnvironment } from './api/_lib/adminAuth';
import type { PaymentEnvironment } from './api/_lib/payment';
import adminData from './api/admin-data';
import adminLogin from './api/admin-login';
import adminLogout from './api/admin-logout';
import adminPaymentAction from './api/admin-payment-action';
import createCheckout from './api/create-checkout';
import explorerAuth, { type ExplorerAuthEnvironment } from './api/explorer-auth';
import gemini, { type GeminiEnvironment } from './api/gemini';
import paymentConfirm from './api/payment-confirm';
import paymentWebhook from './api/payment-webhook';
import { servePremiumCourse } from './api/_lib/premiumCourse';
import premiumLevels from './api/premium-levels';

interface WorkerEnv extends AdminAuthEnvironment, PaymentEnvironment, ExplorerAuthEnvironment, GeminiEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  PREMIUM_CONTENT?: { get(key: string): Promise<{ body: ReadableStream } | null> };
  ENABLE_PRODUCTION_PAYMENTS?: string;
}

type ApiHandler = (request: ApiRequest, response: ApiResponse, env: WorkerEnv) => unknown;

const routes = new Map<string, { handler: ApiHandler; payment?: boolean }>([
  ['/api/admin-data', { handler: adminData }],
  ['/api/admin-login', { handler: adminLogin }],
  ['/api/admin-logout', { handler: adminLogout }],
  ['/api/admin-payment-action', { handler: adminPaymentAction, payment: true }],
  ['/api/create-checkout', { handler: createCheckout, payment: true }],
  ['/api/explorer-auth', { handler: explorerAuth }],
  ['/api/gemini', { handler: gemini }],
  ['/api/payment-confirm', { handler: paymentConfirm, payment: true }],
  ['/api/payment-webhook', { handler: paymentWebhook, payment: true }],
  ['/api/premium-levels', { handler: premiumLevels }],
]);

const securityHeaders = vercelConfig.headers.flatMap(({ headers }) =>
  headers.map(({ key, value }): [string, string] => [key, value]),
);

const maxJsonBytes = 64 * 1024;

async function readJsonBody(request: Request): Promise<{ body: unknown } | { tooLarge: true }> {
  if (Number(request.headers.get('content-length')) > maxJsonBytes) return { tooLarge: true };
  if (!request.body) return { body: undefined };

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let content = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxJsonBytes) {
        await reader.cancel();
        return { tooLarge: true };
      }
      content += decoder.decode(value, { stream: true });
    }
    content += decoder.decode();
    return { body: content ? JSON.parse(content) : undefined };
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const headers = new Headers(securityHeaders);
    headers.set('Cache-Control', 'no-store');

    if (url.pathname === '/api/premium-course') {
      const response = await servePremiumCourse(request, env, async key => (await env.PREMIUM_CONTENT?.get(key))?.body ?? null);
      for (const [name, value] of response.headers) headers.set(name, value);
      return new Response(response.body, { status: response.status, headers });
    }

    const route = routes.get(url.pathname);
    if (!route) return Response.json({ error: 'Not found' }, { status: 404, headers });
    const paymentsConfigured = env.ENABLE_PRODUCTION_PAYMENTS === 'true'
      && env.MP_ACCESS_TOKEN && env.APP_URL && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY;
    if (route.payment && !paymentsConfigured) {
      return Response.json({ error: 'Checkout service is not configured' }, { status: 503, headers });
    }

    let body: unknown;
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (contentType === 'application/json' || contentType?.endsWith('+json')) {
      try {
        const result = await readJsonBody(request);
        if ('tooLarge' in result) return Response.json({ error: 'Request body too large' }, { status: 413, headers });
        body = result.body;
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
      }
    }

    const requestHeaders = Object.fromEntries(request.headers);
    requestHeaders.host = url.host;
    // Use the address Cloudflare supplies for the existing API rate limits.
    requestHeaders['x-forwarded-for'] = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const query: ApiRequest['query'] = Object.create(null);
    for (const [name, value] of url.searchParams) {
      const previous = query[name];
      if (Array.isArray(previous)) previous.push(value);
      else query[name] = previous === undefined ? value : [previous, value];
    }
    const apiRequest: ApiRequest = {
      method: request.method,
      headers: requestHeaders,
      query,
      body,
    };

    let statusCode = 200;
    let response: Response | undefined;
    const apiResponse: ApiResponse = {
      status(status: number) {
        statusCode = status;
        return apiResponse;
      },
      setHeader(name: string, value: string) {
        headers.set(name, value);
        return apiResponse;
      },
      json(data: unknown) {
        response = Response.json(data, { status: statusCode, headers });
      },
      end(data?: Uint8Array) {
        response = new Response(data ? new Uint8Array(data) : null, { status: statusCode, headers });
      },
    };

    try {
      await route.handler(apiRequest, apiResponse, env);
      if (response) return response;
    } catch {
      // Preserve a JSON response when an upstream integration is unavailable.
    }
    return Response.json({ error: 'Internal server error' }, { status: 500, headers });
  },
};
