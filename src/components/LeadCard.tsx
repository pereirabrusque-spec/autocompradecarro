import React from 'react';
import { Phone, Mail, Calendar, DollarSign, Car } from 'lucide-react';

interface LeadCardProps {
  lead: any;
  onClick: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-slate-900">{lead.marca} {lead.modelo}</h3>
          <p className="text-xs text-slate-400 font-mono">#{lead.vehicle_code}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
          lead.status === 'novo' ? 'bg-blue-100 text-blue-600' :
          lead.status === 'em_atendimento' ? 'bg-amber-100 text-amber-600' :
          lead.status === 'proposta' ? 'bg-purple-100 text-purple-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {lead.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2"><Car className="w-4 h-4 text-slate-400" /> {lead.ano_modelo} • {lead.quilometragem} km</p>
        <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /> {formatCurrency(lead.preco_cliente)}</p>
        <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {lead.telefone}</p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
        <span className="font-bold text-slate-900">{lead.cliente_nome}</span>
      </div>
    </div>
  );
};
