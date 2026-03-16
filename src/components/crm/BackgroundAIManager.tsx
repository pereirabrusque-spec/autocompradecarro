import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AIService } from '../../services/aiService';

export const BackgroundAIManager = () => {
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCrmPrompt, setAiCrmPrompt] = useState('');
    const [aiMemory, setAiMemory] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    const isAiEnabledRef = useRef(false);
    const aiPromptRef = useRef('');
    const aiCrmPromptRef = useRef('');
    const aiMemoryRef = useRef('');
    const currentUserIdRef = useRef<string | null>(null);
    const lastProcessedImage = useRef<{ url: string, base64: string } | null>(null);

    useEffect(() => {
        isAiEnabledRef.current = isAiEnabled;
    }, [isAiEnabled]);

    useEffect(() => {
        aiPromptRef.current = aiPrompt;
    }, [aiPrompt]);

    useEffect(() => {
        aiCrmPromptRef.current = aiCrmPrompt;
    }, [aiCrmPrompt]);

    useEffect(() => {
        aiMemoryRef.current = aiMemory;
    }, [aiMemory]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        // Load initial settings
        supabase.from('settings').select('key, value').in('key', ['AI_SYSTEM_PROMPT', 'AI_CRM_PROMPT', 'AI_CRM_ENABLED', 'AI_MEMORY']).then(({ data }) => {
            if (data) {
                const prompt = data.find(s => s.key === 'AI_SYSTEM_PROMPT');
                const crmPrompt = data.find(s => s.key === 'AI_CRM_PROMPT');
                const enabled = data.find(s => s.key === 'AI_CRM_ENABLED');
                const memory = data.find(s => s.key === 'AI_MEMORY');
                if (prompt) setAiPrompt(prompt.value);
                if (crmPrompt) setAiCrmPrompt(crmPrompt.value);
                if (enabled) setIsAiEnabled(enabled.value === 'true');
                if (memory) setAiMemory(memory.value);
            }
        });

        // Get current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id);
        });

        // Listen for settings changes
        const settingsSubscription = supabase
            .channel('bg_ai_settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
                if (payload.new && (payload.new as any).key) {
                    const { key, value } = payload.new as any;
                    if (key === 'AI_SYSTEM_PROMPT') setAiPrompt(value);
                    if (key === 'AI_CRM_PROMPT') setAiCrmPrompt(value);
                    if (key === 'AI_CRM_ENABLED') setIsAiEnabled(value === 'true');
                    if (key === 'AI_MEMORY') setAiMemory(value);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(settingsSubscription);
        };
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const channelName = `bg_ai_messages_${currentUserId}`;
        console.log(`[BackgroundAIManager] Iniciando monitoramento global: ${channelName}`);

        const messageSubscription = supabase
            .channel(channelName)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'internal_messages' 
            }, async (payload) => {
                const uid = currentUserIdRef.current;
                if (!uid) return;

                // Só processa se a mensagem for para o admin logado (receiver_id === uid ou null)
                const isForMe = payload.new.receiver_id === uid || (!payload.new.receiver_id && uid);
                
                // Só responde se a mensagem não for minha
                if (isForMe && payload.new.sender_id !== uid) {
                    const senderId = payload.new.sender_id;
                    const messageId = payload.new.id;

                    console.log(`[BackgroundAIManager] IA Global detectou nova mensagem (${messageId}) de ${senderId}`);
                    
                    // Verifica se o comprador específico tem a IA ligada
                    const { data: buyerProfile } = await supabase
                        .from('profiles')
                        .select('is_ai_enabled')
                        .eq('id', senderId)
                        .single();
                    
                    const isGlobalAiEnabled = isAiEnabledRef.current;
                    const conversationAiState = buyerProfile?.is_ai_enabled;

                    let shouldRespond = false;

                    if (isGlobalAiEnabled) {
                        // Global is ON. Respond unless explicitly disabled for this conversation.
                        shouldRespond = conversationAiState !== false;
                    } else {
                        // Global is OFF. Respond ONLY if explicitly enabled for this conversation.
                        shouldRespond = conversationAiState === true;
                    }

                    if (!shouldRespond) {
                        console.log(`[BackgroundAIManager] IA não deve responder (Global: ${isGlobalAiEnabled}, Conversa: ${conversationAiState}). Ignorando.`);
                        return;
                    }

                    console.log(`[BackgroundAIManager] IA habilitada (Global: ${isGlobalAiEnabled}, Conversa: ${conversationAiState}). Aguardando delay...`);
                    
                    // Pequeno delay aleatório para evitar que múltiplos admins respondam ao mesmo tempo
                    // E também para dar um ar mais "humano" de que está lendo
                    const delay = Math.floor(Math.random() * 1000) + 500;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Verifica se JÁ existe uma resposta de ADMIN para ESTA mensagem específica
                    // Buscamos mensagens do admin para este comprador criadas APÓS esta mensagem
                    const { data: recentAdminMsg } = await supabase
                        .from('internal_messages')
                        .select('id')
                        .eq('sender_id', uid)
                        .eq('receiver_id', senderId)
                        .gt('created_at', payload.new.created_at)
                        .limit(1);

                    if (recentAdminMsg && recentAdminMsg.length > 0) {
                        console.log(`[BackgroundAIManager] Já existe uma resposta posterior para a mensagem ${messageId}. Pulando.`);
                        return;
                    }

                    console.log(`[BackgroundAIManager] Nenhuma resposta de admin detectada. Gerando resposta para: "${payload.new.content.substring(0, 30)}..."`);

                    try {
                        // Busca histórico recente para contexto
                        const { data: historyData } = await supabase
                            .from('internal_messages')
                            .select('*')
                            .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
                            .order('created_at', { ascending: false })
                            .limit(15);

                        const history = (historyData || []).reverse().map(m => 
                            `${m.sender_id === uid ? 'Admin' : 'Cliente'}: ${m.content} ${m.lead_id ? `(Ref: ${m.lead_id})` : ''}`
                        ).join('\n');

                        let currentLeadId = payload.new.lead_id;
                        let specificLead = null;
                        let vehicleContext = "";
                        let specificVehicleInfo = "";
                        let vehiclePhoto = "";

                        if (!currentLeadId) {
                            const lastMsgWithLead = historyData?.find(m => m.lead_id);
                            if (lastMsgWithLead) currentLeadId = lastMsgWithLead.lead_id;
                        }

                        if (currentLeadId) {
                            const { data } = await supabase
                                .from('leads_veiculos')
                                .select('*')
                                .eq('id', currentLeadId)
                                .maybeSingle();
                            specificLead = data;
                        }

                        const content = payload.new.content.toLowerCase();
                        if (!specificLead) {
                            const { data: searchLeads } = await supabase
                                .from('leads_veiculos')
                                .select('*')
                                .or(`marca.ilike.%${content}%,modelo.ilike.%${content}%`)
                                .limit(5);

                            if (searchLeads && searchLeads.length > 0) {
                                if (searchLeads.length === 1) {
                                    specificLead = searchLeads[0];
                                } else {
                                    vehicleContext = "\n\nVEÍCULOS ENCONTRADOS (OPÇÕES PARA O CLIENTE):\n" + searchLeads.map(l => 
                                        `- ID: ${l.id} | ${l.marca} ${l.modelo} (${l.ano_modelo}) - R$ ${l.preco_cliente || 'A consultar'}`
                                    ).join('\n');
                                }
                            }
                        }

                        if (specificLead) {
                            const allPhotos = specificLead.fotos || [];
                            vehiclePhoto = allPhotos[0] || "";
                            specificVehicleInfo = `
DETALHES COMPLETOS DO VEÍCULO EM FOCO:
- ID: ${specificLead.id}
- Marca/Modelo: ${specificLead.marca} ${specificLead.modelo}
- Ano: ${specificLead.ano_fabricacao}/${specificLead.ano_modelo}
- Preço: R$ ${specificLead.preco_cliente || 'A consultar'}
- Cor: ${specificLead.cor || 'Não informada'}
- KM: ${specificLead.quilometragem || specificLead.km || '0'}
- SITUAÇÃO FINANCEIRA: ${specificLead.situacao_financeira || 'Não informada'}
- ENTRADA: R$ ${specificLead.entrada || '0'}
- VALOR PARCELA: R$ ${specificLead.valor_parcela || '0'}
- TOTAL PARCELAS: ${specificLead.total_parcelas || '0'}
- BANCO: ${specificLead.banco_financiamento || 'Nenhum'}
- Sinistro/Leilão: ${specificLead.tem_sinistro === 'sim' ? 'Sim' : 'Não'} / ${specificLead.passagem_leilao === 'sim' ? 'Sim' : 'Não'}
`;
                        }

                        let imageBase64 = "";
                        if (vehiclePhoto) {
                            if (lastProcessedImage.current?.url === vehiclePhoto) {
                                imageBase64 = lastProcessedImage.current.base64;
                            } else {
                                try {
                                    const imgResp = await fetch(vehiclePhoto);
                                    const blob = await imgResp.blob();
                                    imageBase64 = await new Promise((resolve) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => resolve(reader.result as string);
                                        reader.readAsDataURL(blob);
                                    });
                                    lastProcessedImage.current = { url: vehiclePhoto, base64: imageBase64 };
                                } catch (e) {}
                            }
                        }

                        const fullPrompt = `
${specificVehicleInfo}
${vehicleContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.new.content}

REGRAS E MEMÓRIA:
${payload.new.lead_id ? aiPromptRef.current : aiCrmPromptRef.current}
${aiMemoryRef.current ? `\nMEMÓRIA APRENDIDA:\n${aiMemoryRef.current}` : ''}

REGRAS:
1. Use os dados técnicos acima.
2. Se houver parcelas, não diga que está quitado.
3. Seja persuasivo e amigável.
4. Confirme sempre de qual carro está falando.
`;

                        const response = await AIService.generateContent(
                            fullPrompt,
                            "Você é um assistente de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo.",
                            imageBase64 || undefined
                        );

                        if (response && response.text) {
                            await supabase.from('internal_messages').insert({
                                receiver_id: senderId,
                                content: response.text,
                                sender_id: uid,
                                lead_id: currentLeadId
                            });
                            console.log('[BackgroundAIManager] Resposta automática enviada');
                        }
                    } catch (err) {
                        console.error('[BackgroundAIManager] Erro ao processar resposta:', err);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [currentUserId]);

    return null; // Componente invisível
};
