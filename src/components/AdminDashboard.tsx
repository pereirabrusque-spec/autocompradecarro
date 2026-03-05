import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Phone, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Image as ImageIcon, Save, Loader2, LogOut, Plus, Trash2, Upload, RefreshCw, Pencil } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';
import { supabase } from '../lib/supabase';
import { defaultCards } from '../lib/seedData';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'hero' | 'assets' | 'footer' | 'settings' | 'ai' | 'apis'>('leads');
  const [savingAsset, setSavingAsset] = useState<string | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [seedingCards, setSeedingCards] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderSlug, setNewProviderSlug] = useState('');
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiProvider, setNewApiProvider] = useState<any>('gemini');
  const [newApiModel, setNewApiModel] = useState('gemini-1.5-flash');
  const [testedModels, setTestedModels] = useState<Record<string, string[]>>({});
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiMemory, setAiMemory] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [repairCosts, setRepairCosts] = useState<any[]>([]);
  const [fipeRules, setFipeRules] = useState<any[]>([]);
  const [newBankName, setNewBankName] = useState('');
  const [newBankDiscount, setNewBankDiscount] = useState('');
  const [newRepairName, setNewRepairName] = useState('');
  const [newRepairCost, setNewRepairCost] = useState('');
  const [newFipeRuleName, setNewFipeRuleName] = useState('');
  const [newFipeRuleDiscount, setNewFipeRuleDiscount] = useState('');
  
  const [editingFipeRule, setEditingFipeRule] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [editingRepairCost, setEditingRepairCost] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappButtonText, setWhatsappButtonText] = useState('WhatsApp');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [tawkToEnabled, setTawkToEnabled] = useState(false);
  const [tawkToPropertyId, setTawkToPropertyId] = useState('');
  const [tawkToWidgetId, setTawkToWidgetId] = useState('');
  const [specialistEnabled, setSpecialistEnabled] = useState(false);
  const [specialistText, setSpecialistText] = useState('');
  const [specialistLink, setSpecialistLink] = useState('');
  const [specialistAction, setSpecialistAction] = useState<'whatsapp' | 'chat'>('chat');
  const [carCardButtonText, setCarCardButtonText] = useState('Tenho Interesse');
  const [primaryContactMethod, setPrimaryContactMethod] = useState<'chat' | 'tawkto' | 'whatsapp' | 'none'>('chat');
  const [heroTimer, setHeroTimer] = useState('5000');
  const [footerText, setFooterText] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatHeight, setChatHeight] = useState('560');
  const [chatWidth, setChatWidth] = useState('360');
  const [chatColor, setChatColor] = useState('#F27D26');
  const [autoProposalEnabled, setAutoProposalEnabled] = useState(false);
  const [chatAvatarUrl, setChatAvatarUrl] = useState('');
  const [bannerHeight, setBannerHeight] = useState('100vh');
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { refreshAssets } = useAssets();

  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: assetsData, error: assetsError } = await supabase
        .from('banners')
        .select('*')
        .order('ordem', { ascending: true });

      if (assetsError) throw assetsError;

      const { data: banksData } = await supabase.from('banks').select('*').order('name');
      const { data: repairData } = await supabase.from('repair_costs').select('*').order('part_name');
      const { data: fipeData } = await supabase.from('fipe_rules').select('*').order('condition_name');
      const { data: apiKeysData } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
      const { data: providersData } = await supabase.from('providers').select('*').order('name');

      setLeads(leadsData || []);
      setDbAssets(assetsData || []);
      setBanks(banksData || []);
      setRepairCosts(repairData || []);
      setFipeRules(fipeData || []);
      setApiKeys(apiKeysData || []);
      setProviders(providersData || []);

      // Fetch settings from Supabase
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*');
      
      if (!settingsError && settingsData) {
        const aiPromptSetting = settingsData.find((s: any) => s.key === 'AI_SYSTEM_PROMPT');
        if (aiPromptSetting) {
          setAiSystemPrompt(aiPromptSetting.value);
        }
        
        const aiMemorySetting = settingsData.find((s: any) => s.key === 'AI_MEMORY');
        if (aiMemorySetting) {
          setAiMemory(aiMemorySetting.value);
        }
        
        const chatEnabledSetting = settingsData.find((s: any) => s.key === 'CHAT_ENABLED');
        if (chatEnabledSetting) {
          setChatEnabled(chatEnabledSetting.value === 'true');
        }

        const waNumberSetting = settingsData.find((s: any) => s.key === 'WHATSAPP_NUMBER');
        if (waNumberSetting) {
          setWhatsappNumber(waNumberSetting.value);
        }

        const waTextSetting = settingsData.find((s: any) => s.key === 'WHATSAPP_BUTTON_TEXT');
        if (waTextSetting) {
          setWhatsappButtonText(waTextSetting.value);
        }

        const waEnabledSetting = settingsData.find((s: any) => s.key === 'WHATSAPP_ENABLED');
        if (waEnabledSetting) {
          setWhatsappEnabled(waEnabledSetting.value === 'true');
        }

        const tawkEnabledSetting = settingsData.find((s: any) => s.key === 'TAWKTO_ENABLED');
        if (tawkEnabledSetting) setTawkToEnabled(tawkEnabledSetting.value === 'true');

        const tawkPropertySetting = settingsData.find((s: any) => s.key === 'TAWKTO_PROPERTY_ID');
        if (tawkPropertySetting) setTawkToPropertyId(tawkPropertySetting.value);

        const tawkWidgetSetting = settingsData.find((s: any) => s.key === 'TAWKTO_WIDGET_ID');
        if (tawkWidgetSetting) setTawkToWidgetId(tawkWidgetSetting.value);

        const specialistEnabledSetting = settingsData.find((s: any) => s.key === 'SPECIALIST_BUTTON_ENABLED');
        if (specialistEnabledSetting) setSpecialistEnabled(specialistEnabledSetting.value === 'true');

        const specialistTextSetting = settingsData.find((s: any) => s.key === 'SPECIALIST_BUTTON_TEXT');
        if (specialistTextSetting) setSpecialistText(specialistTextSetting.value);

        const specialistLinkSetting = settingsData.find((s: any) => s.key === 'SPECIALIST_BUTTON_LINK');
        if (specialistLinkSetting) setSpecialistLink(specialistLinkSetting.value);

        const specialistActionSetting = settingsData.find((s: any) => s.key === 'SPECIALIST_BUTTON_ACTION');
        if (specialistActionSetting) setSpecialistAction(specialistActionSetting.value as 'whatsapp' | 'chat');

        const carCardButtonTextSetting = settingsData.find((s: any) => s.key === 'CAR_CARD_BUTTON_TEXT');
        if (carCardButtonTextSetting) setCarCardButtonText(carCardButtonTextSetting.value);

        const primaryContactSetting = settingsData.find((s: any) => s.key === 'PRIMARY_CONTACT_METHOD');
        if (primaryContactSetting) setPrimaryContactMethod(primaryContactSetting.value as any);

        const heroTimerSetting = settingsData.find((s: any) => s.key === 'HERO_TIMER');
        if (heroTimerSetting) setHeroTimer(heroTimerSetting.value);

        const chatHeightSetting = settingsData.find((s: any) => s.key === 'CHAT_HEIGHT');
        if (chatHeightSetting) setChatHeight(chatHeightSetting.value);

        const chatWidthSetting = settingsData.find((s: any) => s.key === 'CHAT_WIDTH');
        if (chatWidthSetting) setChatWidth(chatWidthSetting.value);

        const chatColorSetting = settingsData.find((s: any) => s.key === 'CHAT_COLOR');
        if (chatColorSetting) setChatColor(chatColorSetting.value);

        const autoProposalSetting = settingsData.find((s: any) => s.key === 'AUTO_PROPOSAL_ENABLED');
        if (autoProposalSetting) setAutoProposalEnabled(autoProposalSetting.value === 'true');

        const chatAvatarSetting = settingsData.find((s: any) => s.key === 'CHAT_AVATAR_URL');
        if (chatAvatarSetting) setChatAvatarUrl(chatAvatarSetting.value);

        const bannerHeightSetting = settingsData.find((s: any) => s.key === 'BANNER_HEIGHT');
        if (bannerHeightSetting) setBannerHeight(bannerHeightSetting.value);

        const footerTextSetting = settingsData.find((s: any) => s.key === 'FOOTER_TEXT');
        if (footerTextSetting) setFooterText(footerTextSetting.value);

        const footerCopyrightSetting = settingsData.find((s: any) => s.key === 'FOOTER_COPYRIGHT');
        if (footerCopyrightSetting) setFooterCopyright(footerCopyrightSetting.value);

        const contactEmailSetting = settingsData.find((s: any) => s.key === 'CONTACT_EMAIL');
        if (contactEmailSetting) setContactEmail(contactEmailSetting.value);

        const contactPhoneSetting = settingsData.find((s: any) => s.key === 'CONTACT_PHONE');
        if (contactPhoneSetting) setContactPhone(contactPhoneSetting.value);

        const socialInstagramSetting = settingsData.find((s: any) => s.key === 'SOCIAL_INSTAGRAM');
        if (socialInstagramSetting) setSocialInstagram(socialInstagramSetting.value);

        const socialFacebookSetting = settingsData.find((s: any) => s.key === 'SOCIAL_FACEBOOK');
        if (socialFacebookSetting) setSocialFacebook(socialFacebookSetting.value);

        const socialYoutubeSetting = settingsData.find((s: any) => s.key === 'SOCIAL_YOUTUBE');
        if (socialYoutubeSetting) setSocialYoutube(socialYoutubeSetting.value);

        const socialTiktokSetting = settingsData.find((s: any) => s.key === 'SOCIAL_TIKTOK');
        if (socialTiktokSetting) setSocialTiktok(socialTiktokSetting.value);

        const socialLinkedinSetting = settingsData.find((s: any) => s.key === 'SOCIAL_LINKEDIN');
        if (socialLinkedinSetting) setSocialLinkedin(socialLinkedinSetting.value);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUpdateAsset = async (id: string, url: string, legenda: string, tipo: string, button_text?: string, button_link?: string, title?: string, subtitle?: string, badge_text?: string) => {
    setSavingAsset(id);
    try {
      console.log('Updating asset:', { id, url, legenda, tipo, button_text, button_link, title, subtitle, badge_text });
      const { data, error } = await supabase
        .from('banners')
        .update({ url, legenda, tipo, button_text, button_link, title, subtitle, badge_text, ativo: true })
        .eq('id', id);

      console.log('Supabase update response:', { data, error });
      if (error) throw error;

      await refreshAssets();
      // Update local state
      setDbAssets(prev => prev.map(a => a.id === id ? { ...a, url, legenda, tipo, button_text, button_link, title, subtitle, badge_text, ativo: true } : a));
      alert('Alteração salva com sucesso!');
    } catch (error) {
      console.error('Error updating banner:', error);
      alert('Erro ao salvar banner.');
    } finally {
      setSavingAsset(null);
    }
  };

  const handleCreateAsset = async (typePrefix: string = 'novo_banner') => {
    const newAsset = {
      tipo: `${typePrefix}_${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
      legenda: 'Novo Banner',
      ativo: true,
      ordem: dbAssets.length + 1,
      button_text: 'Saiba Mais',
      button_link: '/vender',
      title: 'Título do Banner',
      subtitle: 'Subtítulo do Banner',
      badge_text: 'Badge'
    };

    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([newAsset])
        .select()
        .single();

      if (error) throw error;

      setDbAssets(prev => [...prev, data]);
      await refreshAssets();
    } catch (error) {
      console.error('Error creating banner:', error);
      alert('Erro ao criar novo banner.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;
    
    setDeletingAsset(id);
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDbAssets(prev => prev.filter(a => a.id !== id));
      await refreshAssets();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Erro ao excluir banner.');
    } finally {
      setDeletingAsset(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAsset(id);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Update local state so user sees it immediately
      // Update local state and then save to DB
      setDbAssets(prev => prev.map(a => a.id === id ? { ...a, url: publicUrl } : a));
      
      const currentAsset = dbAssets.find(a => a.id === id);
      if (currentAsset) {
        await handleUpdateAsset(
          id, 
          publicUrl, 
          currentAsset.legenda, 
          currentAsset.tipo, 
          currentAsset.button_text, 
          currentAsset.button_link, 
          currentAsset.title, 
          currentAsset.subtitle, 
          currentAsset.badge_text
        );
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "assets" existe e é público no Supabase.');
    } finally {
      setUploadingAsset(null);
      if (event.target) event.target.value = ''; // Reset input
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const settingsToSave = [
        { key: 'CHAT_ENABLED', value: chatEnabled ? 'true' : 'false' },
        { key: 'WHATSAPP_NUMBER', value: whatsappNumber },
        { key: 'WHATSAPP_BUTTON_TEXT', value: whatsappButtonText },
        { key: 'WHATSAPP_ENABLED', value: whatsappEnabled ? 'true' : 'false' },
        { key: 'TAWKTO_ENABLED', value: tawkToEnabled ? 'true' : 'false' },
        { key: 'TAWKTO_PROPERTY_ID', value: tawkToPropertyId },
        { key: 'TAWKTO_WIDGET_ID', value: tawkToWidgetId },
        { key: 'SPECIALIST_BUTTON_ENABLED', value: specialistEnabled ? 'true' : 'false' },
        { key: 'SPECIALIST_BUTTON_TEXT', value: specialistText },
        { key: 'SPECIALIST_BUTTON_LINK', value: specialistLink },
        { key: 'SPECIALIST_BUTTON_ACTION', value: specialistAction },
        { key: 'CAR_CARD_BUTTON_TEXT', value: carCardButtonText },
        { key: 'PRIMARY_CONTACT_METHOD', value: primaryContactMethod },
        { key: 'HERO_TIMER', value: heroTimer },
        { key: 'FOOTER_TEXT', value: footerText },
        { key: 'FOOTER_COPYRIGHT', value: footerCopyright },
        { key: 'CONTACT_EMAIL', value: contactEmail },
        { key: 'CONTACT_PHONE', value: contactPhone },
        { key: 'SOCIAL_INSTAGRAM', value: socialInstagram },
        { key: 'SOCIAL_FACEBOOK', value: socialFacebook },
        { key: 'SOCIAL_YOUTUBE', value: socialYoutube },
        { key: 'SOCIAL_TIKTOK', value: socialTiktok },
        { key: 'SOCIAL_LINKEDIN', value: socialLinkedin },
        { key: 'AI_MEMORY', value: aiMemory },
        { key: 'CHAT_HEIGHT', value: chatHeight },
        { key: 'CHAT_WIDTH', value: chatWidth },
        { key: 'CHAT_COLOR', value: chatColor },
        { key: 'AUTO_PROPOSAL_ENABLED', value: autoProposalEnabled ? 'true' : 'false' },
        { key: 'CHAT_AVATAR_URL', value: chatAvatarUrl },
        { key: 'BANNER_HEIGHT', value: bannerHeight },
      ];

      console.log('settingsToSave:', settingsToSave);
      const { data, error } = await supabase
        .from('settings')
        .upsert(settingsToSave, { onConflict: 'key' });

      console.log('Supabase response:', { data, error });
      if (error) throw error;

      await refreshAssets();
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getSituationLabel = (s: string) => {
    const labels: any = {
      normal: 'Normal',
      debt: 'Dívida Atrasada',
      renajud: 'RENAJUD',
      busca_apreensao: 'Busca e Apreensão',
      engine_blown: 'Motor Estourado',
      maintenance_needed: 'Manutenção',
      future_payoff: 'Futura Quitação'
    };
    return labels[s] || s;
  };

  const calculateProposal = (lead: any) => {
    let baseValue = lead.valor_fipe;
    let totalDeductions = 0;
    const deductions = [];

    // Deductions based on problems
    if (lead.problemas) {
      lead.problemas.forEach((problem: string) => {
        const rule = fipeRules.find(r => r.condition_name === problem);
        if (rule) {
          const deduction = baseValue * (rule.discount_percentage / 100);
          totalDeductions += deduction;
          deductions.push({ name: problem, value: deduction });
        }
      });
    }

    // Deductions based on repair costs
    if (lead.observacoes) {
      repairCosts.forEach(cost => {
        if (lead.observacoes.toLowerCase().includes(cost.part_name.toLowerCase())) {
          totalDeductions += cost.cost_value;
          deductions.push({ name: cost.part_name, value: cost.cost_value });
        }
      });
    }

    return {
      baseValue,
      totalDeductions,
      deductions,
      finalValue: baseValue - totalDeductions
    };
  };

  const handleSeedCards = async () => {
    if (!confirm('Isso irá restaurar os cards padrão. Deseja continuar?')) return;
    setSeedingCards(true);
    try {
      // Check if cards exist
      const { data: existing } = await supabase.from('banners').select('id').ilike('tipo', 'card_%');
      
      if (existing && existing.length > 0) {
        // Optional: Delete existing or just upsert. Let's upsert.
        // Actually, user might want to reset.
      }

      for (const card of defaultCards) {
        const { error } = await supabase
          .from('banners')
          .upsert(card, { onConflict: 'tipo' });
        
        if (error) throw error;
      }
      
      await fetchData();
      alert('Cards restaurados com sucesso!');
    } catch (error) {
      console.error('Error seeding cards:', error);
      alert('Erro ao restaurar cards.');
    } finally {
      setSeedingCards(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold">Painel Administrativo</h1>
            <p className="text-slate-500">Gerencie leads e conteúdo do site.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'leads' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Leads ({leads.length})
              </button>
              <button 
                onClick={() => setActiveTab('hero')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'hero' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Banner Principal
              </button>
              <button 
                onClick={() => setActiveTab('assets')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'assets' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Fotos do Site
              </button>
              <button 
                onClick={() => setActiveTab('footer')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'footer' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Rodapé & Contatos
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Configurações
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Inteligência Artificial (Regras)
              </button>
              <button 
                onClick={() => setActiveTab('apis')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'apis' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                APIs & Chaves
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-red-500 hover:border-red-100 transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'leads' ? (
          <div className="grid grid-cols-1 gap-6">
            {selectedLead && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold font-display">{selectedLead.marca} {selectedLead.modelo}</h2>
                    <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full">
                      <LogOut className="w-6 h-6 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-lg mb-4">Detalhes do Veículo</h3>
                      <div className="space-y-3 bg-slate-50 p-6 rounded-2xl">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Ano</span>
                          <span className="font-bold">{selectedLead.ano_modelo}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Cor</span>
                          <span className="font-bold">{selectedLead.cor}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">KM</span>
                          <span className="font-bold">{selectedLead.mileage?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Valor FIPE</span>
                          <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_fipe)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-slate-500">Valor Pedido</span>
                          <span className="font-bold text-green-600 text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.preco_cliente)}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg mt-8 mb-4">Financeiro</h3>
                      <div className="space-y-3 bg-slate-50 p-6 rounded-2xl">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Situação</span>
                          <span className="font-bold">{selectedLead.situacao_financeira || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-slate-500">Entrada Paga</span>
                          <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.entrada)}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg mt-8 mb-4">Proposta de Compra</h3>
                      <div className="bg-slate-50 p-6 rounded-2xl">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Valor FIPE</span>
                          <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateProposal(selectedLead).baseValue)}</span>
                        </div>
                        {calculateProposal(selectedLead).deductions.map((d: any, i: number) => (
                          <div key={i} className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">{d.name}</span>
                            <span className="font-bold text-red-600">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2">
                          <span className="text-slate-500 font-bold">Valor Final</span>
                          <span className="font-bold text-green-600 text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateProposal(selectedLead).finalValue)}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const proposal = calculateProposal(selectedLead);
                            const message = `Olá ${selectedLead.cliente_nome}, analisamos seu ${selectedLead.marca} ${selectedLead.modelo} (${selectedLead.ano_modelo}). Com base em nossa análise, nossa proposta final é de R$ ${proposal.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
                            const whatsappUrl = `https://wa.me/${selectedLead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                            alert('Proposta enviada!');
                          }}
                          className="w-full mt-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                        >
                          Confirmar e Enviar Proposta
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-4">Contato do Cliente</h3>
                      <div className="bg-slate-50 p-6 rounded-2xl mb-8">
                        <p className="font-bold text-lg mb-1">{selectedLead.cliente_nome}</p>
                        <p className="text-slate-500 mb-4">{selectedLead.email}</p>
                        <a 
                          href={`https://wa.me/55${selectedLead.telefone.replace(/\D/g, '')}`} 
                          target="_blank"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Chamar no WhatsApp
                        </a>
                      </div>

                      <h3 className="font-bold text-lg mb-4">Observações</h3>
                      <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-sm text-slate-600">{selectedLead.observacoes}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {leads.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedLead(v)}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="p-6 flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-display text-xl font-bold group-hover:text-accent transition-colors">{v.marca} {v.modelo}</h2>
                        <p className="text-slate-400 text-sm">{v.ano_modelo} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.preco_cliente)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        v.status === 'novo' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold group-hover:bg-slate-100 transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {leads.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400">Nenhum lead recebido até o momento.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'hero' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-8">
              <h3 className="text-xl font-bold mb-4">Configuração do Carrossel</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-700">Tempo de Transição (ms)</label>
                  <input 
                    type="number"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                    value={heroTimer}
                    onChange={e => setHeroTimer(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="mt-5 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Tempo'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Banners do Carrossel</h2>
              <button 
                onClick={() => handleCreateAsset('hero_bg')}
                className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Slide
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dbAssets.filter(a => a.tipo.startsWith('hero_bg')).map((asset) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="relative h-48 bg-slate-100 group">
                    <img 
                      src={asset.url} 
                      alt={asset.legenda} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors">
                        {uploadingAsset === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Trocar Imagem
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge (Etiqueta)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.badge_text || ''}
                        placeholder="Ex: SOLUÇÃO IMEDIATA"
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, badge_text: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título (HTML permitido)</label>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-24"
                        value={asset.title || ''}
                        placeholder="Ex: Transforme seu problema..."
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo</label>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-20"
                        value={asset.subtitle || ''}
                        placeholder="Ex: Especialistas em..."
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, subtitle: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda (Interno)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.legenda}
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, legenda: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto do Botão</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.button_text || ''}
                        placeholder="Ex: Saiba Mais"
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, button_text: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link do Botão</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.button_link || ''}
                        placeholder="Ex: /vender"
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, button_link: e.target.value } : a))}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text)}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salvar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'assets' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fotos do Site (Cards)</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleSeedCards}
                  disabled={seedingCards}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {seedingCards ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Restaurar Padrões
                </button>
                <button 
                  onClick={() => handleCreateAsset('card_img')}
                  className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Nova Foto
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dbAssets.filter(a => !a.tipo.startsWith('hero_bg') && !a.tipo.startsWith('partner_')).map((asset) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="relative h-48 bg-slate-100 group">
                    <img 
                      src={asset.url} 
                      alt={asset.legenda} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors">
                        {uploadingAsset === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Trocar
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.tipo}
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, tipo: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.legenda}
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, legenda: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge (Etiqueta)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.badge_text || ''}
                        placeholder="Ex: CARRO"
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, badge_text: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título (HTML permitido)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.title || ''}
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo</label>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-20"
                        value={asset.subtitle || ''}
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, subtitle: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto do Botão</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.button_text || ''}
                        placeholder="Ex: TRANSFORME SEU PREJUÍZO..."
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, button_text: e.target.value } : a))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link do Botão</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={asset.button_link || ''}
                        placeholder="Ex: /vender"
                        onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, button_link: e.target.value } : a))}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text)}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salvar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'apis' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Gerenciamento de APIs & Chaves</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Configuração de APIs</h3>
                    <button 
                      onClick={() => {
                        setShowApiKeyForm(!showApiKeyForm);
                        if (!showApiKeyForm) {
                          setEditingApiKey(null);
                          setNewApiKey('');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-accent transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      {showApiKeyForm ? 'Fechar Formulário' : 'Nova Chave'}
                    </button>
                  </div>
                  
                  {showApiKeyForm && (
                    <div className="p-6 bg-white border border-slate-200 rounded-[32px] shadow-sm space-y-6">
                      <h3 className="text-lg font-bold">{editingApiKey ? 'Editar Chave' : 'Adicionar Nova Chave'}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Provedor</label>
                          <select 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            value={newApiProvider}
                            onChange={e => {
                              const provider = e.target.value as any;
                              setNewApiProvider(provider);
                              if (provider === 'gemini') setNewApiModel('gemini-1.5-flash');
                              else if (provider === 'openai') setNewApiModel('gpt-4o-mini');
                              else if (provider === 'grok') setNewApiModel('grok-beta');
                            }}
                          >
                            {providers.length > 0 ? (
                              providers.map(p => (
                                <option key={p.id} value={p.slug}>{p.name}</option>
                              ))
                            ) : (
                              <>
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                                <option value="grok">xAI Grok</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Modelo Padrão</label>
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                              value={newApiModel}
                              onChange={e => setNewApiModel(e.target.value)}
                            >
                              <optgroup label="Google Gemini">
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                              </optgroup>
                              <optgroup label="OpenAI">
                                <option value="gpt-4o-mini">GPT-4o Mini</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                              </optgroup>
                              <optgroup label="xAI Grok">
                                <option value="grok-beta">Grok Beta</option>
                                <option value="grok-2">Grok 2</option>
                              </optgroup>
                              <optgroup label="Outros">
                                <option value="custom">Outro (Digitar abaixo)</option>
                              </optgroup>
                            </select>
                          </div>
                          {newApiModel === 'custom' && (
                            <input 
                              type="text"
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none mt-2"
                              placeholder="Digite o nome do modelo (ex: claude-3-opus)"
                              onChange={e => setNewApiModel(e.target.value)}
                            />
                          )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold text-slate-700">Chave da API</label>
                          <input 
                            type="password"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            placeholder="sk-..."
                            value={newApiKey}
                            onChange={e => setNewApiKey(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={async () => {
                            if (!newApiKey.trim()) {
                              alert('Por favor, insira a chave da API.');
                              return;
                            }
                            
                            setIsSavingKey(true);
                            try {
                              if (editingApiKey) {
                                const { error } = await supabase
                                  .from('api_keys')
                                  .update({ 
                                    provider: newApiProvider, 
                                    key: newApiKey.trim(),
                                    service: newApiModel,
                                    status: 'ok'
                                  })
                                  .eq('id', editingApiKey);
                                if (error) throw error;
                                setEditingApiKey(null);
                                setShowApiKeyForm(false);
                              } else {
                                const { error } = await supabase
                                  .from('api_keys')
                                  .insert([{ 
                                    provider: newApiProvider, 
                                    key: newApiKey.trim(),
                                    service: newApiModel,
                                    status: 'ok'
                                  }]);
                                
                                if (error) {
                                  const { error: retryError } = await supabase
                                    .from('api_keys')
                                    .insert([{ 
                                      provider: newApiProvider, 
                                      key: newApiKey.trim(),
                                      service: newApiModel
                                    }]);
                                  if (retryError) throw retryError;
                                }
                                setShowApiKeyForm(false);
                              }

                              setNewApiKey('');
                              fetchData();
                              alert(editingApiKey ? 'Chave atualizada!' : 'Chave adicionada com sucesso!');
                            } catch (err: any) {
                              console.error('Erro ao salvar chave:', err);
                              alert('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
                            } finally {
                              setIsSavingKey(false);
                            }
                          }}
                          disabled={isSavingKey}
                          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSavingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingApiKey ? 'Salvar Alterações' : 'Adicionar Chave')}
                        </button>
                        {editingApiKey && (
                          <button 
                            onClick={() => {
                              setEditingApiKey(null);
                              setNewApiKey('');
                              setShowApiKeyForm(false);
                            }}
                            className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Gerenciar Provedores</h3>
                  </div>
                  
                  <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                        <input 
                          type="text"
                          placeholder="Ex: Anthropic"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                          value={newProviderName}
                          onChange={e => {
                            setNewProviderName(e.target.value);
                            if (!newProviderSlug) {
                              setNewProviderSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Slug (ID)</label>
                        <input 
                          type="text"
                          placeholder="ex: anthropic"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                          value={newProviderSlug}
                          onChange={e => setNewProviderSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!newProviderName || !newProviderSlug) return;
                        setIsSavingProvider(true);
                        try {
                          const { error } = await supabase
                            .from('providers')
                            .upsert([{ name: newProviderName, slug: newProviderSlug }]);
                          if (error) throw error;
                          setNewProviderName('');
                          setNewProviderSlug('');
                          fetchData();
                        } catch (err: any) {
                          alert('Erro ao salvar provedor: ' + err.message);
                        } finally {
                          setIsSavingProvider(false);
                        }
                      }}
                      disabled={isSavingProvider}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm disabled:opacity-50"
                    >
                      {isSavingProvider ? 'Salvando...' : 'Adicionar Provedor'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {providers.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-700">{p.name}</span>
                          <span className="ml-2 text-[10px] text-slate-400 font-mono uppercase">{p.slug}</span>
                        </div>
                        <button 
                          onClick={async () => {
                            if (confirm(`Remover provedor ${p.name}?`)) {
                              await supabase.from('providers').delete().eq('id', p.id);
                              fetchData();
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      <strong>Dica:</strong> Se aparecer erro de "coluna status não encontrada", certifique-se de ter executado o script SQL no Supabase para atualizar a tabela <code>api_keys</code>.
                    </p>
                  </div>

                  <h3 className="text-lg font-bold">Chaves Ativas</h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {apiKeys.map(key => (
                      <div key={key.id} className="p-5 bg-slate-50 rounded-[24px] border border-slate-200 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{key.provider}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                key.status === 'ok' ? 'bg-emerald-500' : 
                                key.status === 'no_credit' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                            </div>
                            <h4 className="font-bold text-slate-900">{key.service || 'Modelo não selecionado'}</h4>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                setTestingKey(key.id);
                                try {
                                  const response = await fetch('/api/test-api-key', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ provider: key.provider, key: key.key })
                                  });
                                  const data = await response.json();
                                  
                                  if (response.ok && data.success) {
                                    setTestedModels(prev => ({ ...prev, [key.id]: data.models || [] }));
                                    
                                    // Update status in Supabase
                                    const { error: updateError } = await supabase
                                      .from('api_keys')
                                      .update({ 
                                        status: 'ok', 
                                        error_count: 0,
                                        last_used: new Date().toISOString()
                                      })
                                      .eq('id', key.id);
                                    
                                    if (updateError) {
                                      console.error('Supabase update error:', updateError);
                                      // Fallback: try to update only status
                                      const { error: fallbackError } = await supabase
                                        .from('api_keys')
                                        .update({ status: 'ok' })
                                        .eq('id', key.id);
                                      
                                      if (fallbackError) {
                                        alert('Erro de Banco de Dados: A coluna "status" não foi encontrada. Por favor, execute o script SQL no Supabase.');
                                      } else {
                                        await fetchData();
                                        alert('Conexão OK! Status atualizado (modo simplificado).');
                                      }
                                    } else {
                                      await fetchData();
                                      alert('Conexão bem sucedida! Status atualizado para OK.');
                                    }
                                  } else {
                                    const { error: updateError } = await supabase
                                      .from('api_keys')
                                      .update({ status: 'disconnected' })
                                      .eq('id', key.id);
                                    
                                    if (!updateError) await fetchData();
                                    alert(`Erro: ${data.error || 'Chave inválida ou erro de conexão'}`);
                                  }
                                } catch (err: any) {
                                  console.error('Test API error:', err);
                                  alert('Erro ao conectar com o servidor de teste: ' + (err.message || 'Erro desconhecido'));
                                } finally {
                                  setTestingKey(null);
                                }
                              }}
                              disabled={testingKey === key.id}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Testar Conexão"
                            >
                              {testingKey === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingApiKey(key.id);
                                setNewApiProvider(key.provider);
                                setNewApiKey(key.key);
                                setNewApiModel(key.service.split(':')[0]);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Remover chave?')) {
                                  await supabase.from('api_keys').delete().eq('id', key.id);
                                  fetchData();
                                }
                              }}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                              {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                            </code>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                              key.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 
                              key.status === 'no_credit' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {key.status === 'ok' ? 'Ativa' : 
                               key.status === 'no_credit' ? 'Sem Crédito' : 'Desconectada'}
                            </span>
                          </div>

                          {testedModels[key.id] && testedModels[key.id].length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versões Disponíveis (Clique para selecionar):</p>
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  const top5 = [
                                    'gemini-1.5-pro', 
                                    'gpt-4o', 
                                    'gemini-2.0-flash-exp', 
                                    'grok-2', 
                                    'gpt-4-turbo',
                                    'gemini-1.5-flash',
                                    'gpt-4o-mini',
                                    'grok-beta'
                                  ];
                                  
                                  // Filter to only show models that are in our top5 list OR are currently selected
                                  const filteredModels = testedModels[key.id].filter(m => {
                                    const model = m.toLowerCase();
                                    // Strict top 5 filter
                                    return (
                                      model === 'gemini-1.5-pro' ||
                                      model === 'gpt-4o' ||
                                      model === 'gemini-2.0-flash-exp' ||
                                      model === 'grok-2' ||
                                      model === 'gpt-4-turbo' ||
                                      model === 'gemini-1.5-flash' ||
                                      model === 'gpt-4o-mini' ||
                                      model === 'grok-beta' ||
                                      key.service === m
                                    );
                                  });

                                  // Sort models: priority ones first
                                  const sortedModels = [...filteredModels].sort((a, b) => {
                                    const indexA = top5.findIndex(t => a.toLowerCase().includes(t.toLowerCase()));
                                    const indexB = top5.findIndex(t => b.toLowerCase().includes(t.toLowerCase()));
                                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                    if (indexA !== -1) return -1;
                                    if (indexB !== -1) return 1;
                                    return a.localeCompare(b);
                                  });

                                  // Take only the first 6-8 to keep it clean
                                  return sortedModels.slice(0, 8).map(m => (
                                    <button 
                                      key={m} 
                                      onClick={async () => {
                                        const { error } = await supabase
                                          .from('api_keys')
                                          .update({ service: m })
                                          .eq('id', key.id);
                                        if (!error) {
                                          fetchData();
                                          alert(`Modelo ${m} selecionado!`);
                                        }
                                      }}
                                      className={`text-[9px] border px-1.5 py-0.5 rounded transition-all ${
                                        key.service.startsWith(m) 
                                          ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>Último uso: {key.last_used ? new Date(key.last_used).toLocaleString() : 'Nunca'}</span>
                            <span>Erros: {key.error_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <p className="text-center text-slate-400 py-8 text-sm">Nenhuma chave configurada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'footer' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Informações de Contato e Rodapé</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email de Contato</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Telefone de Contato</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link Instagram</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={socialInstagram}
                    onChange={e => setSocialInstagram(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link Facebook</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={socialFacebook}
                    onChange={e => setSocialFacebook(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link YouTube</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={socialYoutube}
                    onChange={e => setSocialYoutube(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link TikTok</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={socialTiktok}
                    onChange={e => setSocialTiktok(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link LinkedIn</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={socialLinkedin}
                    onChange={e => setSocialLinkedin(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Texto do Rodapé</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Copyright</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={footerCopyright}
                    onChange={e => setFooterCopyright(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Salvar Informações
              </button>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-8">
              <h3 className="text-xl font-bold mb-4">Configuração dos Cards de Veículos</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-700">Texto do Botão Laranja nos Cards</label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                    value={carCardButtonText}
                    onChange={e => setCarCardButtonText(e.target.value)}
                    placeholder="Ex: Tenho Interesse"
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="mt-5 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Texto'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gatilhos de Venda (Cards com Foto)</h2>
              <button 
                onClick={() => handleCreateAsset('trigger')}
                className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Gatilho
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dbAssets.filter(a => a.tipo.startsWith('trigger')).map((asset) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="relative h-48 bg-slate-100 group">
                    <img 
                      src={asset.url} 
                      alt={asset.legenda} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-3 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
                        <Upload className="w-5 h-5" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={asset.title || ''}
                      placeholder="Título do Gatilho"
                      onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: e.target.value } : a))}
                    />
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-24"
                      value={asset.subtitle || ''}
                      placeholder="Descrição do Gatilho"
                      onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, subtitle: e.target.value } : a))}
                    />
                    <button 
                      onClick={() => handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text)}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salvar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Parceiros (Logos)</h2>
              <button 
                onClick={() => handleCreateAsset('partner_logo')}
                className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Parceiro
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {dbAssets.filter(a => a.tipo.startsWith('partner_')).map((asset) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="relative h-32 bg-slate-100 group p-4 flex items-center justify-center">
                    <img 
                      src={asset.url} 
                      alt={asset.legenda} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[32px]">
                      <label className="cursor-pointer p-2 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
                        <Upload className="w-4 h-4" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <input 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      value={asset.legenda}
                      placeholder="Nome do Parceiro"
                      onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, legenda: e.target.value } : a))}
                    />
                    <button 
                      onClick={async () => {
                        await handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text);
                      }}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl space-y-8 pb-20">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6">Canal de Atendimento Principal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'chat', label: 'Chat da IA', desc: 'Assistente virtual inteligente' },
                  { id: 'tawkto', label: 'Tawk.to', desc: 'Chat ao vivo externo' },
                  { id: 'whatsapp', label: 'WhatsApp', desc: 'Direto para o seu número' },
                  { id: 'none', label: 'Nenhum', desc: 'Desativa canais flutuantes' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPrimaryContactMethod(method.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${primaryContactMethod === method.id ? 'border-accent bg-accent/5' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <p className={`font-bold ${primaryContactMethod === method.id ? 'text-accent' : 'text-slate-900'}`}>{method.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{method.desc}</p>
                  </button>
                ))}
              </div>

              <h2 className="text-2xl font-bold mb-6">Configurações do Sistema</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">Habilitar Chat Inteligente</p>
                    <p className="text-xs text-slate-500">Ativa o assistente virtual no site.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={chatEnabled}
                      onChange={(e) => setChatEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">Habilitar Envio Automático de Propostas</p>
                    <p className="text-xs text-slate-500">A IA enviará propostas automaticamente para leads qualificados.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={autoProposalEnabled}
                      onChange={(e) => setAutoProposalEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold mb-4">Aparência do Site e Chat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Altura do Banner Superior (ex: 100vh, 500px)</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                        value={bannerHeight}
                        onChange={e => setBannerHeight(e.target.value)}
                        placeholder="Ex: 100vh"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Altura (px)</label>
                      <input 
                        type="number"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                        value={chatHeight}
                        onChange={e => setChatHeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Largura (px)</label>
                      <input 
                        type="number"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
                        value={chatWidth}
                        onChange={e => setChatWidth(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Cor Principal</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          className="w-12 h-12 p-1 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                          value={chatColor}
                          onChange={e => setChatColor(e.target.value)}
                        />
                        <input 
                          type="text"
                          className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 font-mono text-sm"
                          value={chatColor}
                          onChange={e => setChatColor(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="text-sm font-bold text-slate-700 block">Foto do Atendente (Upload)</label>
                      <input 
                        type="file"
                        accept="image/*"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const { data, error } = await supabase.storage
                            .from('chat-avatars')
                            .upload(`avatar-${Date.now()}.png`, file);
                            
                          if (error) { alert('Erro no upload: ' + error.message); return; }
                          
                          const { data: publicUrlData } = supabase.storage
                            .from('chat-avatars')
                            .getPublicUrl(data.path);
                            
                          setChatAvatarUrl(publicUrlData.publicUrl);
                          alert('Foto enviada com sucesso!');
                        }}
                      />
                      {chatAvatarUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">Foto atual:</p>
                          <img src={chatAvatarUrl} className="w-20 h-20 rounded-full object-cover border-2 border-accent" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold mb-4">Configurações de Contato</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">Habilitar Botão do WhatsApp</p>
                        <p className="text-xs text-slate-500">Mostra o botão flutuante do WhatsApp no site.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={whatsappEnabled}
                          onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Número do WhatsApp</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: 5511999999999"
                        value={whatsappNumber}
                        onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={!whatsappEnabled}
                      />
                      <p className="text-xs text-slate-500">Apenas números, com código do país (55) e DDD. Ex: 5511988887777</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Texto do Botão</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: Falar com Especialista"
                        value={whatsappButtonText}
                        onChange={e => setWhatsappButtonText(e.target.value)}
                        disabled={!whatsappEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="text-lg font-bold mb-4">Tawk.to (Chat ao Vivo)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">Habilitar Tawk.to</p>
                        <p className="text-xs text-slate-500">Mostra o widget de chat do Tawk.to no site.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={tawkToEnabled}
                          onChange={(e) => setTawkToEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Property ID</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: 65e8a... (Encontrado no painel do Tawk.to)"
                        value={tawkToPropertyId}
                        onChange={e => setTawkToPropertyId(e.target.value)}
                        disabled={!tawkToEnabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Widget ID</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: 1ho... (Geralmente 'default' ou um ID específico)"
                        value={tawkToWidgetId}
                        onChange={e => setTawkToWidgetId(e.target.value)}
                        disabled={!tawkToEnabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="text-lg font-bold mb-4">Botão "Falar com Especialista" (Final)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">Habilitar Botão Especialista</p>
                        <p className="text-xs text-slate-500">Mostra um botão de destaque no final da página.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={specialistEnabled}
                          onChange={(e) => setSpecialistEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Texto do Botão</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: Falar com Especialista Agora"
                        value={specialistText}
                        onChange={e => setSpecialistText(e.target.value)}
                        disabled={!specialistEnabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Link de Destino (WhatsApp ou URL)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        placeholder="Ex: https://wa.me/5511999999999"
                        value={specialistLink}
                        onChange={e => setSpecialistLink(e.target.value)}
                        disabled={!specialistEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-4 bg-accent text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all disabled:opacity-50 mt-8"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Salvar Configurações
              </button>
            </div>
          </div>
        ) : activeTab === 'ai' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Regras de Negócio da IA</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Prompt do Sistema (Cérebro da IA)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 h-48 font-mono text-xs"
                    value={aiSystemPrompt}
                    onChange={e => setAiSystemPrompt(e.target.value)}
                    placeholder="Defina aqui as regras que a IA deve seguir..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Memória da IA (Contexto)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 h-48 font-mono text-xs"
                    value={aiMemory}
                    onChange={e => setAiMemory(e.target.value)}
                    placeholder="Defina aqui o contexto ou memória que a IA deve ter..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Memória da IA (Contexto)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 h-48 font-mono text-xs"
                    value={aiMemory}
                    onChange={e => setAiMemory(e.target.value)}
                    placeholder="Defina aqui o contexto ou memória que a IA deve ter..."
                  />
                </div>
                <button 
                  onClick={async () => {
                    setSavingSettings(true);
                    const { error } = await supabase
                      .from('settings')
                      .upsert({ key: 'AI_SYSTEM_PROMPT', value: aiSystemPrompt }, { onConflict: 'key' });
                    
                    if (!error) {
                      alert('Regras da IA salvas com sucesso!');
                    } else {
                      alert('Erro ao salvar regras.');
                    }
                    setSavingSettings(false);
                  }}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Regras
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Regras FIPE */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm md:col-span-2">
                <h3 className="text-xl font-bold mb-4">Regras de Desconto FIPE</h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Condição (ex: Financiado)"
                    value={newFipeRuleName}
                    onChange={e => setNewFipeRuleName(e.target.value)}
                  />
                  <input 
                    className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="% Desc."
                    type="number"
                    value={newFipeRuleDiscount}
                    onChange={e => setNewFipeRuleDiscount(e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                      if (!newFipeRuleName || !newFipeRuleDiscount) return;
                      const { error } = await supabase.from('fipe_rules').insert([{ condition_name: newFipeRuleName, discount_percentage: parseFloat(newFipeRuleDiscount) }]);
                      if (!error) {
                        setNewFipeRuleName('');
                        setNewFipeRuleDiscount('');
                        fetchData(); // Refresh
                      }
                    }}
                    className="p-3 bg-accent text-white rounded-xl hover:bg-orange-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                  {fipeRules.map(rule => (
                    <div key={rule.id} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      {editingFipeRule === rule.id ? (
                        <>
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            value={rule.condition_name}
                            onChange={e => setFipeRules(prev => prev.map(r => r.id === rule.id ? { ...r, condition_name: e.target.value } : r))}
                          />
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            type="number"
                            value={rule.discount_percentage}
                            onChange={e => setFipeRules(prev => prev.map(r => r.id === rule.id ? { ...r, discount_percentage: parseFloat(e.target.value) } : r))}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('fipe_rules').update({ condition_name: rule.condition_name, discount_percentage: rule.discount_percentage }).eq('id', rule.id);
                                if (!error) {
                                  setEditingFipeRule(null);
                                  alert('Regra salva com sucesso!');
                                }
                              }}
                              className="flex-1 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                            >
                              Salvar
                            </button>
                            <button onClick={() => setEditingFipeRule(null)} className="flex-1 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">{rule.condition_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">-{rule.discount_percentage}%</span>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingFipeRule(rule.id)} className="text-slate-400 hover:text-slate-600"><Save className="w-4 h-4" /></button>
                              <button 
                                onClick={async () => {
                                  if (confirm('Excluir regra?')) {
                                    await supabase.from('fipe_rules').delete().eq('id', rule.id);
                                    fetchData();
                                  }
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bancos */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Bancos & Descontos</h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Nome do Banco"
                    value={newBankName}
                    onChange={e => setNewBankName(e.target.value)}
                  />
                  <input 
                    className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="% Desc."
                    type="number"
                    value={newBankDiscount}
                    onChange={e => setNewBankDiscount(e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                      if (!newBankName || !newBankDiscount) return;
                      const { error } = await supabase.from('banks').insert([{ name: newBankName, discount_percentage: parseFloat(newBankDiscount) }]);
                      if (!error) {
                        setNewBankName('');
                        setNewBankDiscount('');
                        fetchData(); // Refresh
                        alert('Banco adicionado com sucesso!');
                      }
                    }}
                    className="p-3 bg-accent text-white rounded-xl hover:bg-orange-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {banks.map(bank => (
                    <div key={bank.id} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      {editingBank === bank.id ? (
                        <>
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            value={bank.name}
                            onChange={e => setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, name: e.target.value } : b))}
                          />
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            type="number"
                            value={bank.payoff_discount_percentage}
                            onChange={e => setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, payoff_discount_percentage: parseFloat(e.target.value) } : b))}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('banks').update({ name: bank.name, payoff_discount_percentage: bank.payoff_discount_percentage }).eq('id', bank.id);
                                if (!error) {
                                  setEditingBank(null);
                                  alert('Banco salvo com sucesso!');
                                }
                              }}
                              className="flex-1 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                            >
                              Salvar
                            </button>
                            <button onClick={() => setEditingBank(null)} className="flex-1 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">{bank.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-lg">-{bank.payoff_discount_percentage}%</span>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingBank(bank.id)} className="text-slate-400 hover:text-slate-600"><Save className="w-4 h-4" /></button>
                              <button 
                                onClick={async () => {
                                  if (confirm('Excluir banco?')) {
                                    await supabase.from('banks').delete().eq('id', bank.id);
                                    fetchData();
                                  }
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custos de Reparo */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Custos de Reparo (Peças)</h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="Item (ex: Porta)"
                    value={newRepairName}
                    onChange={e => setNewRepairName(e.target.value)}
                  />
                  <input 
                    className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    placeholder="R$ Custo"
                    type="number"
                    value={newRepairCost}
                    onChange={e => setNewRepairCost(e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                      if (!newRepairName || !newRepairCost) return;
                      const { error } = await supabase.from('repair_costs').insert([{ part_name: newRepairName, cost: parseFloat(newRepairCost) }]);
                      if (!error) {
                        setNewRepairName('');
                        setNewRepairCost('');
                        fetchData(); // Refresh
                      }
                    }}
                    className="p-3 bg-accent text-white rounded-xl hover:bg-orange-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {repairCosts.map(item => (
                    <div key={item.id} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      {editingRepairCost === item.id ? (
                        <>
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            value={item.part_name}
                            onChange={e => setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, part_name: e.target.value } : r))}
                          />
                          <input 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            type="number"
                            value={item.cost_value}
                            onChange={e => setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, cost_value: parseFloat(e.target.value) } : r))}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('repair_costs').update({ part_name: item.part_name, cost_value: item.cost_value }).eq('id', item.id);
                                if (!error) {
                                  setEditingRepairCost(null);
                                  alert('Custo salvo com sucesso!');
                                }
                              }}
                              className="flex-1 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                            >
                              Salvar
                            </button>
                            <button onClick={() => setEditingRepairCost(null)} className="flex-1 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">{item.part_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded-lg">R$ {item.cost_value}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingRepairCost(item.id)} className="text-slate-400 hover:text-slate-600"><Save className="w-4 h-4" /></button>
                              <button 
                                onClick={async () => {
                                  if (confirm('Excluir item?')) {
                                    await supabase.from('repair_costs').delete().eq('id', item.id);
                                    fetchData();
                                  }
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
