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
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH-MANAGER] Erro no callback:', error);
      return { success: false, error };
    }
    
    if (data.session) {
      console.log('[AUTH-MANAGER] Sessão recuperada com sucesso!');
      return { success: true, session: data.session };
    }
    
    return { success: false, error: 'Nenhuma sessão encontrada' };
  }
};
