import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { Send, MessageCircle, X } from 'lucide-react';

export default function InternalChat({ leadId, leadTitle, isOpen, onToggle }: { leadId?: string, leadTitle?: string, isOpen?: boolean, onToggle?: () => void }) {
  const { user } = useAuth();
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const isOpenState = isOpen !== undefined ? isOpen : isInternalOpen;
  const setIsOpen = onToggle || setIsInternalOpen;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const isOpenStateRef = useRef(isOpenState);
  useEffect(() => {
    isOpenStateRef.current = isOpenState;
  }, [isOpenState]);

  useEffect(() => {
    if (user) {
      const channelName = 'public_internal_messages';
      console.log(`[InternalChat] Inscrevendo no canal: ${channelName}`);
      
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'internal_messages' 
        }, (payload) => {
          console.log('[InternalChat] Mudança recebida via Realtime:', payload.eventType, payload.new);
          
          if (payload.eventType === 'INSERT') {
            // Relevante se: eu sou o remetente OU eu sou o destinatário OU (destinatário é nulo e eu sou o destinatário implícito)
            const isMyMessage = payload.new.sender_id === user.id;
            const isForMe = payload.new.receiver_id === user.id || (!payload.new.receiver_id && user.role !== 'admin');
            
            if (isMyMessage || isForMe) {
              console.log('[InternalChat] Mensagem relevante, atualizando UI');
              setMessages(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });

              if (!isOpenStateRef.current && !isMyMessage) {
                setUnreadCount(prev => prev + 1);
                audioRef.current?.play().catch(() => {});
                
                if (Notification.permission === 'granted') {
                  new Notification('Nova mensagem', { body: payload.new.content });
                }
              } else if (isOpenStateRef.current && isForMe) {
                // Se o chat está aberto e a mensagem é para mim, marca como lida no banco
                supabase
                  .from('internal_messages')
                  .update({ is_read: true })
                  .eq('id', payload.new.id)
                  .then(({ error }) => {
                    if (error) console.error('[InternalChat] Erro ao marcar como lida:', error);
                  });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) {
              setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            }
          }
        })
        .subscribe((status) => {
          console.log(`[InternalChat] Status da inscrição (${channelName}):`, status);
        });

      return () => {
        console.log(`[InternalChat] Desinscrevendo do canal: ${channelName}`);
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  useEffect(() => {
    console.log('[InternalChat] isOpenState:', isOpenState, 'user:', user, 'leadId:', leadId);
    if (isOpenState && user) {
      setUnreadCount(0);
      fetchMessages();
      
      // Marca todas as mensagens pendentes como lidas ao abrir
      supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .then(({ error }) => {
          if (error) console.error('[InternalChat] Erro ao limpar não lidas:', error);
        });

      // Se abriu com um leadId específico, envia uma mensagem de contexto inicial se necessário
      if (leadId && leadTitle) {
        const sendInitialContext = async () => {
          // Verifica se já existe uma mensagem recente sobre este lead para evitar duplicidade
          const { data: recentMsgs } = await supabase
            .from('internal_messages')
            .select('content, lead_id')
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!recentMsgs || recentMsgs.length === 0 || recentMsgs[0].lead_id !== leadId) {
            console.log('[InternalChat] Enviando mensagem de contexto inicial para o lead:', leadId);
            await supabase.from('internal_messages').insert({
              sender_id: user.id,
              content: `Olá, tenho interesse no veículo: ${leadTitle}. Gostaria de mais informações.`,
              lead_id: leadId,
              is_read: false // Deve ser não lida para o admin ser notificado
            });
          }
        };
        sendInitialContext();
      }
    }
  }, [isOpenState, user, leadId]);

  useEffect(() => {
    if (!isOpenState) {
      isInitialLoad.current = true;
    }
  }, [isOpenState]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      // Se for a carga inicial, vai direto sem animação para não "rolar" na frente do usuário
      const finalBehavior = isInitialLoad.current ? 'auto' : behavior;
      messagesEndRef.current.scrollIntoView({ behavior: finalBehavior });
      
      if (isInitialLoad.current && messages.length > 0) {
        isInitialLoad.current = false;
      }
    }
  };

  useEffect(() => {
    // Na primeira carga ou quando as mensagens mudam, rola para o fim
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    console.log('[InternalChat] Fetching messages for user:', user?.id, 'leadId:', leadId);
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: false }); // Mudado para false para flex-col-reverse

    if (error) {
      console.error('[InternalChat] Error fetching messages:', error);
    } else {
      console.log('[InternalChat] Messages fetched:', data);
      setMessages(data || []);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) {
      console.error('[InternalChat] handleSendMessage: No message or user');
      return;
    }

    setLoading(true);
    console.log('[InternalChat] Sending message:', newMessage, 'User ID:', user.id, 'Lead ID:', leadId);
    try {
      const { error } = await supabase.from('internal_messages').insert({
        sender_id: user.id,
        content: newMessage,
        lead_id: leadId || null, // Ensure it's null if undefined
        // receiver_id is NULL for messages to admin
      });

      if (error) {
        console.error('[InternalChat] Error sending message to Supabase:', error);
        console.error('[InternalChat] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      console.log('[InternalChat] Message sent successfully');
      setNewMessage('');
    } catch (error) {
      console.error('[InternalChat] Exception sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all z-50 flex items-center gap-2 relative"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold text-sm hidden md:inline">Falar com Admin</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 h-[500px] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <div>
              <h3 className="font-bold">Suporte Administrativo</h3>
              {leadTitle && <p className="text-xs opacity-70 truncate max-w-[200px]">Ref: {leadTitle}</p>}
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4 bg-slate-50">
            <div ref={messagesEndRef} />
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm flex items-end gap-2 ${msg.sender_id === user?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none'}`}>
                  {msg.sender_id !== user?.id && (
                    <img src={msg.profiles?.avatar_url || '/default-avatar.png'} alt="Avatar" className="w-6 h-6 rounded-full" />
                  )}
                  <div>
                    {msg.content}
                    <p className={`text-[9px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {msg.created_at ? `${new Date(msg.created_at).toLocaleDateString()} ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Data indisponível'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                <p>Nenhuma mensagem ainda.</p>
                <p>Envie uma mensagem para iniciar o atendimento.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
