import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Loader2, Camera, Paperclip, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { AIService } from '../services/aiService';
import { useAssets } from '../lib/assetsContext';

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string;
}

export default function ChatAssistant() {
  const { settings } = useAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá! Sou o especialista sênior da **LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS**. \n\nNós assumimos o problema e limpamos seu nome. \n\nPara começarmos a análise do seu veículo, por favor, informe o **Ano e Modelo** do carro.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiKey, setApiKey] = useState<string>('');
  const chatEnabled = settings['CHAT_ENABLED'] !== 'false';
  const systemPrompt = settings['AI_SYSTEM_PROMPT'] || '';
  const [contextData, setContextData] = useState({ banks: [], repairCosts: [], fipeRules: [] });

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);

    // Get API key from settings
    const aiKeySetting = settings['GEMINI_API_KEY'];
    if (aiKeySetting) {
      const keys = aiKeySetting.split('\n').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      if (keys.length > 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        setApiKey(randomKey);
      }
    }

    // Fetch Banks, Repair Costs, and FIPE Rules
    const fetchData = async () => {
      const { data: banks } = await supabase.from('banks').select('*');
      const { data: repairCosts } = await supabase.from('repair_costs').select('*');
      const { data: fipeRules } = await supabase.from('fipe_rules').select('*');
      setContextData({ banks: banks || [], repairCosts: repairCosts || [], fipeRules: fipeRules || [] });
    };
    fetchData();

    return () => {
      window.removeEventListener('open-chat', handleOpenChat);
    };
  }, [settings]);

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

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userText = input.trim();
    const userImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    
    setMessages(prev => [...prev, { role: 'user', text: userText, image: userImage || undefined }]);
    setIsLoading(true);

    try {
      const parts: any[] = [];
      if (userText) parts.push({ text: userText });
      if (userImage) {
        parts.push({
          inlineData: {
            data: userImage.split(',')[1],
            mimeType: 'image/jpeg'
          }
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Construct the prompt with dynamic data
      const banksContext = contextData.banks.map((b: any) => `- ${b.name}: ${b.discount_percentage}% desconto`).join('\n');
      const repairContext = contextData.repairCosts.map((r: any) => `- ${r.part_name}: R$ ${r.cost}`).join('\n');
      const fipeContext = contextData.fipeRules.map((f: any) => `- ${f.condition_name}: -${f.discount_percentage}% sobre FIPE`).join('\n');
      
      const finalSystemPrompt = systemPrompt 
        ? `${systemPrompt}\n\n### DADOS DE MERCADO ATUALIZADOS:\n**REGRAS DE DESCONTO FIPE:**\n${fipeContext}\n\n**BANCOS E DESCONTOS:**\n${banksContext}\n\n**CUSTOS DE REPARO:**\n${repairContext}`
        : `Você é o **AVALIADOR SÊNIOR DE VEÍCULOS** da plataforma "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS".
        Sua função não é apenas coletar dados, mas **ANALISAR DOCUMENTOS E FOTOS** e **GERAR UMA PROPOSTA COMERCIAL IMEDIATA** baseada em regras rígidas.

        ### 1. CAPACIDADE DE VISÃO (OCR E ANÁLISE)
        - **Se o usuário enviar foto de documento (CRLV/CNH):** Extraia IMEDIATAMENTE: Placa, Renavam, Nome do Proprietário, Ano, Modelo e Cor. Confirme esses dados com o usuário.
        - **Se o usuário enviar foto do veículo:** Analise o estado de conservação. Identifique avarias visíveis (batidas, arranhões, peças faltando) e reduza a avaliação conforme a gravidade.

        ### 2. REGRAS DE NEGÓCIO E CÁLCULO DE PROPOSTA (Mentalidade de Comprador)
        Use estas regras para gerar a proposta final. Não pergunte "quanto você quer" sem antes ter uma base.

        **CENÁRIO A: FINANCIAMENTO ATRASADO (Pessoa Física)**
        - **Regra:** O objetivo é assumir a dívida para limpar o nome do cliente.
        - **Cálculo:**
          1. Estime o valor de mercado (FIPE - 20% margem revenda).
          2. Subtraia a Dívida Total (Parcelas Atrasadas + Quitação ou Saldo Devedor).
          3. Subtraia Avarias/Multas.
        - **Resultado:**
          - Se (Mercado > Dívida): Ofereça a diferença como "TROCO" (Dinheiro na mão).
          - Se (Mercado <= Dívida): A proposta é "ASSUNÇÃO DE DÍVIDA SEM CUSTO" (Zero a receber, mas nome limpo).
          - Se (Dívida for muito maior que o carro): Cobre uma "TAXA ADMINISTRATIVA" de R$ 2.000 a R$ 5.000 para assumir o problema.

        **CENÁRIO B: VEÍCULO DE COOPERATIVA / EMPRESA**
        - **Regra:** Não quitamos. Apenas resolvemos a posse.
        - **Proposta Única:** Cobramos taxa de R$ 5.000,00 (parcelado) para retirar o veículo e blindar o patrimônio do cliente contra busca e apreensão imediata.

        **CENÁRIO C: CARRO QUITADO COM PROBLEMA (Batido/Motor)**
        - **Regra:** Compra para reforma ou peças.
        - **Proposta:** 30% a 50% da Tabela FIPE, dependendo do estado visualizado nas fotos.

        ### 3. FLUXO DE ATENDIMENTO (Seja direto e autoritário, mas educado)
        1. **Boas-vindas:** Já peça o Modelo e Ano (se não tiver).
        2. **Análise:** Peça detalhes do problema (Dívida? Mecânica?).
        3. **Documentação:** Peça foto do CRLV ou Placa/Renavam para consulta (simulada).
        4. **Visual:** Peça fotos do carro (frente, traseira, laterais, interior).
        5. **Financeiro:** Pergunte: Banco? Valor parcela? Quantas pagas? Quantas faltam? **Quanto deu de entrada?**
        6. **PROPOSTA FINAL:** Com base nos dados, apresente a proposta formal.

        ### 4. FORMATO DA PROPOSTA (Apresente isso ao usuário no final)
        "
        📋 **PROPOSTA OFICIAL AUTOCOMPRA**
        
        **Veículo:** [Modelo/Ano]
        **Análise:** [Resumo do estado/dívida]
        
        **OFERTA:**
        [Descreva a oferta aqui: Ex: Pagamos R$ 15.000,00 à vista / Assumimos a dívida integralmente / Assumimos mediante taxa de R$ X]
        
        **Condição:** Pagamento em até 24h após vistoria presencial e cartório.
        "

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
        
        ### DADOS DE MERCADO ATUALIZADOS:
        **REGRAS DE DESCONTO FIPE:**
        ${fipeContext}

        **BANCOS E DESCONTOS:**
        ${banksContext}

        **CUSTOS DE REPARO:**
        ${repairContext}`;

      const prompt = `HISTÓRICO:\n${messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\nENTRADA ATUAL:\n${userText}`;
      const aiResponse = await AIService.generateContent(prompt, finalSystemPrompt);

      const botText = aiResponse.text || 'Entendido. Por favor, continue com as informações solicitadas.';
      
      // Check if botText contains a JSON block for lead submission
      const jsonMatch = botText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const leadData = JSON.parse(jsonMatch[1]);
          const { error } = await supabase.from('leads_veiculos').insert([{
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
            status: leadData.status_lead || 'novo',
            origem: 'chat',
            observacoes: `Score: ${leadData.score_veiculo} | Quitação Est.: ${leadData.valor_quitacao_estimado}`
          }]);
          
          if (error) throw error;
          
          setMessages(prev => [...prev, { role: 'bot', text: '✅ **Dados enviados com sucesso!** Nossa equipe de especialistas entrará em contato em breve para finalizar a proposta.' }]);
          return;
        } catch (e) {
          console.error('Failed to parse or save lead JSON:', e);
        }
      }

      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Erro na conexão. Por favor, tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chatHeight = settings['CHAT_HEIGHT'] || '560';
  const chatWidth = settings['CHAT_WIDTH'] || '360';
  const chatColor = settings['CHAT_COLOR'] || '#F27D26';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ backgroundColor: chatColor }}
        className="fixed bottom-8 right-8 w-16 h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <MessageSquare className="w-7 h-7" />
        <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Especialista em Dívidas
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            style={{ 
              height: `${chatHeight}px`, 
              width: window.innerWidth < 640 ? '95vw' : `${chatWidth}px` 
            }}
            className="fixed bottom-8 right-8 bg-white rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: chatColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Loja Online AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Especialista Sênior</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Fechar
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? '' : 'bg-white border border-slate-100 text-slate-900'
                    }`} style={msg.role === 'user' ? { backgroundColor: chatColor, color: 'white' } : {}}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-slate-900" />
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: chatColor }} />
                      <span className="text-xs text-slate-400 font-medium">Analisando dados...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              {selectedImage && (
                <div className="relative inline-block">
                  <img src={selectedImage} className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button 
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
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua resposta..."
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
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
