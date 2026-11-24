import { Order } from 'mercadopago';
import { createMercadoPagoConfig, isMercadoPagoOrderId, logPaymentFailure } from '../api/_lib/payment';
import { readSignedPaymentId } from '../api/_lib/paymentWebhookSignature';

interface SandboxEnv {
  MP_ACCESS_TOKEN?: string;
  MP_WEBHOOK_SECRET?: string;
}

function signatureError(code: string) {
  console.warn(JSON.stringify({ event: 'mercado_pago_sandbox_signature_failed', code }));
  return Response.json({ error: 'Invalid payment notification signature', code }, { status: 401 });
}

export default {
  async fetch(request: Request, env: SandboxEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/payment-webhook') return Response.json({ error: 'Not found' }, { status: 404 });
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
    }

    const accessToken = env.MP_ACCESS_TOKEN?.trim();
    const secret = env.MP_WEBHOOK_SECRET?.trim();
    if (!accessToken || !secret) return Response.json({ error: 'Sandbox is not configured' }, { status: 503 });

    try {
      const ids = url.searchParams.getAll('data.id');
      if (ids.length !== 1 || !/^[a-z\d]+$/i.test(ids[0])) return signatureError('INVALID_QUERY_DATA_ID');
      const signature = request.headers.get('x-signature');
      const requestId = request.headers.get('x-request-id');
      if (!signature || !requestId) return signatureError('MISSING_SIGNATURE_HEADERS');
      const signedId = readSignedPaymentId(ids[0], signature, requestId, secret);
      if (!signedId) return signatureError('SIGNATURE_VERIFICATION_FAILED');

      const id = signedId.toUpperCase();
      if (!id.startsWith('ORDTST') || !isMercadoPagoOrderId(id)) {
        return Response.json({ error: 'A sandbox order ID is required' }, { status: 400 });
      }

      const order = await new Order(createMercadoPagoConfig(accessToken)).get({ id });
      if (order.id !== id) throw new Error('Unexpected sandbox order');
      console.log(JSON.stringify({ event: 'mercado_pago_sandbox_notification', orderId: id, status: order.status }));
      return Response.json({ received: true });
    } catch (error) {
      logPaymentFailure('verify_sandbox_notification', error);
      return Response.json({ error: 'Unable to verify sandbox order' }, { status: 502 });
    }
  },
};
