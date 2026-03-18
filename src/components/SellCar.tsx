import { useState, useEffect } from 'react';
import { 
  Search, Car, Calculator, ArrowRight, Loader2, CheckCircle2, 
  Camera, FileText, AlertCircle, ShieldCheck, Info, Bike, Truck,
  Check, X, Video, Wrench
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { triggerAdsConversion } from './GoogleTags';
import AuthModal from './AuthModal';

export default function SellCar() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
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
  const [showIpvaModal, setShowIpvaModal] = useState(false);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [showGearboxModal, setShowGearboxModal] = useState(false);
  
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
    ano_fabricacao: '',
    
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
    parcelasAtrasadas: '',
    situacaoFinanceira: '',
    entrada: '',
    
    // Problems
    hasDelayedFinancing: false,
    hasBuscaApreensao: false,
    hasDelayedIpva: false,
    ipvaValue: '',
    hasRenajud: false,
    hasBlownEngine: false,
    engineRepairValue: '',
    hasGearboxIssue: false,
    gearboxRepairValue: '',
    hasCrashDamage: false,
    bodyRepairValue: '',
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
    authorizeNotifications: true
  });

  useEffect(() => {
    fetchBrands();
  }, [formData.vehicleType]);

  const fetchBrands = async () => {
    const type = formData.vehicleType.toLowerCase();
    console.log(`[FIPE] Solicitando marcas para: ${type}`);
    try {
      const res = await fetch(`/api/fipe/brands?type=${type}`);
      const data = await res.json();
      console.log(`[FIPE] Marcas recebidas:`, data);
      if (Array.isArray(data)) {
        setBrands(data);
      } else {
        console.error('[FIPE] Formato de marcas inválido:', data);
        setBrands([]);
        if (data.error) {
          alert(`Erro na FIPE: ${data.error}. Tente novamente em instantes.`);
        }
      }
    } catch (err) {
      console.error('[FIPE] Erro ao buscar marcas:', err);
      setBrands([]);
    }
  };

  const handleBrandChange = async (brandId: string) => {
    const brandName = brands.find(b => b.codigo === brandId)?.nome || '';
    setFormData(prev => ({ ...prev, brandId, brandName, modelId: '', modelName: '', yearId: '', yearName: '' }));
    setModels([]);
    setYears([]);
    setFipePrice('');
    if (!brandId) return;
    
    const type = formData.vehicleType.toLowerCase();
    console.log(`[FIPE] Solicitando modelos para: ${type}, marca: ${brandId}`);
    try {
      const res = await fetch(`/api/fipe/models/${brandId}?type=${type}`);
      const data = await res.json();
      console.log(`[FIPE] Modelos recebidos:`, data);
      if (data && data.modelos) {
        setModels(data.modelos);
      } else {
        console.error('[FIPE] Formato de modelos inválido:', data);
        setModels([]);
      }
    } catch (err) {
      console.error('[FIPE] Erro ao buscar modelos:', err);
      setModels([]);
    }
  };

  const handleModelChange = async (modelId: string) => {
    const modelName = models.find(m => m.codigo.toString() === modelId)?.nome || '';
    setFormData(prev => ({ ...prev, modelId, modelName, yearId: '', yearName: '' }));
    setYears([]);
    setFipePrice('');
    if (!modelId) return;

    const type = formData.vehicleType.toLowerCase();
    console.log(`[FIPE] Solicitando anos para: ${type}, marca: ${formData.brandId}, modelo: ${modelId}`);
    try {
      const res = await fetch(`/api/fipe/years/${formData.brandId}/${modelId}?type=${type}`);
      const data = await res.json();
      console.log(`[FIPE] Anos recebidos:`, data);
      if (Array.isArray(data)) {
        setYears(data);
      } else {
        console.error('[FIPE] Formato de anos inválido:', data);
        setYears([]);
      }
    } catch (err) {
      console.error('[FIPE] Erro ao buscar anos:', err);
      setYears([]);
    }
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
    
    // Required fields validation
    if (!formData.brandId) errors.push("Tipo de Veículo (Marca)");
    if (!formData.modelId) errors.push("Tipo de Veículo (Modelo)");
    if (!formData.yearId) errors.push("Tipo de Veículo (Ano)");
    if (!formData.color) errors.push("Detalhes Básicos (Cor)");
    if (!formData.mileage) errors.push("Detalhes Básicos (Quilometragem)");
    if (!formData.ano_fabricacao) errors.push("Detalhes Básicos (Ano de Fabricação)");
    if (!formData.desiredPrice) errors.push("Valor Desejado");
    if (!formData.ownerName) errors.push("Seus Dados (Nome)");
    if (!formData.ownerPhone) errors.push("Seus Dados (Telefone)");
    if (!formData.ownerEmail) errors.push("Seus Dados (Email)");
    if (!formData.ownerLocation) errors.push("Seus Dados (Cidade/Estado)");
    
    // Format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.ownerEmail && !emailRegex.test(formData.ownerEmail)) {
      errors.push("Formato de Email inválido");
    }

    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    const cleanPhone = formData.ownerPhone.replace(/\D/g, '');
    if (formData.ownerPhone && cleanPhone.length < 10) {
      errors.push("Telefone inválido (mínimo 10 dígitos)");
    }

    // Numeric validations
    const cleanMileage = parseInt(formData.mileage.replace(/\D/g, ''));
    if (formData.mileage && isNaN(cleanMileage)) {
      errors.push("Quilometragem deve ser um número válido");
    }

    const cleanPrice = parseFloat(formData.desiredPrice.replace(/\./g, '').replace(',', '.'));
    if (formData.desiredPrice && (isNaN(cleanPrice) || cleanPrice <= 0)) {
      errors.push("Valor Desejado deve ser um número válido maior que zero");
    }
    
    if (photos.length < 5) errors.push("Fotos do Veículo (Mínimo 5)");
    
    if (formData.ownerEmail && formData.ownerEmailConfirm && formData.ownerEmail !== formData.ownerEmailConfirm) {
      errors.push("Confirmação de Email não confere");
    }
    if (formData.ownerPhone && formData.ownerPhoneConfirm && formData.ownerPhone !== formData.ownerPhoneConfirm) {
      errors.push("Confirmação de Telefone não confere");
    }

    return errors;
  };

  // Gerenciar previews de fotos com useEffect para evitar vazamento de memória
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [crlvPreview, setCrlvPreview] = useState<string | null>(null);

  useEffect(() => {
    const newPreviews = photos.map(photo => URL.createObjectURL(photo));
    setPhotoPreviews(newPreviews);
    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [photos]);

  useEffect(() => {
    const newPreviews = videos.map(video => URL.createObjectURL(video));
    setVideoPreviews(newPreviews);
    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [videos]);

  useEffect(() => {
    if (!crlvFile) {
      setCrlvPreview(null);
      return;
    }
    
    // Check if it's an image by type or extension
    const isImage = crlvFile.type.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(crlvFile.name);
                    
    if (isImage) {
      const url = URL.createObjectURL(crlvFile);
      setCrlvPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      // For PDFs or other files
      setCrlvPreview('pdf-placeholder');
    }
  }, [crlvFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors);
      setErrorModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    
    // Prepare problems array
    const problems: string[] = [];
    if (formData.hasDelayedFinancing) problems.push('Financiamento Atrasado');
    if (formData.hasBuscaApreensao) problems.push('Busca e Apreensão');
    if (formData.hasDelayedIpva) problems.push('IPVA/Multas Atrasados');
    if (formData.hasRenajud) problems.push('Renajud / Bloqueio Judicial');
    if (formData.hasBlownEngine) problems.push('Motor Fundido / Batendo');
    if (formData.hasGearboxIssue) problems.push('Câmbio com Defeito');
    if (formData.hasCrashDamage) problems.push('Batido / Avariado');
    if (formData.hasSinistradoLeilao) problems.push('Sinistrado / Leilão');
    if (formData.hasSinistro) problems.push('Sinistro');
    if (formData.hasLeilao) problems.push('Passagem por Leilão');
    if (formData.isRecuperado) problems.push('Recuperado de Banco');
    if (formData.hasFurtoRoubo) problems.push('Histórico de Furto/Roubo');

    try {
      // 1. Upload de Fotos e Vídeos para o Supabase Storage
      const uploadedPhotos: string[] = [];
      const uploadedVideos: string[] = [];

      // Função auxiliar de upload
      const uploadFile = async (file: File, folder: string) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', folder);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Erro na API de upload para ${file.name}:`, errorData);
            return null;
          }

          const data = await response.json();
          return data.publicUrl;
        } catch (e) {
          console.error('Erro no upload:', e);
          return null;
        }
      };

      // Upload Fotos
      for (const photo of photos) {
        const url = await uploadFile(photo, 'fotos');
        if (url) uploadedPhotos.push(url);
      }

      // Upload Vídeos
      for (const video of videos) {
        const url = await uploadFile(video, 'videos');
        if (url) uploadedVideos.push(url);
      }

      // Upload CRLV
      let crlvUrl = null;
      if (crlvFile) {
        crlvUrl = await uploadFile(crlvFile, 'crlv');
      }

      console.log('Enviando dados para Supabase (via API)...');
      
      const leadPayload: any = {
        user_id: user?.id || null,
        cliente_nome: formData.ownerName,
        telefone: formData.ownerPhone,
        email: formData.ownerEmail,
        marca: formData.brandName || formData.brandId,
        modelo: formData.modelName || formData.modelId,
        ano_modelo: parseInt((formData.yearName || formData.yearId || '').replace(/\D/g, '').substring(0, 4)) || 0,
        ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao.replace(/\D/g, '')) : null,
        cor: formData.color,
        quilometragem: parseInt((formData.mileage || '').replace(/\D/g, '')) || 0,
        placa: formData.plate,
        renavam: formData.renavam,
        valor_fipe: parseFloat((fipePrice || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        fipe_value: parseFloat((fipePrice || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        preco_cliente: parseFloat((formData.desiredPrice || '').replace(/\./g, '').replace(',', '.')) || 0,
        desired_value: parseFloat((formData.desiredPrice || '').replace(/\./g, '').replace(',', '.')) || 0,
        status: 'novo',
        classificacao: 'morna',
        observacoes: `Tipo: ${formData.vehicleType}. Localização: ${formData.ownerLocation}. Danos: ${formData.damageType}. Acessórios: ${Object.entries(formData.accessories || {}).filter(([_, v]) => v).map(([k]) => k).join(', ')}`,
        entrada: parseFloat((formData.entrada || '').replace(/\./g, '').replace(',', '.')) || 0,
        situacao_financeira: formData.situacaoFinanceira,
        banco_financiamento: formData.bank,
        valor_parcela: parseFloat((formData.installmentValue || '').replace(/\./g, '').replace(',', '.')) || 0,
        parcelas_pagas: parseInt(formData.installmentsPaid || '0') || 0,
        parcelas_atrasadas: parseInt(formData.parcelasAtrasadas || '0') || 0,
        total_parcelas: (parseInt(formData.installmentsPaid || '0') || 0) + (parseInt(formData.installmentsRemaining || '0') || 0),
        multas: parseFloat((formData.ipvaValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        motor_reparo: parseFloat((formData.engineRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        cambio_reparo: parseFloat((formData.gearboxRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        batido_reparo: parseFloat((formData.bodyRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        doc_debts: parseFloat((formData.ipvaValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        repair_debts: (parseFloat((formData.engineRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0) +
                     (parseFloat((formData.gearboxRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0) +
                     (parseFloat((formData.bodyRepairValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0),
        payoff_value: (parseInt(formData.installmentsRemaining || '0') || 0) * (parseFloat((formData.installmentValue || '').replace(/\./g, '').replace(',', '.')) || 0),
        problemas: problems,
        selected_items: Object.entries(formData.accessories || {}).filter(([_, v]) => v).map(([k]) => k),
        notifications_enabled: formData.authorizeNotifications,
        recuperado_banco: formData.isRecuperado,
        historico_furto_roubo: formData.hasFurtoRoubo,
        tem_sinistro: formData.hasSinistro || formData.hasSinistradoLeilao,
        passagem_leilao: formData.hasLeilao || formData.hasSinistradoLeilao,
        fotos: uploadedPhotos,
        videos: uploadedVideos,
        fotos_url: uploadedPhotos,
        crlv_url: crlvUrl,
        tipo_veiculo: formData.vehicleType,
        vehicle_code: Math.random().toString(36).substring(2, 6).toUpperCase()
      };

      console.log('Payload Final do Lead:', JSON.stringify(leadPayload, null, 2));
      
      // Tentar via API Backend (Bypass RLS)
      let apiSuccess = false;
      let lastError = null;
      
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });

        const result = await response.json();

        if (response.ok) {
          console.log('Lead inserido com sucesso (API):', result);
          apiSuccess = true;
        } else {
          lastError = result.error;
          console.warn('Falha na API Backend, tentando direto no Supabase...', result.error);
        }
      } catch (apiErr: any) {
        lastError = apiErr.message;
        console.warn('Erro ao chamar API Backend:', apiErr);
      }

      // Se a API falhou, tenta direto no Supabase (Client)
      if (!apiSuccess) {
        console.log('Tentando inserção direta via Supabase Client...');
        // Tenta primeiro com o payload completo
        const { error: insertError } = await supabase
          .from('leads_veiculos')
          .insert([leadPayload]);
        
        if (insertError) {
          console.error('Erro no insert completo (Supabase Client):', insertError);
          lastError = insertError.message;
          
          // Se falhou por colunas inexistentes, tenta um payload simplificado (compatibilidade)
          if (insertError.message?.includes('column') || insertError.code === 'PGRST204' || insertError.code === '42703') {
            console.log('Detectada coluna inexistente. Tentando insert simplificado...');
            const simplifiedPayload = { ...leadPayload };
            
            // Remove apenas campos que REALMENTE costumam não existir em versões muito antigas
            // Mas mantém os essenciais que o usuário reclamou que estão vindo nulos
            delete simplifiedPayload.tipo_veiculo;
            delete simplifiedPayload.tem_sinistro;
            delete simplifiedPayload.passagem_leilao;
            delete simplifiedPayload.mileage; // Usamos quilometragem agora
            
            const { error: simpleError } = await supabase
              .from('leads_veiculos')
              .insert([simplifiedPayload]);
            
            if (simpleError) {
              console.error('Erro no insert simplificado:', simpleError);
              throw simpleError;
            }
          } else {
            throw insertError;
          }
        }
        console.log('Lead inserido com sucesso (Client)');
      }

      // IMPORTANTE: Primeiro desativa o loading, depois mostra o sucesso
      // Isso ajuda a evitar erros de sincronização do React DOM
      setIsSubmitting(false);
      
      // Trigger Google Ads Conversion
      triggerAdsConversion();

      setTimeout(() => {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Redirect to thank you page after a short delay
        setTimeout(() => {
          window.history.pushState({}, '', '/obrigado');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 2000);
      }, 50);
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Erro detalhado na submissão:', error);
      
      // Captura o erro específico para mostrar ao usuário
      const errorDetail = error.message || JSON.stringify(error);
      setErrorMessage([`Erro técnico: ${errorDetail}`, 'Por favor, tire um print desta tela e envie ao suporte se o erro persistir.']);
      setErrorModalOpen(true);
      
      let msg = `Erro ao enviar avaliação: ${error.message || 'Tente novamente.'}`;
      
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        msg = 'Erro de Permissão: O sistema de segurança do banco de dados bloqueou o envio. É necessário configurar as políticas de segurança (RLS) no Supabase para permitir inserções públicas na tabela "leads_veiculos".';
      } else if (error.code === '42P01') {
        msg = 'Erro de Banco de Dados: A tabela "leads_veiculos" não foi encontrada. Por favor, execute o script SQL fornecido no painel do Supabase para criar as tabelas necessárias.';
      }
      
      setErrorMessage([msg]);
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
      ano_fabricacao: '',
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
      parcelasAtrasadas: '',
      situacaoFinanceira: '',
      entrada: '',
      hasDelayedFinancing: false,
      hasBuscaApreensao: false,
      hasDelayedIpva: false,
      ipvaValue: '',
      hasRenajud: false,
      hasBlownEngine: false,
      engineRepairValue: '',
      hasGearboxIssue: false,
      gearboxRepairValue: '',
      hasCrashDamage: false,
      bodyRepairValue: '',
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
      authorizeNotifications: true
    });
    setPhotos([]);
    setVideos([]);
    setIsSuccess(false);
    setFipePrice('');
    setModels([]);
    setYears([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="pt-32 pb-24 bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Autenticação Necessária</h2>
          <p className="text-slate-500 mb-8">
            Para garantir a segurança e a qualidade das nossas avaliações, você precisa estar logado para preencher o formulário.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Entrar ou Cadastrar-se
            </button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 bg-slate-50 min-h-screen">
      {/* Modal IPVA/Multas */}
      {showIpvaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">IPVA e Multas</h3>
                <p className="text-xs text-slate-400">Informe o valor total de débitos para análise da proposta</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">ADICIONE O ORÇAMENTO *</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20 text-lg font-bold"
                  placeholder="ADICIONE O ORÇAMENTO"
                  value={formData.ipvaValue}
                  onChange={e => handleCurrencyChange('ipvaValue', e.target.value)}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => {
                  if (!formData.ipvaValue || formData.ipvaValue === 'R$ 0,00') {
                    alert('Por favor, informe o valor dos débitos.');
                    return;
                  }
                  setShowIpvaModal(false);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Confirmar Valor
              </button>
              
              <button 
                onClick={() => {
                  setFormData({...formData, hasDelayedIpva: false, ipvaValue: ''});
                  setShowIpvaModal(false);
                }}
                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motor Fundido */}
      {showEngineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Motor Fundido / Batendo</h3>
                <p className="text-xs text-slate-400">Informe o valor do orçamento para reparo</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">ADICIONE O ORÇAMENTO *</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20 text-lg font-bold"
                  placeholder="ADICIONE O ORÇAMENTO"
                  value={formData.engineRepairValue}
                  onChange={e => handleCurrencyChange('engineRepairValue', e.target.value)}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => {
                  if (!formData.engineRepairValue || formData.engineRepairValue === 'R$ 0,00') {
                    alert('Por favor, informe o valor do orçamento.');
                    return;
                  }
                  setShowEngineModal(false);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Confirmar Valor
              </button>
              
              <button 
                onClick={() => {
                  setFormData({...formData, hasBlownEngine: false, engineRepairValue: ''});
                  setShowEngineModal(false);
                }}
                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Câmbio */}
      {showGearboxModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Câmbio com Defeito</h3>
                <p className="text-xs text-slate-400">Informe o valor do orçamento</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs text-blue-700 font-medium">Se o câmbio já foi arrumado, coloque 0,00.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Valor do Orçamento *</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20 text-lg font-bold"
                  placeholder="R$ 0,00"
                  value={formData.gearboxRepairValue}
                  onChange={e => handleCurrencyChange('gearboxRepairValue', e.target.value)}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => {
                  if (!formData.gearboxRepairValue) {
                    alert('Por favor, informe o valor do orçamento.');
                    return;
                  }
                  setShowGearboxModal(false);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Confirmar Valor
              </button>
              
              <button 
                onClick={() => {
                  setFormData({...formData, hasGearboxIssue: false, gearboxRepairValue: ''});
                  setShowGearboxModal(false);
                }}
                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Batido / Avariado */}
      {showBodyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Batido / Avariado</h3>
                <p className="text-xs text-slate-400">Informe o valor do orçamento para reparo</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-xs text-amber-700 font-medium">Aviso: Se o veículo já foi arrumado, coloque 0,00.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Valor do Orçamento *</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20 text-lg font-bold"
                  placeholder="R$ 0,00"
                  value={formData.bodyRepairValue}
                  onChange={e => handleCurrencyChange('bodyRepairValue', e.target.value)}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => {
                  if (!formData.bodyRepairValue) {
                    alert('Por favor, informe o valor do orçamento.');
                    return;
                  }
                  setShowBodyModal(false);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Confirmar Valor
              </button>
              
              <button 
                onClick={() => {
                  setFormData({...formData, hasCrashDamage: false, bodyRepairValue: ''});
                  setShowBodyModal(false);
                }}
                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300" translate="no">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-4">Envio com sucesso!</h2>
            <p className="text-slate-500 mb-8">
              Recebemos seus dados. Nossa equipe analisará as informações e entrará em contato via WhatsApp em até 24 horas com uma oferta real.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-accent/20"
            >
              Voltar para Home
            </button>
          </div>
        </div>
      )}

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
              <span className="text-sm font-bold text-slate-900" translate="no">{calculateProgress()}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                style={{ width: `${calculateProgress()}%` }}
                className="h-full bg-accent transition-all duration-500 ease-out"
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
                    onChange={e => {
                      setFormData({
                        ...formData, 
                        vehicleType: e.target.value,
                        brandId: '',
                        brandName: '',
                        modelId: '',
                        modelName: '',
                        yearId: '',
                        yearName: ''
                      });
                      setBrands([]);
                      setModels([]);
                      setYears([]);
                      setFipePrice('');
                    }}
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
                    {brands.map(b => <option key={b.codigo} value={b.codigo} translate="no">{b.nome}</option>)}
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
                    {models.map(m => <option key={m.codigo} value={m.codigo} translate="no">{m.nome}</option>)}
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
                    {years.map(y => <option key={y.codigo} value={y.codigo} translate="no">{y.nome}</option>)}
                  </select>
                </div>
              </div>

              {fipePrice && (
                <div 
                  className="mt-6 p-6 bg-accent/5 border border-accent/10 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Valor FIPE</p>
                  <h4 className="text-3xl font-black text-slate-900" translate="no">{fipePrice}</h4>
                </div>
              )}
            </div>

            {/* CRLV Upload */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Envie o CRLV (Opcional, mas recomendado)</h3>
              <p className="text-sm text-blue-700/70 mb-6 max-w-sm mx-auto">
                Envie uma foto ou PDF do documento do veículo para agilizar o processo.
              </p>
              
              {crlvPreview ? (
                <div className="relative max-w-xs mx-auto aspect-[4/3] rounded-2xl overflow-hidden border border-blue-200 bg-slate-50 mb-4 flex items-center justify-center">
                  {crlvFile?.type === 'application/pdf' || crlvFile?.name.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-blue-600 p-4">
                      <FileText className="w-16 h-16 flex-shrink-0" />
                      <span className="text-sm font-bold truncate w-full text-center px-2">{crlvFile.name}</span>
                    </div>
                  ) : (
                    <img src={crlvPreview} alt="CRLV Preview" className="w-full h-full object-contain" />
                  )}
                  <button 
                    type="button"
                    onClick={() => setCrlvFile(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors z-10 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="relative border-2 border-dashed border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-colors cursor-pointer group block">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCrlvFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                    <Camera className="w-5 h-5" />
                    Selecionar Foto ou PDF do CRLV
                  </div>
                </label>
              )}
            </div>

            {/* Vehicle Photos */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-slate-400" />
                <h3 className="text-xl font-bold">Fotos do Veículo (Mínimo 5)</h3>
              </div>
              <p className="text-sm text-slate-400 mb-8">Adicione até 10 fotos do seu veículo (frente, traseira, laterais, interior e avarias se houver).</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4" translate="no">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200">
                    <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase text-center px-2">Adicionar Foto *</span>
                  </label>
                )}
                <div className="col-span-full text-right">
                  <span className={`text-[10px] font-bold uppercase ${photos.length >= 5 ? 'text-green-500' : 'text-red-500'}`}>
                    {photos.length}/10 fotos adicionadas (Mínimo 5 *)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8 mb-4">
                <Video className="w-6 h-6 text-slate-400" />
                <h3 className="text-xl font-bold">Vídeos do Veículo (Opcional)</h3>
              </div>
              <p className="text-sm text-slate-400 mb-8">Adicione até 5 vídeos do seu veículo (máximo 20 segundos cada).</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4" translate="no">
                {videoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <video 
                      src={preview} 
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Placa *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase"
                  placeholder="Ex: ABC1234"
                  maxLength={7}
                  value={formData.plate}
                  onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                />
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">Ano de Fabricação *</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="Ex: 2008"
                  value={formData.ano_fabricacao}
                  onChange={e => setFormData({...formData, ano_fabricacao: e.target.value})}
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
                <label className="text-xs font-bold text-slate-400 ml-1">Parcelas Atrasadas</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  placeholder="0"
                  value={formData.parcelasAtrasadas}
                  onChange={e => setFormData({...formData, parcelasAtrasadas: e.target.value})}
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
                    onChange={e => {
                      setFormData({...formData, [item.id]: e.target.checked});
                      if (e.target.checked) {
                        if (item.id === 'hasDelayedIpva') setShowIpvaModal(true);
                        if (item.id === 'hasBlownEngine') setShowEngineModal(true);
                        if (item.id === 'hasGearboxIssue') setShowGearboxModal(true);
                        if (item.id === 'hasCrashDamage') setShowBodyModal(true);
                      }
                    }}
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
                  <label className="text-xs font-bold text-slate-400 ml-1">Quanto você quer no veículo? *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                    <input 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xl text-slate-900 focus:ring-2 focus:ring-accent/20"
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
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
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

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" translate="no">
            <button 
              onClick={() => setErrorModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-4">Atenção</h3>
            <div className="space-y-2 mb-8">
              {errorMessage.map((msg, i) => (
                <p key={i} className="text-slate-600 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {msg}
                </p>
              ))}
            </div>
            <button
              onClick={() => setErrorModalOpen(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
