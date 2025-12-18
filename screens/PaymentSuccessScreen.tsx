
import React, { useEffect } from 'react';
import { Button } from '../components/Button';
import { CheckCircle, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentSuccessScreenProps {
  onContinue: () => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onContinue }) => {
  
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#3b82f6']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
      <div className="text-center max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl border-4 border-green-100">
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>

        <h1 className="text-3xl font-heading text-slate-800 mb-2">Pagamento Confirmado!</h1>
        <p className="text-slate-500 font-bold mb-8">
          Parabéns! O plano foi ativado e novos mundos foram desbloqueados.
        </p>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-8 text-left">
           <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] uppercase mb-2">
              <ShieldCheck size={14} /> Passo Final de Segurança
           </div>
           <p className="text-xs text-indigo-900 leading-tight">
              Para liberar o acesso da criança, precisamos que você aceite o <strong>Termo de Responsabilidade Parental</strong> na próxima tela.
           </p>
        </div>

        <Button onClick={onContinue} variant="primary" size="lg" className="w-full">
          Ir para os Termos <ArrowRight />
        </Button>

      </div>
    </div>
  );
};
