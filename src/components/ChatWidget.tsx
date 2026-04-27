import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, X, Send, Loader2, User, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthModal from './AuthModal';

export default function ChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const isBuyer = profile?.role?.includes('buyer');

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if admin is online
  useEffect(() => {
    const checkAdminOnline = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_login')
        .eq('role', 'admin');
      
      if (data) {
        const anyOnline = data.some(p => p.last_login && (new Date().getTime() - new Date(p.last_login).getTime()) < 300000);
        setIsAdminOnline(anyOnline);
      }
    };

    checkAdminOnline();
    const interval = setInterval(checkAdminOnline, 60000);
    return () => clearInterval(interval);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update last_login periodically to show as online in AdminDashboard
  useEffect(() => {
    if (user && isOpen) {
      const updateOnlineStatus = async () => {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        if (isBuyer) {
          await supabase
            .from('interested_buyers')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user.id);
        }
      };
      
      updateOnlineStatus();
      const interval = setInterval(updateOnlineStatus, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user, isOpen]);

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

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    let channels: any[] = [];

    if (isBuyer) {
      const channel = supabase
        .channel(`internal:chat:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'internal_messages'
          },
          (payload) => {
            const newMessage = payload.new;
            // Message is relevant if I am sender or receiver
            if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
              setMessages(prev => {
                // Evita duplicatas (especialmente de mensagens enviadas por nós mesmos)
                if (prev.find(m => m.id === newMessage.id)) return prev;
                
                return [...prev, {
                  id: newMessage.id,
                  conteudo: newMessage.content,
                  remetente: newMessage.sender_id === user.id ? 'cliente' : 'admin',
                  created_at: newMessage.created_at
                }];
              });
              
              if (newMessage.sender_id !== user.id && !isOpenRef.current) {
                setUnreadCount(prev => prev + 1);
                setIsOpen(true);
              }
            }
          }
        )
        .subscribe();
      channels.push(channel);
    } else {
      if (leads.length === 0) return;
      channels = leads.map(lead => {
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
              console.log("[ChatWidget] Realtime message received:", payload.new);
              const newMessage = payload.new;
              
              // Atualiza mensagens se for o lead ativo
              if (activeLeadRef.current?.id === newMessage.lead_id) {
                console.log("[ChatWidget] Updating messages for active lead");
                setMessages(prev => {
                  if (prev.find(m => m.id === newMessage.id)) return prev;
                  return [...prev, newMessage];
                });
              }
              
              // Se for mensagem do admin e não estiver com o chat aberto para este lead, incrementa unread
              if (newMessage.remetente === 'admin') {
                if (!isOpenRef.current || activeLeadRef.current?.id !== newMessage.lead_id) {
                  console.log("[ChatWidget] New message from admin, incrementing unread count");
                  setUnreadCount(prev => prev + 1);
                  // Opcional: abrir o chat se for importante
                  // setIsOpen(true);
                }
              }
            }
          )
          .subscribe();
      });
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [leads, isBuyer, user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      if (isBuyer) {
        // For buyers, we use interested_buyers table or just the user profile
        const { data, error } = await supabase
          .from('interested_buyers')
          .select('*')
          .eq('email', user?.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
        
        if (data && data.length > 0) {
          setActiveLead(data[0]);
          fetchMessages(data[0].id);
        } else if (user) {
          // If no interested_buyer record yet, create a dummy one or use profile
          const dummyLead = { id: user.id, nome: profile?.full_name || user.email, email: user.email };
          setActiveLead(dummyLead);
          fetchMessages(user.id);
        }
      } else {
        const { data, error } = await supabase
          .from('leads_veiculos')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setLeads(data);
          if (data.length === 1) {
            setActiveLead(data[0]);
            fetchMessages(data[0].id);
          }
        } else if (user) {
          // If no lead yet, create a placeholder lead for general chat
          const placeholderLead = { 
            id: `gen_${user.id}`, 
            cliente_nome: profile?.full_name || user.email, 
            email: user.email,
            is_placeholder: true 
          };
          setLeads([placeholderLead]);
          setActiveLead(placeholderLead);
          fetchMessages(placeholderLead.id);
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      // Fetch both types of messages to ensure continuity
      const { data: internalData, error: internalError } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: true });

      const { data: mensagensData, error: mensagensError } = await supabase
        .from('mensagens')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true });

      const mappedInternal = (internalData || []).map(m => ({
        id: m.id,
        conteudo: m.content,
        remetente: m.sender_id === user?.id ? 'cliente' : (m.metadata?.from_ai || m.metadata?.role === 'bot' ? 'bot' : 'admin'),
        created_at: m.created_at
      }));

      const mappedMensagens = (mensagensData || []).map(m => ({
        ...m,
        conteudo: m.conteudo,
        remetente: m.remetente === 'bot' ? 'bot' : (m.remetente === 'admin' ? 'admin' : 'cliente'),
        created_at: m.created_at
      }));

      // Merge and sort by date
      const merged = [...mappedInternal, ...mappedMensagens].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Filter duplicates (unlikely but safe)
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setMessages(unique);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeLead || !user) return;

    setSending(true);
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMessage = {
      id: tempId,
      lead_id: activeLead.id,
      remetente: 'cliente',
      conteudo: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      let currentLeadId = activeLead.id;

      if (!isBuyer && activeLead.is_placeholder) {
        // Create a real lead first
        const { data: newLead, error: leadError } = await supabase
          .from('leads_veiculos')
          .insert([{
            user_id: user.id,
            cliente_nome: activeLead.cliente_nome,
            email: activeLead.email,
            status: 'novo',
            marca: 'Interesse Geral',
            modelo: 'Chat Direto',
            vehicle_code: Math.random().toString(36).substring(2, 6).toUpperCase()
          }])
          .select()
          .single();
        
        if (leadError) throw leadError;
        if (newLead) {
          currentLeadId = newLead.id;
          setActiveLead(newLead);
          setLeads(prev => prev.map(l => l.is_placeholder ? newLead : l));
        }
      }

      if (isBuyer) {
        const { error } = await supabase
          .from('internal_messages')
          .insert([{
            sender_id: user.id,
            receiver_id: null, // To be picked up by admin/AI
            conteudo: messageText,
            is_read: false,
            lead_id: activeLead.id !== user.id ? activeLead.id : null
          }]);
        if (error) {
          console.error('[ChatWidget] Erro ao enviar mensagem interna:', error);
          throw error;
        }

        // Broadcast to a global channel so any active admin/AI sees it immediately
        supabase.channel('internal:chat:global').send({
          type: 'broadcast',
          event: 'new_message',
          payload: { 
            message: messageText, 
            sender_id: user.id,
            lead_id: activeLead.id
          }
        });
      } else {
        const { error } = await supabase
          .from('mensagens')
          .insert([{
            lead_id: currentLeadId,
            remetente: 'cliente',
            conteudo: messageText,
            lida: false
          }]);
        if (error) {
          console.error('[ChatWidget] Erro ao enviar mensagem pública:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
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
        type="button"
        onClick={handleToggle}
        className="fixed md:bottom-6 bottom-[calc(2rem+env(safe-area-inset-bottom))] right-6 z-[60] p-4 bg-accent text-white rounded-full shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center animate-pulse-soft"
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
        <div className="fixed md:bottom-24 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px] max-h-[70vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Chat de Negociação</h3>
                <div className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`} />
              </div>
              <p className="text-xs text-slate-400">
                {isAdminOnline ? 'Especialistas Online' : 'Especialistas Offline'}
              </p>
            </div>
            {activeLead && (
              <button 
                type="button"
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
                      type="button"
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
                        className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                          msg.remetente === 'cliente' 
                            ? 'bg-accent text-white rounded-tr-none' 
                            : msg.remetente === 'bot'
                              ? 'bg-indigo-600 text-white rounded-tl-none border border-indigo-400/30'
                              : 'bg-slate-900 text-white rounded-tl-none'
                        }`}
                      >
                        <div className="markdown-body prose prose-sm max-w-none">
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                              ),
                              img: ({ node, ...props }) => (
                                <img {...props} className="max-w-full rounded-lg my-2 shadow-md" referrerPolicy="no-referrer" />
                              )
                            }}
                          >
                            {msg.conteudo}
                          </Markdown>
                        </div>
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
                            type="button"
                            onClick={() => {
                              setSelectedProposal(msg.metadata?.proposal_data);
                              setShowProposalView(true);
                            }}
                            className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                          >
                            <FileText className="w-4 h-4" /> Ver Proposta Detalhada
                          </button>
                        )}
                        <span className={`text-[10px] block mt-1 ${msg.remetente === 'cliente' || msg.remetente === 'bot' || msg.remetente === 'admin' ? 'text-white/60' : 'text-slate-400'}`}>
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
                  type="button"
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
                  type="button"
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
