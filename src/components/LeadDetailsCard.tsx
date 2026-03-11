import React, { useState, useEffect } from 'react';
import { X, Save, MessageCircle, Send, FileText, Edit2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [buyerFilter, setBuyerFilter] = useState('Todos');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);

  const calculateFinance = () => {
    const fipe = Number(currentLead.valor_fipe) || 0;
    const ipvaMulta = Number(currentLead.valor_ipva_multa) || 0;
    const multas = Number(currentLead.multas) || 0;
    const motorReparo = Number(currentLead.motor_reparo) || 0;
    const cambioReparo = Number(currentLead.cambio_reparo) || 0;
    const batidoReparo = Number(currentLead.batido_reparo) || 0;
    const valorPneus = Number(currentLead.valor_pneus) || 0;
    const valorDocumento = Number(currentLead.valor_documento) || 0;
    
    const totalParcelas = Number(currentLead.total_parcelas) || 0;
    const parcelasPagas = Number(currentLead.parcelas_pagas) || 0;
    const parcelasAtrasadas = Number(currentLead.parcelas_atrasadas) || 0;
    const valorParcela = Number(currentLead.valor_parcela) || 0;
    const jurosAtrasoPct = Number(currentLead.juros_atraso) || 0;

    const fixedCosts = ipvaMulta + multas + motorReparo + cambioReparo + batidoReparo + valorPneus + valorDocumento;
    
    const qtdAVencer = Math.max(0, totalParcelas - parcelasPagas - parcelasAtrasadas);
    const valorAVencer = qtdAVencer * valorParcela;
    
    const jurosAtrasadas = (parcelasAtrasadas * valorParcela) * (jurosAtrasoPct / 100);
    const totalAtrasadas = (parcelasAtrasadas * valorParcela) + jurosAtrasadas;
    
    const payoff = valorAVencer + totalAtrasadas;
    
    // Fórmula baseada na lógica do usuário: FIPE - Custos - Quitação
    const finalProposal = fipe - fixedCosts - payoff;
    const profit = finalProposal * 0.15; // Margem de 15%
    
    return {
        fipe,
        discountValue: 0, // Precisa definir como calcular descontos
        discounts: [],
        fixedCosts,
        payoff,
        payoffBreakdown: {
            qtdParcelas: totalParcelas,
            valorParcela,
            jurosParcelas: 0, // Precisa calcular
            atrasadas: parcelasAtrasadas,
            qtdAVencer,
            valorAVencer,
            qtdAtrasadas: parcelasAtrasadas,
            jurosAtrasadas,
            totalAtrasadas
        },
        finalProposal,
        profit
    };
  };

  const calc = calculateFinance();

  useEffect(() => {
    const fetchBuyers = async () => {
      const { data } = await supabase.from('interested_buyers').select('*');
      if (data) setBuyers(data);
    };
    fetchBuyers();
  }, []);

  React.useEffect(() => {
    if (lead) setCurrentLead(lead);
  }, [lead]);

  const [showForm, setShowForm] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [showBuyerConfigModal, setShowBuyerConfigModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setCurrentLead({ ...currentLead, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header Fixo */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-50 shadow-sm">
          <h2 className="text-lg font-bold font-display truncate">#{currentLead.vehicle_code} - {currentLead.marca} {currentLead.modelo}</h2>
          <button onClick={() => setShowDataModal(true)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Formulário Completo
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* ... (Conteúdo do formulário e detalhes) ... */}
        </div>

        {/* Footer Fixo com Botões */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-2">
          <button onClick={() => setShowForm(!showForm)} className="order-1 sm:order-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <Edit2 className="w-4 h-4" /> {showForm ? 'Fechar Edição' : 'Editar'}
          </button>
          <button onClick={() => window.open(`https://wa.me/${currentLead.telefone?.replace(/\D/g, '')}`, '_blank')} className="order-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={onClose} className="order-3 sm:order-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
    <div className="flex-1 overflow-y-auto p-6 scroll-pt-20">
          {showForm && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4 mb-6">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Editar Lead</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cliente', key: 'cliente_nome' },
                  { label: 'Telefone', key: 'telefone' },
                  { label: 'E-mail', key: 'email' },
                  { label: 'Marca', key: 'marca' },
                  { label: 'Modelo', key: 'modelo' },
                  { label: 'Ano Modelo', key: 'ano_modelo' },
                  { label: 'Cor', key: 'cor' },
                  { label: 'Quilometragem', key: 'quilometragem' },
                  { label: 'Placa', key: 'placa' },
                  { label: 'Valor FIPE', key: 'valor_fipe', type: 'number' },
                  { label: 'Valor Desejado', key: 'desired_value', type: 'number' },
                  { label: 'IPVA/Multa', key: 'valor_ipva_multa', type: 'number' },
                  { label: 'Total Parcelas', key: 'total_parcelas', type: 'number' },
                  { label: 'Parcelas Pagas', key: 'parcelas_pagas', type: 'number' },
                  { label: 'Parcelas Atrasadas', key: 'parcelas_atrasadas', type: 'number' },
                  { label: 'Valor Parcela', key: 'valor_parcela', type: 'number' },
                  { label: 'Juros Atraso (%)', key: 'juros_atraso', type: 'number' },
                  { label: 'Multas', key: 'multas', type: 'number' },
                  { label: 'Valor Motor', key: 'motor_reparo', type: 'number' },
                  { label: 'Valor Câmbio', key: 'cambio_reparo', type: 'number' },
                  { label: 'Valor Batido', key: 'batido_reparo', type: 'number' },
                  { label: 'Valor Pneus', key: 'valor_pneus', type: 'number' },
                  { label: 'Valor Documento', key: 'valor_documento', type: 'number' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{field.label}</label>
                    <input 
                      type={field.type || 'text'}
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
                    {['ar_condicionado', 'direcao_hidraulica', 'bancos_couro', 'vidros_eletricos', 'travas_eletricas', 'alarme', 'som_multimidia', 'rodas_liga_leve', 'sensor_re', 'camera_re', 'teto_solar', 'airbag', 'chave_reserva', 'revisoes_dia', 'abs', 'computador_bordo', 'piloto_automatico'].map(key => (currentLead[key] === 'sim' || currentLead[key] === true) && (
                      <span key={key} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold capitalize">{key.replace('_', ' ')}</span>
                    ))}
                  </div>
                </div>

                {/* Modais de Envio */}
                {showUserModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-4">Enviar Proposta ao Usuário</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Olá {currentLead.cliente_nome}, temos uma excelente proposta para o seu veículo {currentLead.marca} {currentLead.modelo}. 
                        O valor é de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}. 
                        Não perca essa oportunidade, vamos fechar negócio?
                      </p>
                      <button 
                        onClick={async () => { 
                          await supabase.from('internal_messages').insert({
                            sender_id: (await supabase.auth.getUser()).data.user?.id,
                            receiver_id: currentLead.user_id, // Assuming currentLead has user_id
                            content: `Olá ${currentLead.cliente_nome}, temos uma excelente proposta para o seu veículo ${currentLead.marca} ${currentLead.modelo}. O valor é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalProposal)}. Não perca essa oportunidade, vamos fechar negócio?`
                          });
                          setShowUserModal(false); 
                          setShowSuccessPopup(true); 
                        }} 
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                      >
                        Enviar Mensagem
                      </button>
                    </div>
                  </div>
                )}
                {showBuyerModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBuyerModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Selecionar Compradores</h3>
                        <button onClick={() => setSelectedBuyers(buyers.map(b => b.id))} className="text-xs font-bold text-blue-600">Selecionar Todos</button>
                      </div>
                      
                      {/* Filter */}
                      <div className="flex gap-2 mb-4">
                        {['Todos', 'Carro', 'Moto', 'Caminhão'].map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setBuyerFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${buyerFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                          > 
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                          {buyers
                            .filter(b => buyerFilter === 'Todos' || b.category === buyerFilter)
                            .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
                            .map(buyer => (
                              <label key={buyer.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedBuyers.includes(buyer.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedBuyers([...selectedBuyers, buyer.id]);
                                        else setSelectedBuyers(selectedBuyers.filter(id => id !== buyer.id));
                                      }}
                                    />
                                    {buyer.name}
                                  </div>
                                  <span className="text-xs text-slate-400">Ranking: {buyer.ranking || 0}</span>
                              </label>
                          ))}
                      </div>
                      <button 
                        onClick={() => { setShowBuyerModal(false); setShowBuyerConfigModal(true); }} 
                        className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold"
                        disabled={selectedBuyers.length === 0}
                      >
                        Continuar ({selectedBuyers.length} selecionados)
                      </button>
                    </div>
                  </div>
                )}
                {showBuyerConfigModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBuyerConfigModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-4">Configurar Envio</h3>
                      <div className="space-y-4">
                          <h4 className="font-bold text-sm">Dados do Veículo</h4>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Dados do Veículo</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Avarias</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Documentos</label>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Fotos e Vídeos</label>
                          
                          <h4 className="font-bold text-sm pt-4 border-t">Dados do Usuário (Opcional)</h4>
                          <label className="flex items-center gap-2"><input type="checkbox" /> Nome do Cliente</label>
                          <label className="flex items-center gap-2"><input type="checkbox" /> E-mail</label>
                          <label className="flex items-center gap-2"><input type="checkbox" /> WhatsApp</label>
                          
                          <button 
                            onClick={async () => { 
                              // Send messages to all selected buyers
                              for (const buyerId of selectedBuyers) {
                                await supabase.from('internal_messages').insert({
                                  sender_id: (await supabase.auth.getUser()).data.user?.id,
                                  receiver_id: buyerId,
                                  content: `Proposta para o veículo: ${currentLead.marca} ${currentLead.modelo} - ${currentLead.vehicle_code}`
                                });
                              }
                              setShowBuyerConfigModal(false); 
                              setShowSuccessPopup(true); 
                            }} 
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                          >
                            Enviar Relatório
                          </button>
                      </div>
                    </div>
                  </div>
                )}
                {showSuccessPopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-2">Sucesso!</h3>
                      <p className="text-sm text-slate-600 mb-6">Informações enviadas com sucesso.</p>
                      <button onClick={() => setShowSuccessPopup(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Fechar</button>
                    </div>
                  </div>
                )}
                {showDataModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDataModal(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold mb-6">Formulário Completo</h3>
                      
                      {/* Helper to render field groups */}
                      {(() => {
                        const groups = {
                          "Dados do Cliente": ['cliente_nome', 'telefone', 'email'],
                          "Dados do Veículo": ['marca', 'modelo', 'ano_modelo', 'cor', 'quilometragem', 'placa'],
                          "Financeiro": ['valor_fipe', 'desired_value', 'valor_ipva_multa', 'total_parcelas', 'parcelas_pagas', 'parcelas_atrasadas', 'valor_parcela', 'juros_atraso'],
                          "Custos Fixos/Avarias": ['multas', 'valor_ipva', 'motor_reparo', 'cambio_reparo', 'batido_reparo', 'valor_pneus', 'valor_documento']
                        };

                        return Object.entries(groups).map(([groupName, fields]) => (
                          <div key={groupName} className="mb-8">
                            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-2 mb-4">{groupName}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {fields.map(key => (
                                <div key={key} className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{key.replace('_', ' ')}</label>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
                                    {currentLead[key] !== undefined ? String(currentLead[key]) : '-'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                      
                      <button onClick={() => setShowDataModal(false)} className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Fechar</button>
                    </div>
                  </div>
                )}
                <div className="bg-slate-50 p-8 rounded-[32px] space-y-4">
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest border-b border-slate-200 pb-4">Detalhamento da Proposta</h3>
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold">Enviar para Usuário</button>
                    <button onClick={() => setShowBuyerModal(true)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">Enviar para Comprador</button>
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
                      { label: 'IPVA/Multa', key: 'valor_ipva_multa' },
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
