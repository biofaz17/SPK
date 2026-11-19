
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { UserProfile, SubscriptionTier } from '../types';
import { User, LogIn, UserPlus, KeyRound, Mail, Loader2, Sparkles } from 'lucide-react';
import { SparkyLogo } from '../components/SparkyLogo';
import { audioService } from '../services/AudioService';
import { dataService } from '../services/DataService';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
  onAdminTrigger?: () => void;
  onBackFromCheckout?: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onAdminTrigger, onBackFromCheckout }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Lógica secreta para Admin
  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 5) {
      audioService.playSfx('success');
      onAdminTrigger?.();
      setLogoClicks(0);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await dataService.login(name, password);
      audioService.playSfx('success');
      onLogin(user);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao entrar.');
      audioService.playSfx('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');

    if (name.trim().length < 3) {
      setErrorMsg('Seu nome precisa ter pelo menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Crie uma senha de pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const newUser = await dataService.register({ name, password, parentEmail, age: Number(age) });
      audioService.playSfx('start');
      onLogin(newUser);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    audioService.playSfx('pop');
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substr(2, 9),
      name: 'Explorador',
      parentEmail: '',
      age: 7,
      subscription: SubscriptionTier.FREE,
      progress: { unlockedLevels: 1, stars: 0, creativeProjects: 0, totalBlocksUsed: 0, secretsFound: 0 },
      settings: { soundEnabled: true, musicEnabled: true },
      activeSkin: 'default',
      isGuest: true,
      lastActive: Date.now()
    };
    onLogin(guestUser);
  };

  return (
    <div className="min-h-screen bg-indigo-700 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-y-auto">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative overflow-hidden border-b-[12px] border-indigo-900">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>

        <div className="flex flex-col items-center mb-8">
           <div onClick={handleLogoClick} className="cursor-default active:scale-95 transition-transform">
             <SparkyLogo size="lg" />
           </div>
           <div className="bg-indigo-50 px-4 py-1 rounded-full mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-indigo-900 font-black text-[10px] uppercase tracking-widest">Plataforma Sparky Ativa</span>
           </div>
        </div>

        {onBackFromCheckout && (
          <p role="status" className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-center text-sm text-indigo-900">
            Entre ou crie uma conta para continuar a compra do plano selecionado.
          </p>
        )}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-8 border border-slate-200 shadow-inner">
            <button 
                disabled={isLoading}
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <LogIn size={18} /> ENTRAR
            </button>
            <button 
                disabled={isLoading}
                onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${authMode === 'register' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <UserPlus size={18} /> CRIAR CONTA
            </button>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Explorador</label>
            <div className="relative group">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
               <input 
                 type="text" autoComplete="username" value={name} onChange={e => setName(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-inner"
                 placeholder="Ex: Pedro123" required
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Secreta</label>
            <div className="relative group">
               <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
               <input 
                 type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                 value={password} onChange={e => setPassword(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-inner"
                 placeholder="Seu código de acesso" required
               />
            </div>
          </div>

          <AnimatePresence>
            {authMode === 'register' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 overflow-hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idade</label>
                        <input 
                            type="number" value={age} onChange={e => setAge(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-indigo-400 outline-none transition shadow-inner"
                            placeholder="Ex: 8" min="5" max="15" required
                        />
                    </div>
                    <div className="flex items-center justify-center pt-6 text-[10px] font-bold text-indigo-400 leading-tight">Personaliza seus desafios!</div>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email do Responsável</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                        <input 
                          type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition shadow-inner"
                          placeholder="Para salvar seu progresso" required
                        />
                      </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errorMsg && (
              <motion.div role="alert" initial={{ x: -10 }} animate={{ x: [10, -10, 10, 0] }} className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl border border-red-200 text-center">
                  {errorMsg}
              </motion.div>
          )}

          <div className="space-y-4">
            <Button variant="primary" size="lg" className={`w-full py-5 text-xl shadow-indigo-200 transition-all ${isLoading ? 'opacity-70 pointer-events-none' : ''}`} disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (authMode === 'login' ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA')}
            </Button>
            
            <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Ou</span>
            </div>

            <button 
                type="button"
                onClick={onBackFromCheckout ?? handleGuestLogin}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
            >
                {onBackFromCheckout ? 'Voltar sem comprar' : <><Sparkles size={18} className="text-yellow-400" /> JOGAR AGORA</>}
            </button>
          </div>
        </form>

        {logoClicks > 0 && (
          <div className="mt-4 flex justify-center gap-1 opacity-20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${i < logoClicks ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            ))}
          </div>
        )}

        <p className="mt-8 text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Progresso sincronizado automaticamente.
        </p>
      </div>
    </div>
  );
};
