import type { ApiRequest, ApiResponse } from './_lib/http';
import { MercadoPagoError } from 'mercadopago';
import {
  confirmApprovedOrder, confirmApprovedPayment, isMercadoPagoOrderId, isMercadoPagoPaymentId,
  logPaymentFailure, type PaymentEnvironment,
} from './_lib/payment.ts';
import { getAuthenticatedProfile } from './_lib/profileSession.ts';
import { consumeRateLimit } from './_lib/serverSecurity.ts';

const noApprovedPayment = 'Payment is not approved for this account';

export default async function handler(req: ApiRequest, res: ApiResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { orderId, paymentId } = req.body || {};
  const orderRequested = orderId !== undefined;
  if (orderRequested ? !isMercadoPagoOrderId(orderId) || paymentId !== undefined
    : !isMercadoPagoPaymentId(paymentId)) {
    return res.status(400).json({ error: 'Invalid confirmation request' });
  }

  const paymentEnv = env ?? process.env;
  const profile = await getAuthenticatedProfile(req.headers.authorization, paymentEnv);
  if ('status' in profile) return res.status(profile.status).json({ error: profile.error });

  try {
    const quota = await consumeRateLimit(paymentEnv, 'payment-confirm-profile', profile.id, 30, 60);
    if (!quota.allowed) {
      res.setHeader('Retry-After', String(quota.retryAfter));
      return res.status(429).json({ error: 'Too many payment confirmation requests' });
    }
    const verification = orderRequested
      ? await confirmApprovedOrder(orderId, profile.id, env)
      : await confirmApprovedPayment(paymentId, profile.id, env);
    if (verification?.status !== 'approved') {
      return res.status(409).json({ error: noApprovedPayment, ...verification });
    }
    return res.status(200).json(verification);
  } catch (error) {
    if (error instanceof MercadoPagoError && error.status === 404) return res.status(409).json({ error: noApprovedPayment });
    logPaymentFailure('confirm_payment', error);
    return res.status(502).json({ error: 'Unable to confirm payment' });
  }
}
