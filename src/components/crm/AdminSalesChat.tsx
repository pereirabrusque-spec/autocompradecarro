import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, User, MessageCircle } from 'lucide-react';

export const AdminSalesChat = ({ conversationId, role, onMessageRead }: { conversationId: string, role: string, onMessageRead: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  
  useEffect(() => {
    // Carrega do banco e do localStorage para persistência imediata
    const savedMode = localStorage.getItem('ai_crm_mode') === 'true';
    setIsAiMode(savedMode);

    supabase.from('settings').select('value').eq('key', 'AI_CRM_MODE').single().then(({ data }) => {
      if (data) {
        const mode = data.value === 'true';
        setIsAiMode(mode);
        localStorage.setItem('ai_crm_mode', mode.toString());
      }
    });
  }, []);

  const toggleAiMode = async (newMode: boolean) => {
    setIsAiMode(newMode);
    localStorage.setItem('ai_crm_mode', newMode.toString());
    await supabase.from('settings').upsert({ key: 'AI_CRM_MODE', value: newMode.toString() });
  };
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showAiRules, setShowAiRules] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
    console.log('Saving AI prompt:', aiPrompt);
    
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
        console.log('Prompt salvo com sucesso');
        alert('Prompt salvo com sucesso!');
    }
    setIsSavingPrompt(false);
    setShowAiRules(false);
  };

  const logWhatsAppUsage = () => {
    console.log('WhatsApp usage logged');
  };

  useEffect(() => {
    // Fetch messages for this CRM chat
    const fetchMessages = async () => {
      console.log('[AdminSalesChat] Fetching messages for conversationId:', conversationId);
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('[AdminSalesChat] Error fetching messages:', error);
      } else {
        console.log('[AdminSalesChat] Messages fetched:', data);
        setMessages(data || []);
      }
      
      // Marca mensagens como lidas
      if (currentUserId) {
        const { error: updateError } = await supabase
          .from('internal_messages')
          .update({ is_read: true })
          .eq('receiver_id', currentUserId)
          .eq('sender_id', conversationId)
          .eq('is_read', false);
        
        if (!updateError) {
            onMessageRead(); // Notifica o container pai para zerar o contador
        } else {
            console.error('Erro ao marcar como lido:', updateError);
        }
      }
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
      .channel('crm_chat_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_messages' }, (payload) => {
        console.log('[AdminSalesChat] Real-time event received:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          if (payload.new.sender_id === conversationId || payload.new.receiver_id === conversationId) {
            setMessages(prev => [...prev, payload.new]);
            
            // Mark as read immediately if it's from the buyer
            if (payload.new.sender_id === conversationId) {
              supabase
                .from('internal_messages')
                .update({ is_read: true })
                .eq('id', payload.new.id)
                .then(() => console.log('[AdminSalesChat] Message marked as read in real-time'));
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          // Refresh messages if an update happened (e.g., message read status changed)
          fetchMessages();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const sendMessage = async () => {
    console.log('[AdminSalesChat] sendMessage called, input:', input);
    if (!input.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[AdminSalesChat] user:', user);
    if (!user) return;

    // Save to DB
    const { data, error } = await supabase.from('internal_messages').insert({
      receiver_id: conversationId,
      content: input,
      sender_id: user.id,
      is_read: true // Admin messages are read
    }).select().single();
    
    if (error) console.error('Error sending message:', error);
    else {
        console.log('[AdminSalesChat] Message sent successfully', data);
        setMessages(prev => [...prev, data]);
        setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
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
            onClick={() => toggleAiMode(!isAiMode)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${isAiMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
          >
            {isAiMode ? 'IA Ativa' : 'Humano Ativo'}
          </button>
        </div>
      </div>
      
      {showAiRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[50vw] max-w-none shadow-xl">
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


      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" ref={chatContainerRef}>
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_id === currentUserId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
          placeholder="Digite..."
        />
        <button onClick={sendMessage} className="bg-slate-900 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
