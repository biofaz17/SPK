
import React, { useState, useEffect } from 'react';
import { AppStats } from '../types';
import { 
    BarChart3, Users, DollarSign, Activity, ArrowLeft, 
    Download, Mail, Calendar, RefreshCcw, TrendingUp,
    CheckCircle, MessageSquare, ShieldAlert, Lock, X
} from 'lucide-react';
import { Button } from '../components/Button';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
        const statsStr = localStorage.getItem('sparky_admin_stats');
        if (statsStr) {
            try {
                setStats(JSON.parse(statsStr));
            } catch (e) {
                console.error("Failed to parse stats", e);
            }
        }
    }
  }, [isAuthenticated]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '853817') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Acesso negado. Verifique usuário e senha.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border-4 border-slate-700">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <Lock size={32} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-heading text-slate-800">Admin Login</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Acesso Restrito</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Usuário" 
                className="w-full p-3 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Senha" 
                className="w-full p-3 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
            <Button type="submit" variant="primary" className="w-full">Acessar Console</Button>
            <button type="button" onClick={onBack} className="w-full text-slate-400 text-xs font-bold py-2 hover:text-slate-600 transition underline">Sair</button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col gap-4 bg-slate-950">
         <RefreshCcw className="animate-spin text-indigo-500" size={48} />
         <p className="font-bold text-slate-400">Compilando dados métricos...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const revenueToday = stats.revenueByDate[today] || 0;
  const registersToday = stats.registrationsByDate[today] || 0;

  const generateReportText = () => {
    const report = `
Relatório Diário Sparky - ${new Date().toLocaleDateString('pt-BR')}
--------------------------------------------------
METRICAS GERAIS:
- Total de Usuários: ${stats.totalRegisters}
- Total de Logins: ${stats.totalLogins}
- Receita Bruta Total: R$ ${stats.totalRevenue.toFixed(2)}

METRICAS DE HOJE:
- Novos Cadastros: ${registersToday}
- Receita do Dia: R$ ${revenueToday.toFixed(2)}
- Usuários Ativos: ${stats.activeUsersToday}

TOP NÍVEIS:
${Object.entries(stats.mostPlayedLevels)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([id, qty]) => `- Nível ${id}: ${qty} plays`)
    .join('\n')}
--------------------------------------------------
    `;
    return report;
  };

  return (
    <div className="h-full w-full bg-slate-950 text-white font-sans flex flex-col overflow-hidden">
       {/* Header */}
       <header className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                   <BarChart3 className="text-indigo-400" /> Painel Admin & Financeiro
                </h1>
                <p className="text-xs text-slate-500">Monitoramento Realtime</p>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="secondary" size="sm" onClick={() => setShowReportPreview(true)}>
                <Mail size={16} /> Relatório
             </Button>
          </div>
       </header>

       {/* Content */}
       <main className="flex-1 overflow-y-auto scrollable-y p-6 space-y-8 pb-10">
          
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
             <StatCard 
                label="Faturamento Total" 
                value={`R$ ${String(stats.totalRevenue.toFixed(2))}`} 
                subValue={`+ R$ ${String(revenueToday.toFixed(2))} hoje`}
                icon={<DollarSign className="text-green-400" />} 
             />
             <StatCard 
                label="Total de Alunos" 
                value={String(stats.totalRegisters)} 
                subValue={`${String(registersToday)} novos hoje`}
                icon={<Users className="text-blue-400" />} 
             />
             <StatCard 
                label="Atividade" 
                value={String(stats.totalLogins)} 
                subValue={`${String(stats.activeUsersToday)} sessões hoje`}
                icon={<Activity className="text-orange-400" />} 
             />
             <StatCard 
                label="Status App" 
                value="ONLINE" 
                subValue="Todos os sistemas OK"
                icon={<CheckCircle className="text-green-500" />} 
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                   <TrendingUp className="text-indigo-400" /> Níveis Mais Populares
                </h3>
                <div className="space-y-3">
                    {Object.entries(stats.mostPlayedLevels).length === 0 ? (
                        <p className="text-slate-600 italic">Nenhum dado registrado.</p>
                    ) : (
                        Object.entries(stats.mostPlayedLevels)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([id, qty]) => (
                                <div key={id} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800/50">
                                    <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                                        {String(id)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold">Nível {String(id)}</div>
                                        <div className="text-xs text-slate-500">Engajamento</div>
                                    </div>
                                    <div className="text-indigo-400 font-black">{String(qty)} plays</div>
                                </div>
                            ))
                    )}
                </div>
             </div>

             <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                   <ShieldAlert className="text-red-400" /> Segurança
                </h3>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-800 rounded-xl">
                       <p className="text-xs text-slate-400">Acesso via: <span className="text-indigo-400">admin</span></p>
                       <p className="text-[10px] text-slate-500 mt-1 italic">IP monitorado pelo console Sparky TI.</p>
                   </div>
                   <button onClick={() => setIsAuthenticated(false)} className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl border border-red-500/20 font-bold hover:bg-red-500 hover:text-white transition">
                       Fazer Logout
                   </button>
                </div>
             </div>
          </div>
       </main>

       {/* Modal Relatorio */}
       {showReportPreview && (
           <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white text-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-popIn">
                   <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                       <h3 className="text-xl font-bold">Relatório Administrativo</h3>
                       <button onClick={() => setShowReportPreview(false)} className="p-2 bg-slate-800 rounded-full">
                           <X size={20} />
                       </button>
                   </div>
                   <div className="p-8">
                       <pre className="bg-slate-50 p-6 rounded-2xl text-[11px] font-mono text-slate-700 border border-slate-200 overflow-y-auto max-h-[40vh] whitespace-pre-wrap">
                           {generateReportText()}
                       </pre>
                       <div className="mt-8 flex gap-3">
                           <Button variant="primary" className="flex-1" onClick={() => { navigator.clipboard.writeText(generateReportText()); alert("Copiado!"); }}>
                               Copiar Relatório
                           </Button>
                           <Button variant="secondary" onClick={() => setShowReportPreview(false)}>Fechar</Button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon }: any) => (
  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg">
     <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700/50">{icon}</div>
     </div>
     <div className="text-2xl font-black mb-1">{value}</div>
     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
     <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit">{subValue}</div>
  </div>
);
