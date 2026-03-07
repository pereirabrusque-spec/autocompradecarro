import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Phone, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Image as ImageIcon, Save, Loader2, LogOut, Plus, Trash2, Upload, RefreshCw, Pencil, Users, Share2, MessageCircle, ChevronRight, ChevronLeft, Search, Filter, ShieldCheck, Wrench, Wallet, User, UserPlus, Mail, Bell, BellOff, Send, UserCheck, LayoutDashboard, Download, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';
import { supabase } from '../lib/supabase';
import { defaultCards } from '../lib/seedData';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'hero' | 'assets' | 'footer' | 'settings' | 'ai' | 'apis' | 'crm' | 'messages' | 'buyers' | 'tags' | 'users'>('dashboard');
  const [messageTab, setMessageTab] = useState<'leads' | 'internal'>('leads');
  const [internalConversations, setInternalConversations] = useState<any[]>([]);
  const [selectedInternalChat, setSelectedInternalChat] = useState<string | null>(null);
  const [internalChatMessages, setInternalChatMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleAdsId, setGoogleAdsId] = useState('');
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState('');
  const [interestedBuyers, setInterestedBuyers] = useState<any[]>([]);
  const [buyerAuthorizations, setBuyerAuthorizations] = useState<any[]>([]);
  const [sentLeads, setSentLeads] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [isSavingBuyer, setIsSavingBuyer] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: '', phone: '', email: '', category: ['carro'], type: ['normal'], sub_category: '' });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
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
  const [repairMultipliers, setRepairMultipliers] = useState<{id: string, min: number, max: number, multiplier: number}[]>([]);
  const [fipeRules, setFipeRules] = useState<any[]>([]);
  const [jurosAtraso, setJurosAtraso] = useState<number>(2);
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

  const [activeLeadTab, setActiveLeadTab] = useState<'novo' | 'proposta_enviada' | 'fechado' | 'recusado' | 'sem_interesse'>('novo');
  const [showBuyerPermissionsModal, setShowBuyerPermissionsModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [buyerPermissionsForm, setBuyerPermissionsForm] = useState({
    show_photos: true,
    show_price: true,
    show_plate: false,
    show_details: true
  });
  const [filterBrand, setFilterBrand] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [leadToWhatsApp, setLeadToWhatsApp] = useState<any>(null);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [buyerToAuth, setBuyerToAuth] = useState<any>(null);
  const [proposalCalculator, setProposalCalculator] = useState<{
    baseValue: number;
    deductions: { name: string; value: number; type: 'fixed' | 'percent' }[];
    finalValue: number;
    profitMargin: number;
    payoffValue: number;
    clientPayoffValue: number;
    docDebts: number;
    repairDebts: number;
  } | null>(null);
  const [proposalOverrides, setProposalOverrides] = useState<{ rules: Record<string, number>, repairs: Record<string, number> }>({ rules: {}, repairs: {} });

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [avarias, setAvarias] = useState<{id: string, description: string, value: number}[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [showAvariasModal, setShowAvariasModal] = useState(false);

  const [buyerPermissions, setBuyerPermissions] = useState({
    show_price: true,
    show_photos: true,
    show_plate: false,
    show_details: true,
    show_history: false
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching leads from Supabase...');
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        alert(`Erro ao buscar leads: ${leadsError.message}`);
        throw leadsError;
      }

      console.log('Leads fetched successfully:', leadsData);

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
      const { data: profilesData } = await supabase.from('profiles').select('*').order('last_login', { ascending: false });
      const { data: buyersData } = await supabase.from('interested_buyers').select('*').order('created_at', { ascending: false });
      const { data: authsData } = await supabase.from('buyer_authorizations').select('*');
      const { data: sentData } = await supabase.from('sent_leads').select('*');
      const { data: messagesData } = await supabase
        .from('mensagens')
        .select('*, leads_veiculos(marca, modelo, cliente_nome, vehicle_code, fotos)')
        .order('created_at', { ascending: false });

      // Group messages by lead_id to create conversation list
      const groupedConversations: any[] = [];
      const leadIds = new Set();
      
      if (messagesData) {
        messagesData.forEach((msg: any) => {
          if (!leadIds.has(msg.lead_id)) {
            leadIds.add(msg.lead_id);
            groupedConversations.push({
              lead_id: msg.lead_id,
              last_message: msg.conteudo,
              last_time: msg.created_at,
              lead: msg.leads_veiculos,
              unread: 0 // Placeholder for unread logic if needed
            });
          }
        });
      }

      if (assetsData) {
        const permissions = assetsData.find((a: any) => a.key === 'BUYER_VIEW_PERMISSIONS');
        if (permissions && permissions.value) {
          try {
            setBuyerPermissions(JSON.parse(permissions.value));
          } catch (e) {
            console.error('Error parsing buyer permissions:', e);
          }
        }
      }

      setConversations(groupedConversations);
      setLeads(leadsData || []);
      setDbAssets(assetsData || []);
      setBanks(banksData || []);
      setRepairCosts(repairData || []);
      setFipeRules(fipeData || []);
      setApiKeys(apiKeysData || []);
      setProviders(providersData || []);
      setUsers(profilesData || []);
      setInterestedBuyers(buyersData || []);
      setBuyerAuthorizations(authsData || []);
      setSentLeads(sentData || []);
      fetchInternalConversations();

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
        
        const repairMultipliersSetting = settingsData.find((s: any) => s.key === 'REPAIR_MULTIPLIERS');
        if (repairMultipliersSetting) {
          try {
            setRepairMultipliers(JSON.parse(repairMultipliersSetting.value));
          } catch (e) {
            console.error('Error parsing repair multipliers:', e);
            setRepairMultipliers([
              { id: '1', min: 0, max: 20000, multiplier: 1 },
              { id: '2', min: 20000, max: 60000, multiplier: 2 },
              { id: '3', min: 60000, max: 100000, multiplier: 3 }
            ]);
          }
        } else {
          setRepairMultipliers([
            { id: '1', min: 0, max: 20000, multiplier: 1 },
            { id: '2', min: 20000, max: 60000, multiplier: 2 },
            { id: '3', min: 60000, max: 100000, multiplier: 3 }
          ]);
        }
        
        const chatEnabledSetting = settingsData.find((s: any) => s.key === 'CHAT_ENABLED');
        if (chatEnabledSetting) {
          setChatEnabled(chatEnabledSetting.value === 'true');
        }

        const jurosAtrasoSetting = settingsData.find((s: any) => s.key === 'JUROS_ATRASO_FINANCIAMENTO');
        if (jurosAtrasoSetting) {
          setJurosAtraso(parseFloat(jurosAtrasoSetting.value) || 2);
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

        const gaIdSetting = settingsData.find((s: any) => s.key === 'GOOGLE_ANALYTICS_ID');
        if (gaIdSetting) setGoogleAnalyticsId(gaIdSetting.value);

        const adsIdSetting = settingsData.find((s: any) => s.key === 'GOOGLE_ADS_ID');
        if (adsIdSetting) setGoogleAdsId(adsIdSetting.value);

        const adsConvSetting = settingsData.find((s: any) => s.key === 'GOOGLE_ADS_CONVERSION_LABEL');
        if (adsConvSetting) setGoogleAdsConversionLabel(adsConvSetting.value);

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

  // Initialize proposal calculator when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.detalhes_proposta) {
        setProposalCalculator(selectedLead.detalhes_proposta);
      } else {
        const initialCalc = calculateProposal(selectedLead);
        setProposalCalculator(initialCalc);
      }
    } else {
      setProposalCalculator(null);
    }
  }, [selectedLead]);

  const fetchChatMessages = async (leadId: string) => {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setChatMessages(data || []);
    }
  };

  const fetchInternalConversations = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id},receiver_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis e compradores para os nomes
      const { data: profiles } = await supabase.from('profiles').select('id, email');
      const { data: buyers } = await supabase.from('interested_buyers').select('id, name');

      const conversationsMap = new Map();
      
      data.forEach((msg: any) => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!otherUserId) return;
        
        if (!conversationsMap.has(otherUserId)) {
          const profile = profiles?.find(p => p.id === otherUserId);
          const buyer = buyers?.find(b => b.id === otherUserId);
          
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            userName: buyer?.name || profile?.email || `Usuário ${otherUserId.substring(0, 8)}`,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0
          });
        }
      });
      
      setInternalConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error fetching internal conversations:', error);
    }
  };

  const fetchInternalMessages = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},or(receiver_id.eq.${currentUser.id},receiver_id.is.null))`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setInternalChatMessages(data || []);
    } catch (error) {
      console.error('Error fetching internal messages:', error);
    }
  };

  const handleSendInternalMessage = async (content: string) => {
    if (!currentUser || !selectedInternalChat) return;
    
    try {
      const { error } = await supabase.from('internal_messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedInternalChat,
        content: content
      });
      
      if (error) throw error;
      
      await fetchInternalMessages(selectedInternalChat);
      await fetchInternalConversations(); // Refresh last message
    } catch (error) {
      console.error('Error sending internal message:', error);
      alert('Erro ao enviar mensagem.');
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'messages' && messageTab === 'internal') {
      fetchInternalConversations();
    }
  }, [activeTab, messageTab, currentUser]);

  useEffect(() => {
    if (selectedInternalChat) {
      fetchInternalMessages(selectedInternalChat);
      
      const subscription = supabase
        .channel(`internal_chat:${selectedInternalChat}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'internal_messages'
        }, (payload) => {
          if (payload.new.sender_id === selectedInternalChat || payload.new.receiver_id === selectedInternalChat || (!payload.new.receiver_id && payload.new.sender_id === selectedInternalChat)) {
             setInternalChatMessages(prev => [...prev, payload.new]);
          }
        })
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedInternalChat, currentUser]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !adminMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const { error } = await supabase.from('mensagens').insert({
        lead_id: selectedConversation.lead_id,
        remetente: 'admin',
        conteudo: adminMessage
      });

      if (error) throw error;

      setAdminMessage('');
      await fetchChatMessages(selectedConversation.lead_id);
      await fetchData(); // Refresh conversation list
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendProposalFromChat = async () => {
    if (!selectedLead || !proposalCalculator) return;

    const message = `🚀 *PROPOSTA AUTOCOMPRA*
Olá ${selectedLead.cliente_nome}, analisamos seu ${selectedLead.marca} ${selectedLead.modelo} (${selectedLead.ano_modelo}).

Com base em nossa análise técnica e comercial, nossa proposta final é de:
💰 *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}*

Podemos prosseguir com o agendamento da vistoria?`;

    if (confirm(`Deseja enviar a proposta oficial para o cliente?\n\n"${message}"`)) {
      try {
        // 1. Salvar mensagem no chat
        const { error: msgError } = await supabase.from('mensagens').insert([{
          lead_id: selectedLead.id,
          remetente: 'admin',
          conteudo: message
        }]);
        if (msgError) throw msgError;

        // 2. Atualizar Lead
        const { error: leadError } = await supabase
          .from('leads_veiculos')
          .update({
            status: 'proposta_enviada',
            valor_proposta_final: proposalCalculator.finalValue,
            detalhes_proposta: proposalCalculator
          })
          .eq('id', selectedLead.id);
        
        if (leadError) throw leadError;
        
        alert('Proposta enviada com sucesso!');
        setShowProposalModal(false);
        await fetchChatMessages(selectedLead.id);
        await fetchData();
      } catch (err: any) {
        console.error(err);
        alert('Erro ao enviar proposta: ' + err.message);
      }
    }
  };

  const handleLearnFromChat = async () => {
    if (!selectedConversation || chatMessages.length === 0) return;

    try {
      const chatHistory = chatMessages.map(m => `${m.remetente === 'admin' ? 'Humano' : 'Cliente'}: ${m.conteudo}`).join('\n');
      const newMemory = `${aiMemory}\n\n--- Aprendizado de Conversa (${new Date().toLocaleDateString()}) ---\n${chatHistory}\n`;
      
      const { error } = await supabase.from('settings').upsert({ key: 'AI_MEMORY', value: newMemory }, { onConflict: 'key' });
      if (error) throw error;
      
      setAiMemory(newMemory);
      alert('A IA aprendeu com o histórico desta conversa!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar memória da IA.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Marca', 'Modelo', 'Ano', 'KM', 'Preço', 'Cliente', 'WhatsApp', 'Email', 'Status'];
    const rows = leads.map(l => [
      l.vehicle_code,
      new Date(l.created_at).toLocaleDateString(),
      l.marca,
      l.modelo,
      l.ano,
      l.quilometragem,
      l.preco,
      l.cliente_nome,
      l.cliente_telefone,
      l.cliente_email,
      l.status || 'Novo'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        { key: 'BUYER_VIEW_PERMISSIONS', value: JSON.stringify(buyerPermissions) },
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

  const calculateProposal = (lead: any, overrides?: { rules: Record<string, number>, repairs: Record<string, number> }) => {
    const currentOverrides = overrides || proposalOverrides;
    let baseValue = lead.valor_fipe || 0;
    const deductions: { name: string; value: number; type: 'fixed' | 'percent' }[] = [];

    // 1. Procedência / Histórico (Deduções por Porcentagem)
    const problemasSelecionados = lead.problemas || [];
    if (problemasSelecionados.length > 0) {
      problemasSelecionados.forEach((problem: string) => {
        // Tentar encontrar regra no banco
        const rule = fipeRules.find(r => r.condition_name.toLowerCase() === problem.toLowerCase());
        if (rule) {
          const percentage = currentOverrides.rules[rule.id] !== undefined ? currentOverrides.rules[rule.id] : rule.discount_percentage;
          const deductionValue = baseValue * (percentage / 100);
          deductions.push({ name: problem, value: deductionValue, type: 'percent' });
        } else {
          // Regras padrão caso não encontre no banco
          let discount = 0;
          const p = problem.toLowerCase();
          if (p.includes('sinistro')) discount = 0.30; // 30%
          else if (p.includes('leilao') || p.includes('leilão')) discount = 0.25; // 25%
          else if (p.includes('recuperado')) discount = 0.20; // 20%
          else if (p.includes('furto')) discount = 0.15; // 15%
          
          if (discount > 0) {
            deductions.push({ name: problem, value: baseValue * discount, type: 'percent' });
          }
        }
      });
    }

    // 2. Avarias (Deduções por Valor Fixo)
    let repairTotal = 0;
    const allText = `${lead.observacoes || ''} ${lead.problemas?.join(' ') || ''}`.toLowerCase();
    
    // Usar avarias do lead ou do estado global se disponível
    const avariasSelecionadas = lead.avarias || [];
    
    // Deduções manuais do modal de avarias
    const avariasManuais = lead.avarias_manuais || [];
    avariasManuais.forEach((avaria: { description: string, value: number }) => {
      repairTotal += avaria.value;
      deductions.push({ 
        name: `Avaria Manual: ${avaria.description}`, 
        value: avaria.value, 
        type: 'fixed' 
      });
    });
    
    repairCosts.forEach(cost => {
      if (avariasSelecionadas.includes(cost.id)) {
        let itemMultiplier = 1;
        if (cost.conditions && cost.conditions.length > 0) {
          for (const cond of cost.conditions) {
            if (baseValue >= cond.min_value && baseValue <= cond.max_value) {
              itemMultiplier = cond.multiplier;
              break;
            }
          }
        }
        
        let baseCost = cost.cost;
        if (currentOverrides.repairs[cost.id] !== undefined) {
          baseCost = currentOverrides.repairs[cost.id];
        }

        const finalCost = baseCost * itemMultiplier;
        repairTotal += finalCost;
        deductions.push({ 
          name: `Avaria: ${cost.part_name} (x${itemMultiplier})`, 
          value: finalCost, 
          type: 'fixed' 
        });
      }
    });

    // 3. Situação Financeira e Quitação
    let payoffValue = 0;
    let clientPayoffValue = 0;
    
    if (lead.valor_parcela && lead.total_parcelas && lead.parcelas_pagas !== undefined) {
      const remainingInstallments = lead.total_parcelas - lead.parcelas_pagas;
      if (remainingInstallments > 0) {
        const totalRemaining = remainingInstallments * lead.valor_parcela;
        
        // Find bank discount
        const bankName = lead.banco_financiamento || '';
        const bank = banks.find(b => b.name.toLowerCase() === bankName.toLowerCase());
        const bankDiscount = bank ? (bank.discount_percentage / 100) : 0.20; // Default 20%
        
        // Calculate payoff for profit (with bank discount)
        payoffValue = totalRemaining * (1 - bankDiscount);
        
        // Calculate payoff for client (valor parcelas vezes quantidade de parcelas + juros)
        const atrasadas = lead.parcelas_atrasadas || 0;
        const jurosTotal = lead.valor_parcela * atrasadas * (jurosAtraso / 100);
        clientPayoffValue = totalRemaining + jurosTotal;
      }
    }
    
    const docDebts = lead.multas || 0;

    // 4. Cálculo de Lucro (FIPE - Deduções - Quitação - Documentos - Margem)
    const totalDeductions = deductions.reduce((acc, d) => acc + d.value, 0);
    
    // Margem de lucro configurável ou padrão de 20%
    const profitMargin = baseValue * 0.2; 
    
    // Fórmula final: Lucro = FIPE - (Deduções + Quitação + Documentos + Margem)
    const finalValue = baseValue - totalDeductions - payoffValue - docDebts - profitMargin;

    return {
      baseValue,
      deductions,
      finalValue,
      profitMargin,
      payoffValue,
      clientPayoffValue,
      docDebts,
      repairDebts: repairTotal
    };
  };

  const handleSaveProposal = async (updateGlobal: boolean = false) => {
    if (!selectedLead || !proposalCalculator) return;

    try {
      // Save to lead
      const { error } = await supabase
        .from('leads_veiculos')
        .update({
          detalhes_proposta: { ...proposalCalculator, overrides: proposalOverrides },
          suggested_value: proposalCalculator.finalValue,
          fipe_value: proposalCalculator.baseValue,
          payoff_value: proposalCalculator.payoffValue,
          doc_debts: proposalCalculator.docDebts,
          repair_debts: proposalCalculator.repairDebts,
          profit_margin: proposalCalculator.profitMargin,
          selected_items: selectedLead.selected_items || []
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      if (updateGlobal) {
        // Update global rules (fipeRules)
        for (const [ruleId, percentage] of Object.entries(proposalOverrides.rules)) {
          await supabase.from('fipe_rules').update({ discount_percentage: percentage }).eq('id', ruleId);
        }
        
        // Update global repair costs
        for (const [costId, costValue] of Object.entries(proposalOverrides.repairs)) {
          await supabase.from('repair_costs').update({ cost: costValue }).eq('id', costId);
        }

        // Update AI rules/memory in settings
        const newMemory = `${aiMemory}\n\nAtualização de Regras (${new Date().toLocaleDateString()}): ${proposalCalculator.deductions.map((d: any) => `${d.name}: ${d.value}`).join(', ')}`;
        await supabase.from('settings').upsert({ key: 'AI_MEMORY', value: newMemory }, { onConflict: 'key' });
        setAiMemory(newMemory);
        
        // Refresh global data
        await fetchData();
      }

      alert('Proposta salva com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error saving proposal:', error);
      alert('Erro ao salvar proposta: ' + error.message);
    }
  };

  const handleSaveBuyer = async () => {
    if (!newBuyer.name || !newBuyer.phone) {
      alert('Nome e WhatsApp são obrigatórios.');
      return;
    }
    setIsSavingBuyer(true);
    try {
      const buyerData: any = {
        ...newBuyer,
        category: newBuyer.category.join(','),
        type: newBuyer.type.join(',')
      };
      const { error } = await supabase.from('interested_buyers').insert([buyerData]);
      if (error) throw error;
      setNewBuyer({ name: '', phone: '', email: '', category: ['carro'], type: ['normal'], sub_category: '' });
      fetchData();
      alert('Comprador cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Error saving buyer:', error);
      alert('Erro ao salvar comprador: ' + error.message);
    } finally {
      setIsSavingBuyer(false);
    }
  };

  const handleSendToWhatsApp = (lead: any, buyers: any[]) => {
    if (buyers.length === 0) {
      alert('Selecione pelo menos um comprador.');
      return;
    }
    if (buyers.length > 3) {
      alert('Selecione no máximo 3 clientes por vez.');
      return;
    }

    buyers.forEach(async (buyer) => {
      // Check for duplicate
      const isDuplicate = sentLeads.some(s => s.lead_id === lead.id && s.buyer_id === buyer.id);
      if (isDuplicate) {
        if (!confirm(`O lead ${lead.vehicle_code} já foi enviado para ${buyer.name}. Deseja enviar novamente?`)) {
          return;
        }
      }

      const message = `🚀 *OPORTUNIDADE AUTOCOMPRA*
Olá ${buyer.name}! Temos um novo veículo que pode te interessar:

🚗 *${lead.marca} ${lead.modelo}*
📅 Ano: ${lead.ano_modelo}
💰 FIPE: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)}
🔥 Sugestão de Compra: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.suggested_value || 0)}

Até que valor você acha que pode chegar para fecharmos negócio?
_Comissão a combinar após o fechamento._`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/55${buyer.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
      
      // Track sent lead
      const { error } = await supabase.from('sent_leads').insert({ lead_id: lead.id, buyer_id: buyer.id });
      if (!error) {
        setSentLeads(prev => [...prev, { lead_id: lead.id, buyer_id: buyer.id }]);
      }
      
      window.open(whatsappUrl, '_blank');
    });

    fetchData();
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-bold text-slate-900 hidden md:block">Painel Administrativo</h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            
            {/* Navigation Menu */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <LayoutDashboard className="w-3 h-3" /> Início
              </button>
              <button onClick={() => setActiveTab('leads')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'leads' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Car className="w-3 h-3" /> Leads
              </button>
              <button onClick={() => setActiveTab('messages')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'messages' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <MessageCircle className="w-3 h-3" /> Mensagens
              </button>
              <button onClick={() => setActiveTab('buyers')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'buyers' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Users className="w-3 h-3" /> Compradores
              </button>
              <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <User className="w-3 h-3" /> Usuários
              </button>
              
              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Wrench className="w-3 h-3" /> Config
              </button>
              <button onClick={() => setActiveTab('tags')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'tags' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Mkt</button>
              
              <button onClick={() => setActiveTab('hero')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'hero' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Site</button>
              <button onClick={() => setActiveTab('assets')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'assets' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Fotos</button>
              <button onClick={() => setActiveTab('footer')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'footer' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Rodapé</button>
              
              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <button onClick={() => setActiveTab('ai')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>IA</button>
              <button onClick={() => setActiveTab('apis')} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === 'apis' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>APIs</button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
             <button 
              onClick={() => window.location.href = '/'}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
              title="Ver Site"
            >
              <Share2 className="w-5 h-5" />
            </button>
             <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Leads</p>
                        <h3 className="text-2xl font-black text-slate-900">{leads.length}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+12% este mês</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vendas (Mês)</p>
                        <h3 className="text-2xl font-black text-slate-900">{leads.filter(l => l.status === 'fechado').length}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>Meta: 85%</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conversas Ativas</p>
                        <h3 className="text-2xl font-black text-slate-900">{conversations.length}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <span>Tempo médio: 4min</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compradores</p>
                        <h3 className="text-2xl font-black text-slate-900">{interestedBuyers.length}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+5 novos hoje</span>
                    </div>
                  </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent" />
                        Leads por Canal
                      </h3>
                    </div>
                    <div className="h-64 flex items-end gap-4">
                      {[60, 45, 80, 55, 90, 70, 40].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-slate-100 rounded-t-xl transition-all hover:bg-accent/20 cursor-pointer relative group"
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {h}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">D{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-accent" />
                        Status dos Leads
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Novos', count: leads.filter(l => !l.status || l.status === 'novo').length, color: 'bg-blue-500' },
                        { label: 'Em Negociação', count: leads.filter(l => l.status === 'proposta_enviada').length, color: 'bg-amber-500' },
                        { label: 'Fechados', count: leads.filter(l => l.status === 'fechado').length, color: 'bg-emerald-500' },
                        { label: 'Recusados', count: leads.filter(l => l.status === 'recusado').length, color: 'bg-red-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium text-slate-600">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Usuários Logados</h2>
                  <input 
                    type="text" 
                    placeholder="Filtrar por email..." 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.email.includes(filterUser)).map((user) => (
                        <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                (new Date().getTime() - new Date(user.last_login).getTime()) < 120000
                                  ? 'bg-emerald-500 animate-pulse' 
                                  : 'bg-slate-300'
                              }`} />
                              <span className="text-xs text-slate-500">
                                {(new Date().getTime() - new Date(user.last_login).getTime()) < 120000
                                  ? 'Online agora' 
                                  : new Date(user.last_login).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setSelectedBuyer(user);
                                setShowBuyerPermissionsModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-accent transition-all flex items-center gap-2"
                            >
                              <UserCheck className="w-3 h-3" />
                              Tornar Comprador
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'leads' ? (
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  {/* Abas de Status dos Leads */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                      onClick={handleExportCSV}
                      className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                      title="Exportar Leads para CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                    {[
                      { id: 'novo', label: 'Novos' },
                      { id: 'em_contato', label: 'Em Contato' },
                      { id: 'proposta_enviada', label: 'Proposta Enviada' },
                      { id: 'fechado', label: 'Fechados' },
                      { id: 'perdido', label: 'Perdidos' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveLeadTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                          activeLeadTab === tab.id 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto p-1">
                    <select className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                      <option value="">Todas as Marcas</option>
                      {[...new Set(leads.map(l => l.marca))].map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                    <input type="number" placeholder="Ano" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
                    <input type="number" placeholder="Min R$" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} />
                    <input type="number" placeholder="Max R$" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar por Código (4 dígitos)..."
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <button 
                      onClick={fetchData}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </button>
                  </div>
                </div>

                {selectedLead && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedLead(null)}>
                    <div 
                      className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-300"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-mono font-bold tracking-widest">
                              #{selectedLead.vehicle_code || '----'}
                            </span>
                            <h2 className="text-3xl font-bold font-display">{selectedLead.marca} {selectedLead.modelo}</h2>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              value={selectedLead.classificacao || 'morna'}
                              onChange={async (e) => {
                                const newVal = e.target.value;
                                const { error } = await supabase.from('leads_veiculos').update({ classificacao: newVal }).eq('id', selectedLead.id);
                                if (!error) setSelectedLead({...selectedLead, classificacao: newVal});
                              }}
                              className={`text-xs font-bold uppercase px-3 py-1 rounded-full border-none outline-none cursor-pointer ${
                                (selectedLead.classificacao || 'morna') === 'quente' ? 'bg-red-100 text-red-600' :
                                (selectedLead.classificacao || 'morna') === 'fria' ? 'bg-blue-100 text-blue-600' :
                                'bg-orange-100 text-orange-600'
                              }`}
                            >
                              <option value="quente">🔥 Lead Quente</option>
                              <option value="morna">🌤️ Lead Morna</option>
                              <option value="fria">❄️ Lead Fria</option>
                            </select>

                            <select
                              value={selectedLead.status}
                              onChange={async (e) => {
                                const newVal = e.target.value;
                                const { error } = await supabase.from('leads_veiculos').update({ status: newVal }).eq('id', selectedLead.id);
                                if (!error) setSelectedLead({...selectedLead, status: newVal});
                              }}
                              className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600 border-none outline-none cursor-pointer"
                            >
                              <option value="novo">Novo</option>
                              <option value="em_contato">Em Contato</option>
                              <option value="proposta_enviada">Proposta Enviada</option>
                              <option value="fechado">Fechado (Venda)</option>
                              <option value="perdido">Perdido</option>
                            </select>
                          </div>
                        </div>
                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full">
                          <LogOut className="w-6 h-6 rotate-45" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Coluna Esquerda: Fotos e Dados */}
                        <div className="lg:col-span-5 space-y-6">
                          {/* Carrossel de Fotos */}
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 group">
                            {selectedLead.fotos && selectedLead.fotos.length > 0 ? (
                              <>
                                <img 
                                  src={selectedLead.fotos[currentPhotoIndex]} 
                                  alt="Veículo" 
                                  className="w-full h-full object-cover"
                                />
                                {selectedLead.fotos.length > 1 && (
                                  <>
                                    <button 
                                      onClick={() => setCurrentPhotoIndex(prev => (prev === 0 ? selectedLead.fotos.length - 1 : prev - 1))}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={() => setCurrentPhotoIndex(prev => (prev === selectedLead.fotos.length - 1 ? 0 : prev + 1))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                      {selectedLead.fotos.map((_: any, i: number) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-12 h-12" />
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50 p-5 rounded-2xl space-y-4">
                            <h3 className="font-bold flex items-center justify-between gap-2 text-slate-900 border-b border-slate-200 pb-2">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-accent" />
                                Dados do Veículo
                              </span>
                              <button 
                                onClick={async () => {
                                  const { error } = await supabase.from('leads_veiculos').update(selectedLead).eq('id', selectedLead.id);
                                  if (error) alert('Erro ao salvar: ' + error.message);
                                  else alert('Dados salvos!');
                                }}
                                className="text-[10px] bg-accent text-white px-2 py-1 rounded hover:bg-orange-600"
                              >
                                SALVAR
                              </button>
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Cliente</p>
                                <input 
                                  type="text"
                                  value={selectedLead.cliente_nome || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, cliente_nome: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Telefone</p>
                                <input 
                                  type="text"
                                  value={selectedLead.telefone || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, telefone: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Marca</p>
                                <input 
                                  type="text"
                                  value={selectedLead.marca || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, marca: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Modelo</p>
                                <input 
                                  type="text"
                                  value={selectedLead.modelo || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, modelo: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Ano/Modelo</p>
                                <input 
                                  type="number"
                                  value={selectedLead.ano_modelo || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, ano_modelo: parseInt(e.target.value)})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Cor</p>
                                <input 
                                  type="text"
                                  value={selectedLead.cor || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, cor: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">KM</p>
                                <input 
                                  type="number"
                                  value={selectedLead.quilometragem || 0}
                                  onChange={(e) => setSelectedLead({...selectedLead, quilometragem: parseFloat(e.target.value)})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">FIPE</p>
                                <input 
                                  type="number"
                                  value={selectedLead.valor_fipe || 0}
                                  onChange={(e) => setSelectedLead({...selectedLead, valor_fipe: parseFloat(e.target.value)})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                              <div className="col-span-2">
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Placa</p>
                                <input 
                                  type="text"
                                  value={selectedLead.placa || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, placa: e.target.value})}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-5 rounded-2xl space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2">
                              <Wallet className="w-5 h-5 text-accent" />
                              Financeiro & Condição
                            </h3>
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Situação Financeira</p>
                                <p className="font-bold capitalize">{selectedLead.situacao_financeira?.replace('_', ' ') || 'Não informada'}</p>
                              </div>
                              {selectedLead.situacao_financeira === 'financiado' && (
                                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                                  <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Banco</p>
                                    <p className="font-bold text-xs">{selectedLead.banco || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Valor Parcela</p>
                                    <input 
                                      type="number"
                                      value={selectedLead.valor_parcela || 0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const updatedLead = { ...selectedLead, valor_parcela: val };
                                        setSelectedLead(updatedLead);
                                        setProposalCalculator(calculateProposal(updatedLead));
                                      }}
                                      className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Pagas</p>
                                    <input 
                                      type="number"
                                      value={selectedLead.parcelas_pagas || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const updatedLead = { ...selectedLead, parcelas_pagas: val };
                                        setSelectedLead(updatedLead);
                                        setProposalCalculator(calculateProposal(updatedLead));
                                      }}
                                      className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Total</p>
                                    <input 
                                      type="number"
                                      value={selectedLead.total_parcelas || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const updatedLead = { ...selectedLead, total_parcelas: val };
                                        setSelectedLead(updatedLead);
                                        setProposalCalculator(calculateProposal(updatedLead));
                                      }}
                                      className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Parcelas Atrasadas</p>
                                    <input 
                                      type="number"
                                      value={selectedLead.parcelas_atrasadas || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const updatedLead = { ...selectedLead, parcelas_atrasadas: val };
                                        setSelectedLead(updatedLead);
                                        setProposalCalculator(calculateProposal(updatedLead));
                                      }}
                                      className="w-full p-1 border border-slate-200 rounded text-xs font-bold"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Débitos (Multas/IPVA)</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-slate-500">R$</span>
                                  <input 
                                    type="number"
                                    value={selectedLead.multas || 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updatedLead = { ...selectedLead, multas: val };
                                      setSelectedLead(updatedLead);
                                      setProposalCalculator(calculateProposal(updatedLead));
                                    }}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                                  />
                                </div>
                              </div>
                              {selectedLead.problemas && selectedLead.problemas.length > 0 && (
                                <div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px]">Histórico / Problemas</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedLead.problemas.map((p: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedLead.selected_items && selectedLead.selected_items.length > 0 && (
                                <div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px]">Opcionais</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedLead.selected_items.map((item: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedLead.observacoes && (
                                <div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px]">Observações do Cliente</p>
                                  <p className="text-xs bg-white p-2 rounded-lg border border-slate-200 mt-1">{selectedLead.observacoes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-5 rounded-2xl space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2">
                              <Users className="w-5 h-5 text-accent" />
                              Dados do Cadastro
                            </h3>
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Cliente</p>
                                <p className="font-bold">{selectedLead.cliente_nome}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Telefone</p>
                                <p className="font-bold">{selectedLead.telefone}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Data</p>
                                <p className="font-bold">{new Date(selectedLead.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Coluna Direita: Descontos, Proposta e Envio */}
                        <div className="lg:col-span-7 space-y-6">
                          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-accent" />
                              Cálculo da Proposta
                            </h3>

                            {proposalCalculator && (
                              <div className="space-y-6">
                                {/* Histórico de Procedência */}
                                <div className="space-y-3">
                                  <p className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Histórico de Procedência
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {fipeRules.map((rule) => {
                                      const isSelected = (selectedLead.problemas || []).includes(rule.condition_name);
                                      return (
                                        <label key={rule.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                          <input 
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const currentProblemas = selectedLead.problemas || [];
                                              let newProblemas;
                                              if (e.target.checked) {
                                                newProblemas = [...currentProblemas, rule.condition_name];
                                              } else {
                                                newProblemas = currentProblemas.filter((p: string) => p !== rule.condition_name);
                                              }
                                              const updatedLead = { ...selectedLead, problemas: newProblemas };
                                              setSelectedLead(updatedLead);
                                              setProposalCalculator(calculateProposal(updatedLead));
                                            }}
                                            className="w-3 h-3 rounded border-slate-300 text-red-500 focus:ring-red-500"
                                          />
                                          <span className={`text-[10px] font-bold ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>{rule.condition_name}</span>
                                          <div className="ml-auto flex items-center gap-1">
                                            <span className={`text-[9px] font-black ${isSelected ? 'text-red-700' : 'text-slate-400'}`}>-</span>
                                            <input 
                                              type="number"
                                              value={proposalOverrides.rules[rule.id] !== undefined ? proposalOverrides.rules[rule.id] : rule.discount_percentage}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newVal = parseFloat(e.target.value);
                                                const newOverrides = {
                                                  ...proposalOverrides,
                                                  rules: { ...proposalOverrides.rules, [rule.id]: newVal }
                                                };
                                                setProposalOverrides(newOverrides);
                                                setProposalCalculator(calculateProposal(selectedLead, newOverrides));
                                              }}
                                              className={`w-8 text-right text-[9px] font-black bg-transparent border-b border-transparent focus:border-red-500 outline-none ${isSelected ? 'text-red-700' : 'text-slate-400'}`}
                                              disabled={!isSelected}
                                            />
                                            <span className={`text-[9px] font-black ${isSelected ? 'text-red-700' : 'text-slate-400'}`}>%</span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Problemas de Avaria */}
                                <div className="space-y-3">
                                  <p className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" />
                                    Problemas de Avaria
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                    {repairCosts.map((cost) => {
                                      const allText = `${selectedLead.observacoes || ''} ${selectedLead.problemas?.join(' ') || ''}`.toLowerCase();
                                      const avariasSelecionadas = selectedLead.avarias || repairCosts.filter(c => allText.includes(c.part_name.toLowerCase())).map(c => c.id);
                                      const isSelected = avariasSelecionadas.includes(cost.id);
                                      
                                      // Find multiplier
                                      let itemMultiplier = 1;
                                      if (cost.conditions && cost.conditions.length > 0) {
                                        for (const cond of cost.conditions) {
                                          if ((selectedLead.valor_fipe || 0) >= cond.min_value && (selectedLead.valor_fipe || 0) <= cond.max_value) {
                                            itemMultiplier = cond.multiplier;
                                            break;
                                          }
                                        }
                                      }
                                      const finalCost = cost.cost * itemMultiplier;

                                      return (
                                        <label key={cost.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                          <input 
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              let newAvarias;
                                              if (e.target.checked) {
                                                newAvarias = [...avariasSelecionadas, cost.id];
                                              } else {
                                                newAvarias = avariasSelecionadas.filter((id: string) => id !== cost.id);
                                              }
                                              const updatedLead = { ...selectedLead, avarias: newAvarias };
                                              setSelectedLead(updatedLead);
                                              setProposalCalculator(calculateProposal(updatedLead));
                                            }}
                                            className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                          />
                                          <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-700' : 'text-slate-600'}`}>{cost.part_name}</span>
                                          <div className="ml-auto flex items-center gap-1">
                                            <span className={`text-[9px] font-black ${isSelected ? 'text-orange-700' : 'text-slate-400'}`}>-R$</span>
                                            <input 
                                              type="number"
                                              value={proposalOverrides.repairs[cost.id] !== undefined ? (proposalOverrides.repairs[cost.id] * itemMultiplier).toFixed(2) : finalCost.toFixed(2)}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newVal = parseFloat(e.target.value) / itemMultiplier;
                                                const newOverrides = {
                                                  ...proposalOverrides,
                                                  repairs: { ...proposalOverrides.repairs, [cost.id]: newVal }
                                                };
                                                setProposalOverrides(newOverrides);
                                                setProposalCalculator(calculateProposal(selectedLead, newOverrides));
                                              }}
                                              className={`w-16 text-right text-[9px] font-black bg-transparent border-b border-transparent focus:border-orange-500 outline-none ${isSelected ? 'text-orange-700' : 'text-slate-400'}`}
                                              disabled={!isSelected}
                                            />
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Situação Financeira */}
                                <div className="space-y-3">
                                  <p className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" />
                                    Situação Financeira
                                  </p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Quitação</p>
                                      <p className="font-black text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.payoffValue)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Débitos (Doc/IPVA)</p>
                                      <p className="font-black text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.docDebts)}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Resumo Final */}
                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold">Margem de Lucro (20%)</span>
                                    <span className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.profitMargin)}</span>
                                  </div>
                                  <div className="p-5 bg-slate-900 rounded-2xl text-white">
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Valor Sugerido de Compra</p>
                                    <p className="text-3xl font-black text-accent">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <button 
                                    onClick={() => handleSaveProposal(false)}
                                    className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Save className="w-5 h-5" />
                                    Salvar Cotação
                                  </button>
                                  <button 
                                    onClick={() => handleSaveProposal(true)}
                                    className="py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="w-5 h-5" />
                                    Salvar e Atualizar IA
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Seção de Envio e Compradores (Agora na mesma coluna) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                              <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-accent" />
                                Resumo para Envio
                              </h3>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 mb-6">
                              <p><strong>Veículo:</strong> {selectedLead.marca} {selectedLead.modelo}</p>
                              <p><strong>Ano:</strong> {selectedLead.ano_modelo}</p>
                              <p><strong>FIPE:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_fipe || 0)}</p>
                              <p><strong>Desejado:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.preco_cliente || 0)}</p>
                              <div className="pt-2 border-t border-slate-200">
                                <p className="font-bold text-accent">Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.suggested_value || 0)}</p>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => {
                                const buyers = interestedBuyers.filter(b => selectedBuyers.includes(b.id));
                                handleSendToWhatsApp(selectedLead, buyers);
                              }}
                              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-5 h-5" />
                              Enviar para WhatsApp
                            </button>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-accent" />
                              Selecionar Compradores
                            </h3>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {interestedBuyers.map(buyer => (
                                <label key={buyer.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedBuyers.includes(buyer.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedBuyers([...selectedBuyers, buyer.id]);
                                      else setSelectedBuyers(selectedBuyers.filter(id => id !== buyer.id));
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                                  />
                                  <div className="flex-grow">
                                    <p className="text-xs font-bold">{buyer.name}</p>
                                    <p className="text-[10px] text-slate-400">{buyer.category} - {buyer.type}</p>
                                  </div>
                                  {sentLeads.some(s => s.lead_id === selectedLead.id && s.buyer_id === buyer.id) && (
                                    <div className="w-2 h-2 rounded-full bg-red-500" title="Já enviado" />
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}

                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Veículo</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Código</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Ano/Modelo</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">FIPE</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Desejado</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Sugerido</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Contato</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter(l => l.status === activeLeadTab)
                          .filter(l => !searchCode || (l.vehicle_code && l.vehicle_code.includes(searchCode)))
                          .filter(l => !filterBrand || l.marca === filterBrand)
                          .filter(l => !filterYear || l.ano_modelo === parseInt(filterYear))
                          .filter(l => !filterMinPrice || (l.preco_cliente || 0) >= parseFloat(filterMinPrice))
                          .filter(l => !filterMaxPrice || (l.preco_cliente || 0) <= parseFloat(filterMaxPrice))
                          .map((lead) => (
                          <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                            setSelectedLead(lead);
                            setProposalCalculator(calculateProposal(lead));
                            setSelectedBuyers([]);
                            setCurrentPhotoIndex(0);
                          }}>
                            <td className="px-6 py-4">
                              <select 
                                value={lead.status || 'novo'} 
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
                                  await supabase.from('leads_veiculos').update({ status: newStatus }).eq('id', lead.id);
                                }}
                                className={`text-xs font-bold uppercase px-2 py-1 rounded border-none outline-none cursor-pointer ${
                                  lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-700' :
                                  lead.status === 'perdido' ? 'bg-red-100 text-red-700' :
                                  lead.status === 'proposta_enviada' ? 'bg-blue-100 text-blue-700' :
                                  lead.status === 'em_contato' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <option value="novo">Novo</option>
                                <option value="em_contato">Em Contato</option>
                                <option value="proposta_enviada">Proposta Enviada</option>
                                <option value="fechado">Fechado</option>
                                <option value="perdido">Perdido</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                  {lead.fotos && lead.fotos[0] ? (
                                    <img src={lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{lead.marca} {lead.modelo}</p>
                                  <p className="text-xs text-slate-400">{lead.cliente_nome}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono font-bold">
                                {lead.vehicle_code || '----'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{lead.ano_modelo}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.preco_cliente || 0)}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-accent">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.suggested_value || 0)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {lead.telefone && (
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setLeadToWhatsApp(lead); 
                                      setShowWhatsAppModal(true); 
                                    }} 
                                    className="p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-600" 
                                    title="WhatsApp"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </button>
                                )}
                                {lead.email && (
                                  <a href={`mailto:${lead.email}`} className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600" onClick={(e) => e.stopPropagation()} title="E-mail">
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                <Pencil className="w-4 h-4 text-slate-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'buyers' ? (
              <div className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-accent" />
                    Cadastrar Novo Comprador (Investidor)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Ex: João Silva"
                        value={newBuyer.name}
                        onChange={(e) => setNewBuyer({...newBuyer, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp (com DDD)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Ex: 11999999999"
                        value={newBuyer.phone}
                        onChange={(e) => setNewBuyer({...newBuyer, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail (Para Login)</label>
                      <input 
                        type="email"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="email@comprador.com"
                        value={newBuyer.email}
                        onChange={(e) => setNewBuyer({...newBuyer, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria Principal</label>
                      <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {['carro', 'moto', 'caminhao'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newBuyer.category.includes(cat)}
                              onChange={(e) => {
                                const newCategories = e.target.checked 
                                  ? [...newBuyer.category, cat]
                                  : newBuyer.category.filter(c => c !== cat);
                                setNewBuyer({...newBuyer, category: newCategories});
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                            />
                            <span className="text-sm font-bold capitalize">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subcategorias (Preferências)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Ex: SUV, Sedan, Diesel, Repasse"
                        value={newBuyer.sub_category}
                        onChange={(e) => setNewBuyer({...newBuyer, sub_category: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil de Investimento</label>
                      <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {[
                          { id: 'popular', label: 'Popular (Até 50k)' },
                          { id: 'normal', label: 'Normal (50k - 150k)' },
                          { id: 'premium', label: 'Premium (Acima 150k)' }
                        ].map(t => (
                          <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newBuyer.type.includes(t.id)}
                              onChange={(e) => {
                                const newTypes = e.target.checked 
                                  ? [...newBuyer.type, t.id]
                                  : newBuyer.type.filter(type => type !== t.id);
                                setNewBuyer({...newBuyer, type: newTypes});
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                            />
                            <span className="text-sm font-bold">{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveBuyer}
                    disabled={isSavingBuyer}
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingBuyer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Cadastrar Comprador e Autorizar Acesso
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Lista de Compradores */}
                  <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Base de Compradores</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                          {interestedBuyers.length} Ativos
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Nome / E-mail</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Preferências</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {interestedBuyers.map((buyer) => (
                            <tr key={buyer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{buyer.name}</p>
                                <p className="text-[10px] text-slate-400">{buyer.email}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{buyer.phone}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                                    {buyer.category}
                                  </span>
                                  {buyer.sub_category && buyer.sub_category.split(',').map((s: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold uppercase">
                                      {s.trim()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setBuyerToAuth(buyer);
                                      setShowAuthModal(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-accent transition-colors"
                                    title="Autorizar Acesso"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (confirm('Excluir este comprador?')) {
                                        const { error } = await supabase.from('interested_buyers').delete().eq('id', buyer.id);
                                        if (!error) setInterestedBuyers(prev => prev.filter(b => b.id !== buyer.id));
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Painel de Autorização Rápida */}
                  <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm h-fit">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      Autorização de Visualização
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Selecione um lead e os compradores que poderão ver as fotos e detalhes técnicos (sem dados do vendedor).
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Selecionar Lead</label>
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                          onChange={(e) => {
                            const lead = leads.find(l => l.id === e.target.value);
                            setSelectedLead(lead);
                          }}
                        >
                          <option value="">Selecione um veículo...</option>
                          {leads.filter(l => l.status !== 'perdido').map(l => (
                            <option key={l.id} value={l.id}>#{l.vehicle_code} - {l.marca} {l.modelo}</option>
                          ))}
                        </select>
                      </div>

                      {selectedLead && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Autorizar Compradores</label>
                          <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2">
                            {interestedBuyers.map(buyer => {
                              const isAuthorized = buyerAuthorizations.some(a => a.buyer_id === buyer.id && a.lead_id === selectedLead.id);
                              return (
                                <label key={buyer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={isAuthorized}
                                      onChange={async (e) => {
                                        if (e.target.checked) {
                                          const { data, error } = await supabase.from('buyer_authorizations').insert({
                                            buyer_id: buyer.id,
                                            lead_id: selectedLead.id
                                          }).select().single();
                                          if (!error) setBuyerAuthorizations(prev => [...prev, data]);
                                        } else {
                                          const { error } = await supabase.from('buyer_authorizations').delete().eq('buyer_id', buyer.id).eq('lead_id', selectedLead.id);
                                          if (!error) setBuyerAuthorizations(prev => prev.filter(a => !(a.buyer_id === buyer.id && a.lead_id === selectedLead.id)));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                                    />
                                    <div>
                                      <p className="text-xs font-bold">{buyer.name}</p>
                                      <p className="text-[9px] text-slate-400">{buyer.category}</p>
                                    </div>
                                  </div>
                                  {isAuthorized && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-center text-slate-400">
                            Os compradores selecionados poderão ver este veículo em sua área restrita.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ) : activeTab === 'crm' ? (
              <div className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-accent" />
                    Cadastrar Novo Comprador Interessado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Ex: João Silva"
                        value={newBuyer.name}
                        onChange={(e) => setNewBuyer({...newBuyer, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp (com DDD)</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Ex: 11999999999"
                        value={newBuyer.phone}
                        onChange={(e) => setNewBuyer({...newBuyer, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria de Interesse</label>
                      <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {['carro', 'moto', 'caminhao'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newBuyer.category.includes(cat)}
                              onChange={(e) => {
                                const newCategories = e.target.checked 
                                  ? [...newBuyer.category, cat]
                                  : newBuyer.category.filter(c => c !== cat);
                                setNewBuyer({...newBuyer, category: newCategories});
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                            />
                            <span className="text-sm font-bold capitalize">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil de Compra</label>
                      <div className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {[
                          { id: 'popular', label: 'Popular (Até 50k)' },
                          { id: 'normal', label: 'Normal (50k - 150k)' },
                          { id: 'premium', label: 'Premium (Acima 150k)' }
                        ].map(t => (
                          <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newBuyer.type.includes(t.id)}
                              onChange={(e) => {
                                const newTypes = e.target.checked 
                                  ? [...newBuyer.type, t.id]
                                  : newBuyer.type.filter(type => type !== t.id);
                                setNewBuyer({...newBuyer, type: newTypes});
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                            />
                            <span className="text-sm font-bold">{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveBuyer}
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Comprador no CRM
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Base de Compradores Ativos</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      {interestedBuyers.length} Compradores
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Nome</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Categoria</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Perfil</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Notificação</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interestedBuyers.map((buyer) => (
                          <tr key={buyer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  buyer.last_seen && (new Date().getTime() - new Date(buyer.last_seen).getTime() < 120000)
                                    ? 'bg-green-500 animate-pulse' 
                                    : 'bg-slate-300'
                                }`} />
                                <div>
                                  <p className="font-bold text-slate-900 leading-none mb-1">{buyer.name}</p>
                                  <p className="text-[9px] text-slate-400 leading-none">
                                    {buyer.last_seen && (new Date().getTime() - new Date(buyer.last_seen).getTime() < 120000)
                                      ? 'Online agora'
                                      : buyer.last_seen 
                                        ? `Visto ${new Date(buyer.last_seen).toLocaleString()}`
                                        : 'Nunca logou'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{buyer.phone}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                {buyer.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                buyer.type === 'premium' ? 'bg-purple-100 text-purple-600' :
                                buyer.type === 'normal' ? 'bg-blue-100 text-blue-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {buyer.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {buyer.notifications_enabled === true ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <Bell className="w-3 h-3" /> Ativa
                                  </span>
                                ) : buyer.notifications_enabled === false ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                    <BellOff className="w-3 h-3" /> Recusada
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                    <Clock className="w-3 h-3" /> Pendente
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('interested_buyers')
                                      .update({ notifications_enabled: true })
                                      .eq('id', buyer.id);
                                    if (!error) {
                                      setInterestedBuyers(prev => prev.map(b => b.id === buyer.id ? {...b, notifications_enabled: true} : b));
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                  title="Forçar Autorização de Notificação"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm('Excluir este comprador?')) {
                                      const { error } = await supabase.from('interested_buyers').delete().eq('id', buyer.id);
                                      if (!error) setInterestedBuyers(prev => prev.filter(b => b.id !== buyer.id));
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'messages' ? (
              <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex h-[700px]">
                {/* Lista de Conversas (Esquerda) */}
                <div className="w-1/3 border-r border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => setMessageTab('leads')} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${messageTab === 'leads' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        Leads
                      </button>
                      <button 
                        onClick={() => setMessageTab('internal')} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${messageTab === 'internal' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        Suporte Interno
                      </button>
                    </div>
                    <h3 className="text-xl font-bold mb-4">Conversas</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {messageTab === 'leads' ? (
                      conversations.map((conv) => (
                      <div 
                        key={conv.lead_id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          fetchChatMessages(conv.lead_id);
                          const lead = leads.find(l => l.id === conv.lead_id);
                          if (lead) {
                            setSelectedLead(lead);
                            setProposalCalculator(calculateProposal(lead));
                          }
                        }}
                        className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedConversation?.lead_id === conv.lead_id ? 'bg-slate-50' : ''}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                          {conv.lead?.fotos && conv.lead.fotos[0] ? (
                            <img src={conv.lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col min-w-0">
                              <h4 className="font-bold text-slate-900 truncate">{conv.lead?.cliente_nome || 'Cliente'}</h4>
                              <p className="text-[10px] text-slate-500 truncate">{conv.lead?.cliente_email || 'Sem email'}</p>
                              <span className="text-[10px] font-mono font-bold text-slate-400">#{conv.lead?.vehicle_code || '----'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                      internalConversations.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          Nenhuma conversa interna encontrada.
                        </div>
                      ) : (
                        internalConversations.map(conv => (
                          <div 
                            key={conv.userId}
                            onClick={() => setSelectedInternalChat(conv.userId)}
                            className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedInternalChat === conv.userId ? 'bg-slate-50' : ''}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                              {conv.userId.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900 truncate">{conv.userName}</h4>
                                <span className="text-[10px] text-slate-400">{new Date(conv.lastMessageTime).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>

                {/* Janela de Chat (Direita) */}
                <div className="flex-1 flex flex-col bg-slate-50/50">
                  {messageTab === 'leads' ? (
                    selectedConversation ? (
                    <>
                      {/* Cabeçalho do Chat */}
                      <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                            {selectedConversation.lead?.fotos && selectedConversation.lead.fotos[0] ? (
                              <img src={selectedConversation.lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{selectedConversation.lead?.cliente_nome}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">#{selectedConversation.lead?.vehicle_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedConversation.lead?.cliente_email && (
                            <a 
                              href={`mailto:${selectedConversation.lead.cliente_email}`}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                              title="Enviar Email"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {selectedConversation.lead?.cliente_telefone && (
                            <a 
                              href={`https://wa.me/${selectedConversation.lead.cliente_telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <div className="h-6 w-px bg-slate-200 mx-2" />
                          <button 
                            onClick={handleLearnFromChat}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                            title="Adicionar histórico desta conversa à memória da IA"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            IA: Aprender
                          </button>
                          <button 
                            onClick={() => setShowProposalModal(true)}
                            className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-bold text-xs hover:bg-accent/20 transition-all flex items-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Ver Proposta
                          </button>
                        </div>
                      </div>

                      {/* Mensagens */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id}
                            className={`flex ${msg.remetente === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                              msg.remetente === 'admin' 
                                ? 'bg-slate-900 text-white rounded-tr-none' 
                                : 'bg-blue-50 text-blue-900 rounded-tl-none border border-blue-100'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                              <span className={`text-[9px] mt-1 block ${msg.remetente === 'admin' ? 'text-slate-400' : 'text-slate-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input de Mensagem */}
                      <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex gap-2">
                          <textarea 
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none h-12"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                          <button 
                            onClick={handleSendMessage}
                            disabled={isSendingMessage || !adminMessage.trim()}
                            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                          Você está assumindo a conversa como <strong>Humano</strong>. A IA aprenderá com suas respostas.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                      <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                      <h3 className="text-xl font-bold text-slate-400">Selecione uma conversa</h3>
                      <p className="text-sm max-w-xs">Escolha um cliente na lista ao lado para visualizar o histórico e assumir o atendimento.</p>
                    </div>
                  )
                ) : (
                    selectedInternalChat ? (
                      <>
                        <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">Chat Interno</h3>
                            <p className="text-xs text-slate-500">ID: {selectedInternalChat}</p>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {internalChatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender_id === currentUser?.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'}`}>
                                {msg.content}
                                <p className={`text-[10px] mt-1 text-right ${msg.sender_id === currentUser?.id ? 'text-slate-400' : 'text-slate-300'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                            if (input.value.trim()) {
                              handleSendInternalMessage(input.value);
                              input.value = '';
                            }
                          }}
                          className="p-4 bg-white border-t border-slate-100 flex gap-2"
                        >
                          <input 
                            name="message"
                            type="text" 
                            placeholder="Digite sua mensagem..." 
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <button type="submit" className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                            <Send className="w-5 h-5" />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4">
                        <MessageCircle className="w-12 h-12 opacity-20" />
                        <p>Selecione uma conversa interna para ver as mensagens</p>
                      </div>
                    )
                  )}
                </div>

                {/* Modal de Proposta (dentro do chat) */}
                {showProposalModal && selectedLead && proposalCalculator && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold">Proposta: {selectedLead.marca} {selectedLead.modelo}</h3>
                          <p className="text-sm text-slate-400">#{selectedLead.vehicle_code} • Cliente: {selectedLead.cliente_nome}</p>
                        </div>
                        <button onClick={() => setShowProposalModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                          <LogOut className="w-6 h-6 rotate-45" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna 1: Dados do Cliente & Resumo */}
                        <div className="space-y-6">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                              <User className="w-4 h-4 text-accent" />
                              Dados Preenchidos pelo Cliente
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Quilometragem</p>
                                <p className="font-bold">{selectedLead.quilometragem} km</p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Situação</p>
                                <p className="font-bold">{selectedLead.situacao}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Preço Desejado</p>
                                <p className="font-bold text-green-600">
                                  <span className="text-2xl font-bold text-accent">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.preco_cliente || 0)}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Financiamento</p>
                                <p className="font-bold">{selectedLead.situacao_financeira}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <h4 className="text-sm font-bold mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-accent" />
                                Resumo para o Cliente (Selecionáveis)
                              </div>
                              <button onClick={() => setShowAvariasModal(true)} className="text-xs text-accent font-bold hover:underline">
                                + Avarias/Problemas
                              </button>
                            </h4>
                            <p className="text-[10px] text-slate-400 mb-4">Marque os itens que deseja mostrar no resumo oficial enviado ao cliente.</p>
                            <div className="space-y-2">
                              {[
                                { id: 'fipe', label: 'Valor FIPE' },
                                { id: 'km', label: 'Quilometragem' },
                                { id: 'situacao', label: 'Situação Geral' },
                                { id: 'pneus', label: 'Estado dos Pneus' },
                                { id: 'pintura', label: 'Estado da Pintura' },
                                { id: 'deducoes', label: 'Lista de Deduções' },
                                { id: 'quitacao', label: 'Valor de Quitação' }
                              ].map(item => (
                                <label key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                                  <input 
                                    type="checkbox"
                                    checked={(selectedLead.selected_items || []).includes(item.id)}
                                    onChange={(e) => {
                                      const current = selectedLead.selected_items || [];
                                      const newVal = e.target.checked 
                                        ? [...current, item.id]
                                        : current.filter((i: string) => i !== item.id);
                                      setSelectedLead({...selectedLead, selected_items: newVal});
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                                  />
                                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                </label>
                              ))}
                              <div className="flex gap-2 mt-4">
                                <button 
                                  onClick={() => setSelectedLead({...selectedLead, selected_items: ['fipe', 'km', 'situacao', 'pneus', 'pintura', 'deducoes', 'quitacao']})}
                                  className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-300"
                                >
                                  Marcar Todos
                                </button>
                                <button 
                                  onClick={() => setSelectedLead({...selectedLead, selected_items: []})}
                                  className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-200"
                                >
                                  Desmarcar Todos
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Coluna 2: Calculadora & Regras */}
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor FIPE</label>
                              <input 
                                type="number"
                                value={proposalCalculator.baseValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setProposalCalculator({...proposalCalculator, baseValue: val, finalValue: val - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - proposalCalculator.payoffValue - proposalCalculator.docDebts - proposalCalculator.profitMargin});
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem de Lucro</label>
                              <input 
                                type="number"
                                value={proposalCalculator.profitMargin}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setProposalCalculator({...proposalCalculator, profitMargin: val, finalValue: proposalCalculator.baseValue - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - proposalCalculator.payoffValue - proposalCalculator.docDebts - val});
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dívidas/Multas</label>
                              <input 
                                type="number"
                                value={proposalCalculator.docDebts}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setProposalCalculator({...proposalCalculator, docDebts: val, finalValue: proposalCalculator.baseValue - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - proposalCalculator.payoffValue - val - proposalCalculator.profitMargin});
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quitação Banco</label>
                              <input 
                                type="number"
                                value={proposalCalculator.payoffValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setProposalCalculator({...proposalCalculator, payoffValue: val, finalValue: proposalCalculator.baseValue - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - val - proposalCalculator.docDebts - proposalCalculator.profitMargin});
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                              />
                              {selectedLead.valor_parcela && selectedLead.total_parcelas && (
                                <div className="text-[9px] text-slate-400 mt-1">
                                  <p>Custo (Lucro): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.payoffValue)}</p>
                                  <p>Para Cliente: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.clientPayoffValue || 0)}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deduções (Avarias/Histórico)</label>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                              {proposalCalculator.deductions.map((deduction, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                                  <span className="text-slate-600">{deduction.name}</span>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number"
                                      value={deduction.value}
                                      onChange={(e) => {
                                        const newVal = parseFloat(e.target.value) || 0;
                                        const newDeductions = [...proposalCalculator.deductions];
                                        newDeductions[idx].value = newVal;
                                        const totalDeductions = newDeductions.reduce((acc, d) => acc + d.value, 0);
                                        setProposalCalculator({
                                          ...proposalCalculator, 
                                          deductions: newDeductions,
                                          finalValue: proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - proposalCalculator.profitMargin
                                        });
                                      }}
                                      className="w-20 p-1 border border-slate-200 rounded text-right font-bold"
                                    />
                                    <button 
                                      onClick={() => {
                                        const newDeductions = proposalCalculator.deductions.filter((_, i) => i !== idx);
                                        const totalDeductions = newDeductions.reduce((acc, d) => acc + d.value, 0);
                                        setProposalCalculator({
                                          ...proposalCalculator, 
                                          deductions: newDeductions,
                                          finalValue: proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - proposalCalculator.profitMargin
                                        });
                                      }}
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const name = prompt('Nome da dedução:');
                                  const value = parseFloat(prompt('Valor da dedução:') || '0');
                                  if (name && value) {
                                    const newDeductions: { name: string; value: number; type: 'fixed' | 'percent' }[] = [
                                      ...proposalCalculator.deductions, 
                                      { name, value, type: 'fixed' }
                                    ];
                                    const totalDeductions = newDeductions.reduce((acc, d) => acc + d.value, 0);
                                    setProposalCalculator({
                                      ...proposalCalculator, 
                                      deductions: newDeductions,
                                      finalValue: proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - proposalCalculator.profitMargin
                                    });
                                  }
                                }}
                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-accent hover:text-accent transition-all"
                              >
                                + Adicionar Dedução
                              </button>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-900 rounded-2xl text-white">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Valor Final Sugerido</p>
                            <p className="text-3xl font-black text-accent">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <button 
                              onClick={() => handleSaveProposal(false)}
                              className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                              <Save className="w-5 h-5" />
                              Salvar na Proposta
                            </button>
                            <button 
                              onClick={() => handleSaveProposal(true)}
                              className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-5 h-5" />
                              Salvar e Atualizar Regras (IA)
                            </button>
                            <button 
                              onClick={handleSendProposalFromChat}
                              className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-5 h-5" />
                              Enviar Resumo Oficial p/ WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'hero' ? (
          <div className="space-y-6">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-8">
              <h3 className="text-xl font-bold mb-4">Configurações de Automação</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">IA Automática (Sem revisão humana)</label>
                  <p className="text-xs text-slate-500">Quando ativado, a IA envia propostas diretamente ao cliente.</p>
                </div>
                <button 
                  onClick={async () => {
                    const newValue = !autoProposalEnabled;
                    setAutoProposalEnabled(newValue);
                    try {
                      const { error } = await supabase
                        .from('settings')
                        .upsert({ key: 'AUTO_PROPOSAL_ENABLED', value: newValue ? 'true' : 'false' }, { onConflict: 'key' });
                      if (error) throw error;
                      alert(`IA Automática ${newValue ? 'ativada' : 'desativada'}!`);
                    } catch (err) {
                      console.error(err);
                      alert('Erro ao salvar configuração.');
                    }
                  }}
                  className={`w-16 h-8 rounded-full transition-colors flex items-center px-1 ${autoProposalEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${autoProposalEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
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
        ) : activeTab === 'tags' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Tags & Marketing (Google Ads / Analytics)</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Analytics ID (ex: G-XXXXXXXXXX)</label>
                  <input 
                    type="text"
                    value={googleAnalyticsId}
                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="G-..."
                  />
                  <p className="text-xs text-slate-500 mt-2">Usado para rastrear visitas e comportamento no site.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Ads ID (ex: AW-XXXXXXXXXX)</label>
                  <input 
                    type="text"
                    value={googleAdsId}
                    onChange={(e) => setGoogleAdsId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="AW-..."
                  />
                  <p className="text-xs text-slate-500 mt-2">ID da sua conta do Google Ads para remarketing e conversões.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Ads Conversion Label (ex: abcdefg123456)</label>
                  <input 
                    type="text"
                    value={googleAdsConversionLabel}
                    onChange={(e) => setGoogleAdsConversionLabel(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="Label de conversão..."
                  />
                  <p className="text-xs text-slate-500 mt-2">Disparado SOMENTE quando o cliente finaliza o formulário de venda.</p>
                </div>
                <button 
                  onClick={async () => {
                    await supabase.from('settings').upsert({ key: 'GOOGLE_ANALYTICS_ID', value: googleAnalyticsId }, { onConflict: 'key' });
                    await supabase.from('settings').upsert({ key: 'GOOGLE_ADS_ID', value: googleAdsId }, { onConflict: 'key' });
                    await supabase.from('settings').upsert({ key: 'GOOGLE_ADS_CONVERSION_LABEL', value: googleAdsConversionLabel }, { onConflict: 'key' });
                    alert('Tags salvas com sucesso!');
                  }}
                  className="px-8 py-4 bg-accent text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Tags
                </button>
              </div>
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
                          setNewApiModel('gemini-1.5-flash');
                          setNewApiProvider('gemini');
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

              <h2 className="text-2xl font-bold mt-12 mb-6">Permissões de Visualização do Comprador</h2>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <p className="text-sm text-slate-500 mb-4">Defina quais informações os compradores autorizados podem visualizar nos veículos.</p>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Mostrar Preço (FIPE)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={buyerPermissions.show_price}
                      onChange={(e) => setBuyerPermissions({...buyerPermissions, show_price: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Mostrar Fotos</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={buyerPermissions.show_photos}
                      onChange={(e) => setBuyerPermissions({...buyerPermissions, show_photos: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Mostrar Placa/Código</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={buyerPermissions.show_plate}
                      onChange={(e) => setBuyerPermissions({...buyerPermissions, show_plate: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Mostrar Detalhes Técnicos</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={buyerPermissions.show_details}
                      onChange={(e) => setBuyerPermissions({...buyerPermissions, show_details: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
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
                <button 
                  onClick={async () => {
                    setSavingSettings(true);
                    const { error: promptError } = await supabase
                      .from('settings')
                      .upsert({ key: 'AI_SYSTEM_PROMPT', value: aiSystemPrompt }, { onConflict: 'key' });
                    
                    const { error: memoryError } = await supabase
                      .from('settings')
                      .upsert({ key: 'AI_MEMORY', value: aiMemory }, { onConflict: 'key' });
                    
                    if (!promptError && !memoryError) {
                      alert('Regras e Memória da IA salvas com sucesso!');
                    } else {
                      alert('Erro ao salvar configurações.');
                    }
                    setSavingSettings(false);
                  }}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Regras e Memória
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Multiplicadores de Reparo */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm md:col-span-2">
                <h3 className="text-xl font-bold mb-4">Multiplicadores de Reparo (por Valor FIPE)</h3>
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => {
                      const newMultipliers = [
                        ...repairMultipliers,
                        { id: Date.now().toString(), min: 0, max: 0, multiplier: 1 }
                      ];
                      setRepairMultipliers(newMultipliers);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Regra
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('settings')
                          .upsert({ key: 'REPAIR_MULTIPLIERS', value: JSON.stringify(repairMultipliers) }, { onConflict: 'key' });
                        if (error) throw error;
                        alert('Multiplicadores salvos com sucesso!');
                      } catch (err) {
                        console.error(err);
                        alert('Erro ao salvar multiplicadores.');
                      }
                    }}
                    className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Regras
                  </button>
                </div>
                <div className="space-y-2">
                  {repairMultipliers.map((rule, idx) => (
                    <div key={rule.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Mínimo (R$)</label>
                          <input 
                            type="number"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                            value={rule.min}
                            onChange={e => {
                              const newMultipliers = [...repairMultipliers];
                              newMultipliers[idx].min = parseFloat(e.target.value) || 0;
                              setRepairMultipliers(newMultipliers);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Máximo (R$)</label>
                          <input 
                            type="number"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                            value={rule.max}
                            onChange={e => {
                              const newMultipliers = [...repairMultipliers];
                              newMultipliers[idx].max = parseFloat(e.target.value) || 0;
                              setRepairMultipliers(newMultipliers);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Multiplicador (x)</label>
                          <input 
                            type="number"
                            step="0.1"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-accent"
                            value={rule.multiplier}
                            onChange={e => {
                              const newMultipliers = [...repairMultipliers];
                              newMultipliers[idx].multiplier = parseFloat(e.target.value) || 1;
                              setRepairMultipliers(newMultipliers);
                            }}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Excluir esta regra?')) {
                            setRepairMultipliers(repairMultipliers.filter(r => r.id !== rule.id));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-4"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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
                            value={bank.discount_percentage}
                            onChange={e => setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, discount_percentage: parseFloat(e.target.value) } : b))}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('banks').update({ name: bank.name, discount_percentage: bank.discount_percentage }).eq('id', bank.id);
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
                            <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-lg">-{bank.discount_percentage}%</span>
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
                            value={item.cost}
                            onChange={e => setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, cost: parseFloat(e.target.value) } : r))}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('repair_costs').update({ part_name: item.part_name, cost: item.cost, conditions: item.conditions || [] }).eq('id', item.id);
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
                          <div className="space-y-2 mt-2 border-t border-slate-200 pt-2">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Condições de Multiplicação (por valor FIPE)</h4>
                            {(item.conditions || []).map((cond: any, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                                <input type="text" placeholder="Nome (ex: Popular)" className="w-full md:w-1/4 p-2 bg-white border border-slate-200 rounded-lg text-xs" value={cond.name || ''} onChange={e => {
                                  const newConditions = [...(item.conditions || [])];
                                  newConditions[idx].name = e.target.value;
                                  setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                                }} />
                                <input type="number" placeholder="Min R$" className="w-full md:w-1/5 p-2 bg-white border border-slate-200 rounded-lg text-xs" value={cond.min_value} onChange={e => {
                                  const newConditions = [...(item.conditions || [])];
                                  newConditions[idx].min_value = parseFloat(e.target.value);
                                  setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                                }} />
                                <input type="number" placeholder="Max R$" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" value={cond.max_value} onChange={e => {
                                  const newConditions = [...(item.conditions || [])];
                                  newConditions[idx].max_value = parseFloat(e.target.value);
                                  setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                                }} />
                                <input type="number" placeholder="Mult (ex: 2)" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" value={cond.multiplier} onChange={e => {
                                  const newConditions = [...(item.conditions || [])];
                                  newConditions[idx].multiplier = parseFloat(e.target.value);
                                  setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                                }} />
                                <button onClick={() => {
                                  const newConditions = (item.conditions || []).filter((_: any, i: number) => i !== idx);
                                  setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                                }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                            <button onClick={() => {
                              const newConditions = [...(item.conditions || []), { min_value: 0, max_value: 0, multiplier: 1 }];
                              setRepairCosts(prev => prev.map(r => r.id === item.id ? { ...r, conditions: newConditions } : r));
                            }} className="text-[10px] text-accent font-bold hover:underline">+ Adicionar Condição</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">{item.part_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded-lg">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.cost || 0)}
                            </span>
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
        ) : null
        {/* Modal de WhatsApp */}
        {showWhatsAppModal && leadToWhatsApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Enviar para Compradores</h3>
                <button onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <LogOut className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
                {interestedBuyers.map(buyer => (
                  <label key={buyer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedBuyers.includes(buyer.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedBuyers([...selectedBuyers, buyer.id]);
                          else setSelectedBuyers(selectedBuyers.filter(id => id !== buyer.id));
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{buyer.name}</p>
                        <p className="text-xs text-slate-500">{buyer.phone}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button 
                onClick={() => {
                  const buyers = interestedBuyers.filter(b => selectedBuyers.includes(b.id));
                  handleSendToWhatsApp(leadToWhatsApp, buyers);
                  setShowWhatsAppModal(false);
                  setSelectedBuyers([]);
                }}
                disabled={selectedBuyers.length === 0}
                className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                Enviar WhatsApp ({selectedBuyers.length})
              </button>
            </div>
          </div>
        )}
        {/* Modal de Autorização */}
        {showAuthModal && buyerToAuth && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Autorizar Acesso: {buyerToAuth.name}</h3>
                <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <LogOut className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
                {leads.map(lead => {
                  const isAuthorized = buyerAuthorizations.some(a => a.buyer_id === buyerToAuth.id && a.lead_id === lead.id);
                  return (
                    <label key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isAuthorized}
                          onChange={async (e) => {
                            if (e.target.checked) {
                              const { data, error } = await supabase.from('buyer_authorizations').insert({
                                buyer_id: buyerToAuth.id,
                                lead_id: lead.id
                              }).select().single();
                              if (!error) setBuyerAuthorizations(prev => [...prev, data]);
                            } else {
                              const { error } = await supabase.from('buyer_authorizations').delete().eq('buyer_id', buyerToAuth.id).eq('lead_id', lead.id);
                              if (!error) setBuyerAuthorizations(prev => prev.filter(a => !(a.buyer_id === buyerToAuth.id && a.lead_id === lead.id)));
                            }
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        <div>
                          <p className="font-bold text-slate-900">#{lead.vehicle_code} - {lead.marca} {lead.modelo}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {showAvariasModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Problemas e Avarias</h3>
              <div className="space-y-4 mb-6">
                {avarias.map((avaria, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      placeholder="Descrição (ex: Motor fundido)"
                      value={avaria.description}
                      onChange={(e) => {
                        const newAvarias = [...avarias];
                        newAvarias[index].description = e.target.value;
                        setAvarias(newAvarias);
                      }}
                    />
                    <input 
                      type="number"
                      className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      placeholder="Valor (R$)"
                      value={avaria.value}
                      onChange={(e) => {
                        const newAvarias = [...avarias];
                        newAvarias[index].value = parseFloat(e.target.value) || 0;
                        setAvarias(newAvarias);
                      }}
                    />
                    <button onClick={() => setAvarias(avarias.filter((_, i) => i !== index))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setAvarias([...avarias, { id: Date.now().toString(), description: '', value: 0 }])}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-accent hover:text-accent transition-all"
                >
                  + Adicionar Avaria
                </button>
              </div>
              <button 
                onClick={() => {
                  const updatedLead = { ...selectedLead, avarias_manuais: avarias };
                  setSelectedLead(updatedLead);
                  setProposalCalculator(calculateProposal(updatedLead));
                  setShowAvariasModal(false);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Salvar e Deduzir
              </button>
            </div>
          </div>
        )}
      </main>
      {showBuyerPermissionsModal && selectedBuyer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
            <h3 className="text-xl font-bold">Permissões para {selectedBuyer.email}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="font-bold text-sm">Ver Fotos</span>
                <input 
                  type="checkbox" 
                  checked={buyerPermissionsForm.show_photos}
                  onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, show_photos: e.target.checked})}
                  className="w-5 h-5 accent-slate-900"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="font-bold text-sm">Ver Preço</span>
                <input 
                  type="checkbox" 
                  checked={buyerPermissionsForm.show_price}
                  onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, show_price: e.target.checked})}
                  className="w-5 h-5 accent-slate-900"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="font-bold text-sm">Ver Placa</span>
                <input 
                  type="checkbox" 
                  checked={buyerPermissionsForm.show_plate}
                  onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, show_plate: e.target.checked})}
                  className="w-5 h-5 accent-slate-900"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="font-bold text-sm">Ver Detalhes Técnicos</span>
                <input 
                  type="checkbox" 
                  checked={buyerPermissionsForm.show_details}
                  onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, show_details: e.target.checked})}
                  className="w-5 h-5 accent-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  // Verificar se a tabela existe antes de tentar salvar
                  const { error } = await supabase
                    .from('buyer_authorizations')
                    .upsert({
                      user_id: selectedBuyer.id,
                      permissions: buyerPermissionsForm,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });

                  if (error) {
                    if (error.code === '42P01') {
                      alert('Erro: Tabela de autorizações não encontrada. Execute o script SQL fornecido.');
                    } else {
                      alert('Erro: ' + error.message);
                    }
                  } else {
                    alert('Permissões salvas!');
                    setShowBuyerPermissionsModal(false);
                  }
                }}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-accent transition-all"
              >
                Salvar
              </button>
              <button 
                onClick={() => setShowBuyerPermissionsModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
