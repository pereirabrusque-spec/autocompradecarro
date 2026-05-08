import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Loader2, Camera, Paperclip, FileText, Video, ShieldCheck } from 'lucide-react';
import { triggerAdsConversion } from './GoogleTags';
import OpenAI from 'openai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const [leadData, setLeadData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Seja Bem Vindo à Auto Compra , espero fazermos um bom negócio' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializingHistory, setIsInitializingHistory] = useState(true);
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

    // Busca inventário expandido (por Lead ID, por User ID ou por Email)
    const filters: string[] = [];
    if (user?.id) filters.push(`user_id.eq.${user.id}`);
    
    // Busca por email de forma insensível e também normalizada
    if (user?.email) {
        const email = user.email.toLowerCase().trim();
        filters.push(`email.ilike.${email}`);
    }

    if (leadIdRef.current) {
      const { data: currentLead } = await supabase.from('leads_veiculos').select('user_id, email, telefone').eq('id', leadIdRef.current).maybeSingle();
      if (currentLead) {
        if (currentLead.user_id) filters.push(`user_id.eq.${currentLead.user_id}`);
        if (currentLead.email) {
            const email = currentLead.email.toLowerCase().trim();
            filters.push(`email.ilike.${email}`);
        }
        if (currentLead.telefone) filters.push(`telefone.eq.${currentLead.telefone}`);
      }
    }

    const uniqueFilters = Array.from(new Set(filters));
    if (uniqueFilters.length > 0) {
      console.log("[ChatAssistant] Buscando inventário com filtros:", uniqueFilters);
      const { data: others } = await supabase
        .from('leads_veiculos')
        .select('*')
        .or(uniqueFilters.join(','))
        .order('created_at', { ascending: false })
        .limit(15);
      
      // Filtra apenas os que realmente têm dados de carro preenchidos
      const validOthers = (others || []).filter(v => v.marca && v.modelo && v.marca !== 'N/A' && v.id !== leadIdRef.current);
      console.log("[ChatAssistant] Inventário encontrado:", validOthers.length, "veículos.");
      setOtherModels(validOthers);
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
      if (isInitializingRef.current) return;
      
      try {
        isInitializingRef.current = true;
        console.log("[ChatAssistant] Initializing chat...");
        let currentLeadId = localStorage.getItem('chat_lead_id');

        if (user) {
          console.log("[ChatAssistant] User logged in, finding lead for:", user.email);
          // Busca todos os leads do e-mail, ordenados pelo mais recente
          const { data: userLeads, error: fetchError } = await supabase
            .from('leads_veiculos')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false });
            
          if (fetchError) {
            console.error("[ChatAssistant] Erro ao buscar leads do usuário:", fetchError);
          }

          if (userLeads && userLeads.length > 0) {
            // Busca o lead mais recente que esteja "completo" ou o mais recente absoluto
            const filledLead = userLeads.find(l => l.marca && l.modelo);
            const existingLead = filledLead || userLeads[0];
            
            console.log("[ChatAssistant] Found existing lead(s), using:", existingLead.id, filledLead ? "(filled)" : "(not filled)");
            currentLeadId = existingLead.id;
            
            // Atualiza apenas o timestamp e nome
            console.log("[ChatAssistant] Updating existing lead:", currentLeadId);
            const updateData: any = { 
              cliente_nome: user.user_metadata?.full_name || profile?.full_name || 'Cliente'
            };
            
            if (user.id) {
              updateData.user_id = user.id;
            }

            const { error: updateError } = await supabase
              .from('leads_veiculos')
              .update(updateData)
              .eq('id', currentLeadId);
            
            if (updateError) {
              console.error("[ChatAssistant] Erro ao atualizar lead existente:", updateError);
            }
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
                status: 'frio'
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
              origem: 'chat'
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
            .select('*')
            .eq('id', currentLeadId)
            .maybeSingle();

          if (leadDetails) {
            setLeadData(leadDetails);
            // IA sempre habilitada para automação total conforme solicitado
            setIsAiDisabled(false);
            setIsFormFilled(!!(leadDetails.marca && leadDetails.modelo));
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
        setIsInitializingHistory(false);
      }
    };

    initializeChat();
  }, [user]); // Re-run only when user changes

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

    // Subscription para chaves de API
    const keysSub = supabase
      .channel('buyer_api_keys_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, () => {
        fetchApiKey();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(keysSub);
    };
  }, [settings, leadId, user, isOpen]);

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
          console.log("[ChatAssistant] Lead updated in real-time:", payload.new);
          setLeadData(payload.new);
          setIsFormFilled(!!(payload.new.marca && payload.new.modelo));
          setIsAiDisabled(false);
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

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching image for AI:', error);
      return '';
    }
  };

  const [isAiEnabled, setIsAiEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['AI_CRM_ENABLED', 'AI_BUYER_ENABLED']);
        
        if (data) {
          const crmEnabled = data.find(s => s.key === 'AI_CRM_ENABLED');
          const buyerEnabled = data.find(s => s.key === 'AI_BUYER_ENABLED');
          
          if (buyerEnabled) {
            setIsAiEnabled(buyerEnabled.value === 'true');
          } else if (crmEnabled) {
            setIsAiEnabled(crmEnabled.value === 'true');
          } else {
            setIsAiEnabled(true);
          }
        }
      } catch (err) {
        console.error("[ChatAssistant] Erro ao buscar configurações de IA:", err);
      }
    };
    fetchSettings();
  }, []);

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
      console.log("[ChatAssistant] Saving user message to Supabase. LeadID:", leadIdRef.current, "Content:", userText);
      
      // Verifica se o lead ainda existe antes de tentar inserir a mensagem
      const { data: leadCheck } = await supabase
        .from('leads_veiculos')
        .select('id')
        .eq('id', leadIdRef.current)
        .maybeSingle();

      if (!leadCheck) {
        console.error("[ChatAssistant] Lead não encontrado no banco de dados. Tentando recriar...");
        // Força a reinicialização do chat para criar um novo lead
        localStorage.removeItem('chat_lead_id');
        window.location.reload();
        return;
      }

        const insertPromise = supabase.from('mensagens').insert({
            lead_id: leadIdRef.current,
            remetente: 'cliente',
            conteudo: userText,
            lida: false,
            metadata: { from_chat_widget: true, timestamp: new Date().toISOString() }
        });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_SUPABASE')), 8000));
        
        const { error } = await Promise.race([insertPromise, timeoutPromise]) as any;
        if (error) {
            console.error("[ChatAssistant] Erro CRÍTICO ao salvar mensagem:", error);
            setMessages(prev => prev.filter(m => m.text !== userText)); // Remove optimistic message
            alert(`Erro ao enviar mensagem: ${error.message || 'Erro de conexão'}. Por favor, verifique sua rede.`);
            setIsLoading(false); 
            return;
        } else {
            console.log("[ChatAssistant] Mensagem salva com sucesso no Supabase.");
        }
    } else {
      console.warn("[ChatAssistant] Cannot save message: leadId is missing");
    }

    setIsLoading(true);

    // Se a IA estiver desativada globalmente ou para este lead, não responde automaticamente
    if (!isAiEnabled || isAiDisabled) {
      console.log(`[ChatAssistant] AI response skipped. Global: ${isAiEnabled}, Lead Disabled: ${isAiDisabled}`);
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

      const defaultRules = `Você é o **ASSISTENTE DE ATENDIMENTO** da plataforma "AutoCompra".
        Sua função é **TIRAR DÚVIDAS, COLETAR DADOS E EXPLICAR O PROCESSO**.
        
        **REGRA DE OURO ABSOLUTA: VOCÊ NUNCA, SOB NENHUMA HIPÓTESE, DEVE ENVIAR UMA PROPOSTA DE VALOR.**
        Apenas o consultor humano pode enviar propostas. Se o cliente pedir um valor, diga que os dados estão sendo analisados e o consultor enviará a proposta em breve.

        ### 1. CAPACIDADE DE VISÃO (OCR E ANÁLISE)
        - **Se o usuário enviar foto de documento (CRLV/CNH):** Extraia IMEDIATAMENTE os dados.
        - **Se o usuário enviar foto do veículo:** Analise o estado de conservação.

        ### 2. REGRAS DE NEGÓCIO
        - **FINANCIAMENTO ATRASADO:** O objetivo é assumir a dívida para limpar o nome. Colete o valor da parcela, quantas estão pagas e em atraso.
        - **VEÍCULO DE COOPERATIVA / EMPRESA:** Não quitamos, mas resolvemos a posse.
        - **CARRO QUITADO COM PROBLEMA:** Compra para reforma ou peças. Peça fotos detalhadas.
        - **LIMPA NOME:** Explique que limpamos o nome assumindo a dívida do veículo.

        ### 3. FORMAS DE PAGAMENTO
        - **Como pagamos:** Pagamento à vista via PIX ou Transferência Bancária após a vistoria.
        - **Dúvidas sobre PIX:** Se o cliente perguntar "Tem PIX?" ou "Qual a conta do PIX?", explique APENAS que o pagamento é feito na conta dele. NUNCA gere ou solicite dados sensíveis como chaves PIX ou senhas. Apenas responda: "Sim, fazemos o pagamento via PIX diretamente na sua conta após a vistoria."
        
        ### 4. FLUXO DE ATENDIMENTO
        1. Responda diretamente à pergunta feita pelo cliente.
        2. Se o cliente fizer MÚLTIPLAS PERGUNTAS (ex: preço e pagamento juntos), você é OBRIGADO a responder a TODAS elas detalhadamente. Não deixe nenhuma pergunta sem resposta.
        3. Diga que os especialistas entrarão em contato com a avaliação de valor de mercado.

        ### 5. REGRAS DE SEGURANÇA E PERSONALIDADE
        - NUNCA diga "Desculpe, não posso ajudar com isso." ou "Sou apenas uma IA".
        - Se não souber algo, responda que um de nossos especialistas humanos entrará em contato para detalhar essa parte.
        - Seja vendedor, persuasivo e amigável.
        
        ### 6. SAÍDA DE DADOS (JSON Oculto)
        Sempre que tiver dados suficientes, gere este bloco JSON para o sistema registrar:
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
          "situation": "Financiado/Batido/Normal"
        }
        \`\`\`
      `;

      // Verificação infalível de formulário
      const currentVehicleFilled = !!(leadData?.marca && leadData?.modelo && leadData.marca !== 'N/A' && leadData.modelo !== 'N/A');
      const hasInventory = otherModels.length > 0;
      
      const luizContextLog = `
[DEBUG LUIZ]: 
- ID Lead: ${leadId}
- Carro Atual Ok: ${currentVehicleFilled ? 'Sim' : 'Não'}
- Histórico Encontrado: ${hasInventory ? `${otherModels.length} carros` : 'Nenhum'}
      `;

      const vehicleContext = currentVehicleFilled ? `
### [BINGO: CLIENTE COM CARRO EM MÃOS]
- O cliente já preencheu tudo para o ${leadData.marca} ${leadData.modelo}.
- MISSÃO: NÃO peça formulários. Fale da análise deste carro.
` : hasInventory ? `
### [BINGO: CLIENTE COM HISTÓRICO]
- O cliente já tem ${otherModels.length} carros conosco: ${otherModels.map(m => `${m.marca} ${m.modelo}`).join(', ')}.
- MISSÃO: Trate-o como cliente VIP. NÃO peça formulário de boas-vindas. Pergunte sobre os carros que ele já tem.
` : `
### [NOVO CLIENTE]
- Nenhum dado. Leve ao link: https://autocompra.online/vender.
`;

      // Limpeza agressiva de prompt customizado se houver inventário
      let cleanSystemPrompt = systemPrompt || '';
      if (currentVehicleFilled || hasInventory) {
        // Remove frases inteiras que induzem ao preenchimento se detectado inventário
        cleanSystemPrompt = cleanSystemPrompt.replace(/preencha nosso formulário de avaliação online/gi, 'aguarde nossa análise');
        cleanSystemPrompt = cleanSystemPrompt.replace(/preencha o formulário/gi, 'verifique os dados');
        cleanSystemPrompt = cleanSystemPrompt.replace(/clique no link/gi, 'aguarde o contato');
        cleanSystemPrompt = cleanSystemPrompt.replace(/https:\/\/autocompra.online\/vender/gi, ''); 
      }

      const finalSystemPrompt = `
        VOCÊ É O LUIZ — Especialista Sênior da AutoCompra.
        Sua personalidade é humanizada, proativa e focada em resolver o problema do cliente. 
        Você é auto-didata e aprende com cada interação, por isso use a memória do sistema abaixo com prioridade.
        **NUNCA use desculpas genéricas como "não posso ajudar com isso"**. Se você não tiver uma informação técnica, diga que está consultando nossos especialistas humanos e traga o que você CONSEGUE ver (como o histórico do cliente).

        ### [MEMÓRIA E APRENDIZADO DA IA]
        ${aiMemory}
        ${settings['AI_CRM_MEMORY'] || ''}
        
        ### [VIGILÂNCIA DE ESTADO DO CLIENTE — PRIORIDADE MÁXIMA]
        ${luizContextLog}
        ${vehicleContext}

        REGRAS DE OURO INVIOLÁVEIS (LEIA ANTES DE RESPONDER):
        1. SE O BLOCO [BINGO: CLIENTE COM HISTÓRICO] OU [BINGO: CLIENTE COM CARRO EM MÃOS] TIVER DADOS, O CLIENTE É VIP E JÁ CADASTRADO.
        2. É TERMINANTEMENTE PROIBIDO PEDIR PARA PREENCHER FORMULÁRIO OU ENVIAR O LINK /vender SE O CLIENTE JÁ TEM CARROS.
        3. SE O CLIENTE PEDIR "MEU ORÇAMENTO" OU "QUAIS CARROS TENHO", USE A LISTA DE INVENTÁRIO ABAIXO E RESPONDA COM DETALHES.
        4. SE O CLIENTE DISSER QUE QUER VENDER (COMO NO HISTÓRICO ACIMA), E ELE JÁ TEM CARROS, DIGA: "Vi que você já tem ${otherModels.length > 0 ? otherModels.map(m => m.modelo).join(', ') : 'veículos'} em análise. Quer saber o status ou cadastrar um novo?".

        ${defaultRules}
        
        ${cleanSystemPrompt ? `### DIRETRIZES DO PAINEL (FILTRADAS): \n${cleanSystemPrompt}` : ''}

        ---
        SISTEMA:
        FIPE: ${fipeContext}
        BANCOS: ${banksContext}
        REPAROS: ${repairContext}
        INVENTÁRIO ATUAL DO CLIENTE (MÁXIMA PRIORIDADE): 
        ${otherModels.length > 0 ? otherModels.map(m => `- ${m.marca} ${m.modelo} (${m.ano_modelo}) | Status: ${m.status || 'Em análise'}`).join('\n') : 'Nenhum veículo cadastrado ainda.'}

        [REGRAS DE RESPOSTA]
        - Máximo de 4 linhas.
        - Estilo WhatsApp.
        - Se o cliente já tem carro, NÃO mande link de formulário.
      `;
      // Lógica para filtrar mensagens para a UI
    const today = new Date().toDateString();
    const filteredMessages = messages.filter(m => {
      // Se for o dia atual, mostra tudo. Se não, mostra apenas as últimas 20.
      // (Simplificação: aqui estamos filtrando na renderização)
      return true; 
    });

    const clientName = user?.user_metadata?.full_name || profile?.full_name || 'Cliente';

    // No prompt, enviamos o histórico completo (messages)
    const prompt = `CLIENTE: ${clientName}
    
HISTÓRICO COMPLETO (PARA APRENDIZADO):
${messages.map(m => `${m.role.toUpperCase()}: ${m.text || '[Imagem/Arquivo]'}`).join('\n')}

ENTRADA ATUAL:
${userText}`;
    
    let aiImage = userImage;
    if (!aiImage && leadData?.fotos && Array.isArray(leadData.fotos) && leadData.fotos.length > 0 && leadData.fotos[0]) {
      console.log("[ChatAssistant] Fetching vehicle photo for AI analysis...");
      try {
        aiImage = await fetchImageAsBase64(leadData.fotos[0]);
      } catch (imgErr) {
        console.warn("[ChatAssistant] Erro ao carregar foto do lead para IA:", imgErr);
      }
    }

      let aiResponse = await AIService.generateContent(prompt, finalSystemPrompt, aiImage || undefined);
      
      let rawBotText = aiResponse.text || 'Entendido. Por favor, continue com as informações solicitadas.';

      // FILTRO DE SEGURANÇA (POST-PROCESSING): 
      // Se a IA for teimosa e enviar o link do formulário para quem já tem cadastro
      const detectionPhrases = [
        'preencha nosso formulário',
        'formulário de avaliação',
        'link do formulário',
        'clique no link',
        'avançar com a venda do seu carro',
        '/vender'
      ];
      
      const shouldBlock = (currentVehicleFilled || hasInventory) && 
                         detectionPhrases.some(phrase => rawBotText.toLowerCase().includes(phrase));

      if (shouldBlock) {
          console.warn("[ChatAssistant] Filtro de Segurança Ativado: IA tentou pedir formulário para cliente cadastrado.");
          rawBotText = "Estamos analisando as informações que você já nos enviou. Em breve um de nossos especialistas entrará em contato com uma proposta justa. Deseja tirar alguma dúvida específica sobre o seu veículo agora?";
      }
      
      // Substituição robusta de placeholders (lida com espaços e variações)
      const currentClientName = user?.user_metadata?.full_name || profile?.full_name || 'Cliente';
      const finalText = rawBotText
          .replace(/{{[ ]*nome[ ]*}}/gi, currentClientName)
          .replace(/{{[ ]*cliente_nome[ ]*}}/gi, currentClientName)
          .replace(/{{[ ]*name[ ]*}}/gi, currentClientName)
          .replace(/\[[ ]*nome[ ]*\]/gi, currentClientName);

      // Check if botText contains a JSON block for lead submission or notification authorization
      const jsonMatch = finalText.match(/```json\n([\s\S]*?)\n```/);
      let textToShow = finalText;

      if (jsonMatch) {
        textToShow = finalText.replace(jsonMatch[0], '').trim();
        try {
          const data = JSON.parse(jsonMatch[1]);
          
          // Handle Notification Authorization
          if (data.notifications_authorized) {
            if ('Notification' in window) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted' && leadId) {
                  supabase.from('leads_veiculos').update({ notifications_enabled: true }).eq('id', leadId).then(({ error }) => {
                    if (error) console.error("[ChatAssistant] Error updating notifications_enabled:", error);
                  });
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

          // Handle Mark as Sold
          if (data.action === 'mark_as_sold') {
            const vehicleId = data.vehicle_id || leadId;
            if (vehicleId) {
              const { error } = await supabase
                .from('leads_veiculos')
                .update({ status: 'vendido' })
                .eq('id', vehicleId);
              
              if (!error) {
                const vehicleName = leadData?.id === vehicleId ? `${leadData.marca} ${leadData.modelo}` : 'veículo';
                const soldMsg = `Entendido! Marquei o seu ${vehicleName} como **VENDIDO** em nosso sistema. Ele não aparecerá mais como uma negociação ativa. Deseja negociar algum outro veículo ou em que posso te ajudar agora?`;
                
                setMessages(prev => [...prev, 
                  ...(textToShow ? [{ role: 'bot' as const, text: textToShow }] : []),
                  { role: 'bot' as const, text: soldMsg }
                ]);
                
                // Se for o veículo atual, limpa o estado local
                if (vehicleId === leadId) {
                  setLeadId(null);
                  setLeadData(null);
                  localStorage.removeItem('chat_lead_id');
                }
              } else {
                console.error("[ChatAssistant] Error marking as sold:", error);
              }
            }
            return;
          }

          // Handle Update Lead Status (Negociar / Limpa Nome)
          if (data.action === 'update_status' && data.status && leadId) {
            const { error } = await supabase
              .from('leads_veiculos')
              .update({ 
                status: data.status,
                classificacao: (data.status === 'negociar' || data.status === 'limpa_nome') ? 'quente' : undefined
              })
              .eq('id', leadId);
            
            if (!error) {
              setMessages(prev => [...prev, { role: 'bot' as const, text: textToShow }]);
              
              // Salvar resposta do bot
              await supabase.from('mensagens').insert({
                lead_id: leadId,
                remetente: 'bot',
                conteudo: textToShow
              });
              
              // Atualiza o dado local se necessário
              if (leadData) setLeadData({...leadData, status: data.status});
            }
            return;
          }

          // Handle Lead Submission
          const formJsonData = data;
          
          if (!leadId) {
            console.error("[ChatAssistant] Cannot save lead data: leadId is null");
            return;
          }

          // Determine status based on data
          let statusResult = 'frio';
          if (formJsonData.proposal_value) statusResult = 'morno';
          if (formJsonData.status_lead === 'fechado') statusResult = 'quente';

          const { error } = await supabase.from('leads_veiculos').upsert({
            id: leadId,
            cliente_nome: formJsonData.owner_name,
            telefone: formJsonData.owner_phone,
            marca: formJsonData.brand,
            modelo: formJsonData.model,
            ano_modelo: formJsonData.year,
            placa: formJsonData.plate,
            renavam: formJsonData.renavam,
            quilometragem: formJsonData.mileage,
            banco_financiador: formJsonData.bank,
            valor_parcela: formJsonData.installment_value,
            parcelas_pagas: formJsonData.installments_paid,
            parcelas_restantes: formJsonData.installments_remaining,
            preco_cliente: formJsonData.desired_price,
            valor_fipe: formJsonData.fipe_price,
            situacao_financeira: formJsonData.situation,
            status: statusResult,
            origem: 'chat',
            observacoes: `Proposta: ${formJsonData.proposal_value} | Tipo: ${formJsonData.proposal_type} | Score: ${formJsonData.score_veiculo}`
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

          // Redireciona para a página de obrigado após um curto delay para garantir o rastreamento do Google Ads
          setTimeout(() => {
            window.history.pushState({}, '', '/obrigado');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 3000);
          
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
    } catch (error: any) {
      console.error("Erro ao gerar resposta da IA:", error);
      playNotificationSound();
      
      // Mensagem amigável padrão solicitada pelo usuário
      let errorMsg = 'Um consultor técnico já foi notificado e irá te responder em breve. Por favor, aguarde um momento.';
      
      const lowerError = error.message?.toLowerCase() || '';
      
      // Log interno detalhado para o admin (visível no console)
      if (lowerError.includes('quota') || lowerError.includes('limit') || lowerError.includes('429')) {
        console.warn('⚠️ Limite de API atingido nas chaves configuradas.');
      } else if (lowerError.includes('excedido número máximo de tentativas')) {
        console.warn('⚠️ Todas as chaves de IA falharam ou estão offline.');
      }

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: errorMsg
      }]);

      // SALVA O FALLBACK NO BANCO para o Admin ver que a IA tentou/falhou amigavelmente
      if (leadIdRef.current) {
        await supabase.from('mensagens').insert({
          lead_id: leadIdRef.current,
          remetente: 'bot',
          conteudo: errorMsg,
          metadata: { is_fallback: true, original_error: error.message }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const chatHeight = settings['CHAT_HEIGHT'] || '560';
  const chatWidth = settings['CHAT_WIDTH'] || '360';
  const chatColor = settings['CHAT_COLOR'] || '#F27D26';
  const chatAvatarUrl = settings['CHAT_AVATAR_URL'] || '';
  const chatAttendantAvatar = settings['CHAT_ATTENDANT_AVATAR'] || '';

  const finalAvatarUrl = chatAttendantAvatar || chatAvatarUrl || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=100&h=100&auto=format&fit=crop";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed md:bottom-8 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 md:right-8 bg-white rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100"
            style={{ 
              height: window.innerWidth < 640 ? 'calc(100vh - 120px)' : '80vh', 
              width: window.innerWidth < 640 ? '92vw' : '450px',
              maxWidth: '100%'
            }}
          >
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: chatColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img src={finalAvatarUrl} alt="Atendente" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      ) : (
                        <img src={finalAvatarUrl} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                              )
                            }}
                          >
                            {msg.text}
                          </Markdown>
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
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={(!leadId || isInitializingHistory) ? "Conectando..." : "Digite sua mensagem..."}
                    disabled={!leadId || isLoading || isInitializingHistory}
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !selectedImage) || isLoading || !leadId || isInitializingHistory}
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
