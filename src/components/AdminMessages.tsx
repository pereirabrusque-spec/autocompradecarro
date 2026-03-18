import React, { useRef, useEffect } from 'react';
import { MessageCircle, Send, Search, Mail, User, Users, ImageIcon, ShieldCheck, DollarSign, UserCheck, Loader2 } from 'lucide-react';

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
  setSelectedLead: (lead: any) => void;
  messageTab: 'leads' | 'internal';
  setMessageTab: (tab: 'leads' | 'internal') => void;
  internalConversations: any[];
  selectedInternalChat: string | null;
  setSelectedInternalChat: (id: string | null) => void;
  internalChatMessages: any[];
  isGlobalAiEnabled: boolean;
  toggleGlobalAi: () => void;
  autoProposalEnabled: boolean;
  setAutoProposalEnabled: (enabled: boolean) => void;
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
  setSelectedLead,
  messageTab,
  setMessageTab,
  internalConversations,
  selectedInternalChat,
  setSelectedInternalChat,
  internalChatMessages,
  isGlobalAiEnabled,
  toggleGlobalAi,
  autoProposalEnabled,
  setAutoProposalEnabled,
  isUpdatingAi,
  isSendingMessage,
  fetchChatMessages,
  fetchInternalMessages,
  users,
  leads,
  setProposalCalculator,
  calculateProposal,
  supabase,
  setConversations
}: AdminMessagesProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const leadsScrollRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(conv => 
    conv.lead?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lead?.vehicle_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInternalConversations = internalConversations.filter(conv =>
    conv.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (leadsScrollRef.current) {
      leadsScrollRef.current.scrollTop = leadsScrollRef.current.scrollHeight;
    }
  }, [chatMessages, internalChatMessages]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex h-[700px] w-full">
      {/* Lista de Conversas (Esquerda) */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setMessageTab('leads')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${messageTab === 'leads' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Leads
            </button>
            <button 
              onClick={() => setMessageTab('internal')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${messageTab === 'internal' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Equipe
            </button>
          </div>
          
          {/* Novos controles de IA */}
          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">IA GLOBAL (24h)</span>
              <button 
                onClick={toggleGlobalAi}
                disabled={isUpdatingAi}
                className={`w-10 h-5 rounded-full transition-colors ${isGlobalAiEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isGlobalAiEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">PROPOSTA AUTO/MAN</span>
              <button 
                onClick={() => setAutoProposalEnabled(!autoProposalEnabled)}
                disabled={!isGlobalAiEnabled}
                className={`w-10 h-5 rounded-full transition-colors ${autoProposalEnabled && isGlobalAiEnabled ? 'bg-blue-600' : 'bg-slate-300'} ${!isGlobalAiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoProposalEnabled && isGlobalAiEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
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
                fetchChatMessages(conv.lead_ids);
                const lead = leads.find(l => l.id === conv.lead_ids[0]);
                if (lead) {
                  setSelectedLead(lead);
                  setProposalCalculator(calculateProposal(lead));
                }
              }}
              className={`py-1 px-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedConversation?.conversation_key === conv.conversation_key ? 'bg-slate-50' : ''}`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
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
                      <h4 className="font-bold text-slate-900 truncate">
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
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
              </div>
            </div>
          ))
        ) : (
            filteredInternalConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => {
                  setSelectedInternalChat(conv.id);
                  fetchInternalMessages(conv.id);
                }}
                className={`py-1 px-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedInternalChat === conv.id ? 'bg-slate-50' : ''}`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 truncate">{conv.profile?.full_name || 'Usuário'}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                  {conv.unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {conv.unread}
                    </span>
                  )}
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
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                  {(() => {
                    const profile = selectedConversation.customer_email ? users.find(u => u.email === selectedConversation.customer_email) : null;
                    const avatarUrl = profile?.avatar_url || (selectedConversation.lead?.fotos && selectedConversation.lead.fotos[0]);
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
                  <h4 className="font-bold text-slate-900">{selectedConversation.lead?.cliente_nome}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">#{selectedConversation.lead?.vehicle_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Botões de Ação */}
                <button 
                  onClick={() => {
                    if (selectedConversation.lead?.email) {
                      window.location.href = `mailto:${selectedConversation.lead.email}`;
                    } else {
                      alert('E-mail do cliente não encontrado para este lead.');
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
                    className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                
                {selectedConversation.lead && (
                  <button 
                    onClick={async () => {
                      const newValue = !selectedConversation.lead.detalhes_proposta?.ai_disabled;
                      const newDetalhes = { ...(selectedConversation.lead.detalhes_proposta || {}), ai_disabled: newValue };
                      try {
                        const { error } = await supabase
                          .from('leads_veiculos')
                          .update({ detalhes_proposta: newDetalhes })
                          .eq('id', selectedConversation.lead.id);
                        
                        if (error) throw error;
                        
                        // Update local state
                        setConversations(prev => prev.map(c => 
                          c.lead_id === selectedConversation.lead_id 
                            ? { ...c, lead: { ...c.lead, detalhes_proposta: newDetalhes } } 
                            : c
                        ));
                        setSelectedConversation({
                          ...selectedConversation,
                          lead: { ...selectedConversation.lead, detalhes_proposta: newDetalhes }
                        });
                      } catch (err) {
                        console.error(err);
                        alert('Erro ao alterar modo de atendimento.');
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}`}
                    title={selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'Desativar Atendimento Humano (Ativar IA)' : 'Ativar Atendimento Humano (Pausar IA)'}
                  >
                    <UserCheck className={`w-4 h-4 ${selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'text-orange-600' : 'text-slate-500'}`} />
                    {selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'Atendimento Humano: ON' : 'Atendimento Humano'}
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
                    setSelectedLead(selectedConversation.lead);
                    setShowProposalModal(true);
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
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {(chatMessages || []).map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.remetente === 'admin' || msg.remetente === 'bot' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                    msg.remetente === 'admin' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : msg.remetente === 'bot'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-blue-50 text-blue-900 rounded-tl-none border border-blue-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase opacity-70">
                        {msg.remetente === 'admin' ? 'Humano' : msg.remetente === 'bot' ? 'IA' : 'Cliente'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                    <span className={`text-[9px] mt-1 block opacity-70`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  placeholder="Digite sua mensagem..."
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
                <MessageCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-600">Nenhuma conversa selecionada</h4>
              <p className="text-sm">Selecione um lead na lista ao lado para ver o histórico e responder.</p>
            </div>
          )
        ) : (
          selectedInternalChat ? (
            <>
              {/* Cabeçalho do Chat Interno */}
              <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {(() => {
                      const profile = (users || []).find(u => u.id === selectedInternalChat);
                      return profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      );
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {(users || []).find(u => u.id === selectedInternalChat)?.full_name || 'Usuário'}
                    </h4>
                    <p className="text-[10px] text-slate-400">Equipe</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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

              {/* Mensagens Internas */}
              <div 
                ref={leadsScrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {(internalChatMessages || []).map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender_id !== selectedInternalChat ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.sender_id !== selectedInternalChat 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-[9px] mt-1 block opacity-70`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensagem Interna */}
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
                    placeholder="Digite sua mensagem interna..."
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
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-600">Nenhum chat interno selecionado</h4>
              <p className="text-sm">Selecione um membro da equipe para iniciar uma conversa.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
