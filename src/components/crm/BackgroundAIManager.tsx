import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AIService } from '../../services/aiService';

export const BackgroundAIManager = () => {
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    const isAiEnabledRef = useRef(false);
    const aiPromptRef = useRef('');
    const currentUserIdRef = useRef<string | null>(null);
    const lastProcessedImage = useRef<{ url: string, base64: string } | null>(null);

    useEffect(() => {
        isAiEnabledRef.current = isAiEnabled;
    }, [isAiEnabled]);

    useEffect(() => {
        aiPromptRef.current = aiPrompt;
    }, [aiPrompt]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        // Load initial settings
        supabase.from('settings').select('key, value').in('key', ['AI_CRM_PROMPT', 'AI_CRM_ENABLED']).then(({ data }) => {
            if (data) {
                const prompt = data.find(s => s.key === 'AI_CRM_PROMPT');
                const enabled = data.find(s => s.key === 'AI_CRM_ENABLED');
                if (prompt) setAiPrompt(prompt.value);
                if (enabled) setIsAiEnabled(enabled.value === 'true');
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
                    if (key === 'AI_CRM_PROMPT') setAiPrompt(value);
                    if (key === 'AI_CRM_ENABLED') setIsAiEnabled(value === 'true');
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
                
                // Só responde se a IA estiver ligada E a mensagem não for minha
                if (isAiEnabledRef.current && isForMe && payload.new.sender_id !== uid) {
                    console.log('[BackgroundAIManager] IA Global detectou nova mensagem, aguardando para processar...');
                    
                    // Pequeno delay aleatório para evitar que múltiplos admins respondam ao mesmo tempo
                    const delay = Math.floor(Math.random() * 2000) + 500;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    const senderId = payload.new.sender_id;

                    // Verifica se já houve uma resposta de admin após esta mensagem
                    const { data: recentAdminMsg } = await supabase
                        .from('internal_messages')
                        .select('id')
                        .eq('sender_id', uid) // Ou qualquer admin, mas uid já serve para este contexto
                        .eq('receiver_id', senderId)
                        .gt('created_at', payload.new.created_at)
                        .limit(1);

                    if (recentAdminMsg && recentAdminMsg.length > 0) {
                        console.log('[BackgroundAIManager] Já houve uma resposta para esta mensagem. Cancelando.');
                        return;
                    }

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

REGRAS:
1. Use os dados técnicos acima.
2. Se houver parcelas, não diga que está quitado.
3. Seja persuasivo e amigável.
4. Confirme sempre de qual carro está falando.
`;

                        const response = await AIService.generateContent(
                            fullPrompt,
                            aiPromptRef.current || "Você é um assistente de vendas prestativo.",
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
