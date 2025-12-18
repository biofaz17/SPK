
import { UserProfile } from '../types';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * CONFIGURAÇÃO SUPABASE REAL
 * Utilizando o ID do projeto e a Chave Anon fornecidos pelo usuário.
 */
const SUPABASE_URL = 'https://aluzklqouexuruppwumz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdXprbHFvdWV4dXJ1cHB3dW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjIzMDgsImV4cCI6MjA4MTYzODMwOH0.ChAxpI6gi7RX-W9XShu_21-q1diBfFBSsPgCs8S_o3Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class DataService {
  private SESSION_KEY = 'sparky_session_token';

  /**
   * Tenta encontrar um usuário pelo nome e senha no Banco de Dados Real
   */
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

    // Mapeia do banco para o nosso tipo UserProfile
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
        lastActive: new Date(data.last_active).getTime()
    };

    localStorage.setItem(this.SESSION_KEY, userId);
    return profile;
  }

  /**
   * Cria um novo usuário no banco de dados real
   */
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

  /**
   * Sincroniza o progresso atual com a nuvem (UPDATE real)
   */
  async syncProfile(profile: UserProfile): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        progress: profile.progress,
        settings: profile.settings,
        active_skin: profile.activeSkin,
        last_active: new Date().toISOString()
      })
      .eq('id', profile.id);
  }

  /**
   * Verifica se existe uma sessão ativa ao abrir o app e busca dados frescos do banco
   */
  async checkSession(): Promise<UserProfile | null> {
    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) return null;

    // Busca dados atualizados do banco para garantir que a criança continue de onde parou em outro dispositivo
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
        lastActive: new Date(data.last_active).getTime()
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
