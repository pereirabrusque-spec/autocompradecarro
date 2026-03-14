import { supabase } from '../lib/supabase';

export const chatService = {
  async sendMessage(conversationId: string, content: string, isAutomated = false) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, sender_id: supabase.auth.getUser(), content, is_automated: isAutomated }])
      .select();
    if (error) throw error;
    return data;
  },
  
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
};
