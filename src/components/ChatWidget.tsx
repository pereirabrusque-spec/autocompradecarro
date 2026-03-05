import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, X, Send, Loader2, User, ShieldCheck } from 'lucide-react';
import AuthModal from './AuthModal';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch user leads on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLeads([]);
      setActiveLead(null);
      setMessages([]);
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, activeLead]);

  // Subscribe to new messages for active lead
  useEffect(() => {
    if (!activeLead) return;

    const channel = supabase
      .channel(`chat:${activeLead.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `lead_id=eq.${activeLead.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          // Play notification sound if message is from admin
          if (payload.new.remetente === 'admin') {
            new Audio('/notification.mp3').play().catch(() => {});
            
            if (!isOpen) {
              setUnreadCount(prev => prev + 1);
              if (Notification.permission === 'granted') {
                new Notification('Nova mensagem de AutoCompra', {
                  body: payload.new.conteudo,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLead, isOpen]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads_veiculos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      
      // If only one lead, select it automatically
      if (data && data.length === 1) {
        setActiveLead(data[0]);
        fetchMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeLead) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('mensagens')
        .insert([{
          lead_id: activeLead.id,
          remetente: 'cliente',
          conteudo: newMessage.trim()
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleToggle = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setIsOpen(!isOpen);
      if (!isOpen) setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 p-4 bg-accent text-white rounded-full shadow-2xl hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && user && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Chat de Negociação</h3>
              <p className="text-xs text-slate-400">Fale diretamente com nossos especialistas</p>
            </div>
            {activeLead && (
              <button 
                onClick={() => setActiveLead(null)}
                className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors"
              >
                Voltar
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            {!activeLead ? (
              // Lead List
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selecione uma negociação</p>
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Você ainda não tem negociações ativas.</p>
                    <p className="text-xs mt-2">Avalie seu carro para iniciar uma conversa.</p>
                  </div>
                ) : (
                  leads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setActiveLead(lead);
                        fetchMessages(lead.id);
                      }}
                      className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-accent hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 group-hover:text-accent">{lead.marca} {lead.modelo}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500">{lead.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Chat Messages
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <p>Inicie a conversa sobre seu {activeLead.modelo}.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div 
                      key={msg.id || i} 
                      className={`flex ${msg.remetente === 'cliente' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          msg.remetente === 'cliente' 
                            ? 'bg-accent text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}
                      >
                        {msg.conteudo}
                        <span className={`text-[10px] block mt-1 ${msg.remetente === 'cliente' ? 'text-white/60' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {activeLead && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button 
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          )}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
