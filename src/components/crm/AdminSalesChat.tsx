import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, MessageCircle, Trash2, Loader2, Car, ShieldCheck } from 'lucide-react';
import { ChatActionModal } from './ChatActionModal';

export const AdminSalesChat = ({ conversationId, role, onMessageRead, onOpenLead, onCloneLead, setToast }: { conversationId: string, role: string, onMessageRead: () => void, onOpenLead?: (lead: any) => void, onCloneLead?: (lead: any) => void, setToast?: (toast: any) => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [isAiMode, setIsAiMode] = useState(true);
  const [isUpdatingAi, setIsUpdatingAi] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const fetchLeadData = useCallback(async () => {
      if (!conversationId) return;
      
      console.log('[AdminSalesChat] Buscando leads presentes na conversa:', conversationId);
      
      const allLeadIds = new Set<string>();
      
      // 1. Leads from internal_messages (all unique lead_ids in this conversation)
      // This is the primary source for "vehicles in the conversation"
      const { data: msgsWithLeads } = await supabase
        .from('internal_messages')
        .select('lead_id')
        .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
        .not('lead_id', 'is', null);
      
      msgsWithLeads?.forEach(m => {
          if (m.lead_id) allLeadIds.add(m.lead_id);
      });

      // 2. Fallback: If conversationId itself is a lead_id (direct lead chat)
      const { data: leadById } = await supabase
        .from('leads_veiculos')
        .select('id')
        .eq('id', conversationId);
      leadById?.forEach(l => allLeadIds.add(l.id));

      if (allLeadIds.size > 0) {
        const { data: finalLeads } = await supabase
          .from('leads_veiculos')
          .select('*')
          .in('id', Array.from(allLeadIds));
        
        if (finalLeads) {
          console.log('[AdminSalesChat] Total de leads na conversa:', finalLeads.length);
          setLeads(finalLeads);
          if (finalLeads.length > 0) setLeadData(finalLeads[0]);
        }
      } else {
          console.log('[AdminSalesChat] Nenhum lead vinculado às mensagens.');
          setLeads([]);
          setLeadData(null);
      }
  }, [conversationId]);

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
        
        if (setToast) setToast({ message: 'Histórico apagado com sucesso.', type: 'success' });
        else alert('Histórico apagado com sucesso.');
    } catch (error) {
        console.error('Erro ao apagar mensagens:', error);
        if (setToast) setToast({ message: 'Erro ao apagar mensagens. Verifique sua conexão.', type: 'error' });
        else alert('Erro ao apagar mensagens. Verifique sua conexão.');
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
      .order('created_at', { ascending: true });
    
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
    console.log(`[AdminSalesChat] Toggling AI for conversation ${conversationId} to:`, val);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_ai_enabled: val })
        .eq('id', conversationId);
      
      if (error) {
        console.error('[AdminSalesChat] Error updating AI status in DB:', error);
        if (setToast) setToast({ message: 'Erro ao salvar status da IA para este chat.', type: 'error' });
        else alert('Erro ao salvar status da IA para este chat. Verifique se a coluna is_ai_enabled existe na tabela profiles.');
        throw error;
      }
      
      setIsAiMode(val);
      console.log('[AdminSalesChat] AI status updated successfully');
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
    console.log('[AdminSalesChat] Estado de leads atualizado:', leads.length, leads);
  }, [leads]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    
    fetchMessages();
    fetchUserData();
    fetchLeadData();

    // Real-time listener for leads_veiculos
    const leadsSubscription = supabase
      .channel(`leads_${conversationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads_veiculos',
        filter: `user_id=eq.${conversationId}`
      }, () => {
        console.log('[AdminSalesChat] Mudança detectada em leads_veiculos, recarregando...');
        fetchLeadData();
      })
      .subscribe();

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
          
          // Se a mensagem tiver um lead_id, atualiza os leads
          if (payload.new.lead_id) {
            fetchLeadData();
          }
          
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
      supabase.removeChannel(leadsSubscription);
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
      sender_id: user.id,
      lead_id: leadData?.id
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            {userAvatar && <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full" />}
            <div>
                <h3 className="font-bold">Chat de Vendas</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">{userEmail}</p>
                  {leadData && (
                    <div className="flex items-center gap-1.5 bg-blue-50/50 px-1.5 py-0.5 rounded-lg border border-blue-100">
                      {leadData.foto_principal && (
                        <img 
                          src={leadData.foto_principal} 
                          alt="Veículo" 
                          className="w-5 h-5 rounded-md object-cover border border-blue-200"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight">
                        {leadData.marca} {leadData.modelo} (#{leadData.vehicle_code})
                      </p>
                    </div>
                  )}
                </div>
            </div>
        </div>
        <div className="flex gap-2 items-center">
          {leads.length === 1 && (
            <button 
              type="button"
              onClick={async () => {
                const v = leads[0];
                const isReserved = v.status === 'reservado';
                const confirmMsg = isReserved 
                  ? `Deseja remover a reserva do veículo ${v.marca} ${v.modelo}?` 
                  : `Deseja reservar o veículo ${v.marca} ${v.modelo}?`;
                
                if (!confirm(confirmMsg)) return;
                
                const { error } = await supabase
                  .from('leads_veiculos')
                  .update({ 
                    status: isReserved ? 'novo' : 'reservado', 
                    reserva_timestamp: isReserved ? null : new Date().toISOString() 
                  })
                  .eq('id', v.id);
                
                if (error) alert('Erro ao processar reserva: ' + error.message);
                else {
                  alert(isReserved ? 'Reserva removida com sucesso!' : 'Veículo reservado com sucesso!');
                  fetchLeadData();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${leads[0].status === 'reservado' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {leads[0].status === 'reservado' ? 'Reservado' : 'Reservar'}
            </button>
          )}
          {leads.length > 0 && (
            <button 
              type="button"
              onClick={() => setShowProposalModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <Car className="w-3.5 h-3.5" />
              {leads.length} {leads.length === 1 ? 'Veículo' : 'Veículos'}
            </button>
          )}
          <button 
            type="button"
            onClick={clearChat}
            disabled={isDeleting}
            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
            title="Apagar todas as mensagens"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          <button 
            type="button"
            onClick={() => setShowCloneModal(true)}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white transition-all"
          >
            Clonar
          </button>
          <button 
            type="button"
            onClick={() => {
              console.log('[AdminSalesChat] Botão Ver Proposta clicado. Leads:', leads.length);
              if (leads.length === 1 && onOpenLead) {
                const v = leads[0];
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
                console.log('[AdminSalesChat] Abrindo lead único:', vehicleWithMedia);
                onOpenLead(vehicleWithMedia);
              } else {
                console.log('[AdminSalesChat] Abrindo modal de proposta (múltiplos ou nenhum lead)');
                setShowProposalModal(true);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Ver Proposta
          </button>
          <button 
            type="button"
            onClick={() => toggleAiMode(!isAiMode)}
            disabled={isUpdatingAi}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!isAiMode ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            {!isAiMode ? 'Atendimento Humano: ON' : 'Atendimento Humano: OFF'}
          </button>

          {showProposalModal && (
            <ChatActionModal
              type="proposta"
              conversationId={conversationId}
              lead={leadData}
              onClose={() => setShowProposalModal(false)}
              onOpenLead={onOpenLead}
            />
          )}

          {showCloneModal && (
            <ChatActionModal
              type="clonar"
              conversationId={conversationId}
              lead={leadData}
              onClose={() => setShowCloneModal(false)}
              onCloneLead={onCloneLead}
            />
          )}

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
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0" ref={chatContainerRef}>
        {(messages || []).map(m => (
          <div key={m.id || Math.random()} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_id === currentUserId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {m.content}
              <span className="text-[9px] mt-1 block opacity-50">
                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
          placeholder="Digite..."
        />
        <button type="button" onClick={sendMessage} className="bg-slate-900 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
