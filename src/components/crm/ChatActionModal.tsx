import React, { useState, useEffect } from 'react';
import { X, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadDetailsCard from '../LeadDetailsCard';

interface ChatActionModalProps {
  type: 'proposta' | 'formulario' | 'clonar';
  conversationId: string;
  lead: any;
  onClose: () => void;
  onOpenLead?: (lead: any) => void;
  onCloneLead?: (lead: any) => void;
}

export const ChatActionModal: React.FC<ChatActionModalProps> = ({ type, conversationId, lead, onClose, onOpenLead, onCloneLead }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({ fipeRules: [], jurosAtraso: 0, banks: [], cooperativeDiscount: 0 });
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  useEffect(() => {
    console.log('[ChatActionModal] Estado de vehicles atualizado:', vehicles.length, vehicles);
  }, [vehicles]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const [fipeRules, jurosAtraso, banks, configData] = await Promise.all([
          supabase.from('fipe_rules').select('*'),
          supabase.from('settings').select('value').eq('key', 'juros_atraso').single(),
          supabase.from('banks').select('*'),
          supabase.from('settings').select('value').eq('key', 'cooperative_discount').single()
        ]);
        
        setConfig({
          fipeRules: fipeRules.data || [],
          jurosAtraso: Number(jurosAtraso.data?.value) || 0,
          banks: banks.data || [],
          cooperativeDiscount: Number(configData.data?.value) || 0
        });

        if (type === 'proposta' || type === 'clonar') {
          const allLeadIds = new Set<string>();
          
          // 1. Leads from internal_messages (primary source for "vehicles in conversation")
          const { data: msgsWithLeads } = await supabase
            .from('internal_messages')
            .select('lead_id')
            .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
            .not('lead_id', 'is', null);
          
          msgsWithLeads?.forEach(m => {
            if (m.lead_id) allLeadIds.add(m.lead_id);
          });

          // 2. Fallback: If conversationId itself is a lead_id
          const { data: leadById } = await supabase
            .from('leads_veiculos')
            .select('id')
            .eq('id', conversationId);
          leadById?.forEach(l => allLeadIds.add(l.id));

          if (allLeadIds.size > 0) {
            const { data: finalLeads, error: fetchError } = await supabase
              .from('leads_veiculos')
              .select('*')
              .in('id', Array.from(allLeadIds));
            
            if (finalLeads) {
              const enrichedData = finalLeads.map(v => ({
                ...v,
                marca: v.marca || 'N/A',
                modelo: v.modelo || 'N/A',
                ano_fabricacao: v.ano_fabricacao || 'N/A'
              }));
              setVehicles(enrichedData);
              
              if (enrichedData.length === 1) {
                console.log('[ChatActionModal] Apenas um veículo encontrado na conversa, auto-selecionando...');
                setSelectedVehicle(enrichedData[0]);
              }
            } else if (fetchError) {
              console.error('Erro ao buscar veículos:', fetchError);
            }
          } else {
            setVehicles([]);
          }
        }
      } catch (err) {
        console.error('Erro no fetchData:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, conversationId]);

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    const { error } = await supabase.from('leads_veiculos').delete().eq('id', vehicleId);
    if (error) alert('Erro ao excluir: ' + error.message);
    else {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      alert('Veículo excluído com sucesso!');
    }
  };

  const handleSave = async (updatedLead: any) => {
    const { error } = await supabase
      .from('leads_veiculos')
      .update(updatedLead)
      .eq('id', updatedLead.id);
    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      alert('Alterações salvas com sucesso!');
      if (type === 'proposta') {
        setVehicles(vehicles.map(v => v.id === updatedLead.id ? updatedLead : v));
        setSelectedVehicle(updatedLead);
      }
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    const { error } = await supabase.from('leads_veiculos').delete().eq('id', leadId);
    if (error) alert('Erro ao excluir: ' + error.message);
    else {
      alert('Excluído com sucesso!');
      onClose();
    }
  };

  const handleRefresh = async () => {
    // Re-fetch data
    const [fipeRules, jurosAtraso, banks, configData] = await Promise.all([
      supabase.from('fipe_rules').select('*'),
      supabase.from('settings').select('value').eq('key', 'juros_atraso').single(),
      supabase.from('banks').select('*'),
      supabase.from('settings').select('value').eq('key', 'cooperative_discount').single()
    ]);
    
    setConfig({
      fipeRules: fipeRules.data || [],
      jurosAtraso: Number(jurosAtraso.data?.value) || 0,
      banks: banks.data || [],
      cooperativeDiscount: Number(configData.data?.value) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {type === 'proposta' ? 'Veículos do Usuário' : type === 'clonar' ? 'Clonar Negociação' : 'Detalhes do Lead'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>

        {loading ? <p>Carregando...</p> : (
            <>
                {(type === 'proposta' || type === 'clonar') && !selectedVehicle && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-900 font-bold">
                        {type === 'clonar' ? 'Escolha o Veículo para Clonar' : 'Veículos Interessados'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {type === 'clonar' 
                          ? 'Selecione qual veículo deste cliente você deseja clonar para uma nova negociação:' 
                          : 'Este cliente possui múltiplos veículos cadastrados. Selecione um para negociar:'}
                      </p>
                    </div>
                    
                    {vehicles.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Nenhum veículo encontrado para este lead.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map(v => {
                          const vehicleWithMedia = {
                            ...v,
                            marca: v.marca || (v.veiculo ? v.veiculo.split(' ')[0] : 'N/A'),
                            modelo: v.modelo || (v.veiculo ? v.veiculo.split(' ').slice(1).join(' ') : 'N/A'),
                            ano_fabricacao: v.ano_fabricacao || v.ano_modelo || 'N/A',
                            ano_modelo: v.ano_modelo || 'N/A',
                            cor: v.cor || 'N/A',
                            valor_fipe: v.valor_fipe || 0,
                            preco_cliente: v.preco_cliente || 0,
                            fotos: v.fotos_url || (Array.isArray(v.fotos) ? v.fotos : (v.fotos ? [v.fotos] : [])),
                            videos: Array.isArray(v.videos) ? v.videos : (v.videos ? [v.videos] : [])
                          };

                          return (
                            <div 
                              key={v.id} 
                              className="group relative bg-white border border-slate-200 rounded-[24px] overflow-hidden hover:border-accent hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                              onClick={() => {
                                if (type === 'clonar' && onCloneLead) {
                                  onCloneLead(vehicleWithMedia);
                                  onClose();
                                } else if (onOpenLead) {
                                  onOpenLead(vehicleWithMedia);
                                  onClose();
                                } else {
                                  setSelectedVehicle(vehicleWithMedia);
                                }
                              }}
                            >
                              <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                                {(v.foto_principal || (vehicleWithMedia.fotos && vehicleWithMedia.fotos.length > 0)) ? (
                                  <img 
                                    src={v.foto_principal || vehicleWithMedia.fotos[0]} 
                                    alt={`${v.marca} ${v.modelo}`} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Sem Foto</span>
                                  </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const isReserved = v.status === 'reservado';
                                      const confirmMsg = isReserved 
                                        ? 'Deseja remover a reserva deste veículo? Ele voltará a ficar visível no estoque.' 
                                        : 'Deseja reservar este veículo? Ele ficará invisível no estoque por 24 horas.';
                                      
                                      if (!confirm(confirmMsg)) return;
                                      
                                      const { error } = await supabase
                                        .from('leads_veiculos')
                                        .update({ 
                                          status: isReserved ? 'novo' : 'reservado', 
                                          reserva_timestamp: isReserved ? null : new Date().toISOString() 
                                        })
                                        .eq('id', v.id);
                                      
                                      if (error) alert('Erro ao processar reserva: ' + error.message);
                                      else {
                                        alert(isReserved ? 'Reserva removida com sucesso!' : 'Veículo reservado com sucesso!');
                                        // Refresh vehicles list
                                        const updatedVehicles = vehicles.map(veh => 
                                          veh.id === v.id ? { ...veh, status: isReserved ? 'novo' : 'reservado' } : veh
                                        );
                                        setVehicles(updatedVehicles);
                                      }
                                    }}
                                    className={`p-2 rounded-xl backdrop-blur-md transition-all shadow-lg ${v.status === 'reservado' ? 'bg-emerald-500 text-white' : 'bg-white/90 text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                                    title={v.status === 'reservado' ? 'Já Reservado' : 'Reservar Veículo'}
                                  >
                                    {v.status === 'reservado' ? <Clock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                  </button>
                                </div>
                                <div className="absolute top-3 left-3 flex gap-2">
                                  <span className="px-2 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                                    #{v.vehicle_code || '----'}
                                  </span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteVehicle(v.id);
                                  }} 
                                  className="absolute top-3 right-3 p-2 bg-red-500/90 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 shadow-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                                <div>
                                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight line-clamp-2">
                                    {v.marca || v.modelo ? `${v.marca || ''} ${v.modelo || ''}` : (v.veiculo ? v.veiculo : 'Veículo sem identificação')}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ano</span>
                                      <span className="text-xs font-bold text-slate-700">{v.ano_fabricacao || v.ano_modelo || 'N/A'}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cor</span>
                                      <span className="text-xs font-bold text-slate-700">{v.cor || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                  <button className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl group-hover:bg-accent transition-colors">
                                    {type === 'clonar' ? 'Clonar Agora' : 'Ver Proposta'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(type === 'proposta' || type === 'clonar') && selectedVehicle && (
                    <div className="space-y-4">
                        <button onClick={() => setSelectedVehicle(null)} className="text-sm text-blue-600 hover:underline mb-4">← Voltar para lista</button>
                        <LeadDetailsCard 
                            lead={selectedVehicle} 
                            onClose={onClose} 
                            onSave={handleSave} 
                            onDelete={handleDelete} 
                            onRefresh={handleRefresh} 
                            onClone={onCloneLead}
                            fipeRules={config.fipeRules} 
                            jurosAtraso={config.jurosAtraso} 
                            banks={config.banks} 
                            cooperativeDiscount={config.cooperativeDiscount} 
                            userRole="admin"
                        />
                    </div>
                )}

                {type === 'formulario' && lead && (
                  <div className="space-y-4">
                    {onOpenLead ? (
                      <div className="text-center p-8">
                        <button 
                          onClick={() => {
                            onOpenLead(lead);
                            onClose();
                          }}
                          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold"
                        >
                          Abrir Detalhes do Lead
                        </button>
                      </div>
                    ) : (
                      <LeadDetailsCard 
                        lead={lead} 
                        onClose={onClose} 
                        onSave={handleSave} 
                        onDelete={handleDelete} 
                        onRefresh={handleRefresh} 
                        onClone={onCloneLead}
                        fipeRules={config.fipeRules} 
                        jurosAtraso={config.jurosAtraso} 
                        banks={config.banks} 
                        cooperativeDiscount={config.cooperativeDiscount} 
                        userRole="admin"
                      />
                    )}
                  </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
