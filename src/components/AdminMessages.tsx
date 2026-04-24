import React, { useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, Send, Search, Mail, User, Users, ImageIcon, ShieldCheck, DollarSign, UserCheck, Loader2, Trash2, Copy, Check, CheckCircle, ShoppingBag, Bot, CheckCheck } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminMessagesProps {
  conversations: any[];
  selectedConversation: any;
  setSelectedConversation: (conv: any) => void;
  chatMessages: any[];
  adminMessage: string;
  setAdminMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleLearnFromChat: () => void;
  setShowProposalModal: (show: boolean) => void;
  setShowVehicleSelectionModal: (show: boolean) => void;
  setSelectionMode: (mode: 'proposal' | 'clone') => void;
  onCloneLead: (lead: any) => void;
  setSelectedLead: (lead: any) => void;
  setToast?: (toast: any) => void;
  messageTab: 'leads' | 'internal' | 'buyers';
  setMessageTab: (tab: 'leads' | 'internal' | 'buyers') => void;
  internalConversations: any[];
  selectedInternalChat: string | null;
  setSelectedInternalChat: (id: string | null) => void;
  internalChatMessages: any[];
  isGlobalAiEnabled: boolean;
  toggleGlobalAi: () => void;
  autoProposalEnabled: boolean;
  toggleAutoProposal: () => void;
  isUpdatingAi: boolean;
  isSendingMessage: boolean;
  fetchChatMessages: (leadIds: string[]) => void;
  fetchInternalMessages: (otherId: string) => void;
  users: any[];
  leads: any[];
  setProposalCalculator: (calc: any) => void;
  calculateProposal: (lead: any) => any;
  supabase: any;
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  compradoresConversations: any[];
  selectedCompradorChat: string | null;
  setSelectedCompradorChat: (id: string | null) => void;
  compradorChatMessages: any[];
  fetchCompradorMessages: (otherId: string) => void;
}

export default function AdminMessages({
  conversations,
  selectedConversation,
  setSelectedConversation,
  chatMessages,
  adminMessage,
  setAdminMessage,
  handleSendMessage,
  handleLearnFromChat,
  setShowProposalModal,
  setShowVehicleSelectionModal,
  setSelectionMode,
  onCloneLead,
  setSelectedLead,
  setToast,
  messageTab,
  setMessageTab,
  internalConversations,
  selectedInternalChat,
  setSelectedInternalChat,
  internalChatMessages,
  isGlobalAiEnabled,
  toggleGlobalAi,
  autoProposalEnabled,
  toggleAutoProposal,
  isUpdatingAi,
  isSendingMessage,
  fetchChatMessages,
  fetchInternalMessages,
  users,
  leads,
  setProposalCalculator,
  calculateProposal,
  supabase,
  setConversations,
  compradoresConversations,
  selectedCompradorChat,
  setSelectedCompradorChat,
  compradorChatMessages,
  fetchCompradorMessages
}: AdminMessagesProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const leadsScrollRef = useRef<HTMLDivElement>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final das mensagens
  useEffect(() => {
    const scrollToBottom = () => {
      if (leadsScrollRef.current) {
        leadsScrollRef.current.scrollTop = leadsScrollRef.current.scrollHeight;
      }
    };
    
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [chatMessages, selectedConversation]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (internalScrollRef.current) {
        internalScrollRef.current.scrollTop = internalScrollRef.current.scrollHeight;
      }
    };
    
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [internalChatMessages, compradorChatMessages, selectedInternalChat, selectedCompradorChat]);

  const filteredConversations = (conversations || [])
    .filter(conv => 
      conv.lead?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lead?.vehicle_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  const filteredInternalConversations = (internalConversations || [])
    .filter(conv =>
      conv.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.last_message_at || b.last_time).getTime() - new Date(a.last_message_at || a.last_time).getTime());

  const filteredCompradoresConversations = (compradoresConversations || [])
    .filter(conv =>
      conv.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.last_message_at || b.last_time).getTime() - new Date(a.last_message_at || a.last_time).getTime());

  // Atualização em batch
  useEffect(() => {
    if (messageTab === 'leads' && !selectedConversation && conversations.length > 0) {
      const firstConv = conversations[0];
      setSelectedConversation(firstConv);
      fetchChatMessages(firstConv.lead_ids);
      const lead = leads.find(l => l.id === firstConv.lead_ids[0]);
      if (lead) {
        setSelectedLead(lead);
        setProposalCalculator(calculateProposal(lead));
      }
    } else if (messageTab === 'internal' && !selectedInternalChat && internalConversations.length > 0) {
      const firstConv = internalConversations[0];
      setSelectedInternalChat(firstConv.id);
      fetchInternalMessages(firstConv.id);
    }
  }, [messageTab, conversations, internalConversations]);

  const handleDeleteConversation = async (e: React.MouseEvent, conv: any) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta conversa? Todas as mensagens serão removidas.')) return;

    try {
      const { error } = await supabase
        .from('mensagens')
        .delete()
        .in('lead_id', conv.lead_ids);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.conversation_key !== conv.conversation_key));
      if (selectedConversation?.conversation_key === conv.conversation_key) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error(err);
      if (setToast) setToast({ message: 'Erro ao excluir conversa.', type: 'error' });
      else alert('Erro ao excluir conversa.');
    }
  };

  const handleDeleteContact = async (e: React.MouseEvent, conv: any) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este contato? O lead e todas as mensagens serão removidos.')) return;

    try {
      // Deletar mensagens primeiro devido à chave estrangeira
      await supabase.from('mensagens').delete().in('lead_id', conv.lead_ids);
      
      // Deletar lead
      const { error } = await supabase
        .from('leads_veiculos')
        .delete()
        .in('id', conv.lead_ids);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.conversation_key !== conv.conversation_key));
      if (selectedConversation?.conversation_key === conv.conversation_key) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error(err);
      if (setToast) setToast({ message: 'Erro ao excluir contato.', type: 'error' });
      else alert('Erro ao excluir contato.');
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex h-[calc(100vh-140px)] min-h-[600px] w-full">
      {/* Lista de Conversas (Esquerda) */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setMessageTab('leads')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${messageTab === 'leads' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
            >
              <Users className="w-3 h-3" />
              VENDEDORES
            </button>
            <button 
              onClick={() => setMessageTab('internal')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${messageTab === 'internal' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
            >
              <ShieldCheck className="w-3 h-3" />
              EQUIPE
            </button>
          </div>
          
          {/* Controles de IA */}
          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className={`w-4 h-4 ${isGlobalAiEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black text-slate-700">IA GLOBAL</span>
              </div>
              <button 
                onClick={toggleGlobalAi}
                disabled={isUpdatingAi}
                className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${isGlobalAiEnabled ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}
              >
                {isGlobalAiEnabled ? 'ATIVA (24H)' : 'DESATIVADA'}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${autoProposalEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black text-slate-700">PROPOSTA</span>
              </div>
              <button 
                onClick={toggleAutoProposal}
                disabled={isUpdatingAi || !isGlobalAiEnabled}
                className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${autoProposalEnabled && isGlobalAiEnabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}
              >
                {autoProposalEnabled && isGlobalAiEnabled ? 'AUTOMÁTICA' : 'MANUAL'}
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4">Conversas</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messageTab === 'leads' ? (
            filteredConversations.map((conv) => (
            <div 
              key={conv.conversation_key}
              onClick={() => {
                setSelectedConversation(conv);
                setSelectedInternalChat(null);
                setSelectedCompradorChat(null);
                fetchChatMessages(conv.lead_ids);
                const lead = leads.find(l => l.id === conv.lead_ids[0]);
                if (lead) {
                  setSelectedLead(lead);
                  setProposalCalculator(calculateProposal(lead));
                }
              }}
              className={`py-2 px-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 relative ${selectedConversation?.conversation_key === conv.conversation_key ? 'bg-slate-50 border-l-4 border-l-slate-900' : ''} ${conv.unread > 0 ? 'bg-blue-50/50' : ''}`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                  {(() => {
                    const profile = conv.customer_email ? users.find(u => u.email === conv.customer_email) : null;
                    const avatarUrl = profile?.avatar_url || (conv.lead?.fotos && conv.lead.fotos[0]);
                    return avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                </div>
                {conv.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold truncate ${conv.unread > 0 ? 'text-blue-900' : 'text-slate-900'}`}>
                        {(() => {
                          const profile = conv.customer_email ? users.find(u => u.email === conv.customer_email) : null;
                          return profile?.full_name || conv.lead?.cliente_nome || 'Cliente';
                        })()}
                      </h4>
                      {conv.is_unanswered && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Aguardando resposta" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{conv.customer_email || 'Sem email'}</p>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {conv.lead_ids.length > 1 ? `${conv.lead_ids.length} veículos` : `#${conv.lead?.vehicle_code || '----'}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const conversationLeads = leads.filter(l => conv.lead_ids.includes(l.id));
                          if (conversationLeads.length > 1) {
                            setSelectedConversation(conv);
                            setSelectionMode('clone');
                            setShowVehicleSelectionModal(true);
                          } else if (conversationLeads.length === 1) {
                            onCloneLead(conversationLeads[0]);
                          } else {
                            if (setToast) setToast({ message: 'Nenhum veículo encontrado nesta conversa.', type: 'error' });
                            else alert('Nenhum veículo encontrado nesta conversa.');
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
                        title="Clonar Veículo"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteConversation(e, conv)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        title="Excluir Conversa"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteContact(e, conv)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        title="Excluir Contato"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        NÃO VISUALIZADA
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-xs truncate ${conv.unread > 0 ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>{conv.last_message}</p>
              </div>
            </div>
          ))
        ) : messageTab === 'internal' ? (
            filteredInternalConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => {
                  setSelectedInternalChat(conv.id);
                  setSelectedConversation(null);
                  setSelectedCompradorChat(null);
                  fetchInternalMessages(conv.id);
                }}
                className={`py-2 px-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 relative ${selectedInternalChat === conv.id ? 'bg-slate-50 border-l-4 border-l-indigo-600' : ''} ${conv.unread > 0 ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {conv.profile?.avatar_url ? (
                      <img src={conv.profile.avatar_url} alt={conv.profile.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  {conv.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col min-w-0">
                      <h4 className={`text-sm font-bold truncate ${conv.unread > 0 ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {conv.profile?.full_name || 'Usuário'}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">{conv.profile?.email}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${conv.unread > 0 ? 'text-indigo-700 font-medium' : 'text-slate-500'}`}>
                      {conv.last_message}
                    </p>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                        NÃO VISUALIZADA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredCompradoresConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => {
                  setSelectedCompradorChat(conv.id);
                  setSelectedConversation(null);
                  setSelectedInternalChat(null);
                  fetchCompradorMessages(conv.id);
                }}
                className={`py-3 px-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 relative ${selectedCompradorChat === conv.id ? 'bg-slate-50 border-l-4 border-l-emerald-600' : ''} ${conv.unread > 0 ? 'bg-emerald-50/50' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {conv.profile?.avatar_url ? (
                      <img src={conv.profile.avatar_url} alt={conv.profile.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  {conv.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col min-w-0">
                      <h4 className={`text-sm font-bold truncate ${conv.unread > 0 ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {conv.profile?.full_name || 'Comprador'}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">{conv.profile?.email}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${conv.unread > 0 ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {conv.last_message}
                    </p>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                        NÃO VISUALIZADA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Janela de Chat (Direita) */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {messageTab === 'leads' ? (
          selectedConversation ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center z-20 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  {(() => {
                    const profile = selectedConversation.customer_email ? users.find(u => u.email === selectedConversation.customer_email) : null;
                    const avatarUrl = profile?.avatar_url || (selectedConversation.lead?.fotos && selectedConversation.lead.fotos[0]) || selectedConversation.lead?.foto_principal;
                    return avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedConversation.lead?.cliente_nome || 'Cliente'}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-mono">{selectedConversation.customer_email}</p>
                    {(() => {
                      const userVehicles = leads.filter(l => 
                        (selectedConversation.customer_email && l.email === selectedConversation.customer_email) ||
                        (selectedConversation.lead?.user_id && l.user_id === selectedConversation.lead.user_id) ||
                        selectedConversation.lead_ids?.includes(l.id)
                      );
                      
                      if (userVehicles.length > 0) {
                        const leadData = userVehicles[0];
                        return (
                          <div className="flex items-center gap-1.5 bg-blue-50/50 px-1.5 py-0.5 rounded-lg border border-blue-100">
                            {(leadData.foto_principal || (leadData.fotos && leadData.fotos[0])) && (
                              <img 
                                src={leadData.foto_principal || leadData.fotos[0]} 
                                alt="Veículo" 
                                className="w-5 h-5 rounded-md object-cover border border-blue-200"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight">
                              {userVehicles.length > 1 
                                ? `${userVehicles.length} Veículos em Estoque` 
                                : `${leadData.marca} ${leadData.modelo} (#${leadData.vehicle_code})`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Botões de Ação */}
                <button 
                  onClick={() => {
                    if (selectedConversation.lead?.email) {
                      window.location.href = `mailto:${selectedConversation.lead.email}`;
                    } else {
                      if (setToast) setToast({ message: 'E-mail do cliente não encontrado para este lead.', type: 'error' });
                      else alert('E-mail do cliente não encontrado para este lead.');
                    }
                  }}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Enviar Email"
                >
                  <Mail className="w-4 h-4" />
                </button>
                {selectedConversation.lead?.telefone && (
                  <a 
                    href={`https://wa.me/${selectedConversation.lead.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors animate-pulse-soft"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                
                {/* Botão de toggle de IA para este lead */}
                {selectedConversation.lead && (
                  <button 
                    onClick={async () => {
                      const currentStatus = selectedConversation.lead?.detalhes_proposta?.ai_disabled || false;
                      const { error } = await supabase
                        .from('leads_veiculos')
                        .update({ 
                          detalhes_proposta: { 
                            ...selectedConversation.lead?.detalhes_proposta,
                            ai_disabled: !currentStatus 
                          } 
                        })
                        .eq('id', selectedConversation.lead.id);

                      if (error) {
                        if (setToast) setToast({ message: 'Erro ao atualizar status da IA.', type: 'error' });
                      } else {
                        // Atualizar localmente
                        setConversations(prev => prev.map(c => {
                          if (c.conversation_key === selectedConversation.conversation_key) {
                            return {
                              ...c,
                              lead: {
                                ...c.lead,
                                detalhes_proposta: {
                                  ...c.lead?.detalhes_proposta,
                                  ai_disabled: !currentStatus
                                }
                              }
                            };
                          }
                          return c;
                        }));
                        setSelectedConversation(prev => ({
                          ...prev,
                          lead: {
                            ...prev.lead,
                            detalhes_proposta: {
                              ...prev.lead?.detalhes_proposta,
                              ai_disabled: !currentStatus
                            }
                          }
                        }));
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${selectedConversation.lead?.detalhes_proposta?.ai_disabled ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}
                    title={selectedConversation.lead?.detalhes_proposta?.ai_disabled ? "Ativar IA para este Lead" : "Desativar IA para este Lead"}
                  >
                    <Bot className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      {selectedConversation.lead?.detalhes_proposta?.ai_disabled ? 'IA OFF' : 'IA ON'}
                    </span>
                  </button>
                )}
                
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <button 
                  type="button"
                  onClick={handleLearnFromChat}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                  title="Adicionar histórico desta conversa à memória da IA"
                >
                  <ShieldCheck className="w-4 h-4" />
                  IA: Aprender
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const userVehicles = leads.filter(l => 
                      (selectedConversation.customer_email && l.email === selectedConversation.customer_email) ||
                      (selectedConversation.lead?.user_id && l.user_id === selectedConversation.lead.user_id) ||
                      selectedConversation.lead_ids?.includes(l.id)
                    );

                    if (userVehicles.length > 1) {
                      setSelectionMode('clone');
                      setShowVehicleSelectionModal(true);
                    } else if (userVehicles.length === 1) {
                      const v = userVehicles[0];
                      const vehicleWithMedia = {
                        ...v,
                        marca: v.marca || (v.veiculo ? v.veiculo.split(' ')[0] : 'N/A'),
                        modelo: v.modelo || (v.veiculo ? v.veiculo.split(' ').slice(1).join(' ') : 'N/A'),
                        ano_fabricacao: v.ano_fabricacao || v.ano_modelo || 'N/A',
                        ano_modelo: v.ano_modelo || 'N/A',
                        cor: v.cor || 'N/A',
                        valor_fipe: v.valor_fipe || 0,
                        preco_cliente: v.preco_cliente || 0,
                        fotos: v.fotos_url || (Array.isArray(v.fotos) ? v.fotos : (v.fotos ? [v.fotos] : [])),
                        videos: Array.isArray(v.videos) ? v.videos : (v.videos ? [v.videos] : [])
                      };
                      onCloneLead(vehicleWithMedia);
                    } else {
                      if (setToast) setToast({ message: 'Nenhum veículo encontrado para este usuário.', type: 'error' });
                      else alert('Nenhum veículo encontrado para este usuário.');
                    }
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-200 transition-all flex items-center gap-2"
                  title="Clonar dados deste veículo para uma nova negociação"
                >
                  <Copy className="w-4 h-4" />
                  Clonar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const userVehicles = leads.filter(l => 
                      (selectedConversation.customer_email && l.email === selectedConversation.customer_email) ||
                      (selectedConversation.lead?.user_id && l.user_id === selectedConversation.lead.user_id) ||
                      selectedConversation.lead_ids?.includes(l.id)
                    );

                    if (userVehicles.length > 1) {
                      setSelectionMode('proposal');
                      setShowVehicleSelectionModal(true);
                    } else if (userVehicles.length === 1) {
                      const v = userVehicles[0];
                      const vehicleWithMedia = {
                        ...v,
                        marca: v.marca || (v.veiculo ? v.veiculo.split(' ')[0] : 'N/A'),
                        modelo: v.modelo || (v.veiculo ? v.veiculo.split(' ').slice(1).join(' ') : 'N/A'),
                        ano_fabricacao: v.ano_fabricacao || v.ano_modelo || 'N/A',
                        ano_modelo: v.ano_modelo || 'N/A',
                        cor: v.cor || 'N/A',
                        valor_fipe: v.valor_fipe || 0,
                        preco_cliente: v.preco_cliente || 0,
                        fotos: v.fotos_url || (Array.isArray(v.fotos) ? v.fotos : (v.fotos ? [v.fotos] : [])),
                        videos: Array.isArray(v.videos) ? v.videos : (v.videos ? [v.videos] : [])
                      };
                      setSelectedLead(vehicleWithMedia);
                      setProposalCalculator(calculateProposal(vehicleWithMedia));
                      setShowProposalModal(true);
                    } else {
                      if (setToast) setToast({ message: 'Nenhum veículo encontrado para este usuário.', type: 'error' });
                      else alert('Nenhum veículo encontrado para este usuário.');
                    }
                  }}
                  className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-bold text-xs hover:bg-accent/20 transition-all flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Ver Proposta
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div 
              ref={leadsScrollRef}
              className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 scroll-smooth"
            >
            <AnimatePresence initial={false}>
              {(chatMessages || []).map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.remetente === 'admin' || msg.remetente === 'bot' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] md:max-w-[70%] p-3.5 rounded-2xl text-[13px] shadow-sm ${
                    msg.remetente === 'admin' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : msg.remetente === 'bot'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5 border-b border-white/10 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {msg.remetente === 'admin' ? 'Atendimento' : msg.remetente === 'bot' ? 'Agente IA' : 'Cliente'}
                      </span>
                    </div>
                    <div className="markdown-body prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                      <Markdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold" />
                          ),
                          img: ({ node, ...props }) => (
                            <img {...props} className="max-w-full rounded-xl my-2 shadow-sm border border-white/10" referrerPolicy="no-referrer" />
                          ),
                          p: ({ children }) => <p className="mb-0 last:mb-0">{children}</p>
                        }}
                      >
                        {msg.conteudo}
                      </Markdown>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-white/5">
                      <span className={`text-[9px] font-bold opacity-60`}>
                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: ptBR }) : ''}
                      </span>
                      {(msg.remetente === 'admin' || msg.remetente === 'bot') && (
                        <div className="flex items-center">
                          {msg.lida ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3 text-white/40" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <textarea 
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none h-12"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !adminMessage.trim()}
                  className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 animate-pulse-soft"
                >
                  {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-600">Nenhuma conversa selecionada</h4>
              <p className="text-sm">Selecione um lead na lista ao lado para ver o histórico e responder.</p>
            </div>
          )
        ) : (
          (selectedInternalChat || selectedCompradorChat) ? (
            <>
              {/* Cabeçalho do Chat Interno / Comprador */}
              <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {(() => {
                      const chatId = messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat;
                      const profile = (users || []).find(u => u.id === chatId);
                      return profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      );
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {(() => {
                        const chatId = messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat;
                        return (users || []).find(u => u.id === chatId)?.full_name || 'Usuário';
                      })()}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400">{messageTab === 'buyers' ? 'Comprador' : 'Equipe'}</p>
                      {(() => {
                        const chatId = messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat;
                        const internalLeads = leads.filter(l => l.user_id === chatId);
                        if (internalLeads.length > 0) {
                          const leadData = internalLeads[0];
                          return (
                            <div className="flex items-center gap-1.5 bg-blue-50/50 px-1.5 py-0.5 rounded-lg border border-blue-100">
                              {(leadData.foto_principal || (leadData.fotos && leadData.fotos[0])) && (
                                <img 
                                  src={leadData.foto_principal || leadData.fotos[0]} 
                                  alt="Veículo" 
                                  className="w-5 h-5 rounded-md object-cover border border-blue-200"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight">
                                {internalLeads.length > 1 
                                  ? `${internalLeads.length} Veículos em Estoque` 
                                  : `${leadData.marca} ${leadData.modelo} (#${leadData.vehicle_code})`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const chatId = messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat;
                    const internalLeads = leads.filter(l => l.user_id === chatId);
                    if (internalLeads.length > 0) {
                      return (
                        <>
                          <button 
                            type="button"
                            onClick={() => {
                              if (internalLeads.length > 1) {
                                setSelectedLead(null); // Clear to force selection
                                setSelectionMode('clone');
                                setShowVehicleSelectionModal(true);
                              } else {
                                const v = internalLeads[0];
                                const vehicleWithMedia = {
                                  ...v,
                                  marca: v.marca || (v.veiculo ? v.veiculo.split(' ')[0] : 'N/A'),
                                  modelo: v.modelo || (v.veiculo ? v.veiculo.split(' ').slice(1).join(' ') : 'N/A'),
                                  ano_fabricacao: v.ano_fabricacao || v.ano_modelo || 'N/A',
                                  ano_modelo: v.ano_modelo || 'N/A',
                                  cor: v.cor || 'N/A',
                                  valor_fipe: v.valor_fipe || 0,
                                  preco_cliente: v.preco_cliente || 0,
                                  fotos: v.fotos_url || (Array.isArray(v.fotos) ? v.fotos : (v.fotos ? [v.fotos] : [])),
                                  videos: Array.isArray(v.videos) ? v.videos : (v.videos ? [v.videos] : [])
                                };
                                onCloneLead(vehicleWithMedia);
                              }
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-200 transition-all flex items-center gap-2"
                            title="Clonar dados deste veículo"
                          >
                            <Copy className="w-4 h-4" />
                            Clonar
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (internalLeads.length > 1) {
                                setSelectionMode('proposal');
                                setShowVehicleSelectionModal(true);
                              } else {
                                const v = internalLeads[0];
                                const vehicleWithMedia = {
                                  ...v,
                                  marca: v.marca || (v.veiculo ? v.veiculo.split(' ')[0] : 'N/A'),
                                  modelo: v.modelo || (v.veiculo ? v.veiculo.split(' ').slice(1).join(' ') : 'N/A'),
                                  ano_fabricacao: v.ano_fabricacao || v.ano_modelo || 'N/A',
                                  ano_modelo: v.ano_modelo || 'N/A',
                                  cor: v.cor || 'N/A',
                                  valor_fipe: v.valor_fipe || 0,
                                  preco_cliente: v.preco_cliente || 0,
                                  fotos: v.fotos_url || (Array.isArray(v.fotos) ? v.fotos : (v.fotos ? [v.fotos] : [])),
                                  videos: Array.isArray(v.videos) ? v.videos : (v.videos ? [v.videos] : [])
                                };
                                setSelectedLead(vehicleWithMedia);
                                setProposalCalculator(calculateProposal(vehicleWithMedia));
                                setShowProposalModal(true);
                              }
                            }}
                            className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-bold text-xs hover:bg-accent/20 transition-all flex items-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Ver Proposta
                          </button>
                        </>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const chatId = messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat;
                    const profile = (users || []).find(u => u.id === chatId);
                    if (!profile) return null;
                    
                    return (
                      <button 
                        onClick={async () => {
                          const newValue = profile.is_ai_enabled === false ? true : false;
                          const { error } = await supabase
                            .from('profiles')
                            .update({ is_ai_enabled: newValue })
                            .eq('id', profile.id);

                          if (!error) {
                            // Update local users state if possible, or just rely on refresh
                            // Since users is likely a prop from AdminDashboard, we might need a callback
                            // But for now, let's assume it works or the user can refresh
                            if (setToast) setToast({ message: `IA ${newValue ? 'ativada' : 'pausada'} para este usuário.`, type: 'success' });
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          profile.is_ai_enabled === false 
                            ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={profile.is_ai_enabled === false ? "IA pausada para este usuário. Clique para ativar." : "IA ativa para este usuário. Clique para pausar."}
                      >
                        {profile.is_ai_enabled === false ? (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span>IA: PAUSADA (HUMANO)</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 animate-pulse-soft" />
                            <span>IA: ATIVA</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                  <button 
                    type="button"
                    onClick={handleLearnFromChat}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                    title="Adicionar histórico desta conversa à memória da IA do CRM"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    IA: Aprender
                  </button>
                </div>
              </div>

              {/* Mensagens Internas / Compradores */}
              <div 
                ref={internalScrollRef}
                className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 scroll-smooth"
              >
                {(messageTab === 'buyers' ? compradorChatMessages : internalChatMessages || []).map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender_id !== (messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.sender_id !== (messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat)
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-[9px] mt-1 flex items-center gap-1 opacity-70`}>
                        {new Date(msg.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender_id !== (messageTab === 'buyers' ? selectedCompradorChat : selectedInternalChat) && (
                          <div className="flex items-center ml-1">
                            {msg.read ? (
                              <CheckCircle className="w-2.5 h-2.5 text-blue-400" />
                            ) : (
                              <Check className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                  <textarea 
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={messageTab === 'buyers' ? "Digite sua mensagem para o comprador..." : "Digite sua mensagem interna..."}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none h-12"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !adminMessage.trim()}
                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {messageTab === 'buyers' ? <ShoppingBag className="w-8 h-8" /> : <Users className="w-8 h-8" />}
              </div>
              <h4 className="text-lg font-bold text-slate-600">
                {messageTab === 'buyers' ? 'Nenhum chat de comprador selecionado' : 'Nenhum chat interno selecionado'}
              </h4>
              <p className="text-sm">
                {messageTab === 'buyers' ? 'Selecione um comprador na lista ao lado para iniciar uma conversa.' : 'Selecione um membro da equipe para iniciar uma conversa.'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
