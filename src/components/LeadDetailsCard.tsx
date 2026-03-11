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
  const [showForm, setShowForm] = useState(false);

  const calculateProposal = () => {
    const fipe = parseFloat(currentLead.valor_fipe) || 0;
    
    // Regra: Maior desconto aplicado (não cumulativo)
    const discountRules = { 
      financiado: 0.10, 
      renajud: 0.15, 
      sinistro: 0.20,
      leilao: 0.25,
      recuperado: 0.20
    };
    
    let maxDiscountPct = 0;
    const problemas = currentLead.problemas || [];
    problemas.forEach((p: string) => {
      const pct = discountRules[p.toLowerCase() as keyof typeof discountRules] || 0;
      if (pct > maxDiscountPct) maxDiscountPct = pct;
    });
    
    const discountValue = fipe * maxDiscountPct;

    // Despesas (Valores fixos: Motor, Câmbio, Avarias, etc)
    const expenses = 
      (parseFloat(currentLead.valor_motor) || 0) + 
      (parseFloat(currentLead.valor_cambio) || 0) + 
      (parseFloat(currentLead.valor_pintura) || 0) +
      (parseFloat(currentLead.valor_pneus) || 0) +
      (parseFloat(currentLead.valor_documento) || 0) +
      ((currentLead.avarias || []).reduce((acc: number, av: any) => acc + (parseFloat(av.valor) || 0), 0));

    // Quitação: (Parcela * Qtd Restante) * (1 + 0.02 * Qtd Restante)
    const remaining = (parseInt(currentLead.total_parcelas) || 0) - (parseInt(currentLead.parcelas_pagas) || 0);
    const payoff = (parseFloat(currentLead.valor_parcela) || 0) * remaining * (1 + (0.02 * remaining));

    const finalProposal = fipe - discountValue - expenses - payoff;
    const profit = fipe * 0.15; // Margem sugerida de 15% sobre a FIPE

    return { fipe, discountValue, expenses, payoff, finalProposal, profit };
  };

  const calc = calculateProposal();

  const handleWhatsAppSend = () => {
    const text = `*DADOS DO VEÍCULO - LEAD #${currentLead.vehicle_code}*\n\n` +
      `*Cliente:* ${currentLead.cliente_nome}\n` +
      `*Veículo:* ${currentLead.marca} ${currentLead.modelo} ${currentLead.ano_modelo}\n` +
      `*Placa:* ${currentLead.placa}\n` +
      `*FIPE:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}\n` +
      `*Proposta:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
            <p className="text-slate-500 text-sm font-medium">{currentLead.cliente_nome} • {currentLead.telefone}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Atualizar"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Esquerda: Mídia e Formulário */}
            <div className="lg:col-span-7 space-y-6">
              {/* Carrossel Profissional */}
              <div className="relative aspect-video bg-slate-900 rounded-3xl flex items-center justify-center overflow-hidden shadow-inner group">
                {currentLead.fotos?.length > 0 ? (
                  <>
                    <img 
                      src={currentLead.fotos[currentPhotoIndex]} 
                      alt="Veículo" 
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button 
                      className="absolute left-4 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all" 
                      onClick={() => setCurrentPhotoIndex(prev => (prev === 0 ? currentLead.fotos.length - 1 : prev - 1))}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      className="absolute right-4 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all" 
                      onClick={() => setCurrentPhotoIndex(prev => (prev === currentLead.fotos.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {currentLead.fotos.map((_: any, i: number) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-500">
                    <ImageIcon className="w-16 h-16 opacity-20" />
                    <p className="font-bold text-sm uppercase tracking-widest">Sem fotos disponíveis</p>
                  </div>
                )}
              </div>

              {/* Ações Rápidas */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border-2 ${showForm ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-100 hover:border-slate-200'}`}
                >
                  {showForm ? 'Fechar Formulário' : 'Ver Formulário'}
                </button>
                <button 
                  onClick={handleWhatsAppSend}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button 
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" /> Enviar Proposta
                </button>
              </div>

              {/* Formulário Profissional */}
              {showForm && (
                <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="font-bold flex items-center gap-2 text-slate-900 uppercase text-xs tracking-widest">
                      <ShieldCheck className="w-5 h-5 text-accent" /> 
                      Dados de Avaliação
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: 'Nome do Cliente', key: 'cliente_nome' },
                      { label: 'Telefone', key: 'telefone' },
                      { label: 'E-mail', key: 'email' },
                      { label: 'Placa', key: 'placa' },
                      { label: 'Marca', key: 'marca' },
                      { label: 'Modelo', key: 'modelo' },
                      { label: 'Ano Modelo', key: 'ano_modelo' },
                      { label: 'Cor', key: 'cor' },
                      { label: 'KM', key: 'quilometragem' },
                      { label: 'Câmbio', key: 'valor_cambio', type: 'number' },
                      { label: 'Motor', key: 'valor_motor', type: 'number' },
                      { label: 'Pintura', key: 'valor_pintura', type: 'number' },
                      { label: 'Pneus', key: 'valor_pneus', type: 'number' },
                      { label: 'Documento', key: 'valor_documento', type: 'number' },
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                        <input 
                          type={field.type || 'text'}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all" 
                          value={currentLead[field.key] || ''} 
                          onChange={e => setCurrentLead({...currentLead, [field.key]: e.target.value})} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita: Financeiro */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card de Cálculo */}
              <div className="bg-slate-900 text-white p-8 rounded-[32px] space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <Calculator className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase text-xs tracking-widest text-white/60">Análise Financeira</h3>
                    <p className="text-xl font-bold font-display">Cálculo de Proposta</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                    <span className="text-white/60 text-sm font-medium">Tabela FIPE</span>
                    <span className="font-bold font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    <span className="text-white/60 text-sm font-medium">Descontos (Regras)</span>
                    <span className="font-bold font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    <span className="text-white/60 text-sm font-medium">Despesas (Avarias/Doc)</span>
                    <span className="font-bold font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    <span className="text-white/60 text-sm font-medium">Quitação Estimada</span>
                    <span className="font-bold font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-accent font-bold uppercase text-[10px] tracking-widest mb-1">Valor da Proposta</p>
                        <p className="text-4xl font-bold font-display tracking-tight">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-1">Lucro Real</p>
                        <p className="text-xl font-bold font-mono text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Final */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onSave(currentLead)} 
                  className="py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar Lead
                </button>
                <button 
                  onClick={() => onDelete(currentLead.id)} 
                  className="py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
