import type { VercelRequest, VercelResponse } from '@vercel/node';
import vercelConfig from './vercel.json' with { type: 'json' };
import type { PaymentEnvironment } from './api/_lib/payment';
import adminData from './api/admin-data';
import adminLogin from './api/admin-login';
import adminPaymentAction from './api/admin-payment-action';
import createCheckout from './api/create-checkout';
import gemini from './api/gemini';
import paymentConfirm from './api/payment-confirm';
import paymentWebhook from './api/payment-webhook';

interface WorkerEnv extends PaymentEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ENABLE_PRODUCTION_PAYMENTS?: string;
}

type ApiHandler = (request: VercelRequest, response: VercelResponse, env: WorkerEnv) => unknown;

const routes = new Map<string, { handler: ApiHandler; payment?: boolean }>([
  ['/api/admin-data', { handler: adminData }],
  ['/api/admin-login', { handler: adminLogin }],
  ['/api/admin-payment-action', { handler: adminPaymentAction, payment: true }],
  ['/api/create-checkout', { handler: createCheckout, payment: true }],
  ['/api/gemini', { handler: gemini }],
  ['/api/payment-confirm', { handler: paymentConfirm, payment: true }],
  ['/api/payment-webhook', { handler: paymentWebhook, payment: true }],
]);

const securityHeaders = vercelConfig.headers.flatMap(({ headers }) =>
  headers.map(({ key, value }): [string, string] => [key, value]),
);

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const headers = new Headers(securityHeaders);
    headers.set('Cache-Control', 'no-store');

    const route = routes.get(url.pathname);
    if (!route) return Response.json({ error: 'Not found' }, { status: 404, headers });
    const paymentsConfigured = env.ENABLE_PRODUCTION_PAYMENTS === 'true'
      && env.MP_ACCESS_TOKEN && env.APP_URL && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY;
    if (route.payment && !paymentsConfigured) {
      return Response.json({ error: 'Checkout service is not configured' }, { status: 503, headers });
    }

    let body: unknown;
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim();
    if (contentType === 'application/json' || contentType?.endsWith('+json')) {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : undefined;
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
      }
    }

    const requestHeaders = Object.fromEntries(request.headers);
    requestHeaders.host = url.host;
    // Use the address Cloudflare supplies for the existing API rate limits.
    requestHeaders['x-forwarded-for'] = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const apiRequest = {
      method: request.method,
      headers: requestHeaders,
      query: Object.fromEntries(url.searchParams),
      body,
    } as VercelRequest;

    let statusCode = 200;
    let response: Response | undefined;
    const apiResponse = {
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
    };

    try {
      await route.handler(apiRequest, apiResponse as VercelResponse, env);
      if (response) return response;
    } catch {
      // Preserve a JSON response when an upstream integration is unavailable.
    }
    return Response.json({ error: 'Internal server error' }, { status: 500, headers });
  },
};
