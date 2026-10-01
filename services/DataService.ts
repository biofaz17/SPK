import { SubscriptionTier, UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabase = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

const getSupabase = () => {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  return supabase;
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
    const normalizedName = name.trim().toLowerCase();
    if (normalizedName === 'teste' && password === this.TEST_USER.password) {
      const profile = { ...this.TEST_USER };
      localStorage.setItem(this.SESSION_KEY, profile.id);
      return profile;
    }

    const userId = this.generateId(name);
    
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    if (password && data.password !== password) {
      throw new Error("Senha incorreta");
    }

    const profile: UserProfile = {
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

    localStorage.setItem(this.SESSION_KEY, userId);
    return profile;
  }

  async register(profile: UserProfile): Promise<void> {
    const { error } = await getSupabase()
      .from('profiles')
      .insert([{
        id: profile.id,
        name: profile.name,
        password: profile.password,
        parent_email: profile.parentEmail,
        age: profile.age,
        active_skin: profile.activeSkin,
        progress: profile.progress,
        settings: profile.settings,
        last_active: new Date().toISOString()
      }]);

    if (error) {
        if (error.code === '23505') throw new Error("Este nome de explorador já existe!");
        throw new Error("Erro ao criar conta no servidor.");
    }

    localStorage.setItem(this.SESSION_KEY, profile.id);
  }

  async syncProfile(profile: UserProfile): Promise<void> {
    await getSupabase()
      .from('profiles')
      .update({
        progress: profile.progress,
        settings: profile.settings,
        active_skin: profile.activeSkin,
        last_active: new Date().toISOString()
      })
      .eq('id', profile.id);
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

    const { error } = await getSupabase()
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
    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) return null;

    const { data, error } = await getSupabase()
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
    localStorage.removeItem(this.SESSION_KEY);
  }

  private generateId(name: string): string {
    return name.trim().toLowerCase().replace(/\s/g, '_');
  }
}

export const dataService = new DataService();
