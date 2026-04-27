import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { useAssets } from '../lib/assetsContext';
import { motion } from 'motion/react';
import { 
  Car, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Camera,
  Info, 
  ShieldCheck, 
  LogOut,
  MessageCircle,
  FileText,
  DollarSign,
  User
} from 'lucide-react';
import InternalChat from './InternalChat';

const DetailRow = ({ label, value, show = true }: { label: string, value: any, show?: boolean }) => {
  // Verifica nulos, vazios, arrays vazios E a string "Não informado" (case-insensitive)
  if (!show || value === undefined || value === null || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('não informado')) ||
      (Array.isArray(value) && value.length === 0)) return null;
  
  return (
    <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
};

export default function BuyerView() {
  const { user, profile, signOut } = useAuth();
  const { settings } = useAssets();
  const [authorizedLeads, setAuthorizedLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'quitado' | 'as_is' | 'new'>('all');
  const [allProposals, setAllProposals] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [permissions, setPermissions] = useState({
    show_price: false,
    show_photos: true,
    show_plate: false,
    show_details: false,
    show_client_data: false,
    show_history: false,
    send_whatsapp: false
  });

  const buyerSendSettings = settings['BUYER_SEND_SETTINGS'] ? JSON.parse(settings['BUYER_SEND_SETTINGS']) : {};
  const isWhatsAppEnabledInCRM = buyerSendSettings.whatsapp !== false;

  const roleDisplay = {
    buyer: 'Comprador',
    buyer_premium: 'Comprador Premium',
    buyer_master: 'Comprador Master'
  };

  const handleUpgradeRequest = () => {
    alert('Solicitação de upgrade enviada para a equipe administrativa. Entraremos em contato em breve!');
  };

  useEffect(() => {
    fetchAuthorizedLeads();
    checkNotificationStatus();
    
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'WHATSAPP_NUMBER')
        .single();
      if (data) {
        const cleanPhone = data.value.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        setWhatsappNumber(formattedPhone);
      }
    };
    fetchSettings();
    
    // Heartbeat to update last_seen
    const updateLastSeen = async () => {
      if (!user || !user.email) return;
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
    if (!user || !user.email) return;
    try {
      const { data, error } = await supabase
        .from('interested_buyers')
        .select('notifications_enabled')
        .eq('email', user.email)
        .maybeSingle();
      
      if (error) {
        console.error('[BuyerView] Error checking notification status:', error);
      } else if (data && (data.notifications_enabled === null)) {
        // Se ainda não foi perguntado, mostra o prompt
        setShowNotificationPrompt(true);
      }
    } catch (e) {
      console.error('[BuyerView] Exception checking notification status:', e);
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
      // 1. Buscar permissões específicas do usuário (globais, onde lead_id é nulo)
      const { data: userAuth } = await supabase
        .from('buyer_crm_permissions')
        .select('permissions')
        .eq('buyer_id', user.id)
        .is('lead_id', null)
        .maybeSingle();

      if (userAuth && userAuth.permissions) {
        setPermissions(userAuth.permissions);
      } else {
        // Fallback: Definir permissões baseadas no cargo conforme regras solicitadas
        const role = profile?.role;
        if (role === 'buyer') {
          // Comprador: fotos e dados do veículo (básicos)
          setPermissions({ 
            show_photos: true, 
            show_price: false, 
            show_plate: false, 
            show_details: false, 
            show_client_data: false,
            show_history: false, 
            send_whatsapp: false 
          });
        } else if (role === 'buyer_premium') {
          // Comprador Premium: fotos e todos dados do formulário (detalhes técnicos)
          setPermissions({ 
            show_photos: true, 
            show_price: true, 
            show_plate: true, 
            show_details: true, 
            show_client_data: false,
            show_history: true, 
            send_whatsapp: false 
          });
        } else if (role === 'buyer_master') {
          // Comprador Master: tudo inclusive dados do cliente e whatsapp
          setPermissions({ 
            show_photos: true, 
            show_price: true, 
            show_plate: true, 
            show_details: true, 
            show_client_data: true,
            show_history: true, 
            send_whatsapp: true 
          });
        } else {
          setPermissions({ 
            show_photos: true, 
            show_price: true, 
            show_plate: false, 
            show_details: true, 
            show_client_data: false,
            show_history: false, 
            send_whatsapp: false 
          });
        }
      }

      // 2. Buscar leads
      // Filtro profissional: Somente veículos com formulário completo
      const [{ data: leads, error: leadsError }, { data: proposals, error: proposalsError }] = await Promise.all([
        supabase.from('leads_veiculos').select('*').order('created_at', { ascending: false }),
        supabase.from('buyer_proposals').select('*')
      ]);

      if (leadsError) throw leadsError;
      if (proposalsError) {
        console.warn('[BuyerView] Erro ao buscar propostas, continuando sem elas:', proposalsError);
      }

      const freshProposals = proposals || [];
      setAllProposals(freshProposals);

      const analyzedLeads = (leads || []).filter(lead => {
        // Critérios básicos de formulário para aparecer na vitrine
        const hasPhotos = lead.fotos && Array.isArray(lead.fotos) && lead.fotos.length > 0;
        const hasBasicData = lead.valor_fipe > 0 && lead.quilometragem > 0;
        const isNotClosed = lead.status !== 'fechado' && lead.status !== 'reservado';

        return hasPhotos && hasBasicData && isNotClosed;
      });

      setAuthorizedLeads(analyzedLeads);
    } catch (error) {
      console.error('Error fetching authorized leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredLeads = () => {
    return authorizedLeads.filter(lead => {
      const leadProposals = allProposals.filter(p => p.lead_id === lead.id);
      const hasAsIs = leadProposals.some(p => p.type === 'as_is');
      const hasQuitado = leadProposals.some(p => p.type === 'quitado');
      const hasAnyProposal = hasAsIs || hasQuitado;

      if (activeFilter === 'new') {
        return !hasAnyProposal; // Novos: Sem nenhuma proposta para comprador salva
      }
      if (activeFilter === 'quitado') {
        return hasQuitado;
      }
      if (activeFilter === 'as_is') {
        return hasAsIs;
      }
      
      // Default 'all': Somente os que tem pelo menos uma proposta
      return hasAnyProposal;
    });
  };

  const getLeadPriceDisplay = (lead: any) => {
    const leadProposals = allProposals.filter(p => p.lead_id === lead.id);
    const pAsIs = leadProposals.find(p => p.type === 'as_is');
    const pQuitado = leadProposals.find(p => p.type === 'quitado');

    if (activeFilter === 'quitado' && pQuitado) {
      return pQuitado.proposta_final;
    }
    if (activeFilter === 'as_is' && pAsIs) {
      return pAsIs.proposta_final;
    }
    
    // Se for 'all' ou 'new', ou não tiver o específico, mostra o maior deles ou o que tiver
    return pQuitado?.proposta_final || pAsIs?.proposta_final || 0;
  };

  const filteredLeads = getFilteredLeads();

  useEffect(() => {
    console.log('Permissions:', permissions);
    console.log('Selected Lead:', selectedLead);
  }, [permissions, selectedLead]);

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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {roleDisplay[profile?.role as keyof typeof roleDisplay] || 'Comprador'}
                </span>
                {profile?.role !== 'buyer_master' && (
                  <button onClick={handleUpgradeRequest} className="text-[10px] font-bold text-accent">Upgrade</button>
                )}
              </div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2 text-slate-900">Estoque Disponível</h2>
            <p className="text-slate-500">Veículos autorizados para sua visualização técnica.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[20px] border border-slate-200">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos (Estoque)
            </button>
            <button 
              onClick={() => setActiveFilter('quitado')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeFilter === 'quitado' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Quitados
            </button>
            <button 
              onClick={() => setActiveFilter('as_is')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeFilter === 'as_is' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Como Está
            </button>
            <button 
              onClick={() => setActiveFilter('new')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeFilter === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Novos (Aguardando Precificação)
            </button>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-slate-100 shadow-sm">
            <Car className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum veículo autorizado</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Você ainda não possui autorizações para visualizar veículos. Entre em contato com o administrador para solicitar acesso ao estoque.
            </p>
            <button onClick={() => setIsChatOpen(true)} className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
              <MessageCircle className="w-5 h-5" />
              Falar com Administrador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLeads.map((lead) => (
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
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        {activeFilter === 'new' ? 'Valor FIPE' : 'Valor Repasse'}
                      </p>
                      <p className="text-lg font-black text-slate-900">
                        {permissions.show_price 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeFilter === 'new' ? lead.valor_fipe : getLeadPriceDisplay(lead))
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
            {/* Fotos e Vídeos (Esquerda) */}
            <div className="w-full md:w-1/2 bg-slate-900 relative flex items-center justify-center">
              {permissions.show_photos && ((selectedLead.fotos && selectedLead.fotos.length > 0) || (selectedLead.videos && selectedLead.videos.length > 0)) ? (
                <>
                  {(() => {
                    const mediaItems = [...(selectedLead.fotos || []), ...(selectedLead.videos || [])];
                    const item = mediaItems[currentPhotoIndex];
                    const isVideo = typeof item === 'string' && (item.match(/\.(mp4|webm|ogg)$/i) || item.includes('video'));
                    
                    if (isVideo) {
                      return (
                        <video 
                          src={item} 
                          className="w-full h-full object-contain" 
                          controls 
                          muted={false}
                        />
                      );
                    }
                    return (
                      <img 
                        src={item} 
                        alt="Veículo" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    );
                  })()}
                  
                  {((selectedLead.fotos?.length || 0) + (selectedLead.videos?.length || 0)) > 1 && (
                    <>
                      <button 
                        onClick={() => {
                          const total = (selectedLead.fotos?.length || 0) + (selectedLead.videos?.length || 0);
                          setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : total - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => {
                          const total = (selectedLead.fotos?.length || 0) + (selectedLead.videos?.length || 0);
                          setCurrentPhotoIndex(prev => (prev < total - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {[...(selectedLead.fotos || []), ...(selectedLead.videos || [])].map((_: any, i: number) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-accent w-6' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-slate-700 flex flex-col items-center">
                  <Camera className="w-20 h-20 mb-4 opacity-20" />
                  <p>{permissions.show_photos ? 'Sem mídia disponível' : 'Visualização restrita'}</p>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Valor Repasse</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {permissions.show_price 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getLeadPriceDisplay(selectedLead))
                      : 'Sob Consulta'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {(() => {
                  const props = allProposals.filter(p => p.lead_id === selectedLead.id);
                  const pAsIs = props.find(p => p.type === 'as_is');
                  const pQuitado = props.find(p => p.type === 'quitado');
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pAsIs && (
                        <div className={`p-4 rounded-3xl border-2 transition-all ${activeFilter === 'as_is' ? 'border-accent bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Como Está</p>
                          <p className="text-xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pAsIs.proposta_final || 0)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Com defeitos e problemas relatados</p>
                        </div>
                      )}
                      {pQuitado && (
                        <div className={`p-4 rounded-3xl border-2 transition-all ${activeFilter === 'quitado' ? 'border-accent bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Carro Quitado</p>
                          <p className="text-xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pQuitado.proposta_final || 0)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Negociável com o comprador</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {permissions.show_client_data && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    Dados do Cliente
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <DetailRow label="Nome" value={selectedLead.cliente_nome} />
                    <DetailRow label="Telefone" value={selectedLead.telefone} />
                    <DetailRow label="Email" value={selectedLead.email} />
                  </div>
                </div>
              )}

              {permissions.show_details && (
                <div className="space-y-8 mb-12">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-accent" />
                      Detalhes Técnicos & Situação
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <DetailRow label="Situação" value={selectedLead.classificacao} />
                      <DetailRow label="Pneus" value={selectedLead.estado_pneus} />
                      <DetailRow label="Pintura" value={selectedLead.estado_pintura} />
                      <DetailRow label="Motor" value={selectedLead.motor_reparo} />
                      <DetailRow label="Câmbio" value={selectedLead.cambio_reparo} />
                      <DetailRow label="Lataria" value={selectedLead.batido_reparo} />
                      <DetailRow label="Avarias" value={selectedLead.avarias} />
                      <DetailRow label="Renajud" value={selectedLead.renajud} />
                      <DetailRow label="Recuperado Banco" value={selectedLead.recuperado_banco} />
                      <DetailRow label="Histórico Furto/Roubo" value={selectedLead.historico_furto_roubo} />
                      <DetailRow label="Sinistro" value={selectedLead.tem_sinistro} />
                      <DetailRow label="Leilão" value={selectedLead.passagem_leilao} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      Proposta & Financeiro
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <DetailRow label="Valor FIPE" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_fipe || 0)} />
                      <DetailRow label="Entrada" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.entrada || 0)} />
                      <DetailRow label="Valor Parcela" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_parcela || 0)} />
                      <DetailRow label="Qtd Parcelas" value={selectedLead.total_parcelas} />
                      <DetailRow label="Banco Financiamento" value={selectedLead.banco_financiamento} />
                      <DetailRow label="Multas" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.multas || 0)} />
                    </div>
                  </div>

                  {selectedLead.observacoes && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Observações Adicionais</h4>
                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                        {(selectedLead.observacoes || '').split('.').filter((s: string) => s.trim()).map((s: string, i: number) => (
                          <p key={i} className="mb-1">• {s.trim()}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {whatsappNumber && (permissions?.send_whatsapp || profile?.role === 'buyer_master') && isWhatsAppEnabledInCRM && (
                  <button
                    onClick={() => {
                      const clean = whatsappNumber.replace(/\D/g, '').replace(/^0+/, '');
                      const withPrefix = clean.startsWith('55') ? clean : `55${clean}`;
                      window.open(`https://wa.me/${withPrefix}`, '_blank');
                    }}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 animate-pulse-soft"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Equipe
                  </button>
                )}
                
                {profile?.role === 'buyer_master' && selectedLead.telefone && (
                  <button
                    onClick={() => {
                      const phone = selectedLead.telefone.replace(/\D/g, '');
                      const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
                      const message = `Olá, tenho interesse no seu veículo ${selectedLead.marca} ${selectedLead.modelo} ${selectedLead.ano_modelo}. Podemos conversar?`;
                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 animate-pulse-soft"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Cliente (Proposta)
                  </button>
                )}

                <button onClick={() => setIsChatOpen(true)} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200 animate-pulse-soft">
                  <MessageCircle className="w-5 h-5" />
                  Chat com Equipe
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
        leadTitle={selectedLead ? `[#${selectedLead.vehicle_code}] ${selectedLead.marca} ${selectedLead.modelo} (${selectedLead.ano_modelo}) - ${selectedLead.cor}` : 'Atendimento Geral'} 
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
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
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all animate-pulse-soft"
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
