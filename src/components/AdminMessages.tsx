import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { MessageCircle, Users, Send, Search, Bot, FileText, Check, X, Mail } from 'lucide-react';

export default function AdminMessages() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
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

  const [activeTab, setActiveTab] = useState<'leads' | 'equipe'>('leads');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('leads_veiculos').select('*').order('created_at', { ascending: false })
    ]);
    
    if (profilesRes.error) console.error("[DEBUG] Error fetching profiles:", profilesRes.error);
    if (leadsRes.error) console.error("[DEBUG] Error fetching leads:", leadsRes.error);
    
    setProfiles(profilesRes.data || []);
    setLeads(leadsRes.data || []);
  };

  const isEquipe = (p: any) => (p.role || '').toLowerCase().trim() === 'admin' || (p.role || '').toLowerCase().trim() === 'user';

  const filteredConversations = useMemo(() => {
    if (activeTab === 'equipe') {
        // Apenas perfis da equipe
        return profiles.filter(p => isEquipe(p)).map(item => {
            const lastLogin = new Date(item.last_login || item.created_at || 0).getTime();
            const isOnline = (Date.now() - lastLogin) < 5 * 60 * 1000;
            return { 
                ...item, 
                id: item.id, 
                sender_id: item.full_name || item.nome || item.email || 'Usuário', 
                type: 'equipe', 
                unreadCount: 0,
                isOnline,
                statusDisplay: 'Equipe'
            };
        });
    } else {
        // Apenas leads
        return leads.map(item => {
            const lastLogin = new Date(item.last_login || item.created_at || 0).getTime();
            const isOnline = (Date.now() - lastLogin) < 5 * 60 * 1000;
            return { 
                ...item, 
                id: item.id, 
                sender_id: item.nome || item.full_name || item.email || 'Usuário', 
                type: 'leads', 
                unreadCount: 0,
                isOnline,
                statusDisplay: item.status || 'frio'
            };
        });
    }
  }, [activeTab, profiles, leads]);


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
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setActiveTab('leads')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'leads' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Leads
            </button>
            <button 
              onClick={() => setActiveTab('equipe')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'equipe' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Equipe
            </button>
          </div>
          
          {/* AI Controls in Sidebar */}
          {activeTab === 'leads' && (
            <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
              <label className="flex items-center justify-between text-xs font-bold">
                  IA GLOBAL (24h)
                  <input type="checkbox" checked={globalAiEnabled} onChange={() => setGlobalAiEnabled(!globalAiEnabled)} />
              </label>
              <label className="flex items-center justify-between text-xs font-bold">
                  RESPOSTA AUTOMÁTICA
                  <input type="checkbox" checked={aiAutoProposal} onChange={() => setAiAutoProposal(!aiAutoProposal)} />
              </label>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(filteredConversations || []).map((conv) => (
            <div key={conv.id} onClick={() => setSelectedConversation(conv)} className="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {conv.avatar_url ? (
                    <img src={conv.avatar_url} alt={conv.full_name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {conv.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conv.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    {conv.full_name || 'Usuário'}
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase font-bold">{conv.statusDisplay}</span>
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{conv.email || 'Sem email'}</p>
                </div>
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
                <button className="p-2 text-slate-500 hover:text-slate-900" title="Enviar Email"><Mail className="w-4 h-4" /></button>
                <button className="p-2 text-slate-500 hover:text-slate-900" title="WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                
                <button 
                  onClick={() => setIsHumanAttending(!isHumanAttending)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isHumanAttending ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                >
                  {isHumanAttending ? 'Atendimento Humano: ON' : 'Atendimento Humano'}
                </button>

                <button 
                    onClick={() => setIsLearning(!isLearning)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isLearning ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                >
                    {isLearning ? 'IA: Aprendendo...' : 'IA: Aprender'}
                </button>
                <button onClick={() => setShowProposalModal(true)} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold border border-orange-200">$ Ver Proposta</button>
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
