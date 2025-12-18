
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { UserProfile, SubscriptionTier } from '../types';
import { User, LogIn, UserPlus, KeyRound, Mail, Gamepad2, Loader2, Sparkles } from 'lucide-react';
import { SparkyLogo } from '../components/SparkyLogo';
import { audioService } from '../services/AudioService';
import { dataService } from '../services/DataService';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await dataService.login(name, password);
      if (user) {
        audioService.playSfx('success');
        onLogin(user);
      } else {
        setErrorMsg('Explorador não encontrado. Verifique o nome ou crie uma conta!');
        audioService.playSfx('error');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao entrar.');
      audioService.playSfx('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (name.length < 3) { setErrorMsg('Seu nome precisa de pelo menos 3 letras!'); return; }
    if (password.length < 4) { setErrorMsg('Crie uma senha de pelo menos 4 caracteres.'); return; }

    setIsLoading(true);

    const newUser: UserProfile = {
      id: name.trim().toLowerCase().replace(/\s/g, '_'),
      name: name.trim(),
      password: password,
      parentEmail: parentEmail,
      age: parseInt(age) || 7,
      subscription: SubscriptionTier.FREE, 
      progress: { unlockedLevels: 5, stars: 12, creativeProjects: 0, totalBlocksUsed: 0, secretsFound: 0 },
      settings: { soundEnabled: true, musicEnabled: true },
      activeSkin: 'default',
      isGuest: false,
      lastActive: Date.now()
    };

    try {
      await dataService.register(newUser);
      audioService.playSfx('start');
      onLogin(newUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    audioService.playSfx('pop');
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substr(2, 9),
      name: 'Visitante',
      parentEmail: '',
      age: 7,
      subscription: SubscriptionTier.FREE,
      progress: { unlockedLevels: 5, stars: 12, creativeProjects: 0, totalBlocksUsed: 0, secretsFound: 0 },
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
           <SparkyLogo size="lg" />
           <div className="bg-indigo-50 px-4 py-1 rounded-full mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-indigo-900 font-black text-[10px] uppercase tracking-widest">Plataforma Sparky Ativa</span>
           </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-8 border border-slate-200 shadow-inner">
            <button 
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <LogIn size={18} /> ENTRAR
            </button>
            <button 
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
                 type="text" value={name} onChange={e => setName(e.target.value)}
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
                 type="password" value={password} onChange={e => setPassword(e.target.value)}
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
              <motion.div initial={{ x: -10 }} animate={{ x: [10, -10, 10, 0] }} className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl border border-red-200 text-center">
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
                onClick={handleGuestLogin}
                className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
            >
                <Sparkles size={18} className="text-yellow-400" /> JOGAR SEM SALVAR
            </button>
          </div>
        </form>

        <p className="mt-8 text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Contas salvas são sincronizadas em tempo real.<br/>Visitantes salvam apenas neste navegador.
        </p>
      </div>
    </div>
  );
};
