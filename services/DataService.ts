
import { UserProfile } from '../types';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://aluzklqouexuruppwumz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdXprbHFvdWV4dXJ1cHB3dW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjIzMDgsImV4cCI6MjA4MTYzODMwOH0.ChAxpI6gi7RX-W9XShu_21-q1diBfFBSsPgCs8S_o3Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class DataService {
  private SESSION_KEY = 'sparky_session_token';

  async login(name: string, password?: string): Promise<UserProfile | null> {
    const userId = this.generateId(name);
    
    const { data, error } = await supabase
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

    localStorage.setItem(this.SESSION_KEY, profile.id);
  }

  async syncProfile(profile: UserProfile): Promise<void> {
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
    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) return null;

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
    localStorage.removeItem(this.SESSION_KEY);
  }

  private generateId(name: string): string {
    return name.trim().toLowerCase().replace(/\s/g, '_');
  }
}

export const dataService = new DataService();
