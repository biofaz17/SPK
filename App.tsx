
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { PlatformHub } from './screens/PlatformHub';
import { LevelMap } from './screens/LevelMap';
import { GameScreen } from './screens/GameScreen';
import { FinalProjectScreen } from './screens/FinalProjectScreen';
import { Dashboard } from './screens/Dashboard';
import { ParentPanel } from './screens/ParentPanel';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PaymentSuccessScreen } from './screens/PaymentSuccessScreen';
import { PaymentStatusScreen, type PaymentStatus } from './screens/PaymentStatusScreen';
import { TermsScreen } from './screens/TermsScreen';
import { MathGameScreen } from './screens/MathGameScreen';
import { WordsGameScreen } from './screens/WordsGameScreen';
import { ScienceGameScreen } from './screens/ScienceGameScreen';
import { MemoryGameScreen } from './screens/MemoryGameScreen';
import { RhythmGameScreen } from './screens/RhythmGameScreen';
import { GeometryGameScreen } from './screens/GeometryGameScreen';
import { LogicGameScreen } from './screens/LogicGameScreen';
import { CodeGameScreen } from './screens/CodeGameScreen';
import { CreativeWorkshopScreen } from './screens/CreativeWorkshopScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { UserProfile, SubscriptionTier, LevelConfig } from './types';
import { FIRST_PRO_EXPANSION_LEVEL_ID, LEGACY_LEVELS, PRO_EXPANSION_LEVELS } from './constants';
import { FINAL_PROJECT_LEVELS } from './finalProjectLevels';
import { ParentGate } from './components/ParentGate';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SparkyAssistant } from './components/SparkyAssistant';
import { StatusIndicator } from './components/StatusIndicator';
import { ArrowLeft, Cloud, Loader2, ShieldCheck } from 'lucide-react';
import { audioService } from './services/AudioService';
import { dataService } from './services/DataService';

enum Screen {
  AUTH, HUB, DASHBOARD, MAP, GAME, MATH_GAME, WORDS_GAME, 
  SCIENCE_GAME, MEMORY_GAME, RHYTHM_GAME, GEOMETRY_GAME, 
  LOGIC_GAME, CODE_GAME, CREATIVE_WORKSHOP, PARENTS, CHECKOUT, PAYMENT_STATUS, PAYMENT_SUCCESS, TERMS,
  ADMIN_LOGIN, ADMIN_DASHBOARD
}

const CURRENT_TERMS_VERSION = "v1.0";

type PaymentReference = { orderId: string } | { paymentId: string };
type PaymentCheck = { status: PaymentStatus; reference?: PaymentReference };
type UnpaidStatus = 'pending' | 'rejected' | 'cancelled';
type CheckoutIntent = { tier: SubscriptionTier; returnScreen: Screen };
const ORDER_ID_PATTERN = /^ORD(?:TST)?[0-9A-HJKMNP-TV-Z]{26}$/;
const PAYMENT_CALLBACK_PARAMETERS = [
  'order_id', 'payment_id', 'collection_id', 'collection_status', 'status', 'status_detail',
  'external_reference', 'payment_type', 'merchant_order_id', 'preference_id', 'site_id',
  'processing_mode', 'merchant_account_id',
];
const ORDER_STORAGE_DURATION = 7 * 24 * 60 * 60 * 1000;

const orderStorageKey = (userId: string) => 'sparky_checkout_order:' + userId;

function readCheckoutOrder(userId: string): string | null {
  try {
    const key = orderStorageKey(userId);
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (saved && typeof saved.orderId === 'string' && ORDER_ID_PATTERN.test(saved.orderId)
      && typeof saved.expiresAt === 'number' && saved.expiresAt > Date.now()) {
      return saved.orderId;
    }
    sessionStorage.removeItem(key);
  } catch {
    // Checkout can still use the information in the return URL.
  }
  return null;
}

function rememberCheckoutOrder(userId: string, orderId?: string) {
  try {
    const key = orderStorageKey(userId);
    if (orderId && ORDER_ID_PATTERN.test(orderId)) {
      sessionStorage.setItem(key, JSON.stringify({ orderId, expiresAt: Date.now() + ORDER_STORAGE_DURATION }));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Checkout can still use the information in the return URL.
  }
}

function clearPaymentReturn() {
  const url = new URL(window.location.href);
  for (const key of PAYMENT_CALLBACK_PARAMETERS) url.searchParams.delete(key);
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
}

function readUnpaidStatus(value: unknown): UnpaidStatus | undefined {
  if (value === 'pending' || value === 'in_process') return 'pending';
  if (value === 'rejected' || value === 'failure') return 'rejected';
  if (value === 'cancelled' || value === 'canceled') return 'cancelled';
}

function getProfileScreen(profile: UserProfile) {
  return profile.subscription !== SubscriptionTier.FREE && profile.termsAcceptedVersion !== CURRENT_TERMS_VERSION
    ? Screen.TERMS
    : Screen.HUB;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<number | string>(1);
  const [customLevel, setCustomLevel] = useState<LevelConfig | null>(null);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [gateAction, setGateAction] = useState<'upgrade' | 'parents_area' | 'resume_checkout'>('parents_area');
  const [pendingSubscriptionTier, setPendingSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminSessionExpired, setAdminSessionExpired] = useState(false);
  const [paymentCheck, setPaymentCheck] = useState<PaymentCheck | null>(null);

  const confirmPayment = useCallback(async (profile: UserProfile, reference: PaymentReference) => {
    setPaymentCheck({ status: 'checking', reference });
    setScreen(Screen.PAYMENT_STATUS);
    try {
      const response = await fetch('/api/payment-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reference, userId: profile.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      const subscription = result?.subscription;
      if (response.ok && (subscription === SubscriptionTier.STARTER || subscription === SubscriptionTier.PRO)
        && (!('orderId' in reference) || result?.status === 'approved')) {
        if ('orderId' in reference && readCheckoutOrder(profile.id) === reference.orderId) {
          rememberCheckoutOrder(profile.id);
        }
        clearPaymentReturn();
        setUser(current => current?.id === profile.id ? { ...current, subscription } : current);
        setPaymentCheck(null);
        setScreen(current => current === Screen.PAYMENT_STATUS ? Screen.PAYMENT_SUCCESS : current);
        return;
      }

      const status = response.status === 409 ? readUnpaidStatus(result?.status) : undefined;
      if (status === 'pending' && 'orderId' in reference && readCheckoutOrder(profile.id) !== reference.orderId) {
        rememberCheckoutOrder(profile.id, reference.orderId);
      }
      if (status === 'rejected' || status === 'cancelled') {
        if ('orderId' in reference && readCheckoutOrder(profile.id) === reference.orderId) {
          rememberCheckoutOrder(profile.id);
        }
        clearPaymentReturn();
      }
      setPaymentCheck({ status: status ?? 'unavailable', reference });
    } catch {
      setPaymentCheck({ status: 'unavailable', reference });
    }
  }, []);

  const continueWithProfile = useCallback((profile: UserProfile) => {
    setUser(profile);
    if (profile.isGuest) {
      setScreen(Screen.HUB);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const callbackOrderId = params.get('order_id');
    const orderId = callbackOrderId && ORDER_ID_PATTERN.test(callbackOrderId)
      ? callbackOrderId
      : readCheckoutOrder(profile.id);
    const paymentId = [params.get('payment_id'), params.get('collection_id')]
      .find(value => value !== null && /^\d+$/.test(value));
    const reference = orderId ? { orderId } : paymentId ? { paymentId } : undefined;
    if (reference) {
      void confirmPayment(profile, reference);
      return;
    }

    const status = readUnpaidStatus(params.get('collection_status')) ?? readUnpaidStatus(params.get('status'));
    if (status) {
      setPaymentCheck({ status });
      setScreen(Screen.PAYMENT_STATUS);
      return;
    }
    setScreen(getProfileScreen(profile));
  }, [confirmPayment]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/admin') {
        setScreen(current => current === Screen.ADMIN_DASHBOARD ? current : Screen.ADMIN_LOGIN);
      } else {
        setScreen(current => current === Screen.ADMIN_LOGIN || current === Screen.ADMIN_DASHBOARD ? Screen.AUTH : current);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (screen !== Screen.ADMIN_LOGIN && screen !== Screen.ADMIN_DASHBOARD) {
      setAdminToken(null);
      setAdminSessionExpired(false);
    }
  }, [screen]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (window.location.hash === '#/admin') {
          setScreen(Screen.ADMIN_LOGIN);
          setIsInitializing(false);
          return;
        }

        const sessionUser = await dataService.checkSession();
        if (sessionUser && !cancelled && window.location.hash !== '#/admin') continueWithProfile(sessionUser);
      } catch (e) {
        console.error("Falha na inicialização", e);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };
    void init();
    return () => { cancelled = true; };
  }, [continueWithProfile]);

  const exitAdmin = useCallback(() => {
    setAdminToken(null);
    setAdminSessionExpired(false);
    window.location.hash = '';
    setScreen(Screen.AUTH);
  }, []);

  const expireAdminSession = useCallback(() => {
    setAdminToken(null);
    setAdminSessionExpired(true);
    setScreen(Screen.ADMIN_LOGIN);
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

  useEffect(() => {
    if (screen !== Screen.HUB || !user || user.isGuest || !checkoutIntent) return;
    if (user.subscription === SubscriptionTier.PRO || user.subscription === checkoutIntent.tier) {
      setCheckoutIntent(null);
      return;
    }
    setGateAction('resume_checkout');
    setShowParentGate(true);
  }, [screen, user, checkoutIntent]);

  const handleLogin = (profile: UserProfile) => {
    continueWithProfile(profile);
    audioService.playSfx('start');
  };

  const handleLogout = async () => {
    await dataService.logout();
    setCheckoutIntent(null);
    setUser(null);
    setScreen(Screen.AUTH);
    window.location.hash = ''; 
    audioService.playSfx('delete');
  };

  const startCheckout = (tier: SubscriptionTier) => {
    if (!user || tier === SubscriptionTier.FREE) return;
    setShowSubscriptionModal(false);
    if (user.isGuest) {
      setCheckoutIntent({ tier, returnScreen: screen });
      setScreen(Screen.AUTH);
      return;
    }
    setPendingSubscriptionTier(tier);
    setScreen(Screen.CHECKOUT);
  };

  const handleParentGateSuccess = () => {
    setShowParentGate(false);
    if (gateAction === 'parents_area') {
      setScreen(Screen.PARENTS);
    } else if (gateAction === 'upgrade') {
      setShowSubscriptionModal(true);
    } else if (checkoutIntent && user && !user.isGuest) {
      setCheckoutIntent(null);
      startCheckout(checkoutIntent.tier);
    }
  };

  const handleParentGateCancel = () => {
    setShowParentGate(false);
    if (gateAction === 'resume_checkout') setCheckoutIntent(null);
  };

  const canPlayLevel = (id: string | number) =>
    typeof id !== 'number' || !PRO_EXPANSION_LEVELS.some(level => level.id === id) || (
      user?.subscription === SubscriptionTier.PRO &&
      id <= (user.progress.unlockedProLevel ?? FIRST_PRO_EXPANSION_LEVEL_ID)
    );

  const handleLevelComplete = (blocksUsed: number) => {
    if (!user || !canPlayLevel(currentLevelId)) return;
    if (typeof currentLevelId === 'number') {
        const expansionIndex = PRO_EXPANSION_LEVELS.findIndex(level => level.id === currentLevelId);
        if (expansionIndex !== -1) {
            const unlockedProLevel = user.progress.unlockedProLevel ?? FIRST_PRO_EXPANSION_LEVEL_ID;

            const nextLevel = PRO_EXPANSION_LEVELS[expansionIndex + 1];
            const progress = {
                ...user.progress,
                unlockedProLevel: Math.max(unlockedProLevel, nextLevel ? Number(nextLevel.id) : currentLevelId + 1),
                stars: user.progress.stars + 1,
                totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed,
            };
            setUser({ ...user, progress, lastActive: Date.now() });
            if (nextLevel) setCurrentLevelId(nextLevel.id);
            else setScreen(Screen.MAP);
            return;
        }

        const sortedLevels = [...LEGACY_LEVELS].sort((a,b) => (a.id as number) - (b.id as number));
        const currentIndex = sortedLevels.findIndex(l => l.id === currentLevelId);
        let nextLevelId = currentLevelId; 
        let hasNext = false;
        if (currentIndex !== -1 && currentIndex < sortedLevels.length - 1) {
            const nextLevel = sortedLevels[currentIndex + 1];
            if (currentLevelId === 15 && user.subscription === SubscriptionTier.FREE) {
                const newProgress = { ...user.progress, stars: user.progress.stars + 1, totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed };
                setUser({ ...user, progress: newProgress, lastActive: Date.now() });
                setScreen(Screen.MAP);
                setGateAction('upgrade');
                setShowParentGate(true);
                return;
            }
            nextLevelId = nextLevel.id as number;
            hasNext = true;
        }
        const newProgress = { ...user.progress, unlockedLevels: Math.max(user.progress.unlockedLevels, hasNext ? nextLevelId : currentLevelId), stars: user.progress.stars + 1, totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed };
        setUser({ ...user, progress: newProgress, lastActive: Date.now() });
        if (hasNext) { setCurrentLevelId(nextLevelId); setScreen(Screen.GAME); } 
        else { setScreen(Screen.DASHBOARD); }
    } else {
        const newProgress = { ...user.progress, creativeProjects: user.progress.creativeProjects + 1, totalBlocksUsed: user.progress.totalBlocksUsed + blocksUsed };
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

  if (screen === Screen.ADMIN_LOGIN) {
    return <AdminLogin sessionExpired={adminSessionExpired} onAccess={token => { setAdminToken(token); setAdminSessionExpired(false); setScreen(Screen.ADMIN_DASHBOARD); }} onCancel={exitAdmin} />;
  }

  if (screen === Screen.ADMIN_DASHBOARD && adminToken) {
    return <AdminDashboard token={adminToken} onExit={exitAdmin} onSessionExpired={expireAdminSession} />;
  }

  if (screen === Screen.AUTH) {
    return <AuthScreen
      onLogin={handleLogin}
      onAdminTrigger={() => { window.location.hash = '/admin'; }}
      onBackFromCheckout={checkoutIntent && user?.isGuest ? () => {
        setScreen(checkoutIntent.returnScreen);
        setCheckoutIntent(null);
      } : undefined}
    />;
  }
  if (!user) return null; 
  if (screen === Screen.PAYMENT_STATUS && paymentCheck) {
    const { status, reference } = paymentCheck;
    return <PaymentStatusScreen
      status={status}
      onRetry={reference ? () => { void confirmPayment(user, reference); } : undefined}
      onContinue={() => {
        const keepOrderReturn = (status === 'pending' || status === 'unavailable')
          && reference && 'orderId' in reference && readCheckoutOrder(user.id) !== reference.orderId;
        if (!keepOrderReturn) clearPaymentReturn();
        setPaymentCheck(null);
        setScreen(getProfileScreen(user));
      }}
    />;
  }

  const canPlayCurrentLevel = canPlayLevel(currentLevelId);
  const finalProjectLevel = FINAL_PROJECT_LEVELS.find(level => level.id === currentLevelId);

  return (
    <div className="antialiased text-slate-800 font-sans selection:bg-indigo-100">
      <div className="fixed bottom-6 left-6 z-[100] pointer-events-none">
          <StatusIndicator isSaving={isSyncing} isGuest={user?.isGuest} className="shadow-2xl bg-slate-900/80 text-white p-4" />
      </div>
      
      {user && ![Screen.GAME, Screen.MATH_GAME, Screen.MEMORY_GAME, Screen.RHYTHM_GAME, Screen.TERMS, Screen.CODE_GAME, Screen.CREATIVE_WORKSHOP].includes(screen) && (
         <SparkyAssistant user={user} />
      )}

      {screen === Screen.HUB && (
        <PlatformHub user={user} onSelectGame={(id) => {
              if (id === 'sparky') setScreen(Screen.DASHBOARD);
              else if (id === 'math') setScreen(Screen.MATH_GAME);
              else if (id === 'words') setScreen(Screen.WORDS_GAME);
              else if (id === 'science') setScreen(Screen.SCIENCE_GAME);
              else if (id === 'memory') setScreen(Screen.MEMORY_GAME);
              else if (id === 'rhythm') setScreen(Screen.RHYTHM_GAME);
              else if (id === 'geometry') setScreen(Screen.GEOMETRY_GAME);
              else if (id === 'logic') setScreen(Screen.LOGIC_GAME);
              else if (id === 'code') setScreen(Screen.CODE_GAME);
           }} onLogout={handleLogout} onOpenParents={() => { setGateAction('parents_area'); setShowParentGate(true); }}
        />
      )}

      {screen === Screen.DASHBOARD && (
        <Dashboard 
          progress={user.progress} 
          onPlayMission={() => setScreen(Screen.MAP)} 
          onCreativeMode={() => setScreen(Screen.CREATIVE_WORKSHOP)} 
          onOpenParents={() => { setGateAction('parents_area'); setShowParentGate(true); }} 
          onBackToHub={() => setScreen(Screen.HUB)}
        />
      )}
      
      {(screen === Screen.MAP || (screen === Screen.GAME && !canPlayCurrentLevel)) && (
        <LevelMap unlockedLevels={user.progress.unlockedLevels} unlockedProLevel={user.progress.unlockedProLevel} userSubscription={user.subscription} onSelectLevel={(id) => { if (canPlayLevel(id)) { setCurrentLevelId(id); setScreen(Screen.GAME); } }} onBack={() => setScreen(Screen.DASHBOARD)} onHome={() => setScreen(Screen.HUB)} onRequestUpgrade={() => { setGateAction('upgrade'); setShowParentGate(true); }} />
      )}

      {screen === Screen.CREATIVE_WORKSHOP && (
        <CreativeWorkshopScreen 
          onBack={() => setScreen(Screen.DASHBOARD)} 
          onPlayLevel={(config) => {
            setCustomLevel(config);
            setCurrentLevelId('creative');
            setScreen(Screen.GAME);
          }}
        />
      )}

      {screen === Screen.GAME && canPlayCurrentLevel && (
        finalProjectLevel ? (
          <FinalProjectScreen
            level={finalProjectLevel}
            onBack={() => setScreen(Screen.MAP)}
            onComplete={() => handleLevelComplete(0)}
            soundEnabled={user.settings?.soundEnabled}
            profileId={user.id}
          />
        ) : (
          <GameScreen
            levelId={currentLevelId}
            customConfig={currentLevelId === 'creative' ? customLevel : undefined}
            onBack={() => currentLevelId === 'creative' ? setScreen(Screen.CREATIVE_WORKSHOP) : setScreen(Screen.MAP)}
            onHome={() => setScreen(Screen.HUB)}
            onNextLevel={handleLevelComplete}
            user={user}
            onUpdateSkin={(skinId) => setUser({ ...user, activeSkin: skinId })}
          />
        )
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
         <ParentPanel user={user} onUpdateUser={setUser} onLogout={handleLogout} onBack={() => setScreen(Screen.HUB)} onRequestUpgrade={() => { setScreen(Screen.DASHBOARD); setTimeout(() => setShowSubscriptionModal(true), 100); }} />
      )}

      {screen === Screen.CHECKOUT && pendingSubscriptionTier && !user.isGuest && (
        <CheckoutScreen
          user={user}
          tier={pendingSubscriptionTier}
          onCancel={() => setScreen(Screen.DASHBOARD)}
          onCheckoutCreated={orderId => rememberCheckoutOrder(user.id, orderId)}
        />
      )}

      {screen === Screen.PAYMENT_SUCCESS && <PaymentSuccessScreen onContinue={() => setScreen(Screen.TERMS)} />}

      {screen === Screen.TERMS && (
         <TermsScreen userId={user.id} onAccept={(v, t) => { setUser({ ...user, termsAcceptedVersion: v, termsAcceptedAt: t }); setScreen(Screen.HUB); }} onReject={handleLogout} />
      )}

      {showParentGate && (
        <ParentGate
          action={gateAction === 'parents_area' ? 'acessar área dos pais' : 'fazer compras e liberar novos mundos'}
          onSuccess={handleParentGateSuccess}
          onCancel={handleParentGateCancel}
        />
      )}
      {showSubscriptionModal && <SubscriptionModal onCheckoutStart={startCheckout} onClose={() => setShowSubscriptionModal(false)} />}
    </div>
  );
}

const AdminLogin: React.FC<{ onAccess: (token: string) => void; onCancel: () => void; sessionExpired: boolean }> = ({ onAccess, onCancel, sessionExpired }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController>();

  useEffect(() => () => request.current?.abort(), []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
      });
      if (controller.signal.aborted) return;
      if (response.status === 400 || response.status === 401) return setError('Senha administrativa inválida.');
      if (response.status === 429) return setError('Limite de tentativas atingido. Aguarde alguns minutos.');
      if (response.status === 503) return setError('O acesso administrativo precisa ser configurado no servidor.');
      if (!response.ok) throw new Error();
      const { token } = await response.json();
      if (typeof token !== 'string' || !token) throw new Error();
      if (!controller.signal.aborted) onAccess(token);
    } catch {
      if (!controller.signal.aborted) setError('Não foi possível entrar. Tente novamente.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <main className="sparky-admin admin-login">
      <form onSubmit={handle} className="admin-panel admin-login-card">
        <span className="admin-brand-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
        <div><h1>Administração do Sparky</h1><p>Acesso reservado ao dono do site.</p></div>
        {sessionExpired && <p className="admin-feedback admin-feedback-warning" role="status">Sua sessão expirou. Entre novamente.</p>}
        <label>Senha administrativa
          <input type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} maxLength={128} required />
        </label>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="admin-button admin-button-primary">{loading ? 'Entrando…' : 'Entrar no painel'}</button>
        <button type="button" className="admin-text-button" onClick={onCancel}><ArrowLeft size={16} aria-hidden="true" /> Voltar ao Sparky</button>
      </form>
    </main>
  );
};
