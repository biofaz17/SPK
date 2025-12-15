
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
import { Mail } from 'lucide-react';

// Enhanced Toast Notification
const NotificationToast = ({ msg, subMsg, show }: { msg: string, subMsg?: string, show: boolean }) => (
   <div className={`fixed top-4 right-4 bg-white border-l-4 border-green-500 text-slate-800 px-6 py-4 rounded-r-xl shadow-2xl z-[100] transition-transform duration-500 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-start gap-3">
         <div className="bg-green-100 p-2 rounded-full text-green-600">
            <Mail size={20} />
         </div>
         <div>
            <div className="font-bold text-sm">{msg}</div>
            {subMsg && <div className="text-xs text-slate-500 mt-1">{subMsg}</div>}
         </div>
      </div>
   </div>
);

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
  
  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // UX State
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [gateAction, setGateAction] = useState(''); // What triggered the gate?
  const [notification, setNotification] = useState({ title: '', body: '' });
  
  // Payment Flow State
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);

  // PERSISTENCE LOGIC: Save user state whenever it changes
  useEffect(() => {
    if (user && !user.isGuest) {
      const storageKey = `sparky_user_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(user));
    }
  }, [user]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    setScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    setScreen(Screen.AUTH);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const showNotification = (title: string, body: string = '') => {
     setNotification({ title, body });
     setTimeout(() => setNotification({ title: '', body: '' }), 5000);
  };

  const handleLevelComplete = (blocksUsed: number) => {
    if (!user) return;

    if (typeof currentLevelId === 'number') {
        // Find current level index in the sorted levels list
        const sortedLevels = [...LEVELS].sort((a,b) => (a.id as number) - (b.id as number));
        const currentIndex = sortedLevels.findIndex(l => l.id === currentLevelId);
        
        let nextLevelId = currentLevelId; // Default fallback
        
        if (currentIndex !== -1 && currentIndex < sortedLevels.length - 1) {
            // Try to find the next level in the SAME age group first
            const currentLevel = sortedLevels[currentIndex];
            const nextPotential = sortedLevels[currentIndex + 1];
            
            if (nextPotential.ageGroup === currentLevel.ageGroup) {
                 nextLevelId = nextPotential.id as number;
            }
        }

        const newProgress = {
          ...user.progress,
          unlockedLevels: Math.max(user.progress.unlockedLevels, (nextLevelId as number)),
          stars: user.progress.stars + 1,
          totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        
        // Update user state and Last Active timestamp
        const updatedUser = { 
            ...user, 
            progress: newProgress,
            lastActive: Date.now() 
        };
        setUser(updatedUser);

        // --- PARENT NOTIFICATION LOGIC ---
        if (!user.isGuest) {
            console.log(`[SERVICE] Sending progress report to ${user.parentEmail}...`);
            // Only show toast occasionally or for big milestones to not annoy
            if (user.progress.stars % 5 === 0) {
                showNotification(
                    `Progresso Salvo!`, 
                    `Dados sincronizados com o painel do Responsável.`
                );
            }
        }

        if (nextLevelId !== currentLevelId) {
          setScreen(Screen.MAP);
        } else {
          setScreen(Screen.DASHBOARD);
          alert("Você completou esta etapa! Confira os próximos desafios no mapa.");
        }
    } else {
        // Creative mode done
        const newProgress = { 
            ...user.progress, 
            creativeProjects: user.progress.creativeProjects + 1,
            totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
        };
        setUser({ ...user, progress: newProgress, lastActive: Date.now() });
        setScreen(Screen.DASHBOARD);
    }
  };

  // --- Parent Gate Logic ---
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

  // --- Payment Flow Logic ---
  const handleCheckoutStart = (tier: SubscriptionTier) => {
     setPendingSubscriptionTier(tier);
     setShowSubscriptionModal(false);
     setScreen(Screen.CHECKOUT);
  };

  const handlePaymentComplete = () => {
     if (user && pendingSubscriptionTier) {
        // Update user: remove guest status if successful (assuming data collection in checkout handles implicit registration logic for this demo)
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

  if (screen === Screen.AUTH) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (!user) return null; // Should not happen

  return (
    <div className="antialiased text-slate-800 font-sans">
      <NotificationToast 
        msg={notification.title} 
        subMsg={notification.body} 
        show={!!notification.title} 
      />

      {screen === Screen.DASHBOARD && (
        <Dashboard 
           progress={user.progress}
           onPlayMission={() => setScreen(Screen.MAP)}
           onCreativeMode={() => {
              setCurrentLevelId('creative');
              setScreen(Screen.GAME);
           }}
           onOpenParents={() => triggerParentGate('parents_area')}
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
        />
      )}

      {screen === Screen.PARENTS && (
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
      )}

      {/* Payment Screens */}
      {screen === Screen.CHECKOUT && pendingSubscriptionTier && (
         <CheckoutScreen 
            user={user}
            tier={pendingSubscriptionTier}
            onConfirm={handlePaymentComplete}
            onCancel={handlePaymentCancel}
         />
      )}

      {screen === Screen.PAYMENT_SUCCESS && (
         <PaymentSuccessScreen 
            onContinue={() => setScreen(Screen.DASHBOARD)}
         />
      )}

      {/* Modals */}
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
