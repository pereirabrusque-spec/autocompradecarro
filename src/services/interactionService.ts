import { supabase } from '../lib/supabase';

export const interactionService = {
  async logWhatsAppClick(clientId: string, vehicleId: string) {
    console.log(`[INTERACTION] Registrando clique para cliente ${clientId}...`);
    
    const { error } = await supabase.rpc('log_lead_interaction', {
      p_client_id: clientId,
      p_vehicle_id: vehicleId
    });

    if (error) {
      console.error('[INTERACTION] Erro ao registrar:', error);
      throw error;
    }
    
    return { success: true };
  }
};
