import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditProposalModalProps {
  lead: any;
  onClose: () => void;
  onUpdate: (updatedLead: any) => void;
}

export default function EditProposalModal({ lead, onClose, onUpdate }: EditProposalModalProps) {
  const [formData, setFormData] = useState({
    cliente_nome: lead.cliente_nome || '',
    telefone: lead.telefone || '',
    desired_value: lead.desired_value || '',
    entrada: lead.entrada || '',
    quilometragem: lead.quilometragem || '',
    situacao: lead.situacao || 'normal',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads_veiculos')
        .update({
          cliente_nome: formData.cliente_nome,
          telefone: formData.telefone,
          desired_value: parseFloat(formData.desired_value) || 0,
          entrada: parseFloat(formData.entrada) || 0,
          quilometragem: parseInt(formData.quilometragem) || 0,
          situacao: formData.situacao,
          detalhes_proposta: {
            ...(lead.detalhes_proposta || {}),
            manual_override: true,
          }
        })
        .eq('id', lead.id);

      if (error) throw error;

      onUpdate({ ...lead, ...formData, detalhes_proposta: { ...(lead.detalhes_proposta || {}), manual_override: true } });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Editar Proposta</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
              <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.cliente_nome} onChange={e => setFormData({...formData, cliente_nome: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Telefone</label>
              <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Preço Desejado</label>
              <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.desired_value} onChange={e => setFormData({...formData, desired_value: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Entrada</label>
              <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.entrada} onChange={e => setFormData({...formData, entrada: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Quilometragem</label>
            <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.quilometragem} onChange={e => setFormData({...formData, quilometragem: e.target.value})} />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações Manualmente</>}
          </button>
        </form>
      </div>
    </div>
  );
}
