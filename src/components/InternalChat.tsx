import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { Send, MessageCircle, X, Check, CheckCheck, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InternalChat({ leadId, leadTitle, isOpen, onToggle, hideFloatingButton = false }: { leadId?: string, leadTitle?: string, isOpen?: boolean, onToggle?: () => void, hideFloatingButton?: boolean }) {
  const { user, profile, isAdmin } = useAuth();
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const isOpenState = isOpen !== undefined ? isOpen : isInternalOpen;
  const setIsOpen = onToggle || setIsInternalOpen;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const [isTyping, setIsTyping] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [attendantAvatar, setAttendantAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendantAvatar = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'CHAT_ATTENDANT_AVATAR').maybeSingle();
      if (data?.value) setAttendantAvatar(data.value);
    };
    fetchAttendantAvatar();
  }, []);

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
      const channelName = `internal_messages_${user.id}`;
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
            const isForMe = payload.new.receiver_id === user.id || (!payload.new.receiver_id && isAdmin);
            
            if (isMyMessage || isForMe) {
              console.log('[InternalChat] Mensagem relevante, atualizando UI');
              
              // Busca o perfil do remetente para ter o avatar correto em tempo real
              supabase
                .from('profiles')
                .select('full_name, avatar_url, role')
                .eq('id', payload.new.sender_id)
                .maybeSingle()
                .then(({ data: profileData }) => {
                  const newMessageWithProfile = {
                    ...payload.new,
                    profiles: profileData
                  };

                  setMessages(prev => {
                    // Evita duplicados
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    // Adiciona no topo (devido ao flex-col-reverse)
                    return [newMessageWithProfile, ...prev];
                  });
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
            
            // Extrai dados do título se possível (formato: [#CODE] MARCA MODELO (ANO) - COR)
            const contextMessage = `Olá, tenho interesse no veículo: ${leadTitle}. Gostaria de iniciar a negociação.`;
            
            await supabase.from('internal_messages').insert({
              sender_id: user.id,
              content: contextMessage,
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
    if (!user?.id) return;
    console.log('[InternalChat] 🔍 Buscando mensagens para o usuário:', user.id, 'leadId:', leadId);
    try {
      // Primeiro busca as mensagens sem o join que está dando erro
      const { data: msgs, error: msgsError } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (msgsError) {
        console.error('[InternalChat] ❌ Erro ao buscar mensagens:', msgsError);
        return;
      }

      if (!msgs || msgs.length === 0) {
        setMessages([]);
        return;
      }

      // Agora busca os perfis dos remetentes para preencher os dados
      const senderIds = [...new Set(msgs.map(m => m.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', senderIds);

      if (profilesError) {
        console.error('[InternalChat] ❌ Erro ao buscar perfis dos remetentes:', profilesError);
        // Ainda assim define as mensagens, mas sem os dados do perfil
        setMessages(msgs);
      } else {
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const msgsWithProfiles = msgs.map(m => ({
          ...m,
          profiles: profileMap.get(m.sender_id)
        }));
        console.log('[InternalChat] ✅ Mensagens e perfis buscados com sucesso:', msgsWithProfiles.length);
        setMessages(msgsWithProfiles);
      }
    } catch (err) {
      console.error('[InternalChat] 💥 Exceção em fetchMessages:', err);
    }
  };


  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || !user || loading) {
      console.warn('[InternalChat] handleSendMessage: No message, user or already loading');
      return;
    }

    setLoading(true);
    const messageToSend = newMessage;
    setNewMessage(''); // Limpa imediatamente para melhor UX

    console.log('[InternalChat] 📤 Enviando mensagem:', messageToSend, 'User ID:', user.id, 'Lead ID:', leadId);
    try {
      const { data, error } = await supabase.from('internal_messages').insert({
        sender_id: user.id,
        content: messageToSend,
        lead_id: leadId || null,
      }).select();

      if (error) {
        console.error('[InternalChat] ❌ Erro ao enviar mensagem para o Supabase:', error);
        setNewMessage(messageToSend); // Restaura se deu erro
        alert('Erro ao enviar mensagem. Tente novamente.');
        throw error;
      }
      console.log('[InternalChat] ✅ Mensagem enviada com sucesso:', data);
    } catch (error) {
      console.error('[InternalChat] 💥 Exceção ao enviar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

    const showFloatingButton = !hideFloatingButton;

    console.log('[InternalChat] Renderizando. isOpen:', isOpen, 'messages:', messages.length, 'user:', user?.id);

    return (
    <>
      {showFloatingButton && (
        <button
          type="button"
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
      )}

      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-24 right-0 sm:right-6 w-full sm:max-w-sm bg-white sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[70] h-full sm:h-[500px] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border-2 border-white/20">
                {attendantAvatar ? (
                  <img src={attendantAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <MessageCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold">Suporte Administrativo</h3>
                {leadTitle && <p className="text-xs opacity-70 truncate max-w-[200px]">Ref: {leadTitle}</p>}
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-3 bg-slate-50 scrollbar-hide">
            <div ref={messagesEndRef} />
            
            <AnimatePresence initial={false}>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-start mb-2"
                >
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.sender_id !== msg.sender_id);
                
                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div className={`relative p-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[9px] font-medium uppercase tracking-tight ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                            {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: ptBR }) : '--:--'}
                          </span>
                          {isMe && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-500" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {messages.length === 0 && (
              <div className="text-center py-20 px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-slate-900 font-bold mb-1">Inicie uma conversa</h4>
                <p className="text-slate-500 text-xs text-balance">
                  Nossa equipe administrativa está pronta para te ajudar.
                </p>
              </div>
            )}
          </div>

          <form 
            onSubmit={handleSendMessage} 
            className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
              id="internal_chat_input"
            />
            <button 
              type="button"
              onClick={() => handleSendMessage()} 
              disabled={loading || !newMessage.trim()}
              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
              id="internal_chat_send_btn"
            >
              <Send className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
