import { supabase } from '../lib/supabase';

export const chatService = {
  async sendMessage(leadId: string, content: string, isAutomated = false) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('mensagens')
      .insert([{ 
        lead_id: leadId, 
        remetente: isAutomated ? 'bot' : (user ? 'admin' : 'cliente'), 
        conteudo: content, 
        metadata: { ai_handled: isAutomated }
      }])
      .select();
    if (error) throw error;
    return data;
  },
  
  async getMessages(leadId: string) {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
};
