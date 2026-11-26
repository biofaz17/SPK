import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago';

export function readSignedPaymentId(resourceId: unknown, signature: unknown, requestId: unknown, secret: string) {
  if (typeof resourceId !== 'string' || !/^[a-z\d]{1,32}$/i.test(resourceId)
    || typeof signature !== 'string' || signature.length > 1024
    || typeof requestId !== 'string' || !/^[^\s,;]{1,128}$/.test(requestId)) {
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
