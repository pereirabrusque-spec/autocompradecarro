import React, { useState } from 'react';
import { X, RefreshCw, Save, Trash2, ShieldCheck, Wallet, ImageIcon, ChevronLeft, ChevronRight, Calculator, MessageCircle, Send } from 'lucide-react';

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
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Cálculo dinâmico baseado nos campos do formulário
  const calculateProposal = () => {
    const fipe = parseFloat(currentLead.valor_fipe) || 0;
    
    // 1. Descontos (Regras)
    const discountRules = { financiado: 0.10, renajud: 0.15, sinistro: 0.20, leilao: 0.25, recuperado: 0.20 };
    let maxDiscountPct = 0;
    (currentLead.problemas || []).forEach((p: string) => {
      const pct = discountRules[p.toLowerCase() as keyof typeof discountRules] || 0;
      if (pct > maxDiscountPct) maxDiscountPct = pct;
    });
    const discountValue = fipe * maxDiscountPct;

    // 2. Custos Fixos e Avarias
    const fixedCosts = 
      (parseFloat(currentLead.valor_ipva) || 0) +
      (parseFloat(currentLead.valor_licenciamento) || 0) +
      (parseFloat(currentLead.valor_multas) || 0) +
      (parseFloat(currentLead.valor_motor) || 0) + 
      (parseFloat(currentLead.valor_cambio) || 0) + 
      (parseFloat(currentLead.valor_pintura) || 0) +
      (parseFloat(currentLead.valor_pneus) || 0) +
      (parseFloat(currentLead.valor_documento) || 0) +
      ((currentLead.avarias || []).reduce((acc: number, av: any) => acc + (parseFloat(av.valor) || 0), 0));

    // 3. Quitação
    const remaining = (parseInt(currentLead.total_parcelas) || 0) - (parseInt(currentLead.parcelas_pagas) || 0);
    const payoff = (parseFloat(currentLead.valor_parcela) || 0) * remaining * (1 + (0.02 * remaining));

    // 4. Proposta Final
    const finalProposal = fipe - discountValue - fixedCosts - payoff;
    const profit = fipe * 0.15;

    return { fipe, discountValue, fixedCosts, payoff, finalProposal, profit };
  };

  const calc = calculateProposal();

  const handleFieldChange = (field: string, value: string) => {
    setCurrentLead({ ...currentLead, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-widest">
                #{currentLead.vehicle_code || '---'}
              </span>
              <h2 className="text-2xl font-bold font-display">{currentLead.marca} {currentLead.modelo}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Atualizar"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Esquerda: Formulário Fiel */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-6">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: 'Data Negociação', key: 'data_negociacao' },
                    { label: 'Cliente Nome', key: 'cliente_nome' },
                    { label: 'Telefone', key: 'telefone' },
                    { label: 'Email', key: 'email' },
                    { label: 'CPF', key: 'cpf' },
                    { label: 'Placa', key: 'placa' },
                    { label: 'Renavam', key: 'renavam' },
                    { label: 'Chassi', key: 'chassi' },
                    { label: 'Marca', key: 'marca' },
                    { label: 'Modelo', key: 'modelo' },
                    { label: 'Ano Fabricação', key: 'ano_fabricacao' },
                    { label: 'Ano Modelo', key: 'ano_modelo' },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                      <input 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" 
                        value={currentLead[field.key] || ''} 
                        onChange={e => handleFieldChange(field.key, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gestão de Custos Fixos */}
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-6">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Custos Fixos e Avarias</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: 'Valor IPVA', key: 'valor_ipva' },
                    { label: 'Valor Licenciamento', key: 'valor_licenciamento' },
                    { label: 'Valor Multas', key: 'valor_multas' },
                    { label: 'Valor Motor', key: 'valor_motor' },
                    { label: 'Valor Câmbio', key: 'valor_cambio' },
                    { label: 'Valor Pintura', key: 'valor_pintura' },
                    { label: 'Valor Pneus', key: 'valor_pneus' },
                    { label: 'Valor Documento', key: 'valor_documento' },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                      <input 
                        type="number"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" 
                        value={currentLead[field.key] || ''} 
                        onChange={e => handleFieldChange(field.key, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Financeiro */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[32px] space-y-8 shadow-2xl">
                <h3 className="font-bold uppercase text-xs tracking-widest text-white/60 border-b border-white/10 pb-4">Análise Financeira</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-white/60">FIPE</span><span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span></div>
                  <div className="flex justify-between text-red-400"><span className="text-white/60">Descontos</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span></div>
                  <div className="flex justify-between text-red-400"><span className="text-white/60">Custos Fixos/Avarias</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span></div>
                  <div className="flex justify-between text-red-400"><span className="text-white/60">Quitação</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span></div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-accent font-bold">PROPOSTA FINAL</span>
                    <span className="text-2xl font-bold font-display">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
