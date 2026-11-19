import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MercadoPagoError, Order } from 'mercadopago';
import { isAdminTokenValid, isAllowedAdminOrigin } from './_lib/adminAuth.ts';
import {
  createMercadoPagoConfig,
  isMercadoPagoOrderId,
  logPaymentFailure,
  paymentPrices,
  resolveOrderReference,
  type PaymentEnvironment,
} from './_lib/payment';

const idempotencyKeyPattern = /^[\x21-\x7e]{1,128}$/;
const paymentIdPattern = /^PAY[0-9A-HJKMNP-TV-Z]{26}$/;
const pendingOrProcessedRefunds = new Set(['processed', 'approved', 'processing', 'pending', 'in_process']);

type MercadoPagoOrder = Awaited<ReturnType<Order['get']>>;

function amountInCents(value: unknown): number | null {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fractional = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fractional.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

function refundablePayment(order: MercadoPagoOrder, transactionId?: string) {
  const candidates = order.transactions?.payments?.filter(payment =>
    typeof payment.id === 'string' && paymentIdPattern.test(payment.id)
    && (payment.status === 'processed' || payment.status === 'approved')
    && (amountInCents(payment.paid_amount) ?? 0) > 0
  ) ?? [];
  return transactionId
    ? candidates.find(payment => payment.id === transactionId)
    : candidates.length === 1 ? candidates[0] : undefined;
}

function availableRefundInCents(order: MercadoPagoOrder, payment: NonNullable<ReturnType<typeof refundablePayment>>): number {
  const recordedRefunds = order.transactions?.refunds?.reduce((sum, refund) => {
    const active = refund.transaction_id === payment.id && refund.status && pendingOrProcessedRefunds.has(refund.status);
    return active ? sum + (amountInCents(refund.amount) ?? 0) : sum;
  }, 0) ?? 0;
  const alreadyRefunded = Math.max(recordedRefunds, amountInCents(payment.refunded_amount) ?? 0);
  return (amountInCents(payment.paid_amount) ?? 0) - alreadyRefunded;
}

export default async function handler(req: VercelRequest, res: VercelResponse, env?: PaymentEnvironment) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!isAllowedAdminOrigin(origin, host)) return res.status(403).json({ error: 'Forbidden origin' });

  const authorization = req.headers.authorization;
  const adminToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : undefined;
  if (!isAdminTokenValid(adminToken)) return res.status(401).json({ error: 'Unauthorized' });

  const { action, orderId, amount, transactionId } = req.body ?? {};
  const idempotencyKey = req.headers['x-idempotency-key'];
  if ((action !== 'cancel' && action !== 'refund') || !isMercadoPagoOrderId(orderId)) {
    return res.status(400).json({ error: 'Invalid order action' });
  }
  if (typeof idempotencyKey !== 'string' || !idempotencyKeyPattern.test(idempotencyKey) || idempotencyKey.includes(',')) {
    return res.status(400).json({ error: 'A single X-Idempotency-Key of up to 128 characters is required' });
  }
  const partialRefund = action === 'refund' && amount !== undefined;
  const refundCents = partialRefund ? amountInCents(amount) : null;
  if ((action === 'cancel' && amount !== undefined) || (partialRefund && (refundCents === null || refundCents === 0))) {
    return res.status(400).json({ error: 'Invalid refund amount' });
  }
  if (transactionId !== undefined && (!partialRefund || typeof transactionId !== 'string' || !paymentIdPattern.test(transactionId))) {
    return res.status(400).json({ error: 'Invalid payment transaction ID' });
  }

  const { MP_ACCESS_TOKEN: accessToken, SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = env ?? process.env;
  if (!accessToken || !supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Order management is not configured' });
  }

  try {
    const client = new Order(createMercadoPagoConfig(accessToken));
    const order = await client.get({ id: orderId });
    if (order.id !== orderId || order.type !== 'online' || order.currency !== 'BRL') {
      return res.status(404).json({ error: 'Sparky order not found' });
    }
    const reference = await resolveOrderReference(order.external_reference, orderId, supabaseUrl, serviceRoleKey);
    const orderCents = amountInCents(order.total_amount);
    if (!reference || orderCents !== Math.round(paymentPrices[reference.tier] * 100)) {
      return res.status(404).json({ error: 'Sparky order not found' });
    }

    const requestOptions = { idempotencyKey };
    let updatedOrder: MercadoPagoOrder;
    if (action === 'cancel') {
      if (order.status !== 'created' || (amountInCents(order.total_paid_amount) ?? 0) > 0) {
        return res.status(409).json({ error: 'Only unpaid created orders can be canceled', status: order.status });
      }
      updatedOrder = await client.cancel({ id: orderId, requestOptions });
    } else {
      const paidCents = amountInCents(order.total_paid_amount);
      const validRefundStatus = order.status === 'processed'
        && (order.status_detail === 'accredited' || order.status_detail === 'partially_refunded');
      if (!validRefundStatus || !paidCents || paidCents > orderCents || (order.status_detail === 'accredited' && paidCents !== orderCents)) {
        return res.status(409).json({ error: 'Order is not eligible for a refund', status: order.status });
      }

      let body: { transactions: { id: string; amount: string }[] } | undefined;
      if (partialRefund && refundCents !== null) {
        const payment = refundablePayment(order, transactionId);
        if (!payment?.id) return res.status(409).json({ error: 'No matching refundable payment transaction' });
        if (refundCents > paidCents || refundCents > availableRefundInCents(order, payment)) {
          return res.status(409).json({ error: 'Amount exceeds the refundable balance' });
        }
        body = { transactions: [{ id: payment.id, amount: (refundCents / 100).toFixed(2) }] };
      }
      updatedOrder = await client.refund({ id: orderId, body, requestOptions });
    }

    if (updatedOrder.id !== orderId || typeof updatedOrder.status !== 'string') {
      throw new Error('Unexpected order action response');
    }
    return res.status(action === 'cancel' ? 200 : 201).json({
      orderId,
      status: updatedOrder.status,
      statusDetail: updatedOrder.status_detail,
    });
  } catch (error) {
    const status = error instanceof MercadoPagoError ? error.status : undefined;
    logPaymentFailure(action === 'cancel' ? 'cancel_order' : 'refund_order', error);
    if (status === 404) return res.status(404).json({ error: 'Sparky order or transaction not found' });
    if (status === 400 || status === 409 || status === 422) {
      return res.status(409).json({ error: 'Mercado Pago rejected the order action' });
    }
    return res.status(502).json({ error: 'Unable to complete order action' });
  }
}
