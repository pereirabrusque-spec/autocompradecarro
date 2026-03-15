import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, User, MessageCircle } from 'lucide-react';

export const AdminSalesChat = ({ conversationId, role }: { conversationId: string, role: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'config'>('chat');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('Você é um assistente de vendas especializado. Seu objetivo é orientar o comprador a fazer a melhor proposta possível para garantir o fechamento da venda. Seja persuasivo, profissional e foque nos benefícios do veículo. Se o comprador estiver indeciso, destaque os diferenciais do veículo e a oportunidade de negócio. Nunca perca uma venda por falta de negociação.');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    
    // Load existing prompt
    supabase.from('settings').select('value').eq('key', 'AI_CRM_PROMPT').single().then(({ data }) => {
      if (data && data.value) setAiPrompt(data.value);
    });
  }, []);

  const saveAiPrompt = async () => {
    setIsSavingPrompt(true);
    const { error } = await supabase.from('settings').upsert({ key: 'AI_CRM_PROMPT', value: aiPrompt });
    if (error) alert('Erro ao salvar prompt');
    else alert('Prompt salvo com sucesso!');
    setIsSavingPrompt(false);
  };

  const logWhatsAppUsage = () => {
    console.log('WhatsApp usage logged');
  };

  useEffect(() => {
    // Fetch messages for this CRM chat
    const fetchMessages = async () => {
      console.log('[AdminSalesChat] Fetching messages for conversationId:', conversationId);
      // Busca mensagens onde o remetente ou destinatário é o conversationId, 
      // ou mensagens enviadas para o admin (receiver_id is null) pelo conversationId
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*, profiles:sender_id(full_name, avatar_url)')
        .or(`and(sender_id.eq.${conversationId},receiver_id.is.null),and(sender_id.eq.${conversationId},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${conversationId})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('[AdminSalesChat] Error fetching messages:', error);
      } else {
        console.log('[AdminSalesChat] Messages fetched:', data);
        setMessages(data || []);
      }
      
      // Mark messages as read
      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('sender_id', conversationId)
        .is('is_read', false);
    };
    
    const fetchUserData = async () => {
        console.log('[AdminSalesChat] Fetching user data for conversationId:', conversationId);
        const { data, error } = await supabase
          .from('profiles')
          .select('phone, email, avatar_url')
          .eq('id', conversationId)
          .single();
        if (data) {
            console.log('[AdminSalesChat] User data fetched:', data);
            setUserPhone(data.phone);
            setUserEmail(data.email);
            setUserAvatar(data.avatar_url);
        }
        else console.error('[AdminSalesChat] Error fetching user data: No data found for ID', conversationId, error);
    };

    fetchMessages();
    fetchUserData();

    // Real-time subscription
    const subscription = supabase
      .channel(`crm_chat_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        const msg = payload.new;
        // Verifica se a mensagem é relevante para esta conversa
        const isRelevant = 
          (msg.sender_id === conversationId && (msg.receiver_id === null || msg.receiver_id === conversationId || msg.receiver_id === currentUserId)) ||
          (msg.sender_id === currentUserId && msg.receiver_id === conversationId);
        
        if (isRelevant) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save to DB
    const { error } = await supabase.from('internal_messages').insert({
      receiver_id: conversationId,
      content: input,
      sender_id: user.id,
      is_read: true // Admin messages are read
    });
    
    if (error) console.error('Error sending message:', error);
    else setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
            {userAvatar && <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full" />}
            <div>
                <h3 className="font-bold">Chat de Vendas</h3>
                <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
        </div>
        <div className="flex gap-2">
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
          <button 
            onClick={() => setIsAiMode(!isAiMode)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${isAiMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
          >
            {isAiMode ? 'IA Ativa' : 'Humano Ativo'}
          </button>
        </div>
      </div>
      
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 p-3 text-sm font-bold ${activeTab === 'chat' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`}
        >
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex-1 p-3 text-sm font-bold ${activeTab === 'config' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`}
        >
          Configuração IA
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="flex-1 p-6 space-y-4">
          <h4 className="font-bold text-lg">Regras e Memória do Agente</h4>
          <textarea 
            className="w-full h-64 p-4 border border-slate-200 rounded-xl text-sm"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Cole aqui as regras e memória para a IA..."
          />
          <button 
            onClick={saveAiPrompt} 
            disabled={isSavingPrompt} 
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            {isSavingPrompt ? 'Salvando...' : 'Salvar Regras'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_id === currentUserId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Digite..."
            />
            <button onClick={sendMessage} className="bg-slate-900 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
          </div>
        </>
      )}
    </div>
  );
};
