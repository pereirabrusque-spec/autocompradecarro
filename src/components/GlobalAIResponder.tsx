import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AIService } from '../services/aiService';

/**
 * Este componente roda em background (carregado no App.tsx ou AdminDashboard.tsx)
 * e monitora a tabela internal_messages para responder automaticamente mensagens sem resposta.
 */
export default function GlobalAIResponder() {
  const processingMessages = useRef<Set<string>>(new Set());
  const aiEnabled = useRef<boolean>(true);

  const aiSettings = useRef({ prompt: '', memory: '' });

  useEffect(() => {
    // Busca configuração de IA ativada e os prompts/memória do comprador
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['AI_CRM_ENABLED', 'AI_SYSTEM_PROMPT', 'AI_MEMORY']);
      if (data) {
        const enabled = data.find(s => s.key === 'AI_CRM_ENABLED');
        const prompt = data.find(s => s.key === 'AI_SYSTEM_PROMPT');
        const memory = data.find(s => s.key === 'AI_MEMORY');
        
        if (enabled) aiEnabled.current = enabled.value === 'true';
        aiSettings.current = {
          prompt: prompt?.value || '',
          memory: memory?.value || ''
        };
      }
    };
    fetchSettings();

    // Varredura inicial de mensagens não respondidas (das últimas 24h)
    const scanUnansweredMessages = async () => {
      const { data: recentMessages, error } = await supabase
        .from('internal_messages')
        .select('*')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error || !recentMessages) return;

      // Agrupar mensagens por conversa (usando o sender_id do comprador como chave)
      // Nota: em internal_messages, se sender_id é o comprador, receiver_id é o admin (ou nulo).
      // Se receiver_id é o comprador, sender_id é o admin.
      const conversations = new Map<string, any[]>();
      recentMessages.forEach(m => {
        const userId = m.sender_id === '00000000-0000-0000-0000-000000000000' ? m.receiver_id : m.sender_id;
        if (!conversations.has(userId)) conversations.set(userId, []);
        conversations.get(userId)?.push(m);
      });

      for (const [userId, msgs] of conversations.entries()) {
        const lastMsg = msgs[0]; // Ordenado decrescente, então o primeiro é o último enviado
        
        // Se a última mensagem for do comprador e não do bot/admin, responde
        if (lastMsg.sender_id === userId && !processingMessages.current.has(lastMsg.id)) {
          console.log(`[GlobalAIResponder] Detectada mensagem não respondida de ${userId}. Iniciando resposta...`);
          handleIncomingMessage(lastMsg);
        }
      }
    };

    scanUnansweredMessages();

    // Inscrição para novas mensagens
    const channel = supabase
      .channel('global_ai_responder')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages' 
      }, async (payload) => {
        if (!aiEnabled.current) return;

        const msg = payload.new;
        
        // Regras para responder:
        // 1. Mensagem enviada para o Admin (receiver_id is null or isAdmin receiver)
        // 2. Remetente não é um Admin (precisamos verificar o perfil)
        // 3. Não estamos processando essa mensagem
        if (!processingMessages.current.has(msg.id)) {
          handleIncomingMessage(msg);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleIncomingMessage = async (msg: any) => {
    try {
      // 1. Verificar se o remetente é um comprador (roles de buyer)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', msg.sender_id)
        .maybeSingle();

      if (!profile || !['buyer', 'buyer_premium', 'buyer_master'].includes(profile.role)) {
        // Não responde se não for comprador (vendedores são tratados pelo ChatAssistant ou suporte dedicado)
        return;
      }

      // 2. Marcar como processando para evitar duplicados
      processingMessages.current.add(msg.id);

      // 3. Aguardar um pouco para ver se o admin responde manualmente
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 4. Verificar se a última mensagem da thread ainda é esta ou se o admin já respondeu
      const { data: thread } = await supabase
        .from('internal_messages')
        .select('id, sender_id')
        .or(`sender_id.eq.${msg.sender_id},receiver_id.eq.${msg.sender_id}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (thread && thread.length > 0 && thread[0].id !== msg.id) {
        // Alguém já mandou mensagem depois, provavelmente resposta humana
        console.log('[GlobalAIResponder] Admin ou usuário já responderam, pulando auto-resposta.');
        return;
      }

      // 5. Buscar contexto do lead se houver
      let leadContext = '';
      if (msg.lead_id) {
        const { data: lead } = await supabase.from('leads_veiculos').select('*').eq('id', msg.lead_id).maybeSingle();
        if (lead) {
          leadContext = `
DADOS DO VEÍCULO EM QUESTÃO:
- Marca/Modelo: ${lead.marca} ${lead.modelo}
- Ano: ${lead.ano_modelo}
- Cor: ${lead.cor}
- KM: ${lead.quilometragem}
- FIPE: R$ ${lead.valor_fipe}
- Preço Repasse: R$ ${lead.preco_cliente || 'Sob consulta'}
- Status: ${lead.status}
- Observações: ${lead.observacoes || 'N/A'}
`;
        }
      }

      // 6. Chamar IA
      const systemInstruction = `
Você é o Assistente Especialista da AUTOCOMPRA, focado em investidores e compradores de veículos de repasse.
Seu objetivo é sanar dúvidas técnicas, agendar visitas e facilitar o fechamento para compradores (Padrão, Premium e Master).

[CONFIGURAÇÕES DO PAINEL - REGRAS DO COMPRADOR]
${aiSettings.current.prompt}

[MEMÓRIA DO AGENTE COMPRADOR]
${aiSettings.current.memory}

DADOS DO CLIENTE:
- Nome: ${profile.full_name || 'Comprador'}
- Nível: ${profile.role === 'buyer_master' ? 'Master' : profile.role === 'buyer_premium' ? 'Premium' : 'Comprador'}

DIRETRIZES GERAIS:
1. Seja técnico, profissional e direto.
2. Compradores Master têm prioridade e acesso a todos os dados.
3. Se o comprador perguntar sobre visita, diga que verificará a agenda e retornará em breve.
4. Se perguntar sobre preço, foque na margem de lucro que o veículo de repasse proporciona.
5. Máximo de 4 linhas por resposta.
6. Estilo WhatsApp.

${leadContext}
`;

      const prompt = `Mensagem do Comprador: ${msg.content}`;
      
      const response = await AIService.generateContent(prompt, systemInstruction);
      const cleanResponse = response.text
        .replace(/{{[ ]*nome[ ]*}}/gi, profile.full_name)
        .replace(/\[[ ]*nome[ ]*\]/gi, profile.full_name);

      // 7. Buscar um admin válido para ser o remetente (evitar UUID inválido 0000...)
      let botSenderId = msg.receiver_id;
      if (!botSenderId) {
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
        if (admins && admins.length > 0) {
          botSenderId = admins[0].id;
        }
      }

      if (!botSenderId) {
          console.error('[GlobalAIResponder] Nenhum admin válido encontrado para assumir a resposta.');
          return;
      }

      // 8. Salvar resposta
      await supabase.from('internal_messages').insert({
        sender_id: botSenderId, 
        receiver_id: msg.sender_id,
        content: cleanResponse,
        lead_id: msg.lead_id
      });

    } catch (err) {
      console.error('[GlobalAIResponder] Erro ao responder comprador:', err);
    } finally {
      processingMessages.current.delete(msg.id);
    }
  };

  return null;
}
