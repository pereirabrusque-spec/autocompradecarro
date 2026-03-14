import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, User, MessageCircle } from 'lucide-react';

export const AdminSalesChat = ({ conversationId, role }: { conversationId: string, role: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [showAiRules, setShowAiRules] = useState(false);

  useEffect(() => {
    // Fetch messages for this CRM chat
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('crm_sales_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    
    const fetchUserPhone = async () => {
        const { data } = await supabase
          .from('interested_buyers')
          .select('telefone')
          .eq('id', conversationId)
          .single();
        if (data) setUserPhone(data.telefone);
    };

    fetchMessages();
    fetchUserPhone();

    // Real-time subscription
    const subscription = supabase
      .channel(`crm_chat_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_sales_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const logWhatsAppUsage = async () => {
    await supabase.from('whatsapp_logs').insert({
      buyer_id: conversationId,
      timestamp: new Date().toISOString()
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Save to DB
    await supabase.from('crm_sales_messages').insert({
      conversation_id: conversationId,
      content: input,
      sender_type: isAiMode ? 'ai' : 'human',
      sender_id: 'admin'
    });
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold">Chat de Vendas</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAiRules(true)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
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
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
          <h4 className="font-bold mb-1">Regras da IA:</h4>
          <p>Memória: ...</p>
          <button onClick={() => setShowAiRules(false)} className="mt-2 text-blue-600 font-bold">Fechar</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_type === 'human' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm max-w-[80%] ${m.sender_type === 'human' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
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
