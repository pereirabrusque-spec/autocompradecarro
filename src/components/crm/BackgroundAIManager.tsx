import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AIService } from '../../services/aiService';
import { calculateProposal } from '../../lib/proposalUtils';

export const BackgroundAIManager = () => {
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [autoProposalEnabled, setAutoProposalEnabled] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCrmPrompt, setAiCrmPrompt] = useState('');
    const [aiMemory, setAiMemory] = useState('');
    const [aiCrmMemory, setAiCrmMemory] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // Configurações de Proposta
    const [fipeRules, setFipeRules] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [cooperativeDiscount, setCooperativeDiscount] = useState(5);
    const [profitMarginPercentage, setProfitMarginPercentage] = useState(20);
    const [jurosAtraso, setJurosAtraso] = useState(2);
    const [repairCosts, setRepairCosts] = useState<any[]>([]);

    const isAiEnabledRef = useRef(false);
    const autoProposalEnabledRef = useRef(false);
    const aiPromptRef = useRef('');
    const aiCrmPromptRef = useRef('');
    const aiMemoryRef = useRef('');
    const aiCrmMemoryRef = useRef('');
    const currentUserIdRef = useRef<string | null>(null);
    const lastProcessedImage = useRef<{ url: string, base64: string } | null>(null);

    const fipeRulesRef = useRef<any[]>([]);
    const banksRef = useRef<any[]>([]);
    const cooperativeDiscountRef = useRef(5);
    const profitMarginPercentageRef = useRef(20);
    const jurosAtrasoRef = useRef(2);
    const repairCostsRef = useRef<any[]>([]);

    useEffect(() => {
        fipeRulesRef.current = fipeRules;
    }, [fipeRules]);

    useEffect(() => {
        banksRef.current = banks;
    }, [banks]);

    useEffect(() => {
        cooperativeDiscountRef.current = cooperativeDiscount;
    }, [cooperativeDiscount]);

    useEffect(() => {
        profitMarginPercentageRef.current = profitMarginPercentage;
    }, [profitMarginPercentage]);

    useEffect(() => {
        jurosAtrasoRef.current = jurosAtraso;
    }, [jurosAtraso]);

    useEffect(() => {
        repairCostsRef.current = repairCosts;
    }, [repairCosts]);

    useEffect(() => {
        isAiEnabledRef.current = isAiEnabled;
    }, [isAiEnabled]);

    useEffect(() => {
        autoProposalEnabledRef.current = autoProposalEnabled;
    }, [autoProposalEnabled]);

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
        aiCrmMemoryRef.current = aiCrmMemory;
    }, [aiCrmMemory]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        // Load initial settings
        supabase.from('settings').select('key, value').in('key', [
            'AI_SYSTEM_PROMPT', 'AI_CRM_PROMPT', 'AI_CRM_ENABLED', 'AI_MEMORY', 'AI_CRM_MEMORY', 'AUTO_PROPOSAL_ENABLED',
            'COOPERATIVE_DISCOUNT_PERCENTAGE', 'PROFIT_MARGIN_PERCENTAGE', 'JUROS_ATRASO'
        ]).then(({ data }) => {
            if (data) {
                const prompt = data.find(s => s.key === 'AI_SYSTEM_PROMPT');
                const crmPrompt = data.find(s => s.key === 'AI_CRM_PROMPT');
                const enabled = data.find(s => s.key === 'AI_CRM_ENABLED');
                const autoProposal = data.find(s => s.key === 'AUTO_PROPOSAL_ENABLED');
                const memory = data.find(s => s.key === 'AI_MEMORY');
                const crmMemory = data.find(s => s.key === 'AI_CRM_MEMORY');
                const coopDiscount = data.find(s => s.key === 'COOPERATIVE_DISCOUNT_PERCENTAGE');
                const margin = data.find(s => s.key === 'PROFIT_MARGIN_PERCENTAGE');
                const juros = data.find(s => s.key === 'JUROS_ATRASO');

                if (prompt) setAiPrompt(prompt.value);
                if (crmPrompt) setAiCrmPrompt(crmPrompt.value);
                if (enabled) setIsAiEnabled(enabled.value === 'true');
                if (autoProposal) setAutoProposalEnabled(autoProposal.value === 'true');
                if (memory) setAiMemory(memory.value);
                if (crmMemory) setAiCrmMemory(crmMemory.value);
                if (coopDiscount) setCooperativeDiscount(Number(coopDiscount.value) || 5);
                if (margin) setProfitMarginPercentage(Number(margin.value) || 20);
                if (juros) setJurosAtraso(Number(juros.value) || 2);
            }
        });

        // Load other proposal data
        const loadProposalData = async () => {
            const [rulesRes, banksRes, costsRes] = await Promise.all([
                supabase.from('fipe_rules').select('*'),
                supabase.from('banks').select('*'),
                supabase.from('repair_costs').select('*')
            ]);
            if (rulesRes.data) setFipeRules(rulesRes.data);
            if (banksRes.data) setBanks(banksRes.data);
            if (costsRes.data) setRepairCosts(costsRes.data);
        };
        loadProposalData();

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
                    if (key === 'AUTO_PROPOSAL_ENABLED') setAutoProposalEnabled(value === 'true');
                    if (key === 'AI_MEMORY') setAiMemory(value);
                    if (key === 'AI_CRM_MEMORY') setAiCrmMemory(value);
                    if (key === 'COOPERATIVE_DISCOUNT_PERCENTAGE') setCooperativeDiscount(Number(value) || 5);
                    if (key === 'PROFIT_MARGIN_PERCENTAGE') setProfitMarginPercentage(Number(value) || 20);
                    if (key === 'JUROS_ATRASO') setJurosAtraso(Number(value) || 1);
                }
            })
            .subscribe();

        // Listen for other data changes
        const dataSubscription = supabase
            .channel('bg_ai_data')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fipe_rules' }, () => loadProposalData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banks' }, () => loadProposalData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_costs' }, () => loadProposalData())
            .subscribe();

        return () => {
            supabase.removeChannel(settingsSubscription);
            supabase.removeChannel(dataSubscription);
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
                    
                    // Verifica se já existe um lead (veículo) para este comprador
                    const { data: existingLead, error: leadError } = await supabase
                        .from('leads_veiculos')
                        .select('id, marca, modelo')
                        .eq('user_id', senderId)
                        .maybeSingle();

                    const isGlobalAiEnabled = isAiEnabledRef.current;
                    const isAutoProposalEnabled = autoProposalEnabledRef.current;
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

                    // Lógica de verificação de lead
                    if (!existingLead) {
                        console.log(`[BackgroundAIManager] Nenhum lead encontrado para ${senderId}. Induzindo preenchimento.`);
                        await supabase.from('internal_messages').insert({
                            receiver_id: senderId,
                            content: "Olá! Para que eu possa te ajudar a encontrar o melhor negócio e fornecer uma proposta de valor, você precisa preencher nosso formulário completo aqui: https://autocompra.online/vender. Assim nossa equipe consegue fazer uma análise técnica detalhada para você!",
                            sender_id: uid
                        });
                        return;
                    }

                    console.log(`[BackgroundAIManager] Lead encontrado (${existingLead.id}). IA habilitada. Aguardando delay...`);
                    
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

                        // BUSCA O ESTOQUE COMPLETO DO VENDEDOR (ADMIN) PARA INFORMAR SOBRE OUTROS MODELOS
                        const { data: sellerInventory } = await supabase
                            .from('leads_veiculos')
                            .select('id, marca, modelo, ano_modelo, preco_cliente, situacao_financeira, cor, quilometragem')
                            .eq('user_id', uid)
                            .neq('id', currentLeadId)
                            .limit(15);

                        let inventoryContext = "";
                        if (sellerInventory && sellerInventory.length > 0) {
                            inventoryContext = "\n\nESTOQUE COMPLETO DO VENDEDOR (OUTROS MODELOS DISPONÍVEIS NO SISTEMA):\n" + 
                                sellerInventory.map(l => `- ${l.marca} ${l.modelo} (${l.ano_modelo}) | Cor: ${l.cor || 'N/A'} | KM: ${l.quilometragem || '0'} | Preço: R$ ${l.preco_cliente || 'A consultar'} [${l.situacao_financeira || 'Disponível'}]`).join('\n');
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
                            
                            const proposalResult = calculateProposal(specificLead, {
                                fipeRules: fipeRulesRef.current,
                                banks: banksRef.current,
                                cooperativeDiscount: cooperativeDiscountRef.current,
                                profitMarginPercentage: profitMarginPercentageRef.current,
                                jurosAtraso: jurosAtrasoRef.current,
                                repairCosts: repairCostsRef.current
                            });
                            const propostaFinal = proposalResult.finalValue;
                            
                            specificVehicleInfo = `
DETALHES COMPLETOS DO VEÍCULO EM FOCO:
- ID: ${specificLead.id}
- Marca/Modelo: ${specificLead.marca} ${specificLead.modelo}
- Ano: ${specificLead.ano_fabricacao}/${specificLead.ano_modelo}
- Preço Sugerido/Cliente: R$ ${specificLead.preco_cliente || 'A consultar'}
- PROPOSTA FINAL CALCULADA: R$ ${propostaFinal || 'A calcular'}
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

                        const isFormFilled = existingLead && existingLead.marca && existingLead.modelo;
                        const formStatusContext = isFormFilled 
                            ? `\n**STATUS DO CLIENTE:** O cliente JÁ PREENCHEU o formulário com os dados do veículo. \n**AÇÃO:** Inicie a negociação para comprar o veículo. Demonstre interesse, confirme se os dados estão corretos e tente fechar negócio ou preparar para a proposta do consultor.`
                            : `\n**STATUS DO CLIENTE:** O cliente AINDA NÃO preencheu o formulário com os dados do veículo. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`;

                        const fullPrompt = `
Você é o ESPECIALISTA SÊNIOR da "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS".

${formStatusContext}

${specificVehicleInfo}
${vehicleContext}
${inventoryContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.new.content}

REGRAS E MEMÓRIA DO CRM:
${aiCrmPromptRef.current}
${aiCrmMemoryRef.current ? `\nMEMÓRIA APRENDIDA NO CRM:\n${aiCrmMemoryRef.current}` : ''}

REGRAS DE PROPOSTA:
${isAutoProposalEnabled ? 
    "VOCÊ ESTÁ AUTORIZADO A ENVIAR A PROPOSTA FINAL. Use o valor 'PROPOSTA FINAL CALCULADA' mencionado acima se o cliente perguntar sobre valores ou propostas." : 
    "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Se o cliente perguntar sobre preço ou proposta, diga que um consultor humano está finalizando os cálculos para garantir a melhor oferta e entrará em contato em breve. Foque em outros detalhes do veículo."}

REGRAS DE ESTOQUE:
- Se o usuário perguntar sobre "outros modelos", "o que tem no sistema" ou "meus carros", você DEVE confirmar os veículos listando explicitamente o **ANO e MODELO** de cada um.
- **PROIBIÇÃO:** NUNCA diga que "por questões de segurança não detalhamos os modelos". Você deve ser transparente para deixar o vendedor tranquilo de que os dados estão no banco de dados.
- Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.

REGRAS GERAIS:
1. Use os dados técnicos acima.
2. Seja persuasivo e amigável.
3. Responda como um consultor de vendas especializado em compradores.
`;

                        const response = await AIService.generateContent(
                            fullPrompt,
                            "Você é um assistente de vendas altamente preciso para COMPRADORES. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo.",
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
                    const isAutoProposalEnabled = autoProposalEnabledRef.current;
                    
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

                    console.log(`[BackgroundAIManager] IA habilitada para lead. Aguardando delay maior (30s) para evitar conflito com UI...`);
                    
                    const delay = 30000; // 30 segundos fixos para dar tempo da UI responder
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

                        let inventoryContext = "";
                        let vehicleInfo = "";
                        let vehiclePhoto = "";
                        if (vehicle) {
                            const allPhotos = vehicle.fotos || [];
                            vehiclePhoto = allPhotos[0] || "";
                            
                            const proposalResult = calculateProposal(vehicle, {
                                fipeRules: fipeRulesRef.current,
                                banks: banksRef.current,
                                cooperativeDiscount: cooperativeDiscountRef.current,
                                profitMarginPercentage: profitMarginPercentageRef.current,
                                jurosAtraso: jurosAtrasoRef.current,
                                repairCosts: repairCostsRef.current
                            });
                            const propostaFinal = proposalResult.finalValue;
                            
                            vehicleInfo = `
VEÍCULO EM NEGOCIAÇÃO:
- Marca/Modelo: ${vehicle.marca} ${vehicle.modelo}
- Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}
- Preço Sugerido/Cliente: R$ ${vehicle.preco_cliente || 'A consultar'}
- PROPOSTA FINAL CALCULADA: R$ ${propostaFinal || 'A calcular'}
- KM: ${vehicle.quilometragem || vehicle.km || '0'}
- Cor: ${vehicle.cor || 'Não informada'}
- Sinistro/Leilão: ${vehicle.tem_sinistro === 'sim' ? 'Sim' : 'Não'} / ${vehicle.passagem_leilao === 'sim' ? 'Sim' : 'Não'}
`;

                            // Busca outros veículos do mesmo vendedor (por email ou user_id)
                            const { data: others } = await supabase
                                .from('leads_veiculos')
                                .select('marca, modelo, ano_modelo, preco_cliente, cor, quilometragem')
                                .or(`email.eq.${vehicle.email}${vehicle.user_id ? `,user_id.eq.${vehicle.user_id}` : ''}`)
                                .neq('id', leadId)
                                .limit(10);

                            if (others && others.length > 0) {
                                inventoryContext = "\nOUTROS VEÍCULOS DESTE VENDEDOR NO SISTEMA:\n" + 
                                    others.map(v => `- ${v.marca} ${v.modelo} (${v.ano_modelo}) - ${v.cor} - ${v.quilometragem}km`).join('\n');
                            }
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

                        const isFormFilled = vehicle && vehicle.marca && vehicle.modelo;
                        const formStatusContext = isFormFilled 
                            ? `\n**STATUS DO CLIENTE:** O cliente JÁ PREENCHEU o formulário com os dados do veículo. \n**AÇÃO:** Inicie a negociação para comprar o veículo. Demonstre interesse, confirme se os dados estão corretos e tente fechar negócio ou preparar para a proposta do consultor.`
                            : `\n**STATUS DO CLIENTE:** O cliente AINDA NÃO preencheu o formulário com os dados do veículo. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`;

                        const fullPrompt = `
Você é o ESPECIALISTA SÊNIOR da "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS".

${formStatusContext}

${vehicleInfo}
${inventoryContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.new.conteudo}

REGRAS E MEMÓRIA DO VENDEDOR:
${aiPromptRef.current}
${aiMemoryRef.current ? `\nMEMÓRIA APRENDIDA:\n${aiMemoryRef.current}` : ''}

REGRAS DE PROPOSTA:
${isAutoProposalEnabled ? 
    "VOCÊ ESTÁ AUTORIZADO A ENVIAR A PROPOSTA FINAL. Use o valor 'PROPOSTA FINAL CALCULADA' mencionado acima se o cliente perguntar sobre valores ou propostas." : 
    "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Se o cliente perguntar sobre preço ou proposta, diga que um consultor humano está finalizando os cálculos para garantir a melhor oferta e entrará em contato em breve. Foque em outros detalhes do veículo."}

REGRAS DE ESTOQUE:
- Se o usuário perguntar sobre "outros modelos", "o que tem no sistema" ou "meus carros", você DEVE confirmar os veículos listando explicitamente o **ANO e MODELO** de cada um.
- **PROIBIÇÃO:** NUNCA diga que "por questões de segurança não detalhamos os modelos". Você deve ser transparente para deixar o vendedor tranquilo de que os dados estão no banco de dados.
- Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.

REGRAS GERAIS:
1. Use os dados técnicos acima.
2. Seja persuasivo, amigável e direto.
3. Responda como um vendedor de carros experiente.
4. EVITE REPETIR SAUDAÇÕES: Se o histórico já contém um "Bom dia", "Boa tarde" ou "Olá" recente, NÃO repita. Vá direto ao assunto.
5. NÃO envie mensagens duplicadas. Se a última mensagem do histórico já responde o que o cliente perguntou, não responda novamente.
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
