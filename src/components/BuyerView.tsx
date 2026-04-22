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
      } else if (data && (data.notifications_enabled === null || data.notifications_enabled === false)) {
        // Force enable
        await supabase
          .from('interested_buyers')
          .update({ notifications_enabled: true })
          .eq('email', user.email);
        
        // Send system message
        await supabase.from('internal_messages').insert({
          receiver_id: user.id, 
          content: 'Notificações ativadas com sucesso!',
          sender_id: user.id, // Enviando como se fosse o sistema para o próprio usuário
          is_read: false
        });
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
      // Filtro profissional: Somente veículos com formulário completo (fotos, situação, dados bancários, etc)
      const { data, error } = await supabase
        .from('leads_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filteredLeads = (data || []).filter(lead => {
        // Critérios de formulário preenchido:
        const hasPhotos = lead.fotos && Array.isArray(lead.fotos) && lead.fotos.length > 0;
        const hasClassification = (!!lead.classificacao && lead.classificacao !== 'Não informado') || lead.status === 'novo' || lead.status === 'proposta_enviada';
        const hasBankInfo = (!!lead.banco_financiamento && lead.banco_financiamento !== 'Não informado') || lead.status === 'proposta_enviada';
        const hasBasicData = lead.valor_fipe > 0 && lead.quilometragem > 0;
        
        // Verifica se está reservado e se o tempo de reserva expirou (24 horas)
        const reservaTimestamp = lead.detalhes_proposta?.reserva_timestamp || lead.reserva_timestamp;
        if (lead.status === 'reservado' && reservaTimestamp) {
          const reservaTime = new Date(reservaTimestamp).getTime();
          const now = new Date().getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (now - reservaTime > twentyFourHours) {
            // Reserva expirou, volta para o estoque (proposta_enviada)
            const updatedDetalhes = { ...(lead.detalhes_proposta || {}) };
            delete updatedDetalhes.reserva_timestamp;

            supabase.from('leads_veiculos')
              .update({ 
                status: 'proposta_enviada', 
                reserva_timestamp: null,
                detalhes_proposta: updatedDetalhes
              })
              .eq('id', lead.id)
              .then(() => console.log(`[BuyerView] Reserva expirada revertida para lead: ${lead.id}`));
            
            // Como a atualização é assíncrona, vamos permitir que este lead apareça agora mesmo no estado local
            // se ele atender aos outros critérios
            return hasPhotos && hasClassification && hasBankInfo && hasBasicData;
          }
          return false; // Ainda reservado e dentro do prazo
        }

        // O veículo só aparece se não estiver fechado ou reservado
        return hasPhotos && hasClassification && hasBankInfo && hasBasicData && lead.status !== 'fechado' && lead.status !== 'reservado';
      });

      setAuthorizedLeads(filteredLeads);
    } catch (error) {
      console.error('Error fetching authorized leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <button onClick={() => setIsChatOpen(true)} className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto">
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
        hideFloatingButton={true}
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
