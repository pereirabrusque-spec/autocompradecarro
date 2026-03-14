import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, User } from 'lucide-react';

export const AdminSalesChat = ({ conversationId, role }: { conversationId: string, role: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);

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
    fetchMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Save to DB
    await supabase.from('crm_sales_messages').insert({
      conversation_id: conversationId,
      content: input,
      sender_type: isAiMode ? 'ai' : 'human',
      sender_id: 'admin' // Should be current user ID
    });
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold">Chat de Vendas</h3>
        <button 
          onClick={() => setIsAiMode(!isAiMode)}
          className={`px-3 py-1 rounded-full text-xs font-bold ${isAiMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
        >
          {isAiMode ? 'IA Ativa' : 'Humano Ativo'}
        </button>
      </div>
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
