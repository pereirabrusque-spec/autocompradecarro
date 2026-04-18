import React, { useEffect, useRef, useState, memo } from 'react';
import { supabase } from '../../lib/supabase';
import { AIService } from '../../services/aiService';
import { calculateProposal } from '../../lib/proposalUtils';
import { logToStorage } from '../../lib/logger';

export const BackgroundAIManager = () => {
    console.log("[BackgroundAIManager] 🏗️ Renderizando componente...");
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [autoProposalEnabled, setAutoProposalEnabled] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCrmPrompt, setAiCrmPrompt] = useState('');
    const [aiMemory, setAiMemory] = useState('');
    const [aiCrmMemory, setAiCrmMemory] = useState('');
    const [responseMode, setResponseMode] = useState<'chat' | 'webhook'>('chat');
    const [webhookUrl, setWebhookUrl] = useState('');
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
    const responseModeRef = useRef<'chat' | 'webhook'>('chat');
    const webhookUrlRef = useRef('');
    const currentUserIdRef = useRef<string | null>(null);
    const lastProcessedImage = useRef<{ url: string, base64: string } | null>(null);

    const fipeRulesRef = useRef<any[]>([]);
    const banksRef = useRef<any[]>([]);
    const cooperativeDiscountRef = useRef(5);
    const profitMarginPercentageRef = useRef(20);
    const jurosAtrasoRef = useRef(2);
    const repairCostsRef = useRef<any[]>([]);

    const handleAILearning = async (message: any, type: 'internal' | 'public') => {
        try {
            const role = 'Atendente';
            const content = message.content || message.conteudo;
            if (!content) return;

            const prompt = `Analise a nova mensagem do ${role} e extraia informações relevantes para a memória da IA (preferências do cliente, urgência, detalhes técnicos do veículo, condições de negociação, etc).
                
                Mensagem: ${content}`;
            
            const systemInstruction = "Você é um assistente que monitora conversas de compra e venda de veículos para extrair conhecimento estratégico. Retorne apenas os pontos novos e relevantes de forma ultra-concisa. Se não houver nada relevante, retorne 'NADA'.";

            const response = await AIService.generateContent(prompt, systemInstruction);
            
            const extractedInfo = response.text;
            if (extractedInfo && extractedInfo.trim().toUpperCase() !== 'NADA' && extractedInfo.trim().length > 5) {
                const newMemory = `${aiMemoryRef.current}\n[${new Date().toLocaleString()}] ${extractedInfo}\n`;
                await supabase.from('settings').upsert({ key: 'AI_MEMORY', value: newMemory }, { onConflict: 'key' });
                setAiMemory(newMemory);
            }
        } catch (err) {
            console.error('Erro no aprendizado da IA em Background:', err);
        }
    };

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
        responseModeRef.current = responseMode;
    }, [responseMode]);

    useEffect(() => {
        webhookUrlRef.current = webhookUrl;
    }, [webhookUrl]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        isAiEnabledRef.current = isAiEnabled;
    }, [isAiEnabled]);

    useEffect(() => {
        console.log("[BackgroundAIManager] 🚀 Componente montado. Buscando configurações...");
        console.log("[BackgroundAIManager] 👤 Current User ID (Ref):", currentUserIdRef.current);
        console.log("[BackgroundAIManager] 🤖 IA Enabled (Ref):", isAiEnabledRef.current);
        
        // Heartbeat to confirm it's alive
        const heartbeat = setInterval(() => {
            console.log("[BackgroundAIManager] ❤️ Heartbeat - IA is alive. Enabled:", isAiEnabledRef.current, "User:", currentUserIdRef.current);
            // Re-trigger scan every 5 minutes just in case subscription missed something
            scanForOpenMessages();
        }, 5 * 60 * 1000); 

        // Load initial settings
        supabase.from('settings').select('key, value').in('key', [
            'AI_SYSTEM_PROMPT', 'AI_CRM_PROMPT', 'AI_CRM_ENABLED', 'AI_MEMORY', 'AI_CRM_MEMORY', 'AUTO_PROPOSAL_ENABLED',
            'COOPERATIVE_DISCOUNT_PERCENTAGE', 'PROFIT_MARGIN_PERCENTAGE', 'JUROS_ATRASO', 'RESPONSE_MODE', 'WEBHOOK_URL'
        ]).then(({ data, error }) => {
            if (error) {
                console.error("[BackgroundAIManager] ❌ Erro ao carregar configurações:", error);
                return;
            }
            console.log("[BackgroundAIManager] Configurações carregadas:", data?.length || 0, "itens.");
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
                const mode = data.find(s => s.key === 'RESPONSE_MODE');
                const webhook = data.find(s => s.key === 'WEBHOOK_URL');

                if (prompt) setAiPrompt(prompt.value);
                if (crmPrompt) setAiCrmPrompt(crmPrompt.value);
                if (enabled) {
                    const isEnabled = enabled.value === 'true';
                    setIsAiEnabled(isEnabled);
                    isAiEnabledRef.current = isEnabled;
                }
                if (autoProposal) setAutoProposalEnabled(autoProposal.value === 'true');
                if (memory) setAiMemory(memory.value);
                if (crmMemory) setAiCrmMemory(crmMemory.value);
                if (coopDiscount) setCooperativeDiscount(Number(coopDiscount.value) || 5);
                if (margin) setProfitMarginPercentage(Number(margin.value) || 20);
                if (juros) setJurosAtraso(Number(juros.value) || 2);
                if (mode) setResponseMode(mode.value as 'chat' | 'webhook');
                if (webhook) setWebhookUrl(webhook.value);
            }
            
            // Run initial scan
            setTimeout(scanForOpenMessages, 2000);
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

        // Get current user and listen for changes
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCurrentUserId(session.user.id);
                currentUserIdRef.current = session.user.id;
            }
        };
        checkSession();

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[BackgroundAIManager] Auth state changed:", event, session?.user?.id);
            if (session?.user) {
                setCurrentUserId(session.user.id);
                currentUserIdRef.current = session.user.id;
                // Force a scan when user changes/logs in
                setTimeout(scanForOpenMessages, 1000);
            } else {
                setCurrentUserId(null);
                currentUserIdRef.current = null;
            }
        });

        // Listen for settings changes
        const settingsSubscription = supabase
            .channel('bg_ai_settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
                if (payload.new && (payload.new as any).key) {
                    const { key, value } = payload.new as any;
                    if (key === 'AI_SYSTEM_PROMPT') setAiPrompt(value);
                    if (key === 'AI_CRM_PROMPT') setAiCrmPrompt(value);
                    if (key === 'AI_CRM_ENABLED') {
                        setIsAiEnabled(value === 'true');
                        isAiEnabledRef.current = value === 'true';
                    }
                    if (key === 'AUTO_PROPOSAL_ENABLED') {
                        setAutoProposalEnabled(value === 'true');
                        autoProposalEnabledRef.current = value === 'true';
                    }
                    if (key === 'AI_MEMORY') setAiMemory(value);
                    if (key === 'AI_CRM_MEMORY') setAiCrmMemory(value);
                    if (key === 'COOPERATIVE_DISCOUNT_PERCENTAGE') setCooperativeDiscount(Number(value) || 5);
                    if (key === 'PROFIT_MARGIN_PERCENTAGE') setProfitMarginPercentage(Number(value) || 20);
                    if (key === 'JUROS_ATRASO') setJurosAtraso(Number(value) || 1);
                    if (key === 'RESPONSE_MODE') setResponseMode(value as 'chat' | 'webhook');
                    if (key === 'WEBHOOK_URL') setWebhookUrl(value);
                }
            })
            .subscribe();

        // Listen for API Keys changes to trigger retries if AI was blocked
        const apiKeysSubscription = supabase
            .channel('bg_ai_keys')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'api_keys' }, (payload) => {
                const oldStatus = (payload.old as any).status;
                const newStatus = (payload.new as any).status;
                
                if (newStatus === 'ok' && oldStatus !== 'ok') {
                    console.log("[BackgroundAIManager] 🔑 Uma API Key voltou a ficar OK! Acionando scanner de mensagens pendentes...");
                    scanForOpenMessages();
                }
            })
            .subscribe();

        // Listen for other data changes
        const dataSubscription = supabase
            .channel('bg_ai_data')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fipe_rules' }, () => loadProposalData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banks' }, () => loadProposalData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_costs' }, () => loadProposalData())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads_veiculos' }, (payload) => {
                console.log("[BackgroundAIManager] 🆕 Novo lead detectado via Realtime:", payload.new.id);
                // Se a IA Global estiver ativa, vamos tentar iniciar um contato inicial se não for lead frio
                if (isAiEnabledRef.current) {
                    // Pequeno delay para garantir que o lead esteja totalmente processado se houver triggers de banco
                    setTimeout(() => handleNewLeadResponse(payload.new), 2000);
                }
            })
            .subscribe();

        return () => {
            clearInterval(heartbeat);
            supabase.removeChannel(settingsSubscription);
            supabase.removeChannel(apiKeysSubscription);
            supabase.removeChannel(dataSubscription);
            authSubscription.unsubscribe();
        };
    }, []);

    const handleNewLeadResponse = async (lead: any) => {
        const uid = currentUserIdRef.current;
        if (!uid || !isAiEnabledRef.current) return;

        console.log("[BackgroundAIManager] 🤖 Iniciando resposta automática para NOVO LEAD:", lead.id);

        try {
            // Verifica se já existe alguma mensagem de BOAS VINDAS para não duplicar
            const { data: welcomeMsgs } = await supabase
                .from('mensagens')
                .select('id')
                .eq('lead_id', lead.id)
                .is('metadata->ai_welcome', true);

            if (welcomeMsgs && welcomeMsgs.length > 0) {
                console.log("[BackgroundAIManager] Lead já possui saudação inicial, ignorando.");
                return;
            }

            const clientName = lead.cliente_nome || "Cliente";
            const carContext = lead.marca ? `sobre o seu veículo ${lead.marca} ${lead.modelo}` : "sobre sua intenção de negócio";
            
            const prompt = `
                O cliente ${clientName} acaba de se cadastrar no site e está interessado ${carContext}.
                Dê as boas-vindas como Especialista Luiz da AutoCompra.
                Seja extremamente profissional, direto e diga que já estamos analisando as informações para garantir o melhor negócio.
                Fale que em instantes ele receberá uma proposta preliminar baseada nos dados fornecidos.
                Use no máximo 2 linhas rápidas.
            `;

            const systemPrompt = "Você é o Especialista Luiz da AutoCompra. Sua missão é recepcionar novos leads com agilidade e autoridade.";
            
            const response = await AIService.generateContent(prompt, systemPrompt);

            if (response && response.text) {
                // Envia para o chat público (Vendedores)
                await supabase.from('mensagens').insert({
                    lead_id: lead.id,
                    remetente: 'bot',
                    conteudo: response.text,
                    metadata: { 
                        ai_handled: true, 
                        ai_welcome: true, 
                        is_initial: true,
                        timestamp: new Date().toISOString() 
                    }
                });

                console.log("[BackgroundAIManager] ✅ Saudação inicial enviada para o canal público do lead:", lead.id);
            }
        } catch (error) {
            console.error("[BackgroundAIManager] Erro ao responder novo lead:", error);
            // Se falhar a IA por crédito, envia uma estática para não deixar o cliente no vácuo
            const clientName = lead.cliente_nome || "Cliente";
            await supabase.from('mensagens').insert({
                lead_id: lead.id,
                remetente: 'bot',
                conteudo: `Olá ${clientName}, sou o Luiz da AutoCompra. Seja bem-vindo! Já recebi seus dados e nossa equipe técnica está analisando tudo para te enviar a melhor proposta em instantes.`,
                metadata: { ai_welcome: true, is_initial: true, fallback: true }
            });
        }
    };

    const handleInternalMessage = async (payload: any, isFollowUp = false) => {
        console.log('[BackgroundAIManager] 📩 handleInternalMessage START:', { 
            id: payload.id, 
            content: payload.content, 
            sender: payload.sender_id, 
            receiver: payload.receiver_id, 
            isFollowUp,
            timestamp: new Date().toISOString()
        });
        const uid = currentUserIdRef.current;
        
        if (!uid) {
            console.log("[BackgroundAIManager] ⚠️ handleInternalMessage ABORT: UID não disponível (currentUserIdRef é nulo).");
            return;
        }

        const isGlobalEnabled = isAiEnabledRef.current;
        console.log(`[BackgroundAIManager] handleInternalMessage check IA Global: ${isGlobalEnabled}`);

        if (!isGlobalEnabled) {
            console.log('[BackgroundAIManager] ⚠️ handleInternalMessage ABORT: IA Global desativada no Ref.');
            return;
        }

        const senderId = isFollowUp ? payload.receiver_id : payload.sender_id;
        const messageId = payload.id;

        if (!isFollowUp) {
            const isForMe = payload.receiver_id === uid || 
                            payload.receiver_id === '00000000-0000-0000-0000-000000000000' || 
                            (!payload.receiver_id && uid);
            
            console.log(`[BackgroundAIManager] handleInternalMessage check isForMe: ${isForMe}, uid: ${uid}, receiver: ${payload.receiver_id}`);

            if (!isForMe) {
                console.log(`[BackgroundAIManager] handleInternalMessage ABORT: não é para este usuário.`);
                return;
            }
            if (payload.sender_id === uid) {
                console.log('[BackgroundAIManager] handleInternalMessage ABORT: enviada por mim mesmo.');
                return;
            }
        }
        
        console.log(`[BackgroundAIManager] Processando mensagem interna. isFollowUp: ${isFollowUp}, sender_id: ${senderId}`);

        if (isFollowUp || (payload.sender_id !== uid)) {
            console.log(`[BackgroundAIManager] 🤖 IA processando mensagem interna (${messageId}) de/para ${senderId}.`);
            
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('is_ai_enabled, role, full_name, email')
                .eq('id', senderId)
                .maybeSingle();
            
            console.log(`[BackgroundAIManager] Perfil do remetente (${senderId}):`, senderProfile);
            
            // Busca lead por user_id OU email do perfil
            const leadQuery = supabase
                .from('leads_veiculos')
                .select('id, marca, modelo, created_at')
                .or(`user_id.eq.${senderId}${senderProfile?.email ? `,email.eq.${senderProfile.email}` : ''}`)
                .order('created_at', { ascending: false })
                .limit(1);

            const { data: userLeads } = await leadQuery;
            const existingLead = userLeads?.[0] || null;

        const isBuyer = senderProfile?.role?.toLowerCase().includes('buyer') || 
                            (payload.lead_id && payload.lead_id !== 'null' && payload.lead_id !== '');
        const isSeller = senderProfile?.role?.toLowerCase().includes('seller') || 
                            senderProfile?.role?.toLowerCase().includes('agent') || 
                            (!isBuyer && !!existingLead);
        
        const finalIsBuyer = !!isBuyer || (payload.lead_id && payload.lead_id !== 'null' && payload.lead_id !== '');
        const finalIsSeller = !finalIsBuyer && (isSeller || senderProfile?.role === 'user');

            console.log(`[BackgroundAIManager] 🔍 Processando mensagem interna (${messageId}). isBuyer: ${finalIsBuyer}, isSeller: ${finalIsSeller}, lead_id: ${payload.lead_id}`);
            console.log(`[BackgroundAIManager] 👤 Perfil do remetente:`, senderProfile?.full_name, 'Role:', senderProfile?.role);

            const isGlobalAiEnabled = isAiEnabledRef.current;
            console.log(`[BackgroundAIManager] 🤖 IA Global: ${isGlobalAiEnabled}`);

            if (payload.sender_id === uid) {
                handleAILearning(payload, 'internal');
                return;
            }

            if (!isGlobalAiEnabled) {
                console.log(`[BackgroundAIManager] ⏭️ IA ignorando resposta para ${senderId} (Global: ${isGlobalAiEnabled}).`);
                return;
            }

            const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 segundos para ser mais ágil
            await new Promise(resolve => setTimeout(resolve, delay));

            const { data: recentAdminMsg } = await supabase
                .from('internal_messages')
                .select('id')
                .eq('receiver_id', senderId)
                .neq('sender_id', senderId)
                .gt('created_at', payload.created_at)
                .limit(1);

            if (recentAdminMsg && recentAdminMsg.length > 0) {
                console.log(`[BackgroundAIManager] 🛑 Outro admin ou IA já respondeu para a mensagem interna ${messageId}. Abortando para evitar duplicidade.`);
                return;
            }

            let currentLeadId = (payload.lead_id && payload.lead_id !== 'null' && payload.lead_id !== '') ? payload.lead_id : null;
            try {
                const { data: historyData } = await supabase
                    .from('internal_messages')
                    .select('*')
                    .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                const history = (historyData || []).reverse().map(m => 
                    `${m.sender_id === uid ? 'Admin' : 'Cliente'}: ${m.content} ${m.lead_id ? `(Ref: ${m.lead_id})` : ''}`
                ).join('\n');

                let specificLead = null;
                let vehicleContext = "";
                let specificVehicleInfo = "";
                let vehiclePhoto = "";
                let requiresManualAnalysis = false;

                if (!currentLeadId) {
                    const lastMsgWithLead = historyData?.find(m => m.lead_id);
                    if (lastMsgWithLead) {
                        currentLeadId = lastMsgWithLead.lead_id;
                    } else if (existingLead) {
                        currentLeadId = existingLead.id;
                        console.log(`[BackgroundAIManager] Usando existingLead (${currentLeadId}) como fallback.`);
                    }
                }

                if (currentLeadId) {
                    const { data } = await supabase
                        .from('leads_veiculos')
                        .select('*')
                        .eq('id', currentLeadId)
                        .maybeSingle();
                    specificLead = data;
                }

                const { data: sellerInventory } = await supabase
                    .from('leads_veiculos')
                    .select('id, marca, modelo, ano_modelo, preco_cliente, situacao_financeira, cor, quilometragem')
                    .eq('user_id', senderId)
                    .neq('id', currentLeadId)
                    .limit(15);

                let inventoryContext = "";
                if (sellerInventory && sellerInventory.length > 0) {
                    inventoryContext = "\n\nESTOQUE COMPLETO DO VENDEDOR (OUTROS MODELOS DISPONÍVEIS NO SISTEMA):\n" + 
                        sellerInventory.map(l => `- ${l.marca} ${l.modelo} (${l.ano_modelo}) | Cor: ${l.cor || 'N/A'} | KM: ${l.quilometragem || '0'} | Preço: R$ ${l.preco_cliente || 'A consultar'} [${l.situacao_financeira || 'Disponível'}]`).join('\n');
                }

                const content = payload.content.toLowerCase();
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
                    requiresManualAnalysis = proposalResult.requiresManualAnalysis;
                    
                    specificVehicleInfo = `
DETALHES COMPLETOS DO VEÍCULO EM FOCO:
- ID: ${specificLead.id}
- Marca/Modelo: ${specificLead.marca} ${specificLead.modelo}
- Ano: ${specificLead.ano_fabricacao}/${specificLead.ano_modelo}
- Placa: ${specificLead.placa || 'N/A'}
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
- Observações: ${specificLead.observacoes || 'N/A'}
- Status do Lead: ${specificLead.status || 'N/A'}
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

                const isFormFilled = !!(specificLead && 
                                      specificLead.marca && 
                                      specificLead.marca.trim() !== "" && 
                                      specificLead.modelo && 
                                      specificLead.modelo.trim() !== "");
                const isBuyerContext = finalIsBuyer || !!payload.lead_id;

                const followUpContext = isFollowUp 
                    ? `\n[MODO FOLLOW-UP ATIVADO]
O cliente visualizou sua última mensagem mas não respondeu. 
**MISSÃO:** Tente re-engajar o cliente usando GATILHOS DE ${isBuyerContext ? 'VENDA' : 'COMPRA'}.
**GATILHOS RECOMENDADOS:**
${isBuyerContext ? 
    '- ESCASSEZ: "Temos outros interessados neste modelo."\n- OPORTUNIDADE: "Essa condição é exclusiva para esta semana."\n- SEGURANÇA: "Veículo com laudo cautelar aprovado e garantia."' : 
    '- CONVENIÊNCIA: "Resolvemos toda a burocracia para você."\n- AGILIDADE: "Pagamento à vista via PIX assim que aprovado."\n- VALORIZAÇÃO: "Nossa análise técnica valoriza os opcionais do seu carro."'}
Seja amigável mas incisivo. Verifique se a conversa não foi finalizada antes de enviar.`
                    : "";

                const formStatusContext = isBuyerContext
                    ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**CONTEXTO DE COMPRA:** O cliente é um COMPRADOR interessado no veículo ${specificLead?.marca} ${specificLead?.modelo}. \n**AÇÃO:** Seja um vendedor persuasivo. Fale sobre as qualidades deste veículo específico, condições de pagamento e incentive o fechamento. NÃO peça para preencher formulário de venda.`
                    : (isFormFilled 
                        ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente é um VENDEDOR que JÁ PREENCHEU o formulário. \n**AÇÃO:** Fale sobre o veículo dele, demonstre interesse técnico e informe que a proposta oficial está sendo analisada pela nossa equipe técnica e será enviada em breve. NÃO peça para preencher o formulário novamente. Foque em manter o cliente engajado enquanto aguarda.`
                        : `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente é um VENDEDOR que AINDA NÃO preencheu o formulário. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`);

                const clientName = senderProfile?.full_name || "Cliente";
                const systemPromptCRM = `
${aiCrmPromptRef.current}

VOCÊ É UM AGENTE DE ATENDIMENTO DE ELITE DA AUTO COMPRA ONLINE.
ESTE É UM CHAT INTERNO COM UM ${finalIsBuyer ? 'COMPRADOR' : 'VENDEDOR'}: ${clientName}.

REGRAS DE OURO:
1. NUNCA use o placeholder {{nome}}. Se quiser se referir ao nome do cliente, use: "${clientName}".
2. Identifique o tom da conversa e seja profissional mas acolhedor.
3. Se for comprador MASTER ou PREMIUM, dê prioridade máxima.
4. Use o contexto do veículo abaixo para responder dúvidas técnicas ou financeiras.
5. Se não souber algo, sugira que um especialista humano irá assumir em instantes.

MEMÓRIA DO SISTEMA: ${aiCrmMemoryRef.current}
`;

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: ${finalIsBuyer ? 'COMPRADOR' : 'VENDEDOR'}
NOME DO REMETENTE: ${clientName}
ROLE: ${senderProfile?.role}

${formStatusContext}
${followUpContext}

CONVERSA ATUAL:
${history}

${vehicleContext} ${inventoryContext} ${specificVehicleInfo}
MANTENHA A COERÊNCIA COM OS VALORES DE FIPE E REGRAS FINANCEIRAS EXPOSTAS.
RESPONDA DIRETAMENTE AO REMETENTE.
                `;

                console.log("[BackgroundAIManager] Generating internal response for prompt length:", fullPrompt.length);
                const response = await AIService.generateContent(
                    fullPrompt,
                    systemPromptCRM,
                    imageBase64 || undefined
                );
                console.log("[BackgroundAIManager] Internal AI Response received:", response ? "SUCCESS" : "NULL/EMPTY", response?.text?.substring(0, 50) + "...");

                if (response && response.text) {
                    const finalText = response.text.replace(/{{nome}}/g, clientName).replace(/{{cliente_nome}}/g, clientName);
                    
                    if (responseModeRef.current === 'webhook' && webhookUrlRef.current) {
                        console.log("[BackgroundAIManager] 🌐 Enviando para WEBHOOK (Modo Webhook ativo)");
                        try {
                            await fetch(webhookUrlRef.current, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'internal_message_response',
                                    conversation_id: senderId,
                                    content: finalText,
                                    lead_id: currentLeadId,
                                    original_message: payload
                                })
                            });
                            console.log("[BackgroundAIManager] ✅ Webhook enviado com sucesso.");
                        } catch (webhookErr) {
                            console.error("[BackgroundAIManager] ❌ Erro ao enviar Webhook:", webhookErr);
                        }
                    } else {
                        console.log("[BackgroundAIManager] 💬 Respondendo diretamente no CHAT (Modo Chat ativo)");
                        await supabase.from('internal_messages').insert({
                            receiver_id: senderId,
                            content: finalText,
                            sender_id: uid,
                            lead_id: currentLeadId,
                            metadata: { is_follow_up: isFollowUp }
                        });
                    }
                    
                    const readCol = payload.is_read !== undefined ? 'is_read' : 'read';
                    await supabase.from('internal_messages')
                        .update({ 
                            [readCol]: true,
                            metadata: { ...(payload.metadata || {}), ai_handled: true, followed_up: isFollowUp }
                        })
                        .eq('id', payload.id);

                    console.log(`[BackgroundAIManager] Resposta automática enviada para interna (FollowUp: ${isFollowUp})`);
                }
            } catch (err) {
                console.error('[BackgroundAIManager] Erro ao processar resposta interna:', err);
                await supabase.from('internal_messages')
                    .update({ 
                        metadata: { 
                            ...(payload.metadata || {}), 
                            ai_failed: true, 
                            ai_error: String(err),
                            failed_at: new Date().toISOString()
                        } 
                    })
                    .eq('id', payload.id);

                // ENVIAR RESPOSTA ESTÁTICA EM CASO DE FALHA DAS APIS (Assumir controle provisório)
                const staticFallback = "Olá! Recebi sua mensagem interna. No momento meus sistemas de processamento automático estão passando por uma atualização. Continuarei tentando processar sua solicitação e em breve trarei a resposta técnica definitiva. Se preferir, um administrador também poderá assumir este chat em instantes.";
                
                // Verifica se já não enviamos esse fallback para ESSA mensagem específica para evitar spam
                const { data: existingInternalFallback } = await supabase
                    .from('internal_messages')
                    .select('id')
                    .eq('metadata->>original_message_id', payload.id)
                    .or('metadata->>is_fallback.eq.true,metadata->>fallback.eq.true')
                    .limit(1);

                if (!existingInternalFallback || existingInternalFallback.length === 0) {
                    await supabase.from('internal_messages').insert({
                        receiver_id: senderId,
                        sender_id: uid,
                        content: staticFallback,
                        lead_id: currentLeadId,
                        metadata: { 
                            ai_handled: true, 
                            is_fallback: true,
                            original_message_id: payload.id,
                            error_ref: String(err)
                        }
                    });
                    console.log(`[BackgroundAIManager] 🛡️ Fallback interno enviado para ${senderId}.`);
                }
            }
        }
    };

    const handlePublicMessage = async (payload: any, isFollowUp = false) => {
        const messageId = payload.id;
        console.log(`[BackgroundAIManager] 📩 handlePublicMessage START [ID: ${messageId}]:`, { 
            content: payload.conteudo, 
            remetente: payload.remetente, 
            isFollowUp,
            metadata: payload.metadata,
            timestamp: new Date().toISOString()
        });
        const uid = currentUserIdRef.current;
        if (!uid) {
            console.log(`[BackgroundAIManager] ⚠️ handlePublicMessage ABORT [ID: ${messageId}]: UID nulo (currentUserIdRef é nulo).`);
            return;
        }

        if (payload.metadata?.ai_handled && !isFollowUp) {
            console.log(`[BackgroundAIManager] handlePublicMessage ABORT [ID: ${messageId}]: Já processada (ai_handled: true).`);
            return;
        }

        const remetente = (payload.remetente || '').toLowerCase();
        if (remetente === 'cliente' || isFollowUp) {
            const leadId = payload.lead_id;

            console.log(`[BackgroundAIManager] 📥 Processando mensagem de lead [ID: ${messageId}]: "${payload.conteudo}"`);
            
            const isGlobalAiEnabled = isAiEnabledRef.current;
            console.log(`[BackgroundAIManager] handlePublicMessage check IA Global [ID: ${messageId}]: ${isGlobalAiEnabled}`);
            
            if (!isGlobalAiEnabled) {
                console.log(`[BackgroundAIManager] handlePublicMessage ABORT [ID: ${messageId}]: IA Global desligada no Ref.`);
                logToStorage(`IA Global desligada. Ignorando mensagem ${messageId}`, 'debug');
                return;
            }

            let leadData: any = null;
            const { data: leadFromTable, error: leadError } = await supabase
                .from('leads_veiculos')
                .select('detalhes_proposta, cliente_nome')
                .eq('id', leadId)
                .maybeSingle();
            
            leadData = leadFromTable;

            if (!leadData) {
                // Tenta buscar no profiles (novo usuário sem veículo ainda)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', leadId)
                    .maybeSingle();
                if (profile) {
                    leadData = { cliente_nome: profile.full_name, detalhes_proposta: {} };
                }
            }
            
            if (leadError && !leadData) {
                console.error(`[BackgroundAIManager] handlePublicMessage ERROR [ID: ${messageId}]: Erro ao buscar lead:`, leadError);
            }
            
            console.log(`[BackgroundAIManager] 📄 Dados do lead [ID: ${messageId}] (${leadId}):`, leadData?.cliente_nome);
            
            const leadAiDisabled = leadData?.detalhes_proposta?.ai_disabled || false;
            if (leadAiDisabled) {
                console.log(`[BackgroundAIManager] ⏭️ IA desativada para este lead específico [ID: ${messageId}] (${leadId}).`);
                logToStorage(`IA desativada para o lead ${leadId}. Ignorando mensagem ${messageId}`, 'debug');
                return;
            }

            const clienteNomeFromLead = leadData?.cliente_nome || "Cliente";
            
            const delay = Math.floor(Math.random() * 5000) + 2000; // 2-7 segundos
            await new Promise(resolve => setTimeout(resolve, delay));

            // Verificação Refinada: Ignora mensagens de BOAS VINDAS ou FALHAS para decidir se deve responder
            const { data: recentAdminResponse } = await supabase
                .from('mensagens')
                .select('id, metadata')
                .eq('lead_id', leadId)
                .in('remetente', ['admin', 'bot'])
                .gt('created_at', payload.created_at);

            const hasValidResponse = recentAdminResponse?.some(m => 
                !m.metadata?.ai_welcome && !m.metadata?.ai_failed && !m.metadata?.is_fallback
            );

            if (hasValidResponse) {
                console.log(`[BackgroundAIManager] 🛑 Já existe uma resposta posterior VÁLIDA para o lead [ID: ${messageId}] (${leadId}). Abortando.`);
                return;
            }

            try {
                console.log(`[BackgroundAIManager] 🧠 Iniciando geração de resposta IA para [ID: ${messageId}]...`);
                const { data: historyData } = await supabase
                    .from('mensagens')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                const history = (historyData || []).reverse().map(m => 
                    `${m.remetente === 'cliente' ? 'Cliente' : 'Vendedor'}: ${m.conteudo}`
                ).join('\n');

                const { data: vehicle } = await supabase
                    .from('leads_veiculos')
                    .select('*')
                    .eq('id', leadId)
                    .maybeSingle();

                let inventoryContext = "";
                let vehicleInfo = "";
                let vehiclePhoto = "";
                let requiresManualAnalysis = false;
                if (vehicle) {
                    const allPhotos = vehicle.fotos || [];
                    vehiclePhoto = allPhotos[0] || "";
                    
                    const proposalResult = calculateProposal(vehicle, {
                        fipeRules: fipeRulesRef.current || [],
                        banks: banksRef.current || [],
                        cooperativeDiscount: cooperativeDiscountRef.current || 0,
                        profitMarginPercentage: profitMarginPercentageRef.current || 0,
                        jurosAtraso: jurosAtrasoRef.current || 1,
                        repairCosts: repairCostsRef.current || []
                    });
                    const propostaFinal = proposalResult.finalValue;
                    requiresManualAnalysis = proposalResult.requiresManualAnalysis;
                    
                    vehicleInfo = `
VEÍCULO EM NEGOCIAÇÃO:
- ID: ${vehicle.id}
- Marca/Modelo: ${vehicle.marca || 'N/A'} ${vehicle.modelo || 'N/A'}
- Ano: ${vehicle.ano_fabricacao || 'N/A'}/${vehicle.ano_modelo || 'N/A'}
- Placa: ${vehicle.placa || 'N/A'}
- Preço Sugerido/Cliente: R$ ${vehicle.preco_cliente || 'A consultar'}
- PROPOSTA FINAL CALCULADA: R$ ${propostaFinal || 'A calcular'}
- KM: ${vehicle.quilometragem || vehicle.km || '0'}
- Cor: ${vehicle.cor || 'Não informada'}
- Sinistro/Leilão: ${vehicle.tem_sinistro === 'sim' ? 'Sim' : 'Não'} / ${vehicle.passagem_leilao === 'sim' ? 'Sim' : 'Não'}
- Status: ${vehicle.status || 'N/A'}
`;

                    // Guard clause for the "others" query to prevent crash on null email
                    if (vehicle.email) {
                        try {
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
                        } catch (e) {
                            console.warn("[BackgroundAIManager] Erro ao buscar outros veículos do lead:", e);
                        }
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

                const isFormFilled = !!(vehicle && vehicle.marca && vehicle.modelo);
                const followUpContext = isFollowUp 
                    ? `\n[MODO FOLLOW-UP ATIVADO]
O cliente visualizou sua última mensagem mas não respondeu. 
**MISSÃO:** Tente re-engajar o cliente usando GATILHOS DE COMPRA (persuasão para ele vender para nós).
**GATILHOS RECOMENDADOS:**
- CONVENIÊNCIA: "Resolvemos toda a burocracia e transferência."
- AGILIDADE: "Dinheiro na conta hoje mesmo via PIX."
- VALORIZAÇÃO: "Conseguimos cobrir ofertas se o carro estiver impecável."
Seja amigável mas incisivo. Verifique se a conversa não foi finalizada antes de enviar.`
                    : "";

                const formStatusContext = isFormFilled 
                    ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente JÁ PREENCHEU o formulário com os dados do veículo. \n**AÇÃO:** Fale sobre o veículo dele, demonstre interesse técnico e informe que a proposta oficial está sendo analisada pela nossa equipe técnica e será enviada em breve. NÃO peça para preencher o formulário novamente. Foque em manter o cliente engajado enquanto aguarda.`
                    : `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente AINDA NÃO preencheu o formulário com os dados do veículo. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`;

                const clientName = leadData?.cliente_nome || "Cliente";
                const activePrompt = `
${aiPromptRef.current}

VOCÊ É O ASSISTENTE INTELIGENTE DA AUTO COMPRA ONLINE.
ESTÁ FALANDO COM O CLIENTE: ${clientName}.

REGRAS CRÍTICAS:
1. NUNCA responda com "{{nome}}". Se necessário, chame-o de "${clientName}".
2. Identifique o tom da conversa e seja profissional mas acolhedor.
3. Use os dados técnicos do veículo abaixo para dar segurança ao cliente.

MEMÓRIA DO SISTEMA: ${aiMemoryRef.current}
`;

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: VENDEDOR (QUERENDO VENDER O CARRO DELE PARA NÓS)
NOME DO CLIENTE: ${clientName}
${followUpContext}

${formStatusContext}
${vehicleInfo}
${inventoryContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.conteudo}

[REGRAS E MEMÓRIA DO VENDEDOR - ORIGEM: MENU IA]
${aiPromptRef.current}
${aiMemoryRef.current ? `\nMEMÓRIA APRENDIDA (CONSULTE ANTES DE RESPONDER):\n${aiMemoryRef.current}` : ''}

REGRAS DE PROPOSTA:
${autoProposalEnabledRef.current && !requiresManualAnalysis ? 
    "VOCÊ ESTÁ AUTORIZADO A ENVIAR A PROPOSTA FINAL. Use o valor 'PROPOSTA FINAL CALCULADA' mencionado acima se o cliente perguntar sobre valores ou propostas." : 
    (requiresManualAnalysis ? 
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta." :
        "MODO MANUAL: Não envie valores de proposta agora. Foque em tirar dúvidas e manter o cliente engajado.")}

REGRAS DE ESTOQUE:
- Se o usuário perguntar sobre "outros modelos", "o que tem no sistema" ou "meus carros", você DEVE confirmar os veículos listando explicitamente o **ANO e MODELO** de cada um.
- Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.

REGRAS GERAIS:
1. Use os dados técnicos acima.
2. Seja persuasivo, amigável e direto.
3. Responda como um vendedor de carros experiente.
4. EVITE REPETIR SAUDAÇÕES.
`;

                const { AIService } = await import('../../services/aiService');
                const response = await AIService.generateContent(
                    fullPrompt,
                    "Você é um especialista de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo. NUNCA mencione ser uma IA ou que haverá contato humano posterior, você é o especialista responsável.",
                    imageBase64 || undefined
                );
                
                if (response && response.text) {
                    const finalText = response.text.replace(/{{nome}}/g, clientName).replace(/{{cliente_nome}}/g, clientName);
                    console.log(`[BackgroundAIManager] 🧊 Decidindo canal de resposta: Mode=${responseModeRef.current}, HasWebhook=${!!webhookUrlRef.current}`);
                    if (responseModeRef.current === 'webhook' && webhookUrlRef.current) {
                        console.log("[BackgroundAIManager] 🌐 ENVIANDO VIA WEBHOOK (Chat suprimido para evitar duplicidade)");
                        try {
                            const startTime = Date.now();
                            const res = await fetch(webhookUrlRef.current, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'public_message_response',
                                    lead_id: leadId,
                                    content: response.text,
                                    original_message: payload,
                                    metadata: { ai_handled: true, is_follow_up: isFollowUp }
                                })
                            });
                            console.log(`[BackgroundAIManager] ✅ Webhook enviado. Status: ${res.status}, Tempo: ${Date.now() - startTime}ms`);
                        } catch (webhookErr) {
                            console.error("[BackgroundAIManager] ❌ Erro ao enviar Webhook (Fallback para Chat desativado por config parcial):", webhookErr);
                        }
                    } else {
                        console.log("[BackgroundAIManager] 💬 ENVIANDO VIA CHAT (Lead ID:", leadId, ")");
                        logToStorage(`Resposta IA enviada via Chat para lead ${leadId}`, 'info');
                        const { error: insertError } = await supabase.from('mensagens').insert({
                            lead_id: leadId,
                            conteudo: finalText,
                            remetente: 'bot',
                            metadata: { ai_handled: true, original_message_id: payload.id, is_follow_up: isFollowUp }
                        });
                        if (insertError) {
                            console.error("[BackgroundAIManager] ❌ Erro ao inserir resposta no CHAT:", insertError);
                        } else {
                            console.log("[BackgroundAIManager] ✅ Resposta inserida no banco com sucesso.");
                        }
                    }

                    await supabase.from('mensagens')
                        .update({ 
                            lida: true,
                            metadata: { ...(payload.metadata || {}), ai_handled: true, followed_up: isFollowUp }
                        })
                        .eq('id', payload.id);

                    console.log(`[BackgroundAIManager] Resposta automática enviada para lead (FollowUp: ${isFollowUp})`);
                }
            } catch (err) {
                console.error('[BackgroundAIManager] ❌ ERRO FATAL ao processar resposta para lead:', leadId, 'Msg:', payload.id);
                console.error('[BackgroundAIManager] Stack Trace:', err);
                
                // Marca a mensagem como falha no metadado
                await supabase.from('mensagens')
                    .update({ 
                        metadata: { 
                            ...(payload.metadata || {}), 
                            ai_failed: true, 
                            ai_error: String(err),
                            failed_at: new Date().toISOString()
                        } 
                    })
                    .eq('id', payload.id);

                // ENVIAR RESPOSTA ESTÁTICA EM CASO DE FALHA DAS APIS
                // Isso garante que o cliente nunca fique sem resposta, mesmo sem chaves de API válidas
                const staticFallback = "Olá! Recebi sua mensagem. No momento nossos sistemas de análise automática estão passando por uma atualização rápida. Sou o especialista responsável por este atendimento e em instantes darei continuidade à sua análise pessoalmente. Por favor, aguarde só um momento!";
                
                // VERIFICA SE JÁ ENVIAMOS FALLBACK PARA ESTA MENSAGEM (Evita flood se o scanner forçar retry)
                const { data: existingPublicFallback } = await supabase
                    .from('mensagens')
                    .select('id')
                    .eq('lead_id', leadId)
                    .eq('metadata->>original_message_id', payload.id)
                    .or('metadata->>is_fallback.eq.true,metadata->>fallback.eq.true')
                    .limit(1);

                if (!existingPublicFallback || existingPublicFallback.length === 0) {
                    await supabase.from('mensagens').insert({
                        lead_id: leadId,
                        conteudo: staticFallback,
                        remetente: 'bot',
                        metadata: { 
                            ai_handled: true, 
                            is_fallback: true,
                            original_message_id: payload.id,
                            error_ref: String(err)
                        }
                    });
                    console.log(`[BackgroundAIManager] 🛡️ Mensagem Estática de Fallback enviada para lead ${leadId} devido a erro de API.`);
                } else {
                    console.log(`[BackgroundAIManager] ⏭️ Fallback já existe para msg ${payload.id}. Apenas registrando erro e aguardando autorecuperação da IA...`);
                }
            }
        }
    };

    const scanForOpenMessages = async () => {
        const uid = currentUserIdRef.current;
        const isEnabled = isAiEnabledRef.current;
        
        console.log("[BackgroundAIManager] 🔍 scanForOpenMessages START. Enabled:", isEnabled, "UID:", uid, "Timestamp:", new Date().toISOString());
        logToStorage(`Varredura de mensagens iniciada (IA: ${isEnabled ? 'ON' : 'OFF'})`, 'debug');
        
        if (!uid) {
            console.log("[BackgroundAIManager] 🔍 scanForOpenMessages ABORT: UID nulo (usuário não autenticado no ref).");
            return;
        }
        if (!isEnabled) {
            console.log("[BackgroundAIManager] 🔍 scanForOpenMessages ABORT: IA Global desligada no Ref.");
            return;
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        console.log("[BackgroundAIManager] 🔍 scanForOpenMessages: Buscando mensagens desde", thirtyDaysAgo);

        // 1. Escaneia mensagens internas (Compradores)
        const { data: allInternal } = await supabase
            .from('internal_messages')
            .select('*')
            .or(`receiver_id.eq.${uid},sender_id.eq.${uid},receiver_id.eq.00000000-0000-0000-0000-000000000000`)
            .gt('created_at', thirtyDaysAgo)
            .order('created_at', { ascending: false });

        if (allInternal) {
            const convs = new Map();
            allInternal.forEach(m => {
                const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id;
                if (!convs.has(otherId)) convs.set(otherId, m);
            });

            for (const [otherId, lastMsg] of convs.entries()) {
                const readCol = lastMsg.is_read !== undefined ? 'is_read' : 'read';
                const timeDiff = Date.now() - new Date(lastMsg.created_at).getTime();
                
                // Busca a última mensagem do CLIENTE nesta conversa
                const lastClientMsg = allInternal.find(m => 
                    (m.sender_id === otherId) && 
                    m.sender_id !== uid
                );

                // Busca a última resposta SUCESSO da IA/Admin (ignorando fallbacks de erro)
                const lastAdminSuccess = allInternal.find(m => 
                    m.sender_id === uid && 
                    m.metadata?.ai_handled === true &&
                    !m.metadata?.is_fallback
                );

                const isAiFailed = lastClientMsg?.metadata?.ai_failed;
                const lastFailedTime = lastClientMsg?.metadata?.failed_at ? new Date(lastClientMsg.metadata.failed_at).getTime() : 0;
                const shouldRetry = isAiFailed && (Date.now() - lastFailedTime > 30000); // Retry mais agressivo (30s) para forçar controle

                if (lastClientMsg && (!lastAdminSuccess || new Date(lastClientMsg.created_at) > new Date(lastAdminSuccess.created_at))) {
                    if (!lastClientMsg.metadata?.ai_handled && (!isAiFailed || shouldRetry)) {
                        if (timeDiff > 5000) { 
                            console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Detectada mensagem interna não respondida de ${otherId}. ${shouldRetry ? '(RETRY)' : ''} Processando...`);
                            handleInternalMessage(lastClientMsg);
                        }
                    }
                }
                else if (lastMsg.metadata?.ai_handled) {
                    // Já processado
                }
                else if (isAiFailed && !shouldRetry) {
                    console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Mensagem interna de ${otherId} falhou recentemente. Aguardando cooldown de retry.`);
                }
                else if (lastMsg.sender_id === uid && lastMsg[readCol] && !lastMsg.metadata?.followed_up) {
                    if (timeDiff > 7200000) { // 2 horas
                        handleInternalMessage(lastMsg, true);
                    }
                }
            }
        }

        // 2. Escaneia mensagens públicas (Vendedores)
        const { data: allPublic } = await supabase
            .from('mensagens')
            .select('*')
            .gt('created_at', thirtyDaysAgo)
            .order('created_at', { ascending: false });

        if (allPublic) {
            const leads = new Map();
            allPublic.forEach(m => {
                if (!leads.has(m.lead_id)) leads.set(m.lead_id, m);
            });

            for (const [leadId, lastMsg] of leads.entries()) {
                const timeDiff = Date.now() - new Date(lastMsg.created_at).getTime();
                
                // Busca a última mensagem do CLIENTE para este lead
                const lastClientMsg = allPublic.find(m => 
                    m.lead_id === leadId && 
                    m.remetente?.toLowerCase() === 'cliente'
                );

                // Busca a última resposta SUCESSO da IA/Admin (Ignorando mensagens de boas-vindas ou falhas)
                const lastAdminSuccess = allPublic.find(m => 
                    m.lead_id === leadId && 
                    (m.remetente?.toLowerCase() === 'admin' || m.remetente?.toLowerCase() === 'bot') &&
                    m.metadata?.ai_handled === true &&
                    !m.metadata?.ai_welcome &&
                    !m.metadata?.is_fallback &&
                    !m.metadata?.fallback
                );

                const isAiFailed = lastClientMsg?.metadata?.ai_failed;
                const lastFailedTime = lastClientMsg?.metadata?.failed_at ? new Date(lastClientMsg.metadata.failed_at).getTime() : 0;
                const shouldRetry = isAiFailed && (Date.now() - lastFailedTime > 30000); // Retry mais agressivo (30s) para forçar controle

                if (lastClientMsg && (!lastAdminSuccess || new Date(lastClientMsg.created_at) > new Date(lastAdminSuccess.created_at))) {
                    if (!lastClientMsg.metadata?.ai_handled && (!isAiFailed || shouldRetry)) {
                        if (timeDiff > 5000) { 
                            console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Detectada mensagem pública não respondida do lead ${leadId}. ${shouldRetry ? '(RETRY)' : ''} Processando...`);
                            handlePublicMessage(lastClientMsg);
                        }
                    }
                }
                else if (lastMsg.metadata?.ai_handled) {
                    // Já processado
                }
                else if (isAiFailed && !shouldRetry) {
                    console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Mensagem do lead ${leadId} falhou recentemente. Aguardando cooldown de retry.`);
                }
                else if (lastMsg.remetente !== 'cliente' && lastMsg.lida && !lastMsg.metadata?.followed_up) {
                    if (timeDiff > 7200000) { // 2 horas
                        handlePublicMessage(lastMsg, true);
                    }
                }
            }
        }
    };

    useEffect(() => {
        if (!currentUserId) {
            console.log("[BackgroundAIManager] ⏳ Aguardando currentUserId para iniciar scanner...");
            return;
        }

        console.log("[BackgroundAIManager] 🚀 Iniciando scanner de mensagens para o usuário:", currentUserId);
        scanForOpenMessages(); 
        const interval = setInterval(scanForOpenMessages, 30000); // 30 segundos

        const channelName = `bg_ai_messages_${currentUserId}`;
        
        const internalMessageSubscription = supabase
            .channel(channelName)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'internal_messages' 
            }, async (payload) => {
                handleInternalMessage(payload.new);
            })
            .subscribe();

        const publicMessageSubscription = supabase
            .channel(`bg_ai_public_${currentUserId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'mensagens' 
            }, async (payload) => {
                console.log("[BackgroundAIManager] 🔔 Realtime INSERT in 'mensagens':", payload.new);
                handlePublicMessage(payload.new);
            })
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(internalMessageSubscription);
            supabase.removeChannel(publicMessageSubscription);
        };

    }, [currentUserId]);

    return null;
};

export default BackgroundAIManager;
