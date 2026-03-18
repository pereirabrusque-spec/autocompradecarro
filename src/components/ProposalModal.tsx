import React from 'react';
import { User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LeadDetailsCard from './LeadDetailsCard';

interface ProposalModalProps {
  selectedLead: any;
  proposalCalculator: any;
  onClose: () => void;
  setAvarias: (avarias: any[]) => void;
  setShowAvariasModal: (show: boolean) => void;
  fipeRules: any[];
  jurosAtraso: number;
  banks: any[];
  cooperativeDiscount: number;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  selectedLead,
  proposalCalculator,
  onClose,
  setAvarias,
  setShowAvariasModal,
  fipeRules,
  jurosAtraso,
  banks,
  cooperativeDiscount,
}) => {
  const [editedLead, setEditedLead] = React.useState(selectedLead);

  const handleSave = async (updatedLead: any) => {
    const { error } = await supabase
      .from('leads_veiculos')
      .update(updatedLead)
      .eq('id', updatedLead.id);
    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      alert('Alterações salvas com sucesso!');
      setEditedLead(updatedLead);
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Proposta para {editedLead.cliente_nome}</h2>
        
        <LeadDetailsCard 
            lead={editedLead} 
            onClose={onClose} 
            onSave={handleSave} 
            onDelete={handleDelete} 
            onRefresh={() => {}} 
            fipeRules={fipeRules} 
            jurosAtraso={jurosAtraso} 
            banks={banks} 
            cooperativeDiscount={cooperativeDiscount} 
            userRole="admin"
        />
      </div>
    </div>
  );
};
