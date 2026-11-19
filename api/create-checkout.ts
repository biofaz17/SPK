import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { Order, Preference } from 'mercadopago';
import {
  createMercadoPagoConfig, isCheckoutAttemptId, isMercadoPagoOrderId, linkProviderOrder,
  logPaymentFailure, paymentPrices, reserveOrder, type PaidTier, type PaymentEnvironment,
} from './_lib/payment';

const statementDescriptor = 'TEKTOK TI';
const productCategory = 'services';
const productDescriptions: Record<PaidTier, string> = {
  STARTER: 'Acesso vitalício ao Mundo da Floresta do Sparky com 15 níveis e desafios de padrões e pintura.',
  PRO: 'Acesso vitalício ao Mundo Hacker, à Oficina de Algoritmos, ao Observatório do Sparky e ao modo criativo ilimitado.',
};

export default async function handler(req: VercelRequest, res: VercelResponse, env?: PaymentEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, tier, payer, checkoutAttemptId } = req.body || {};
  if (typeof userId !== 'string' || userId.length < 1 || userId.length > 100 || typeof tier !== 'string' || !Object.hasOwn(paymentPrices, tier)) {
    return res.status(400).json({ error: 'Invalid checkout request' });
  }
  if (typeof payer?.name !== 'string' || !payer.name.trim() || typeof payer?.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.email) || (payer.surname !== undefined && typeof payer.surname !== 'string')) {
    return res.status(400).json({ error: 'Invalid payer details' });
  }
  const cpf = typeof payer.identification?.number === 'string' ? payer.identification.number.replace(/\D/g, '') : '';
  if (!/^\d{11}$/.test(cpf)) return res.status(400).json({ error: 'Invalid payer identification' });
  const phoneNumber = typeof payer.phone === 'string' ? payer.phone.replace(/\D/g, '') : '';
  if (payer.phone !== undefined && !/^[1-9]\d{9,10}$/.test(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid payer phone' });
  }
  if (checkoutAttemptId !== undefined && !isCheckoutAttemptId(checkoutAttemptId)) {
    return res.status(400).json({ error: 'Invalid checkout attempt' });
  }

  const { MP_ACCESS_TOKEN: accessToken, MP_CHECKOUT_API, APP_URL, VERCEL_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env ?? process.env;
  const appUrl = (APP_URL || (VERCEL_URL ? `https://${VERCEL_URL}` : '')).replace(/\/$/, '');
  if (!accessToken || !appUrl) return res.status(503).json({ error: 'Checkout service is not configured' });

  const names = payer.name.trim().split(/\s+/);
  const hasSeparateSurname = typeof payer.surname === 'string';
  const firstName = hasSeparateSurname ? names.join(' ') : names[0];
  const lastName = hasSeparateSurname ? payer.surname.trim().replace(/\s+/g, ' ') : names.slice(1).join(' ');
  const plan = tier as PaidTier;
  const price = paymentPrices[plan];
  const payerDetails = {
    email: payer.email,
    identification: { type: 'CPF', number: cpf },
    ...(phoneNumber ? { phone: { area_code: phoneNumber.slice(0, 2), number: phoneNumber.slice(2) } } : {}),
  };
  const item = {
    title: `Sparky App - Plano ${plan} (Vitalício)`,
    description: productDescriptions[plan],
    quantity: 1,
    category_id: productCategory,
  };
  const returnUrls = {
    success: `${appUrl}/`,
    failure: `${appUrl}/?status=failure`,
    pending: `${appUrl}/?status=pending`,
  };
  const config = createMercadoPagoConfig(accessToken);
  let initPoint: string | undefined;
  try {
    if (MP_CHECKOUT_API === 'orders') {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(503).json({ error: 'Order storage is not configured' });
      }
      const reservation = await reserveOrder(
        userId, plan, checkoutAttemptId ?? randomUUID(), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      );
      if (!reservation) return res.status(409).json({ error: 'Checkout attempt conflicts with selected plan' });
      if (reservation.provider_order_id && reservation.checkout_url) {
        return res.status(200).json({ initPoint: reservation.checkout_url, orderId: reservation.provider_order_id });
      }

      const amount = price.toFixed(2);
      const order = await new Order(config).create({
        body: {
          type: 'online',
          processing_mode: 'manual',
          total_amount: amount,
          external_reference: reservation.reference,
          items: [{ ...item, external_code: plan, unit_price: amount }],
          payer: { ...payerDetails, first_name: firstName, ...(lastName ? { last_name: lastName } : {}) },
          config: {
            statement_descriptor: statementDescriptor,
            online: {
              success_url: returnUrls.success,
              failure_url: returnUrls.failure,
              pending_url: returnUrls.pending,
              auto_return: 'all',
              transaction_security: { validation: 'on_fraud_risk', liability_shift: 'required' },
            },
            payment_method: { not_allowed_types: ['ticket'], max_installments: 12 },
          },
        },
        requestOptions: { idempotencyKey: reservation.reference },
      });
      if (!isMercadoPagoOrderId(order.id) || !order.checkout_url) {
        throw new Error('Provider order is missing checkout details');
      }
      await linkProviderOrder(reservation.reference, order.id, order.checkout_url, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      return res.status(200).json({ initPoint: order.checkout_url, orderId: order.id });
    } else {
      const preference = await new Preference(config).create({
        body: {
          items: [{ ...item, id: plan, currency_id: 'BRL', unit_price: price }],
          payer: { ...payerDetails, name: firstName, ...(lastName ? { surname: lastName } : {}) },
          external_reference: JSON.stringify({ userId, tier: plan }),
          notification_url: `${appUrl}/api/payment-webhook`,
          back_urls: returnUrls,
          auto_return: 'approved',
          statement_descriptor: statementDescriptor,
          payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 12 },
        },
        requestOptions: checkoutAttemptId ? { idempotencyKey: checkoutAttemptId } : undefined,
      });
      initPoint = preference.init_point;
    }
  } catch (error) {
    logPaymentFailure('create_checkout', error);
    return res.status(502).json({ error: 'Unable to create checkout' });
  }
  if (!initPoint) return res.status(502).json({ error: 'Unable to create checkout' });
  return res.status(200).json({ initPoint });
}
