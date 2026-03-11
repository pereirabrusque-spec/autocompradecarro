import React from 'react';
import { Phone, Calendar, DollarSign, Car, Zap, TrendingDown } from 'lucide-react';

interface LeadCardProps {
  lead: any;
  suggestedValue?: number;
  onClick: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, suggestedValue, onClick }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 group relative overflow-hidden"
    >
      {/* Classification Tag */}
      <div className="absolute top-0 right-0">
        <div className={`px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
          (lead.classificacao || 'morna') === 'quente' ? 'bg-red-500 text-white' :
          (lead.classificacao || 'morna') === 'fria' ? 'bg-blue-500 text-white' :
          'bg-orange-500 text-white'
        }`}>
          {lead.classificacao || 'morna'}
        </div>
      </div>

      <div className="flex justify-between items-start pt-2">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-accent transition-colors">{lead.marca} {lead.modelo}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{lead.vehicle_code}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
              lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-700' :
              lead.status === 'perdido' ? 'bg-red-100 text-red-700' :
              lead.status === 'proposta_enviada' ? 'bg-blue-100 text-blue-700' :
              lead.status === 'em_contato' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {lead.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ano/Modelo</p>
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            {lead.ano_modelo}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quilometragem</p>
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-slate-400" />
            {lead.quilometragem?.toLocaleString()} km
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preço Desejado</p>
          <p className="text-sm font-black text-slate-900">
            {formatCurrency(lead.preco_cliente)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-black text-accent uppercase tracking-widest">Sugestão IA</p>
          <p className="text-sm font-black text-accent">
            {suggestedValue ? formatCurrency(suggestedValue) : 'Calculando...'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
            {lead.cliente_nome?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-none">{lead.cliente_nome}</p>
            <p className="text-[9px] text-slate-400 mt-1">{lead.telefone}</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
