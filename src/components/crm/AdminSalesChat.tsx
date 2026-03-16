import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, MessageCircle, Trash2 } from 'lucide-react';
import { useAiMode } from '../../hooks/useAiMode';

export const AdminSalesChat = ({ conversationId, role, onMessageRead }: { conversationId: string, role: string, onMessageRead: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [isUpdatingAi, setIsUpdatingAi] = useState(false);
  
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

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
    
    if (error) {
      console.error('[AdminSalesChat] Erro ao buscar mensagens:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('[AdminSalesChat] Colunas detectadas:', Object.keys(data[0]));
    }
    
    setMessages(data || []);
    
    // Marca mensagens como lidas NO BANCO DE DADOS
    // Tenta detectar se a coluna é 'read' ou 'is_read'
    const readColumn = data && data.length > 0 && 'is_read' in data[0] ? 'is_read' : 'read';
    console.log('[AdminSalesChat] Usando coluna de leitura:', readColumn);

    const { error: updateError } = await supabase
      .from('internal_messages')
      .update({ [readColumn]: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', conversationId)
      .eq(readColumn, false);
    
    if (updateError) {
        console.error('[AdminSalesChat] Erro ao marcar como lidas:', updateError);
    } else {
        onMessageRead(); // Notifica o container pai para atualizar a lista lateral
    }
  };
  
  const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, email, avatar_url, is_ai_enabled')
        .eq('id', conversationId)
        .single();
      if (data) {
          setUserPhone(data.phone);
          setUserEmail(data.email);
          setUserAvatar(data.avatar_url);
          setIsAiMode(data.is_ai_enabled !== false); // Default to true if null
      }
  };

  const toggleAiMode = async (val: boolean) => {
    setIsUpdatingAi(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_ai_enabled: val })
        .eq('id', conversationId);
      
      if (error) throw error;
      setIsAiMode(val);
    } catch (e) {
      console.error('Error toggling AI mode:', e);
    } finally {
      setIsUpdatingAi(false);
    }
  };

  const isAiModeRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isAiModeRef.current = isAiMode;
  }, [isAiMode]);

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
            console.log('[AdminSalesChat] Mensagem do comprador, marcando como lida...');
            
            // Marca como lida no banco
            const readColumn = payload.new.is_read !== undefined ? 'is_read' : 'read';
            supabase
              .from('internal_messages')
              .update({ [readColumn]: true })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                  if (error) console.error('[AdminSalesChat] Erro ao marcar como lida:', error);
                  else onMessageRead();
              });
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'internal_messages' 
      }, (payload) => {
        // Atualiza apenas se for uma mudança relevante (ex: conteúdo alterado)
        // Evitamos re-fetch total para não causar flicker ou sumiço de msgs novas
        if (payload.new.sender_id === conversationId || payload.new.receiver_id === conversationId) {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
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

    // Detecta coluna de leitura
    const readColumn = messages.length > 0 && 'is_read' in messages[0] ? 'is_read' : 'read';

    // Save to DB
    const insertData: any = {
      receiver_id: conversationId,
      content: input,
      sender_id: user.id
    };
    // Removido: insertData[readColumn] = true; 
    // A mensagem deve ser inserida como não lida para o destinatário (comprador)

    const { data, error } = await supabase.from('internal_messages').insert(insertData).select().single();
    
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
            disabled={isUpdatingAi}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isAiMode 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Bot className={`w-4 h-4 ${isAiMode ? 'animate-pulse' : ''}`} />
            {isAiMode ? 'IA NESTE CHAT: ON' : 'IA NESTE CHAT: OFF'}
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
      
      {/* Modal de regras removido pois agora é global no container */}


      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4 min-h-0" ref={chatContainerRef}>
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_id === currentUserId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {m.content}
            </div>
          </div>
        ))}
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
