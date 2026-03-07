import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { motion } from 'motion/react';
import { 
  Car, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Info, 
  ShieldCheck, 
  LogOut,
  MessageCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import InternalChat from './InternalChat';

export default function BuyerView() {
  const { user, profile, signOut } = useAuth();
  const [authorizedLeads, setAuthorizedLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [permissions, setPermissions] = useState({
    show_price: true,
    show_photos: true,
    show_plate: false,
    show_details: true,
    show_history: false
  });

  useEffect(() => {
    fetchAuthorizedLeads();
    checkNotificationStatus();
    
    // Heartbeat to update last_seen
    const updateLastSeen = async () => {
      if (!user) return;
      await supabase
        .from('interested_buyers')
        .update({ last_seen: new Date().toISOString() })
        .eq('email', user.email);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [user]);

  const checkNotificationStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('interested_buyers')
        .select('notifications_enabled')
        .eq('email', user.email)
        .single();
      
      if (data && data.notifications_enabled === null) {
        setShowNotificationPrompt(true);
      }
    } catch (e) {
      console.error('Error checking notification status:', e);
    }
  };

  const handleAuthorizeNotifications = async (enabled: boolean) => {
    if (!user) return;
    try {
      await supabase
        .from('interested_buyers')
        .update({ notifications_enabled: enabled })
        .eq('email', user.email);
      
      setShowNotificationPrompt(false);
    } catch (e) {
      console.error('Error updating notification status:', e);
    }
  };

  const fetchAuthorizedLeads = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Buscar permissões específicas do usuário
      const { data: userAuth } = await supabase
        .from('buyer_authorizations')
        .select('permissions')
        .eq('user_id', user.id)
        .single();

      if (userAuth && userAuth.permissions) {
        setPermissions(userAuth.permissions);
      } else {
        // Fallback: Buscar permissões globais
        const { data: settingsData } = await supabase
          .from('banners')
          .select('*')
          .eq('key', 'BUYER_VIEW_PERMISSIONS')
          .single();
        
        if (settingsData && settingsData.value) {
          try {
            setPermissions(JSON.parse(settingsData.value));
          } catch (e) {
            console.error('Error parsing global permissions:', e);
          }
        }
      }

      // 2. Buscar leads
      // Assumindo que compradores autorizados podem ver todos os leads, mas com campos restritos pelas permissões
      const { data, error } = await supabase
        .from('leads_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuthorizedLeads(data || []);
    } catch (error) {
      console.error('Error fetching authorized leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Carregando estoque autorizado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Área do Investidor</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Acesso Restrito</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400">{user?.email}</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-display font-bold mb-2 text-slate-900">Estoque Disponível</h2>
          <p className="text-slate-500">Veículos autorizados para sua visualização técnica.</p>
        </div>

        {authorizedLeads.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-slate-100 shadow-sm">
            <Car className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum veículo autorizado</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Você ainda não possui autorizações para visualizar veículos. Entre em contato com o administrador para solicitar acesso ao estoque.
            </p>
            <button className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
              <MessageCircle className="w-5 h-5" />
              Falar com Administrador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authorizedLeads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => {
                  setSelectedLead(lead);
                  setCurrentPhotoIndex(0);
                }}
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  {permissions.show_photos && lead.fotos && lead.fotos[0] ? (
                    <img 
                      src={lead.fotos[0]} 
                      alt={lead.modelo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 flex-col gap-2">
                      <ImageIcon className="w-12 h-12" />
                      {!permissions.show_photos && <span className="text-xs font-bold uppercase">Fotos Restritas</span>}
                    </div>
                  )}
                  {permissions.show_plate && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 rounded-full text-[10px] font-mono font-bold shadow-sm">
                        #{lead.vehicle_code}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{lead.marca} {lead.modelo}</h3>
                  <p className="text-sm text-slate-500 mb-4">{lead.ano_modelo} • {lead.quilometragem}km</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Valor FIPE</p>
                      <p className="text-lg font-black text-slate-900">
                        {permissions.show_price 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)
                          : 'Sob Consulta'
                        }
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLead(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* Fotos (Esquerda) */}
            <div className="w-full md:w-1/2 bg-slate-900 relative flex items-center justify-center">
              {permissions.show_photos && selectedLead.fotos && selectedLead.fotos.length > 0 ? (
                <>
                  <img 
                    src={selectedLead.fotos[currentPhotoIndex]} 
                    alt="Veículo" 
                    className="w-full h-full object-contain"
                  />
                  {selectedLead.fotos.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : selectedLead.fotos.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setCurrentPhotoIndex(prev => (prev < selectedLead.fotos.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedLead.fotos.map((_: any, i: number) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-accent w-6' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-slate-700 flex flex-col items-center">
                  <ImageIcon className="w-20 h-20 mb-4 opacity-20" />
                  <p>{permissions.show_photos ? 'Sem fotos disponíveis' : 'Visualização de fotos restrita'}</p>
                </div>
              )}
            </div>

            {/* Informações (Direita) */}
            <div className="w-full md:w-1/2 p-12 overflow-y-auto bg-white">
              <div className="flex justify-between items-start mb-8">
                <div>
                  {permissions.show_plate && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono font-bold mb-2 inline-block">
                      #{selectedLead.vehicle_code}
                    </span>
                  )}
                  <h2 className="text-4xl font-display font-bold text-slate-900">{selectedLead.marca} {selectedLead.modelo}</h2>
                  <p className="text-slate-500 text-lg">{selectedLead.ano_modelo} • {selectedLead.cor} • {selectedLead.combustivel}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <LogOut className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Car className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Quilometragem</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{selectedLead.quilometragem} km</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Valor FIPE</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {permissions.show_price 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_fipe || 0)
                      : 'Sob Consulta'
                    }
                  </p>
                </div>
              </div>

              {permissions.show_details && (
                <div className="space-y-8 mb-12">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-accent" />
                      Detalhes Técnicos & Situação
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-sm text-slate-500">Situação</span>
                        <span className="text-sm font-bold text-slate-900">{selectedLead.situacao || 'Não informada'}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-sm text-slate-500">Pneus</span>
                        <span className="text-sm font-bold text-slate-900">{selectedLead.pneus || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-sm text-slate-500">Pintura</span>
                        <span className="text-sm font-bold text-slate-900">{selectedLead.pintura || 'Não informada'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLead.observacoes && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Observações Adicionais</h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                        "{selectedLead.observacoes}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200">
                  <FileText className="w-5 h-5" />
                  Solicitar Laudo Técnico
                </button>
                <button className="w-full py-5 bg-accent text-white rounded-[24px] font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-200">
                  <MessageCircle className="w-5 h-5" />
                  Fazer Proposta de Compra
                </button>
              </div>
              
              <p className="text-[10px] text-center text-slate-400 mt-6">
                Este veículo é de repasse direto. Os dados do vendedor são confidenciais.
                Toda negociação é intermediada pela plataforma.
              </p>
            </div>
          </motion.div>
        </div>
      )}
      <InternalChat 
        leadId={selectedLead?.id} 
        leadTitle={selectedLead ? `${selectedLead.marca} ${selectedLead.modelo}` : 'Atendimento Geral'} 
      />

      {/* Notification Prompt Popup */}
      {showNotificationPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Receber Notificações?</h3>
            <p className="text-slate-500 mb-8">
              Deseja receber notificações em tempo real sobre novos leads e oportunidades de investimento?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleAuthorizeNotifications(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Sim, desejo receber
              </button>
              <button 
                onClick={() => handleAuthorizeNotifications(false)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Agora não
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
