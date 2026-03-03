import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Loader2, Camera, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SellModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // FIPE Data
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [fipePrice, setFipePrice] = useState<string>('');

  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    brand: '',
    brandId: '',
    model: '',
    modelId: '',
    year: '',
    yearId: '',
    color: '',
    mileage: '',
    plate: '',
    renavam: '',
    details: '',
    has_ac: false,
    has_steering: false,
    has_leather: false,
    fipe_price: 0,
    desired_price: '',
    situation: 'normal',
    media_urls: []
  });

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openSellModal', handleOpen);
    window.addEventListener('open-sell-modal', handleOpen); // Keep compatibility
    return () => {
      window.removeEventListener('openSellModal', handleOpen);
      window.removeEventListener('open-sell-modal', handleOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/fipe/brands').then(res => res.json()).then(setBrands);
    }
  }, [isOpen]);

  const handleBrandChange = async (brandId: string) => {
    const brand = brands.find(b => b.codigo === brandId);
    setFormData({ ...formData, brandId, brand: brand?.nome || '', model: '', modelId: '', year: '', yearId: '' });
    const res = await fetch(`/api/fipe/models/${brandId}`);
    const data = await res.json();
    setModels(data.modelos);
  };

  const handleModelChange = async (modelId: string) => {
    const model = models.find(m => m.codigo.toString() === modelId);
    setFormData({ ...formData, modelId, model: model?.nome || '', year: '', yearId: '' });
    const res = await fetch(`/api/fipe/years/${formData.brandId}/${modelId}`);
    const data = await res.json();
    setYears(data);
  };

  const handleYearChange = async (yearId: string) => {
    const year = years.find(y => y.codigo === yearId);
    setFormData({ ...formData, yearId, year: year?.nome || '' });
    const res = await fetch(`/api/fipe/price/${formData.brandId}/${formData.modelId}/${yearId}`);
    const data = await res.json();
    setFipePrice(data.Valor);
    setFormData(prev => ({ ...prev, fipe_price: parseFloat(data.Valor.replace(/[^\d,]/g, '').replace(',', '.')) }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('leads_veiculos').insert([{
        cliente_nome: formData.owner_name,
        telefone: formData.owner_phone,
        marca: formData.brand,
        modelo: formData.model,
        ano_modelo: formData.year,
        cor: formData.color,
        mileage: parseInt(formData.mileage) || 0,
        placa: formData.plate,
        renavam: formData.renavam,
        valor_fipe: formData.fipe_price,
        preco_cliente: parseFloat(formData.desired_price) || 0,
        status: 'novo',
        observacoes: `Situação: ${formData.situation}. Acessórios: ${[formData.has_ac ? 'Ar' : '', formData.has_steering ? 'Direção' : '', formData.has_leather ? 'Couro' : ''].filter(Boolean).join(', ')}`
      }]);

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setStep(1);
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar proposta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-display text-2xl font-bold">Venda seu Carro</h3>
                <p className="text-slate-500 text-sm">Compramos mesmo com dívidas ou problemas mecânicos.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {isSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Proposta Recebida!</h4>
                  <p className="text-slate-500">Nossa equipe analisará os dados e entrará em contato em breve.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? 'bg-accent' : 'bg-slate-100'}`} />
                    ))}
                  </div>

                  {step === 1 && (
                    <div className="space-y-6">
                      <h4 className="font-display text-lg font-bold">Informações do Veículo (FIPE)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Marca</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                            value={formData.brandId}
                            onChange={e => handleBrandChange(e.target.value)}
                          >
                            <option value="">Selecione a Marca</option>
                            {brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Modelo</label>
                          <select 
                            disabled={!formData.brandId}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none disabled:opacity-50"
                            value={formData.modelId}
                            onChange={e => handleModelChange(e.target.value)}
                          >
                            <option value="">Selecione o Modelo</option>
                            {models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ano</label>
                          <select 
                            disabled={!formData.modelId}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none disabled:opacity-50"
                            value={formData.yearId}
                            onChange={e => handleYearChange(e.target.value)}
                          >
                            <option value="">Selecione o Ano</option>
                            {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Preço Tabela FIPE</label>
                          <input 
                            readOnly
                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold"
                            value={fipePrice}
                            placeholder="R$ 0,00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <h4 className="font-display text-lg font-bold">Detalhes e Acessórios</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cor</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="Ex: Prata"
                            value={formData.color}
                            onChange={e => setFormData({...formData, color: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Kilometragem</label>
                          <input 
                            type="number"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="Ex: 50000"
                            value={formData.mileage}
                            onChange={e => setFormData({...formData, mileage: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_ac} onChange={e => setFormData({...formData, has_ac: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Ar Condicionado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_steering} onChange={e => setFormData({...formData, has_steering: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Direção Hidráulica</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_leather} onChange={e => setFormData({...formData, has_leather: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Bancos de Couro</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <h4 className="font-display text-lg font-bold">Documentação e Situação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Placa</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="ABC-1234"
                            value={formData.plate}
                            onChange={e => setFormData({...formData, plate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">RENAVAM</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="00000000000"
                            value={formData.renavam}
                            onChange={e => setFormData({...formData, renavam: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Situação do Veículo</label>
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                          value={formData.situation}
                          onChange={e => setFormData({...formData, situation: e.target.value})}
                        >
                          <option value="normal">Normal (Sem dívidas ou problemas)</option>
                          <option value="debt">Financiamento Atrasado</option>
                          <option value="renajud">RENAJUD / Bloqueio Judicial</option>
                          <option value="busca_apreensao">Busca e Apreensão</option>
                          <option value="engine_blown">Motor Estourado / Problema Mecânico</option>
                          <option value="maintenance_needed">Manutenção Pendente</option>
                          <option value="future_payoff">Futura Quitação</option>
                        </select>
                      </div>
                      {formData.situation !== 'normal' && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <p className="text-sm text-amber-800">
                            <strong>Fique tranquilo!</strong> Nós assumimos a dívida ou o problema e limpamos seu nome.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <h4 className="font-display text-lg font-bold">Contato e Valor Desejado</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Seu Nome</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="Nome completo"
                            value={formData.owner_name}
                            onChange={e => setFormData({...formData, owner_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">WhatsApp</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="(00) 00000-0000"
                            value={formData.owner_phone}
                            onChange={e => setFormData({...formData, owner_phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Valor que você deseja receber (R$)</label>
                        <input 
                          type="number"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-accent"
                          placeholder="Ex: 45000"
                          value={formData.desired_price}
                          onChange={e => setFormData({...formData, desired_price: e.target.value})}
                        />
                      </div>
                      <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors cursor-pointer group">
                        <Camera className="w-8 h-8 text-slate-300 group-hover:text-accent transition-colors" />
                        <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600">Upload de Fotos e Vídeos</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Arraste ou clique aqui</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!isSuccess && (
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button 
                  disabled={step === 1}
                  onClick={prevStep}
                  className="px-6 py-3 text-slate-600 font-bold flex items-center gap-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
                {step < 4 ? (
                  <button 
                    onClick={nextStep}
                    className="px-8 py-3 bg-accent text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-all"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Proposta'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
