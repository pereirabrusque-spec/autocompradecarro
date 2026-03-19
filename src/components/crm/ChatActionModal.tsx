import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadDetailsCard from '../LeadDetailsCard';

interface ChatActionModalProps {
  type: 'proposta' | 'formulario';
  conversationId: string;
  lead: any;
  onClose: () => void;
  onOpenLead?: (lead: any) => void;
}

export const ChatActionModal: React.FC<ChatActionModalProps> = ({ type, conversationId, lead, onClose, onOpenLead }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({ fipeRules: [], jurosAtraso: 0, banks: [], cooperativeDiscount: 0 });
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch config data for all types
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

      if (type === 'proposta') {
        // 1. Get email for conversationId
        console.log('Buscando perfil para conversationId:', conversationId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', conversationId)
          .single();
        console.log('Perfil encontrado:', profile);
        
        // 2. Try to fetch by user_id first
        console.log('Buscando veículos por user_id:', conversationId);
        let { data, error } = await supabase
          .from('leads_veiculos')
          .select('*')
          .eq('user_id', conversationId);
        console.log('Veículos encontrados por user_id:', data, 'Erro:', error);
            
        // 2.5 Try to fetch by lead_id (id) if no data found
        if ((!data || data.length === 0)) {
            console.log('Buscando veículos por id (lead_id):', conversationId);
            const { data: dataById, error: errorById } = await supabase
                .from('leads_veiculos')
                .select('*')
                .eq('id', conversationId);
            console.log('Veículos encontrados por id:', dataById, 'Erro:', errorById);
            if (dataById && dataById.length > 0) {
                data = dataById;
                error = errorById;
            }
        }
            
        // 3. Fallback to email if no data found
        if ((!data || data.length === 0) && profile?.email) {
            console.log('Buscando veículos por email:', profile.email);
            const { data: dataByEmail, error: errorByEmail } = await supabase
                .from('leads_veiculos')
                .select('*')
                .eq('email', profile.email);
            console.log('Veículos encontrados por email:', dataByEmail, 'Erro:', errorByEmail);
            data = dataByEmail;
            error = errorByEmail;
        }
        
        if (error) {
          console.error('Erro ao buscar veículos:', error);
          alert('Erro ao buscar veículos: ' + error.message);
        } else if (data) {
          console.log('Veículos carregados (brutos):', data);
          
          // Como a tabela 'leads' não existe ou não é a fonte correta,
          // vamos confiar nos dados que já vieram de 'leads_veiculos'
          // e garantir que eles estejam completos.
          const enrichedData = data.map(v => ({
            ...v,
            marca: v.marca || 'N/A',
            modelo: v.modelo || 'N/A',
            ano_fabricacao: v.ano_fabricacao || 'N/A'
          }));

          console.log('Veículos carregados (processados):', enrichedData);
          setVehicles(enrichedData);
          
          // Se houver apenas um veículo, seleciona automaticamente
          if (enrichedData.length === 1) {
            setSelectedVehicle(enrichedData[0]);
          }
        }
      }
      setLoading(false);
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
          <h2 className="text-xl font-bold">{type === 'proposta' ? 'Veículos do Usuário' : 'Detalhes do Lead'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>

        {loading ? <p>Carregando...</p> : (
            <>
                {type === 'proposta' && !selectedVehicle && (
                  <div className="space-y-4">
                    {vehicles.length === 0 ? (
                      <p className="text-center text-slate-500">Nenhum veículo encontrado para este lead.</p>
                    ) : (
                      vehicles.map(v => {
                        console.log('Vehicle keys:', Object.keys(v));
                        console.log('Vehicle data:', v);
                        return (
                          <div key={v.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => {
                            console.log('Vehicle clicked:', v);
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
                            console.log('Vehicle selected and sanitized:', vehicleWithMedia);
                            
                            if (onOpenLead) {
                              onOpenLead(vehicleWithMedia);
                              onClose();
                            } else {
                              console.log('Setting selectedVehicle:', vehicleWithMedia);
                              setSelectedVehicle(vehicleWithMedia);
                            }
                          }}>
                            <div className="flex items-center gap-4">
                              {v.foto_principal && (
                                <img src={v.foto_principal} alt={`${v.marca} ${v.modelo}`} className="w-16 h-16 object-cover rounded-md" />
                              )}
                              <span className="font-semibold">
                                {v.vehicle_code ? `#${v.vehicle_code} - ` : ''}
                                {v.marca || v.modelo ? `${v.marca || ''} ${v.modelo || ''}` : (v.veiculo ? v.veiculo : 'Veículo sem identificação')} 
                                {v.ano_fabricacao ? ` - ${v.ano_fabricacao}` : (v.ano_modelo ? ` - ${v.ano_modelo}` : '')}
                              </span>
                            </div>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVehicle(v.id);
                            }} className="text-red-500 hover:text-red-700 p-2">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {type === 'proposta' && selectedVehicle && (
                    <div className="space-y-4">
                        <button onClick={() => setSelectedVehicle(null)} className="text-sm text-blue-600 hover:underline mb-4">← Voltar para lista</button>
                        <LeadDetailsCard 
                            lead={selectedVehicle} 
                            onClose={onClose} 
                            onSave={handleSave} 
                            onDelete={handleDelete} 
                            onRefresh={handleRefresh} 
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
