import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Loader2, Camera, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logToStorage } from '../lib/logger';
import { useAuth } from '../lib/authContext';
import { triggerAdsConversion } from './GoogleTags';
import AuthModal from './AuthModal';

export default function SellModal() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
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
    email: '',
    cpf: '',
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
    chassi: '',
    details: '',
    has_ac: false,
    has_steering: false,
    has_leather: false,
    has_vidros: false,
    has_travas: false,
    has_alarme: false,
    has_som: false,
    has_rodas: false,
    has_sensor: false,
    has_camera: false,
    has_teto: false,
    has_airbag: false,
    has_chave: false,
    has_revisoes: false,
    estado_pneus: 'bom',
    hist_procedencia: '',
    sinistro: '',
    recup_banco: '',
    leilao: '',
    furto_roubo: '',
    busca_apreensao: '',
    is_financiamento_atrasado: false,
    is_busca_apreensao: false,
    is_ipva_multas_atrasados: false,
    is_renajud: false,
    is_motor_fundido: false,
    is_cambio_defeito: false,
    is_batido_avariado: false,
    is_sinistrado_leilao: false,
    fipe_price: 0,
    desired_price: '',
    entrada: '',
    situation: 'normal',
    media_urls: [],
    multas: '',
    motor_reparo: '',
    cambio_reparo: '',
    batido_reparo: ''
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
    logToStorage('Iniciando submissão de formulário de venda', 'info', formData);
    console.log("formData antes do insert:", formData);
    try {
      const yearNumber = parseInt(formData.year.substring(0, 4)) || 0;

      // Check for existing "frio" lead for this user to update it instead of creating a new one
      const { data: existingFrioLead } = await supabase
        .from('leads_veiculos')
        .select('id')
        .eq('email', formData.email)
        .eq('status', 'frio')
        .maybeSingle();

      const leadData = {
        cliente_nome: formData.owner_name,
        telefone: formData.owner_phone,
        marca: formData.brand,
        modelo: formData.model,
        ano_modelo: yearNumber,
        cor: formData.color,
        quilometragem: parseInt(formData.mileage) || 0,
        placa: formData.plate,
        renavam: formData.renavam,
        valor_fipe: formData.fipe_price,
        desired_value: parseFloat(formData.desired_price) || 0,
        entrada: parseFloat(formData.entrada) || 0,
        status: 'proposta_enviada', // Mudar para 'proposta_enviada' (Leads Morna)
        classificacao: 'morna',
        email: formData.email,
        cpf: formData.cpf,
        chassi: formData.chassi,
        ano_fabricacao: yearNumber,
        multas: parseFloat(formData.multas) || 0,
        motor_reparo: parseFloat(formData.motor_reparo) || 0,
        cambio_reparo: parseFloat(formData.cambio_reparo) || 0,
        batido_reparo: parseFloat(formData.batido_reparo) || 0,
        ar_condicionado: formData.has_ac ? 'sim' : 'nao',
        direcao_hidraulica: formData.has_steering ? 'sim' : 'nao',
        bancos_couro: formData.has_leather ? 'sim' : 'nao',
        vidros_eletricos: formData.has_vidros ? 'sim' : 'nao',
        travas_eletricas: formData.has_travas ? 'sim' : 'nao',
        alarme: formData.has_alarme ? 'sim' : 'nao',
        som_multimidia: formData.has_som ? 'sim' : 'nao',
        rodas_liga_leve: formData.has_rodas ? 'sim' : 'nao',
        sensor_re: formData.has_sensor ? 'sim' : 'nao',
        camera_re: formData.has_camera ? 'sim' : 'nao',
        teto_solar: formData.has_teto ? 'sim' : 'nao',
        airbag: formData.has_airbag ? 'sim' : 'nao',
        chave_reserva: formData.has_chave ? 'sim' : 'nao',
        revisoes_dia: formData.has_revisoes ? 'sim' : 'nao',
        estado_pneus: formData.estado_pneus,
        hist_procedencia: formData.hist_procedencia,
        sinistro: formData.sinistro,
        recup_banco: formData.recup_banco,
        leilao: formData.leilao,
        furto_roubo: formData.furto_roubo,
        busca_apreensao: formData.busca_apreensao,
        is_financiamento_atrasado: formData.is_financiamento_atrasado ? 'sim' : 'nao',
        is_busca_apreensao: formData.is_busca_apreensao ? 'sim' : 'nao',
        is_ipva_multas_atrasados: formData.is_ipva_multas_atrasados ? 'sim' : 'nao',
        is_renajud: formData.is_renajud ? 'sim' : 'nao',
        is_motor_fundido: formData.is_motor_fundido ? 'sim' : 'nao',
        is_cambio_defeito: formData.is_cambio_defeito ? 'sim' : 'nao',
        is_batido_avariado: formData.is_batido_avariado ? 'sim' : 'nao',
        is_sinistrado_leilao: formData.is_sinistrado_leilao ? 'sim' : 'nao',
        data_negociacao: new Date().toISOString(),
        juros_atraso: 2,
        origem: 'formulario',
        updated_at: new Date().toISOString()
      };

      let error;
      if (existingFrioLead) {
        console.log("[SellModal] Updating existing cold lead:", existingFrioLead.id);
        const { error: updateError } = await supabase
          .from('leads_veiculos')
          .update(leadData)
          .eq('id', existingFrioLead.id);
        error = updateError;
      } else {
        console.log("[SellModal] Creating new lead (Morna)");
        const { error: insertError } = await supabase
          .from('leads_veiculos')
          .insert([leadData]);
        error = insertError;
      }

      if (error) {
        logToStorage('Erro ao salvar lead no Supabase', 'error', error);
        throw error;
      }

      logToStorage('Lead salvo com sucesso!', 'info');
      // Trigger Google Ads Conversion
      triggerAdsConversion();

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setStep(1);
        setIsSuccess(false);
        window.history.pushState({}, '', '/obrigado');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 2000);
    } catch (error) {
      logToStorage('Exceção capturada no handleSubmit', 'error', error);
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
              {!user ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Autenticação Necessária</h4>
                  <p className="text-slate-500 mb-8">Você precisa estar logado para solicitar uma avaliação.</p>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                  >
                    Entrar ou Cadastrar-se
                  </button>
                  <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
                </div>
              ) : isSuccess ? (
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
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_vidros} onChange={e => setFormData({...formData, has_vidros: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Vidros Elétricos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_travas} onChange={e => setFormData({...formData, has_travas: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Travas Elétricas</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_alarme} onChange={e => setFormData({...formData, has_alarme: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Alarme</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_som} onChange={e => setFormData({...formData, has_som: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Som / Multimídia</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_rodas} onChange={e => setFormData({...formData, has_rodas: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Rodas de Liga Leve</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_sensor} onChange={e => setFormData({...formData, has_sensor: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Sensor de Ré</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_camera} onChange={e => setFormData({...formData, has_camera: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Câmera de Ré</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_teto} onChange={e => setFormData({...formData, has_teto: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Teto Solar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_airbag} onChange={e => setFormData({...formData, has_airbag: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Airbag</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_chave} onChange={e => setFormData({...formData, has_chave: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Chave Reserva</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.has_revisoes} onChange={e => setFormData({...formData, has_revisoes: e.target.checked})} className="w-5 h-5 accent-accent" />
                          <span className="text-sm font-medium">Revisões em dia</span>
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
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Histórico de Procedência</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.hist_procedencia} onChange={e => setFormData({...formData, hist_procedencia: e.target.value})}>
                          <option value="">Selecione...</option>
                          <option value="unico_dono">Único Dono</option>
                          <option value="segundo_dono">Segundo Dono</option>
                          <option value="terceiro_dono">Terceiro Dono ou mais</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Sinistro</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.sinistro} onChange={e => setFormData({...formData, sinistro: e.target.value})}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Recuperação de Banco</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.recup_banco} onChange={e => setFormData({...formData, recup_banco: e.target.value})}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Passagem por Leilão</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.leilao} onChange={e => setFormData({...formData, leilao: e.target.value})}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Histórico de Furto ou Roubo</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.furto_roubo} onChange={e => setFormData({...formData, furto_roubo: e.target.value})}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Busca e Apreensão</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.busca_apreensao} onChange={e => setFormData({...formData, busca_apreensao: e.target.value})}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Valor de Entrada (R$)</label>
                          <input 
                            type="number"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-blue-600"
                            placeholder="Ex: 10000"
                            value={formData.entrada}
                            onChange={e => setFormData({...formData, entrada: e.target.value})}
                          />
                        </div>
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

            {!isSuccess && user && (
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
