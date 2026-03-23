import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Loader2, Camera, Paperclip, FileText, Video, ShieldCheck } from 'lucide-react';
import { triggerAdsConversion } from './GoogleTags';
import OpenAI from 'openai';
import Markdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { AIService } from '../services/aiService';
import { useAssets } from '../lib/assetsContext';
import { useAuth } from '../lib/authContext';
import AuthModal from './AuthModal';

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string;
  tipo?: string;
  metadata?: any;
}

interface ChatAssistantProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function ChatAssistant({ isOpen, onOpen, onClose }: ChatAssistantProps) {
  const { settings } = useAssets();
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const leadIdRef = useRef<string | null>(null);
  useEffect(() => {
    leadIdRef.current = leadId;
  }, [leadId]);
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Seja Bem Vindo à Auto Compra , espero fazermos um bom negócio' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videos, setVideos] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [activeKey, setActiveKey] = useState<{ key: string, provider: string, model: string } | null>(null);
  const chatEnabled = settings['CHAT_ENABLED'] !== 'false';
  const systemPrompt = settings['AI_SYSTEM_PROMPT'] || '';
  const aiMemory = settings['AI_MEMORY'] || '';
  const [contextData, setContextData] = useState({ banks: [], repairCosts: [], fipeRules: [] });

  const [isAiDisabled, setIsAiDisabled] = useState(false);
  const [otherModels, setOtherModels] = useState<any[]>([]);
  const [lastProposal, setLastProposal] = useState<any>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  const fetchApiKey = async () => {
    // Try to select with status first
    let { data, error } = await supabase
      .from('api_keys')
      .select('key, provider, service, status')
      .eq('status', 'ok')
      .order('created_at', { ascending: false });
    
    // Fallback if status column is missing
    if (error && error.message.includes('status')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('api_keys')
        .select('key, provider, service')
        .order('created_at', { ascending: false });
      data = fallbackData as any;
      error = fallbackError;
    }
    
    if (!error && data && data.length > 0) {
      // Just for UI display, AIService handles the actual selection
      const randomEntry = data[0];
      const model = randomEntry.service ? randomEntry.service.split(':')[0] : 'default';
      setActiveKey({ key: randomEntry.key, provider: randomEntry.provider, model });
    }
  };

  const fetchData = async () => {
    const { data: banks } = await supabase.from('banks').select('*');
    const { data: repairCosts } = await supabase.from('repair_costs').select('*');
    const { data: fipeRules } = await supabase.from('fipe_rules').select('*');
    setContextData({ banks: banks || [], repairCosts: repairCosts || [], fipeRules: fipeRules || [] });

    // Se tiver leadId, busca outros modelos do mesmo vendedor
    if (leadId) {
      const { data: lead } = await supabase.from('leads_veiculos').select('user_id').eq('id', leadId).single();
      if (lead?.user_id) {
        const { data: others } = await supabase
          .from('leads_veiculos')
          .select('marca, modelo, ano_modelo, preco_cliente, cor, quilometragem')
          .eq('user_id', lead.user_id)
          .neq('id', leadId)
          .limit(10);
        setOtherModels(others || []);
      }
    }
  };

  const isInitializingRef = useRef(false);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // A4
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (!isOpen || isInitializingRef.current) return;
      
      try {
        isInitializingRef.current = true;
        console.log("[ChatAssistant] Initializing chat...");
        let currentLeadId = localStorage.getItem('chat_lead_id');

        if (user) {
          console.log("[ChatAssistant] User logged in, finding lead for:", user.email);
          // Busca todos os leads do e-mail, ordenados pelo mais recente
          const { data: userLeads, error: fetchError } = await supabase
            .from('leads_veiculos')
            .select('id, status, detalhes_proposta, marca, modelo')
            .eq('email', user.email)
            .order('created_at', { ascending: false });
            
          if (userLeads && userLeads.length > 0) {
            // Se já tem leads, usa o mais recente (independente de ser frio ou quente)
            const existingLead = userLeads[0];
            console.log("[ChatAssistant] Found existing lead(s), using most recent:", existingLead.id);
            currentLeadId = existingLead.id;
            
            // Atualiza apenas o timestamp e nome
            await supabase
              .from('leads_veiculos')
              .update({ 
                updated_at: new Date().toISOString(),
                cliente_nome: user.user_metadata?.full_name || profile?.full_name || 'Cliente',
                user_id: user.id
              })
              .eq('id', currentLeadId);
          } else {
            // REALMENTE não existe nenhum lead para este e-mail
            console.log("[ChatAssistant] No lead found for user email, creating unique cold lead...");
            const { data: newLead, error: insertError } = await supabase
              .from('leads_veiculos')
              .insert([{ 
                cliente_nome: user.user_metadata?.full_name || profile?.full_name || 'Cliente', 
                email: user.email,
                user_id: user.id,
                telefone: profile?.phone || user.user_metadata?.phone || '00000000000',
                status: 'frio',
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();
            if (newLead) {
              console.log("[ChatAssistant] New lead created:", newLead.id);
              currentLeadId = newLead.id;
            }
          }
        } else if (!currentLeadId) {
          console.log("[ChatAssistant] No user and no local leadId, creating anonymous lead...");
          const { data: newLead, error: insertError } = await supabase
            .from('leads_veiculos')
            .insert([{ 
              cliente_nome: 'Visitante', 
              telefone: '00000000000',
              status: 'frio',
              origem: 'chat',
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();
          if (newLead) {
            console.log("[ChatAssistant] New anonymous lead created:", newLead.id);
            currentLeadId = newLead.id;
          }
        }

        if (currentLeadId && currentLeadId !== leadId) {
          setLeadId(currentLeadId);
          localStorage.setItem('chat_lead_id', currentLeadId);
        }
        
        if (currentLeadId) {
          // Fetch lead details and history
          const { data: leadDetails } = await supabase
            .from('leads_veiculos')
            .select('status, detalhes_proposta')
            .eq('id', currentLeadId)
            .maybeSingle();

          if (leadDetails) {
            setIsAiDisabled(leadDetails.detalhes_proposta?.ai_disabled || false);
            setIsFormFilled(leadDetails.status === 'quente' || leadDetails.status === 'morno');
          }

          const { data: history } = await supabase
            .from('mensagens')
            .select('*')
            .eq('lead_id', currentLeadId)
            .order('created_at', { ascending: true });

          if (history && history.length > 0) {
            const formattedHistory: Message[] = history.map((msg: any) => ({
              role: (msg.remetente === 'cliente' ? 'user' : 'bot') as 'user' | 'bot',
              text: msg.conteudo,
              tipo: msg.tipo,
              metadata: msg.metadata
            }));
            setMessages(formattedHistory);
          }

          const { data: lastProp } = await supabase
            .from('mensagens')
            .select('*')
            .eq('lead_id', currentLeadId)
            .eq('tipo', 'proposta')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (lastProp) {
            setLastProposal(lastProp.metadata?.proposal_data);
          }
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeChat();
  }, [user, isOpen]); // Only re-run when user changes or chat opens

  useEffect(() => {
    const handleOpenChat = async (event: any) => {
      onOpen();
      // Removido o envio automático de mensagem ao abrir
      // const initialMessage = event.detail?.message || 'Olá, gostaria de falar com um especialista';
      // setTimeout(() => {
      //   handleSend(initialMessage);
      // }, 2000);
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, [onOpen]);

  useEffect(() => {
    fetchApiKey();
    fetchData();
  }, [settings, leadId]);

  useEffect(() => {
    let leadSubscription: any;
    let messagesSubscription: any;

    if (leadId) {
      console.log("[ChatAssistant] Subscribing to changes for lead:", leadId);
      leadSubscription = supabase
        .channel(`lead-changes-${leadId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'leads_veiculos',
          filter: `id=eq.${leadId}`
        }, (payload) => {
          if (payload.new.detalhes_proposta?.ai_disabled !== undefined) {
            setIsAiDisabled(payload.new.detalhes_proposta.ai_disabled);
          }
        })
        .subscribe();

      messagesSubscription = supabase
        .channel(`chat-messages-${leadId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `lead_id=eq.${leadId}`
        }, (payload) => {
          if (payload.new.remetente === 'admin' || payload.new.remetente === 'bot') {
            setMessages(prev => {
              const exists = prev.some(m => m.text === payload.new.conteudo && m.role === 'bot');
              if (!exists) {
                playNotificationSound();
                return [...prev, { 
                    role: 'bot', 
                    text: payload.new.conteudo,
                    tipo: payload.new.tipo,
                    metadata: payload.new.metadata
                }];
              }
              return prev;
            });
          }
        })
        .subscribe();
    }

    return () => {
      if (leadSubscription) supabase.removeChannel(leadSubscription);
      if (messagesSubscription) supabase.removeChannel(messagesSubscription);
    };
  }, [leadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!chatEnabled) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        alert("O vídeo excede 30 segundos. Será carregado apenas os primeiros 30 segundos.");
      }
      if (videos.length < 5) {
        setVideos(prev => [...prev, file]);
      } else {
        alert("Limite de 5 vídeos atingido.");
      }
    };
    video.src = URL.createObjectURL(file);
  };

  const handleSend = async (overrideText?: string) => {
    if (!overrideText && !input.trim() && !selectedImage || isLoading) return;

    const userText = overrideText || input.trim();
    const userImage = selectedImage;
    
    if (!overrideText) setInput('');
    setSelectedImage(null);
    setVideos([]);
    
    setMessages(prev => {
      console.log("[ChatAssistant] Adding user message to state:", userText);
      return [...prev, { role: 'user', text: userText, image: userImage || undefined }];
    });
    
    // Salvar mensagem do usuário
    if (leadIdRef.current) {
      console.log("[ChatAssistant] Saving user message to Supabase:", userText);
      const { error } = await supabase.from('mensagens').insert({
        lead_id: leadIdRef.current,
        remetente: 'cliente',
        conteudo: userText,
        metadata: { from_chat_widget: true }
      });
      if (error) {
        console.error("[ChatAssistant] Erro ao salvar mensagem:", error);
        setMessages(prev => prev.filter(m => m.text !== userText)); // Remove optimistic message
        alert("Erro ao enviar mensagem. Tente novamente.");
        return;
      } else {
        console.log("[ChatAssistant] Message saved successfully.");
      }
    } else {
      console.warn("[ChatAssistant] Cannot save message: leadId is missing");
    }

    setIsLoading(true);

    // Se a IA estiver desativada para este lead, não responde automaticamente
    if (isAiDisabled) {
      console.log("[ChatAssistant] AI is disabled for this lead, skipping response.");
      setIsLoading(false);
      return;
    }

    console.log("[ChatAssistant] Calling AI service...");
    try {
      // Construct the prompt with dynamic data
      const banksContext = contextData.banks.map((b: any) => `- ${b.name}: ${b.discount_percentage}% desconto`).join('\n');
      const repairContext = contextData.repairCosts.map((r: any) => `- ${r.part_name}: R$ ${r.cost}`).join('\n');
      const fipeContext = contextData.fipeRules.map((f: any) => `- ${f.condition_name}: -${f.discount_percentage}% sobre FIPE`).join('\n');
      
      const proposalContext = lastProposal ? `
        ### PROPOSTA ATUAL ENVIADA PELO CONSULTOR:
        - Valor Final: R$ ${lastProposal.final_value}
        - Base FIPE: R$ ${lastProposal.base_value}
        - Deduções: ${lastProposal.deductions?.map((d: any) => `${d.name} (R$ ${d.value})`).join(', ')}
        
        **INSTRUÇÃO:** O consultor humano já enviou esta proposta. Sua missão agora é **PERSUADIR** o cliente a aceitá-la. Use gatilhos mentais de urgência e segurança. Se o cliente tentar mudar o valor, diga que esta é a melhor oferta técnica possível e que o pagamento é à vista. NÃO ENVIE NOVAS PROPOSTAS.
      ` : '';

      const defaultRules = `Você é o **ASSISTENTE DE ATENDIMENTO** da plataforma "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS".
        Sua função é **COLETAR DADOS, TIRAR DÚVIDAS E PREPARAR O CLIENTE PARA O CONSULTOR HUMANO**.
        
        **REGRA DE OURO ABSOLUTA: VOCÊ NUNCA, SOB NENHUMA HIPÓTESE, DEVE ENVIAR UMA PROPOSTA DE VALOR PARA O CLIENTE.**
        Apenas o consultor humano (após análise no painel) pode enviar propostas. Se o cliente pedir um valor, diga que os dados estão sendo analisados pela equipe de avaliação e que um consultor enviará a proposta oficial em breve.

        ### 1. CAPACIDADE DE VISÃO (OCR E ANÁLISE)
        - **Se o usuário enviar foto de documento (CRLV/CNH):** Extraia IMEDIATAMENTE: Placa, Renavam, Nome do Proprietário, Ano, Modelo e Cor. Confirme esses dados com o usuário.
        - **Se o usuário enviar foto do veículo:** Analise o estado de conservação. Identifique avarias visíveis (batidas, arranhões, peças faltando) e reduza a avaliação conforme a gravidade.

        ### 2. REGRAS DE NEGÓCIO E COLETA DE DADOS (Mentalidade de Atendimento)
        Use estas regras para entender o cenário do cliente e coletar os dados corretos. Não pergunte "quanto você quer" sem antes ter uma base.

        **CENÁRIO A: FINANCIAMENTO ATRASADO (Pessoa Física)**
        - **Regra:** O objetivo é assumir a dívida para limpar o nome do cliente.
        - **Ação:** Colete o valor da parcela, quantas estão pagas e quantas estão atrasadas.

        **CENÁRIO B: VEÍCULO DE COOPERATIVA / EMPRESA**
        - **Regra:** Não quitamos. Apenas resolvemos a posse.
        - **Ação:** Informe que existe uma taxa para esse serviço e que o consultor explicará os detalhes.

        **CENÁRIO C: CARRO QUITADO COM PROBLEMA (Batido/Motor)**
        - **Regra:** Compra para reforma ou peças.
        - **Ação:** Peça fotos detalhadas das avarias.

        **CENÁRIO D: LIMPA NOME (Dúvidas e Preços)**
        - **Regra:** Explique que limpamos o nome do cliente assumindo a dívida do veículo.
        - **Ação:** Informe que o consultor fará a análise para verificar a viabilidade.

        ### 3. PAGAMENTOS E PERSUASÃO
        - **Como pagamos:** Pagamento à vista via PIX ou Transferência Bancária IMEDIATA após a vistoria e assinatura do documento em cartório (em até 24h).
        - **Persuasão:** Incentive o usuário a enviar os dados para avaliação. Diga: "Pode mandar os dados e fotos sem compromisso. Nossa avaliação é gratuita e você decide se aceita a proposta."
        - **Negociação/Estimativa:** Se o usuário pedir uma estimativa de valor ou quiser negociar, diga que para isso ele **PRECISA preencher o formulário completo** clicando em "Vender Meu Carro" ou fornecendo todos os dados aqui no chat.

        ### 4. FLUXO DE ATENDIMENTO (Seja educado e prestativo)
        1. **Boas-vindas:** Já peça o Modelo e Ano (se não tiver). Se o histórico já tiver uma saudação, NÃO repita.
        2. **Análise:** Peça detalhes do problema (Dívida? Mecânica?).
        3. **Documentação:** Peça foto do CRLV ou Placa/Renavam para consulta.
        4. **Visual:** Peça fotos do carro (frente, traseira, laterais, interior).
        5. **Financeiro:** Pergunte: Banco? Valor parcela? Quantas pagas? Quantas faltam? **Quanto deu de entrada?**
        6. **ENCERRAMENTO:** Agradeça e diga que um consultor enviará a proposta em breve.

        ### 5. REGRAS DE SAUDAÇÃO:
        - NUNCA diga "Bom dia", "Boa tarde" ou "Olá" se o histórico já mostrar que você já cumprimentou o cliente.
        - Se o cliente já forneceu dados, vá direto para a análise técnica.
        - Se o cliente já preencheu o formulário, foque em fechar o negócio.

        ### 5. SAÍDA DE DADOS (JSON Oculto)
        Sempre que tiver dados suficientes (ou no final da proposta), gere este bloco JSON para o sistema registrar o lead:
        \`\`\`json
        {
          "owner_name": "...",
          "owner_phone": "...",
          "brand": "...",
          "model": "...",
          "year": 2020,
          "plate": "...",
          "renavam": "...",
          "mileage": 0,
          "bank": "...",
          "installment_value": 0,
          "installments_paid": 0,
          "installments_remaining": 0,
          "down_payment": 0,
          "desired_price": 0,
          "fipe_price": 0,
          "situation": "Financiado/Batido/Normal",
          "proposal_value": "Valor da Proposta Gerada",
          "proposal_type": "Compra/Assunção/Cobrança",
          "score_veiculo": 0-100
        }
        \`\`\`
      `;

      const formStatusContext = isFormFilled 
        ? `\n**STATUS DO CLIENTE:** O cliente JÁ PREENCHEU o formulário com os dados do veículo. \n**AÇÃO:** Inicie a negociação para comprar o veículo. Demonstre interesse, confirme se os dados estão corretos e tente fechar negócio ou preparar para a proposta do consultor.`
        : `\n**STATUS DO CLIENTE:** O cliente AINDA NÃO preencheu o formulário com os dados do veículo. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`;

      const finalSystemPrompt = `
        [INSTRUÇÃO DE SISTEMA - PRIORIDADE MÁXIMA]
        Você é o ESPECIALISTA SÊNIOR da "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS".
        
        SUA MISSÃO:
        1. ANALISAR E SEGUIR ESTRITAMENTE as REGRAS PERSONALIZADAS e a MEMÓRIA fornecidas abaixo.
        2. Se houver conflito entre o seu conhecimento geral e as REGRAS PERSONALIZADAS, as REGRAS PERSONALIZADAS prevalecem.
        3. Você deve consultar a MEMÓRIA DE LONGO PRAZO antes de formular qualquer resposta.
        
        ${formStatusContext}

        [REGRAS DE NEGÓCIO E COMPORTAMENTO]
        ${systemPrompt || defaultRules}
        
        ${proposalContext}
        
        ### MEMÓRIA DE LONGO PRAZO (CONSULTE ANTES DE RESPONDER):
        ${aiMemory || 'Nenhuma memória registrada.'}
        
        ### CONTEXTO DE DADOS (PARA CÁLCULOS):
        ${fipeContext}
        ${banksContext}
        ${repairContext}
        
        ### OUTROS MODELOS NO SISTEMA (PARA CONSULTA):
        ${otherModels.length > 0 ? otherModels.map(m => `- ${m.marca} ${m.modelo} (${m.ano_modelo}) | Cor: ${m.cor || 'N/A'} | KM: ${m.quilometragem || '0'} | Preço: R$ ${m.preco_cliente || 'A consultar'}`).join('\n') : 'Nenhum outro modelo listado.'}

        ### 6. NOTIFICAÇÕES (APÓS FORMULÁRIO)
        - Após o formulário ser preenchido, pergunte: "Deseja receber notificações sobre o status da sua negociação?"
        - Se o usuário disser SIM, responda com o JSON: {"notifications_authorized": true}
        
        [DIRETRIZ DE RESPOSTA]
        Responda de forma direta, autoritária e empática.
        **REGRA DE OURO:** Suas respostas devem ter NO MÁXIMO 4 LINHAS. Seja extremamente conciso. Não use textos longos. Pareça um humano digitando rápido no WhatsApp.
        **EVITE REPETIÇÕES:** Se o histórico já contém uma saudação, NÃO repita. Se o cliente já enviou os dados, não peça novamente.
        **ESTOQUE:** Se o usuário perguntar sobre outros carros ou o que temos no sistema, você DEVE confirmar os veículos listando explicitamente o **ANO e MODELO** de cada um.
        **PROIBIÇÃO:** NUNCA diga que "por questões de segurança não detalhamos os modelos". Você deve ser transparente para deixar o usuário tranquilo de que os dados estão no banco de dados.
        Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.
        Se o usuário quiser uma avaliação detalhada ou estiver fornecendo muitos dados técnicos, sugira: "Para uma avaliação completa e rápida, use nosso formulário oficial clicando em 'Vender Meu Carro' no menu".
        Se a informação necessária para seguir as regras não estiver disponível, peça-a ao usuário.
      `;
      // Lógica para filtrar mensagens para a UI
    const today = new Date().toDateString();
    const filteredMessages = messages.filter(m => {
      // Se for o dia atual, mostra tudo. Se não, mostra apenas as últimas 20.
      // (Simplificação: aqui estamos filtrando na renderização)
      return true; 
    });

    // No prompt, enviamos o histórico completo (messages)
    const prompt = `HISTÓRICO COMPLETO (PARA APRENDIZADO):\n${messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\nENTRADA ATUAL:\n${userText}`;
      const aiResponse = await AIService.generateContent(prompt, finalSystemPrompt, userImage || undefined);

      const botText = aiResponse.text || 'Entendido. Por favor, continue com as informações solicitadas.';
      
      // Check if botText contains a JSON block for lead submission or notification authorization
      const jsonMatch = botText.match(/```json\n([\s\S]*?)\n```/);
      let textToShow = botText;

      if (jsonMatch) {
        textToShow = botText.replace(jsonMatch[0], '').trim();
        try {
          const data = JSON.parse(jsonMatch[1]);
          
          // Handle Notification Authorization
          if (data.notifications_authorized) {
            if ('Notification' in window) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  supabase.from('leads_veiculos').update({ notifications_enabled: true }).eq('id', leadId);
                  playNotificationSound();
                  setMessages(prev => [...prev, 
                    ...(textToShow ? [{ role: 'bot' as const, text: textToShow }] : []),
                    { role: 'bot' as const, text: '✅ **Notificações ativadas!** Você receberá atualizações sobre sua negociação.' }
                  ]);
                }
              });
            }
            return;
          }

          // Handle Lead Submission
          const leadData = data;
          
          // Determine status based on data
          let status = 'frio';
          if (leadData.proposal_value) status = 'morno';
          if (leadData.status_lead === 'fechado') status = 'quente';

          const { error } = await supabase.from('leads_veiculos').upsert({
            id: leadId,
            cliente_nome: leadData.owner_name,
            telefone: leadData.owner_phone,
            marca: leadData.brand,
            modelo: leadData.model,
            ano_modelo: leadData.year,
            placa: leadData.plate,
            renavam: leadData.renavam,
            quilometragem: leadData.mileage,
            banco_financiador: leadData.bank,
            valor_parcela: leadData.installment_value,
            parcelas_pagas: leadData.installments_paid,
            parcelas_restantes: leadData.installments_remaining,
            preco_cliente: leadData.desired_price,
            valor_fipe: leadData.fipe_price,
            situacao_financeira: leadData.situation,
            status: status,
            origem: 'chat',
            observacoes: `Proposta: ${leadData.proposal_value} | Tipo: ${leadData.proposal_type} | Score: ${leadData.score_veiculo}`
          });
          
          if (error) throw error;
          
          // Trigger Google Ads Conversion
          triggerAdsConversion();

          setIsFormFilled(true);
          playNotificationSound();
          setMessages(prev => [...prev, 
            ...(textToShow ? [{ role: 'bot' as const, text: textToShow }] : []),
            { role: 'bot' as const, text: '✅ **Dados registrados!** Nossa equipe analisará sua proposta e retornará em até 24 horas. Deseja receber notificações sobre o status da sua negociação?' }
          ]);
          
          // Salvar resposta do bot (o texto que a IA gerou)
          if (leadId && textToShow) {
            await supabase.from('mensagens').insert({
              lead_id: leadId,
              remetente: 'bot',
              conteudo: textToShow
            });
          }
          return;
        } catch (e) {
          console.error('Failed to parse or save JSON:', e);
        }
      }

      playNotificationSound();
      setMessages(prev => [...prev, { role: 'bot', text: textToShow }]);
      
      // Salvar resposta do bot
      if (leadId && textToShow) {
        await supabase.from('mensagens').insert({
          lead_id: leadId,
          remetente: 'bot',
          conteudo: textToShow
        });
      }
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      playNotificationSound();
      setMessages(prev => [...prev, { role: 'bot', text: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em breve ou aguarde um consultor humano.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chatHeight = settings['CHAT_HEIGHT'] || '560';
  const chatWidth = settings['CHAT_WIDTH'] || '360';
  const chatColor = settings['CHAT_COLOR'] || '#F27D26';
  const chatAvatarUrl = settings['CHAT_AVATAR_URL'] || '';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            style={{ 
              height: '80vh', 
              width: window.innerWidth < 640 ? '95vw' : '450px' 
            }}
            className="fixed bottom-8 right-8 bg-white rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: chatColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  {chatAvatarUrl ? (
                    <img src={chatAvatarUrl} alt="Atendente" className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Atendimento AUTO COMPRA</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Especialista Sênior</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={onClose} 
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Recolher
                </button>
                <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {!user ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Autenticação Necessária</h4>
                  <p className="text-sm text-slate-500 mb-6">
                    Para conversar com nosso assistente e receber uma avaliação, você precisa estar logado.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                  >
                    Entrar ou Cadastrar-se
                  </button>
                  <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                      msg.role === 'user' ? '' : 'bg-white border border-slate-100 text-slate-900'
                    }`} style={msg.role === 'user' ? { backgroundColor: chatColor, color: 'white' } : {}}>
                      {msg.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : chatAvatarUrl ? (
                        <img src={chatAvatarUrl} alt="Bot" className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-2">
                      {msg.image && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={msg.image} alt="Upload" className="max-w-full h-auto max-h-48 object-cover" />
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                      }`} style={msg.role === 'user' ? { backgroundColor: chatColor } : {}}>
                        <div className="markdown-body prose prose-sm max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                        {msg.tipo === 'proposta' && (
                          <button 
                            type="button"
                            onClick={() => setSelectedProposal(msg.metadata?.proposal_data)}
                            className="mt-3 w-full py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-all"
                          >
                            Ver Proposta Oficial
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                      {chatAvatarUrl ? (
                        <img src={chatAvatarUrl} alt="Bot" className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="w-5 h-5 text-slate-900" />
                      )}
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: chatColor }} />
                      <span className="text-xs text-slate-400 font-medium">Analisando dados...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

            {/* Proposal Modal */}
            {selectedProposal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProposal(null)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-4">
                    {selectedProposal.final_value < 0 ? 'Proposta Limpa Nome' : 'Detalhes da Proposta'}
                  </h3>
                  <div className="space-y-4 text-sm">
                    {selectedProposal.final_value < 0 ? (
                      <div className="space-y-3">
                        <p className="text-slate-600 leading-relaxed italic">
                          "Devido às custas do processo e valor operacional, oferecemos a quitação e blindagem do seu nome em troca do veículo."
                        </p>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-emerald-700 font-bold text-center">LIMPA NOME ATIVADO</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500">Base FIPE:</span>
                          <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposal.base_value)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="text-emerald-700 font-bold">Proposta Final:</span>
                          <span className="text-emerald-700 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposal.final_value)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => setSelectedProposal(null)} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">Fechar</button>
                </div>
              </div>
            )}

            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              {selectedImage && (
                <div className="relative inline-block">
                  <img src={selectedImage} className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  <button 
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {videos.length > 0 && (
                <div className="flex gap-2">
                  {videos.map((video, index) => (
                    <div key={index} className="relative inline-block">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setVideos(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-accent transition-all"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-accent transition-all"
                >
                  <Video className="w-6 h-6" />
                </button>
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  onChange={handleVideoSelect} 
                  accept="video/*" 
                  className="hidden" 
                />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={!leadId ? "Conectando..." : "Digite sua resposta..."}
                    disabled={!leadId || isLoading}
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !selectedImage) || isLoading || !leadId}
                    style={{ backgroundColor: chatColor }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
