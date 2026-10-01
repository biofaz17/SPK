import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PaidTier } from './_lib/payment';

const prices: Record<PaidTier, number> = { STARTER: 19.99, PRO: 49.99 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, tier, payer } = req.body || {};
  if (typeof userId !== 'string' || userId.length < 1 || userId.length > 100 || typeof tier !== 'string' || !Object.hasOwn(prices, tier)) {
    return res.status(400).json({ error: 'Invalid checkout request' });
  }
  if (typeof payer?.name !== 'string' || typeof payer?.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.email)) {
    return res.status(400).json({ error: 'Invalid payer details' });
  }
  const cpf = typeof payer.identification?.number === 'string' ? payer.identification.number.replace(/\D/g, '') : '';
  if (!/^\d{11}$/.test(cpf)) return res.status(400).json({ error: 'Invalid payer identification' });

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const appUrl = (process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/$/, '');
  if (!accessToken || !appUrl) return res.status(503).json({ error: 'Checkout service is not configured' });

  const firstName = payer.name.trim().split(/\s+/)[0] || 'Responsável';
  const surname = payer.name.trim().split(/\s+/).slice(1).join(' ') || firstName;
  const externalReference = JSON.stringify({ userId, tier });
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: tier, title: `Sparky App - Plano ${tier} (Vitalício)`, quantity: 1, currency_id: 'BRL', unit_price: prices[tier as PaidTier] }],
      payer: { name: firstName, surname, email: payer.email, identification: { type: 'CPF', number: cpf } },
      external_reference: externalReference,
      notification_url: `${appUrl}/api/payment-webhook`,
      back_urls: {
        success: `${appUrl}/?payment_id={payment_id}&status=approved`,
        failure: `${appUrl}/?status=failure`,
        pending: `${appUrl}/?status=pending`,
      },
      auto_return: 'approved',
      statement_descriptor: 'SPARKY TI',
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 12 },
    }),
  });

  const result = await response.json();
  if (!response.ok || typeof result.init_point !== 'string') {
    return res.status(502).json({ error: 'Unable to create checkout preference' });
  }
  return res.status(200).json({ initPoint: result.init_point });
}