import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Car, Calculator, ArrowRight, Loader2, CheckCircle2, 
  Camera, FileText, AlertCircle, ShieldCheck, Info, Bike, Truck,
  Check, X
} from 'lucide-react';

export default function SellCar() {
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [fipePrice, setFipePrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleType: 'Carros',
    brandId: '',
    modelId: '',
    yearId: '',
    plate: '',
    renavam: '',
    color: '',
    mileage: '',
    
    // History
    hasSinistro: false,
    hasLeilao: false,
    isRecuperado: false,
    hasFurtoRoubo: false,
    damageType: 'Nenhuma / Pequenos Riscos',
    
    // Financial
    isFinanced: false,
    bank: '',
    installmentValue: '',
    installmentsPaid: '',
    installmentsRemaining: '',
    
    // Problems
    hasDelayedFinancing: false,
    hasBuscaApreensao: false,
    hasDelayedIpva: false,
    hasRenajud: false,
    hasBlownEngine: false,
    hasGearboxIssue: false,
    hasCrashDamage: false,
    hasSinistradoLeilao: false,
    
    // Accessories
    accessories: {
      ac: false,
      steering: false,
      windows: false,
      locks: false,
      alarm: false,
      multimedia: false,
      leather: false,
      wheels: false,
      reverseSensor: false,
      reverseCamera: false,
      sunroof: false,
      airbag: false
    },
    
    // Additional Info (Industry Standard)
    hasManualKey: false,
    fullMaintenanceHistory: false,
    tireCondition: 'Bom',
    
    desiredPrice: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerLocation: ''
  });

  useEffect(() => {
    fetchBrands();
  }, [formData.vehicleType]);

  const fetchBrands = async () => {
    const type = formData.vehicleType.toLowerCase();
    const res = await fetch(`/api/fipe/brands?type=${type}`);
    const data = await res.json();
    setBrands(data);
  };

  const handleBrandChange = async (brandId: string) => {
    setFormData(prev => ({ ...prev, brandId, modelId: '', yearId: '' }));
    setModels([]);
    setYears([]);
    setFipePrice('');
    if (!brandId) return;
    
    const type = formData.vehicleType.toLowerCase();
    const res = await fetch(`/api/fipe/models/${brandId}?type=${type}`);
    const data = await res.json();
    setModels(data.modelos);
  };

  const handleModelChange = async (modelId: string) => {
    setFormData(prev => ({ ...prev, modelId, yearId: '' }));
    setYears([]);
    setFipePrice('');
    if (!modelId) return;

    const type = formData.vehicleType.toLowerCase();
    const res = await fetch(`/api/fipe/years/${formData.brandId}/${modelId}?type=${type}`);
    const data = await res.json();
    setYears(data);
  };

  const handleSearchFipe = async () => {
    if (!formData.brandId || !formData.modelId || !formData.yearId) return;
    
    setIsLoading(true);
    try {
      const type = formData.vehicleType.toLowerCase();
      const res = await fetch(`/api/fipe/price/${formData.brandId}/${formData.modelId}/${formData.yearId}?type=${type}`);
      const data = await res.json();
      setFipePrice(data.Valor);
    } catch (error) {
      console.error('Erro ao buscar FIPE:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    let score = 0;
    const total = 12;
    
    if (formData.brandId) score++;
    if (formData.modelId) score++;
    if (formData.yearId) score++;
    if (formData.plate) score++;
    if (formData.ownerName) score++;
    if (formData.ownerPhone) score++;
    if (formData.ownerEmail) score++;
    if (formData.mileage) score++;
    if (formData.color) score++;
    if (formData.desiredPrice) score++;
    if (formData.renavam) score++;
    
    // CRLV photo would be the last 15%
    return Math.min(Math.round((score / total) * 85), 85);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fipePrice })
      });
      if (res.ok) {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black mb-4">Avaliação Enviada!</h2>
          <p className="text-slate-500 mb-8">
            Recebemos seus dados. Nossa equipe analisará as informações e entrará em contato via WhatsApp em até 24 horas com uma oferta real.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-accent transition-all"
          >
            Voltar para Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-black mb-4">Avaliação Completa de Veículo</h1>
          <p className="text-lg text-slate-500">Preencha os dados abaixo para receber uma oferta em até 24h.</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Progresso da Avaliação</span>
            <span className="text-sm font-bold text-slate-900">{calculateProgress()}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              className="h-full bg-accent"
            />
          </div>
          <p className="text-[10px] text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">
            ENVIE A FOTO DO CRLV PARA FINALIZAR E RECEBER O VALOR NA CONTA EM 48H.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* FIPE Consultation */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Search className="w-6 h-6 text-slate-400" />
              <h3 className="text-xl font-bold">Consulta Rápida Tabela FIPE</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Tipo</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                  value={formData.vehicleType}
                  onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                >
                  <option value="Carros">Carros</option>
                  <option value="Motos">Motos</option>
                  <option value="Caminhoes">Caminhões</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Marca</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                  value={formData.brandId}
                  onChange={e => handleBrandChange(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Modelo</label>
                <select 
                  disabled={!formData.brandId}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                  value={formData.modelId}
                  onChange={e => handleModelChange(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Ano</label>
                <select 
                  disabled={!formData.modelId}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                  value={formData.yearId}
                  onChange={e => setFormData({...formData, yearId: e.target.value})}
                >
                  <option value="">Selecione</option>
                  {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleSearchFipe}
              disabled={!formData.yearId || isLoading}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-accent transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar Valor
            </button>

            {fipePrice && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-accent/5 border border-accent/10 rounded-2xl text-center"
              >
                <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Valor FIPE</p>
                <h4 className="text-3xl font-black text-slate-900">{fipePrice}</h4>
              </motion.div>
            )}
          </div>

          {/* CRLV Upload */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Envie o CRLV (Opcional, mas recomendado)</h3>
            <p className="text-sm text-blue-700/70 mb-6 max-w-sm mx-auto">
              Envie uma foto do documento do veículo. Nossa IA preencherá os dados automaticamente para você poupar tempo!
            </p>
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                <Camera className="w-5 h-5" />
                Selecionar Foto do CRLV
              </div>
            </div>
          </div>

          {/* Vehicle Photos */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-slate-400" />
              <h3 className="text-xl font-bold">Fotos do Veículo</h3>
            </div>
            <p className="text-sm text-slate-400 mb-8">Adicione até 10 fotos do seu veículo (frente, traseira, laterais, interior e avarias se houver).</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors cursor-pointer group">
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-accent transition-colors" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Adicionar Foto</span>
              </div>
              <div className="col-span-full text-right">
                <span className="text-[10px] font-bold text-slate-300 uppercase">0/10 fotos adicionadas</span>
              </div>
            </div>
          </div>

          {/* 1. Tipo de Veículo */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">1</span>
              Tipo de Veículo
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'Carros', icon: Car, label: 'Carro' },
                { id: 'Motos', icon: Bike, label: 'Moto' },
                { id: 'Caminhoes', icon: Truck, label: 'Caminhão' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({...formData, vehicleType: type.id})}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${formData.vehicleType === type.id ? 'border-accent bg-accent/5 text-accent' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}
                >
                  <type.icon className="w-8 h-8" />
                  <span className="font-bold text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Identificação */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">2</span>
              Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Marca</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.brandId}
                  onChange={e => handleBrandChange(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Modelo</label>
                <select 
                  disabled={!formData.brandId}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                  value={formData.modelId}
                  onChange={e => handleModelChange(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Ano</label>
                <select 
                  disabled={!formData.modelId}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                  value={formData.yearId}
                  onChange={e => setFormData({...formData, yearId: e.target.value})}
                >
                  <option value="">Selecione</option>
                  {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Detalhes Básicos */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">3</span>
              Detalhes Básicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Placa</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="ABC1D23"
                  value={formData.plate}
                  onChange={e => setFormData({...formData, plate: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Renavam</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="00000000000"
                  value={formData.renavam}
                  onChange={e => setFormData({...formData, renavam: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Cor</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: Prata"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Quilometragem</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: 85000"
                  value={formData.mileage}
                  onChange={e => setFormData({...formData, mileage: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 4. Histórico e Procedência */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">4</span>
              Histórico e Procedência
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { id: 'hasSinistro', label: 'Tem Sinistro?' },
                { id: 'hasLeilao', label: 'Passagem por Leilão?' },
                { id: 'isRecuperado', label: 'Recuperado de Banco?' },
                { id: 'hasFurtoRoubo', label: 'Histórico de Furto/Roubo?' }
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-accent"
                    checked={(formData as any)[item.id]}
                    onChange={e => setFormData({...formData, [item.id]: e.target.checked})}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">Tipo de Monta (Danos)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.damageType}
                onChange={e => setFormData({...formData, damageType: e.target.value})}
              >
                <option value="Nenhuma / Pequenos Riscos">Nenhuma / Pequenos Riscos</option>
                <option value="Pequena Monta">Pequena Monta</option>
                <option value="Média Monta">Média Monta</option>
                <option value="Grande Monta">Grande Monta</option>
              </select>
            </div>
          </div>

          {/* 5. Situação Financeira */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">5</span>
              Situação Financeira
            </h3>
            <p className="text-xs text-slate-400 mb-8">Preencha apenas se o veículo for financiado.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Banco Financiador</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: Santander, BV..."
                  value={formData.bank}
                  onChange={e => setFormData({...formData, bank: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Valor da Parcela</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="0,00"
                  value={formData.installmentValue}
                  onChange={e => setFormData({...formData, installmentValue: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Parcelas Pagas</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="0"
                  value={formData.installmentsPaid}
                  onChange={e => setFormData({...formData, installmentsPaid: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Parcelas Restantes</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="0"
                  value={formData.installmentsRemaining}
                  onChange={e => setFormData({...formData, installmentsRemaining: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 6. Problemas e Avarias */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">6</span>
              Problemas e Avarias
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-400 mb-8">Selecione todas as opções que se aplicam.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'hasDelayedFinancing', label: 'Financiamento Atrasado' },
                { id: 'hasBuscaApreensao', label: 'Busca e Apreensão' },
                { id: 'hasDelayedIpva', label: 'IPVA/Multas Atrasados' },
                { id: 'hasRenajud', label: 'Renajud / Bloqueio Judicial' },
                { id: 'hasBlownEngine', label: 'Motor Fundido / Batendo' },
                { id: 'hasGearboxIssue', label: 'Câmbio com Defeito' },
                { id: 'hasCrashDamage', label: 'Batido / Avariado' },
                { id: 'hasSinistradoLeilao', label: 'Sinistrado / Leilão' }
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-accent"
                    checked={(formData as any)[item.id]}
                    onChange={e => setFormData({...formData, [item.id]: e.target.checked})}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. Acessórios */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">7</span>
              Acessórios
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
              {[
                { id: 'ac', label: 'Ar Condicionado' },
                { id: 'steering', label: 'Direção Hidráulica' },
                { id: 'windows', label: 'Vidros Elétricos' },
                { id: 'locks', label: 'Travas Elétricas' },
                { id: 'alarm', label: 'Alarme' },
                { id: 'multimedia', label: 'Som / Multimídia' },
                { id: 'leather', label: 'Bancos de Couro' },
                { id: 'wheels', label: 'Rodas de Liga Leve' },
                { id: 'reverseSensor', label: 'Sensor de Ré' },
                { id: 'reverseCamera', label: 'Câmera de Ré' },
                { id: 'sunroof', label: 'Teto Solar' },
                { id: 'airbag', label: 'Airbag' }
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-accent"
                    checked={(formData.accessories as any)[item.id]}
                    onChange={e => setFormData({
                      ...formData, 
                      accessories: { ...formData.accessories, [item.id]: e.target.checked }
                    })}
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 8. Valor Desejado */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">8</span>
              Valor Desejado
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Quanto você quer no carro?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xl text-slate-900"
                    placeholder="0,00"
                    value={formData.desiredPrice}
                    onChange={e => setFormData({...formData, desiredPrice: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-1">Lembre-se: descontaremos o valor das dívidas e reparos necessários.</p>
              </div>
            </div>
          </div>

          {/* 9. Seus Dados */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center text-xs">9</span>
              Seus Dados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Nome Completo</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Seu nome aqui"
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Telefone / WhatsApp</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="(11) 99999-9999"
                  value={formData.ownerPhone}
                  onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Email</label>
                <input 
                  type="email"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="seu@email.com"
                  value={formData.ownerEmail}
                  onChange={e => setFormData({...formData, ownerEmail: e.target.value})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Cidade / Estado</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: São Paulo - SP"
                  value={formData.ownerLocation}
                  onChange={e => setFormData({...formData, ownerLocation: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Additional Info (Industry Standard) */}
          <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Informações Adicionais (Valoriza seu carro)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-accent"
                  checked={formData.hasManualKey}
                  onChange={e => setFormData({...formData, hasManualKey: e.target.checked})}
                />
                <span className="text-sm font-medium">Possui Chave Reserva e Manual?</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-accent"
                  checked={formData.fullMaintenanceHistory}
                  onChange={e => setFormData({...formData, fullMaintenanceHistory: e.target.checked})}
                />
                <span className="text-sm font-medium">Todas as revisões em dia?</span>
              </label>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-white/40 ml-1">Estado Geral dos Pneus</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Novos', 'Bom', 'Regular'].map(state => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setFormData({...formData, tireCondition: state})}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${formData.tireCondition === state ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 bg-accent text-white rounded-[32px] font-black text-xl shadow-2xl shadow-accent/40 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  Enviar Avaliação Completa
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
            <p className="text-center text-slate-400 text-xs mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Seus dados estão protegidos pela LGPD.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
