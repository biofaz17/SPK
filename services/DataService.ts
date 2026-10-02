/// <reference types="vite/client" />

import { SubscriptionTier, UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
}) : null;

const normalizeName = (value: string, maxLength = 32): string | null => {
  const clean = value.trim().replace(/\s+/g, '_').toLowerCase();
  if (!clean || clean.length > maxLength || !/^[a-z0-9_]+$/.test(clean)) return null;
  return clean;
};

class DataService {
  private SESSION_KEY = 'sparky_session_token';

  private readonly TEST_USER: UserProfile = {
    id: 'testador_total',
    name: 'Testador Sparky',
    password: 'teste123',
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
  };

  async login(name: string, password?: string): Promise<UserProfile | null> {
    const normalizedName = normalizeName(name, 32);
    if (!normalizedName) {
      throw new Error('Nome de explorador inválido');
    }
    if (!password) {
      throw new Error('Digite sua senha');
    }

    if (normalizedName === 'teste' && password === this.TEST_USER.password) {
      const profile = { ...this.TEST_USER };
      sessionStorage.setItem(this.SESSION_KEY, profile.id);
      return profile;
    }

    if (!supabase) throw new Error('Supabase não configurado');

    const email = normalizedName === 'fabio'
      ? 'fabio.gouvea.cabral@hotmail.com'
      : null;
    if (!email) {
      throw new Error('Explorador ainda não migrado para o novo login.');
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      throw new Error('Nome ou senha incorretos.');
    }

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
        last_active
      `)
      .eq('auth_user_id', authData.user.id)
      .single();

    if (error || !data) return null;

    const profile: UserProfile = {
      id: data.id,
      name: data.name,
      parentEmail: data.parent_email,
      age: data.age,
      subscription: data.subscription,
      activeSkin: data.active_skin,
      progress: data.progress,
      settings: data.settings,
      lastActive: data.last_active ? new Date(data.last_active).getTime() : Date.now(),
      isGuest: false,
    };

    sessionStorage.setItem(this.SESSION_KEY, profile.id);
    return profile;
  }

  async register(profile: UserProfile): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: profile.id,
        name: profile.name,
        password: profile.password,
        parent_email: profile.parentEmail,
        age: profile.age,
        subscription: profile.subscription,
        active_skin: profile.activeSkin,
        progress: profile.progress,
        settings: profile.settings,
        last_active: new Date().toISOString()
      }]);

    if (error) {
        if (error.code === '23505') throw new Error("Este nome de explorador já existe!");
        throw new Error("Erro ao criar conta no servidor.");
    }

    sessionStorage.setItem(this.SESSION_KEY, profile.id);
  }

  async syncProfile(profile: UserProfile): Promise<void> {
    if (!supabase) return;

    await supabase
      .from('profiles')
      .update({
        progress: profile.progress,
        settings: profile.settings,
        active_skin: profile.activeSkin,
        subscription: profile.subscription,
        last_active: new Date().toISOString()
      })
      .eq('id', profile.id);
  }

  /**
   * Obtém todos os perfis cadastrados (Admin only)
   */
  async getAllProfiles(): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_active', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async acceptTerms(userId: string, version: string): Promise<{ success: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    let userIp = '0.0.0.0';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      userIp = ipData.ip;
    } catch (e) {
      console.warn("Não foi possível capturar o IP para o log legal.");
    }

    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
      .from('profiles')
      .update({
        terms_accepted_version: version,
        terms_accepted_at: timestamp,
        terms_log: {
            ip: userIp,
            ua: navigator.userAgent,
            version: version
        }
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true, timestamp };
  }

  async checkSession(): Promise<UserProfile | null> {
    const sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) return null;
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        password: data.password,
        parentEmail: data.parent_email,
        age: data.age,
        subscription: data.subscription,
        activeSkin: data.active_skin,
        progress: data.progress,
        settings: data.settings,
        lastActive: new Date(data.last_active).getTime(),
        termsAcceptedVersion: data.terms_accepted_version,
        termsAcceptedAt: data.terms_accepted_at
    };
  }

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  private generateId(name: string): string {
    const safe = normalizeName(name, 32);
    return safe || 'guest';
  }
}

export const dataService = new DataService();
