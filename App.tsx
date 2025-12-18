
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { LevelMap } from './screens/LevelMap';
import { GameScreen } from './screens/GameScreen';
import { Dashboard } from './screens/Dashboard';
import { ParentPanel } from './screens/ParentPanel';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { UserProfile, SubscriptionTier, AppStats } from './types';
import { LEVELS, PLANS } from './constants';
import { ParentGate } from './components/ParentGate';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MarketingModal } from './components/MarketingModal';
import { Mail } from 'lucide-react';

// Enhanced Toast Notification with explicit type checks to avoid React Error #31
const NotificationToast = ({ msg, subMsg, show }: { msg: any, subMsg?: any, show: boolean }) => {
  const safeText = (text: any) => {
    if (typeof text === 'string' || typeof text === 'number') return text;
    return '';
  };

  return (
    <div className={`fixed top-4 right-4 bg-white border-l-4 border-green-500 text-slate-800 px-6 py-4 rounded-r-xl shadow-2xl z-[100] transition-transform duration-500 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-start gap-3">
        <div className="bg-green-100 p-2 rounded-full text-green-600">
          <Mail size={20} />
        </div>
        <div>
          <div className="font-bold text-sm">{safeText(msg)}</div>
          {subMsg && <div className="text-xs text-slate-500 mt-1">{safeText(subMsg)}</div>}
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
  PAYMENT_SUCCESS,
  ADMIN
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [gateAction, setGateAction] = useState('');
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);

  // Telemetria
  const trackEvent = (type: 'login' | 'register' | 'payment' | 'level', value?: any) => {
    try {
      const statsStr = localStorage.getItem('sparky_admin_stats');
      const stats: AppStats = statsStr ? JSON.parse(statsStr) : {
        totalLogins: 0,
        totalRegisters: 0,
        totalRevenue: 0,
        registrationsByDate: {},
        revenueByDate: {},
        mostPlayedLevels: {},
        activeUsersToday: 0,
        lastUpdate: Date.now()
      };
      const today = new Date().toISOString().split('T')[0];

      if (type === 'login') { stats.totalLogins += 1; stats.activeUsersToday += 1; }
      else if (type === 'register') { stats.totalRegisters += 1; stats.registrationsByDate[today] = (stats.registrationsByDate[today] || 0) + 1; }
      else if (type === 'payment') { const amount = value?.amount || 0; stats.totalRevenue += amount; stats.revenueByDate[today] = (stats.revenueByDate[today] || 0) + amount; }
      else if (type === 'level') { const id = String(value?.levelId); stats.mostPlayedLevels[id] = (stats.mostPlayedLevels[id] || 0) + 1; }

      stats.lastUpdate = Date.now();
      localStorage.setItem('sparky_admin_stats', JSON.stringify(stats));
    } catch (e) { console.error("Admin stats error", e); }
  };

  useEffect(() => {
    const checkSecretRoute = () => {
      // Secret Admin Access via URL Path or Hash
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setScreen(Screen.ADMIN);
      }
    };

    checkSecretRoute();
    window.addEventListener('hashchange', checkSecretRoute);

    const lastId = localStorage.getItem('sparky_last_active_id');
    if (lastId) {
      const stored = localStorage.getItem(`sparky_user_${lastId}`);
      if (stored) {
        setUser(JSON.parse(stored));
        // Don't override Screen.ADMIN if we are accessing it
        setScreen(prev => (prev === Screen.ADMIN ? Screen.ADMIN : Screen.DASHBOARD));
      }
    }
    setIsLoading(false);
    return () => window.removeEventListener('hashchange', checkSecretRoute);
  }, []);

  useEffect(() => {
    if (user && !user.isGuest) {
      localStorage.setItem(`sparky_user_${user.id}`, JSON.stringify(user));
      localStorage.setItem('sparky_last_active_id', user.id);
    }
  }, [user]);

  const showNotification = (title: string, body: string) => {
    setNotification({ title, body });
    setTimeout(() => setNotification({ title: '', body: '' }), 4000);
  };

  const handleLevelComplete = (blocksUsed: number) => {
    if (!user) return;
    trackEvent('level', { levelId: currentLevelId });
    
    if (typeof currentLevelId === 'number') {
      const nextId = currentLevelId + 1;
      const newProgress = {
        ...user.progress,
        unlockedLevels: Math.max(user.progress.unlockedLevels, nextId),
        stars: user.progress.stars + 1,
        totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed
      };
      setUser({ ...user, progress: newProgress });
      setCurrentLevelId(nextId);
      
      if (user.subscription === SubscriptionTier.FREE && currentLevelId % 3 === 0) {
        setShowMarketingModal(true);
      } else {
        setScreen(Screen.MAP);
      }
    } else {
      setScreen(Screen.DASHBOARD);
    }
  };

  if (isLoading) return null;

  // Render Admin independently of user session
  if (screen === Screen.ADMIN) return <AdminDashboard onBack={() => setScreen(user ? Screen.DASHBOARD : Screen.AUTH)} />;

  if (screen === Screen.AUTH && !user) return <AuthScreen onLogin={(u) => { setUser(u); setScreen(Screen.DASHBOARD); trackEvent('login'); }} />;

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden antialiased">
      <NotificationToast msg={notification.title} subMsg={notification.body} show={!!notification.title} />

      <div className="flex-1 overflow-y-auto scrollable-y no-scrollbar md:scrollbar-default">
        {user && (
          <>
            {screen === Screen.DASHBOARD && (
              <Dashboard 
                progress={user.progress} 
                onPlayMission={() => setScreen(Screen.MAP)} 
                onCreativeMode={() => { setCurrentLevelId('creative'); setScreen(Screen.GAME); }} 
                onOpenParents={() => { setGateAction('parents_area'); setShowParentGate(true); }}
              />
            )}
            {screen === Screen.MAP && (
              <LevelMap 
                unlockedLevels={user.progress.unlockedLevels} 
                userSubscription={user.subscription} 
                onSelectLevel={(id) => { setCurrentLevelId(id); setScreen(Screen.GAME); }} 
                onBack={() => setScreen(Screen.DASHBOARD)} 
                onRequestUpgrade={() => { setGateAction('upgrade'); setShowParentGate(true); }}
              />
            )}
            {screen === Screen.GAME && (
              <GameScreen 
                levelId={currentLevelId} 
                onBack={() => setScreen(Screen.MAP)} 
                onNextLevel={handleLevelComplete} 
                user={user} 
                onUpdateSkin={(s) => { setUser({...user, activeSkin: s}); showNotification("Skin alterada!", "Sparky adorou o novo visual."); }}
              />
            )}
            {screen === Screen.PARENTS && (
              <ParentPanel 
                user={user} 
                onUpdateUser={setUser} 
                onLogout={() => { setUser(null); localStorage.removeItem('sparky_last_active_id'); setScreen(Screen.AUTH); }} 
                onBack={() => setScreen(Screen.DASHBOARD)} 
                onRequestUpgrade={() => setShowSubscriptionModal(true)}
              />
            )}
            {screen === Screen.CHECKOUT && pendingSubscriptionTier && (
              <CheckoutScreen user={user} tier={pendingSubscriptionTier} onConfirm={() => setScreen(Screen.PAYMENT_SUCCESS)} onCancel={() => setScreen(Screen.DASHBOARD)} />
            )}
            {screen === Screen.PAYMENT_SUCCESS && <PaymentSuccessScreen onContinue={() => setScreen(Screen.DASHBOARD)} />}
          </>
        )}
      </div>

      {showParentGate && <ParentGate action={gateAction === 'upgrade' ? 'fazer compras' : 'acessar área dos pais'} onSuccess={() => { setShowParentGate(false); if(gateAction === 'upgrade') setShowSubscriptionModal(true); else setScreen(Screen.PARENTS); }} onCancel={() => setShowParentGate(false)} />}
      {showSubscriptionModal && <SubscriptionModal onCheckoutStart={(t) => { setPendingSubscriptionTier(t); setShowSubscriptionModal(false); setScreen(Screen.CHECKOUT); }} onClose={() => setShowSubscriptionModal(false)} />}
      {showMarketingModal && <MarketingModal onUpgrade={() => { setShowMarketingModal(false); setShowSubscriptionModal(true); }} onClose={() => { setShowMarketingModal(false); setScreen(Screen.GAME); }} />}
    </div>
  );
}
