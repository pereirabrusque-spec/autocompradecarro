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

  const fetchConversations = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .in('role', ['buyer', 'buyer_premium', 'buyer_master'])
        .order('created_at', { ascending: false });
      
      if (data) {
        setConversations(data);
        const counts: Record<string, number> = {};
        for (const conv of data) {
          const { count } = await supabase
            .from('internal_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', conv.id)
            .eq('is_read', false); // Apenas não lidas
          counts[conv.id] = count || 0;
        }
        setUnreadCounts(counts);
      }
    };

  useEffect(() => {
    fetchConversations();

    // Load existing prompt
    supabase.from('settings').select('value').eq('key', 'AI_CRM_PROMPT').single().then(({ data }) => {
      if (data) setAiPrompt(data.value);
    });

    // Real-time subscription for new messages
    const messageSubscription = supabase
      .channel('crm_chat_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        console.log('[CRMChatContainer] Event received:', payload.eventType);
        
        // Update unread count locally for the specific conversation
        const senderId = payload.new.sender_id;
        setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
        }));
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
      messageSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, []);

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
