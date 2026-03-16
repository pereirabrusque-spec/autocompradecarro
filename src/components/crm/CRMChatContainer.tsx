import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSalesChat } from './AdminSalesChat';
import { MessageCircle, Bot } from 'lucide-react';

export const CRMChatContainer = ({ role }: { role: string }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showAiRules, setShowAiRules] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const fetchConversations = async (userId?: string) => {
      const uid = userId || currentUserId;
      console.log('[CRMChatContainer] Buscando conversas para UID:', uid);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .in('role', ['buyer', 'buyer_premium', 'buyer_master'])
        .order('created_at', { ascending: false });
      
      if (profiles) {
        setConversations(profiles);
        
        // Busca contadores APENAS para mensagens destinadas ao admin logado
        if (uid) {
            const { data: unreadData, error: unreadError } = await supabase
              .from('internal_messages')
              .select('sender_id')
              .eq('receiver_id', uid)
              .eq('is_read', false);

            if (unreadError) console.error('[CRMChatContainer] Erro ao buscar não lidas:', unreadError);

            const counts: Record<string, number> = {};
            profiles.forEach(p => counts[p.id] = 0);
            
            if (unreadData) {
              unreadData.forEach(msg => {
                if (counts[msg.sender_id] !== undefined) {
                  counts[msg.sender_id]++;
                }
              });
            }
            console.log('[CRMChatContainer] Contadores atualizados:', counts);
            setUnreadCounts(counts);
        }
      }
    };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
          setCurrentUserId(user.id);
          fetchConversations(user.id);
      }
    });

    // Load existing prompt
    supabase.from('settings').select('value').eq('key', 'AI_CRM_PROMPT').single().then(({ data }) => {
      if (data) setAiPrompt(data.value);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Canal único para o container para evitar conflitos
    const channelName = `crm_container_${currentUserId}`;
    console.log(`[CRMChatContainer] Inscrevendo no canal: ${channelName}`);

    const messageSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        console.log('[CRMChatContainer] Nova mensagem recebida:', payload.new);
        
        const uid = currentUserIdRef.current;
        const selId = selectedConversationIdRef.current;

        // Só incrementa se a mensagem for para o admin logado
        if (uid && payload.new.receiver_id === uid) {
            const senderId = payload.new.sender_id;
            
            // Se o admin já estiver com o chat aberto, não incrementa (ou zera logo)
            if (selId === senderId) {
                console.log('[CRMChatContainer] Chat aberto, ignorando incremento');
                return;
            }

            setUnreadCounts(prev => ({
                ...prev,
                [senderId]: (prev[senderId] || 0) + 1
            }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'internal_messages' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'internal_messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    // Real-time subscription for profile changes (role updates)
    const profileSubscription = supabase
      .channel('crm_profiles_all')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('[CRMChatContainer] Profile updated:', payload.new);
        fetchConversations();
      })
      .subscribe();

    return () => {
      console.log(`[CRMChatContainer] Desinscrevendo dos canais`);
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(profileSubscription);
    };
  }, [currentUserId]);

  const saveAiPrompt = async () => {
    setIsSavingPrompt(true);
    
    // Check if exists
    const { data: existing } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_PROMPT').maybeSingle();
    
    let error;
    if (existing) {
        const res = await supabase.from('settings').update({ value: aiPrompt }).eq('key', 'AI_CRM_PROMPT');
        error = res.error;
    } else {
        const res = await supabase.from('settings').insert({ key: 'AI_CRM_PROMPT', value: aiPrompt });
        error = res.error;
    }

    if (error) {
        console.error('Erro ao salvar prompt:', error);
        alert(`Erro ao salvar prompt: ${error.message}`);
    } else {
        alert('Prompt salvo com sucesso!');
    }
    setIsSavingPrompt(false);
    setShowAiRules(false);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl border border-slate-200 overflow-hidden w-full">
      {/* Buyer List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 font-bold flex justify-between items-center shrink-0">
            Conversas
            <button 
                onClick={() => setShowAiRules(true)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
                title="Configurar Memória IA"
            >
                <Bot className="w-5 h-5" />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
            <div 
                key={conv.id} 
                onClick={() => {
                    setSelectedConversationId(conv.id);
                    // Zera visualmente IMEDIATAMENTE
                    setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 })); 
                }}
                className={`p-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${selectedConversationId === conv.id ? 'bg-slate-100' : ''}`}
                style={{ height: '48px' }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {conv.avatar_url ? (
                        <img src={conv.avatar_url} alt={conv.full_name} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                            {conv.full_name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div className="truncate">
                        <div className="font-bold text-sm truncate">{conv.full_name || 'Sem nome'}</div>
                    </div>
                </div>
                {unreadCounts[conv.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCounts[conv.id]}
                    </span>
                )}
            </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversationId ? (
          <AdminSalesChat 
            conversationId={selectedConversationId} 
            role={role} 
            onMessageRead={fetchConversations} // Passa a função para atualizar contadores
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Selecione uma conversa
          </div>
        )}
      </div>

      {/* IA Rules Modal */}
      {showAiRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[50vw] max-w-none shadow-xl">
            <h4 className="font-bold mb-4 text-lg">Configurar Memória IA</h4>
            <textarea 
              className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm mb-4"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Cole aqui as regras e memória para a IA..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiRules(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
              <button onClick={saveAiPrompt} disabled={isSavingPrompt} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
                {isSavingPrompt ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
