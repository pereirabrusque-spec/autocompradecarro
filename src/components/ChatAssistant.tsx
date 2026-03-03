import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Loader2, Camera, Paperclip, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá! Sou o especialista sênior da **LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS**. \n\nNós assumimos o problema e limpamos seu nome. \n\nPara começarmos a análise do seu veículo, por favor, informe o **Ano e Modelo** do carro.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Você é o motor de inteligência da plataforma "LOJA ONLINE - SOLUÇÕES AUTOMOTIVAS". 
              Seu objetivo é converter proprietários de veículos com problemas (Renajud, financiamento atrasado, motor estourado, batidos) em leads qualificados.
              
              DIRETRIZES DE NEGÓCIO:
              1. VEÍCULOS DE COOPERATIVA/EMPRESA: Não assumimos para quitação direta. Oferta Única: Serviço de "Limpa Nome" (R$ 5 mil) mediante entrega do veículo.
              2. VEÍCULOS FINANCIADOS (PF): Foco total na compra. Proposta: Assumimos a dívida + taxa de serviço de R$ 5 mil para quitação em até 18 meses.
              3. ESTADO: Aceitamos qualquer estado (Batido, Motor Estourado, Sinistro).
              
              FLUXO SEQUENCIAL (Solicite UM POR UM):
              1. Identificação: Ano, Modelo, Placa, Renavam e KM.
              2. Detalhes: Ar, Vidro, Couro, Teto Solar, Sinistro (Sim/Não).
              3. Financeiro: Banco? Valor parcela? Quantas pagas? Quantas faltam?
              4. Valores: Preço desejado, Preço que acha que vale, Preço FIPE.
              5. Mídia: Fotos do veículo e foto nítida do CRLV.
              
              VISION OCR:
              Se o usuário enviar uma foto de CRLV, extraia Placa e Renavam. Valide se o nome no documento coincide com o Banco informado.
              
              PERSONA: Profissional, futurista, direto, resolutivo. "Nós assumimos o problema e limpamos seu nome".
              
              FINALIZAÇÃO:
              Quando coletar TODOS os dados (incluindo fotos/CRLV), você deve gerar um bloco JSON formatado exatamente assim no final da sua resposta:
              \`\`\`json
              {
                "owner_name": "...",
                "owner_phone": "...",
                "brand": "...",
                "model": "...",
                "year": 2020,
                "plate": "...",
                "renavam": "...",
                "mileage": 50000,
                "bank": "...",
                "installment_value": 1200,
                "installments_paid": 12,
                "installments_remaining": 36,
                "desired_price": 45000,
                "fipe_price": 50000,
                "situation": "...",
                "has_ac": true,
                "has_leather": false,
                "has_sunroof": false,
                "is_crashed": false,
                "status_lead": "Novo",
                "score_veiculo": 85,
                "valor_quitacao_estimado": 35000
              }
              \`\`\`
              
              HISTÓRICO DE MENSAGENS:
              ${messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
              
              ENTRADA ATUAL DO USUÁRIO:
              ${userText}` },
              ...(userImage ? [{ inlineData: { data: userImage.split(',')[1], mimeType: 'image/jpeg' } }] : [])
            ]
          }
        ],
        config: {
          systemInstruction: "Você é um especialista em recuperação de crédito. Siga o fluxo sequencial rigorosamente. Se o cliente divagar, retorne ao fluxo. Nunca divague."
        }
      });

      const botText = response.text || 'Entendido. Por favor, continue com as informações solicitadas.';
      
      // Check if botText contains a JSON block for lead submission
      const jsonMatch = botText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const leadData = JSON.parse(jsonMatch[1]);
          await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
          });
          setMessages(prev => [...prev, { role: 'bot', text: '✅ **Dados enviados com sucesso!** Nossa equipe de especialistas entrará em contato em breve para finalizar a proposta.' }]);
          return;
        } catch (e) {
          console.error('Failed to parse lead JSON:', e);
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
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
            className="fixed bottom-8 right-8 w-[95vw] sm:w-[450px] h-[700px] bg-white rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
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
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-accent text-white' : 'bg-white border border-slate-100 text-slate-900'
                    }`}>
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
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
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
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-accent text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
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
