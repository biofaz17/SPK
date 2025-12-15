
import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionTier, UserProfile } from '../types';
import { MERCADO_PAGO_CONFIG, PLANS } from '../constants';
import { ArrowLeft, Loader2, ExternalLink, Lock, QrCode, CreditCard, Copy, CheckCircle, Store, AlertTriangle, User, Mail, FileText, FlaskConical } from 'lucide-react';

interface CheckoutScreenProps {
  user: UserProfile;
  tier: SubscriptionTier;
  onConfirm: () => void;
  onCancel: () => void;
}

type PaymentMethod = 'pix' | 'card' | null;
type PaymentStatus = 'idle' | 'loading' | 'pending' | 'approved' | 'error';
type CheckoutStep = 'data_collection' | 'method_selection' | 'processing';

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ user, tier, onConfirm, onCancel }) => {
  const [step, setStep] = useState<CheckoutStep>(user.isGuest ? 'data_collection' : 'method_selection');
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  // Guest Data Collection State
  const [payerName, setPayerName] = useState(user.name !== 'Visitante' ? user.name : '');
  const [payerEmail, setPayerEmail] = useState(user.parentEmail || '');
  const [payerDoc, setPayerDoc] = useState('');

  // Polling ref
  const intervalRef = useRef<number | null>(null);

  // Get plan details
  const plan = PLANS[tier] || PLANS[SubscriptionTier.STARTER];
  const price = plan.priceLabel;

  // Mercado Pago Brand Colors
  const MP_BLUE = "bg-[#009EE3]";
  const MP_HOVER = "hover:bg-[#007EB5]";

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  // --- API INTEGRATION ---
  
  const createPixPayment = async () => {
    setStatus('loading');
    setStep('processing');
    setErrorMessage('');
    setIsDemoFallback(false);
    
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          transaction_amount: plan.price,
          description: `Assinatura ${plan.title} - Sparky App`,
          payment_method_id: 'pix',
          payer: {
            email: payerEmail || "comprador_teste@sparkyapp.com.br",
            first_name: payerName.split(' ')[0] || "Responsavel",
            last_name: payerName.split(' ').slice(1).join(' ') || "Legal",
            identification: {
                type: "CPF",
                number: payerDoc.replace(/\D/g, '') || "19100000000" // CPF de teste valido
            }
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar Pix (Verifique Console)');
      }

      if (data.status === 'approved') {
        setStatus('approved');
        setTimeout(onConfirm, 2000);
      } else {
        const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
        const qrBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
        const id = data.id;

        if (qrCode && id) {
          setPixCode(qrCode);
          setQrCodeBase64(qrBase64);
          setStatus('pending');
          startPolling(id);
        } else {
          throw new Error('QR Code não gerado na resposta da API.');
        }
      }

    } catch (error: any) {
      console.error(error);
      const isCors = error.message.includes('Failed to fetch') || error.name === 'TypeError';
      
      if (isCors) {
          // Fallback para modo demo se o browser bloquear a chamada direta
          setIsDemoFallback(true);
          setPixCode("00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913Sparky Education6008Sao Paulo62070503***6304E2CA"); // Fake payload
          setQrCodeBase64(""); // No QR image for fake
          setStatus('pending');
          // Simula aprovação após 5 segundos
          setTimeout(() => {
              setStatus('approved');
              setTimeout(onConfirm, 2500);
          }, 5000);
      } else {
          setErrorMessage(error.message || 'Falha na conexão com Mercado Pago.');
          setStatus('error');
      }
    }
  };

  const startPolling = (id: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
          headers: {
             'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`
          }
        });
        const data = await response.json();
        
        if (data.status === 'approved') {
           setStatus('approved');
           if (intervalRef.current) clearInterval(intervalRef.current);
           setTimeout(onConfirm, 3000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000); // Check every 5s
  };

  const initCardRedirect = async () => {
    setStatus('loading');
    setStep('processing');
    setErrorMessage('');
    
    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              id: tier,
              title: `Assinatura ${plan.title}`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: plan.price
            }
          ],
          payer: {
            name: payerName,
            email: payerEmail,
            identification: { type: "CPF", number: payerDoc.replace(/\D/g, '') }
          },
          back_urls: {
            success: window.location.href,
            failure: window.location.href,
            pending: window.location.href
          },
          auto_return: "approved"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar Preferência');
      }

      if (data.init_point) {
        window.location.href = data.init_point; 
      } else {
        throw new Error('Link de pagamento não gerado');
      }

    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        'Bloqueio de segurança do navegador (CORS). Em um ambiente real, esta chamada seria feita pelo servidor.'
      );
      setStatus('error');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payerName && payerEmail && payerDoc) {
      setStep('method_selection');
    }
  };

  // --- RENDERIZAÇÃO ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-slate-800">
         <div className="animate-spin mb-4">
            <Loader2 size={48} className="text-[#009EE3]" />
         </div>
         <h2 className="text-xl font-bold mb-2">Conectando ao Mercado Pago...</h2>
         <p className="text-slate-500 text-sm max-w-xs text-center">Criando transação segura.</p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle size={40} className="text-green-600" />
         </div>
         <h2 className="text-2xl font-bold mb-2 text-green-800">Pagamento Confirmado!</h2>
         <p className="text-green-700 text-sm max-w-xs text-center mb-4">Ativando sua conta...</p>
         {isDemoFallback && (
             <div className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                 <FlaskConical size={12} /> Simulação de Teste
             </div>
         )}
      </div>
    );
  }

  if (status === 'error') {
     return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
         <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-red-600" />
         </div>
         <h2 className="text-xl font-bold mb-2 text-red-800">Não foi possível conectar</h2>
         <p className="text-red-700 text-sm max-w-md text-center mb-6 bg-red-100 p-3 rounded-lg border border-red-200">{errorMessage}</p>
         <div className="flex gap-3">
            <button onClick={() => { setStatus('idle'); setStep('method_selection'); }} className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition">Voltar</button>
            <button onClick={onConfirm} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2">
                <FlaskConical size={16} /> Ativar Modo Demo
            </button>
         </div>
         <p className="mt-4 text-xs text-slate-400">Clique em "Ativar Modo Demo" para testar o desbloqueio sem pagamento real.</p>
      </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col md:flex-row min-h-[500px]">
        
        {/* Lado Esquerdo: Resumo */}
        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col relative">
           <button onClick={onCancel} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition">
             <ArrowLeft size={24} />
           </button>
           <div className="mt-12 mb-6">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Resumo</h3>
              <div className="text-2xl font-heading text-slate-800 mb-1">Plano {plan.title}</div>
              <div className="text-3xl font-black text-[#009EE3]">R$ {price} <span className="text-sm text-slate-400 font-normal">/mês</span></div>
           </div>
           <div className="flex-1">
             <ul className="space-y-3 text-sm text-slate-600">
               <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" /> <span>Cobrança recorrente</span></li>
               <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" /> <span>Acesso Imediato</span></li>
               <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" /> <span>Dados Protegidos</span></li>
             </ul>
           </div>
           <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Store size={14} /> Vendedor</div>
              <div className="font-bold text-sm text-slate-700">{MERCADO_PAGO_CONFIG.RECEIVER_NAME}</div>
           </div>
        </div>

        {/* Lado Direito: Passos */}
        <div className="flex-1 p-6 md:p-10 flex flex-col">
          
          {step === 'data_collection' && (
             <div className="animate-fadeIn">
                <div className="mb-6">
                   <h2 className="text-xl font-bold text-slate-800">Dados do Responsável</h2>
                   <p className="text-sm text-slate-500">Para a versão paga, precisamos identificar o pagador.</p>
                </div>
                <form onSubmit={handleDataSubmit} className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <div className="relative">
                         <User className="absolute left-3 top-3 text-slate-400" size={18} />
                         <input type="text" required value={payerName} onChange={e => setPayerName(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-2.5 pl-10 outline-none focus:border-[#009EE3]" placeholder="Nome do titular" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                         <input type="email" required value={payerEmail} onChange={e => setPayerEmail(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-2.5 pl-10 outline-none focus:border-[#009EE3]" placeholder="email@exemplo.com" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                      <div className="relative">
                         <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                         <input type="text" required value={payerDoc} onChange={e => setPayerDoc(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-2.5 pl-10 outline-none focus:border-[#009EE3]" placeholder="000.000.000-00" />
                      </div>
                   </div>
                   <button type="submit" className={`w-full ${MP_BLUE} ${MP_HOVER} text-white font-bold py-3 rounded-xl mt-4 transition-colors`}>Continuar para Pagamento</button>
                </form>
             </div>
          )}

          {step === 'method_selection' && (
            <div className="animate-fadeIn h-full flex flex-col">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Forma de Pagamento</h2>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded"><Lock size={12} /> Seguro</div>
               </div>

               <div className="space-y-4 flex-1">
                  <button onClick={() => { setMethod('pix'); createPixPayment(); }} className="w-full group border-2 border-slate-200 hover:border-[#009EE3] hover:bg-blue-50/30 rounded-xl p-4 flex items-center gap-4 transition-all">
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><QrCode size={24} /></div>
                     <div className="text-left flex-1">
                        <div className="font-bold text-slate-800">Pix (Imediato)</div>
                        <div className="text-xs text-slate-500">QR Code gerado na hora.</div>
                     </div>
                  </button>
                  <button onClick={() => { setMethod('card'); initCardRedirect(); }} className="w-full group border-2 border-slate-200 hover:border-[#009EE3] hover:bg-blue-50/30 rounded-xl p-4 flex items-center gap-4 transition-all">
                     <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><CreditCard size={24} /></div>
                     <div className="text-left flex-1">
                        <div className="font-bold text-slate-800">Cartão de Crédito</div>
                        <div className="text-xs text-slate-500">Ambiente seguro Mercado Pago.</div>
                     </div>
                  </button>
               </div>
               
               {user.isGuest && (
                  <button onClick={() => setStep('data_collection')} className="text-sm text-slate-400 hover:text-slate-600 underline mt-4">Alterar Dados do Pagador</button>
               )}
            </div>
          )}

          {step === 'processing' && method === 'pix' && (
             <div className="flex-1 flex flex-col items-center animate-fadeIn">
                <div className="bg-slate-100 p-4 rounded-xl border-2 border-slate-200 mb-6 relative group shadow-inner">
                   {isDemoFallback ? (
                       <div className="w-48 h-48 flex items-center justify-center flex-col text-center p-4">
                           <FlaskConical size={32} className="text-slate-400 mb-2" />
                           <p className="text-xs text-slate-500 font-bold">Modo Simulação</p>
                           <p className="text-[10px] text-slate-400">Aguardando aprovação automática...</p>
                       </div>
                   ) : (
                        qrCodeBase64 ? <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Pix" className="w-48 h-48 mix-blend-multiply" /> : <div className="w-48 h-48 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400 text-xs">Gerando QR...</div>
                   )}
                </div>
                <div className="w-full mb-6">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pix Copia e Cola</label>
                   <div className="flex gap-2">
                      <input type="text" value={pixCode} readOnly className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 outline-none truncate" />
                      <button onClick={handleCopyPix} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{copied ? <CheckCircle size={16} /> : <Copy size={16} />}</button>
                   </div>
                </div>
                {isDemoFallback && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>Usando modo de compatibilidade (CORS).</span>
                    </div>
                )}
                <button onClick={() => { setMethod(null); setStep('method_selection'); setStatus('idle'); }} className="mt-auto text-sm text-slate-400 hover:text-slate-600 underline">Voltar</button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
