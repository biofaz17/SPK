
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { UserProfile, SubscriptionTier } from '../types';
import { User, Lock, Gamepad2, PlayCircle } from 'lucide-react';
import { SparkyLogo } from '../components/SparkyLogo';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [foundStudent, setFoundStudent] = useState<UserProfile | null>(null);

  // Lógica simples para encontrar usuário existente localmente para persistência
  const checkExistingUser = (userName: string) => {
     const userId = `user_${userName.toLowerCase().replace(/\s/g, '')}`;
     const savedData = localStorage.getItem(`sparky_user_${userId}`);
     
     if (savedData) {
         const parsed = JSON.parse(savedData);
         setFoundStudent(parsed);
         return parsed;
     }
     setFoundStudent(null);
     return null;
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tenta recuperar do localStorage para experiência contínua
    const existing = checkExistingUser(name);
    if (existing) {
        onLogin({ ...existing, lastActive: Date.now() });
        return;
    }

    // Cria novo usuário
    const mockUser: UserProfile = {
      id: 'user_' + name.toLowerCase().replace(/\s/g, ''),
      name: name || 'Aventureiro',
      parentEmail: parentEmail || 'pai@exemplo.com',
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
      isGuest: false,
      lastActive: Date.now()
    };
    onLogin(mockUser);
  };

  const handleGuestPlay = () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Date.now(),
      name: 'Visitante',
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

  const isLogin = authMode === 'login';

  return (
    <div className="min-h-screen bg-indigo-500 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decor */}
        <div className={`absolute top-0 left-0 w-full h-4 bg-gradient-to-r transition-colors duration-500 from-blue-400 via-purple-400 to-yellow-400`} />
        
        <div className="flex flex-col items-center mb-8">
           <div className="transform hover:scale-105 transition-transform duration-300">
             <SparkyLogo size="lg" />
           </div>
           <h1 className="text-2xl font-heading text-indigo-900 mt-6 text-center">
             {isLogin ? 'Bem-vindo de volta!' : 'Criar Nova Conta'}
           </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1 ml-2">Nome da Criança</label>
            <div className="relative">
               <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
               <input 
                 type="text" 
                 value={name}
                 onChange={e => {
                     setName(e.target.value);
                     checkExistingUser(e.target.value);
                 }}
                 className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition"
                 placeholder="Ex: Super Mario"
                 required
               />
            </div>
          </div>

          {/* Feedback se encontrou conta existente */}
          {foundStudent && (
             <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-3 animate-fadeIn">
                 <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <PlayCircle size={20} />
                 </div>
                 <div>
                    <div className="text-xs font-bold text-green-800 uppercase">Conta Encontrada</div>
                    <div className="text-sm text-green-700">Continuar nível {foundStudent.progress.unlockedLevels}?</div>
                 </div>
             </div>
          )}

          {!foundStudent && (
            <>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1 ml-2">Idade</label>
              <input 
                type="number" 
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-indigo-400 outline-none transition"
                placeholder="Ex: 8"
                min="5"
                max="16"
                required={!foundStudent}
              />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-600 mb-1 ml-2">Email do Responsável</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                   <input 
                     type="email" 
                     value={parentEmail}
                     onChange={e => setParentEmail(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 pl-12 font-bold text-slate-700 focus:border-indigo-400 outline-none transition"
                     placeholder="pai@email.com"
                     required={!foundStudent}
                   />
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-2">Enviaremos o progresso para este email.</p>
             </div>
             </>
          )}

          <Button 
            variant={'primary'} 
            size="lg" 
            className={`w-full mt-4`}
          >
             {foundStudent ? 'Continuar Aventura' : 'Começar Grátis'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
           <div className="h-px bg-slate-200 flex-1" />
           <span className="text-slate-400 text-xs font-bold uppercase">OU</span>
           <div className="h-px bg-slate-200 flex-1" />
        </div>

        <button 
          onClick={handleGuestPlay}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
           <Gamepad2 size={20} /> Testar sem salvar
        </button>

      </div>
    </div>
  );
};
