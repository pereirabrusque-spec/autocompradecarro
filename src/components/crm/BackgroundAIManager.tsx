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

        // Listen for internal messages
        const internalMessageSubscription = supabase
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

                    console.log(`[BackgroundAIManager] IA Global detectou nova mensagem interna (${messageId}) de ${senderId}`);
                    
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
                    const delay = Math.floor(Math.random() * 1000) + 500;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Verifica se JÁ existe uma resposta de ADMIN para ESTA mensagem específica
                    const { data: recentAdminMsg } = await supabase
                        .from('internal_messages')
                        .select('id')
                        .eq('sender_id', uid)
                        .eq('receiver_id', senderId)
                        .gt('created_at', payload.new.created_at)
                        .limit(1);

                    if (recentAdminMsg && recentAdminMsg.length > 0) {
                        console.log(`[BackgroundAIManager] Já existe uma resposta posterior para a mensagem interna ${messageId}. Pulando.`);
                        return;
                    }

                    console.log(`[BackgroundAIManager] Nenhuma resposta de admin detectada. Gerando resposta para interna: "${payload.new.content.substring(0, 30)}..."`);

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
                            console.log('[BackgroundAIManager] Resposta automática enviada para interna');
                        }
                    } catch (err) {
                        console.error('[BackgroundAIManager] Erro ao processar resposta interna:', err);
                    }
                }
            })
            .subscribe();

        // Listen for public messages (leads)
        const publicMessageSubscription = supabase
            .channel(`bg_ai_public_${currentUserId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'mensagens' 
            }, async (payload) => {
                const uid = currentUserIdRef.current;
                if (!uid) return;

                // Só responde se a mensagem for do cliente
                if (payload.new.remetente === 'cliente') {
                    const leadId = payload.new.lead_id;
                    const messageId = payload.new.id;

                    console.log(`[BackgroundAIManager] IA Global detectou nova mensagem de lead (${messageId}) para lead ${leadId}`);
                    
                    // Verifica se a IA está habilitada globalmente
                    const isGlobalAiEnabled = isAiEnabledRef.current;
                    if (!isGlobalAiEnabled) {
                        console.log(`[BackgroundAIManager] IA Global desativada. Ignorando mensagem de lead.`);
                        return;
                    }

                    // Verifica se o lead específico tem a IA desativada (atendimento humano)
                    const { data: lead } = await supabase
                        .from('leads_veiculos')
                        .select('detalhes_proposta')
                        .eq('id', leadId)
                        .single();
                    
                    if (lead?.detalhes_proposta?.ai_disabled) {
                        console.log(`[BackgroundAIManager] IA desativada para este lead (Atendimento Humano ON). Ignorando.`);
                        return;
                    }

                    console.log(`[BackgroundAIManager] IA habilitada para lead. Aguardando delay...`);
                    
                    const delay = Math.floor(Math.random() * 2000) + 2000;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Verifica se JÁ existe uma resposta de ADMIN ou BOT para ESTA mensagem
                    const { data: recentMsg } = await supabase
                        .from('mensagens')
                        .select('id')
                        .eq('lead_id', leadId)
                        .in('remetente', ['admin', 'bot'])
                        .gt('created_at', payload.new.created_at)
                        .limit(1);

                    if (recentMsg && recentMsg.length > 0) {
                        console.log(`[BackgroundAIManager] Já existe uma resposta posterior para o lead ${leadId}. Pulando.`);
                        return;
                    }

                    console.log(`[BackgroundAIManager] Gerando resposta para lead: "${payload.new.conteudo.substring(0, 30)}..."`);

                    try {
                        // Busca histórico recente
                        const { data: historyData } = await supabase
                            .from('mensagens')
                            .select('*')
                            .eq('lead_id', leadId)
                            .order('created_at', { ascending: false })
                            .limit(15);

                        const history = (historyData || []).reverse().map(m => 
                            `${m.remetente === 'cliente' ? 'Cliente' : 'Vendedor'}: ${m.conteudo}`
                        ).join('\n');

                        // Busca dados do veículo
                        const { data: vehicle } = await supabase
                            .from('leads_veiculos')
                            .select('*')
                            .eq('id', leadId)
                            .single();

                        let vehicleInfo = "";
                        let vehiclePhoto = "";
                        if (vehicle) {
                            const allPhotos = vehicle.fotos || [];
                            vehiclePhoto = allPhotos[0] || "";
                            vehicleInfo = `
VEÍCULO EM NEGOCIAÇÃO:
- Marca/Modelo: ${vehicle.marca} ${vehicle.modelo}
- Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}
- Preço: R$ ${vehicle.preco_cliente || 'A consultar'}
- KM: ${vehicle.quilometragem || vehicle.km || '0'}
- Cor: ${vehicle.cor || 'Não informada'}
- Sinistro/Leilão: ${vehicle.tem_sinistro === 'sim' ? 'Sim' : 'Não'} / ${vehicle.passagem_leilao === 'sim' ? 'Sim' : 'Não'}
`;
                        }

                        let imageBase64 = "";
                        if (vehiclePhoto) {
                            try {
                                const imgResp = await fetch(vehiclePhoto);
                                const blob = await imgResp.blob();
                                imageBase64 = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result as string);
                                    reader.readAsDataURL(blob);
                                });
                            } catch (e) {}
                        }

                        const fullPrompt = `
${vehicleInfo}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.new.conteudo}

REGRAS E MEMÓRIA:
${aiPromptRef.current}
${aiMemoryRef.current ? `\nMEMÓRIA APRENDIDA:\n${aiMemoryRef.current}` : ''}
`;

                        const response = await AIService.generateContent(
                            fullPrompt,
                            "Você é um vendedor de carros experiente. Responda com base nos dados do veículo. Seja persuasivo, amigável e direto.",
                            imageBase64 || undefined
                        );

                        if (response && response.text) {
                            await supabase.from('mensagens').insert({
                                lead_id: leadId,
                                conteudo: response.text,
                                remetente: 'bot'
                            });
                            console.log('[BackgroundAIManager] Resposta automática enviada para lead');
                        }
                    } catch (err) {
                        console.error('[BackgroundAIManager] Erro ao processar resposta para lead:', err);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(internalMessageSubscription);
            supabase.removeChannel(publicMessageSubscription);
        };

    }, [currentUserId]);

    return null; // Componente invisível
};
