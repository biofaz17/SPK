/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier, UserProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const AUTH_STORAGE_KEY = 'sparky_auth_session';
const LEGACY_SESSION_KEY = 'sparky_session_token';
const TEST_SESSION_KEY = 'sparky_test_session';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: sessionStorage,
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) : null;

type Registration = { name: string; password: string; parentEmail: string; age: number };
type AuthRequest = ({ action: 'login' } & Pick<Registration, 'name' | 'password'>)
  | ({ action: 'register' } & Registration);

class DataService {
  private readonly TEST_USER: UserProfile | null = import.meta.env.DEV ? {
    id: 'testador_total',
    name: 'Testador Sparky',
    parentEmail: 'teste@exemplo.com',
    age: 10,
    subscription: SubscriptionTier.PRO,
    progress: {
      unlockedLevels: 30,
      stars: 150,
      creativeProjects: 5,
      totalBlocksUsed: 5200,
      secretsFound: 12,
    },
    settings: {
      soundEnabled: true,
      musicEnabled: true,
    },
    activeSkin: 'super_sparky',
    isGuest: false,
    lastActive: Date.now(),
    termsAcceptedVersion: 'v1.0',
    termsAcceptedAt: new Date().toISOString(),
  } : null;

  async login(name: string, password: string): Promise<UserProfile> {
    if (this.TEST_USER && name.trim().toLowerCase() === 'teste' && password === 'teste123') {
      sessionStorage.setItem(TEST_SESSION_KEY, this.TEST_USER.id);
      return { ...this.TEST_USER };
    }

    return this.authenticate({ action: 'login', name, password });
  }

  async register(registration: Registration): Promise<UserProfile> {
    return this.authenticate({ action: 'register', ...registration });
  }

  private async authenticate(request: AuthRequest): Promise<UserProfile> {
    if (!supabase) throw new Error('Supabase não configurado.');

    const response = await fetch('/api/explorer-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(20000),
    }).catch(() => {
      throw new Error('Serviço de autenticação indisponível. Tente novamente.');
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(typeof result?.error === 'string'
        ? result.error
        : 'Serviço de autenticação indisponível. Tente novamente.');
    }

    if (typeof result?.access_token !== 'string' || typeof result?.refresh_token !== 'string') {
      throw new Error('O serviço de autenticação retornou uma sessão inválida.');
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error || !data.session) throw new Error('Não foi possível iniciar sua sessão. Tente novamente.');

    try {
      const profile = await this.loadProfile(data.session.user.id);
      if (!profile) throw new Error('O perfil do explorador ainda não está vinculado à conta.');
      sessionStorage.removeItem(TEST_SESSION_KEY);
      return profile;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  private async loadProfile(authUserId: string): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        parent_email,
        age,
        subscription,
        active_skin,
        progress,
        settings,
        last_active,
        terms_accepted_version,
        terms_accepted_at
      `)
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) throw new Error('Não foi possível carregar o perfil do explorador. Tente novamente.');
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      parentEmail: data.parent_email,
      age: data.age,
      subscription: data.subscription,
      activeSkin: data.active_skin,
      progress: data.progress,
      settings: data.settings,
      lastActive: data.last_active ? new Date(data.last_active).getTime() : Date.now(),
      termsAcceptedVersion: data.terms_accepted_version ?? undefined,
      termsAcceptedAt: data.terms_accepted_at ?? undefined,
      isGuest: false,
    };
  }

  async syncProfile(profile: UserProfile): Promise<void> {
    if (!supabase || (this.TEST_USER && sessionStorage.getItem(TEST_SESSION_KEY) === profile.id)) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        progress: profile.progress,
        settings: profile.settings,
        active_skin: profile.activeSkin,
        last_active: new Date().toISOString(),
      })
      .eq('id', profile.id);
    if (error) throw error;
  }

  async acceptTerms(version: string): Promise<{ timestamp: string }> {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data: timestamp, error } = await supabase.rpc('sparky_accept_terms', { p_version: version });
    if (error) throw error;
    if (typeof timestamp !== 'string') throw new Error('Aceite dos termos não registrado.');
    return { timestamp };
  }

  async checkSession(): Promise<UserProfile | null> {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    if (this.TEST_USER && sessionStorage.getItem(TEST_SESSION_KEY) === this.TEST_USER.id) {
      return { ...this.TEST_USER };
    }
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    return session ? this.loadProfile(session.user.id) : null;
  }

  async getAccessToken(): Promise<string | null> {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(TEST_SESSION_KEY);
    try {
      await supabase?.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Não foi possível encerrar a sessão no Supabase.', error);
    } finally {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
}

export const dataService = new DataService();
