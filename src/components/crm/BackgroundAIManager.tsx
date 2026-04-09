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

    const handleInternalMessage = async (payload: any) => {
        const uid = currentUserIdRef.current;
        if (!uid) return;

        // Só processa se a mensagem for para o admin logado ou para o ID genérico de suporte
        const isForMe = payload.receiver_id === uid || 
                        payload.receiver_id === '00000000-0000-0000-0000-000000000000' || 
                        (!payload.receiver_id && uid);
        
        console.log(`[BackgroundAIManager] Mensagem ${payload.id} recebida. isForMe: ${isForMe}, sender_id: ${payload.sender_id}, uid: ${uid}`);

        // Só responde se a mensagem não for minha
        if (isForMe && payload.sender_id !== uid) {
            const senderId = payload.sender_id;
            const messageId = payload.id;

            console.log(`[BackgroundAIManager] 🤖 IA processando mensagem interna (${messageId}) de ${senderId}.`);
            
            // Verifica se o remetente é um comprador ou vendedor
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('is_ai_enabled, role, full_name')
                .eq('id', senderId)
                .maybeSingle();
            
            console.log(`[BackgroundAIManager] Perfil do remetente (${senderId}):`, senderProfile);
            
            // Verifica se já existe um lead (veículo) para este remetente (se for vendedor)
            const { data: existingLead } = await supabase
                .from('leads_veiculos')
                .select('id, marca, modelo')
                .eq('user_id', senderId)
                .maybeSingle();

            const isBuyer = senderProfile?.role?.toLowerCase().includes('buyer') || (payload.lead_id && payload.lead_id !== 'null' && payload.lead_id !== '');
            const isSeller = senderProfile?.role?.toLowerCase().includes('seller') || (!isBuyer && !!existingLead);
            
            const finalIsBuyer = isBuyer || (payload.lead_id ? true : false);
            const finalIsSeller = !finalIsBuyer && (isSeller || senderProfile?.role === 'user');

            console.log(`[BackgroundAIManager] Detecção de papel - isBuyer: ${finalIsBuyer}, isSeller: ${finalIsSeller}, lead_id: ${payload.lead_id}`);

            const isGlobalAiEnabled = isAiEnabledRef.current;
            const conversationAiState = senderProfile?.is_ai_enabled;

            console.log(`[BackgroundAIManager] Configurações de IA - Global: ${isGlobalAiEnabled}, Conversa: ${conversationAiState}`);

            let shouldRespond = false;
            if (isGlobalAiEnabled) {
                shouldRespond = conversationAiState !== false;
            } else {
                shouldRespond = conversationAiState === true;
            }

            if (!shouldRespond) {
                console.log(`[BackgroundAIManager] ⏭️ IA ignorando resposta (shouldRespond: false).`);
                return;
            }

            // Lógica de verificação de lead (APENAS se for um vendedor sem lead cadastrado)
            // Se for um COMPRADOR (isBuyer ou tem lead_id), NUNCA induz preenchimento de formulário de venda
            if (!isBuyer && isSeller && !existingLead && !payload.lead_id) {
                console.log(`[BackgroundAIManager] Vendedor sem lead encontrado. Induzindo preenchimento.`);
                await supabase.from('internal_messages').insert({
                    receiver_id: senderId,
                    content: "Olá! Para que eu possa te ajudar a encontrar o melhor negócio e fornecer uma proposta de valor, você precisa preencher nosso formulário completo aqui: https://autocompra.online/vender. Assim nossa equipe consegue fazer uma análise técnica detalhada para você!",
                    sender_id: uid,
                    lead_id: null
                });
                return;
            }

            // Pequeno delay aleatório maior para evitar que múltiplos admins respondam ao mesmo tempo
            const delay = Math.floor(Math.random() * 10000) + 5000; // 5-15 segundos
            await new Promise(resolve => setTimeout(resolve, delay));

            // Verifica se JÁ existe uma resposta de QUALQUER ADMIN para ESTA mensagem específica
            const { data: recentAdminMsg } = await supabase
                .from('internal_messages')
                .select('id')
                .eq('receiver_id', senderId)
                .neq('sender_id', senderId) // Alguém que não é o remetente original respondeu
                .gt('created_at', payload.created_at)
                .limit(1);

            if (recentAdminMsg && recentAdminMsg.length > 0) {
                console.log(`[BackgroundAIManager] Outro admin ou IA já respondeu para a mensagem interna ${messageId}. Pulando.`);
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
                    .eq('user_id', uid)
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
                const isBuyerContext = isBuyer || !!payload.lead_id;

                const formStatusContext = isBuyerContext
                    ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**CONTEXTO DE COMPRA:** O cliente é um COMPRADOR interessado no veículo ${specificLead?.marca} ${specificLead?.modelo}. \n**AÇÃO:** Seja um vendedor persuasivo. Fale sobre as qualidades deste veículo específico, condições de pagamento e incentive o fechamento. NÃO peça para preencher formulário de venda.`
                    : (isFormFilled 
                        ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente é um VENDEDOR que JÁ PREENCHEU o formulário. \n**AÇÃO:** Fale sobre o veículo dele, demonstre interesse técnico e informe que a proposta oficial está sendo analisada pela nossa equipe técnica e será enviada em breve. NÃO peça para preencher o formulário novamente. Foque em manter o cliente engajado enquanto aguarda.`
                        : `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente é um VENDEDOR que AINDA NÃO preencheu o formulário. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`);

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: ${isBuyerContext ? 'COMPRADOR (INTERESSADO EM ESTOQUE)' : 'VENDEDOR (QUERENDO VENDEDOR VEÍCULO)'}
OBJETIVO: Roteamento inteligente e uso estrito de memórias/regras.

### 1. CONTEXTO: CHAT DO SITE — COMPRADOR (CRM)
- **AMBIENTE:** ADMIN > CRM > MENSAGENS
- **MEMÓRIA OBRIGATÓRIA:** IA CRM (Compradores)
- **REGRAS OBRIGATÓRIAS:** IA CRM (Compradores)
- **GATILHOS OBRIGATÓRIOS:** IA CRM (Compradores)

SUA MISSÃO:
1. ANALISAR E SEGUIR ESTRITAMENTE as REGRAS PERSONALIZADAS e a MEMÓRIA fornecidas abaixo.
2. Se houver conflito entre o seu conhecimento geral e as REGRAS PERSONALIZADAS, as REGRAS PERSONALIZADAS prevalecem.
3. Você deve consultar a MEMÓRIA DE LONGO PRAZO antes de formular qualquer resposta.
4. **ISOLAMENTO:** Nunca utilize regras ou dados de vendedores neste chat de comprador.

### CAPACIDADE DE VISÃO (ANÁLISE DE FOTOS)
- **Se houver uma foto anexada ou no contexto:** Analise o estado de conservação do veículo. Identifique avarias visíveis (batidas, arranhões, peças faltando) e use isso para fundamentar sua análise técnica. Se a foto for de um documento, extraia os dados pertinentes.

**IMPORTANTE:** 
- NUNCA diga que você é uma Inteligência Artificial ou um robô.
- NUNCA diga que "um humano entrará em contato" ou que "passará para um consultor humano".
- Você é o ESPECIALISTA que está conduzindo a negociação. Use "eu" ou "nossa equipe de especialistas".
- Se precisar de tempo ou análise, diga que "nossos especialistas estão finalizando a análise" ou "eu estou validando os dados técnicos".

${formStatusContext}

${specificVehicleInfo}
${vehicleContext}
${inventoryContext}

HISTÓRICO:
${history}

MENSAGEM ATUAL: ${payload.content}

[REGRAS E MEMÓRIA DO CRM - ORIGEM: MENU IA]
${aiCrmPromptRef.current}
${aiCrmMemoryRef.current ? `\nMEMÓRIA APRENDIDA NO CRM (CONSULTE ANTES DE RESPONDER):\n${aiCrmMemoryRef.current}` : ''}

REGRAS DE PROPOSTA:
${autoProposalEnabledRef.current && !requiresManualAnalysis ? 
    "VOCÊ ESTÁ AUTORIZADO A ENVIAR A PROPOSTA FINAL. Use o valor 'PROPOSTA FINAL CALCULADA' mencionado acima se o cliente perguntar sobre valores ou propostas." : 
    (requiresManualAnalysis ? 
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. O valor calculado requer análise manual do analista para não queimar o negócio. Diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta e que você retornará com o valor exato em breve. Foque em outros detalhes do veículo." :
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Se o cliente perguntar sobre preço ou proposta, diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta e que você retornará com o valor exato em breve. Foque em outros detalhes do veículo.")}

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
                    "Você é um especialista de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo. NUNCA mencione ser uma IA ou que haverá contato humano posterior, você é o especialista responsável.",
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
    };

    const handlePublicMessage = async (payload: any) => {
        const uid = currentUserIdRef.current;
        if (!uid) return;

        // Skip messages already handled by the chat widget or that have specific metadata
        if (payload.metadata?.from_chat_widget || payload.metadata?.ai_handled) {
            console.log(`[BackgroundAIManager] Mensagem ${payload.id} já marcada como processada. Pulando.`);
            return;
        }

        // Só responde se a mensagem for do cliente
        if (payload.remetente === 'cliente') {
            const leadId = payload.lead_id;
            const messageId = payload.id;

            console.log(`[BackgroundAIManager] IA Global processando mensagem de lead (${messageId}) para lead ${leadId}`);
            
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

            // Aguarda delay maior (10-20s) para evitar colisões e dar tempo ao humano
            const delay = Math.floor(Math.random() * 10000) + 10000; 
            await new Promise(resolve => setTimeout(resolve, delay));

            // Verifica se JÁ existe uma resposta de ADMIN ou BOT para ESTA mensagem
            const { data: recentMsg } = await supabase
                .from('mensagens')
                .select('id')
                .eq('lead_id', leadId)
                .in('remetente', ['admin', 'bot'])
                .gt('created_at', payload.created_at)
                .limit(1);

            if (recentMsg && recentMsg.length > 0) {
                console.log(`[BackgroundAIManager] Já existe uma resposta posterior para o lead ${leadId}. Pulando.`);
                return;
            }

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

                const isFormFilled = !!(vehicle && vehicle.marca && vehicle.modelo);
                const formStatusContext = isFormFilled 
                    ? `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente JÁ PREENCHEU o formulário com os dados do veículo. \n**AÇÃO:** Fale sobre o veículo dele, demonstre interesse técnico e informe que a proposta oficial está sendo analisada pela nossa equipe técnica e será enviada em breve. NÃO peça para preencher o formulário novamente. Foque em manter o cliente engajado enquanto aguarda.`
                    : `\n[INSTRUÇÃO DE PRIORIDADE MÁXIMA]\n**STATUS DO CLIENTE:** O cliente AINDA NÃO preencheu o formulário com os dados do veículo. \n**AÇÃO:** Informe ao cliente que para fornecer uma proposta de valor e fazer uma análise técnica, ele **PRECISA preencher o formulário completo**. Envie o link: https://autocompra.online/vender e incentive-o a preencher agora para agilizar a avaliação.`;

                const fullPrompt = `
[SISTEMA DE CONTROLE DE AGENTES E MEMÓRIA — AUTOCOMPRA.ONLINE]
IDENTIFICAÇÃO DO PERFIL: VENDEDOR (QUERENDO VENDER VEÍCULO)
OBJETIVO: Roteamento inteligente e uso estrito de memórias/regras.

### 1. CONTEXTO: CHAT DO SITE — VENDEDOR (LEADS)
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
- **Se houver uma foto anexada ou no contexto:** Analise o estado de conservação do veículo. Identifique avarias visíveis (batidas, arranhões, peças faltando) e use isso para fundamentar sua análise técnica. Se a foto for de um documento, extraia os dados pertinentes.

**IMPORTANTE:** 
- NUNCA diga que você é uma Inteligência Artificial ou um robô.
- NUNCA diga que "um humano entrará em contato" ou que "passará para um consultor humano".
- Você é o ESPECIALISTA que está conduzindo a negociação. Use "eu" ou "nossa equipe de especialistas".
- Se precisar de tempo ou análise, diga que "nossos especialistas estão finalizando a análise" ou "eu estou validando os dados técnicos".

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
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. O valor calculado requer análise manual do analista para não queimar o negócio. Diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta e que você retornará com o valor exato em breve. Foque em outros detalhes do veículo." :
        "VOCÊ NÃO ESTÁ AUTORIZADO A ENVIAR VALORES DE PROPOSTA. Se o cliente perguntar sobre preço ou proposta, diga que você e sua equipe de especialistas estão finalizando os cálculos técnicos para garantir a melhor oferta e que você retornará com o valor exato em breve. Foque em outros detalhes do veículo.")}

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
                    "Você é um especialista de vendas altamente preciso. Responda estritamente com base nos dados técnicos do veículo fornecidos no contexto. Se a informação não estiver nos dados, não invente. Seja direto, profissional e persuasivo. NUNCA mencione ser uma IA ou que haverá contato humano posterior, você é o especialista responsável.",
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
    };

    const scanForOpenMessages = async () => {
        const uid = currentUserIdRef.current;
        if (!uid) return;

        console.log('[BackgroundAIManager] Escaneando mensagens em aberto...');

        // 1. Escaneia mensagens internas (Compradores)
        const { data: openInternal } = await supabase
            .from('internal_messages')
            .select('*')
            .or(`receiver_id.eq.${uid},receiver_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (openInternal) {
            // Agrupa por sender_id e pega a última
            const conversations = new Map();
            openInternal.forEach(m => {
                if (!conversations.has(m.sender_id)) conversations.set(m.sender_id, m);
            });

            const conversationsArray = Array.from(conversations.entries()).slice(0, 5); // Limita a 5 conversas por scan
            for (const [senderId, lastMsg] of conversationsArray) {
                if (lastMsg.sender_id !== uid) {
                    // Verifica se já passou tempo suficiente (ex: 1 minuto) para não atropelar o tempo real
                    const timeDiff = Date.now() - new Date(lastMsg.created_at).getTime();
                    if (timeDiff > 60000) {
                        handleInternalMessage(lastMsg);
                    }
                }
            }
        }

        // 2. Escaneia mensagens públicas (Vendedores)
        const { data: openPublic } = await supabase
            .from('mensagens')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (openPublic) {
            const leads = new Map();
            openPublic.forEach(m => {
                if (!leads.has(m.lead_id)) leads.set(m.lead_id, m);
            });

            const leadsArray = Array.from(leads.entries()).slice(0, 5); // Limita a 5 leads por scan
            for (const [leadId, lastMsg] of leadsArray) {
                if (lastMsg.remetente === 'cliente') {
                    const timeDiff = Date.now() - new Date(lastMsg.created_at).getTime();
                    if (timeDiff > 60000) {
                        handlePublicMessage(lastMsg);
                    }
                }
            }
        }
    };

    useEffect(() => {
        if (!currentUserId) return;

        // Escaneia ao montar
        scanForOpenMessages();

        // Escaneia periodicamente a cada 15 minutos para economizar créditos
        const interval = setInterval(scanForOpenMessages, 900000);

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
                handleInternalMessage(payload.new);
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
