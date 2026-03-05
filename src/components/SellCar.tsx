import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Car, Calculator, ArrowRight, Loader2, CheckCircle2, 
  Camera, FileText, AlertCircle, ShieldCheck, Info, Bike, Truck,
  Check, X, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SellCar() {
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [fipePrice, setFipePrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    vehicleType: 'Carros',
    brandId: '',
    brandName: '',
    modelId: '',
    modelName: '',
    yearId: '',
    yearName: '',
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
    situacaoFinanceira: '',
    entrada: '',
    
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
    ownerPhoneConfirm: '',
    ownerEmail: '',
    ownerEmailConfirm: '',
    ownerLocation: '',
    authorizeNotifications: false
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
    const brandName = brands.find(b => b.codigo === brandId)?.nome || '';
    setFormData(prev => ({ ...prev, brandId, brandName, modelId: '', modelName: '', yearId: '', yearName: '' }));
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
    const modelName = models.find(m => m.codigo.toString() === modelId)?.nome || '';
    setFormData(prev => ({ ...prev, modelId, modelName, yearId: '', yearName: '' }));
    setYears([]);
    setFipePrice('');
    if (!modelId) return;

    const type = formData.vehicleType.toLowerCase();
    const res = await fetch(`/api/fipe/years/${formData.brandId}/${modelId}?type=${type}`);
    const data = await res.json();
    setYears(data);
  };

  const handleSearchFipe = async (yearId: string) => {
    if (!formData.brandId || !formData.modelId || !yearId) return;
    
    setIsLoading(true);
    try {
      const type = formData.vehicleType.toLowerCase();
      const res = await fetch(`/api/fipe/price/${formData.brandId}/${formData.modelId}/${yearId}?type=${type}`);
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
    const total = 10;
    
    if (formData.brandId) score++;
    if (formData.modelId) score++;
    if (formData.yearId) score++;
    if (formData.ownerName) score++;
    if (formData.ownerPhone) score++;
    if (formData.ownerEmail) score++;
    if (formData.mileage) score++;
    if (formData.color) score++;
    if (formData.desiredPrice) score++;
    
    // CRLV photo would be the last 15%
    return Math.min(Math.round((score / total) * 85), 85);
  };

  // Helper para formatar moeda
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper para formatar quilometragem
  const formatMileage = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.brandId) errors.push("Tipo de Veículo (Marca)");
    if (!formData.modelId) errors.push("Tipo de Veículo (Modelo)");
    if (!formData.yearId) errors.push("Tipo de Veículo (Ano)");
    if (!formData.color) errors.push("Detalhes Básicos (Cor)");
    if (!formData.mileage) errors.push("Detalhes Básicos (Quilometragem)");
    if (!formData.desiredPrice) errors.push("Valor Desejado");
    if (!formData.ownerName) errors.push("Seus Dados (Nome)");
    if (!formData.ownerPhone) errors.push("Seus Dados (Telefone)");
    if (!formData.ownerEmail) errors.push("Seus Dados (Email)");
    if (!formData.ownerLocation) errors.push("Seus Dados (Cidade/Estado)");
    
    if (photos.length < 5) errors.push("Fotos do Veículo (Mínimo 5)");
    
    if (formData.ownerEmail && formData.ownerEmailConfirm && formData.ownerEmail !== formData.ownerEmailConfirm) {
      errors.push("Confirmação de Email não confere");
    }
    if (formData.ownerPhone && formData.ownerPhoneConfirm && formData.ownerPhone !== formData.ownerPhoneConfirm) {
      errors.push("Confirmação de Telefone não confere");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors);
      setErrorModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare problems array
      const problems = [];
      if (formData.hasDelayedFinancing) problems.push('Financiamento Atrasado');
      if (formData.hasBuscaApreensao) problems.push('Busca e Apreensão');
      if (formData.hasDelayedIpva) problems.push('IPVA/Multas Atrasados');
      if (formData.hasRenajud) problems.push('Renajud / Bloqueio Judicial');
      if (formData.hasBlownEngine) problems.push('Motor Fundido / Batendo');
      if (formData.hasGearboxIssue) problems.push('Câmbio com Defeito');
      if (formData.hasCrashDamage) problems.push('Batido / Avariado');
      if (formData.hasSinistradoLeilao) problems.push('Sinistrado / Leilão');

      const { error } = await supabase.from('leads_veiculos').insert([{
        cliente_nome: formData.ownerName,
        telefone: formData.ownerPhone,
        email: formData.ownerEmail,
        marca: formData.brandName || formData.brandId,
        modelo: formData.modelName || formData.modelId,
        ano_modelo: formData.yearName || formData.yearId,
        cor: formData.color,
        quilometragem: parseInt(formData.mileage.replace(/\D/g, '')) || 0,
        placa: '',
        renavam: '',
        valor_fipe: parseFloat(fipePrice.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        preco_cliente: parseFloat(formData.desiredPrice.replace(/\./g, '').replace(',', '.')) || 0,
        status: 'novo',
        observacoes: `Localização: ${formData.ownerLocation}. Danos: ${formData.damageType}. Acessórios: ${Object.entries(formData.accessories).filter(([_, v]) => v).map(([k]) => k).join(', ')}`,
        entrada: parseFloat(formData.entrada.replace(/\./g, '').replace(',', '.')) || 0,
        situacao_financeira: formData.situacaoFinanceira,
        problemas: problems,
        notifications_enabled: formData.authorizeNotifications
      }]);

      if (error) throw error;

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error(error);
      setErrorMessage([`Erro ao enviar avaliação: ${error.message || 'Tente novamente.'}`]);
      setErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleType: 'Carros',
      brandId: '',
      brandName: '',
      modelId: '',
      modelName: '',
      yearId: '',
      yearName: '',
      plate: '',
      renavam: '',
      color: '',
      mileage: '',
      hasSinistro: false,
      hasLeilao: false,
      isRecuperado: false,
      hasFurtoRoubo: false,
      damageType: 'Nenhuma / Pequenos Riscos',
      isFinanced: false,
      bank: '',
      installmentValue: '',
      installmentsPaid: '',
      installmentsRemaining: '',
      situacaoFinanceira: '',
      entrada: '',
      hasDelayedFinancing: false,
      hasBuscaApreensao: false,
      hasDelayedIpva: false,
      hasRenajud: false,
      hasBlownEngine: false,
      hasGearboxIssue: false,
      hasCrashDamage: false,
      hasSinistradoLeilao: false,
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
      hasManualKey: false,
      fullMaintenanceHistory: false,
      tireCondition: 'Bom',
      desiredPrice: '',
      ownerName: '',
      ownerPhone: '',
      ownerPhoneConfirm: '',
      ownerEmail: '',
      ownerEmailConfirm: '',
      ownerLocation: '',
      authorizeNotifications: false
    });
    setPhotos([]);
    setVideos([]);
    setIsSuccess(false);
    setFipePrice('');
    setModels([]);
    setYears([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <h2 className="text-3xl font-black mb-4">Envio com sucesso!</h2>
          <p className="text-slate-500 mb-8">
            Recebemos seus dados. Nossa equipe analisará as informações e entrará em contato via WhatsApp em até 24 horas com uma oferta real.
          </p>
          <div className="space-y-4">
            <button 
              onClick={resetForm}
              className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-accent/20"
            >
              Avaliar outro veículo
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Voltar para Home
            </button>
          </div>
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
                  onChange={e => {
                    const yearId = e.target.value;
                    const yearName = years.find(y => y.codigo === yearId)?.nome || '';
                    setFormData(prev => ({...prev, yearId, yearName}));
                    if (yearId) {
                      handleSearchFipe(yearId);
                    }
                  }}
                >
                  <option value="">Selecione</option>
                  {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                </select>
              </div>
            </div>

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
              <h3 className="text-xl font-bold">Fotos do Veículo (Mínimo 5)</h3>
            </div>
            <p className="text-sm text-slate-400 mb-8">Adicione até 10 fotos do seu veículo (frente, traseira, laterais, interior e avarias se houver).</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200">
                  <img src={URL.createObjectURL(photo)} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors cursor-pointer group relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newPhotos = Array.from(e.target.files);
                        setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
                      }
                    }}
                  />
                  <Camera className="w-6 h-6 text-slate-300 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase text-center px-2">Adicionar Foto</span>
                </label>
              )}
              <div className="col-span-full text-right">
                <span className={`text-[10px] font-bold uppercase ${photos.length >= 5 ? 'text-green-500' : 'text-red-500'}`}>
                  {photos.length}/10 fotos adicionadas (Mínimo 5)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8 mb-4">
              <Video className="w-6 h-6 text-slate-400" />
              <h3 className="text-xl font-bold">Vídeos do Veículo (Opcional)</h3>
            </div>
            <p className="text-sm text-slate-400 mb-8">Adicione até 5 vídeos do seu veículo (máximo 20 segundos cada).</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {videos.map((video, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <video 
                    src={URL.createObjectURL(video)} 
                    className="w-full h-full object-cover" 
                    controls 
                  />
                  <button 
                    type="button"
                    onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {videos.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors cursor-pointer group relative">
                  <input 
                    type="file" 
                    accept="video/*" 
                    multiple 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newVideos = Array.from(e.target.files);
                        newVideos.forEach(file => {
                          const video = document.createElement('video');
                          video.preload = 'metadata';
                          video.onloadedmetadata = () => {
                            window.URL.revokeObjectURL(video.src);
                            if (video.duration > 20) {
                              alert("O vídeo excede 20 segundos. Carregando apenas os primeiros 20 segundos.");
                            }
                          };
                          video.src = URL.createObjectURL(file);
                        });
                        setVideos(prev => [...prev, ...newVideos].slice(0, 5));
                      }
                    }}
                  />
                  <Video className="w-6 h-6 text-slate-300 group-hover:text-accent transition-colors" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase text-center px-2">Adicionar Vídeo</span>
                </label>
              )}
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
                <label className="text-xs font-bold text-slate-400 ml-1">Marca *</label>
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
                <label className="text-xs font-bold text-slate-400 ml-1">Modelo *</label>
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
                <label className="text-xs font-bold text-slate-400 ml-1">Ano *</label>
                <select 
                  disabled={!formData.modelId}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50"
                  value={formData.yearId}
                  onChange={e => {
                    const yearId = e.target.value;
                    const yearName = years.find(y => y.codigo === yearId)?.nome || '';
                    setFormData(prev => ({...prev, yearId, yearName}));
                    if (yearId) {
                      handleSearchFipe(yearId);
                    }
                  }}
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
                <label className="text-xs font-bold text-slate-400 ml-1">Cor *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: Prata"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Quilometragem (km) *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: 85.000"
                  value={formData.mileage}
                  onChange={e => setFormData({...formData, mileage: formatMileage(e.target.value)})}
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
                  onChange={e => handleCurrencyChange('installmentValue', e.target.value)}
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Valor de Entrada (Quanto deu?)</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="R$ 0,00"
                  value={formData.entrada}
                  onChange={e => handleCurrencyChange('entrada', e.target.value)}
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
                <label className="text-xs font-bold text-slate-400 ml-1">Quanto você quer no carro? *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xl text-slate-900"
                    placeholder="0,00"
                    value={formData.desiredPrice}
                    onChange={e => handleCurrencyChange('desiredPrice', e.target.value)}
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
                <label className="text-xs font-bold text-slate-400 ml-1">Nome Completo *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Seu nome aqui"
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Telefone / WhatsApp *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="(11) 99999-9999"
                  value={formData.ownerPhone}
                  onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Confirmar Telefone / WhatsApp *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="(11) 99999-9999"
                  value={formData.ownerPhoneConfirm}
                  onChange={e => setFormData({...formData, ownerPhoneConfirm: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Email *</label>
                <input 
                  type="email"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="seu@email.com"
                  value={formData.ownerEmail}
                  onChange={e => setFormData({...formData, ownerEmail: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Confirmar Email *</label>
                <input 
                  type="email"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="seu@email.com"
                  value={formData.ownerEmailConfirm}
                  onChange={e => setFormData({...formData, ownerEmailConfirm: e.target.value})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Cidade / Estado *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: São Paulo - SP"
                  value={formData.ownerLocation}
                  onChange={e => setFormData({...formData, ownerLocation: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-accent"
                    checked={formData.authorizeNotifications}
                    onChange={e => setFormData({...formData, authorizeNotifications: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Aceito receber a proposta e notificações através do chat deste site.
                  </span>
                </label>
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

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4 text-slate-900">Atenção</h3>
            <div className="text-slate-500 text-left mb-8 space-y-2">
              <p className="font-medium text-center mb-4">Por favor, preencha os campos obrigatórios:</p>
              <ul className="space-y-2 text-sm">
                {Array.isArray(errorMessage) ? errorMessage.map((error, index) => (
                  <li key={index} className="flex items-center gap-2 text-red-500 font-medium">
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    {error}
                  </li>
                )) : (
                  <li className="flex items-center gap-2 text-red-500 font-medium">
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    {errorMessage}
                  </li>
                )}
              </ul>
            </div>
            <button
              onClick={() => setErrorModalOpen(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Entendi, vou corrigir
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
