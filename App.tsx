
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { PlatformHub } from './screens/PlatformHub';
import { LevelMap } from './screens/LevelMap';
import { GameScreen } from './screens/GameScreen';
import { Dashboard } from './screens/Dashboard';
import { ParentPanel } from './screens/ParentPanel';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { MathGameScreen } from './screens/MathGameScreen';
import { WordsGameScreen } from './screens/WordsGameScreen';
import { ScienceGameScreen } from './screens/ScienceGameScreen';
import { MemoryGameScreen } from './screens/MemoryGameScreen';
import { RhythmGameScreen } from './screens/RhythmGameScreen';
import { GeometryGameScreen } from './screens/GeometryGameScreen';
import { LogicGameScreen } from './screens/LogicGameScreen';
import { UserProfile, SubscriptionTier } from './types';
import { LEVELS } from './constants';
import { ParentGate } from './components/ParentGate';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MarketingModal } from './components/MarketingModal';
import { SparkyAssistant } from './components/SparkyAssistant';
import { Mail, Cloud } from 'lucide-react';
import { audioService } from './services/AudioService';

// Toast Notification aprimorado com ícone de sincronização
const NotificationToast = ({ msg, subMsg, show }: { msg: string, subMsg?: string, show: boolean }) => (
   <div className={`fixed top-4 right-4 bg-white border-l-4 border-indigo-500 text-slate-800 px-6 py-4 rounded-r-xl shadow-2xl z-[100] transition-all duration-500 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start gap-3">
         <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 animate-pulse">
            <Cloud size={20} />
         </div>
         <div>
            <div className="font-bold text-sm">{String(msg || '')}</div>
            {subMsg && <div className="text-xs text-slate-500 mt-1">{String(subMsg)}</div>}
         </div>
      </div>
   </div>
);

enum Screen {
  AUTH,
  HUB,
  DASHBOARD, 
  MAP,
  GAME,      
  MATH_GAME, 
  WORDS_GAME,
  SCIENCE_GAME,
  MEMORY_GAME, 
  RHYTHM_GAME, 
  GEOMETRY_GAME, 
  LOGIC_GAME, 
  PARENTS,
  CHECKOUT,
  PAYMENT_SUCCESS
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false); 
  const [gateAction, setGateAction] = useState(''); 
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);

  // Efeito de Persistência: Sempre que o usuário mudar (progresso, skin, etc), salvamos.
  useEffect(() => {
    if (user && !user.isGuest) {
      const storageKey = `sparky_user_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(user));
      // Sincronização global para múltiplos abas ou recarregamento
      localStorage.setItem('sparky_last_user_id', user.id);
    }
  }, [user]);

  // Handler de retorno de pagamento
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status') || params.get('collection_status');
      if (status === 'approved' && user) {
          const updatedUser = { 
              ...user, 
              subscription: pendingSubscriptionTier || SubscriptionTier.PRO, 
              isGuest: false,
          };
          setUser(updatedUser);
          setScreen(Screen.PAYMENT_SUCCESS);
      }
  }, [user, pendingSubscriptionTier]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    setScreen(Screen.HUB);
    audioService.playSfx('start');
    showNotification("Bem-vindo de volta!", "Seu progresso foi carregado com sucesso.");
  };

  const handleLogout = () => {
    setUser(null);
    setScreen(Screen.AUTH);
  };

  const showNotification = (title: string, body: string = '') => {
     setNotification({ title, body });
     setTimeout(() => setNotification({ title: '', body: '' }), 4000);
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
          unlockedLevels: Math.max(user.progress.unlockedLevels, nextLevelId),
          stars: user.progress.stars + 1,
          totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        
        const updatedUser = { 
            ...user, 
            progress: newProgress,
            lastActive: Date.now() 
        };
        
        // Atualiza estado e consequentemente o localStorage via useEffect
        setUser(updatedUser);

        // Feedback de salvamento para os pais/criança
        if (user.progress.stars % 2 === 0) {
            showNotification(`Progresso Sincronizado`, `Nível ${currentLevelId} salvo com sucesso!`);
        }

        // Lógica de Marketing (Níveis 3, 6, 9...)
        if (user.subscription === SubscriptionTier.FREE && currentLevelId % 3 === 0) {
            setShowMarketingModal(true);
            return; 
        }

        if (nextLevelId !== currentLevelId) {
          setScreen(Screen.MAP);
        } else {
          setScreen(Screen.DASHBOARD);
        }
    } else {
        // Modo Criativo
        const newProgress = { 
            ...user.progress, 
            creativeProjects: user.progress.creativeProjects + 1,
            totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        setUser({ ...user, progress: newProgress, lastActive: Date.now() });
        setScreen(Screen.DASHBOARD);
    }
  };

  const handleUpdateSkin = (skinId: string) => {
    if (!user) return;
    setUser({ ...user, activeSkin: skinId });
    showNotification("Visual Atualizado!", "Sparky adorou a nova roupa.");
  };

  // --- Parent Gate & Modal Handlers ---
  const triggerParentGate = (action: string) => {
    setGateAction(action);
    setShowParentGate(true);
  };

  const handleGateSuccess = () => {
    setShowParentGate(false);
    if (gateAction === 'upgrade') setShowSubscriptionModal(true);
    else if (gateAction === 'parents_area') setScreen(Screen.PARENTS);
  };

  const handleSelectGame = (gameId: string) => {
     switch (gameId) {
        case 'sparky': setScreen(Screen.DASHBOARD); break;
        case 'math': setScreen(Screen.MATH_GAME); break;
        case 'words': setScreen(Screen.WORDS_GAME); break;
        case 'science': setScreen(Screen.SCIENCE_GAME); break;
        case 'memory': setScreen(Screen.MEMORY_GAME); break;
        case 'rhythm': setScreen(Screen.RHYTHM_GAME); break;
        case 'geometry': setScreen(Screen.GEOMETRY_GAME); break;
        case 'logic': setScreen(Screen.LOGIC_GAME); break;
        default: showNotification("Em Breve!", "Este jogo está sendo construído.");
     }
  };

  if (screen === Screen.AUTH) return <AuthScreen onLogin={handleLogin} />;
  if (!user) return null; 

  return (
    <div className="antialiased text-slate-800 font-sans selection:bg-indigo-100">
      <NotificationToast 
        msg={notification.title || ''} 
        subMsg={notification.body || ''} 
        show={!!notification.title} 
      />
      
      {/* Assistente aparece fora de gameplay intenso */}
      {screen !== Screen.GAME && screen !== Screen.MATH_GAME && 
       screen !== Screen.MEMORY_GAME && screen !== Screen.RHYTHM_GAME && (
         <SparkyAssistant user={user} />
      )}

      {screen === Screen.HUB && (
        <PlatformHub 
           user={user}
           onSelectGame={handleSelectGame}
           onLogout={handleLogout}
           onOpenParents={() => triggerParentGate('parents_area')}
        />
      )}

      {screen === Screen.DASHBOARD && (
        <Dashboard 
           progress={user.progress}
           onPlayMission={() => setScreen(Screen.MAP)}
           onCreativeMode={() => {
              setCurrentLevelId('creative');
              setScreen(Screen.GAME);
           }}
           onOpenParents={() => triggerParentGate('parents_area')}
           onBackToHub={() => setScreen(Screen.HUB)}
        />
      )}
      
      {screen === Screen.MAP && (
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

      {/* Mini-Games */}
      {screen === Screen.MATH_GAME && <MathGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.WORDS_GAME && <WordsGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.SCIENCE_GAME && <ScienceGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.MEMORY_GAME && <MemoryGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.RHYTHM_GAME && <RhythmGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.GEOMETRY_GAME && <GeometryGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.LOGIC_GAME && <LogicGameScreen onBack={() => setScreen(Screen.HUB)} />}

      {screen === Screen.PARENTS && (
         <ParentPanel 
            user={user}
            onUpdateUser={setUser}
            onLogout={handleLogout}
            onBack={() => setScreen(Screen.HUB)}
            onRequestUpgrade={() => {
              setScreen(Screen.DASHBOARD);
              setTimeout(() => setShowSubscriptionModal(true), 100);
            }}
         />
      )}

      {screen === Screen.CHECKOUT && pendingSubscriptionTier && (
         <CheckoutScreen 
            user={user}
            tier={pendingSubscriptionTier}
            onConfirm={() => {
                setUser({...user, subscription: pendingSubscriptionTier});
                setScreen(Screen.PAYMENT_SUCCESS);
            }}
            onCancel={() => setScreen(Screen.DASHBOARD)}
         />
      )}

      {screen === Screen.PAYMENT_SUCCESS && <PaymentSuccessScreen onContinue={() => setScreen(Screen.DASHBOARD)} />}

      {/* Modais */}
      {showMarketingModal && <MarketingModal onUpgrade={() => { setShowMarketingModal(false); setShowSubscriptionModal(true); }} onClose={() => { setShowMarketingModal(false); setScreen(Screen.MAP); }} />}
      {showParentGate && <ParentGate action={gateAction === 'upgrade' ? 'fazer compras' : 'acessar área dos pais'} onSuccess={handleGateSuccess} onCancel={() => setShowParentGate(false)} />}
      {showSubscriptionModal && <SubscriptionModal onCheckoutStart={(tier) => { setPendingSubscriptionTier(tier); setShowSubscriptionModal(false); setScreen(Screen.CHECKOUT); }} onClose={() => setShowSubscriptionModal(false)} />}
    </div>
  );
}
