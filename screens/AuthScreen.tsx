
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { UserProfile, SubscriptionTier } from '../types';
import { User, Lock, Gamepad2, LogIn, UserPlus, KeyRound, Mail } from 'lucide-react';
import { SparkyLogo } from '../components/SparkyLogo';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Normaliza o ID para busca consistente
  const generateUserId = (userName: string) => `user_${userName.trim().toLowerCase().replace(/\s/g, '_')}`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const userId = generateUserId(name);
    const savedData = localStorage.getItem(`sparky_user_${userId}`);

    if (savedData) {
        try {
            const user: UserProfile = JSON.parse(savedData);
            if (user.password === password) {
                onLogin({ ...user, lastActive: Date.now() });
            } else {
                setErrorMsg('Senha incorreta! Peça ajuda aos seus pais se esqueceu.');
            }
        } catch (err) {
            setErrorMsg('Erro ao carregar dados. Tente criar uma nova conta.');
        }
    } else {
        setErrorMsg('Usuário não encontrado. Verifique o nome ou crie uma conta nova!');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (name.length < 3) {
        setErrorMsg('O nome deve ter pelo menos 3 letras.');
        return;
    }

    if (password.length < 4) {
        setErrorMsg('Crie uma senha de pelo menos 4 números ou letras.');
        return;
    }

    const userId = generateUserId(name);
    
    // Verifica duplicidade
    if (localStorage.getItem(`sparky_user_${userId}`)) {
        setErrorMsg('Este nome já está em uso! Tente fazer login ou use outro nome.');
        return;
    }

    const newUser: UserProfile = {
      id: userId,
      name: name.trim(),
      password: password,
      parentEmail: parentEmail,
      age: parseInt(age) || 7,
      subscription: SubscriptionTier.FREE, 
      progress: {
        unlockedLevels: 1, 
        stars: 0,          
        creativeProjects: 0,
        totalBlocksUsed: 0, 
        secretsFound: 0
      },
      settings: {
        soundEnabled: true,
        musicEnabled: true
      },
      activeSkin: 'default',
      isGuest: false,
      lastActive: Date.now()
    };
    
    // Persistência imediata
    localStorage.setItem(`sparky_user_${userId}`, JSON.stringify(newUser));
    localStorage.setItem('sparky_last_user_id', userId);
    
    onLogin(newUser);
  };

  const handleGuestPlay = () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substr(2, 9),
      name: 'Explorador Convidado',
      parentEmail: '',
      age: 7, 
      subscription: SubscriptionTier.FREE,
      progress: {
        unlockedLevels: 1,
        stars: 0,
        creativeProjects: 0,
        totalBlocksUsed: 0,
        secretsFound: 0
      },
      settings: {
        soundEnabled: true,
        musicEnabled: true
      },
      isGuest: true
    };
    onLogin(guestUser);
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative overflow-hidden border-4 border-indigo-400">
        
        <div className="flex flex-col items-center mb-8">
           <SparkyLogo size="lg" />
           <p className="text-slate-400 text-sm font-bold mt-2">Sua aventura começa aqui!</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button 
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400'}`}
            >
                <LogIn size={18} /> ENTRAR
            </button>
            <button 
                onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'register' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400'}`}
            >
                <UserPlus size={18} /> CRIAR CONTA
            </button>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Nome do Explorador</label>
            <div className="relative">
               <User className="absolute left-4 top-3.5 text-indigo-300" size={20} />
               <input 
                 type="text" 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 pl-12 font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all shadow-inner"
                 placeholder="Como quer ser chamado?"
                 required
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Código Secreto (Senha)</label>
            <div className="relative">
               <KeyRound className="absolute left-4 top-3.5 text-indigo-300" size={20} />
               <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 pl-12 font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all shadow-inner"
                 placeholder="Sua senha secreta"
                 required
               />
            </div>
          </div>

          {authMode === 'register' && (
            <div className="animate-fadeIn space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Idade</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 font-bold text-slate-700 focus:border-indigo-400 outline-none transition shadow-inner"
                    placeholder="Ex: 8"
                    min="5" max="15" required
                  />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Email do Responsável (Para salvar o progresso)</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-3.5 text-indigo-300" size={20} />
                       <input 
                         type="email" 
                         value={parentEmail}
                         onChange={e => setParentEmail(e.target.value)}
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition shadow-inner"
                         placeholder="email@dopapai.com"
                         required
                       />
                    </div>
                </div>
            </div>
          )}

          {errorMsg && (
              <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-2xl border border-red-100 animate-shake text-center">
                  {errorMsg}
              </div>
          )}

          <Button variant="primary" size="lg" className="w-full py-4 text-xl shadow-indigo-200">
             {authMode === 'login' ? 'ENTRAR AGORA' : 'VAMOS NESSA!'}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4">
           <div className="h-px bg-slate-100 flex-1" />
           <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">OU</span>
           <div className="h-px bg-slate-100 flex-1" />
        </div>

        <button 
          onClick={handleGuestPlay}
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border-2 border-transparent hover:border-slate-200"
        >
           <Gamepad2 size={18} /> Entrar como visitante (não salva)
        </button>

      </div>
    </div>
  );
};
