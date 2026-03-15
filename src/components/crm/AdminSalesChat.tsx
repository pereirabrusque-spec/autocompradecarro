import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, User, MessageCircle } from 'lucide-react';

export const AdminSalesChat = ({ conversationId, role }: { conversationId: string, role: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showAiRules, setShowAiRules] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    
    // Load existing prompt
    supabase.from('settings').select('value').eq('key', 'AI_CRM_PROMPT').single().then(({ data }) => {
      if (data) setAiPrompt(data.value);
    });
  }, []);

  const saveAiPrompt = async () => {
    setIsSavingPrompt(true);
    const { error } = await supabase.from('settings').upsert({ key: 'AI_CRM_PROMPT', value: aiPrompt });
    if (error) alert('Erro ao salvar prompt');
    else alert('Prompt salvo com sucesso!');
    setIsSavingPrompt(false);
    setShowAiRules(false);
  };

  const logWhatsAppUsage = () => {
    console.log('WhatsApp usage logged');
  };

  useEffect(() => {
    // Fetch messages for this CRM chat
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('internal_messages')
        .select('*, profiles(full_name, avatar_url)')
        .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('sender_id', conversationId)
        .is('is_read', false);
    };
    
    const fetchUserData = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('phone, email, avatar_url')
          .eq('id', conversationId)
          .single();
        if (data) {
            setUserPhone(data.phone);
            setUserEmail(data.email);
            setUserAvatar(data.avatar_url);
        }
        else console.error('Error fetching user data: No data found for ID', conversationId);
    };

    fetchMessages();
    fetchUserData();

    // Real-time subscription
    const subscription = supabase
      .channel(`crm_chat_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        if (payload.new.sender_id === conversationId || payload.new.receiver_id === conversationId) {
          setMessages(prev => [...prev, payload.new]);
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
          <button 
            onClick={() => setShowAiRules(!showAiRules)}
            className={`p-2 rounded-full hover:bg-slate-100 ${showAiRules ? 'text-blue-600' : 'text-slate-600'}`}
          >
            <Bot className="w-4 h-4" />
          </button>
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
      
      {showAiRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h4 className="font-bold mb-4 text-lg">Configurar IA de Atendimento</h4>
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
    </div>
  );
};
