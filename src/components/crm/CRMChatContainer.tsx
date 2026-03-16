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
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isUpdatingAi, setIsUpdatingAi] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const isAiEnabledRef = useRef(false);
  const aiPromptRef = useRef('');
  const lastProcessedImage = useRef<{ url: string, base64: string } | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    isAiEnabledRef.current = isAiEnabled;
  }, [isAiEnabled]);

  useEffect(() => {
    aiPromptRef.current = aiPrompt;
  }, [aiPrompt]);

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

    // Load existing prompt and AI status
    supabase.from('settings').select('key, value').in('key', ['AI_CRM_PROMPT', 'AI_CRM_ENABLED']).then(({ data }) => {
      if (data) {
          const prompt = data.find(s => s.key === 'AI_CRM_PROMPT');
          const enabled = data.find(s => s.key === 'AI_CRM_ENABLED');
          if (prompt) setAiPrompt(prompt.value);
          if (enabled) setIsAiEnabled(enabled.value === 'true');
      }
    });

    // Real-time listener for settings changes
    const settingsSubscription = supabase
      .channel('crm_settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings' 
      }, (payload) => {
        if (payload.new && (payload.new as any).key) {
          const { key, value } = payload.new as any;
          if (key === 'AI_CRM_PROMPT') {
            console.log('[CRMChatContainer] Prompt IA atualizado via Realtime');
            setAiPrompt(value);
          }
          if (key === 'AI_CRM_ENABLED') {
            const enabled = value === 'true';
            console.log('[CRMChatContainer] Modo IA atualizado via Realtime:', enabled);
            setIsAiEnabled(enabled);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSubscription);
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Canal único para o container para evitar conflitos
    const channelName = `crm_global_messages_${currentUserId}`;
    console.log(`[CRMChatContainer] Inscrevendo no canal: ${channelName}`);

    const messageSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages' 
      }, async (payload) => {
        console.log('[CRMChatContainer] Nova mensagem recebida:', payload.new);
        
        const uid = currentUserIdRef.current;
        const selId = selectedConversationIdRef.current;

        // Só processa se a mensagem for para o admin logado (receiver_id === uid ou null)
        const isForMe = payload.new.receiver_id === uid || (!payload.new.receiver_id && uid);
        
        if (isForMe) {
            const senderId = payload.new.sender_id;
                      // Incrementa contador se não for o chat aberto
            if (selId !== senderId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
            }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'internal_messages' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'internal_messages' }, () => {
        fetchConversations();
      })
      .subscribe((status) => {
        console.log(`[CRMChatContainer] Status da inscrição (${channelName}):`, status);
      });

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

  const toggleGlobalAi = async () => {
    setIsUpdatingAi(true);
    const newValue = !isAiEnabled;
    try {
      const { data: existing } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_ENABLED').maybeSingle();
      if (existing) {
        await supabase.from('settings').update({ value: newValue.toString() }).eq('key', 'AI_CRM_ENABLED');
      } else {
        await supabase.from('settings').insert({ key: 'AI_CRM_ENABLED', value: newValue.toString() });
      }
      setIsAiEnabled(newValue);
    } catch (e) {
      console.error('Error toggling AI:', e);
    } finally {
      setIsUpdatingAi(false);
    }
  };

  const saveAiPrompt = async () => {
    setIsSavingPrompt(true);
    
    try {
        // Save prompt
        const { data: existingPrompt } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_PROMPT').maybeSingle();
        if (existingPrompt) {
            await supabase.from('settings').update({ value: aiPrompt }).eq('key', 'AI_CRM_PROMPT');
        } else {
            await supabase.from('settings').insert({ key: 'AI_CRM_PROMPT', value: aiPrompt });
        }

        // Save enabled status
        const { data: existingEnabled } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_ENABLED').maybeSingle();
        if (existingEnabled) {
            await supabase.from('settings').update({ value: isAiEnabled.toString() }).eq('key', 'AI_CRM_ENABLED');
        } else {
            await supabase.from('settings').insert({ key: 'AI_CRM_ENABLED', value: isAiEnabled.toString() });
        }

        alert('Configurações da IA salvas com sucesso!');
        setShowAiRules(false);
    } catch (error: any) {
        console.error('Erro ao salvar configurações:', error);
        alert(`Erro ao salvar: ${error.message}`);
    } finally {
        setIsSavingPrompt(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl border border-slate-200 overflow-hidden w-full">
      {/* Buyer List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 font-bold flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                Conversas
                <button 
                    onClick={toggleGlobalAi}
                    disabled={isUpdatingAi}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[9px] transition-all ${
                        isAiEnabled 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                    title={isAiEnabled ? 'IA Global Ativa' : 'IA Global Desligada'}
                >
                    <Bot className={`w-3 h-3 ${isAiEnabled ? 'animate-pulse' : ''}`} />
                    <span>{isAiEnabled ? 'IA GLOBAL ON' : 'IA GLOBAL OFF'}</span>
                </button>
            </div>
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
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg">Configurar IA de Vendas</h4>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-slate-600">IA AUTOMÁTICA</span>
                    <button 
                        onClick={() => setIsAiEnabled(!isAiEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${isAiEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAiEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">
                Quando a IA Automática está ligada, ela responderá todos os compradores seguindo as regras abaixo, mesmo que você não esteja com o chat aberto.
            </p>

            <textarea 
              className="w-full h-60 p-3 border border-slate-200 rounded-lg text-sm mb-4 font-mono"
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
