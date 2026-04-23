import React from 'react';
import { Phone, Calendar, DollarSign, Car, Zap, TrendingDown } from 'lucide-react';

interface LeadCardProps {
  lead: any;
  suggestedValue?: number;
  onClick: () => void;
  onReserve: (e: React.MouseEvent) => void;
  onClone?: (e: React.MouseEvent) => void;
  hideClientInfo?: boolean;
  permissions?: any;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, suggestedValue, onClick, onReserve, onClone, hideClientInfo = false, permissions }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const shouldHidePrice = permissions?.show_price === false;
  const shouldHidePhotos = permissions?.show_photos === false;
  const actualHideClientInfo = hideClientInfo || permissions?.show_details === false;

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[32px] border transition-all cursor-pointer space-y-4 group relative overflow-hidden ${
        lead.status === 'reservado' 
          ? 'bg-amber-50 border-amber-200 shadow-inner' 
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Classification Tag */}
      <div className="absolute top-0 right-0 z-10 flex items-center">
        {onClone && (
          <button 
            onClick={onClone}
            className="bg-blue-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors border-r border-blue-400"
            title="Clonar Veículo"
          >
            Clonar
          </button>
        )}
        <button 
          onClick={onReserve}
          className={`${
            lead.status === 'reservado' 
              ? 'bg-emerald-500 hover:bg-emerald-600' 
              : 'bg-amber-500 hover:bg-amber-600'
          } text-white px-3 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest transition-colors`}
        >
          {lead.status === 'reservado' ? 'Reservado' : 'Reserva'}
        </button>
        <div className={`px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
          (lead.classificacao || (lead.is_frio ? 'frio' : 'morna')) === 'quente' ? 'bg-red-500 text-white' :
          (lead.classificacao || (lead.is_frio ? 'frio' : 'morna')) === 'frio' ? 'bg-blue-500 text-white' :
          'bg-orange-500 text-white'
        }`}>
          {lead.classificacao || (lead.is_frio ? 'frio' : 'morna')}
        </div>
      </div>

      {/* Main Photo */}
      <div className="h-40 -mx-6 -mt-6 mb-4 bg-slate-100 relative overflow-hidden">
        {shouldHidePhotos ? (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-800">
             <Car className="w-12 h-12 opacity-20" />
             <span className="absolute text-[10px] text-white/40 font-bold uppercase tracking-widest">Fotos Ocultas</span>
          </div>
        ) : lead.fotos && lead.fotos.length > 0 ? (
          <img src={lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Car className="w-12 h-12" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-start pt-2">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-accent transition-colors">{lead.marca} {lead.modelo}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{lead.vehicle_code}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
              lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-700' :
              lead.status === 'perdido' ? 'bg-red-100 text-red-700' :
              lead.status === 'reservado' ? 'bg-amber-200 text-amber-800' :
              lead.status === 'proposta_enviada' ? 'bg-blue-100 text-blue-700' :
              lead.status === 'em_contato' ? 'bg-amber-100 text-amber-700' :
              lead.status === 'negociar' ? 'bg-purple-100 text-purple-700' :
              lead.status === 'limpa_nome' ? 'bg-indigo-100 text-indigo-700' :
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
            {shouldHidePrice ? 'R$ ??.???' : formatCurrency(lead.preco_cliente)}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 flex justify-between items-center group-hover:bg-black transition-colors">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-accent" />
            Sugestão IA
          </p>
          <p className="text-lg font-black text-white">
            {shouldHidePrice ? 'R$ ??.???' : suggestedValue ? formatCurrency(suggestedValue) : 'Calculando...'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
            {actualHideClientInfo ? '??' : lead.cliente_nome?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-none">
              {actualHideClientInfo ? 'Cliente Oculto' : lead.cliente_nome}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">
              {actualHideClientInfo ? '(Dados Protegidos)' : lead.telefone}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
