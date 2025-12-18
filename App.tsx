
import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { PlatformHub } from './screens/PlatformHub';
import { LevelMap } from './screens/LevelMap';
import { GameScreen } from './screens/GameScreen';
import { Dashboard } from './screens/Dashboard';
import { ParentPanel } from './screens/ParentPanel';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { TermsScreen } from './screens/TermsScreen';
import { MathGameScreen } from './screens/MathGameScreen';
import { WordsGameScreen } from './screens/WordsGameScreen';
import { ScienceGameScreen } from './screens/ScienceGameScreen';
import { MemoryGameScreen } from './screens/MemoryGameScreen';
import { RhythmGameScreen } from './screens/RhythmGameScreen';
import { GeometryGameScreen } from './screens/GeometryGameScreen';
import { LogicGameScreen } from './screens/LogicGameScreen';
import { CodeGameScreen } from './screens/CodeGameScreen';
import { UserProfile, SubscriptionTier } from './types';
import { LEVELS } from './constants';
import { ParentGate } from './components/ParentGate';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SparkyAssistant } from './components/SparkyAssistant';
import { StatusIndicator } from './components/StatusIndicator';
import { Cloud, Loader2 } from 'lucide-react';
import { audioService } from './services/AudioService';
import { dataService } from './services/DataService';

enum Screen {
  AUTH, HUB, DASHBOARD, MAP, GAME, MATH_GAME, WORDS_GAME, 
  SCIENCE_GAME, MEMORY_GAME, RHYTHM_GAME, GEOMETRY_GAME, 
  LOGIC_GAME, CODE_GAME, PARENTS, CHECKOUT, PAYMENT_SUCCESS, TERMS
}

const CURRENT_TERMS_VERSION = "v1.0";

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [gateAction, setGateAction] = useState(''); 
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionUser = await dataService.checkSession();
        if (sessionUser) {
          setUser(sessionUser);
          if (sessionUser.subscription !== SubscriptionTier.FREE && sessionUser.termsAcceptedVersion !== CURRENT_TERMS_VERSION) {
              setScreen(Screen.TERMS);
          } else {
              setScreen(Screen.HUB);
          }
        }
      } catch (e) {
        console.error("Falha na inicialização", e);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user && !user.isGuest) {
      const sync = async () => {
        setIsSyncing(true);
        try {
          await dataService.syncProfile(user);
        } catch (e) {
          console.error("Erro ao sincronizar", e);
        } finally {
          setTimeout(() => setIsSyncing(false), 1000);
        }
      };
      sync();
    }
  }, [user]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    if (profile.subscription !== SubscriptionTier.FREE && profile.termsAcceptedVersion !== CURRENT_TERMS_VERSION) {
        setScreen(Screen.TERMS);
    } else {
        setScreen(Screen.HUB);
    }
    audioService.playSfx('start');
  };

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
    setScreen(Screen.AUTH);
    audioService.playSfx('delete');
  };

  const handleTermsAccepted = (version: string, timestamp: string) => {
    if (user) {
        setUser({ ...user, termsAcceptedVersion: version, termsAcceptedAt: timestamp });
        setScreen(Screen.HUB);
    }
  };

  const handleLevelComplete = (blocksUsed: number) => {
    if (!user) return;

    if (typeof currentLevelId === 'number') {
        const sortedLevels = [...LEVELS].sort((a,b) => (a.id as number) - (b.id as number));
        const currentIndex = sortedLevels.findIndex(l => l.id === currentLevelId);
        
        let nextLevelId = currentLevelId; 
        let hasNext = false;

        if (currentIndex !== -1 && currentIndex < sortedLevels.length - 1) {
            const nextLevel = sortedLevels[currentIndex + 1];

            // TRAVA OBRIGATÓRIA NÍVEL 15 -> 16
            if (currentLevelId === 15 && user.subscription === SubscriptionTier.FREE) {
                // Salva o progresso do 15 mas não libera o 16 ainda no objeto de usuário
                const newProgress = {
                  ...user.progress,
                  stars: user.progress.stars + 1,
                  totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
                };
                setUser({ ...user, progress: newProgress, lastActive: Date.now() });
                
                // Redireciona para o mapa e dispara o modal de compra
                setScreen(Screen.MAP);
                setGateAction('upgrade');
                setShowParentGate(true);
                return;
            }

            nextLevelId = nextLevel.id as number;
            hasNext = true;
        }

        const newProgress = {
          ...user.progress,
          unlockedLevels: Math.max(user.progress.unlockedLevels, hasNext ? nextLevelId : currentLevelId),
          stars: user.progress.stars + 1,
          totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        
        setUser({ ...user, progress: newProgress, lastActive: Date.now() });

        if (hasNext) {
            setCurrentLevelId(nextLevelId);
            setScreen(Screen.GAME);
        } else {
            setScreen(Screen.DASHBOARD);
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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white">
        <div className="relative">
            <Loader2 className="animate-spin" size={64} />
            <Cloud className="absolute inset-0 m-auto text-indigo-300" size={24} />
        </div>
        <p className="font-heading text-xl mt-6 animate-pulse uppercase tracking-widest">Sincronizando seu Universo...</p>
      </div>
    );
  }

  if (screen === Screen.AUTH) return <AuthScreen onLogin={handleLogin} />;
  if (!user) return null; 

  return (
    <div className="antialiased text-slate-800 font-sans selection:bg-indigo-100">
      <div className="fixed bottom-6 left-6 z-[100] pointer-events-none">
          <StatusIndicator isSaving={isSyncing} isGuest={user?.isGuest} className="shadow-2xl bg-slate-900/80 text-white p-4" />
      </div>
      
      {user && ![Screen.GAME, Screen.MATH_GAME, Screen.MEMORY_GAME, Screen.RHYTHM_GAME, Screen.TERMS, Screen.CODE_GAME].includes(screen) && (
         <SparkyAssistant user={user} />
      )}

      {screen === Screen.HUB && (
        <PlatformHub 
           user={user}
           onSelectGame={(id) => {
              if (id === 'sparky') setScreen(Screen.DASHBOARD);
              else if (id === 'math') setScreen(Screen.MATH_GAME);
              else if (id === 'words') setScreen(Screen.WORDS_GAME);
              else if (id === 'science') setScreen(Screen.SCIENCE_GAME);
              else if (id === 'memory') setScreen(Screen.MEMORY_GAME);
              else if (id === 'rhythm') setScreen(Screen.RHYTHM_GAME);
              else if (id === 'geometry') setScreen(Screen.GEOMETRY_GAME);
              else if (id === 'logic') setScreen(Screen.LOGIC_GAME);
              else if (id === 'code') setScreen(Screen.CODE_GAME);
           }}
           onLogout={handleLogout}
           onOpenParents={() => { setGateAction('parents_area'); setShowParentGate(true); }}
        />
      )}

      {screen === Screen.DASHBOARD && (
        <Dashboard 
           progress={user.progress}
           onPlayMission={() => setScreen(Screen.MAP)}
           onCreativeMode={() => { setCurrentLevelId('creative'); setScreen(Screen.GAME); }}
           onOpenParents={() => { setGateAction('parents_area'); setShowParentGate(true); }}
           onBackToHub={() => setScreen(Screen.HUB)}
        />
      )}
      
      {screen === Screen.MAP && (
        <LevelMap 
          unlockedLevels={user.progress.unlockedLevels}
          userSubscription={user.subscription}
          onSelectLevel={(id) => { setCurrentLevelId(id); setScreen(Screen.GAME); }}
          onBack={() => setScreen(Screen.DASHBOARD)}
          onHome={() => setScreen(Screen.HUB)}
          onRequestUpgrade={() => { setGateAction('upgrade'); setShowParentGate(true); }}
        />
      )}

      {screen === Screen.GAME && (
        <GameScreen 
          levelId={currentLevelId}
          onBack={() => currentLevelId === 'creative' ? setScreen(Screen.DASHBOARD) : setScreen(Screen.MAP)}
          onHome={() => setScreen(Screen.HUB)}
          onNextLevel={handleLevelComplete}
          user={user}
          onUpdateSkin={(skinId) => setUser({ ...user, activeSkin: skinId })}
        />
      )}

      {screen === Screen.MATH_GAME && <MathGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.WORDS_GAME && <WordsGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.SCIENCE_GAME && <ScienceGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.MEMORY_GAME && <MemoryGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.RHYTHM_GAME && <RhythmGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.GEOMETRY_GAME && <GeometryGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.LOGIC_GAME && <LogicGameScreen onBack={() => setScreen(Screen.HUB)} />}
      {screen === Screen.CODE_GAME && <CodeGameScreen onBack={() => setScreen(Screen.HUB)} />}

      {screen === Screen.PARENTS && (
         <ParentPanel 
            user={user}
            onUpdateUser={setUser}
            onLogout={handleLogout}
            onBack={() => setScreen(Screen.HUB)}
            onRequestUpgrade={() => { setScreen(Screen.DASHBOARD); setTimeout(() => setShowSubscriptionModal(true), 100); }}
         />
      )}

      {screen === Screen.CHECKOUT && pendingSubscriptionTier && (
         <CheckoutScreen 
            user={user}
            tier={pendingSubscriptionTier}
            onConfirm={() => { setUser({...user, subscription: pendingSubscriptionTier}); setScreen(Screen.PAYMENT_SUCCESS); }}
            onCancel={() => setScreen(Screen.DASHBOARD)}
         />
      )}

      {screen === Screen.PAYMENT_SUCCESS && <PaymentSuccessScreen onContinue={() => setScreen(Screen.TERMS)} />}

      {screen === Screen.TERMS && (
         <TermsScreen 
           userId={user.id} 
           onAccept={handleTermsAccepted} 
           onReject={handleLogout} 
         />
      )}

      {showParentGate && <ParentGate action={gateAction === 'upgrade' ? 'fazer compras e liberar novos mundos' : 'acessar área dos pais'} onSuccess={() => { setShowParentGate(false); if (gateAction === 'upgrade') setShowSubscriptionModal(true); else setScreen(Screen.PARENTS); }} onCancel={() => setShowParentGate(false)} />}
      {showSubscriptionModal && <SubscriptionModal onCheckoutStart={(tier) => { setPendingSubscriptionTier(tier); setShowSubscriptionModal(false); setScreen(Screen.CHECKOUT); }} onClose={() => setShowSubscriptionModal(false)} />}
    </div>
  );
}
