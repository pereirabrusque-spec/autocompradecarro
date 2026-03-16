import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, MessageCircle, Trash2 } from 'lucide-react';
import { useAiMode } from '../../hooks/useAiMode';

export const AdminSalesChat = ({ conversationId, role, onMessageRead }: { conversationId: string, role: string, onMessageRead: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const { isAiMode, toggleAiMode } = useAiMode();
  
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showAiRules, setShowAiRules] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll logic removed in favor of flex-col-reverse which starts at bottom
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    
    // Load existing prompt
    supabase.from('settings').select('value').eq('key', 'AI_CRM_PROMPT').single().then(({ data }) => {
      if (data) setAiPrompt(data.value);
    });

    // Listener para mudanças no prompt da IA
    const settingsSubscription = supabase
      .channel('crm_settings_global')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'settings',
        filter: 'key=eq.AI_CRM_PROMPT'
      }, (payload) => {
        if (payload.new && payload.new.key === 'AI_CRM_PROMPT') {
          console.log('[AdminSalesChat] Prompt da IA atualizado via Realtime');
          setAiPrompt(payload.new.value);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSubscription);
    };
  }, []);

  const saveAiPrompt = async () => {
    setIsSavingPrompt(true);
    
    // Check if exists
    const { data: existing } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_PROMPT').maybeSingle();
    
    let error;
    if (existing) {
        const res = await supabase.from('settings').update({ value: aiPrompt }).eq('key', 'AI_CRM_PROMPT');
        error = res.error;
    } else {
        const res = await supabase.from('settings').insert({ key: 'AI_CRM_PROMPT', value: aiPrompt });
        error = res.error;
    }

    if (error) {
        console.error('Erro ao salvar prompt:', error);
        alert(`Erro ao salvar prompt: ${error.message}`);
    } else {
        alert('Prompt salvo com sucesso!');
    }
    setIsSavingPrompt(false);
    setShowAiRules(false);
  };

  const logWhatsAppUsage = () => {
    console.log('WhatsApp usage logged');
  };

  const clearChat = async () => {
    if (!window.confirm('Tem certeza que deseja apagar TODAS as mensagens desta conversa? Esta ação não pode ser desfeita.')) return;
    
    setIsDeleting(true);
    try {
        // Delete messages where sender is me and receiver is buyer OR sender is buyer and receiver is me
        const { error } = await supabase
            .from('internal_messages')
            .delete()
            .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`);
        
        if (error) throw error;
        
        // Clear local state immediately
        setMessages([]);
        
        // Update unread counts in parent
        onMessageRead(); 
        
        alert('Histórico apagado com sucesso.');
    } catch (error) {
        console.error('Erro ao apagar mensagens:', error);
        alert('Erro ao apagar mensagens. Verifique sua conexão.');
    } finally {
        setIsDeleting(false);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;
    
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setMessages(data || []);
      
      // Marca mensagens como lidas NO BANCO DE DADOS
      console.log('[AdminSalesChat] Marcando mensagens como lidas para:', conversationId);
      const { error: updateError } = await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', conversationId)
        .eq('is_read', false);
      
      if (updateError) {
          console.error('[AdminSalesChat] Erro ao marcar como lidas:', updateError);
      } else {
          console.log('[AdminSalesChat] Mensagens marcadas como lidas com sucesso');
          onMessageRead(); // Notifica o container pai para atualizar a lista lateral
      }
    }
  };
  
  const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, email, avatar_url')
        .eq('id', conversationId)
        .single();
      if (data) {
          setUserPhone(data.phone);
          setUserEmail(data.email);
          setUserAvatar(data.avatar_url);
      }
  };

  const isAiModeRef = useRef(isAiMode);
  const aiPromptRef = useRef(aiPrompt);

  useEffect(() => {
    isAiModeRef.current = isAiMode;
  }, [isAiMode]);

  useEffect(() => {
    aiPromptRef.current = aiPrompt;
  }, [aiPrompt]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    
    fetchMessages();
    fetchUserData();

    // Canal único por conversa para evitar conflitos
    const channelName = `chat_${conversationId}_${currentUserId}`;
    console.log(`[AdminSalesChat] Inscrevendo no canal: ${channelName}`);
    
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages' 
      }, async (payload) => {
        // Relevante se: eu sou o remetente OU eu sou o destinatário OU (destinatário é nulo e eu sou admin)
        const isRelevant = payload.new.sender_id === conversationId || 
                          payload.new.receiver_id === conversationId ||
                          (payload.new.sender_id === conversationId && !payload.new.receiver_id);
        
        if (isRelevant) {
          console.log('[AdminSalesChat] Nova mensagem relevante recebida:', payload.new);
          
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
          
          // Se a mensagem for do comprador (vinda do conversationId)
          if (payload.new.sender_id === conversationId) {
            console.log('[AdminSalesChat] Mensagem do comprador, processando...');
            
            // Marca como lida
            supabase
              .from('internal_messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                  if (error) console.error('[AdminSalesChat] Erro ao marcar como lida:', error);
                  else onMessageRead();
              });

            // LÓGICA DE RESPOSTA AUTOMÁTICA DA IA
            if (isAiModeRef.current) {
              console.log('[AdminSalesChat] IA Ativa, gerando resposta automática...');
              try {
                const { AIService } = await import('../../services/aiService');
                const response = await AIService.generateContent(
                  payload.new.content,
                  aiPromptRef.current || "Você é um assistente de vendas prestativo. Responda de forma curta e direta."
                );

                if (response && response.text) {
                  console.log('[AdminSalesChat] IA gerou resposta:', response.text);
                  
                  // Envia a resposta da IA como se fosse o admin
                  const { data: aiMsg, error: aiError } = await supabase.from('internal_messages').insert({
                    receiver_id: conversationId,
                    content: response.text,
                    sender_id: currentUserId,
                    is_read: true
                  }).select().single();

                  if (aiError) console.error('[AdminSalesChat] Erro ao enviar resposta da IA:', aiError);
                  else {
                    setMessages(prev => [aiMsg, ...prev]);
                  }
                }
              } catch (err) {
                console.error('[AdminSalesChat] Erro na geração da IA:', err);
              }
            }
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'internal_messages' }, (payload) => {
        if (payload.new.sender_id === conversationId || payload.new.receiver_id === conversationId) {
            fetchMessages();
        }
      })
      .subscribe((status) => {
        console.log(`[AdminSalesChat] Status da inscrição (${channelName}):`, status);
      });

    return () => {
      console.log(`[AdminSalesChat] Desinscrevendo do canal: ${channelName}`);
      supabase.removeChannel(subscription);
    };
  }, [conversationId, currentUserId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save to DB
    const { data, error } = await supabase.from('internal_messages').insert({
      receiver_id: conversationId,
      content: input,
      sender_id: user.id,
      is_read: true // Admin messages are read
    }).select().single();
    
    if (error) console.error('Error sending message:', error);
    else {
        setMessages(prev => [data, ...prev]);
        setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            {userAvatar && <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full" />}
            <div>
                <h3 className="font-bold">Chat de Vendas</h3>
                <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => toggleAiMode(!isAiMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isAiMode 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bot className={`w-4 h-4 ${isAiMode ? 'animate-pulse' : ''}`} />
            {isAiMode ? 'IA ATIVA' : 'IA DESLIGADA'}
          </button>

          <button 
            onClick={clearChat}
            disabled={isDeleting}
            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
            title="Apagar todas as mensagens"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {userPhone && (
            <a 
              href={`https://wa.me/${userPhone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={logWhatsAppUsage}
              className="p-2 rounded-full hover:bg-emerald-100 text-emerald-600"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      
      {showAiRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[50vw] max-w-none shadow-xl">
            <h4 className="font-bold mb-4 text-lg">Configurar Memória IA</h4>
            <textarea 
              className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm mb-4"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Cole aqui as regras e memória para a IA..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiRules(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
              <button onClick={saveAiPrompt} disabled={isSavingPrompt} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
                {isSavingPrompt ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse min-h-0" ref={chatContainerRef}>
        <div className="flex flex-col gap-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_id === currentUserId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
          placeholder="Digite..."
        />
        <button onClick={sendMessage} className="bg-slate-900 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
