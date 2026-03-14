import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSalesChat } from './AdminSalesChat';
import { MessageCircle } from 'lucide-react';

export const CRMChatContainer = ({ role }: { role: string }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('interested_buyers')
        .select('id, cliente_nome, telefone')
        .order('created_at', { ascending: false });
      setConversations(data || []);
    };
    fetchConversations();
  }, []);

  return (
    <div className="flex h-[700px] bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-100 font-bold">Conversas</div>
        {conversations.map(conv => (
          <div 
            key={conv.id} 
            onClick={() => setSelectedConversationId(conv.id)}
            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedConversationId === conv.id ? 'bg-slate-100' : ''}`}
          >
            <div className="font-bold">{conv.cliente_nome}</div>
            <div className="text-xs text-slate-500">{conv.telefone}</div>
          </div>
        ))}
      </div>
      <div className="flex-1">
        {selectedConversationId ? (
          <AdminSalesChat conversationId={selectedConversationId} role={role} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
};
