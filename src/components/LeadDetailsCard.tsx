import React, { useState } from 'react';
import { X, RefreshCw, Save, Trash2, ShieldCheck, Wallet, ImageIcon, ChevronLeft, ChevronRight, Calculator, MessageCircle, Send } from 'lucide-react';

interface LeadDetailsCardProps {
  lead: any;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
  onDelete: (leadId: string) => void;
  onRefresh: () => void;
  fipeRules: any[];
}

export default function LeadDetailsCard({ lead, onClose, onSave, onDelete, onRefresh, fipeRules }: LeadDetailsCardProps) {
  const [currentLead, setCurrentLead] = useState(lead || {});

  React.useEffect(() => {
    if (lead) {
      console.log('--- MAPEAMENTO DE CAMPOS ---');
      console.log('Chaves disponíveis no banco:', Object.keys(lead));
      console.log('Objeto Lead completo:', lead);
      console.log('----------------------------');
      setCurrentLead(lead);
    }
  }, [lead]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Cálculo dinâmico baseado nos campos do formulário e regras do banco
  const calculateProposal = () => {
    const fipe = parseFloat(currentLead.valor_fipe) || 0;
    
    let maxDiscountPct = 0;
    
    // 1. Descontos (Regras dinâmicas do banco)
    const discounts: { name: string, pct: number, value: number }[] = [];
    const problemas = Array.isArray(currentLead.problemas) ? currentLead.problemas : (currentLead.problemas ? [currentLead.problemas] : []);
    problemas.forEach((p: string) => {
      const rule = fipeRules.find(r => r.condition_name.toLowerCase() === p.toLowerCase());
      if (rule) {
        const pct = parseFloat(rule.discount_percentage) / 100;
        discounts.push({ name: rule.condition_name, pct, value: fipe * pct });
      } else {
        const pKey = p.toLowerCase().replace(/ /g, '_');
        const fallbackRules: Record<string, number> = { 
          cooperativa: 0.90,
          financiado: 0.50,
          renajud: 0.20,
          sinistro: 0.35,
          leilao: 0.35,
          busca: 0.50,
          nome_juridico: 0.70
        };
        const pct = fallbackRules[pKey] || 0;
        if (pct > 0) discounts.push({ name: p, pct, value: fipe * pct });
      }
    });

    // Verifica campos específicos de financiamento/cooperativa
    if (currentLead.financiado === 'sim') {
      const pct = 0.50;
      discounts.push({ name: 'Financiado', pct, value: fipe * pct });
    }
    if (currentLead.banco_financiamento?.toLowerCase().includes('coop') || 
        currentLead.banco_financiamento?.toLowerCase().includes('sicredi') || 
        currentLead.banco_financiamento?.toLowerCase().includes('sicoob')) {
      const pct = 0.90;
      discounts.push({ name: 'Cooperativa', pct, value: fipe * pct });
    }
    
    const discountValue = discounts.length > 0 ? Math.max(...discounts.map(d => d.value)) : 0;

    // 2. Custos Fixos e Avarias
    const fixedCosts = 
      (parseFloat(currentLead.multas) || 0) +
      (parseFloat(currentLead.valor_ipva) || 0) +
      (parseFloat(currentLead.motor_reparo) || 0) + 
      (parseFloat(currentLead.cambio_reparo) || 0) + 
      (parseFloat(currentLead.batido_reparo) || 0) +
      (parseFloat(currentLead.valor_documento) || 0) +
      ((currentLead.avarias || []).reduce((acc: number, av: any) => acc + (parseFloat(av.valor) || 0), 0));

    // 3. Quitação
    const totalParcelas = (parseInt(currentLead.total_parcelas) || 0);
    const parcelasPagas = (parseInt(currentLead.parcelas_pagas) || 0);
    const atrasadas = (parseInt(currentLead.parcelas_atrasadas) || 0);
    
    // Parcelas a vencer: Total - Pagas - Atrasadas
    const aVencer = Math.max(0, totalParcelas - parcelasPagas - atrasadas);
    const valorParcela = (parseFloat(currentLead.valor_parcela) || 0);
    const jurosAtrasoPct = (parseFloat(currentLead.juros_atraso) || 2) / 100;
    
    // Cálculos
    const valorAVencer = aVencer * valorParcela;
    const valorAtrasadasBase = atrasadas * valorParcela;
    const jurosAtrasadas = valorAtrasadasBase * jurosAtrasoPct;
    const totalAtrasadas = valorAtrasadasBase + jurosAtrasadas;
    
    const payoffBreakdown = {
        qtdAVencer: aVencer,
        valorAVencer: valorAVencer,
        qtdAtrasadas: atrasadas,
        valorAtrasadasBase: valorAtrasadasBase,
        jurosAtrasadas: jurosAtrasadas,
        totalAtrasadas: totalAtrasadas
    };
    const payoff = valorAVencer + totalAtrasadas;

    // 4. Proposta Final
    const finalProposal = fipe - discountValue - fixedCosts - payoff;
    const profit = Math.max(0, finalProposal); 

    return { fipe, discountValue, discounts, fixedCosts, payoff, payoffBreakdown, finalProposal, profit };
  };

  const calc = calculateProposal();

  const handleFieldChange = (field: string, value: string) => {
    setCurrentLead({ ...currentLead, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-widest">
                #{currentLead.vehicle_code || '---'}
              </span>
              <h2 className="text-2xl font-bold font-display">{currentLead.marca} {currentLead.modelo}</h2>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4" /> {showForm ? 'Fechar Edição' : 'Editar Lead'}
            </button>
            <button onClick={() => window.open(`https://wa.me/${currentLead.telefone?.replace(/\D/g, '')}`, '_blank')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4" /> Chat
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-700">
              Voltar
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scroll-pt-20">
          {showForm && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4 mb-6">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Editar Lead</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cliente', key: 'cliente_nome' },
                  { label: 'Telefone', key: 'telefone' },
                  { label: 'Marca', key: 'marca' },
                  { label: 'Modelo', key: 'modelo' },
                  { label: 'Ano Modelo', key: 'ano_modelo' },
                  { label: 'Cor', key: 'cor' },
                  { label: 'Quilometragem', key: 'quilometragem' },
                  { label: 'Placa', key: 'placa' },
                  { label: 'Valor FIPE', key: 'valor_fipe' },
                  { label: 'Valor Desejado', key: 'desired_value' },
                  { label: 'Total Parcelas', key: 'total_parcelas' },
                  { label: 'Parcelas Pagas', key: 'parcelas_pagas' },
                  { label: 'Parcelas Atrasadas', key: 'parcelas_atrasadas' },
                  { label: 'Valor Parcela', key: 'valor_parcela' },
                  { label: 'Juros Atraso (%)', key: 'juros_atraso' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                    <input 
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" 
                      value={currentLead[field.key] || ''} 
                      onChange={e => handleFieldChange(field.key, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => { onSave(currentLead); setShowForm(false); }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          )}
          {!showForm && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Coluna Esquerda: Formulário Fiel */}
              <div className="lg:col-span-12 space-y-6">
              {/* Carrossel de Mídia */}
              {currentLead.midias && currentLead.midias.length > 0 && (
                <div className="bg-slate-900 p-4 rounded-[32px] relative">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                    {currentLead.midias[currentPhotoIndex].type === 'video' ? (
                      <video src={currentLead.midias[currentPhotoIndex].url} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={currentLead.midias[currentPhotoIndex].url} alt="Mídia" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <button onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? currentLead.midias.length - 1 : prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"><ChevronLeft /></button>
                  <button onClick={() => setCurrentPhotoIndex((prev) => (prev === currentLead.midias.length - 1 ? 0 : prev + 1))} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"><ChevronRight /></button>
                </div>
              )}

              {/* Benefícios */}
              <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-4">Benefícios do Veículo</h3>
                <div className="flex flex-wrap gap-2">
                  {['ar_condicionado', 'direcao_hidraulica', 'bancos_couro', 'vidros_eletricos', 'travas_eletricas', 'alarme', 'som_multimidia', 'rodas_liga_leve', 'sensor_re', 'camera_re', 'teto_solar', 'airbag', 'chave_reserva', 'revisoes_dia'].map(key => currentLead[key] === 'sim' && (
                    <span key={key} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold capitalize">{key.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>

              {/* Detalhamento da Proposta */}
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-4">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Detalhamento da Proposta</h3>
                <div className="flex gap-4 mb-4">
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold">Enviar para Usuário</button>
                  <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">Enviar para Comprador</button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Tabela FIPE</span><span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span></div>
                  <div className="flex justify-between text-red-500 group cursor-pointer relative">
                    <span>Descontos Aplicados</span>
                    <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span>
                    <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                      {calc.discounts.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>{d.name} ({Math.round(d.pct * 100)}%)</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-red-500 group cursor-pointer relative">
                    <span>Custos Fixos/Avarias</span>
                    <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span>
                    <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                      {['multas', 'valor_licenciamento', 'motor_reparo', 'cambio_reparo', 'batido_reparo', 'valor_pneus', 'valor_documento'].map(key => currentLead[key] > 0 && (
                        <div key={key} className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentLead[key])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-red-500 group cursor-pointer relative">
                    <span>Quitação Estimada</span>
                    <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                    <div className="absolute right-0 top-full bg-white border border-slate-200 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Qtd a Vencer</span>
                            <span>{calc.payoffBreakdown.qtdAVencer}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Valor a Vencer</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorAVencer)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Qtd Atrasadas</span>
                            <span>{calc.payoffBreakdown.qtdAtrasadas}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Juros Atrasadas</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.jurosAtrasadas)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Total Atrasadas</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.totalAtrasadas)}</span>
                        </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between font-bold text-lg"><span>Proposta Final</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}</span></div>
                  <div className="flex justify-between text-emerald-600 font-medium"><span>Margem de Lucro (15%)</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.profit)}</span></div>
                </div>
              </div>

              {/* Gestão de Custos Fixos */}
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-6">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Custos Fixos e Avarias</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: 'Multas', key: 'multas' },
                    { label: 'IPVA/Multa', key: 'valor_ipva' },
                    { label: 'Valor Motor', key: 'motor_reparo' },
                    { label: 'Valor Câmbio', key: 'cambio_reparo' },
                    { label: 'Valor Batido', key: 'batido_reparo' },
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
                  <div className="flex justify-between text-red-400 group cursor-pointer relative"><span className="text-white/60">Descontos</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span>
                    <div className="absolute right-0 top-full bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                      {calc.discounts.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs text-white/60 mb-1">
                          <span>{d.name} ({Math.round(d.pct * 100)}%)</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-red-400"><span className="text-white/60">Custos Fixos/Avarias</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span></div>
                  <div className="flex justify-between text-red-400 group cursor-pointer relative"><span className="text-white/60">Quitação</span><span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span>
                    <div className="absolute right-0 top-full bg-slate-800 border border-white/10 p-4 rounded-xl shadow-lg hidden group-hover:block z-20 w-64">
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Qtd Parcelas</span>
                            <span>{calc.payoffBreakdown.qtdParcelas}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Valor Parcela</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.valorParcela)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Juros Parcelas</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.jurosParcelas)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Parcelas Atrasadas</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoffBreakdown.atrasadas)}</span>
                        </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-accent font-bold">PROPOSTA FINAL</span>
                    <span className="text-2xl font-bold font-display">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
