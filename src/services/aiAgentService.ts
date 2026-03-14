import { supabase } from '../lib/supabase';
import { chatService } from './chatService';

export const aiAgentService = {
  async processMessage(conversationId: string, message: string, role: string) {
    // 1. Buscar regras do agente para o cargo
    const { data: rules } = await supabase
      .from('ai_agent_rules')
      .select('*')
      .eq('role', role)
      .single();

    // 2. Chamar IA (Gemini) com as regras
    // (Simulação de chamada à API do Gemini)
    const response = "Resposta automática baseada nas regras: " + rules?.negotiation_rules;

    // 3. Salvar resposta
    await chatService.sendMessage(conversationId, response, true);
  },

  async autoInteractClient(conversationId: string, offerAmount: number) {
    // Lógica para enviar proposta ao cliente
    const message = `Olá! Recebemos uma proposta de R$ ${offerAmount} no seu veículo. Você aceita?`;
    await chatService.sendMessage(conversationId, message, true);
  }
};
