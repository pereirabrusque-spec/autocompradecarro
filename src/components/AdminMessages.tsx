import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { MessageCircle, User, Users, Send, Search } from 'lucide-react';

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setConversations(data); 
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('internal_messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);
    
    if (error) console.error('Error marking messages as read:', error);
    else fetchConversations(); // Refresh to update unread counts
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const { error } = await supabase.from('internal_messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation.sender_id,
      content: newMessage,
      is_read: true
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      fetchMessagesForConversation(selectedConversation.sender_id);
    }
  };

  const fetchMessagesForConversation = async (senderId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${senderId}),and(sender_id.eq.${senderId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  return (
    <div className="flex h-[700px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Leads</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => {
              setSelectedConversation(conv);
              markAsRead(conv.sender_id);
              fetchMessagesForConversation(conv.sender_id);
            }} className="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50">
              <h4 className="font-bold text-sm">{conv.sender_id}</h4>
              <p className="text-xs text-slate-500 truncate">{conv.content}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedConversation ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 font-bold">
              Conversa com {selectedConversation.sender_id}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.sender_id === user?.id ? 'bg-blue-500 text-white self-end' : 'bg-white text-slate-900 self-start'}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Digite sua mensagem..."
              />
              <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
