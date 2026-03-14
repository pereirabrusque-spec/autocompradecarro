import { supabase } from './supabase';

export const authManager = {
  async getSession() {
    console.log('[AUTH-MANAGER] Buscando sessão...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[AUTH-MANAGER] Erro ao buscar sessão:', error);
      return null;
    }
    return data.session;
  },

  async handleCallback() {
    console.log('[AUTH-MANAGER] Processando callback de autenticação...');
    
    // 1. Tenta trocar o código da URL pela sessão
    const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    
    if (error) {
      console.error('[AUTH-MANAGER] Erro ao trocar código por sessão:', error);
      // Se falhar a troca, tenta buscar a sessão existente como fallback
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        return { success: true, session: sessionData.session };
      }
      return { success: false, error: error.message };
    }
    
    if (data.session) {
      console.log('[AUTH-MANAGER] Sessão trocada com sucesso!');
      return { success: true, session: data.session };
    }
    
    return { success: false, error: 'Nenhuma sessão encontrada' };
  }
};
