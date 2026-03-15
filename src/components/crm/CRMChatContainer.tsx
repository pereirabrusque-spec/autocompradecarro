import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSalesChat } from './AdminSalesChat';
import { MessageCircle } from 'lucide-react';

export const CRMChatContainer = ({ role }: { role: string }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .in('role', ['buyer', 'buyer_premium', 'buyer_master'])
        .order('created_at', { ascending: false });
      setConversations(data || []);
      
      // Fetch unread counts
      if (data) {
        const counts: Record<string, number> = {};
        for (const conv of data) {
          const { count } = await supabase
            .from('internal_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', conv.id)
            .is('receiver_id', null)
            .eq('is_read', false);
          counts[conv.id] = count || 0;
        }
        setUnreadCounts(counts);
      }
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
            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${selectedConversationId === conv.id ? 'bg-slate-100' : ''}`}
          >
            <div>
                <div className="font-bold">{conv.full_name || 'Sem nome'}</div>
                <div className="text-xs text-slate-500">{conv.phone || 'Sem telefone'}</div>
            </div>
            {unreadCounts[conv.id] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCounts[conv.id]}
                </span>
            )}
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
