
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { LevelMap } from './screens/LevelMap';
import { GameScreen } from './screens/GameScreen';
import { Dashboard } from './screens/Dashboard';
import { ParentPanel } from './screens/ParentPanel';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { UserProfile, SubscriptionTier } from './types';
import { LEVELS } from './constants';
import { ParentGate } from './components/ParentGate';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MarketingModal } from './components/MarketingModal';
import { Mail } from 'lucide-react';

// Enhanced Toast Notification com Proteção contra Objetos (React #31 Fix)
const NotificationToast = ({ msg, subMsg, show }: { msg: any, subMsg?: any, show: boolean }) => {
   // Helper para garantir que não renderizamos objetos puros
   const safeRender = (content: any) => {
      if (typeof content === 'string' || typeof content === 'number') return content;
      if (React.isValidElement(content)) return content;
      return ''; // Retorna vazio se for objeto inválido
   };

   return (
    <div className={`fixed top-4 right-4 bg-white border-l-4 border-green-500 text-slate-800 px-6 py-4 rounded-r-xl shadow-2xl z-[100] transition-transform duration-500 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Mail size={20} />
            </div>
            <div>
                <div className="font-bold text-sm">{safeRender(msg)}</div>
                {subMsg && <div className="text-xs text-slate-500 mt-1">{safeRender(subMsg)}</div>}
            </div>
        </div>
    </div>
   );
};

enum Screen {
  AUTH,
  DASHBOARD,
  MAP,
  GAME,
  PARENTS,
  CHECKOUT,
  PAYMENT_SUCCESS
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [isLoading, setIsLoading] = useState(true); // Loading state for auto-login
  
  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // UX State
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false); 
  const [gateAction, setGateAction] = useState(''); 
  const [notification, setNotification] = useState({ title: '', body: '' });
  
  // Payment Flow State
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);

  // Helper function to show notifications
  const showNotification = (title: string, body: string) => {
    setNotification({ title, body });
    setTimeout(() => {
        setNotification({ title: '', body: '' });
    }, 4000);
  };

  // --- AUTO-LOGIN LOGIC ---
  useEffect(() => {
    const checkSession = () => {
        try {
            const lastUserId = localStorage.getItem('sparky_last_active_id');
            if (lastUserId) {
                const storageKey = `sparky_user_${lastUserId}`;
                const storedData = localStorage.getItem(storageKey);
                if (storedData) {
                    const savedUser = JSON.parse(storedData);
                    setUser(savedUser);
                    // Restaurar nível desbloqueado mais alto ou último jogado (lógica simples aqui)
                    setScreen(Screen.DASHBOARD);
                }
            }
        } catch (e) {
            console.error("Erro ao restaurar sessão:", e);
            localStorage.removeItem('sparky_last_active_id');
        } finally {
            setIsLoading(false);
        }
    };
    
    checkSession();
  }, []);

  // PERSISTENCE LOGIC: Save user state whenever it changes
  useEffect(() => {
    if (user && !user.isGuest) {
      const storageKey = `sparky_user_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(user));
      
      // Salva ID como último ativo para auto-login
      localStorage.setItem('sparky_last_active_id', user.id);
    }
  }, [user]);

  // PAYMENT RETURN HANDLER (Mercado Pago Redirects)
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('collection_status') || params.get('status');
      
      // Se voltamos do MP com sucesso
      if (status === 'approved' && user) {
          // Limpa URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Atualiza usuário
          const updatedUser = { 
              ...user, 
              subscription: pendingSubscriptionTier || SubscriptionTier.PRO, // Default fallback if state lost
              isGuest: false,
          };
          setUser(updatedUser);
          setScreen(Screen.PAYMENT_SUCCESS);
      } else if (status === 'failure' || status === 'null') {
           window.history.replaceState({}, document.title, window.location.pathname);
           alert("O pagamento não foi concluído ou foi cancelado.");
      }
  }, [user]); 

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    setScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    // Limpa a sessão automática
    localStorage.removeItem('sparky_last_active_id');
    setUser(null);
    setScreen(Screen.AUTH);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleUpdateSkin = (skinId: string) => {
    if (!user) return;
    setUser({
      ...user,
      activeSkin: skinId
    });
    showNotification("Novo Visual!", "Sua skin foi atualizada com sucesso.");
  };

  const handleLevelComplete = (blocksUsed: number) => {
    if (!user) return;

    if (typeof currentLevelId === 'number') {
        const sortedLevels = [...LEVELS].sort((a,b) => (a.id as number) - (b.id as number));
        const currentIndex = sortedLevels.findIndex(l => l.id === currentLevelId);
        
        let nextLevelId = currentLevelId; 
        
        if (currentIndex !== -1 && currentIndex < sortedLevels.length - 1) {
             nextLevelId = sortedLevels[currentIndex + 1].id as number;
        }

        const newProgress = {
          ...user.progress,
          unlockedLevels: Math.max(user.progress.unlockedLevels, (nextLevelId as number)),
          stars: user.progress.stars + 1,
          totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        
        const updatedUser = { 
            ...user, 
            progress: newProgress,
            lastActive: Date.now() 
        };
        setUser(updatedUser);

        if (!user.isGuest) {
            console.log(`[SERVICE] Sending progress report to ${user.parentEmail}...`);
            if (user.progress.stars % 5 === 0) {
                showNotification(
                    `Progresso Salvo!`, 
                    `Dados sincronizados com o painel do Responsável.`
                );
            }
        }

        const justFinishedLevel = typeof currentLevelId === 'number' ? currentLevelId : 0;
        
        if (nextLevelId !== currentLevelId) {
            setCurrentLevelId(nextLevelId);
        }

        if (user.subscription === SubscriptionTier.FREE && justFinishedLevel > 0 && justFinishedLevel % 3 === 0) {
           setShowMarketingModal(true);
           return; 
        }

        if (nextLevelId !== currentLevelId) {
          setScreen(Screen.MAP);
        } else {
          setScreen(Screen.DASHBOARD);
          alert("Você completou esta etapa! Confira os próximos desafios no mapa.");
        }
    } else {
        const newProgress = { 
            ...user.progress, 
            creativeProjects: user.progress.creativeProjects + 1,
            totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        setUser({ ...user, progress: newProgress, lastActive: Date.now() });
        setScreen(Screen.DASHBOARD);
    }
  };

  const closeMarketingModal = () => {
     setShowMarketingModal(false);
     setScreen(Screen.GAME);
  };

  const handleMarketingUpgrade = () => {
    setShowMarketingModal(false);
    setShowSubscriptionModal(true);
  };

  const triggerParentGate = (action: string) => {
    setGateAction(action);
    setShowParentGate(true);
  };

  const handleGateSuccess = () => {
    setShowParentGate(false);
    if (gateAction === 'upgrade') {
       setShowSubscriptionModal(true);
    } else if (gateAction === 'parents_area') {
       setScreen(Screen.PARENTS);
    }
  };

  const handleCheckoutStart = (tier: SubscriptionTier) => {
     setPendingSubscriptionTier(tier);
     setShowSubscriptionModal(false);
     setScreen(Screen.CHECKOUT);
  };

  const handlePaymentComplete = () => {
     if (user && pendingSubscriptionTier) {
        const updatedUser = { 
            ...user, 
            subscription: pendingSubscriptionTier,
            isGuest: false,
        };
        setUser(updatedUser);
        setScreen(Screen.PAYMENT_SUCCESS);
     }
  };

  const handlePaymentCancel = () => {
     setPendingSubscriptionTier(null);
     setScreen(Screen.DASHBOARD);
  };

  // --- RENDER ---

  if (isLoading) {
      return <div className="h-full w-full flex items-center justify-center bg-indigo-500 text-white font-bold">Carregando aventura...</div>;
  }

  if (screen === Screen.AUTH) {
    return (
      <div className="h-full w-full scrollable-y bg-indigo-500">
         <AuthScreen onLogin={handleLogin} />
      </div>
    );
  }

  if (!user) return null; 

  return (
    <div className="antialiased text-slate-800 font-sans h-full w-full">
      <NotificationToast 
        msg={notification.title || ''} 
        subMsg={notification.body || ''} 
        show={!!notification.title} 
      />

      {screen === Screen.DASHBOARD && (
        <div className="h-full w-full scrollable-y">
            <Dashboard 
            progress={user.progress}
            onPlayMission={() => setScreen(Screen.MAP)}
            onCreativeMode={() => {
                setCurrentLevelId('creative');
                setScreen(Screen.GAME);
            }}
            onOpenParents={() => triggerParentGate('parents_area')}
            />
        </div>
      )}
      
      {screen === Screen.MAP && (
        <div className="h-full w-full scrollable-y">
            <LevelMap 
            unlockedLevels={user.progress.unlockedLevels}
            userSubscription={user.subscription}
            onSelectLevel={(id) => {
                setCurrentLevelId(id);
                setScreen(Screen.GAME);
            }}
            onBack={() => setScreen(Screen.DASHBOARD)}
            onRequestUpgrade={() => triggerParentGate('upgrade')}
            />
        </div>
      )}

      {screen === Screen.GAME && (
        <GameScreen 
          levelId={currentLevelId}
          onBack={() => setScreen(Screen.MAP)}
          onNextLevel={handleLevelComplete}
          user={user}
          onUpdateSkin={handleUpdateSkin}
        />
      )}

      {screen === Screen.PARENTS && (
         <div className="h-full w-full scrollable-y">
            <ParentPanel 
                user={user}
                onUpdateUser={handleUpdateProfile}
                onLogout={handleLogout}
                onBack={() => setScreen(Screen.DASHBOARD)}
                onRequestUpgrade={() => {
                setScreen(Screen.DASHBOARD);
                setTimeout(() => setShowSubscriptionModal(true), 100);
                }}
            />
         </div>
      )}

      {screen === Screen.CHECKOUT && pendingSubscriptionTier && (
         <div className="h-full w-full scrollable-y">
            <CheckoutScreen 
                user={user}
                tier={pendingSubscriptionTier}
                onConfirm={handlePaymentComplete}
                onCancel={handlePaymentCancel}
            />
         </div>
      )}

      {screen === Screen.PAYMENT_SUCCESS && (
         <div className="h-full w-full scrollable-y">
            <PaymentSuccessScreen 
                onContinue={() => setScreen(Screen.DASHBOARD)}
            />
         </div>
      )}

      {showMarketingModal && (
        <MarketingModal 
           onUpgrade={handleMarketingUpgrade}
           onClose={closeMarketingModal}
        />
      )}

      {showParentGate && (
        <ParentGate 
          action={gateAction === 'upgrade' ? 'fazer compras' : 'acessar área dos pais'}
          onSuccess={handleGateSuccess} 
          onCancel={() => setShowParentGate(false)} 
        />
      )}

      {showSubscriptionModal && (
         <SubscriptionModal 
            onCheckoutStart={handleCheckoutStart}
            onClose={() => setShowSubscriptionModal(false)}
         />
      )}
    </div>
  );
}
