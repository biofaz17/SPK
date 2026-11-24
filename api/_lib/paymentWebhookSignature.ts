import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago';

export function readSignedPaymentId(resourceId: unknown, signature: unknown, requestId: unknown, secret: string) {
  if (typeof resourceId !== 'string' || !/^[a-z\d]+$/i.test(resourceId)
    || typeof signature !== 'string' || typeof requestId !== 'string' || !/^[^\s,;]+$/.test(requestId)) {
    return null;
  }

  // Checkout Pro Orders documents signing the ID as received. Other Mercado Pago flows lowercase it.
  for (const dataId of new Set([resourceId, resourceId.toLowerCase()])) {
    try {
      WebhookSignatureValidator.validate({ xSignature: signature, xRequestId: requestId, dataId, secret });
      return resourceId;
    } catch (error) {
      if (!(error instanceof InvalidWebhookSignatureError)) throw error;
    }
  }
  return null;
}
