import { supabase } from '../lib/supabase';

export const userService = {
  async promoteUser(userId: string, newRole: 'client' | 'buyer' | 'buyer_premium' | 'buyer_master') {
    console.log(`[USER-SERVICE] Promovendo usuário ${userId} para ${newRole}...`);
    
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole
    });

    if (error) {
      console.error('[USER-SERVICE] Erro ao promover usuário:', error);
      throw error;
    }
    
    console.log('[USER-SERVICE] Usuário promovido com sucesso!');
    return { success: true };
  }
};
