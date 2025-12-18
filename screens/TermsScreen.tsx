
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, ScrollText } from 'lucide-react';
import { dataService } from '../services/DataService';
import { audioService } from '../services/AudioService';

interface TermsScreenProps {
  userId: string;
  onAccept: (version: string, timestamp: string) => void;
  onReject: () => void;
}

const TERMS_VERSION = "v1.0";

export const TermsScreen: React.FC<TermsScreenProps> = ({ userId, onAccept, onReject }) => {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Se chegou a 95% do scroll, libera
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasReadToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!isChecked || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { timestamp } = await dataService.acceptTerms(userId, TERMS_VERSION);
      audioService.playSfx('success');
      onAccept(TERMS_VERSION, timestamp);
    } catch (e) {
      alert("Erro ao registrar aceite. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-indigo-100 flex flex-col h-[90vh]">
        
        {/* Header Jurídico */}
        <div className="bg-indigo-600 p-6 text-white flex items-center gap-4 shrink-0">
           <div className="bg-white/20 p-3 rounded-2xl">
              <ShieldCheck size={32} />
           </div>
           <div>
              <h1 className="font-heading text-xl md:text-2xl leading-tight">Termos e Consentimento</h1>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Acesso de Responsável Legal • Versão {TERMS_VERSION}</p>
           </div>
        </div>

        {/* Corpo do Contrato (Scrollable) */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 md:p-12 text-sm leading-relaxed text-slate-600 prose prose-slate max-w-none no-scrollbar"
        >
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-xl flex gap-3 items-start">
             <AlertTriangle className="text-amber-500 shrink-0" size={20} />
             <p className="text-amber-800 text-xs font-bold m-0">
                Este é um modelo sólido para uso inicial. Recomendamos revisão por advogado para escala nacional. 
                Ao aceitar, você protege legalmente a operação deste app.
             </p>
          </div>

          <h2 className="text-indigo-900 font-heading text-2xl mb-6">TERMO DE USO, RESPONSABILIDADE E CONSENTIMENTO PARENTAL</h2>
          <p className="font-bold text-slate-800">Plataforma Educacional “Sparky”</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">1. IDENTIFICAÇÃO DA PLATAFORMA</h3>
          <p>Este Termo regula o uso da plataforma educacional digital <strong>SPARKY</strong>, doravante denominada “Plataforma”, voltada ao ensino lúdico de programação e pensamento computacional para crianças. A Plataforma é operada pelo responsável legal do projeto, doravante denominado “Operador”.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">2. ACEITE OBRIGATÓRIO</h3>
          <p>Ao clicar em “ACEITO”, o responsável legal declara que:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>É maior de 18 anos;</li>
            <li>É pai, mãe ou responsável legal pela criança usuária;</li>
            <li>Leu, compreendeu e concorda integralmente com este Termo.</li>
          </ul>
          <p>Caso clique em “REJEITO”, o acesso da criança à Plataforma será automaticamente bloqueado, sem prejuízo do direito de reembolso conforme política vigente.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">3. OBJETO DO CONTRATO</h3>
          <p>A Plataforma tem como finalidade o ensino de programação de forma lúdica, desenvolvimento de raciocínio lógico e estímulo à criatividade. A Plataforma não substitui o acompanhamento educacional formal nem a supervisão parental.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">4. CONTA E RESPONSABILIDADE</h3>
          <p>O responsável concorda que o acesso da criança será feito por credenciais vinculadas ao responsável, sendo sua obrigação orientar a criança quanto ao uso adequado. O uso indevido pode resultar em suspensão da conta.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">5. PAGAMENTO E ACESSO</h3>
          <p>O pagamento concede licença de uso vitalícia ou conforme plano, não propriedade do software. O acesso é pessoal e intransferível.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">6. PROTEÇÃO DE DADOS (LGPD)</h3>
          <p>A Plataforma coleta e trata dados mínimos e necessários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Dados incluem apelido da criança, progresso e e-mail do responsável. Nenhum dado sensível é comercializado.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">7. CONTEÚDO GERADO</h3>
          <p>Projetos criados pela criança pertencem à própria criança. A Plataforma pode armazenar e exibir projetos apenas para fins educacionais.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">8. SEGURANÇA</h3>
          <p>Utilizamos medidas técnicas para segurança da informação, mas o responsável reconhece que nenhum sistema digital é 100% imune a riscos.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">9. USO INADEQUADO</h3>
          <p>É proibido tentar explorar falhas de segurança ou inserir conteúdos impróprios. O descumprimento gera bloqueio imediato.</p>

          <h3 className="text-indigo-800 font-bold mt-8 mb-3">10. RESCISÃO E FORO</h3>
          <p>Fica eleito o foro do domicílio do responsável legal para dirimir eventuais conflitos.</p>
          
          <div className="h-20 flex items-center justify-center border-t border-slate-100 mt-10 text-slate-400 italic">
             Fim do documento.
          </div>
        </div>

        {/* Footer com Ação */}
        <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200 shrink-0">
           <div className="flex flex-col gap-6">
              
              {/* Checkbox de Aceite */}
              <label className={`
                flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2
                ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-100'}
              `}>
                 <input 
                   type="checkbox" 
                   className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                   checked={isChecked}
                   onChange={() => setIsChecked(!isChecked)}
                 />
                 <span className="text-xs md:text-sm font-bold text-slate-700">
                    Li o Termo de Uso e declaro que sou o responsável legal pela criança.
                 </span>
              </label>

              <div className="flex flex-col md:flex-row gap-3">
                 <button 
                   onClick={onReject}
                   className="flex-1 py-3 text-slate-500 font-bold hover:text-red-500 transition"
                 >
                    REJEITO OS TERMOS
                 </button>
                 <Button 
                   onClick={handleAccept}
                   disabled={!isChecked || isSubmitting}
                   variant="primary" 
                   className="flex-[2] py-4 shadow-indigo-200"
                 >
                    {isSubmitting ? "REGISTRANDO..." : "CONCORDO E ACEITO"}
                 </Button>
              </div>

              {!hasReadToBottom && (
                <p className="text-[10px] text-center text-amber-600 font-black uppercase tracking-tighter animate-pulse">
                   Role o contrato até o final para habilitar o aceite.
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
