import React, { useState } from 'react';
import { X, RefreshCw, Save, Trash2, ShieldCheck, Wallet, ImageIcon, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';

interface LeadDetailsCardProps {
  lead: any;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
  onDelete: (leadId: string) => void;
  onRefresh: () => void;
}

export default function LeadDetailsCard({ lead, onClose, onSave, onDelete, onRefresh }: LeadDetailsCardProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const calculateProposal = () => {
    const fipe = currentLead.valor_fipe || 0;
    
    // Regra: Maior desconto aplicado
    const discountRules = { financiado: 0.10, renajud: 0.15, sinistro: 0.20 };
    let maxDiscountPct = 0;
    (currentLead.problemas || []).forEach((p: string) => {
      if (discountRules[p as keyof typeof discountRules] > maxDiscountPct) maxDiscountPct = discountRules[p as keyof typeof discountRules];
    });
    const discountValue = fipe * maxDiscountPct;

    // Despesas fixas
    const expenses = (currentLead.avarias || []).reduce((acc: number, avaria: any) => acc + (avaria.valor || 0), 0);

    // Quitação: (Parcela * Qtd) * (1 + 0.02 * Qtd)
    const remaining = (currentLead.total_parcelas || 0) - (currentLead.parcelas_pagas || 0);
    const payoff = (currentLead.valor_parcela || 0) * remaining * (1 + (0.02 * remaining));

    const finalProposal = fipe - discountValue - expenses - payoff;
    const profit = finalProposal - (fipe * 0.8); // Exemplo de margem

    return { fipe, discountValue, expenses, payoff, finalProposal, profit };
  };

  const calc = calculateProposal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold font-display">Detalhes do Lead #{currentLead.vehicle_code}</h2>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Atualizar"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Carrossel */}
            <div className="relative aspect-video bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {currentLead.fotos?.length > 0 ? (
                <>
                  <img src={currentLead.fotos[currentPhotoIndex]} alt="Veículo" className="w-full h-full object-cover" />
                  <button className="absolute left-2 p-2 bg-white/80 rounded-full" onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}><ChevronLeft /></button>
                  <button className="absolute right-2 p-2 bg-white/80 rounded-full" onClick={() => setCurrentPhotoIndex(Math.min(currentLead.fotos.length - 1, currentPhotoIndex + 1))}><ChevronRight /></button>
                </>
              ) : <ImageIcon className="w-12 h-12 text-slate-300" />}
            </div>
            
            {/* Formulário Completo */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
              <h3 className="font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Formulário Completo</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentLead).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-slate-500 uppercase">{key}</label>
                    <input className="w-full p-2 border rounded" value={value as string} onChange={e => setCurrentLead({...currentLead, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Financeiro */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-accent" /> Cálculo da Proposta</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p>FIPE: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</p>
                <p>Descontos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</p>
                <p>Despesas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.expenses)}</p>
                <p>Quitação: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</p>
                <p className="col-span-2 font-bold text-lg">Proposta Final: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onSave(currentLead)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">Salvar</button>
              <button onClick={() => onDelete(currentLead.id)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
