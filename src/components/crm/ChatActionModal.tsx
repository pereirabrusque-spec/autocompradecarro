import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadDetailsCard from '../LeadDetailsCard';

interface ChatActionModalProps {
  type: 'proposta' | 'formulario';
  conversationId: string;
  lead: any;
  onClose: () => void;
}

export const ChatActionModal: React.FC<ChatActionModalProps> = ({ type, conversationId, lead, onClose }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({ fipeRules: [], jurosAtraso: 0, banks: [], cooperativeDiscount: 0 });
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (type === 'proposta') {
        const { data, error } = await supabase
          .from('leads_veiculos')
          .select('*')
          .eq('user_id', conversationId);
        if (data) setVehicles(data);
      } else if (type === 'formulario') {
        // Fetch config data
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
                    {vehicles.map(v => (
                      <div key={v.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg">
                        <div className="cursor-pointer hover:text-blue-600" onClick={() => setSelectedVehicle(v)}>
                          <span>{v.marca} {v.modelo} - {v.ano_modelo}</span>
                        </div>
                        <button onClick={() => handleDeleteVehicle(v.id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {type === 'proposta' && selectedVehicle && (
                    <div className="space-y-4">
                        <button onClick={() => setSelectedVehicle(null)} className="text-sm text-blue-600 hover:underline mb-4">← Voltar para lista</button>
                        <LeadDetailsCard 
                            lead={selectedVehicle} 
                            onClose={onClose} 
                            onSave={() => {}} 
                            onDelete={() => {}} 
                            onRefresh={() => {}} 
                            fipeRules={config.fipeRules} 
                            jurosAtraso={config.jurosAtraso} 
                            banks={config.banks} 
                            cooperativeDiscount={config.cooperativeDiscount} 
                            userRole="admin"
                        />
                    </div>
                )}

                {type === 'formulario' && lead && (
                  <LeadDetailsCard 
                    lead={lead} 
                    onClose={onClose} 
                    onSave={() => {}} 
                    onDelete={() => {}} 
                    onRefresh={() => {}} 
                    fipeRules={config.fipeRules} 
                    jurosAtraso={config.jurosAtraso} 
                    banks={config.banks} 
                    cooperativeDiscount={config.cooperativeDiscount} 
                    userRole="admin"
                  />
                )}
            </>
        )}
      </div>
    </div>
  );
};
