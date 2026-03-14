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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const subscription = supabase
        .channel('internal_messages_global')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
          // If admin, receive all messages. If user, receive only messages where receiver_id is user.id
          const isForMe = payload.new.receiver_id === user.id || (payload.new.receiver_id === null && user.role === 'admin');
          
          if (isForMe) {
            if (isOpenState) {
              setMessages(prev => [...prev, payload.new]);
              scrollToBottom();
            } else {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.new.sender_id === user.id && isOpenState) {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isOpenState]);

  useEffect(() => {
    if (isOpenState && user) {
      setUnreadCount(0);
      fetchMessages();
    }
  }, [isOpenState, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('internal_messages').insert({
        sender_id: user.id,
        content: newMessage,
        lead_id: leadId,
        // receiver_id is NULL for messages to admin
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                <p>Nenhuma mensagem ainda.</p>
                <p>Envie uma mensagem para iniciar o atendimento.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender_id === user?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none'}`}>
                  {msg.content}
                  <p className={`text-[9px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
