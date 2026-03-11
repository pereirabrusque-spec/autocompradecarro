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
  console.log('Lead recebido no LeadDetailsCard (JSON completo):', JSON.stringify(lead, null, 2));
  const [currentLead, setCurrentLead] = useState(lead || {});

  React.useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Cálculo dinâmico baseado nos campos do formulário e regras do banco
  const calculateProposal = () => {
    const fipe = parseFloat(currentLead.valor_fipe) || 0;
    
    let maxDiscountPct = 0;
    
    // 1. Descontos (Regras dinâmicas do banco)
    const problemas = Array.isArray(currentLead.problemas) ? currentLead.problemas : (currentLead.problemas ? [currentLead.problemas] : []);
    problemas.forEach((p: string) => {
      const rule = fipeRules.find(r => r.condition_name.toLowerCase() === p.toLowerCase());
      if (rule) {
        const pct = parseFloat(rule.discount_percentage) / 100;
        if (pct > maxDiscountPct) maxDiscountPct = pct;
      } else {
        // Fallback para regras fixas se não encontrar no banco
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
        if (pct > maxDiscountPct) maxDiscountPct = pct;
      }
    });

    // Verifica campos específicos de financiamento/cooperativa
    if (currentLead.financiado === 'sim') {
      if (maxDiscountPct < 0.50) maxDiscountPct = 0.50;
    }
    if (currentLead.banco_financiamento?.toLowerCase().includes('coop') || 
        currentLead.banco_financiamento?.toLowerCase().includes('sicredi') || 
        currentLead.banco_financiamento?.toLowerCase().includes('sicoob')) {
      maxDiscountPct = 0.90;
    }
    
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
    const jurosAtraso = (parseFloat(currentLead.juros_atraso) || 0) / 100;
    const atrasadas = (parseInt(currentLead.parcelas_atrasadas) || 0);
    const valorParcela = (parseFloat(currentLead.valor_parcela) || 0);
    
    const payoff = (valorParcela * remaining * (1 + (0.02 * remaining))) + (atrasadas * valorParcela * jurosAtraso);

    // 4. Proposta Final
    const finalProposal = fipe - discountValue - fixedCosts - payoff;
    const profit = fipe - finalProposal; // Lucro = FIPE - Proposta Final (que já inclui descontos, custos e quitação)

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
          <div className="flex gap-2 items-center">
            <button onClick={() => window.open(`https://wa.me/${currentLead.telefone?.replace(/\D/g, '')}`, '_blank')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-700">
              Voltar para Lista
            </button>
            <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Atualizar"><RefreshCw className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6">
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

              {/* Formulário Fiel (Acordeão) */}
              <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm space-y-4">
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  className="w-full flex justify-between items-center font-bold text-slate-900 uppercase text-xs tracking-widest"
                >
                  <span>Formulário Completo de Avaliação</span>
                  <span>{showForm ? '▲' : '▼'}</span>
                </button>
                
                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
                    {[
                      { label: 'Data Negociação', key: 'data_negociacao', type: 'date' },
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
                      { label: 'Cor', key: 'cor' },
                      { label: 'Quilometragem (km)', key: 'quilometragem', type: 'number' },
                      { label: 'Ar Condicionado', key: 'ar_condicionado', type: 'select' },
                      { label: 'Direção Hidráulica', key: 'direcao_hidraulica', type: 'select' },
                      { label: 'Vidros Elétricos', key: 'vidros_eletricos', type: 'select' },
                      { label: 'Travas Elétricas', key: 'travas_eletricas', type: 'select' },
                      { label: 'Alarme', key: 'alarme', type: 'select' },
                      { label: 'Som / Multimídia', key: 'som_multimidia', type: 'select' },
                      { label: 'Bancos de Couro', key: 'bancos_couro', type: 'select' },
                      { label: 'Rodas de Liga Leve', key: 'rodas_liga_leve', type: 'select' },
                      { label: 'Sensor de Ré', key: 'sensor_re', type: 'select' },
                      { label: 'Câmera de Ré', key: 'camera_re', type: 'select' },
                      { label: 'Teto Solar', key: 'teto_solar', type: 'select' },
                      { label: 'Airbag', key: 'airbag', type: 'select' },
                      { label: 'Chave Reserva', key: 'chave_reserva', type: 'select' },
                      { label: 'Revisões em dia', key: 'revisoes_dia', type: 'select' },
                      { label: 'Estado Pneus', key: 'estado_pneus', type: 'select' },
                      { label: 'Valor Desejado', key: 'valor_desejado', type: 'number' },
                      { label: 'Financiado', key: 'financiado', type: 'select' },
                      { label: 'Renajud', key: 'renajud', type: 'select' },
                      { label: 'Banco Financiador', key: 'banco_financiamento' },
                      { label: 'Total Parcelas', key: 'total_parcelas', type: 'number' },
                      { label: 'Parcelas Pagas', key: 'parcelas_pagas', type: 'number' },
                      { label: 'Parcelas Atrasadas', key: 'parcelas_atrasadas', type: 'number' },
                      { label: 'Valor Parcela', key: 'valor_parcela', type: 'number' },
                      { label: 'Valor Entrada', key: 'valor_entrada', type: 'number' },
                      { label: 'Juros Atraso (%)', key: 'juros_atraso', type: 'number' },
                      { label: 'Cidade / Estado', key: 'cidade_estado' },
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                        {field.type === 'select' ? (
                          <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            value={currentLead[field.key] || ''}
                            onChange={e => handleFieldChange(field.key, e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="sim">Sim</option>
                            <option value="nao">Não</option>
                            {field.key === 'estado_pneus' && (
                              <>
                                <option value="novos">Novos</option>
                                <option value="bom">Bom</option>
                                <option value="regular">Regular</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <input 
                            type={field.type || 'text'}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all" 
                            value={currentLead[field.key] || ''} 
                            placeholder="Sem preenchimento"
                            onChange={e => handleFieldChange(field.key, e.target.value)} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detalhamento da Proposta */}
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-4">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Detalhamento da Proposta</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Tabela FIPE</span><span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fipe)}</span></div>
                  <div className="flex justify-between text-red-500"><span>Descontos Aplicados</span><span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.discountValue)}</span></div>
                  <div className="flex justify-between text-red-500"><span>Custos Fixos/Avarias</span><span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.fixedCosts)}</span></div>
                  <div className="flex justify-between text-red-500"><span>Quitação Estimada</span><span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.payoff)}</span></div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between font-bold text-lg"><span>Proposta Final</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}</span></div>
                  <div className="flex justify-between text-emerald-600 font-medium"><span>Margem de Lucro (15%)</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.profit)}</span></div>
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
