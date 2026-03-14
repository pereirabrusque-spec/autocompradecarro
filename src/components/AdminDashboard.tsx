import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { Car, Phone, Calendar, DollarSign, AlertCircle, AlertTriangle, CheckCircle, Clock, Image as ImageIcon, Save, Loader2, LogOut, Plus, Trash2, Upload, RefreshCw, Pencil, Users, Share2, MessageCircle, ChevronRight, ChevronLeft, Search, Filter, ShieldCheck, Wrench, Wallet, User, UserPlus, Mail, Bell, BellOff, Send, UserCheck, LayoutDashboard, Download, TrendingUp, BarChart3, PieChart, Info, X, Settings, Maximize2, Key, Bot, Database } from 'lucide-react';
import ChatThemeSettings from './ChatThemeSettings';
import { useAssets } from '../lib/assetsContext';
import { supabase } from '../lib/supabase';
import { defaultCards } from '../lib/seedData';
import { ProposalModal } from './ProposalModal';
import { LeadCard } from './LeadCard';
import LeadDetailsCard from './LeadDetailsCard';
import AdminMessages from './AdminMessages';
import CooperativesModal from './CooperativesModal';
import { logToStorage, getStorageLogs, clearStorageLogs } from '../lib/logger';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'hero' | 'assets' | 'footer' | 'settings' | 'ai' | 'apis' | 'crm' | 'messages' | 'buyers' | 'tags' | 'users' | 'cooperatives' | 'logs'>('dashboard');
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
  const [showCooperativesModal, setShowCooperativesModal] = useState(false);
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
  const [isDeletingLead, setIsDeletingLead] = useState<string | null>(null);
  const [newApiProvider, setNewApiProvider] = useState<any>('gemini');
  const [newApiModel, setNewApiModel] = useState('gemini-1.5-flash');
  const [testedModels, setTestedModels] = useState<Record<string, string[]>>({});
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiMemory, setAiMemory] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [cooperativeDiscount, setCooperativeDiscount] = useState<number>(5);
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
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(20);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const selectedLeadRef = useRef<any>(null);
  useEffect(() => {
    selectedLeadRef.current = selectedLead;
  }, [selectedLead]);
  const { refreshAssets } = useAssets();

  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const [activeLeadTab, setActiveLeadTab] = useState<'todos' | 'novo' | 'em_contato' | 'proposta_enviada' | 'fechado' | 'perdido'>('todos');
  const [leadsViewMode, setLeadsViewMode] = useState<'grid' | 'list'>('list');
  const [showBuyerPermissionsModal, setShowBuyerPermissionsModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [buyerPermissionsForm, setBuyerPermissionsForm] = useState({
    show_photos: true,
    show_price: true,
    show_plate: false,
    show_details: true,
    send_whatsapp: true,
    send_chat: true,
    send_fipe: true,
    send_banco: false
  });
  const [filterBrand, setFilterBrand] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showWhatsAppBuyerModal, setShowWhatsAppBuyerModal] = useState(false);
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
    bankNotRegistered?: boolean;
  } | null>(null);
  const [proposalOverrides, setProposalOverrides] = useState<{ rules: Record<string, number>, repairs: Record<string, number> }>({ rules: {}, repairs: {} });

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [avarias, setAvarias] = useState<{id: string, description: string, value: number}[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const addLog = (message: string, type: 'info' | 'error' | 'debug' = 'info', data?: any) => {
    logToStorage(message, type, data);
    setLogs(getStorageLogs());
  };

  useEffect(() => {
    setLogs(getStorageLogs());
    const interval = setInterval(() => {
      setLogs(getStorageLogs());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const [filterUser, setFilterUser] = useState('');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  const refreshUsers = async () => {
    if (activeTab !== 'users' && activeTab !== 'dashboard') return;
    setIsRefreshingUsers(true);
    try {
      const { data } = await supabase.from('profiles').select('*').order('last_login', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (activeTab === 'users' || activeTab === 'dashboard') {
      refreshUsers();
      interval = setInterval(refreshUsers, 30000); // Refresh every 30s
    }
    return () => clearInterval(interval);
  }, [activeTab]);
  const [showAvariasModal, setShowAvariasModal] = useState(false);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [userManagementTab, setUserManagementTab] = useState<'equipe' | 'compradores' | 'crm'>('equipe');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'buyer' | 'buyer_premium' | 'buyer_master',
    phone: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [confirmDeleteLeadId, setConfirmDeleteLeadId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [buyerPermissions, setBuyerPermissions] = useState({
    show_price: true,
    show_photos: true,
    show_plate: false,
    show_details: true,
    show_history: false
  });

  const [buyerSendSettings, setBuyerSendSettings] = useState({
    fipe: true,
    banco: false,
    crlv: false,
    historico: true,
    midias: true,
    detalhes_veiculo: true,
    opcionais: true,
    avarias: true,
    proposta: true,
    observacoes: false
  });

  const fetchData = async () => {
    setIsLoading(true);
    addLog('Iniciando busca de dados...', 'info');
    try {
      console.log('Fetching leads from Supabase...');
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) {
        addLog('Erro ao buscar leads', 'error', leadsError);
        console.error('Error fetching leads:', leadsError);
        alert(`Erro ao buscar leads: ${leadsError.message}`);
        throw leadsError;
      }

      addLog(`Leads buscados: ${leadsData?.length || 0}`, 'debug');
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
        .select('*, leads_veiculos(id, marca, modelo, cliente_nome, vehicle_code, fotos, detalhes_proposta, email, telefone)')
        .order('created_at', { ascending: false });

      // Group messages by lead_id to create conversation list
      const groupedConversations: any[] = [];
      const leadIds = new Set();
      
      if (messagesData) {
        messagesData.forEach((msg: any) => {
          if (!leadIds.has(msg.lead_id)) {
            leadIds.add(msg.lead_id);
            const leadMessages = messagesData.filter((m: any) => m.lead_id === msg.lead_id);
            const unreadCount = leadMessages.filter((m: any) => !m.lida && m.remetente === 'cliente').length;
            groupedConversations.push({
              lead_id: msg.lead_id,
              last_message: msg.conteudo,
              last_time: msg.created_at,
              last_message_at: msg.created_at,
              lead: msg.leads_veiculos,
              unread: unreadCount,
              is_unanswered: msg.remetente === 'cliente'
            });
          }
        });
      }

      if (assetsData) {
        // No longer load permissions from assetsData
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
        
        const coopDiscountSetting = settingsData.find((s: any) => s.key === 'COOPERATIVE_DISCOUNT_PERCENTAGE');
        if (coopDiscountSetting) {
          setCooperativeDiscount(Number(coopDiscountSetting.value));
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

        const profitMarginSetting = settingsData.find((s: any) => s.key === 'PROFIT_MARGIN_PERCENTAGE');
        if (profitMarginSetting) setProfitMarginPercentage(parseFloat(profitMarginSetting.value) || 20);

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

        const buyerPermissionsSetting = settingsData.find((s: any) => s.key === 'BUYER_VIEW_PERMISSIONS');
        if (buyerPermissionsSetting) {
          try {
            setBuyerPermissions(JSON.parse(buyerPermissionsSetting.value));
          } catch (e) {
            console.error('Error parsing buyer permissions:', e);
          }
        }

        const buyerSendSettingsSetting = settingsData.find((s: any) => s.key === 'BUYER_SEND_SETTINGS');
        if (buyerSendSettingsSetting) {
          try {
            setBuyerSendSettings(JSON.parse(buyerSendSettingsSetting.value));
          } catch (e) {
            console.error('Error parsing buyer send settings:', e);
          }
        }
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

  const selectedConversationRef = useRef(selectedConversation);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const subscription = supabase
      .channel('admin_messages_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens' 
      }, async (payload) => {
        // Se for uma mensagem do cliente, atualiza a lista de conversas e o chat aberto
        if (payload.new.remetente === 'cliente') {
          console.log("Received new message from client:", payload.new);
          
          // Automação de Status: Se o cliente responde, muda para "Em Contato"
          const { data: leadData } = await supabase
            .from('leads_veiculos')
            .select('status')
            .eq('id', payload.new.lead_id)
            .single();

          if (leadData && (leadData.status === 'novo' || leadData.status === 'proposta_enviada')) {
            await supabase
              .from('leads_veiculos')
              .update({ status: 'em_contato' })
              .eq('id', payload.new.lead_id);
            console.log("Lead status updated to 'em_contato' automatically");
            
            // Atualiza a lista de leads e o lead selecionado se for o caso
            fetchData();
            if (selectedLeadRef.current?.id === payload.new.lead_id) {
              setSelectedLead(prev => prev ? { ...prev, status: 'em_contato' } : null);
            }
          }

          console.log("Current selectedConversationRef:", selectedConversationRef.current);
          // Atualiza mensagens do chat se estiver aberto para este lead
          if (selectedConversationRef.current?.lead_id === payload.new.lead_id) {
            console.log("Updating chat messages state");
            setChatMessages(prev => [...prev, payload.new]);
            // Marcar como lida automaticamente se o chat estiver aberto
            try {
              await supabase
                .from('mensagens')
                .update({ lida: true })
                .eq('id', payload.new.id);
              console.log("Message marked as read");
            } catch (err) {
              console.error("Error marking message as read:", err);
            }
          } else {
            console.log("Message received for different lead. Current:", selectedConversationRef.current?.lead_id, "Message:", payload.new.lead_id);
          }
          
          // Atualiza a lista de conversas de forma otimizada
          const { data: messagesData, error: messagesError } = await supabase
            .from('mensagens')
            .select('*')
            .order('created_at', { ascending: false });

          if (messagesError) {
            console.error("Error fetching messages in realtime callback:", messagesError);
          }

          if (messagesData) {
            const groupedConversations: any[] = [];
            const leadIds = new Set();
            messagesData.forEach((msg: any) => {
              if (!leadIds.has(msg.lead_id)) {
                leadIds.add(msg.lead_id);
                const leadMessages = messagesData.filter((m: any) => m.lead_id === msg.lead_id);
                const unreadCount = leadMessages.filter((m: any) => !m.lida && m.remetente === 'cliente').length;
                groupedConversations.push({
                  lead_id: msg.lead_id,
                  last_message: msg.conteudo,
                  last_time: msg.created_at,
                  last_message_at: msg.created_at,
                  // lead: msg.leads_veiculos, // Removido temporariamente para evitar o 400
                  unread: unreadCount,
                  is_unanswered: msg.remetente === 'cliente'
                });
              }
            });
            setConversations(groupedConversations);
          }
        } else {
          console.log("Message received, but remetente is not 'cliente':", payload.new.remetente);
        }
      })
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchChatMessages = async (leadId: string) => {
    console.log('Fetching messages for lead:', leadId);
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    console.log('Messages fetched:', data);
    setChatMessages(data || []);
    // Marcar como lidas
    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('lead_id', leadId)
      .eq('remetente', 'cliente')
      .eq('lida', false);
    
    // Atualizar contador local
    setConversations(prev => prev.map(c => c.lead_id === leadId ? { ...c, unread: 0 } : c));
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
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUser(data.user);
        addLog('Usuário autenticado: ' + data.user.email, 'info');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          addLog('Perfil carregado: ' + profile.role, 'info');
          
          // Set initial tab based on role
          if (profile.role === 'buyer_premium' || profile.role === 'buyer_master') {
            setActiveTab('leads');
          }
        }
      }
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
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchChatMessages(selectedConversation.lead_id);
      
      // Atualiza a lista de conversas de forma otimizada
      const { data: messagesData } = await supabase
        .from('mensagens')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesData) {
        const groupedConversations: any[] = [];
        const leadIds = new Set();
        messagesData.forEach((msg: any) => {
          if (!leadIds.has(msg.lead_id)) {
            leadIds.add(msg.lead_id);
            const leadMessages = messagesData.filter((m: any) => m.lead_id === msg.lead_id);
            const unreadCount = leadMessages.filter((m: any) => !m.lida && m.remetente === 'cliente').length;
            groupedConversations.push({
              lead_id: msg.lead_id,
              last_message: msg.conteudo,
              last_time: msg.created_at,
              last_message_at: msg.created_at,
              lead: msg.leads_veiculos,
              unread: unreadCount,
              is_unanswered: msg.remetente === 'cliente'
            });
          }
        });
        setConversations(groupedConversations);
      }
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
          conteudo: message,
          tipo: 'proposta',
          metadata: { proposal_data: proposalCalculator }
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

  const handleSendProposalViaChat = async () => {
    if (!selectedLead || !proposalCalculator) return;

    let message = '';
    if (proposalCalculator.finalValue < 0) {
      message = `🚀 *PROPOSTA LIMPA NOME*
Olá ${selectedLead.cliente_nome}, analisamos seu ${selectedLead.marca} ${selectedLead.modelo}.

Infelizmente, devido às custas do processo, valor operacional e o tempo que o veículo ficaria parado para negociação, este veículo não é interessante para compra direta no momento.

Entretanto, temos uma proposta de *LIMPA NOME*: A empresa fica com o veículo e, em contrapartida, realizamos a limpeza e blindagem do seu nome, resolvendo sua situação financeira. 🤝

Deseja saber mais sobre como funciona o processo de Limpa Nome?`;
    } else {
      message = `🚀 *PROPOSTA AUTOCOMPRA*
Olá ${selectedLead.cliente_nome}, analisamos seu ${selectedLead.marca} ${selectedLead.modelo} (${selectedLead.ano_modelo}).

📊 *Tabela FIPE:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.baseValue)}
💰 *Proposta Final:* *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}*

Podemos prosseguir com o agendamento da vistoria?`;
    }

    if (confirm(`Deseja enviar a proposta oficial para o cliente via chat?`)) {
      try {
        // 1. Salvar mensagem no chat
        const { error: msgError } = await supabase.from('mensagens').insert([{
          lead_id: selectedLead.id,
          remetente: 'admin',
          conteudo: message,
          tipo: 'proposta',
          metadata: { proposal_data: proposalCalculator }
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
        
        alert('Proposta enviada com sucesso via chat!');
        await fetchChatMessages(selectedLead.id);
        await fetchData();
      } catch (err: any) {
        console.error(err);
        alert('Erro ao enviar proposta: ' + err.message);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleLearnFromChat = async () => {
    if (!selectedConversation || chatMessages.length === 0) return;

    try {
      const chatHistory = chatMessages.map(m => `${m.remetente === 'admin' ? 'Humano' : 'Cliente'}: ${m.conteudo}`).join('\n');
      
      // Use Gemini to extract triggers
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise a conversa abaixo e extraia apenas os gatilhos de venda, informações técnicas do veículo e condições comerciais mencionadas. Ignore saudações e conversas genéricas.
        
        Conversa:
        ${chatHistory}`,
        config: {
          systemInstruction: "Você é um assistente especializado em extrair informações estratégicas de vendas de veículos de conversas de chat. Retorne apenas os pontos relevantes encontrados de forma concisa.",
        }
      });
      
      const extractedInfo = response.text;
      if (!extractedInfo || extractedInfo.trim().length < 10) {
        alert('Nenhuma informação relevante de venda encontrada nesta conversa.');
        return;
      }

      const newMemory = `${aiMemory}\n\n--- Aprendizado de Gatilhos (${new Date().toLocaleDateString()}) ---\n${extractedInfo}\n`;
      
      const { error } = await supabase.from('settings').upsert({ key: 'AI_MEMORY', value: newMemory }, { onConflict: 'key' });
      if (error) throw error;
      
      setAiMemory(newMemory);
      alert('A IA extraiu e aprendeu novos gatilhos desta conversa!');
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
      l.telefone,
      l.email,
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

  const handleDeleteUser = async (id: string) => {
    setConfirmDeleteUserId(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== id));
      setToast({ message: 'Usuário excluído com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setToast({ message: 'Erro ao excluir usuário: ' + error.message, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.full_name) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    setIsCreatingUser(true);
    addLog('Tentando criar usuário...', 'info', newUserForm);
    try {
      const { error } = await supabase.from('profiles').insert([{
        full_name: newUserForm.full_name,
        email: newUserForm.email,
        role: newUserForm.role,
        phone: newUserForm.phone,
        last_login: new Date().toISOString()
      }]);
      
      if (error) {
        addLog('Erro ao criar usuário no Supabase', 'error', error);
        throw error;
      }
      
      addLog('Usuário criado com sucesso', 'info');
      alert('Usuário pré-cadastrado com sucesso! Ele deve se registrar com este email para acessar.');
      setShowAddUserModal(false);
      setNewUserForm({ full_name: '', email: '', password: '', role: 'user', phone: '' });
      refreshUsers();
    } catch (error: any) {
      alert('Erro ao criar usuário: ' + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateAsset = async (id: string, url: string, legenda: string, tipo: string, button_text?: string, button_link?: string, title?: string, subtitle?: string, badge_text?: string, ativo?: boolean) => {
    setSavingAsset(id);
    try {
      console.log('Updating asset:', { id, url, legenda, tipo, button_text, button_link, title, subtitle, badge_text, ativo });
      const { data, error } = await supabase
        .from('banners')
        .update({ url, legenda, tipo, button_text, button_link, title, subtitle, badge_text, ativo: ativo ?? true })
        .eq('id', id);

      console.log('Supabase update response:', { data, error });
      if (error) throw error;

      await refreshAssets();
      // Update local state
      setDbAssets(prev => prev.map(a => a.id === id ? { ...a, url, legenda, tipo, button_text, button_link, title, subtitle, badge_text, ativo: ativo ?? true } : a));
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
    setConfirmDeleteAssetId(null);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'assets'); // Pasta dentro do bucket banners

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no upload');
      }

      const data = await response.json();
      const publicUrl = data.publicUrl;

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
        { key: 'PROFIT_MARGIN_PERCENTAGE', value: profitMarginPercentage.toString() },
        { key: 'BUYER_VIEW_PERMISSIONS', value: JSON.stringify(buyerPermissions) },
        { key: 'BUYER_SEND_SETTINGS', value: JSON.stringify(buyerSendSettings) },
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

  const handleDeleteLead = async (id: string) => {
    console.log('ID do lead a ser excluído:', id, 'Tipo:', typeof id);
    setIsDeletingLead(id);
    try {
      console.log(`Attempting to delete lead ${id}...`);
      
      // 1. Delete associated records first
      await supabase.from('sent_leads').delete().eq('lead_id', id);
      await supabase.from('mensagens').delete().eq('lead_id', id);
      
      // 2. Delete the lead
      const { data: leadToDelete, error: fetchError } = await supabase
        .from('leads_veiculos')
        .select('*')
        .eq('id', id)
        .single();
      
      console.log('Lead to delete:', leadToDelete);
      if (fetchError) console.error('Error fetching lead to delete:', fetchError);

      const { data, error } = await supabase
        .from('leads_veiculos')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log(`Lead ${id} deleted successfully from DB. Result:`, data);
      await fetchData();
      if (selectedLead?.id === id) setSelectedLead(null);
      setToast({ message: 'Lead excluído com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      setToast({ message: 'Erro ao excluir lead: ' + (error.message || 'Erro desconhecido'), type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsDeletingLead(null);
      setConfirmDeleteLeadId(null);
    }
  };

  const calculateProposal = (lead: any, overrides?: { rules: Record<string, number>, repairs: Record<string, number> }, entryValue: number = 0) => {
    const currentOverrides = overrides || proposalOverrides;
    const fipe = lead.valor_fipe || 0;
    const deductions: { name: string; value: number; type: 'fixed' | 'percent'; isMax?: boolean }[] = [];

    // 1. Coletar todos os descontos percentuais (Cooperativa + Regras)
    const percentDiscounts: { name: string; value: number }[] = [];

    // 1.1 Desconto de Cooperativa
    const bankName = lead.banco_financiamento || lead.banco_financiador || '';
    const isCooperativeBank = (name: string) => {
      if (!name) return false;
      const normalizedSearch = name.toLowerCase().trim();
      return banks.some(b => 
        b.is_cooperativa && 
        (normalizedSearch.includes(b.name.toLowerCase().trim()) || 
         b.name.toLowerCase().trim().includes(normalizedSearch))
      );
    };
    
    const isBankCooperative = isCooperativeBank(bankName);
    const hasCooperativeFlag = lead.is_cooperativa === 'true' || 
                               lead.is_cooperativa === true || 
                               lead.is_cooperativa === 'sim';

    if (hasCooperativeFlag || isBankCooperative) {
        percentDiscounts.push({ 
          name: `Desconto Cooperativa (${cooperativeDiscount}%)`, 
          value: fipe * (cooperativeDiscount / 100)
        });
    }

    // 1.2 Descontos por Histórico/Problemas
    const problemasSelecionados = Array.isArray(lead.problemas) ? lead.problemas : (typeof lead.problemas === 'string' ? lead.problemas.split(',').map((p: string) => p.trim()) : []);
    problemasSelecionados.forEach((problem: string) => {
        const rule = fipeRules.find(r => r.condition_name.toLowerCase() === problem.toLowerCase());
        let percentage = 0;
        if (rule) {
          percentage = currentOverrides.rules[rule.id] !== undefined ? currentOverrides.rules[rule.id] : rule.discount_percentage;
        } else {
          // Fallback rules
          const p = problem.toLowerCase();
          if (p.includes('sinistro')) percentage = 30;
          else if (p.includes('leilao') || p.includes('leilão')) percentage = 25;
          else if (p.includes('recuperado')) percentage = 20;
          else if (p.includes('furto')) percentage = 15;
          else if (p.includes('renajud') || p.includes('bloqueio judicial')) percentage = 50;
          else if (p.includes('financiamento')) percentage = 35;
          else if (p.includes('cooperativa')) percentage = 80;
          else if (p.includes('busca') || p.includes('apreensão')) percentage = 60;
          else if (p.includes('nome jurídico')) percentage = 10;
          else if (p.includes('cobertura')) percentage = 15;
        }
        
        if (percentage > 0) {
            percentDiscounts.push({
                name: `${problem} (${percentage}%)`,
                value: fipe * (percentage / 100)
            });
        }
    });

    // 2. Encontrar o maior desconto percentual
    const maxPercentDiscount = percentDiscounts.length > 0 
        ? Math.max(...percentDiscounts.map(d => d.value)) 
        : 0;

    percentDiscounts.forEach(d => {
        deductions.push({
            name: d.name,
            value: d.value,
            type: 'percent',
            isMax: d.value === maxPercentDiscount && maxPercentDiscount > 0
        });
    });

    // 3. Avarias (Deduções por Valor Fixo)
    let repairTotal = 0;
    
    if (lead.motor_reparo) {
      repairTotal += lead.motor_reparo;
      deductions.push({ name: 'Motor Fundido / Batendo', value: lead.motor_reparo, type: 'fixed' });
    }
    if (lead.cambio_reparo) {
      repairTotal += lead.cambio_reparo;
      deductions.push({ name: 'Câmbio com Defeito', value: lead.cambio_reparo, type: 'fixed' });
    }
    if (lead.batido_reparo) {
      repairTotal += lead.batido_reparo;
      deductions.push({ name: 'Batido / Avariado', value: lead.batido_reparo, type: 'fixed' });
    }
    
    // Usar avarias do lead ou do estado global se disponível
    const allText = `${lead.observacoes || ''} ${lead.problemas?.join(' ') || ''}`.toLowerCase();
    const avariasSelecionadas = lead.avarias || lead.detalhes_proposta?.avarias || repairCosts.filter(c => allText.includes(c.part_name.toLowerCase())).map(c => c.id);
    
    // Deduções manuais do modal de avarias
    const avariasManuais = lead.avarias_manuais || lead.detalhes_proposta?.avarias_manuais || [];
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
            if (fipe >= cond.min_value && fipe <= cond.max_value) {
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
    let bankNotRegistered = false;
    
    if (lead.valor_parcela && lead.total_parcelas && lead.parcelas_pagas !== undefined) {
      const remainingInstallments = lead.total_parcelas - lead.parcelas_pagas;
      if (remainingInstallments > 0) {
        const totalRemaining = remainingInstallments * lead.valor_parcela;
        
        // Find bank discount
        const bankName = lead.banco_financiamento || lead.banco || '';
        const bank = banks.find(b => b.name.toLowerCase() === bankName.toLowerCase());
        
        let bankDiscount = 0;

        if (!bank && bankName) {
          bankNotRegistered = true;
          // Auto-register logic (handled outside calculation to avoid side effects during render)
          // For now, use default logic: 100% for cooperativa, 35% for others
          const isCooperativa = bankName.toLowerCase().includes('coop') || bankName.toLowerCase().includes('sicredi') || bankName.toLowerCase().includes('sicoob');
          bankDiscount = isCooperativa ? 0 : 0.35; // 0% discount (100% payoff) for coop, 35% discount for others
        } else if (bank) {
          bankDiscount = (bank.discount_percentage / 100);
        }
        
        // Calculate payoff for profit (with bank discount)
        payoffValue = totalRemaining * (1 - bankDiscount);
        
        // Calculate payoff for client (valor parcelas vezes quantidade de parcelas + juros)
        const atrasadas = lead.parcelas_atrasadas || 0;
        const jurosTotal = lead.valor_parcela * atrasadas * (jurosAtraso / 100);
        clientPayoffValue = totalRemaining + jurosTotal;
      }
    }
    
    // IPVA e Multas (Dívidas de Documentação)
    let docDebts = lead.multas || 0;
    if (currentOverrides.repairs['doc_debts'] !== undefined) {
      docDebts = currentOverrides.repairs['doc_debts'];
    }
    if (docDebts > 0) {
      deductions.push({ name: 'IPVA e Multas Atrasadas', value: docDebts, type: 'fixed' });
    }

    // 4. Cálculo de Lucro (FIPE - Deduções - Quitação - Documentos - Margem)
    const fixedDeductions = deductions.filter(d => d.type === 'fixed').reduce((acc, d) => acc + d.value, 0);
    const totalDeductions = maxPercentDiscount + fixedDeductions;
    
    // Margem de lucro configurável
    let profitMargin = fipe * (profitMarginPercentage / 100); 
    
    // Fórmula final: Lucro = FIPE - (Deduções + Quitação + Documentos + Margem)
    let finalValue = fipe - totalDeductions - payoffValue - docDebts - profitMargin;

    // Logic: If proposal is higher than desired price, offer 40% less than desired price
    if (lead.preco_cliente && finalValue > lead.preco_cliente) {
      finalValue = lead.preco_cliente * 0.60;
    }

    if (finalValue < 0) finalValue = 0;

    // Recalcular a margem de lucro conforme a fórmula do usuário:
    // VALOR FIP - (PROPOSTA GERADA + VALOR REAL DE QUITAÇÃO)
    const calculatedProfitMargin = fipe - (finalValue + payoffValue);

    return {
      baseValue: fipe,
      deductions,
      finalValue,
      profitMargin: calculatedProfitMargin,
      payoffValue,
      clientPayoffValue,
      docDebts,
      repairDebts: repairTotal,
      bankNotRegistered
    };
  };

  const getProposalClass = (value: number, vehicleType: string) => {
    if (value <= 0) return "";
    const typeLower = vehicleType?.toLowerCase() || "";
    if (typeLower.includes("caminh")) {
      if (value < 10000) return "animate-blink text-red-600";
    } else if (typeLower.includes("moto")) {
      if (value < 2000) return "animate-blink text-red-600";
    } else { // Assume carro por padrão
      if (value < 5000) return "animate-blink text-red-600";
    }
    return "";
  };

  const generateOwnerMessage = (lead: any, calc: any) => {
    const hours = new Date().getHours();
    let greeting = 'Bom dia';
    if (hours >= 12 && hours < 18) greeting = 'Boa tarde';
    if (hours >= 18 || hours < 5) greeting = 'Boa noite';

    const firstName = lead.cliente_nome?.split(' ')[0] || 'Cliente';
    const vehicleName = `${lead.marca} ${lead.modelo}`;

    let msg = `*${greeting}, ${firstName}!* 🚀\n\n`;

    if (calc.finalValue < 0) {
      msg += `Analisamos os dados do seu veículo *${vehicleName}*.\n\n`;
      msg += `Infelizmente, devido às custas do processo, valor operacional e o tempo que o veículo ficaria parado para negociação, este veículo não é interessante para compra direta no momento.\n\n`;
      msg += `Entretanto, temos uma proposta de *LIMPA NOME*: A empresa fica com o veículo e, em contrapartida, realizamos a limpeza e blindagem do seu nome, resolvendo sua situação financeira. 🤝\n\n`;
      msg += `Deseja saber mais sobre como funciona o processo de Limpa Nome?`;
    } else {
      msg += `Temos uma oportunidade exclusiva para seu veículo *${vehicleName}*.\n\n`;
      msg += `📊 *Tabela FIPE:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.baseValue)}\n`;
      msg += `💰 *Proposta Final:* *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.finalValue)}*\n\n`;
      msg += `Nossa proposta é válida por tempo limitado. Vamos fechar negócio? 🤝`;
    }

    return encodeURIComponent(msg);
  };

  const handleSaveProposal = async (updateGlobal: boolean = false) => {
    if (!selectedLead || !proposalCalculator) return;

    try {
      // Save to lead
      const { error } = await supabase
        .from('leads_veiculos')
        .update({
          detalhes_proposta: { 
            ...proposalCalculator, 
            overrides: proposalOverrides,
            avarias: selectedLead.avarias || [],
            avarias_manuais: selectedLead.avarias_manuais || []
          },
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
        email: newBuyer.email.trim() === '' ? null : newBuyer.email.trim(),
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

  const generateBuyerMessage = (lead: any, settings: any, buyerName: string) => {
    let msg = `🚀 *OPORTUNIDADE AUTOCOMPRA*\n`;
    msg += `Olá ${buyerName}! Temos um novo veículo que pode te interessar:\n\n`;
    
    if (settings.detalhes_veiculo) {
      msg += `🚗 *${lead.marca} ${lead.modelo}*\n`;
      msg += `📅 Ano: ${lead.ano_fabricacao}/${lead.ano_modelo}\n`;
      msg += `⚙️ Câmbio: ${lead.cambio}\n`;
      msg += `⛽ Combustível: ${lead.combustivel}\n`;
      msg += `🛣️ KM: ${lead.quilometragem}\n`;
      msg += `🎨 Cor: ${lead.cor}\n\n`;
    }

    if (settings.fipe) {
      msg += `💰 *Valores:*\n`;
      msg += `FIPE: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)}\n`;
      if (settings.proposta) {
        msg += `Sugestão de Compra: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.suggested_value || 0)}\n`;
      }
      msg += `\n`;
    }

    if (settings.banco && lead.financiado === 'sim') {
      msg += `🏦 *Financiamento:*\n`;
      msg += `Banco: ${lead.banco_financiamento || lead.banco}\n`;
      msg += `Parcelas Restantes: ${lead.parcelas_restantes}\n`;
      msg += `Valor da Parcela: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_parcela || 0)}\n\n`;
    }

    if (settings.crlv) {
      msg += `📄 *Documentação:*\n`;
      msg += `IPVA/Multas: ${lead.ipva_multas === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Autuação: ${lead.autuacao === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Licenciamento: ${lead.licenciamento === 'sim' ? 'Atrasado' : 'Em dia'}\n\n`;
    }

    if (settings.historico) {
      msg += `📋 *Histórico:*\n`;
      msg += `Leilão: ${lead.leilao === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Sinistro: ${lead.sinistro === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `RS: ${lead.rs === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Locadora: ${lead.locadora === 'sim' ? 'Sim' : 'Não'}\n\n`;
    }

    if (settings.avarias) {
      msg += `🔧 *Avarias/Reparos:*\n`;
      msg += `Motor: ${lead.motor === 'sim' ? 'Problema' : 'OK'}\n`;
      msg += `Câmbio: ${lead.cambio_problema === 'sim' ? 'Problema' : 'OK'}\n`;
      msg += `Batido/Avariado: ${lead.batido === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Pneus: ${lead.pneus}\n`;
      msg += `Pintura: ${lead.pintura}\n`;
      msg += `Mecânica: ${lead.mecanica}\n`;
      msg += `Painel: ${lead.painel}\n\n`;
    }

    if (settings.opcionais) {
      msg += `✨ *Opcionais:*\n`;
      msg += `Ar Condicionado: ${lead.ar_condicionado === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Direção: ${lead.direcao === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Vidros: ${lead.vidros === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Travas: ${lead.travas === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Alarme: ${lead.alarme === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Som: ${lead.som === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Rodas: ${lead.rodas === 'sim' ? 'Sim' : 'Não'}\n`;
      msg += `Bancos: ${lead.bancos === 'sim' ? 'Sim' : 'Não'}\n\n`;
    }

    if (settings.midias && lead.fotos && lead.fotos.length > 0) {
      msg += `📸 *Fotos do Veículo:*\n`;
      lead.fotos.forEach((foto: string, index: number) => {
        msg += `Foto ${index + 1}: ${foto}\n`;
      });
      msg += `\n`;
    }

    if (settings.observacoes && lead.observacoes) {
      msg += `📝 *Observações:*\n${lead.observacoes}\n\n`;
    }

    msg += `Até que valor você acha que pode chegar para fecharmos negócio?\n`;
    msg += `_Comissão a combinar após o fechamento._`;
    
    return msg;
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

      const message = generateBuyerMessage(lead, buyerSendSettings, buyer.name);
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

  const handleSendToChat = async (lead: any, buyers: any[]) => {
    if (buyers.length === 0) {
      alert('Selecione pelo menos um comprador.');
      return;
    }

    if (!currentUser) {
      alert('Erro: Usuário não autenticado.');
      return;
    }

    let successCount = 0;

    for (const buyer of buyers) {
      // Check for duplicate
      const isDuplicate = sentLeads.some(s => s.lead_id === lead.id && s.buyer_id === buyer.id);
      if (isDuplicate) {
        if (!confirm(`O lead ${lead.vehicle_code} já foi enviado para ${buyer.name}. Deseja enviar novamente?`)) {
          continue;
        }
      }

      // Find user profile for this buyer (assuming buyer has user_id or email matching profile)
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', buyer.email).single();
      
      if (profile) {
        const message = generateBuyerMessage(lead, buyerSendSettings, buyer.name);
        
        const { error } = await supabase.from('mensagens').insert({
          lead_id: lead.id,
          conteudo: message,
          remetente: 'admin',
          lida: false
        });

        if (!error) {
          successCount++;
          // Track sent lead
          await supabase.from('sent_leads').insert({ lead_id: lead.id, buyer_id: buyer.id });
          setSentLeads(prev => [...prev, { lead_id: lead.id, buyer_id: buyer.id }]);
        }
      } else {
        alert(`Não foi possível enviar para ${buyer.name}: Perfil de usuário não encontrado.`);
      }
    }

    if (successCount > 0) {
      alert(`Enviado com sucesso para ${successCount} comprador(es) via Chat Interno!`);
      fetchData();
    }
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
      <header className="bg-slate-950 border-b border-white/5 sticky top-0 z-[100] shadow-2xl backdrop-blur-xl bg-opacity-90">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.4)]">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="hidden xl:block">
                <h1 className="font-display text-lg font-black text-white leading-none tracking-tight">AUTO COMPRA</h1>
                <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mt-1">Admin Pro</p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
            
            {/* Navigation Menu */}
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
              {[
                { id: 'dashboard', label: 'Início', icon: LayoutDashboard, roles: ['admin'] },
                { id: 'leads', label: 'Leads', icon: Car, roles: ['admin', 'buyer_premium', 'buyer_master'] },
                { id: 'messages', label: 'Mensagens', icon: MessageCircle, badge: conversations.reduce((acc, curr) => acc + (curr.unread || 0), 0), roles: ['admin'] },
                { id: 'users', label: 'Equipe & CRM', icon: Users, roles: ['admin'] },
                { id: 'settings', label: 'Config', icon: Settings, roles: ['admin'] },
                { id: 'apis', label: 'APIs', icon: Key, roles: ['admin'] },
                { id: 'ai', label: 'IA', icon: Bot, roles: ['admin'] },
                { id: 'cooperatives', label: 'Cooperativas', icon: Wallet, roles: ['admin'] },
                { id: 'tags', label: 'Marketing', icon: BarChart3, roles: ['admin'] },
                { id: 'hero', label: 'Site', icon: ImageIcon, roles: ['admin'] },
                { id: 'assets', label: 'Fotos', icon: Maximize2, roles: ['admin'] },
                { id: 'footer', label: 'Rodapé', icon: Info, roles: ['admin'] },
                { id: 'logs', label: 'Logs', icon: Database, roles: ['admin'] },
              ].filter(tab => !tab.roles || tab.roles.includes(userProfile?.role)).map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-4 py-2.5 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap flex items-center gap-2.5 relative group ${
                    activeTab === tab.id 
                      ? 'bg-accent text-white shadow-[0_0_20px_rgba(242,125,38,0.3)]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-accent'}`} />
                  <span className="uppercase tracking-wider">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-slate-950 font-black">
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 border border-white/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <button 
              onClick={() => window.location.href = '/'}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="Ver Site"
            >
              <Share2 className="w-5 h-5" />
            </button>
             <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Logs do Sistema</h2>
                <p className="text-slate-500">Monitoramento de variáveis e eventos em tempo real</p>
              </div>
              <button 
                onClick={() => {
                  clearStorageLogs();
                  setLogs([]);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Logs
              </button>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-6 font-mono text-xs overflow-hidden border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500 font-bold uppercase tracking-widest">Live Console</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <span className="text-slate-500">Mostrando os últimos 100 eventos</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-slate-600 italic">Nenhum log registrado ainda...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="group flex gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                      <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`font-bold shrink-0 w-12 ${
                        log.type === 'error' ? 'text-red-500' : 
                        log.type === 'debug' ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-300">{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 p-2 bg-black/50 rounded text-[10px] text-slate-500 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">Estado da Sessão</h4>
                <div className="space-y-1 text-[10px] font-mono">
                  <p className="text-slate-500">User ID: <span className="text-slate-900">{currentUser?.id || 'N/A'}</span></p>
                  <p className="text-slate-500">Email: <span className="text-slate-900">{currentUser?.email || 'N/A'}</span></p>
                  <p className="text-slate-500">Role: <span className="text-slate-900 font-bold text-accent">{userProfile?.role || 'N/A'}</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">Variáveis de Ambiente</h4>
                <div className="space-y-1 text-[10px] font-mono">
                  <p className="text-slate-500">Supabase URL: <span className="text-slate-900">Configurado</span></p>
                  <p className="text-slate-500">Anon Key: <span className="text-slate-900">Configurado</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">Conectividade</h4>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-900">Supabase Realtime: Ativo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cooperatives' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold mb-2">Cooperativas</h2>
                <p className="text-sm text-slate-500 mb-4">Gerenciar lista e descontos</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    className="text-3xl font-black text-slate-900 w-24 p-2 border rounded"
                    value={cooperativeDiscount}
                    onChange={e => setCooperativeDiscount(parseFloat(e.target.value))}
                  />
                  <span className="text-3xl font-black text-slate-900">%</span>
                  <button 
                    onClick={async () => {
                      await supabase.from('settings').upsert({ key: 'COOPERATIVE_DISCOUNT_PERCENTAGE', value: cooperativeDiscount.toString() }, { onConflict: 'key' });
                      fetchData();
                    }}
                    className="p-2 bg-slate-900 text-white rounded-xl font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
              <div 
                onClick={() => setShowCooperativesModal(true)}
                className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm cursor-pointer hover:border-slate-300 transition-all flex items-center justify-center"
              >
                <h2 className="text-xl font-bold">Ver Prompt de Cooperativas</h2>
              </div>
            </div>
          </div>
        )}

        {showCooperativesModal && (
          <CooperativesModal 
            isOpen={showCooperativesModal}
            onClose={() => setShowCooperativesModal(false)} 
            banks={banks} 
            onRefresh={fetchData}
            cooperativeDiscount={cooperativeDiscount}
          />
        )}

        {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div 
                    onClick={() => setActiveTab('leads')}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Leads</p>
                        <h3 className="text-2xl font-black text-slate-900">{leads.length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-blue-500">{leads.filter(l => l.status === 'novo').length} Novos</span>
                        <span className="text-amber-500">{leads.filter(l => l.status === 'em_contato').length} Em Contato</span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Tabela leads_veiculos</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveTab('leads');
                      setActiveLeadTab('fechado');
                    }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vendas (Total)</p>
                        <h3 className="text-2xl font-black text-slate-900">{leads.filter(l => l.status === 'fechado').length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-emerald-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            leads.filter(l => l.status === 'fechado').reduce((acc, l) => acc + (l.preco_cliente || 0), 0)
                          )}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Status 'fechado'</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('messages')}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conversas</p>
                        <h3 className="text-2xl font-black text-slate-900">{conversations.length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-red-500">{conversations.reduce((acc, c) => acc + (c.unread || 0), 0)} Não lidas</span>
                        <span className="text-slate-400">{conversations.filter(c => c.is_unanswered).length} Aguardando</span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Tabela mensagens</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveTab('users');
                      setUserManagementTab('compradores');
                    }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compradores</p>
                        <h3 className="text-2xl font-black text-slate-900">{users.filter(u => u.role === 'buyer').length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-emerald-500">
                          {users.filter(u => u.role === 'buyer' && u.last_login && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length} Online
                        </span>
                        <span className="text-slate-400">
                          {users.filter(u => u.role === 'buyer' && (!u.last_login || (new Date().getTime() - new Date(u.last_login).getTime()) >= 300000)).length} Off
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Perfis 'buyer'</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveTab('users');
                      setUserManagementTab('crm');
                    }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Usuários (Novo)</p>
                        <h3 className="text-2xl font-black text-slate-900">{users.filter(u => u.role === 'user').length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-emerald-500">
                          {users.filter(u => u.role === 'user' && u.last_login && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length} Online
                        </span>
                        <span className="text-slate-400">
                          {users.filter(u => u.role === 'user' && (!u.last_login || (new Date().getTime() - new Date(u.last_login).getTime()) >= 300000)).length} Off
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Perfis 'user'</p>
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
                        { label: 'Novos', status: 'novo' as const, count: leads.filter(l => !l.status || l.status === 'novo').length, color: 'bg-blue-500' },
                        { label: 'Em Negociação', status: 'proposta_enviada' as const, count: leads.filter(l => l.status === 'proposta_enviada').length, color: 'bg-amber-500' },
                        { label: 'Fechados', status: 'fechado' as const, count: leads.filter(l => l.status === 'fechado').length, color: 'bg-emerald-500' },
                        { label: 'Perdidos', status: 'perdido' as const, count: leads.filter(l => l.status === 'perdido').length, color: 'bg-red-500' },
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setActiveTab('leads');
                            setActiveLeadTab(item.status);
                          }}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color} group-hover:scale-125 transition-transform`} />
                            <span className="text-sm font-medium text-slate-600">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Source Info Footer */}
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Database className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Origem dos Dados</p>
                    <p className="text-[10px] text-slate-400">
                      As informações deste painel são sincronizadas em tempo real com as tabelas <code className="bg-slate-200 px-1 rounded text-slate-600">leads_veiculos</code>, 
                      <code className="bg-slate-200 px-1 rounded text-slate-600">mensagens</code> e <code className="bg-slate-200 px-1 rounded text-slate-600">interested_buyers</code> do Supabase.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                <h2 className="text-2xl font-bold">Configurações de IA</h2>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">System Prompt</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-48"
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Memória da IA</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-48"
                    value={aiMemory}
                    onChange={(e) => setAiMemory(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Salvar Configurações
                </button>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Configurações Gerais</h2>
                  <button 
                    onClick={() => setActiveTab('apis')}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Gerenciar Chaves de API
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Google Analytics ID</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      value={googleAnalyticsId}
                      onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Google Ads ID</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      value={googleAdsId}
                      onChange={(e) => setGoogleAdsId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Google Ads Conversion Label</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      value={googleAdsConversionLabel}
                      onChange={(e) => setGoogleAdsConversionLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Margem de Lucro (%)</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                      value={profitMarginPercentage}
                      onChange={(e) => setProfitMarginPercentage(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email de Contato</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Salvar Configurações
                </button>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Status das APIs</h3>
                    <button onClick={() => setActiveTab('apis')} className="text-xs font-bold text-accent hover:underline">Configurar Chaves</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['gemini', 'openai', 'grok'].map(provider => {
                      const key = apiKeys.find(k => k.provider === provider);
                      return (
                        <div key={provider} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${key ? (key.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-300'}`} />
                            <span className="text-xs font-bold uppercase text-slate-600">{provider}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${key ? (key.status === 'ok' ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-400'}`}>
                            {key ? (key.status === 'ok' ? 'Configurado' : 'Erro/Inativo') : 'Não Configurado'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <ChatThemeSettings />
                </div>
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-xl font-bold">Permissões de Visualização do Comprador</h3>
                  <p className="text-sm text-slate-500">Configure o que os compradores podem ver nos anúncios.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-accent"
                        checked={buyerPermissions.show_photos}
                        onChange={(e) => setBuyerPermissions(prev => ({ ...prev, show_photos: e.target.checked }))}
                      />
                      <span className="text-sm font-bold text-slate-700">Mostrar Fotos</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-accent"
                        checked={buyerPermissions.show_price}
                        onChange={(e) => setBuyerPermissions(prev => ({ ...prev, show_price: e.target.checked }))}
                      />
                      <span className="text-sm font-bold text-slate-700">Mostrar Preço</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-accent"
                        checked={buyerPermissions.show_plate}
                        onChange={(e) => setBuyerPermissions(prev => ({ ...prev, show_plate: e.target.checked }))}
                      />
                      <span className="text-sm font-bold text-slate-700">Mostrar Placa</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-accent"
                        checked={buyerPermissions.show_details}
                        onChange={(e) => setBuyerPermissions(prev => ({ ...prev, show_details: e.target.checked }))}
                      />
                      <span className="text-sm font-bold text-slate-700">Mostrar Detalhes</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-xl font-bold">Regras de Desconto (Porcentagem)</h3>
                  <p className="text-sm text-slate-500">Configure as porcentagens de desconto para o histórico e procedência do veículo.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fipeRules.map(rule => (
                      <div key={rule.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                        <input 
                          type="text"
                          className="font-bold text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-accent/20 rounded px-1"
                          value={rule.condition_name}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setFipeRules(prev => prev.map(r => r.id === rule.id ? { ...r, condition_name: val } : r));
                            await supabase.from('fipe_rules').update({ condition_name: val }).eq('id', rule.id);
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-20 p-2 border border-slate-200 rounded-lg text-sm text-center font-bold"
                              value={rule.discount_percentage}
                              onChange={async (e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setFipeRules(prev => prev.map(r => r.id === rule.id ? { ...r, discount_percentage: val } : r));
                                await supabase.from('fipe_rules').update({ discount_percentage: val }).eq('id', rule.id);
                              }}
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>
                          <button 
                            onClick={async () => {
                              if (confirm('Excluir esta regra?')) {
                                await supabase.from('fipe_rules').delete().eq('id', rule.id);
                                setFipeRules(prev => prev.filter(r => r.id !== rule.id));
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="Nova Regra (ex: Leilão)" 
                      className="p-3 border border-slate-200 rounded-xl text-sm flex-1"
                      id="newRuleName"
                    />
                    <input 
                      type="number" 
                      placeholder="%" 
                      className="p-3 border border-slate-200 rounded-xl text-sm w-24 text-center"
                      id="newRulePercentage"
                    />
                    <button 
                      onClick={async () => {
                        const nameInput = document.getElementById('newRuleName') as HTMLInputElement;
                        const percInput = document.getElementById('newRulePercentage') as HTMLInputElement;
                        if (nameInput.value && percInput.value) {
                          const { data, error } = await supabase.from('fipe_rules').insert({
                            condition_name: nameInput.value,
                            discount_percentage: parseFloat(percInput.value)
                          }).select().single();
                          if (!error && data) {
                            setFipeRules(prev => [...prev, data]);
                            nameInput.value = '';
                            percInput.value = '';
                          }
                        }
                      }}
                      className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-xl font-bold">Custos de Reparo (Valor Fixo)</h3>
                  <p className="text-sm text-slate-500">Configure os valores fixos para reparos de peças e avarias.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repairCosts.map(cost => (
                      <div key={cost.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                        <input 
                          type="text"
                          className="font-bold text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-accent/20 rounded px-1"
                          value={cost.part_name}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setRepairCosts(prev => prev.map(c => c.id === cost.id ? { ...c, part_name: val } : c));
                            await supabase.from('repair_costs').update({ part_name: val }).eq('id', cost.id);
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold text-xs">R$</span>
                            <input 
                              type="number" 
                              className="w-24 p-2 border border-slate-200 rounded-lg text-sm text-center font-bold"
                              value={cost.cost}
                              onChange={async (e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setRepairCosts(prev => prev.map(c => c.id === cost.id ? { ...c, cost: val } : c));
                                await supabase.from('repair_costs').update({ cost: val }).eq('id', cost.id);
                              }}
                            />
                          </div>
                          <button 
                            onClick={async () => {
                              if (confirm('Excluir este custo de reparo?')) {
                                await supabase.from('repair_costs').delete().eq('id', cost.id);
                                setRepairCosts(prev => prev.filter(c => c.id !== cost.id));
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="Nova Peça (ex: Pintura Parachoque)" 
                      className="p-3 border border-slate-200 rounded-xl text-sm flex-1"
                      id="newRepairName"
                    />
                    <input 
                      type="number" 
                      placeholder="R$" 
                      className="p-3 border border-slate-200 rounded-xl text-sm w-32 text-center"
                      id="newRepairCost"
                    />
                    <button 
                      onClick={async () => {
                        const nameInput = document.getElementById('newRepairName') as HTMLInputElement;
                        const costInput = document.getElementById('newRepairCost') as HTMLInputElement;
                        if (nameInput.value && costInput.value) {
                          const { data, error } = await supabase.from('repair_costs').insert({
                            part_name: nameInput.value,
                            cost: parseFloat(costInput.value)
                          }).select().single();
                          if (!error && data) {
                            setRepairCosts(prev => [...prev, data]);
                            nameInput.value = '';
                            costInput.value = '';
                          }
                        }
                      }}
                      className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Cabeçalho e Sub-Navegação */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 font-display">Gestão de Usuários & CRM</h2>
                    <p className="text-slate-500 font-medium">Gerencie sua equipe, compradores e leads em um só lugar.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddUserModal(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-accent transition-all shadow-lg shadow-slate-900/20"
                  >
                    <UserPlus className="w-5 h-5" />
                    Novo Usuário
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
                  {[
                    { id: 'equipe', label: 'Equipe', icon: ShieldCheck },
                    { id: 'compradores', label: 'Compradores', icon: UserCheck },
                    { id: 'crm', label: 'CRM / Leads', icon: Users }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserManagementTab(tab.id as any)}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2.5 ${
                        userManagementTab === tab.id 
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Filtros e Busca */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome, email ou telefone..." 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={refreshUsers}
                    className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Tabela de Usuários */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black bg-slate-50/50">
                          <th className="px-8 py-5">Usuário</th>
                          <th className="px-8 py-5">Cadastro</th>
                          <th className="px-8 py-5">WhatsApp</th>
                          <th className="px-8 py-5">Cargo / Tipo</th>
                          <th className="px-8 py-5">Status</th>
                          {userManagementTab === 'compradores' && <th className="px-8 py-5">Permissões</th>}
                          <th className="px-8 py-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.filter(u => {
                          const matchesSearch = u.email?.toLowerCase().includes(filterUser.toLowerCase()) || 
                                              (u.full_name && u.full_name.toLowerCase().includes(filterUser.toLowerCase()));
                          
                          if (userManagementTab === 'equipe') return matchesSearch && (u.role === 'admin' || u.role === 'user');
                          if (userManagementTab === 'compradores') return matchesSearch && (u.role === 'buyer' || u.role === 'buyer_premium' || u.role === 'buyer_master');
                          return matchesSearch; // CRM shows all
                        }).map((user) => {
                          const isOnline = (new Date().getTime() - new Date(user.last_login).getTime()) < 300000;
                          const initials = (user.full_name || user.email || 'U').split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase();
                          
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border-2 ${
                                    user.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                    user.role?.includes('buyer') ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                    'bg-slate-50 border-slate-100 text-slate-600'
                                  }`}>
                                    {user.avatar_url ? (
                                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : initials}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{user.full_name || 'Sem Nome'}</p>
                                    <p className="text-xs text-slate-400">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-xs font-bold text-slate-600">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                                </p>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-xs font-bold text-slate-600">{user.phone || '-'}</p>
                              </td>
                              <td className="px-8 py-5">
                                {userProfile?.role === 'admin' ? (
                                  <select
                                    value={user.role}
                                    onChange={async (e) => {
                                      const newRole = e.target.value;
                                      addLog(`Alterando cargo de ${user.email} para ${newRole}`, 'info');
                                      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
                                      if (!error) {
                                        refreshUsers();
                                        addLog('Cargo alterado com sucesso', 'info');
                                      } else {
                                        addLog('Erro ao alterar cargo', 'error', error);
                                      }
                                    }}
                                    className="bg-slate-100 border-none rounded-lg text-[10px] font-black uppercase tracking-widest p-1 cursor-pointer hover:bg-slate-200 transition-all"
                                  >
                                    <option value="user">Usuário (Vendedor)</option>
                                    <option value="buyer">Comprador</option>
                                    <option value="buyer_premium">Comprador Premium</option>
                                    <option value="buyer_master">Comprador Master</option>
                                    <option value="admin">Administrador</option>
                                  </select>
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                    user.role === 'buyer' ? 'bg-amber-100 text-amber-700' :
                                    user.role === 'buyer_premium' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'buyer_master' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {user.role === 'admin' ? 'Administrador' :
                                     user.role === 'buyer' ? 'Comprador' :
                                     user.role === 'buyer_premium' ? 'Comprador Premium' :
                                     user.role === 'buyer_master' ? 'Comprador Master' : 'Usuário'}
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-2.5 h-2.5 rounded-full ${
                                    isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-slate-300'
                                  }`} />
                                  <div>
                                    <p className={`text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {isOnline ? 'Online agora' : 'Offline'}
                                    </p>
                                    {!isOnline && user.last_login && (
                                      <p className="text-[10px] text-slate-400">
                                        Visto em: {new Date(user.last_login).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {userManagementTab === 'compradores' && (
                                <td className="px-8 py-5">
                                  <div className="flex flex-col gap-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={user.view_auth} 
                                        onChange={async (e) => {
                                          const { error } = await supabase.from('profiles').update({ view_auth: e.target.checked }).eq('id', user.id);
                                          if (!error) refreshUsers();
                                        }}
                                        className="w-3.5 h-3.5 accent-accent" 
                                      />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">Ver Veículos</span>
                                    </label>
                                    <button 
                                      onClick={() => {
                                        setSelectedBuyer(user);
                                        setShowBuyerPermissionsModal(true);
                                      }}
                                      className="text-[10px] font-bold text-accent hover:underline text-left"
                                    >
                                      Configurar Envio (Zap/Chat)
                                    </button>
                                  </div>
                                </td>
                              )}
                              <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {user.role !== 'buyer' && user.role !== 'admin' && (
                                    <button 
                                      onClick={async () => {
                                        const { error } = await supabase.from('profiles').update({ role: 'buyer' }).eq('id', user.id);
                                        if (!error) refreshUsers();
                                      }}
                                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Tornar Comprador
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setConfirmDeleteUserId(user.id)}
                                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'leads' && (
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
                      { id: 'todos', label: 'Todos' },
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
                  <div className="flex flex-col gap-2 w-full md:w-auto p-1">
                    <div className="flex gap-2 overflow-x-auto">
                      <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">De:</span>
                        <input type="date" className="p-1 bg-transparent text-xs font-bold outline-none" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Até:</span>
                        <input type="date" className="p-1 bg-transparent text-xs font-bold outline-none" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      <select className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                        <option value="">Todas as Marcas</option>
                        {[...new Set(leads.map(l => l.marca))].map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                      <input type="number" placeholder="Ano" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
                      <input type="number" placeholder="Min R$" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} />
                      <input type="number" placeholder="Max R$" className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} />
                    </div>
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
                    
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                      <button 
                        onClick={() => setLeadsViewMode('list')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${leadsViewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Visualização em Lista"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Lista</span>
                      </button>
                      <button 
                        onClick={() => setLeadsViewMode('grid')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${leadsViewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Visualização em Cards"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Cards</span>
                      </button>
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
                  <LeadDetailsCard 
                    lead={(() => {
                      console.log("Passando lead para LeadDetailsCard:", selectedLead);
                      return selectedLead;
                    })()} 
                    onClose={() => {
                      setSelectedLead(null);
                      setShowWhatsAppBuyerModal(false);
                    }} 
                    forceShowWhatsAppBuyerModal={showWhatsAppBuyerModal}
                    banks={banks}
                    cooperativeDiscount={cooperativeDiscount}
                    userRole={userProfile?.role}
                    onSave={async (updatedLead) => {
                      try {
                        console.log("Salvando Lead no AdminDashboard:", updatedLead);
                        
                        // Sanitização: Remove campos que não pertencem à tabela ou são apenas para exibição
                        const { 
                          id, 
                          created_at, 
                          data_negociacao, // Campo virtual do LeadDetailsCard
                          leads_veiculos, // Caso venha de um join
                          mensagens,      // Caso venha de um join
                          profiles,       // Caso venha de um join
                          ...cleanData 
                        } = updatedLead;

                        // Segurança extra: Garante que campos de array/json não sejam strings vazias
                        const complexFields = [
                          'fotos', 'videos', 'problemas', 'selected_items', 'avarias', 
                          'avarias_manuais', 'fotos_url', 'detalhes_proposta', 'metadata'
                        ];
                        complexFields.forEach(field => {
                          if (cleanData[field] === '') {
                            cleanData[field] = null;
                          }
                        });

                        const { error } = await supabase.from('leads_veiculos').update(cleanData).eq('id', id);
                        if (error) {
                          setToast({ message: 'Erro ao salvar: ' + error.message, type: 'error' });
                          setTimeout(() => setToast(null), 5000);
                        } else {
                          setToast({ message: 'Dados salvos!', type: 'success' });
                          setTimeout(() => setToast(null), 3000);
                          await fetchData();
                        }
                      } catch (err) {
                        console.error("Erro inesperado no onSave:", err);
                        setToast({ message: 'Erro inesperado ao salvar.', type: 'error' });
                      }
                    }}
                    onDelete={handleDeleteLead}
                    onRefresh={fetchData}
                    fipeRules={fipeRules}
                    jurosAtraso={jurosAtraso}
                  />
                )}
                {false && selectedLead && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedLead(null)}>
                    <div 
                      className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center p-8 pb-4 border-b border-slate-100 bg-white z-10 sticky top-0">
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

                      <div className="overflow-y-auto p-8 pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Coluna Esquerda: Fotos e Dados */}
                        <div className="lg:col-span-5 space-y-6">
                          {/* Carrossel de Fotos */}
                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer" onClick={() => {
                            if (selectedLead.fotos && selectedLead.fotos.length > 0) {
                              setExpandedPhoto(selectedLead.fotos[currentPhotoIndex]);
                            }
                          }}>
                            {selectedLead.fotos && selectedLead.fotos.length > 0 ? (
                              <>
                                <img 
                                  src={selectedLead.fotos[currentPhotoIndex]} 
                                  alt="Veículo" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                                {selectedLead.fotos.length > 1 && (
                                  <>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => (prev === 0 ? selectedLead.fotos.length - 1 : prev - 1)); }}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => (prev === selectedLead.fotos.length - 1 ? 0 : prev + 1)); }}
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
                              <div className="flex gap-2">
                                <button 
                                  onClick={async () => {
                                    const { error } = await supabase.from('leads_veiculos').update(selectedLead).eq('id', selectedLead.id);
                                    if (error) {
                                      setToast({ message: 'Erro ao salvar: ' + error.message, type: 'error' });
                                      setTimeout(() => setToast(null), 5000);
                                    } else {
                                      setToast({ message: 'Dados salvos!', type: 'success' });
                                      setTimeout(() => setToast(null), 3000);
                                    }
                                  }}
                                  className="text-[10px] bg-accent text-white px-2 py-1 rounded hover:bg-orange-600 font-bold"
                                >
                                  SALVAR
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteLeadId(selectedLead.id)}
                                  className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  EXCLUIR
                                </button>
                              </div>
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
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Email</p>
                                <input 
                                  type="text"
                                  value={selectedLead.email || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, email: e.target.value})}
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
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Placa</p>
                                <input 
                                  type="text"
                                  value={selectedLead.placa || ''}
                                  onChange={(e) => setSelectedLead({...selectedLead, placa: e.target.value.toUpperCase()})}
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
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Atrasadas</p>
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
                                </div>
                              )}
                              
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">FIPE</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-slate-500">R$</span>
                                  <input 
                                    type="number"
                                    value={selectedLead.valor_fipe || 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updatedLead = { ...selectedLead, valor_fipe: val };
                                      setSelectedLead(updatedLead);
                                      setProposalCalculator(calculateProposal(updatedLead));
                                    }}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Desejado pelo Cliente</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-slate-500">R$</span>
                                  <input 
                                    type="number"
                                    value={selectedLead.preco_cliente || 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updatedLead = { ...selectedLead, preco_cliente: val };
                                      setSelectedLead(updatedLead);
                                    }}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                                  />
                                </div>
                              </div>
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
                              {selectedLead.avarias && selectedLead.avarias.length > 0 && (
                                <div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px]">Avarias Informadas</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedLead.avarias.map((a: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase">
                                        {a}
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
                                      <span key={i} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedLead.observacoes && (
                                <div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px]">Observações</p>
                                  <p className="text-xs font-medium text-slate-700 mt-1 bg-white p-2 rounded border border-slate-200">
                                    {selectedLead.observacoes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-5 rounded-2xl space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2">
                              <Users className="w-5 h-5 text-accent" />
                              Dados do Cadastro
                            </h3>
                            {userProfile?.role === 'admin' ? (
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
                            ) : (
                              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                  Dados do cliente estão ocultos. Apenas administradores podem visualizar informações de contato.
                                </p>
                              </div>
                            )}
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
                                      const avariasSelecionadas = selectedLead.avarias || selectedLead.detalhes_proposta?.avarias || repairCosts.filter(c => allText.includes(c.part_name.toLowerCase())).map(c => c.id);
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
                                      {proposalCalculator.bankNotRegistered && (
                                        <div className="flex flex-col gap-1 mt-1">
                                          <p className="text-[9px] font-bold text-red-500 uppercase">Banco não cadastrado: {selectedLead.banco_financiamento || selectedLead.banco}</p>
                                          <button 
                                            onClick={async () => {
                                              const bankName = selectedLead.banco_financiamento || selectedLead.banco;
                                              const isCooperativa = bankName.toLowerCase().includes('coop') || bankName.toLowerCase().includes('sicredi') || bankName.toLowerCase().includes('sicoob');
                                              const discount = isCooperativa ? 0 : 35;
                                              const { error } = await supabase.from('banks').insert({ name: bankName, discount_percentage: discount });
                                              if (!error) {
                                                alert(`Banco ${bankName} cadastrado com ${discount}% de desconto!`);
                                                fetchData();
                                              }
                                            }}
                                            className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 w-fit"
                                          >
                                            CADASTRAR AGORA
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Débitos (Doc/IPVA)</p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">R$</span>
                                        <input 
                                          type="number"
                                          value={proposalOverrides.repairs['doc_debts'] !== undefined ? proposalOverrides.repairs['doc_debts'] : (selectedLead.multas || 0)}
                                          onChange={(e) => {
                                            const newVal = parseFloat(e.target.value);
                                            const newOverrides = {
                                              ...proposalOverrides,
                                              repairs: { ...proposalOverrides.repairs, 'doc_debts': newVal }
                                            };
                                            setProposalOverrides(newOverrides);
                                            setProposalCalculator(calculateProposal(selectedLead, newOverrides));
                                          }}
                                          className="w-full bg-transparent font-black text-slate-700 outline-none border-b border-transparent focus:border-accent"
                                        />
                                      </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Parcelas Atrasadas</p>
                                      <div className="mt-1 space-y-1">
                                        <p className={`font-black ${selectedLead.parcelas_atrasadas > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                          {selectedLead.parcelas_atrasadas || 0} parcelas
                                        </p>
                                        {selectedLead.parcelas_atrasadas > 0 && (
                                          <div className="text-[9px] text-slate-500 space-y-0.5">
                                            <p>Valor/Parc: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valor_parcela || 0)}</p>
                                            <p>Juros: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((selectedLead.valor_parcela * selectedLead.parcelas_atrasadas * (jurosAtraso / 100)) || 0)}</p>
                                            <p className="font-bold text-red-600">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((selectedLead.valor_parcela * selectedLead.parcelas_atrasadas * (1 + jurosAtraso / 100)) || 0)}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Resumo Final - Organizado */}
                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold">Tabela FIPE</span>
                                    <span className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.baseValue)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold">Valor Desejado pelo Cliente</span>
                                    <span className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.preco_cliente || 0)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold">Margem de Lucro (Estimada)</span>
                                    <span className="font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.profitMargin)}</span>
                                  </div>
                                  <div className="p-5 bg-slate-900 rounded-2xl text-white">
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Valor Sugerido</p>
                                    <p className={`text-3xl font-black ${getProposalClass(proposalCalculator.finalValue, selectedLead?.tipo_veiculo) || 'text-accent'}`}>
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
                                <div 
                                  className="pt-2 border-t border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg p-1"
                                  onClick={() => setShowProposalDetails(true)}
                                >
                                  <p className="font-bold text-accent flex items-center justify-between">
                                    <span className={getProposalClass(proposalCalculator.finalValue, selectedLead?.tipo_veiculo)}>Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}</span>
                                    <Info className="w-4 h-4" />
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => {
                                    const buyers = interestedBuyers.filter(b => selectedBuyers.includes(b.id));
                                    handleSendToWhatsApp(selectedLead, buyers);
                                  }}
                                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  WhatsApp Comprador ({selectedBuyers.length})
                                </button>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const phone = selectedLead.telefone?.replace(/\D/g, '');
                                      const formattedPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                                      const encodedMessage = generateOwnerMessage(selectedLead, proposalCalculator);
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
                                    }}
                                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                  >
                                    <Phone className="w-5 h-5" />
                                    WhatsApp Proposta
                                  </button>
                                  <button 
                                    onClick={handleSendProposalViaChat}
                                    className="px-6 py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md"
                                    title="Enviar Proposta via Chat do Site"
                                  >
                                    <Send className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-accent" />
                              Selecionar Compradores
                            </h3>
                            <div className="max-h-80 overflow-y-auto pr-2">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {interestedBuyers.map(buyer => (
                                  <label key={buyer.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100">
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
                                      <p className="text-[11px] font-bold leading-tight">{buyer.name}</p>
                                      <p className="text-[9px] text-slate-400">{buyer.category}</p>
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
                  </div>
                  </div>
                )}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                  {leadsViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                      {leads
                        .filter(l => activeLeadTab === 'todos' || l.status === activeLeadTab)
                        .filter(l => !searchCode || (l.vehicle_code && l.vehicle_code.includes(searchCode)))
                        .filter(l => !filterBrand || l.marca === filterBrand)
                        .filter(l => !filterYear || l.ano_modelo === parseInt(filterYear))
                        .filter(l => !filterMinPrice || (l.preco_cliente || 0) >= parseFloat(filterMinPrice))
                        .filter(l => !filterMaxPrice || (l.preco_cliente || 0) <= parseFloat(filterMaxPrice))
                        .filter(l => {
                          if (!filterStartDate && !filterEndDate) return true;
                          const leadDate = new Date(l.created_at);
                          leadDate.setHours(0, 0, 0, 0);
                          
                          if (filterStartDate) {
                            const start = new Date(filterStartDate);
                            start.setHours(0, 0, 0, 0);
                            start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
                            if (leadDate < start) return false;
                          }
                          if (filterEndDate) {
                            const end = new Date(filterEndDate);
                            end.setHours(0, 0, 0, 0);
                            end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
                            if (leadDate > end) return false;
                          }
                          return true;
                        })
                        .map((lead) => (
                          <LeadCard 
                            key={lead.id} 
                            lead={lead} 
                            suggestedValue={calculateProposal(lead).finalValue}
                            hideClientInfo={userProfile?.role === 'buyer_premium'}
                            onClick={() => {
                              setSelectedLead(lead);
                              setProposalCalculator(calculateProposal(lead));
                              setSelectedBuyers([]);
                              setCurrentPhotoIndex(0);
                            }} 
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[calc(100vh-320px)] overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                          <tr className="border-b border-slate-200">
                            <th className="px-2 pr-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Data</th>
                            <th className="px-2 pl-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Status</th>
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Veículo</th>
                            <th className="px-2 pr-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Código</th>
                            <th className="px-2 px-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Ano/Modelo</th>
                            <th className="px-2 pl-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">FIPE</th>
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Desejado</th>
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Sugerido</th>
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Contato</th>
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Ações</th>
                          </tr>
                        </thead>
                          <tbody>
                            {leads
                              .filter(l => activeLeadTab === 'todos' || l.status === activeLeadTab)
                              .filter(l => !searchCode || (l.vehicle_code && l.vehicle_code.includes(searchCode)))
                              .filter(l => !filterBrand || l.marca === filterBrand)
                              .filter(l => !filterYear || l.ano_modelo === parseInt(filterYear))
                              .filter(l => !filterMinPrice || (l.preco_cliente || 0) >= parseFloat(filterMinPrice))
                              .filter(l => !filterMaxPrice || (l.preco_cliente || 0) <= parseFloat(filterMaxPrice))
                              .filter(l => {
                                if (!filterStartDate && !filterEndDate) return true;
                                const leadDate = new Date(l.created_at);
                                leadDate.setHours(0, 0, 0, 0);
                                
                                if (filterStartDate) {
                                  const start = new Date(filterStartDate);
                                  start.setHours(0, 0, 0, 0);
                                  // Adjust for timezone offset to ensure correct local date comparison
                                  start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
                                  if (leadDate < start) return false;
                                }
                                if (filterEndDate) {
                                  const end = new Date(filterEndDate);
                                  end.setHours(0, 0, 0, 0);
                                  end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
                                  if (leadDate > end) return false;
                                }
                                return true;
                              })
                              .map((lead) => (
                              <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => {
                                setSelectedLead(lead);
                                setProposalCalculator(calculateProposal(lead));
                                setSelectedBuyers([]);
                                setCurrentPhotoIndex(0);
                              }}>
                                <td className="px-2 pr-1 py-1.5 text-[11px] font-bold text-slate-900">
                                  {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-2 pl-1 py-1.5">
                                  <select 
                                    value={lead.status || 'novo'} 
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
                                      await supabase.from('leads_veiculos').update({ status: newStatus }).eq('id', lead.id);
                                    }}
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border-none outline-none cursor-pointer tracking-tighter ${
                                      lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-700' :
                                      lead.status === 'perdido' ? 'bg-red-100 text-red-700' :
                                      lead.status === 'proposta_enviada' ? 'bg-blue-100 text-blue-700' :
                                      lead.status === 'em_contato' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <option value="novo">NOVO</option>
                                    <option value="em_contato">EM CONTATO</option>
                                    <option value="proposta_enviada">PROPOSTA ENVIADA</option>
                                    <option value="fechado">FECHADO</option>
                                    <option value="perdido">PERDIDO</option>
                                  </select>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                      {lead.fotos && lead.fotos[0] ? (
                                        <img src={lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <Car className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{lead.marca} {lead.modelo}</p>
                                      <p className="text-[9px] text-slate-500 truncate">{lead.cliente_nome}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 pr-1 py-1.5">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-900 rounded text-[10px] font-mono font-bold">
                                    {lead.vehicle_code || '----'}
                                  </span>
                                </td>
                                <td className="px-2 px-1 py-1.5 text-[11px] font-bold text-slate-900">{lead.ano_modelo}</td>
                                <td className="px-2 pl-1 py-1.5 text-[11px] font-bold text-slate-900">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)}
                                </td>
                                <td className="px-2 py-1.5 text-[11px] font-black text-emerald-600">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.preco_cliente || 0)}
                                </td>
                                <td className={`px-2 py-1.5 text-[11px] font-black ${getProposalClass(lead.suggested_value || calculateProposal(lead).finalValue, lead.tipo_veiculo) || 'text-accent'}`}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.suggested_value || calculateProposal(lead).finalValue)}
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1">
                                    {lead.telefone && (
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          const phone = lead.telefone?.replace(/\D/g, '');
                                          const formattedPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                                          const calc = calculateProposal(lead);
                                          const encodedMessage = generateOwnerMessage(lead, calc);
                                          window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
                                        }} 
                                        className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-600" 
                                        title="WhatsApp Proposta"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {lead.telefone && (
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setSelectedLead(lead);
                                          setShowWhatsAppBuyerModal(true);
                                        }} 
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600" 
                                        title="WhatsApp Comprador"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLead(lead);
                                        setProposalCalculator(calculateProposal(lead));
                                      }}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteLeadId(lead.id);
                                      }}
                                      disabled={isDeletingLead === lead.id}
                                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                      title="Excluir"
                                    >
                                      {isDeletingLead === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
            )}

          {activeTab === 'buyers' && (
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

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Users className="w-6 h-6 text-accent" />
                      Usuários Logados (Potenciais Compradores)
                    </h3>
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
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-black tracking-widest">Nome / Email</th>
                          <th className="px-6 py-4 font-black tracking-widest">Telefone</th>
                          <th className="px-6 py-4 font-black tracking-widest">Status</th>
                          <th className="px-6 py-4 font-black tracking-widest">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.email.includes(filterUser)).map((user) => (
                          <tr key={user.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{user.full_name || 'Sem nome'}</p>
                              <p className="text-[10px] text-slate-400">{user.email}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                              {user.phone || 'Não informado'}
                            </td>
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
                                  setNewBuyer({
                                    ...newBuyer,
                                    name: user.full_name || '',
                                    email: user.email || '',
                                    phone: user.phone || ''
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-accent transition-all flex items-center gap-2"
                              >
                                <UserCheck className="w-3 h-3" />
                                Definir como Comprador
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                                    setBuyerPermissionsForm(buyer.permissions || { show_photos: true, show_price: true, show_plate: false, show_details: true });
                                    setSelectedBuyer(buyer);
                                    setShowBuyerPermissionsModal(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-accent transition-colors"
                                  title="Permissões de Visualização"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setBuyerToAuth(buyer);
                                    setShowAuthModal(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-accent transition-colors"
                                  title="Autorizar Leads Específicos"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm('Excluir este comprador?')) {
                                      const { error } = await supabase.from('interested_buyers').delete().eq('id', buyer.id);
                                      if (!error) {
                                        setInterestedBuyers(prev => prev.filter(b => b.id !== buyer.id));
                                        alert('Comprador excluído!');
                                      }
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

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Send className="w-6 h-6 text-accent" />
                    Configurações Padrão de Envio (WhatsApp/Chat)
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Selecione quais informações do formulário serão enviadas por padrão para os compradores ao compartilhar um lead.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'fipe', label: 'Tabela FIPE' },
                      { key: 'banco', label: 'Dados Bancários' },
                      { key: 'crlv', label: 'CRLV / Débitos' },
                      { key: 'historico', label: 'Histórico de Procedência' },
                      { key: 'midias', label: 'Mídias (Fotos/Vídeos)' },
                      { key: 'detalhes_veiculo', label: 'Detalhes do Veículo' },
                      { key: 'opcionais', label: 'Opcionais' },
                      { key: 'avarias', label: 'Avarias / Reparos' },
                      { key: 'proposta', label: 'Proposta Final' },
                      { key: 'observacoes', label: 'Observações Internas' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={(buyerSendSettings as any)[item.key]}
                          onChange={(e) => setBuyerSendSettings({...buyerSendSettings, [item.key]: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Configurações de Envio
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
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
            )}

            {activeTab === 'messages' && (
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
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 truncate">{conv.lead?.cliente_nome || 'Cliente'}</h4>
                                {conv.is_unanswered && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Aguardando resposta" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">{conv.lead?.email || 'Sem email'}</p>
                              <span className="text-[10px] font-mono font-bold text-slate-400">#{conv.lead?.vehicle_code || '----'}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {conv.unread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
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
                          {selectedConversation.lead && (
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 mr-2">
                              <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modo</p>
                                <p className="text-[10px] font-bold text-slate-700 leading-none">{selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'Humano' : 'IA'}</p>
                              </div>
                              <button 
                                onClick={async () => {
                                  const newValue = !selectedConversation.lead.detalhes_proposta?.ai_disabled;
                                  const newDetalhes = { ...(selectedConversation.lead.detalhes_proposta || {}), ai_disabled: newValue };
                                  try {
                                    const { error } = await supabase
                                      .from('leads_veiculos')
                                      .update({ detalhes_proposta: newDetalhes })
                                      .eq('id', selectedConversation.lead.id);
                                    
                                    if (error) throw error;
                                    
                                    // Update local state
                                    setConversations(prev => prev.map(c => 
                                      c.lead_id === selectedConversation.lead_id 
                                        ? { ...c, lead: { ...c.lead, detalhes_proposta: newDetalhes } } 
                                        : c
                                    ));
                                    setSelectedConversation({
                                      ...selectedConversation,
                                      lead: { ...selectedConversation.lead, detalhes_proposta: newDetalhes }
                                    });
                                  } catch (err) {
                                    console.error(err);
                                    alert('Erro ao alterar modo de resposta.');
                                  }
                                }}
                                title={selectedConversation.lead.detalhes_proposta?.ai_disabled ? "Ativar IA para esta conversa" : "Desativar IA (Modo Humano)"}
                                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'bg-orange-500' : 'bg-indigo-500'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${selectedConversation.lead.detalhes_proposta?.ai_disabled ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          )}
                          <button 
                            onClick={() => {
                              if (selectedConversation.lead?.email) {
                                window.location.href = `mailto:${selectedConversation.lead.email}`;
                              } else {
                                alert('E-mail do cliente não encontrado para este lead.');
                              }
                            }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Enviar Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          {selectedConversation.lead?.telefone && (
                            <a 
                              href={`https://wa.me/${selectedConversation.lead.telefone.replace(/\D/g, '')}`}
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
                      <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4"
                      >
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id}
                            className={`flex ${msg.remetente === 'admin' || msg.remetente === 'bot' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                              msg.remetente === 'admin' 
                                ? 'bg-slate-900 text-white rounded-tr-none' 
                                : msg.remetente === 'bot'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-blue-50 text-blue-900 rounded-tl-none border border-blue-100'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase opacity-70">
                                  {msg.remetente === 'admin' ? 'Humano' : msg.remetente === 'bot' ? 'IA' : 'Cliente'}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                              <span className={`text-[9px] mt-1 block opacity-70`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input de Mensagem */}
                      <div className="p-4 bg-white border-t border-slate-100">
                        <div className="mb-2">
                          <input 
                            type="text"
                            placeholder="Saudação"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-accent/20 mb-1"
                          />
                          <textarea 
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none h-20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSendMessage}
                            disabled={isSendingMessage || !adminMessage.trim()}
                            className="flex-1 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            Enviar Mensagem
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
                              <button onClick={() => {
                                setAvarias(selectedLead.avarias_manuais || selectedLead.detalhes_proposta?.avarias_manuais || []);
                                setShowAvariasModal(true);
                              }} className="text-xs text-accent font-bold hover:underline">
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
                                  const newFinalValue = val - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - proposalCalculator.payoffValue - proposalCalculator.docDebts - (val * (profitMarginPercentage / 100));
                                  const newProfitMargin = val - newFinalValue - proposalCalculator.payoffValue;
                                  setProposalCalculator({...proposalCalculator, baseValue: val, finalValue: newFinalValue, profitMargin: newProfitMargin});
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
                                  setProposalCalculator({...proposalCalculator, profitMargin: val, finalValue: proposalCalculator.baseValue - val - proposalCalculator.payoffValue});
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
                                  const newFinalValue = proposalCalculator.baseValue - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - proposalCalculator.payoffValue - val - (proposalCalculator.baseValue * (profitMarginPercentage / 100));
                                  const newProfitMargin = proposalCalculator.baseValue - newFinalValue - proposalCalculator.payoffValue;
                                  setProposalCalculator({...proposalCalculator, docDebts: val, finalValue: newFinalValue, profitMargin: newProfitMargin});
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
                                  const newFinalValue = proposalCalculator.baseValue - proposalCalculator.deductions.reduce((acc, d) => acc + d.value, 0) - val - proposalCalculator.docDebts - (proposalCalculator.baseValue * (profitMarginPercentage / 100));
                                  const newProfitMargin = proposalCalculator.baseValue - newFinalValue - val;
                                  setProposalCalculator({...proposalCalculator, payoffValue: val, finalValue: newFinalValue, profitMargin: newProfitMargin});
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                              />
                              {selectedLead.valor_parcela && selectedLead.total_parcelas && (
                                <div className="text-[9px] text-slate-400 mt-1">
                                  <p>Custo (Lucro): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.payoffValue)}</p>
                                  <p>Para Cliente: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.clientPayoffValue || 0)}</p>
                                  {proposalCalculator.bankNotRegistered && (
                                    <p className="text-red-500 font-bold uppercase mt-1">Banco não cadastrado</p>
                                  )}
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
                                        const newFinalValue = proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - (proposalCalculator.baseValue * (profitMarginPercentage / 100));
                                        const newProfitMargin = proposalCalculator.baseValue - newFinalValue - proposalCalculator.payoffValue;
                                        setProposalCalculator({
                                          ...proposalCalculator, 
                                          deductions: newDeductions,
                                          finalValue: newFinalValue,
                                          profitMargin: newProfitMargin
                                        });
                                      }}
                                      className="w-20 p-1 border border-slate-200 rounded text-right font-bold"
                                    />
                                    <button 
                                      onClick={() => {
                                        const newDeductions = proposalCalculator.deductions.filter((_, i) => i !== idx);
                                        const totalDeductions = newDeductions.reduce((acc, d) => acc + d.value, 0);
                                        const newFinalValue = proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - (proposalCalculator.baseValue * (profitMarginPercentage / 100));
                                        const newProfitMargin = proposalCalculator.baseValue - newFinalValue - proposalCalculator.payoffValue;
                                        setProposalCalculator({
                                          ...proposalCalculator, 
                                          deductions: newDeductions,
                                          finalValue: newFinalValue,
                                          profitMargin: newProfitMargin
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
                                    const newFinalValue = proposalCalculator.baseValue - totalDeductions - proposalCalculator.payoffValue - proposalCalculator.docDebts - (proposalCalculator.baseValue * (profitMarginPercentage / 100));
                                    const newProfitMargin = proposalCalculator.baseValue - newFinalValue - proposalCalculator.payoffValue;
                                    setProposalCalculator({
                                      ...proposalCalculator, 
                                      deductions: newDeductions,
                                      finalValue: newFinalValue,
                                      profitMargin: newProfitMargin
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
                            <p className={`text-3xl font-black ${getProposalClass(proposalCalculator.finalValue, selectedLead?.tipo_veiculo) || 'text-accent'}`}>
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
            )}

            {activeTab === 'hero' && (
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
                    {asset.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video 
                        src={asset.url} 
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img 
                        src={asset.url} 
                        alt={asset.legenda} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors">
                        {uploadingAsset === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Trocar Mídia
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => setConfirmDeleteAssetId(asset.id)}
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
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-sm font-bold text-slate-700">Status do Banner</span>
                      <button
                        onClick={() => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, ativo: !a.ativo } : a))}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          asset.ativo 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {asset.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <button 
                      onClick={() => handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text, asset.ativo)}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salvar Alterações
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">Gerenciar Assets</h2>
              <button 
                onClick={() => handleCreateAsset('card_img')}
                className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nova Foto
              </button>
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
                    {asset.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video 
                        src={asset.url} 
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img 
                        src={asset.url} 
                        alt={asset.legenda} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors">
                        {uploadingAsset === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Trocar Mídia
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, asset.id)}
                          disabled={uploadingAsset === asset.id}
                        />
                      </label>
                    </div>
                    <button 
                      onClick={() => setConfirmDeleteAssetId(asset.id)}
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
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-sm font-bold text-slate-700">Status do Asset</span>
                      <button
                        onClick={() => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, ativo: !a.ativo } : a))}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          asset.ativo 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {asset.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <button 
                      onClick={() => handleUpdateAsset(asset.id, asset.url, asset.legenda, asset.tipo, asset.button_text, asset.button_link, asset.title, asset.subtitle, asset.badge_text, asset.ativo)}
                      disabled={savingAsset === asset.id}
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {savingAsset === asset.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Salvar Alterações
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
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
        )}

        {activeTab === 'apis' && (
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
        )}

        {activeTab === 'footer' && (
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
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

        {/* Modal de WhatsApp */}
        {showWhatsAppModal && leadToWhatsApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-4xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Enviar para Compradores</h3>
                <button onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <LogOut className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interestedBuyers.map(buyer => (
                    <label key={buyer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
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
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const buyers = interestedBuyers.filter(b => selectedBuyers.includes(b.id));
                    handleSendToWhatsApp(leadToWhatsApp, buyers);
                    setShowWhatsAppModal(false);
                    setSelectedBuyers([]);
                  }}
                  disabled={selectedBuyers.length === 0}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ({selectedBuyers.length})
                </button>
                <button 
                  onClick={() => {
                    const buyers = interestedBuyers.filter(b => selectedBuyers.includes(b.id));
                    handleSendToChat(leadToWhatsApp, buyers);
                    setShowWhatsAppModal(false);
                    setSelectedBuyers([]);
                  }}
                  disabled={selectedBuyers.length === 0}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat do Site ({selectedBuyers.length})
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de Autorização */}
        {expandedPhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setExpandedPhoto(null)}>
            <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center">
              <img 
                src={expandedPhoto} 
                alt="Veículo Ampliado" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                onClick={() => setExpandedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {showAuthModal && buyerToAuth && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Autorizar Acesso: {buyerToAuth.name}</h3>
                <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <LogOut className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {leads.map(lead => {
                    const isAuthorized = buyerAuthorizations.some(a => a.buyer_id === buyerToAuth.id && a.lead_id === lead.id);
                    return (
                      <label key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
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
                            <p className="font-bold text-slate-900 text-xs">#{lead.vehicle_code}</p>
                            <p className="text-[10px] text-slate-500">{lead.marca} {lead.modelo}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
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

        {showProposalDetails && proposalCalculator && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Detalhamento da Proposta</h3>
                <button onClick={() => setShowProposalDetails(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-600">Valor Base (FIPE)</span>
                  <span className="font-black text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.baseValue)}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deduções</p>
                  {proposalCalculator.deductions.length === 0 && <p className="text-slate-400 italic">Nenhuma dedução aplicada.</p>}
                  {proposalCalculator.deductions.map((d: any, i: number) => {
                    const isPercent = d.type === 'percent';
                    const isApplied = !isPercent || d.isMax;
                    return (
                      <div key={i} className={`flex justify-between items-center ${isApplied ? 'text-red-600 font-bold' : 'text-slate-400 line-through opacity-50'}`}>
                        <span>{d.name}</span>
                        <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}</span>
                      </div>
                    );
                  })}
                </div>

                {proposalCalculator.payoffValue > 0 && (
                   <div className="flex justify-between items-center text-red-600">
                      <span>Quitação (Estimada)</span>
                      <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.payoffValue)}</span>
                    </div>
                )}

                {proposalCalculator.docDebts > 0 && (
                   <div className="flex justify-between items-center text-red-600">
                      <span>Débitos (Multas/IPVA)</span>
                      <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.docDebts)}</span>
                    </div>
                )}

                 <div className="flex justify-between items-center text-slate-500">
                    <span>Margem de Lucro (Estimada)</span>
                    <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.profitMargin)}</span>
                  </div>

                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xl text-slate-900">Valor Final</span>
                    <span className={`font-black text-2xl ${getProposalClass(proposalCalculator.finalValue, selectedLead?.tipo_veiculo) || 'text-accent'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Configurações de Envio</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={buyerPermissionsForm.send_whatsapp}
                      onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, send_whatsapp: e.target.checked})}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-xs font-bold">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={buyerPermissionsForm.send_chat}
                      onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, send_chat: e.target.checked})}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-xs font-bold">Chat Interno</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={buyerPermissionsForm.send_fipe}
                      onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, send_fipe: e.target.checked})}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-xs font-bold">Dados FIPE</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={buyerPermissionsForm.send_banco}
                      onChange={e => setBuyerPermissionsForm({...buyerPermissionsForm, send_banco: e.target.checked})}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-xs font-bold">Dados Banco</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  // Tentar encontrar o user_id do comprador pelo email se não tiver
                  let targetUserId = selectedBuyer.user_id || selectedBuyer.id;
                  
                  // Se o ID não parecer um UUID, tentar buscar no profiles pelo email
                  if (targetUserId && targetUserId.length < 30) {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('email', selectedBuyer.email)
                      .single();
                    if (profile) targetUserId = profile.id;
                  }

                  const { error } = await supabase
                    .from('buyer_authorizations')
                    .upsert({
                      user_id: targetUserId,
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

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Novo Usuário</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                  <input 
                    type="text" 
                    value={newUserForm.full_name}
                    onChange={e => setNewUserForm({...newUserForm, full_name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                  <input 
                    type="email" 
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Telefone</label>
                  <input 
                    type="text" 
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cargo / Perfil</label>
                  <select 
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent/20 font-bold"
                  >
                    <option value="user">Cliente / Lead</option>
                    <option value="buyer">Comprador</option>
                    <option value="buyer_premium">Comprador Premium</option>
                    <option value="buyer_master">Comprador Master</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateUser}
                  disabled={isCreatingUser}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  Criar Usuário
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDeleteLeadId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Excluir Lead?</h3>
              <p className="text-slate-500 mb-8">
                Tem certeza que deseja excluir este lead permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteLeadId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteLead(confirmDeleteLeadId)}
                  disabled={isDeletingLead === confirmDeleteLeadId}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {isDeletingLead === confirmDeleteLeadId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Excluir Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDeleteUserId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Excluir Usuário?</h3>
              <p className="text-slate-500 mb-8">
                Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteUserId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteUser(confirmDeleteUserId)}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDeleteAssetId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Excluir Banner?</h3>
              <p className="text-slate-500 mb-8">
                Tem certeza que deseja excluir este banner permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteAssetId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteAsset(confirmDeleteAssetId)}
                  disabled={deletingAsset === confirmDeleteAssetId}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {deletingAsset === confirmDeleteAssetId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Excluir Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
