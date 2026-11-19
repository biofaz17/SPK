import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/Button';

export type PaymentStatus = 'checking' | 'pending' | 'rejected' | 'cancelled' | 'unavailable';

const messages: Record<PaymentStatus, { title: string; detail: string }> = {
  checking: {
    title: 'Consultando o pagamento',
    detail: 'Aguarde enquanto verificamos a situação no Mercado Pago.',
  },
  pending: {
    title: 'Pagamento pendente',
    detail: 'O Mercado Pago ainda está aguardando a confirmação. Se já pagou, consulte este pedido novamente em alguns instantes.',
  },
  rejected: {
    title: 'Pagamento rejeitado',
    detail: 'O Mercado Pago recusou a tentativa. Você pode voltar e iniciar um novo pagamento.',
  },
  cancelled: {
    title: 'Pagamento cancelado',
    detail: 'O checkout foi cancelado. Volte ao Sparky para tentar pagar novamente.',
  },
  unavailable: {
    title: 'Confirmação indisponível',
    detail: 'A consulta ao Mercado Pago falhou. Se já pagou, verifique este pedido novamente em alguns instantes.',
  },
};

interface PaymentStatusScreenProps {
  status: PaymentStatus;
  onContinue: () => void;
  onRetry?: () => void;
}

export function PaymentStatusScreen({ status, onContinue, onRetry }: PaymentStatusScreenProps) {
  const { title, detail } = messages[status];
  const canRetry = onRetry && (status === 'pending' || status === 'unavailable');

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div role="status">
          {status === 'checking' && <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={28} aria-hidden="true" />}
          <h1 className="font-heading text-2xl font-bold mb-3">{title}</h1>
          <p className="text-slate-600">{detail}</p>
        </div>
        {status !== 'checking' && (
          <div className="mt-6 flex flex-col gap-3">
            {canRetry && <Button type="button" onClick={onRetry}>Verificar pagamento</Button>}
            <button type="button" onClick={onContinue} className="rounded-xl border border-slate-200 py-3 font-bold hover:bg-slate-50">
              Voltar para o Sparky
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
