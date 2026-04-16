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
        }, 60000); // 1 minuto

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
                console.log("[BackgroundAIManager] RAW Settings:", JSON.stringify(data));
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
                    console.log("[BackgroundAIManager] IA Global status no banco:", enabled.value, "->", isEnabled);
                    setIsAiEnabled(isEnabled);
                    isAiEnabledRef.current = isEnabled; // Update ref immediately
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
                console.log("[BackgroundAIManager] 👤 Sessão encontrada:", session.user.id);
                setCurrentUserId(session.user.id);
                currentUserIdRef.current = session.user.id;
            } else {
                console.log("[BackgroundAIManager] 👤 Nenhuma sessão ativa encontrada no momento.");
            }
        };
        checkSession();

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[BackgroundAIManager] 👤 Auth Event:", event, session?.user?.id);
            if (session?.user) {
                setCurrentUserId(session.user.id);
                currentUserIdRef.current = session.user.id;
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
            .subscribe();

        return () => {
            clearInterval(heartbeat);
            supabase.removeChannel(settingsSubscription);
            supabase.removeChannel(apiKeysSubscription);
            supabase.removeChannel(dataSubscription);
            authSubscription.unsubscribe();
        };
    }, []);

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
                .select('is_ai_enabled, role, full_name')
                .eq('id', senderId)
                .maybeSingle();
            
            console.log(`[BackgroundAIManager] Perfil do remetente (${senderId}):`, senderProfile);
            
            const { data: existingLead } = await supabase
                .from('leads_veiculos')
                .select('id, marca, modelo')
                .eq('user_id', senderId)
                .maybeSingle();

            const isBuyer = senderProfile?.role?.toLowerCase().includes('buyer') || (payload.lead_id && payload.lead_id !== 'null' && payload.lead_id !== '');
            const isSeller = senderProfile?.role?.toLowerCase().includes('seller') || (!isBuyer && !!existingLead);
            
            const finalIsBuyer = isBuyer || (payload.lead_id ? true : false);
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

            if (!finalIsBuyer && finalIsSeller && !existingLead && !payload.lead_id) {
                console.log(`[BackgroundAIManager] Vendedor sem lead encontrado. Induzindo preenchimento.`);
                await supabase.from('internal_messages').insert({
                    receiver_id: senderId,
                    content: "Olá! Para que eu possa te ajudar a encontrar o melhor negócio e fornecer uma proposta de valor, você precisa preencher nosso formulário completo aqui: https://autocompra.online/vender. Assim nossa equipe consegue fazer uma análise técnica detalhada para você!",
                    sender_id: uid,
                    lead_id: null
                });
                return;
            }

            const delay = Math.floor(Math.random() * 10000) + 5000; // 5-15 segundos
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

                let currentLeadId = payload.lead_id;
                let specificLead = null;
                let vehicleContext = "";
                let specificVehicleInfo = "";
                let vehiclePhoto = "";
                let requiresManualAnalysis = false;

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

                const isFormFilled = !!(specificLead && specificLead.marca && specificLead.modelo);
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

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: ${isBuyerContext ? 'COMPRADOR (INTERESSADO EM COMPRAR UM CARRO DO NOSSO ESTOQUE)' : 'VENDEDOR (QUERENDO VENDER O CARRO DELE PARA NÓS)'}
OBJETIVO: Roteamento inteligente e uso estrito de memórias/regras.
${followUpContext}

### 1. CONTEXTO: ${isBuyerContext ? 'SITE COMPRADOR (ESTOQUE)' : 'SITE VENDEDOR (LEADS)'}
- **AMBIENTE:** ${isBuyerContext ? 'ADMIN > CRM > MENSAGENS' : 'ADMIN > MENSAGENS'}
- **MEMÓRIA OBRIGATÓRIA:** ${isBuyerContext ? 'IA CRM (Compradores)' : 'IA (Leads Vendedor)'}
- **REGRAS OBRIGATÓRIAS:** ${isBuyerContext ? 'IA CRM (Compradores)' : 'IA (Leads Vendedor)'}
- **GATILHOS OBRIGATÓRIOS:** ${isBuyerContext ? 'IA CRM (Compradores)' : 'IA (Leads Vendedor)'}

SUA MISSÃO:
1. ANALISAR E SEGUIR ESTRITAMENTE as REGRAS PERSONALIZADAS e a MEMÓRIA fornecidas abaixo.
2. Se houver conflito entre o seu conhecimento geral e as REGRAS PERSONALIZADAS, as REGRAS PERSONALIZADAS prevalecem.
3. Você deve consultar a MEMÓRIA DE LONGO PRAZO antes de formular qualquer resposta.
4. **ISOLAMENTO:** Nunca utilize regras ou dados de ${isBuyerContext ? 'vendedores' : 'compradores'} neste chat de ${isBuyerContext ? 'comprador' : 'vendedor'}.
5. **HISTÓRICO COMPLETO:** Analise todo o histórico de mensagens fornecido para entender o contexto e agir de forma consistente.

### CAPACIDADE DE VISÃO (ANÁLISE DE FOTOS)
- **Se houver uma foto anexada ou no contexto:** Analise o estado de conservação do veículo. Identifique avarias visíveis e use isso para fundamentar sua análise técnica.

**IMPORTANTE:** 
- NUNCA diga que você é uma Inteligência Artificial ou um robô.
- NUNCA diga que "um humano entrará em contato". Você é o ESPECIALISTA responsável.
- Se precisar de tempo, diga que "nossos especialistas estão finalizando a análise".

${formStatusContext}

${specificVehicleInfo}
${vehicleContext}
${inventoryContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.content}

[REGRAS E MEMÓRIA DO MENU IA]
${isBuyerContext ? aiCrmPromptRef.current : aiPromptRef.current}
${(isBuyerContext ? aiCrmMemoryRef.current : aiMemoryRef.current) ? `\nMEMÓRIA APRENDIDA (CONSULTE ANTES DE RESPONDER):\n${isBuyerContext ? aiCrmMemoryRef.current : aiMemoryRef.current}` : ''}

REGRAS DE PROPOSTA:
${autoProposalEnabledRef.current && !requiresManualAnalysis ? 
    "VOCÊ ESTÁ AUTORIZADO A ENVIAR A PROPOSTA FINAL. Use o valor 'PROPOSTA FINAL CALCULADA' mencionado acima se o cliente perguntar sobre valores ou propostas." : 
    (requiresManualAnalysis ? 
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta." :
        "MODO MANUAL: Não envie valores de proposta agora. Foque em tirar dúvidas e manter o cliente engajado.")}

REGRAS DE ESTOQUE:
- Se o usuário perguntar sobre "outros modelos", "o que tem no sistema" ou "meus carros", você DEVE confirmar os veículos listando explicitamente o **ANO e MODELO** de cada um.
- **PROIBIÇÃO:** NUNCA diga que "por questões de segurança não detalhamos os modelos". Você deve ser transparente para deixar o vendedor tranquilo de que os dados estão no banco de dados.
- Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.

REGRAS GERAIS:
1. Use os dados técnicos acima.
2. Seja persuasivo e amigável.
3. Responda como um consultor de vendas especializado em compradores.
`;

                console.log("[BackgroundAIManager] Generating internal response for prompt length:", fullPrompt.length);
                const response = await AIService.generateContent(
                    fullPrompt,
                    "Você é um especialista de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo. NUNCA mencione ser uma IA ou que haverá contato humano posterior, você é o especialista responsável.",
                    imageBase64 || undefined
                );
                console.log("[BackgroundAIManager] Internal AI Response received:", response ? "SUCCESS" : "NULL/EMPTY", response?.text?.substring(0, 50) + "...");

                if (response && response.text) {
                    if (responseModeRef.current === 'webhook' && webhookUrlRef.current) {
                        console.log("[BackgroundAIManager] 🌐 Enviando para WEBHOOK (Modo Webhook ativo)");
                        try {
                            await fetch(webhookUrlRef.current, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'internal_message_response',
                                    conversation_id: senderId,
                                    content: response.text,
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
                            content: response.text,
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

            const { data: leadData, error: leadError } = await supabase
                .from('leads_veiculos')
                .select('detalhes_proposta, cliente_nome')
                .eq('id', leadId)
                .maybeSingle();
            
            if (leadError) {
                console.error(`[BackgroundAIManager] handlePublicMessage ERROR [ID: ${messageId}]: Erro ao buscar lead:`, leadError);
            }
            
            console.log(`[BackgroundAIManager] 📄 Dados do lead [ID: ${messageId}] (${leadId}):`, leadData?.cliente_nome);
            
            const leadAiDisabled = leadData?.detalhes_proposta?.ai_disabled || false;
            if (leadAiDisabled) {
                console.log(`[BackgroundAIManager] ⏭️ IA desativada para este lead específico [ID: ${messageId}] (${leadId}).`);
                logToStorage(`IA desativada para o lead ${leadId}. Ignorando mensagem ${messageId}`, 'debug');
                return;
            }

            const delay = Math.floor(Math.random() * 2000) + 1000; 
            await new Promise(resolve => setTimeout(resolve, delay));

            const { data: recentMsg } = await supabase
                .from('mensagens')
                .select('id')
                .eq('lead_id', leadId)
                .in('remetente', ['admin', 'bot'])
                .gt('created_at', payload.created_at)
                .limit(1);

            if (recentMsg && recentMsg.length > 0) {
                console.log(`[BackgroundAIManager] 🛑 Já existe uma resposta posterior para o lead [ID: ${messageId}] (${leadId}). Abortando.`);
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
                    .single();

                let inventoryContext = "";
                let vehicleInfo = "";
                let vehiclePhoto = "";
                let requiresManualAnalysis = false;
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
                    requiresManualAnalysis = proposalResult.requiresManualAnalysis;
                    
                    vehicleInfo = `
VEÍCULO EM NEGOCIAÇÃO:
- ID: ${vehicle.id}
- Marca/Modelo: ${vehicle.marca} ${vehicle.modelo}
- Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}
- Placa: ${vehicle.placa || 'N/A'}
- Preço Sugerido/Cliente: R$ ${vehicle.preco_cliente || 'A consultar'}
- PROPOSTA FINAL CALCULADA: R$ ${propostaFinal || 'A calcular'}
- KM: ${vehicle.quilometragem || vehicle.km || '0'}
- Cor: ${vehicle.cor || 'Não informada'}
- Situação Financeira: ${vehicle.situacao_financeira || 'Não informada'}
- Entrada: R$ ${vehicle.entrada || '0'}
- Valor Parcela: R$ ${vehicle.valor_parcela || '0'}
- Total Parcelas: ${vehicle.total_parcelas || '0'}
- Banco: ${vehicle.banco_financiamento || 'Nenhum'}
- Sinistro/Leilão: ${vehicle.tem_sinistro === 'sim' ? 'Sim' : 'Não'} / ${vehicle.passagem_leilao === 'sim' ? 'Sim' : 'Não'}
- Observações: ${vehicle.observacoes || 'N/A'}
- Status do Lead: ${vehicle.status || 'N/A'}
`;

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

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: VENDEDOR (QUERENDO VENDER O CARRO DELE PARA NÓS)
OBJETIVO: Roteamento inteligente e uso estrito de memórias/regras.
${followUpContext}

### 1. CONTEXTO: SITE VENDEDOR (LEADS)
- **AMBIENTE:** ADMIN > MENSAGENS
- **MEMÓRIA OBRIGATÓRIA:** IA (Leads Vendedor)
- **REGRAS OBRIGATÓRIAS:** IA (Leads Vendedor)
- **GATILHOS OBRIGATÓRIOS:** IA (Leads Vendedor)

SUA MISSÃO:
1. ANALISAR E SEGUIR ESTRITAMENTE as REGRAS PERSONALIZADAS e a MEMÓRIA fornecidas abaixo.
2. Se houver conflito entre o seu conhecimento geral e as REGRAS PERSONALIZADAS, as REGRAS PERSONALIZADAS prevalecem.
3. Você deve consultar a MEMÓRIA DE LONGO PRAZO antes de formular qualquer resposta.
4. **ISOLAMENTO:** Nunca utilize regras ou dados de compradores neste chat de vendedor.

### CAPACIDADE DE VISÃO (ANÁLISE DE FOTOS)
- **Se houver uma foto anexada ou no contexto:** Analise o estado de conservação do veículo. Identifique avarias visíveis e use isso para fundamentar sua análise técnica.

**IMPORTANTE:** 
- NUNCA diga que você é uma Inteligência Artificial ou um robô.
- NUNCA diga que "um humano entrará em contato". Você é o ESPECIALISTA responsável.
- Se precisar de tempo, diga que "nossos especialistas estão finalizando a análise".

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
- **PROIBIÇÃO:** NUNCA diga que "por questões de segurança não detalhamos os modelos". Você deve ser transparente para deixar o vendedor tranquilo de que os dados estão no banco de dados.
- Informe o Ano, Modelo e uma breve descrição (Cor/KM) para cada veículo do estoque.

REGRAS GERAIS:
1. Use os dados técnicos acima.
2. Seja persuasivo, amigável e direto.
3. Responda como um vendedor de carros experiente.
4. EVITE REPETIR SAUDAÇÕES: Se o histórico já contém um "Bom dia", "Boa tarde" ou "Olá" recente, NÃO repita. Vá direto ao assunto.
5. NÃO envie mensagens duplicadas. Se a última mensagem do histórico já responde o que o cliente perguntou, não responda novamente.
`;

                console.log("[BackgroundAIManager] Generating lead response for prompt length:", fullPrompt.length);
                console.log("[BackgroundAIManager] Generating public response for prompt length:", fullPrompt.length);
                logToStorage(`Gerando resposta IA para lead ${leadId} (Mensagem: ${payload.conteudo})`, 'info');
                const response = await AIService.generateContent(
                    fullPrompt,
                    "Você é um especialista de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo. NUNCA mencione ser uma IA ou que haverá contato humano posterior, você é o especialista responsável.",
                    imageBase64 || undefined
                );
                
                console.log("[BackgroundAIManager] Public AI Response received:", response ? "SUCCESS" : "NULL/EMPTY", response?.text?.substring(0, 50) + "...");

                if (response && response.text) {
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
                            conteudo: response.text,
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
                console.error('[BackgroundAIManager] Erro ao processar resposta para lead:', err);
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
                const isAiFailed = lastMsg.metadata?.ai_failed;
                const lastFailedTime = lastMsg.metadata?.failed_at ? new Date(lastMsg.metadata.failed_at).getTime() : 0;
                const shouldRetry = isAiFailed && (Date.now() - lastFailedTime > 60000); // Retry após 1 min

                if (lastMsg.sender_id !== uid && !lastMsg.metadata?.ai_handled && (!isAiFailed || shouldRetry)) {
                    if (timeDiff > 60000) { 
                        console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Detectada mensagem interna não respondida de ${otherId}. ${shouldRetry ? '(RETRY)' : ''} Processando...`);
                        handleInternalMessage(lastMsg);
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
                const remetente = (lastMsg.remetente || '').toLowerCase();
                const isAiFailed = lastMsg.metadata?.ai_failed;
                const lastFailedTime = lastMsg.metadata?.failed_at ? new Date(lastMsg.metadata.failed_at).getTime() : 0;
                const shouldRetry = isAiFailed && (Date.now() - lastFailedTime > 60000); // Retry após 1 min

                console.log(`[BackgroundAIManager] 🔍 Verificando lead ${leadId}: Remetente="${remetente}", Handled=${!!lastMsg.metadata?.ai_handled}, Failed=${!!isAiFailed}, TimeDiff=${Math.round(timeDiff/1000)}s`);

                if (remetente === 'cliente' && !lastMsg.metadata?.ai_handled && (!isAiFailed || shouldRetry)) {
                    if (timeDiff > 5000) { 
                        console.log(`[BackgroundAIManager] 🔍 scanForOpenMessages: Detectada mensagem pública não respondida do lead ${leadId}. ${shouldRetry ? '(RETRY)' : ''} Processando...`);
                        handlePublicMessage(lastMsg);
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
