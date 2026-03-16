import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { MessageCircle, Users, Send, Search, Bot, FileText, Check, X, Mail } from 'lucide-react';

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // AI Controls
  const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
  const [aiAutoResponse, setAiAutoResponse] = useState(true);
  const [aiAutoProposal, setAiAutoProposal] = useState(false);
  const [isHumanAttending, setIsHumanAttending] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    // Fetch leads that are 'vendedor' (role 'user')
    const { data, error } = await supabase
        .from('leads_veiculos')
        .select('*, profiles!inner(*)')
        .eq('profiles.role', 'user') // Assuming 'user' role is 'vendedor'
        .order('created_at', { ascending: false });
    
    if (data) {
        // Fetch unread counts for these leads
        const conversationsWithUnread = await Promise.all(data.map(async (lead) => {
            const { count } = await supabase
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('lead_id', lead.id)
                .eq('is_read', false);
            return { ...lead, unreadCount: count || 0 };
        }));
        setConversations(conversationsWithUnread);
    }
  };

  const fetchMessagesForConversation = async (conversationId: string) => {
    // Logic to fetch messages based on conversationId
    // ...
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;
    // Logic to send message
    // ...
  };

  return (
    <div className="flex h-[700px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Leads (Vendedores)</h2>
          
          {/* AI Controls in Sidebar */}
          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
             <label className="flex items-center justify-between text-xs font-bold">
                IA Global
                <input type="checkbox" checked={globalAiEnabled} onChange={() => setGlobalAiEnabled(!globalAiEnabled)} />
             </label>
             <label className="flex items-center justify-between text-xs font-bold">
                Modo Auto Proposta
                <input type="checkbox" checked={aiAutoProposal} onChange={() => setAiAutoProposal(!aiAutoProposal)} />
             </label>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(conversations || []).map((conv) => (
            <div key={conv.id} onClick={() => setSelectedConversation(conv)} className="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">{conv.sender_id || 'Lead'}</h4>
                <p className="text-xs text-slate-500 truncate">{conv.content || conv.conteudo}</p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{conv.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedConversation ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-bold">{selectedConversation.sender_id || 'Lead'}</span>
              </div>
              <div className="flex gap-2 items-center">
                <button 
                    onClick={() => setIsHumanAttending(!isHumanAttending)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${isHumanAttending ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                    {isHumanAttending ? 'Humano Respondendo' : 'Atendimento Humano'}
                </button>
                <button className="p-2 text-slate-500 hover:text-slate-900"><Mail className="w-4 h-4" /></button>
                <button className="p-2 text-slate-500 hover:text-slate-900"><MessageCircle className="w-4 h-4" /></button>
                <button 
                    onClick={() => setIsLearning(!isLearning)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${isLearning ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
                >
                    {isLearning ? 'IA: Aprendendo...' : 'IA: Aprender'}
                </button>
                <button onClick={() => setShowProposalModal(true)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-200">$ Ver Proposta</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Messages... */}
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
          <div className="flex-1 flex items-center justify-center text-slate-400">Selecione uma conversa</div>
        )}
      </div>

      {/* Proposal Modal - Safe rendering */}
      {showProposalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Proposta</h3>
            <p>Conteúdo da proposta...</p>
            <button onClick={() => setShowProposalModal(false)} className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
