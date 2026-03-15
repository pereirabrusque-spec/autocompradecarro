import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, X, Send, Loader2, User, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthModal from './AuthModal';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setIsBlocked(data.is_blocked);
        });
    }
  }, [user]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProposalView, setShowProposalView] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
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

  const activeLeadRef = useRef(activeLead);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    activeLeadRef.current = activeLead;
  }, [activeLead]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Subscribe to new messages for ALL leads
  useEffect(() => {
    if (leads.length === 0) return;

    const channels = leads.map(lead => {
      return supabase
        .channel(`chat:${lead.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens',
            filter: `lead_id=eq.${lead.id}`
          },
          (payload) => {
            const newMessage = payload.new;

            // If message is for active lead, update UI
            if (activeLeadRef.current && newMessage.lead_id === activeLeadRef.current.id) {
              setMessages(prev => [...prev, newMessage]);
            }

            // Play notification sound if message is from admin
            if (newMessage.remetente === 'admin') {
              new Audio('/notification.mp3').play().catch(() => {});
              
              // Auto-open chat when message arrives
              if (!isOpenRef.current) {
                setIsOpen(true);
              }

              if (!isOpenRef.current || (activeLeadRef.current && newMessage.lead_id !== activeLeadRef.current.id)) {
                setUnreadCount(prev => prev + 1);
                if (Notification.permission === 'granted') {
                  new Notification('Nova mensagem de AutoCompra', {
                    body: newMessage.conteudo,
                    icon: '/favicon.ico'
                  });
                }
              }
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [leads]);

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
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[60] p-4 bg-accent text-white rounded-full shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </motion.button>

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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                            #{lead.vehicle_code || '----'}
                          </span>
                          <span className="font-bold text-slate-700 group-hover:text-accent">{lead.marca} {lead.modelo}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500 self-start mt-1">{lead.status}</span>
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
                        <div className="whitespace-pre-wrap">{msg.conteudo}</div>
                        {msg.tipo === 'proposta' && msg.metadata?.proposal_data && (
                          <div className="mt-3 p-3 bg-white/20 rounded-xl text-xs space-y-1 border border-white/20">
                            <p className="font-bold">Valor Final:</p>
                            <p className="text-lg font-black">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.metadata.proposal_data.final_value)}
                            </p>
                          </div>
                        )}
                        {msg.tipo === 'proposta' && (
                          <button 
                            onClick={() => {
                              setSelectedProposal(msg.metadata?.proposal_data);
                              setShowProposalView(true);
                            }}
                            className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                          >
                            <FileText className="w-4 h-4" /> Ver Proposta Detalhada
                          </button>
                        )}
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
          {activeLead && !isBlocked && (
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
          {activeLead && isBlocked && (
            <div className="p-3 bg-red-100 text-red-700 text-center text-sm font-bold">
              Você foi bloqueado e não pode enviar mensagens.
            </div>
          )}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Proposal View Modal */}
      <AnimatePresence>
        {showProposalView && selectedProposal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Proposta de Compra</h3>
                  <p className="text-xs text-slate-400">Ref: {selectedProposal.vehicle_code}</p>
                </div>
                <button 
                  onClick={() => setShowProposalView(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Final Oferecido</p>
                  <p className="text-4xl font-black text-accent">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposal.final_value)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor FIPE</p>
                    <p className="font-bold text-slate-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposal.base_value)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Quitação</p>
                    <p className="font-bold text-slate-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposal.payoff_value)}
                    </p>
                  </div>
                </div>

                {selectedProposal.deductions?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-accent" />
                      Deduções Aplicadas
                    </p>
                    <div className="space-y-2">
                      {selectedProposal.deductions.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                          <span className="text-slate-600">{d.name}</span>
                          <span className="font-bold text-red-500">
                            -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed italic">
                    "Esta proposta foi gerada com base nos dados fornecidos e na análise técnica do veículo. O pagamento é realizado à vista após a vistoria física."
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowProposalView(false);
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  Aceitar e Falar com Consultor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
