import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AIService } from '../services/aiService';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Car, Phone, Calendar, DollarSign, AlertCircle, AlertTriangle, CheckCircle, Check, Clock, Image as ImageIcon, Save, Loader2, LogOut, Plus, Trash2, Upload, RefreshCw, Pencil, Users, Share2, MessageCircle, ChevronRight, ChevronLeft, Search, Filter, ShieldCheck, Wrench, Wallet, User, UserPlus, Mail, Bell, BellOff, Send, UserCheck, LayoutDashboard, Download, TrendingUp, BarChart3, PieChart as PieChartIcon, Info, X, Settings, Maximize2, Key, Bot, Database, Zap, FileText, XCircle } from 'lucide-react';
import ChatThemeSettings from './ChatThemeSettings';
import { useAssets } from '../lib/assetsContext';
import { supabase } from '../lib/supabase';
import { defaultCards } from '../lib/seedData';
import { ProposalModal } from './ProposalModal';
import { VehicleSelectionModal } from './VehicleSelectionModal';
import { LeadCard } from './LeadCard';
import LeadDetailsCard from './LeadDetailsCard';
import AdminMessages from './AdminMessages';
import { CRMChatContainer } from './crm/CRMChatContainer';
import { BackgroundAIManager } from './crm/BackgroundAIManager';
import CooperativesModal from './CooperativesModal';
import { logToStorage, getStorageLogs, clearStorageLogs } from '../lib/logger';
import { ApiManagement } from './AdminDashboard/ApiManagement';
import { TagsManagement } from './AdminDashboard/TagsManagement';

// Use BackgroundAIManager directly to prevent Vite initialization bugs
import { calculateProposal } from '../lib/proposalUtils';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'hero' | 'assets' | 'footer' | 'settings' | 'ai' | 'apis' | 'crm' | 'messages' | 'buyers' | 'tags' | 'users' | 'cooperatives' | 'logs' | 'crm_chat' | 'chat_settings'>('dashboard');
  const [messageTab, setMessageTab] = useState<'leads' | 'internal' | 'buyers'>('leads');
  const [internalConversations, setInternalConversations] = useState<any[]>([]);
  const [compradoresConversations, setCompradoresConversations] = useState<any[]>([]);
  const [selectedInternalChat, setSelectedInternalChat] = useState<string | null>(null);
  const [selectedCompradorChat, setSelectedCompradorChat] = useState<string | null>(null);
  const [internalChatMessages, setInternalChatMessages] = useState<any[]>([]);
  const [compradorChatMessages, setCompradorChatMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'pereira.brusque@gmail.com';
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleAdsId, setGoogleAdsId] = useState('');
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState('');
  const [interestedBuyers, setInterestedBuyers] = useState<any[]>([]);
  const [buyerProposals, setBuyerProposals] = useState<any[]>([]); // Adicionado
  const [buyerAuthorizations, setBuyerAuthorizations] = useState<any[]>([]);
  const [sentLeads, setSentLeads] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'proposal' | 'clone'>('proposal');
  const [isCloning, setIsCloning] = useState(false);
  const [showExpiredReservationAlert, setShowExpiredReservationAlert] = useState(false);
  const [showCooperativesModal, setShowCooperativesModal] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [isSavingBuyer, setIsSavingBuyer] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: '', phone: '', email: '', category: ['carro'], type: ['normal'], sub_category: '' });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [savingAsset, setSavingAsset] = useState<string | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  // const [seedingCards, setSeedingCards] = useState(false); // Frozen for performance
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

  const hasQuotaIssues = useMemo(() => {
    // Só mostra o alerta de quota se NÃO houver nenhuma chave funcionando (ok)
    // E houver chaves com problemas de quota.
    return apiKeys.length > 0 && !apiKeys.some(k => k.status === 'ok') && apiKeys.some(k => k.status === 'no_credit' || k.status === 'rate_limited');
  }, [apiKeys]);

  const hasWorkingKeys = useMemo(() => {
    return apiKeys.length > 0 && apiKeys.some(k => k.status === 'ok');
  }, [apiKeys]);

  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiMemory, setAiMemory] = useState('');
  const [aiCrmPrompt, setAiCrmPrompt] = useState('');
  const [aiCrmMemory, setAiCrmMemory] = useState('');
  const [responseMode, setResponseMode] = useState<'chat' | 'webhook'>('chat');
  const [webhookUrl, setWebhookUrl] = useState('');
  const aiMemoryRef = useRef('');
  useEffect(() => {
    aiMemoryRef.current = aiMemory;
  }, [aiMemory]);
  const aiCrmMemoryRef = useRef('');
  useEffect(() => {
    aiCrmMemoryRef.current = aiCrmMemory;
  }, [aiCrmMemory]);
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
  const [isGlobalAiEnabled, setIsGlobalAiEnabled] = useState(false);
  const [isBuyerAiEnabled, setIsBuyerAiEnabled] = useState(true);
  const isGlobalAiEnabledRef = useRef(false);
  const isBuyerAiEnabledRef = useRef(true);
  useEffect(() => {
    isGlobalAiEnabledRef.current = isGlobalAiEnabled;
    isBuyerAiEnabledRef.current = isBuyerAiEnabled;
  }, [isGlobalAiEnabled, isBuyerAiEnabled]);

  const [isUpdatingAi, setIsUpdatingAi] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatHeight, setChatHeight] = useState('560');
  const [chatWidth, setChatWidth] = useState('360');
  const [chatColor, setChatColor] = useState('#F27D26');
  
  const [autoProposalEnabled, setAutoProposalEnabled] = useState(false);
  const autoProposalEnabledRef = useRef(false);
  useEffect(() => {
    autoProposalEnabledRef.current = autoProposalEnabled;
  }, [autoProposalEnabled]);

  const [proposalModeEnabled, setProposalModeEnabled] = useState(false);
  const proposalModeEnabledRef = useRef(false);
  useEffect(() => {
    proposalModeEnabledRef.current = proposalModeEnabled;
  }, [proposalModeEnabled]);
  const [chatAvatarUrl, setChatAvatarUrl] = useState('');
  const [chatAttendantAvatar, setChatAttendantAvatar] = useState('');
  const [bannerHeight, setBannerHeight] = useState('100vh');
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(20);
  const [savingSettings, setSavingSettings] = useState(false);
  const isSavingSettingsRef = useRef(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const selectedLeadRef = useRef<any>(null);
  useEffect(() => {
    selectedLeadRef.current = selectedLead;
  }, [selectedLead]);
  const { refreshAssets } = useAssets();

  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const [activeLeadTab, setActiveLeadTab] = useState<'todos' | 'novo' | 'em_contato' | 'proposta_enviada' | 'contrato_enviado' | 'fechado' | 'frio' | 'reservado' | 'perdido' | 'vendido' | 'negociar' | 'limpa_nome' | 'novos_precificacao'>('todos');
  const [leadsViewMode, setLeadsViewMode] = useState<'grid' | 'list'>('list');
  const [showBuyerPermissionsModal, setShowBuyerPermissionsModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [filterBrand, setFilterBrand] = useState('');
  useEffect(() => {
    if (!currentUser) return;
    
    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', currentUser.id);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentUser]);

  const [filterYear, setFilterYear] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const filteredLeads = useMemo(() => {
    let baseLeads = leads;

    // Filter leads for buyers: only those they are authorized to see
    if (userProfile?.role?.includes('buyer')) {
      // Find the specific buyer ID for this user email
      const myBuyer = interestedBuyers.find(b => b.email === userProfile.email);
      if (myBuyer) {
        const authorizedLeadIds = new Set(
          buyerAuthorizations
            .filter(a => a.buyer_id === myBuyer.id)
            .map(a => a.lead_id)
        );
        baseLeads = baseLeads.filter(l => authorizedLeadIds.has(l.id));
      } else {
        // If they are a buyer but not in the interestedBuyers table yet, search by email in invitations
        const authorizedLeadIds = new Set(
          buyerAuthorizations
            .filter(a => a.buyer_email === userProfile.email) // in case we use email fallback
            .map(a => a.lead_id)
        );
        if (authorizedLeadIds.size > 0) {
           baseLeads = baseLeads.filter(l => authorizedLeadIds.has(l.id));
        } else {
           baseLeads = []; // No authorizations found
        }
      }
    }

    return baseLeads
      .filter(l => {
        if (activeLeadTab === 'todos') return l.status !== 'perdido' && l.status !== 'vendido';
        if (activeLeadTab === 'frio') return l.status === 'frio';
        if (activeLeadTab === 'reservado') return l.status === 'reservado';
        if (activeLeadTab === 'vendido') return l.status === 'vendido';
        if (activeLeadTab === 'negociar') return l.status === 'negociar' || l.status === 'Negociar';
        if (activeLeadTab === 'contrato_enviado') return l.status === 'contrato_enviado';
        if (activeLeadTab === 'limpa_nome') return l.status === 'limpa_nome' || l.status === 'Limpa Nome';
        if (activeLeadTab === 'proposta_enviada') return l.status === 'proposta_enviada' || l.status === 'novo' || l.status === 'em_contato';
        
        if (activeLeadTab === 'novos_precificacao') {
          // Veículos com formulário (tem marca/modelo) mas SEM proposta de comprador COMPLETA (precisa das duas para ir pro estoque)
          const props = buyerProposals.filter(p => p.lead_id === l.id);
          const hasAsIs = props.some(p => p.type === 'as_is');
          const hasQuitado = props.some(p => p.type === 'quitado');
          
          const hasBasicForm = !!(l.marca && l.modelo && l.fotos?.length > 0);
          return hasBasicForm && (!hasAsIs || !hasQuitado);
        }

        return l.status === activeLeadTab;
      })
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
      });
  }, [leads, activeLeadTab, searchCode, filterBrand, filterYear, filterMinPrice, filterMaxPrice, filterStartDate, filterEndDate]);
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

  const getProposalResult = (lead: any) => {
    if (!lead) return null;
    return calculateProposal(lead, {
      fipeRules,
      banks,
      cooperativeDiscount,
      profitMarginPercentage,
      jurosAtraso,
      repairCosts,
      overrides: proposalOverrides
    });
  };

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [avarias, setAvarias] = useState<{id: string, description: string, value: number}[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Realtime subscription for messages
  useEffect(() => {
    const channel = supabase
      .channel('mensagens_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const newMsg = payload.new;
        
        // Update appropriate state based on message type (simplified logic here, needs careful implementation)
        // For now, let's just trigger a data refresh when a message arrives
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate User Stats for Dashboard
  const adminEmail = 'pereira.brusque@gmail.com';

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 6) {
      return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else {
      return v;
    }
  };

  const getDayString = (date: any) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const getTimeString = (date: any) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getDateTimeString = (date: any) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  const userStats = {
    online: users.filter(u => {
      if (!u.last_login) return false;
      const d = new Date(u.last_login);
      return !isNaN(d.getTime()) && (new Date().getTime() - d.getTime()) < 300000;
    }).length,
    buyers: {
      total: users.filter(u => u.role === 'buyer' || u.role === 'buyer_premium' || u.role === 'buyer_master').length,
      online: users.filter(u => (u.role === 'buyer' || u.role === 'buyer_premium' || u.role === 'buyer_master') && u.last_login && !isNaN(new Date(u.last_login).getTime()) && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length,
    },
    master: {
      total: users.filter(u => u.role === 'buyer_master').length,
      online: users.filter(u => u.role === 'buyer_master' && u.last_login && !isNaN(new Date(u.last_login).getTime()) && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length,
    },
    premium: {
      total: users.filter(u => u.role === 'buyer_premium').length,
      online: users.filter(u => u.role === 'buyer_premium' && u.last_login && !isNaN(new Date(u.last_login).getTime()) && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length,
    },
    users: {
      total: users.filter(u => u.role === 'user' || u.role === 'seller' || u.role === 'agent').length,
      online: users.filter(u => (u.role === 'user' || u.role === 'seller' || u.role === 'agent') && u.last_login && !isNaN(new Date(u.last_login).getTime()) && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length,
    },
    admins: {
      total: users.filter(u => u.role === 'admin').length,
      online: users.filter(u => u.role === 'admin' && u.last_login && !isNaN(new Date(u.last_login).getTime()) && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length,
    }
  };

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

  const toggleGlobalAi = async () => {
    setIsUpdatingAi(true);
    const newValue = !isGlobalAiEnabled;
    try {
      const { data: existing } = await supabase.from('settings').select('key').eq('key', 'AI_CRM_ENABLED').maybeSingle();
      if (existing) {
        await supabase.from('settings').update({ value: newValue.toString() }).eq('key', 'AI_CRM_ENABLED');
      } else {
        await supabase.from('settings').insert({ key: 'AI_CRM_ENABLED', value: newValue.toString() });
      }
      setIsGlobalAiEnabled(newValue);
    } catch (e) {
      console.error('Error toggling AI:', e);
    } finally {
      setIsUpdatingAi(false);
    }
  };

  const toggleAutoProposal = async () => {
    setIsUpdatingAi(true);
    const newValue = !autoProposalEnabled;
    try {
      const { data: existing } = await supabase.from('settings').select('key').eq('key', 'AUTO_PROPOSAL_ENABLED').maybeSingle();
      if (existing) {
        await supabase.from('settings').update({ value: newValue.toString() }).eq('key', 'AUTO_PROPOSAL_ENABLED');
      } else {
        await supabase.from('settings').insert({ key: 'AUTO_PROPOSAL_ENABLED', value: newValue.toString() });
      }
      setAutoProposalEnabled(newValue);
    } catch (e) {
      console.error('Error toggling auto proposal:', e);
    } finally {
      setIsUpdatingAi(false);
    }
  };

  const handleMigrateBuyerProposals = async () => {
    if (!confirm('Deseja gerar propostas base para COMPRADORES em todos os veículos antigos que ainda não possuem? Isso atualizará o banco de dados baseando-se nas regras de FIPE e margens atuais.')) return;
    
    setIsMigrating(true);
    try {
      // 1. Pegar todos os leads
      const { data: leads } = await supabase.from('leads_veiculos').select('*');
      if (!leads) return;
      
      // 2. Pegar todas as propostas existentes
      const { data: existingProposals } = await supabase.from('buyer_proposals').select('lead_id, type');
      
      const newProposals: any[] = [];
      
      for (const lead of leads) {
        // Ignora leads sem FIPE básica
        if (!lead.valor_fipe) continue;
        
        // Calcula valores base usando a mesma lógica do sistema
        const calc = getProposalResult(lead);
        
        // Verifica se 'as_is' existe
        const hasAsIs = (existingProposals || []).some(p => p.lead_id === lead.id && p.type === 'as_is');
        if (!hasAsIs) {
          newProposals.push({
            lead_id: lead.id,
            type: 'as_is',
            proposta_final: Math.round(calc.finalValue * 0.775),
            vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        
        // Verifica se 'quitado' existe
        const hasQuitado = (existingProposals || []).some(p => p.lead_id === lead.id && p.type === 'quitado');
        if (!hasQuitado) {
          newProposals.push({
            lead_id: lead.id,
            type: 'quitado',
            proposta_final: Math.round(calc.fipe * 0.8),
            vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
      
      if (newProposals.length > 0) {
        // Insere em lotes de 50 para estabilidade
        const batchSize = 50;
        for (let i = 0; i < newProposals.length; i += batchSize) {
          const batch = newProposals.slice(i, i + batchSize);
          const { error } = await supabase.from('buyer_proposals').insert(batch);
          if (error) console.error('[Migration] Erro no lote:', error);
        }
        setToast({ message: `${newProposals.length} novas propostas geradas com sucesso!`, type: 'success' });
      } else {
        setToast({ message: 'Todos os veículos já possuem propostas para compradores.', type: 'success' });
      }
    } catch (err) {
      console.error('[Migration] Erro na migração:', err);
      setToast({ message: 'Falha na migração automática.', type: 'error' });
    } finally {
      setIsMigrating(false);
    }
  };

  const [filterUser, setFilterUser] = useState('');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  const refreshUsers = async () => {
    if (activeTab !== 'users' && activeTab !== 'dashboard') return;
    setIsRefreshingUsers(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('last_login', { ascending: false });
      if (error) {
        console.error('Error refreshing users:', error);
      } else {
        console.log('Users refreshed:', data);
        setUsers(data || []);
      }
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
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ full_name: '', email: '', phone: '', role: 'user' });

  const [confirmDeleteLeadId, setConfirmDeleteLeadId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const leadsScrollRef = useRef<HTMLDivElement>(null);

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
    observacoes: false,
    whatsapp: true
  });

  // Efeito para definir a aba inicial baseada no cargo
  useEffect(() => {
    if (currentUser && currentUser.role) {
      if (currentUser.role === 'user' || currentUser.role === 'seller') {
        setActiveTab('leads');
      } else if (['buyer', 'buyer_premium', 'buyer_master'].includes(currentUser.role)) {
        setActiveTab('crm_chat');
      }
    }
  }, [currentUser]);

  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const isFetchingRef = useRef(false);

  const handleCleanupDuplicates = async () => {
    if (!confirm('Deseja realmente limpar leads duplicados? Isso manterá apenas o registro mais recente para cada e-mail (para leads sem formulário) ou para cada combinação de e-mail e veículo (para leads com formulário).')) return;
    
    setIsCleaningDuplicates(true);
    addLog('Iniciando limpeza de duplicados...', 'info');
    
    try {
      // 1. Busca todos os leads
      const { data: allLeads, error } = await supabase
        .from('leads_veiculos')
        .select('id, email, created_at, marca, modelo')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Agrupa por e-mail e veículo
      const emailGroups: Record<string, string[]> = {}; // Para leads frios (sem marca/modelo)
      const vehicleGroups: Record<string, string[]> = {}; // Para leads com formulário (email + marca + modelo)
      
      allLeads.forEach(lead => {
        if (!lead.email) return;
        
        if (!lead.marca && !lead.modelo) {
          // Lead frio
          if (!emailGroups[lead.email]) emailGroups[lead.email] = [];
          emailGroups[lead.email].push(lead.id);
        } else {
          // Lead com formulário
          const key = `${lead.email.toLowerCase()}_${(lead.marca || '').toLowerCase()}_${(lead.modelo || '').toLowerCase()}`;
          if (!vehicleGroups[key]) vehicleGroups[key] = [];
          vehicleGroups[key].push(lead.id);
        }
      });

      // 3. Identifica IDs para excluir
      const idsToDelete: string[] = [];
      
      // Limpa duplicados frios
      Object.values(emailGroups).forEach(ids => {
        if (ids.length > 1) idsToDelete.push(...ids.slice(1));
      });
      
      // Limpa duplicados com formulário (mesmo email + mesmo carro)
      Object.values(vehicleGroups).forEach(ids => {
        if (ids.length > 1) idsToDelete.push(...ids.slice(1));
      });

      if (idsToDelete.length === 0) {
        alert('Nenhum duplicado encontrado.');
        setIsCleaningDuplicates(false);
        return;
      }

      addLog(`Excluindo ${idsToDelete.length} leads duplicados...`, 'info');

      // 4. Exclui em lotes
      const batchSize = 50;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabase
          .from('leads_veiculos')
          .delete()
          .in('id', batch);
        
        if (deleteError) throw deleteError;
      }

      addLog('Limpeza concluída com sucesso!', 'info');
      alert(`${idsToDelete.length} leads duplicados foram removidos.`);
      fetchData(); // Atualiza a lista
    } catch (err: any) {
      console.error('Erro na limpeza:', err);
      addLog('Erro ao limpar duplicados', 'error', err);
      alert('Erro ao limpar duplicados: ' + err.message);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleReserve = async (lead: any) => {
    const isReserved = lead.status === 'reservado';
    const confirmMsg = isReserved 
      ? 'Deseja remover a reserva deste veículo? Ele voltará a ficar visível no estoque.' 
      : 'Deseja reservar este veículo? Ele ficará invisível no estoque por 24 horas.';
    
    if (!confirm(confirmMsg)) return;
    
    const updatedDetalhes = {
      ...(lead.detalhes_proposta || {}),
      reserva_timestamp: isReserved ? null : new Date().toISOString()
    };

    const { error } = await supabase
      .from('leads_veiculos')
      .update({ 
        status: isReserved ? 'novo' : 'reservado', 
        detalhes_proposta: updatedDetalhes 
      })
      .eq('id', lead.id);
    
    if (error) {
      alert('Erro ao processar reserva: ' + error.message);
    } else {
      alert(isReserved ? 'Reserva removida com sucesso!' : 'Veículo reservado com sucesso!');
      fetchData();
    }
  };

  const fetchDataDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async (force: boolean = false, type: 'all' | 'critical' = 'all') => {
    // Se for forçado, cancelamos qualquer agendamento anterior e executamos imediatamente
    if (force && fetchDataDebounceRef.current) {
      clearTimeout(fetchDataDebounceRef.current);
      fetchDataDebounceRef.current = null;
    }

    const runFetch = async () => {
      // Se já estiver buscando e não for forçado, aborta
      if (isFetchingRef.current && !force) return;
      
      // Se estiver salvando configurações, ignora o fetch automático (a menos que seja force)
      if (isSavingSettingsRef.current && !force) return;

      isFetchingRef.current = true;
      console.log(`fetchData (${type}) executando... (Force: ${force})`);
      
      // Apenas mostramos o carregamento global se for um fetch "all" ou o primeiro carregamento
      if (type === 'all' || leads.length === 0) setIsLoading(true);
      
      addLog(`Iniciando busca de dados (${type})...`, 'info');
      
      try {
        if (!currentUser) return;

        // 1. Fetch User Profile first (Critical)
        const { data: profile_res } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (profile_res) {
          setUserProfile(profile_res);
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Define o que é crítico: Mensagens, Leads e Conversas
        const [
          leadsResult,
          messagesResult,
          internalMessagesResult,
          profilesResult
        ] = await Promise.all([
          supabase.from('leads_veiculos').select('*').order('created_at', { ascending: false }).limit(1000),
          supabase.from('mensagens').select('*, leads_veiculos(*)').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(1000),
          supabase.from('internal_messages').select('*').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(1000),
          supabase.from('profiles').select('*').order('created_at', { ascending: false })
        ]);

        if (leadsResult.error) throw leadsResult.error;
        if (messagesResult.error) throw messagesResult.error;
        if (internalMessagesResult.error) throw internalMessagesResult.error;

        const leadsData = leadsResult.data || [];
        const messagesData = messagesResult.data || [];
        const internalMessagesData = internalMessagesResult.data || [];
        const profilesData = profilesResult.data || [];

        // 2. Fetch o resto opcionalmente
        let settingsData: any[] | null = null;
        let assetsData: any[] | null = null;
        let banksData: any[] | null = null;
        let apiKeysData: any[] | null = null;
        let providersData: any[] | null = null;
        let buyerProposalsData: any[] | null = null;
        let authsData: any[] | null = null;
        let sentData: any[] | null = null;
        let repairData: any[] | null = null;
        let fipeData: any[] | null = null;
        let buyersResData: any[] | null = null;

        if (type === 'all') {
            const [
              assetsRes,
              banksRes,
              repairRes,
              fipeRes,
              buyerProposalsRes,
              apiKeysRes,
              providersRes,
              buyersRes,
              authsRes,
              sentRes,
              settingsRes
            ] = await Promise.all([
              supabase.from('banners').select('*').order('ordem', { ascending: true }),
              supabase.from('banks').select('*').order('name'),
              supabase.from('repair_costs').select('*').order('part_name'),
              supabase.from('fipe_rules').select('*').order('condition_name'),
              supabase.from('buyer_proposals').select('*'),
              supabase.from('api_keys').select('*').order('created_at', { ascending: false }),
              supabase.from('providers').select('*').order('name'),
              supabase.from('interested_buyers').select('*').order('created_at', { ascending: false }),
              supabase.from('buyer_crm_permissions').select('*'),
              supabase.from('sent_leads').select('*'),
              supabase.from('settings').select('*')
            ]);
            
            assetsData = assetsRes.data;
            banksData = banksRes.data;
            settingsData = settingsRes.data;
            apiKeysData = apiKeysRes.data;
            providersData = providersRes.data;
            buyerProposalsData = buyerProposalsRes.data;
            authsData = authsRes.data;
            sentData = sentRes.data;
            repairData = repairRes.data;
            fipeData = fipeRes.data;
            buyersResData = buyersRes.data;
            if (repairRes.data) setRepairCosts(repairRes.data);
            if (fipeRes.data) setFipeRules(fipeRes.data);
            if (apiKeysRes.data) setApiKeys(apiKeysRes.data);
            if (buyerProposalsRes.data) setBuyerProposals(buyerProposalsRes.data);
            if (providersRes.data) setProviders(providersRes.data);
            if (buyersRes.data) setInterestedBuyers(buyersRes.data);
            if (authsRes.data) setBuyerAuthorizations(authsRes.data);
            if (sentRes.data) setSentLeads(sentRes.data);
        }

        // Processamento de dados (originalmente estava fora do try em execuções anteriores devido a erro de edição)

      // Check for expired reservations
      const now = new Date();
      
      const processedLeadsData = leadsData?.map(lead => {
        const reservaTimestamp = lead.detalhes_proposta?.reserva_timestamp || lead.reserva_timestamp;
        
        if (lead.status === 'reservado' && reservaTimestamp) {
          const reservaDate = new Date(reservaTimestamp);
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          
          if (reservaDate < twentyFourHoursAgo) {
            // Revert
            const updatedDetalhes = { ...(lead.detalhes_proposta || {}) };
            delete updatedDetalhes.reserva_timestamp;

            supabase.from('leads_veiculos').update({ 
              status: 'proposta_enviada', 
              reserva_timestamp: null,
              detalhes_proposta: updatedDetalhes
            }).eq('id', lead.id)
              .then(() => console.log(`[AdminDashboard] Reserva expirada revertida para lead: ${lead.id}`));
            return { ...lead, status: 'proposta_enviada', reserva_timestamp: null, detalhes_proposta: updatedDetalhes };
          }
        }
        return lead;
      });

      addLog(`Leads buscados: ${processedLeadsData?.length || 0}`, 'debug');
      console.log('Leads fetched successfully:', processedLeadsData);

      // Deduplicate leads from leads_veiculos (keep most recent per email if it's a cold lead)
      const uniqueLeads: any[] = [];
      const seenEmails = new Set<string>();
      const duplicatesToDelete: string[] = [];
      
      // Sort leads by date descending to keep the newest one
      const sortedLeads = [...(processedLeadsData || [])].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      sortedLeads.forEach(lead => {
        if (!lead.email) {
          uniqueLeads.push(lead);
          return;
        }
        
        // If it's a "hot" lead (has brand/model), always keep it
        if (lead.marca || lead.modelo) {
          // Fix status if it's still 'frio' but has vehicle data
          if (lead.status === 'frio' || !lead.status) {
            lead.status = 'proposta_enviada';
            lead.classificacao = 'morna';
          }
          uniqueLeads.push(lead);
          seenEmails.add(lead.email);
          return;
        }
        
        // If it's a cold lead, only keep if we haven't seen this email yet
        if (!seenEmails.has(lead.email)) {
          uniqueLeads.push(lead);
          seenEmails.add(lead.email);
        } else {
          // It's a duplicate cold lead, mark for deletion
          duplicatesToDelete.push(lead.id);
        }
      });

      // Fix status/classification in background for leads that have vehicle data but wrong status
      const leadsToFix = uniqueLeads.filter(l => (l.marca || l.modelo) && (l.status === 'frio' || !l.status || !l.classificacao));
      if (leadsToFix.length > 0) {
        console.log(`[AdminDashboard] Corrigindo ${leadsToFix.length} leads com dados de veículo mas status incorreto.`);
        const fixPromises = leadsToFix.map(l => {
          const newStatus = l.status === 'fechado' ? 'fechado' : 'proposta_enviada';
          const newClass = l.status === 'fechado' ? 'quente' : 'morna';
          return supabase.from('leads_veiculos').update({ 
            status: newStatus, 
            classificacao: newClass 
          }).eq('id', l.id);
        });
        Promise.all(fixPromises).then(() => console.log('[AdminDashboard] Correção de status concluída.'));
      }

      // Perform background cleanup of duplicates if any found
      if (duplicatesToDelete.length > 0) {
        console.log(`[AdminDashboard] Encontrados ${duplicatesToDelete.length} leads frios duplicados. Sugerido limpeza manual para evitar orfandade de mensagens.`);
        // REMOVED automatic deletion to prevent orphaned messages
      }

      // Combine leads and profiles
      const allLeads = [...uniqueLeads];
      console.log("[AdminDashboard] Unique leads from leads_veiculos:", allLeads.length);
      
      // Map to track unique emails for cold leads to avoid duplicates
      const coldLeadEmails = new Set(allLeads.filter(l => l.email).map(l => l.email));

      profilesData?.forEach(profile => {
        // Do not add admins or buyers as "frio" leads
        if (profile.role === 'admin' || profile.role?.includes('buyer')) return;

        if (!coldLeadEmails.has(profile.email)) {
          console.log("[AdminDashboard] Adding profile as cold lead:", profile.email);
          allLeads.push({
            ...profile,
            id: profile.id,
            nome: profile.full_name,
            cliente_nome: profile.full_name,
            email: profile.email,
            status: 'frio', // Default status for users who haven't filled a form
            is_frio: true,
            user_id: profile.id
          });
          coldLeadEmails.add(profile.email);
        }
      });
      
      setLeads(allLeads);
      console.log("[AdminDashboard] Total leads processed:", allLeads.length);
      addLog(`Total de leads processados: ${allLeads.length}`, 'debug');
      
      if (assetsData) setDbAssets(assetsData);
      if (banksData) setBanks(banksData);
      if (repairData) setRepairCosts(repairData);
      if (fipeData) setFipeRules(fipeData);
      if (apiKeysData) setApiKeys(apiKeysData);
      if (buyerProposalsData) setBuyerProposals(buyerProposalsData);
      if (providersData) setProviders(providersData);
      if (sentData) setSentLeads(sentData);
      if (authsData) setBuyerAuthorizations(authsData);

      const profileMap = new Map();
      profilesData?.forEach(p => {
        if (p.email) profileMap.set(p.email, p);
      });

      console.log('Profiles buscados:', profilesData);

      const { data: buyersDataResult, error: buyersError } = await supabase.from('interested_buyers').select('*').order('created_at', { ascending: false });
      if (buyersDataResult) console.log('Buyers buscados:', buyersDataResult);
      
      const buyersDataMerged = (type === 'all' ? buyersResData : interestedBuyers) || [];
      
      // Group messages by email or name+phone to create conversation list
      const groupedConversations: any[] = [];
      const conversationKeys = new Set();
      
      console.log('Messages fetched:', messagesData);
      console.log('Grouped conversations:', groupedConversations);

      if (messagesData) {
        messagesData.forEach((msg: any) => {
          const lead = msg.leads_veiculos;
          const key = lead?.email || lead?.telefone || msg.lead_id;
          
          if (key && !conversationKeys.has(key)) {
            // Check if this lead is a buyer
            const email = lead?.email;
            const leadProfile = email ? profileMap.get(email) : null;
            const isBuyer = leadProfile?.role?.toLowerCase().includes('buyer');
            
            if (isBuyer) return; // Skip buyers in the Leads tab

            conversationKeys.add(key);
            const customerMessages = messagesData.filter((m: any) => {
              const mLead = m.leads_veiculos;
              const mKey = mLead?.email || mLead?.telefone || m.lead_id;
              return mKey === key;
            });
            const unreadCount = customerMessages.filter((m: any) => !m.lida && m.remetente === 'cliente').length;
            
            const isOnline = leadProfile ? (new Date().getTime() - new Date(leadProfile.last_login).getTime()) < 300000 : false;

            groupedConversations.push({
              conversation_key: key,
              customer_email: email,
              lead_id: msg.lead_id,
              lead_ids: [...new Set(customerMessages.map((m: any) => m.lead_id))],
              last_message: msg.conteudo,
              last_time: msg.created_at,
              last_message_at: msg.created_at,
              lead: lead,
              status: lead.status || (lead.is_frio ? 'frio' : 'novo'),
              unread: unreadCount,
              is_unanswered: msg.remetente === 'cliente',
              is_online: isOnline
            });
          }
        });
      }

      // Adicionar leads que não possuem mensagens (incluindo usuários sem formulário)
      if (allLeads) {
        allLeads.forEach((lead: any) => {
          const key = lead.email || lead.telefone || lead.id;
          if (key && !conversationKeys.has(key)) {
            // Check if this lead is a buyer
            const leadProfile = lead.email ? profileMap.get(lead.email) : null;
            const isBuyer = leadProfile?.role?.toLowerCase().includes('buyer') || lead.role?.toLowerCase().includes('buyer');
            
            if (isBuyer) return; // Skip buyers in the Leads tab

            conversationKeys.add(key);
            const isOnline = leadProfile ? (new Date().getTime() - new Date(leadProfile.last_login).getTime()) < 300000 : false;

            groupedConversations.push({
              conversation_key: key,
              customer_email: lead.email,
              lead_id: lead.id,
              lead_ids: [lead.id],
              last_message: lead.is_frio ? 'Usuário registrado (sem formulário)' : 'Nenhuma mensagem ainda',
              last_time: lead.created_at,
              last_message_at: lead.created_at,
              lead: lead,
              unread: 0,
              is_unanswered: false,
              is_online: isOnline
            });
          }
        });
      }

      console.log('Grouped conversations:', groupedConversations);

      // Sort conversations by last message time descending
      groupedConversations.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      let finalConversations = groupedConversations;
      
      if (userProfileRef.current && userProfileRef.current.role === 'user') {
        finalConversations = groupedConversations.filter(conv => conv.lead?.user_id === userProfileRef.current.id);
      }

      setConversations(finalConversations);
      setDbAssets(assetsData || []);
      setBanks(banksData || []);
      setRepairCosts(repairData || []);
      setFipeRules(fipeData || []);
      
      // Sort API keys: ok > no_credit/rate_limited > disconnected
      const sortedApiKeys = (apiKeysData || []).sort((a: any, b: any) => {
        const statusOrder: Record<string, number> = { 'ok': 0, 'no_credit': 1, 'rate_limited': 1, 'disconnected': 2 };
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return a.provider.localeCompare(b.provider);
      });
      
      setApiKeys(sortedApiKeys);
      setProviders(providersData || []);
      setUsers(profilesData || []);
      setInterestedBuyers(buyersDataMerged);
      setBuyerAuthorizations(authsData || []);
      setSentLeads(sentData || []);
      
      // Already declared above
      // const internalMessagesData = internalMessagesResult.data;
      // const settingsData = settingsResult.data;

      // Group internal messages and populate internalConversations
      const groupedInternal: any[] = [];
      const internalIds = new Set();
      
      // First, add people we have messages with
      if (internalMessagesData && userProfileRef.current) {
        internalMessagesData.forEach((msg: any) => {
          let otherId = msg.sender_id === userProfileRef.current.id ? msg.receiver_id : msg.sender_id;
          
          // Caso especial: mensagem enviada para ninguém (receiver_id null) por outra pessoa
          if (!otherId && msg.sender_id !== userProfileRef.current.id) {
            otherId = msg.sender_id;
          }

          if (otherId && !internalIds.has(otherId)) {
            const otherProfile = (profilesData || []).find((u: any) => u.id === otherId);
            
            // Only show in "Equipe" if they are team members (admin, user, seller)
            if (otherProfile && (otherProfile.role === 'admin' || otherProfile.role === 'user' || otherProfile.role === 'seller')) {
              // Non-admin users shouldn't see other buyers in "Equipe"
              if (otherProfile.role?.includes('buyer')) return;
              
              internalIds.add(otherId);
              const readCol = internalMessagesData && internalMessagesData.length > 0 && 'is_read' in internalMessagesData[0] ? 'is_read' : 'read';
              const unreadCount = internalMessagesData.filter((m: any) => 
                m.sender_id === otherId && m.receiver_id === userProfileRef.current.id && !m[readCol]
              ).length;
              
              const isOnline = otherProfile.last_login ? (new Date().getTime() - new Date(otherProfile.last_login).getTime()) < 300000 : false;

              groupedInternal.push({
                id: otherId,
                profile: otherProfile,
                last_message: msg.content,
                last_time: msg.created_at,
                unread: unreadCount,
                is_online: isOnline
              });
            }
          }
        });
      }

      // Then, add other team members (admin/vendedor) who haven't messaged yet
      if (profilesData && userProfileRef.current) {
        profilesData.forEach((p: any) => {
          if (p.id !== userProfileRef.current.id && (p.role === 'admin' || p.role === 'user' || p.role === 'seller') && !internalIds.has(p.id)) {
            // Exclude buyers
            if (p.role?.includes('buyer')) return;
            
            internalIds.add(p.id);
            const isOnline = p.last_login ? (new Date().getTime() - new Date(p.last_login).getTime()) < 300000 : false;
            
            groupedInternal.push({
              id: p.id,
              profile: p,
              last_message: 'Nenhuma mensagem ainda',
              last_time: p.created_at,
              unread: 0,
              is_online: isOnline
            });
          }
        });
      }
      console.log("Conversas internas agrupadas:", groupedInternal);
      // Sort internal conversations by last message time descending
      groupedInternal.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
      setInternalConversations(groupedInternal);

      // Group buyer conversations
      const groupedCompradores: any[] = [];
      const compradorIds = new Set();

      if (internalMessagesData && userProfileRef.current) {
        internalMessagesData.forEach((msg: any) => {
          let otherId = msg.sender_id === userProfileRef.current.id ? msg.receiver_id : msg.sender_id;
          
          // Caso especial: mensagem enviada para ninguém (receiver_id null) por outra pessoa
          if (!otherId && msg.sender_id !== userProfileRef.current.id) {
            otherId = msg.sender_id;
          }

          if (otherId && !compradorIds.has(otherId) && !internalIds.has(otherId)) {
            const otherProfile = (profilesData || []).find((u: any) => u.id === otherId);
            const isOtherBuyer = otherProfile?.role?.includes('buyer');
            
            // Only show in "Compradores" if the OTHER person is a buyer
            // This prevents Admins/Sellers from appearing in this tab for the Buyer
            if (otherProfile && isOtherBuyer) {
              compradorIds.add(otherId);
              const readCol = 'read';
              const unreadCount = internalMessagesData.filter((m: any) => 
                m.sender_id === otherId && m.receiver_id === userProfileRef.current.id && !m[readCol]
              ).length;
              const isOnline = otherProfile.last_login ? (new Date().getTime() - new Date(otherProfile.last_login).getTime()) < 300000 : false;
              groupedCompradores.push({
                id: otherId,
                profile: otherProfile,
                last_message: msg.content,
                last_time: msg.created_at,
                last_message_at: msg.created_at,
                unread: unreadCount,
                is_online: isOnline
              });
            }
          }
        });
      }

      // Add other buyers who haven't messaged yet
      if (profilesData && userProfileRef.current) {
        profilesData.forEach((p: any) => {
          if (p.id !== userProfileRef.current.id && p.role?.toLowerCase().includes('buyer') && !compradorIds.has(p.id)) {
            compradorIds.add(p.id);
            const isOnline = p.last_login ? (new Date().getTime() - new Date(p.last_login).getTime()) < 300000 : false;
            groupedCompradores.push({
              id: p.id,
              profile: p,
              last_message: 'Nenhuma mensagem ainda',
              last_time: p.created_at,
              last_message_at: p.created_at,
              unread: 0,
              is_online: isOnline
            });
          }
        });
      }
      
      // Sort by last_message_at
      groupedCompradores.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setCompradoresConversations(groupedCompradores);
      
      // Atualiza o lead selecionado se houver um
      if (selectedLeadRef.current) {
        const updatedLead = (leadsData || []).find((l: any) => l.id === selectedLeadRef.current.id);
        if (updatedLead) {
          setSelectedLead(updatedLead);
        }
      }

      // Atualiza a conversa selecionada se houver uma
      if (selectedConversationRef.current) {
        const updatedConv = groupedConversations.find(c => c.lead_id === selectedConversationRef.current.lead_id);
        if (updatedConv) {
          setSelectedConversation(updatedConv);
          // Refetch chat messages to guarantee the UI is in sync with REAL-TIME incoming messages
          if (updatedConv.lead_ids && updatedConv.lead_ids.length > 0) {
            fetchChatMessages(updatedConv.lead_ids).catch(e => console.error(e));
          }
        }
      }

      // Fetch settings from Supabase
      // Already fetched in parallel above, skipped redundant fetch
      
      if (settingsData) {
        const aiPromptSetting = settingsData.find((s: any) => s.key === 'AI_SYSTEM_PROMPT');
        if (aiPromptSetting) {
          setAiSystemPrompt(aiPromptSetting.value);
        }
        
        const aiMemorySetting = settingsData.find((s: any) => s.key === 'AI_MEMORY');
        if (aiMemorySetting) {
          setAiMemory(aiMemorySetting.value);
        }

        const aiCrmPromptSetting = settingsData.find((s: any) => s.key === 'AI_CRM_PROMPT');
        if (aiCrmPromptSetting) {
          setAiCrmPrompt(aiCrmPromptSetting.value);
        }

        const aiCrmMemorySetting = settingsData.find((s: any) => s.key === 'AI_CRM_MEMORY');
        if (aiCrmMemorySetting) {
          setAiCrmMemory(aiCrmMemorySetting.value);
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

        const aiCrmEnabledSetting = settingsData.find((s: any) => s.key === 'AI_CRM_ENABLED');
        if (aiCrmEnabledSetting) {
          setIsGlobalAiEnabled(aiCrmEnabledSetting.value === 'true');
        }

        const aiBuyerEnabledSetting = settingsData.find((s: any) => s.key === 'AI_BUYER_ENABLED');
        if (aiBuyerEnabledSetting) {
          setIsBuyerAiEnabled(aiBuyerEnabledSetting.value === 'true');
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

        const responseModeSetting = settingsData.find((s: any) => s.key === 'RESPONSE_MODE');
        if (responseModeSetting) setResponseMode(responseModeSetting.value as 'chat' | 'webhook');

        const webhookUrlSetting = settingsData.find((s: any) => s.key === 'WEBHOOK_URL');
        if (webhookUrlSetting) setWebhookUrl(webhookUrlSetting.value);

        const chatAvatarSetting = settingsData.find((s: any) => s.key === 'CHAT_AVATAR_URL');
        if (chatAvatarSetting) setChatAvatarUrl(chatAvatarSetting.value);

        const chatAttendantAvatarSetting = settingsData.find((s: any) => s.key === 'CHAT_ATTENDANT_AVATAR');
        if (chatAttendantAvatarSetting) setChatAttendantAvatar(chatAttendantAvatarSetting.value);

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
        addLog('Busca de dados concluída com sucesso.', 'info');
      } catch (err) {
        console.error('Erro em fetchData:', err);
        addLog('Erro crítico ao buscar dados', 'error', err);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (force) {
      await runFetch();
    } else {
      if (fetchDataDebounceRef.current) clearTimeout(fetchDataDebounceRef.current);
      fetchDataDebounceRef.current = setTimeout(runFetch, 1000);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchData();

      // Forçar teste de APIs não-OK ao carregar o dashboard
      const checkApiHealth = async () => {
        try {
          const { AIService } = await import('../services/aiService');
          // No carregamento inicial, apenas as que não estão OK são testadas para economizar crédito
          await AIService.testConnections(false, true);
        } catch (e) {
          console.error('[AdminDashboard] Erro no health check inicial:', e);
        }
      };
      checkApiHealth();

      // Real-time subscription for settings to keep AI toggle and other configs in sync
      const settingsSubscription = supabase
        .channel('admin_settings_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'settings' 
        }, (payload) => {
          if (!isSavingSettingsRef.current && payload.new && (payload.new as any).key) {
            const { key, value } = payload.new as any;
            if (key === 'AI_CRM_ENABLED') {
              console.log('[AdminDashboard] AI Global status updated via Realtime:', value);
              setIsGlobalAiEnabled(value === 'true');
            }
            if (key === 'AI_BUYER_ENABLED') {
              setIsBuyerAiEnabled(value === 'true');
            }
            if (key === 'AUTO_PROPOSAL_ENABLED') {
              setAutoProposalEnabled(value === 'true');
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(settingsSubscription);
      };
    }
  }, [userProfile]);

  // Initialize proposal calculator when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.detalhes_proposta) {
        setProposalCalculator(selectedLead.detalhes_proposta);
      } else {
        const initialCalc = getProposalResult(selectedLead);
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

  const selectedInternalChatRef = useRef(selectedInternalChat);
  useEffect(() => {
    selectedInternalChatRef.current = selectedInternalChat;
  }, [selectedInternalChat]);

  const selectedCompradorChatRef = useRef(selectedCompradorChat);
  useEffect(() => {
    selectedCompradorChatRef.current = selectedCompradorChat;
  }, [selectedCompradorChat]);

  const userProfileRef = useRef(userProfile);
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("[AdminDashboard] Falha ao tocar som:", e));
    } catch (e) {
      console.error("[AdminDashboard] Erro ao carregar áudio:", e);
    }
  };

  useEffect(() => {
    const messagesSubscription = supabase
      .channel('admin_messages_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens' 
      }, async (payload) => {
        console.log("[AdminDashboard] Realtime message received:", payload.new);
        addLog(`Nova mensagem recebida: ${payload.new.remetente}`, 'debug', payload.new);
        
        const newMsg = payload.new;
        const currentConv = selectedConversationRef.current;
        
        // 1. Verificar se a mensagem pertence à conversa atual aberta (por Lead IDs ou Email)
        const isCurrentConversation = 
          currentConv?.lead_ids?.includes(newMsg.lead_id) || 
          currentConv?.lead_id === newMsg.lead_id ||
          (currentConv?.customer_email && newMsg.customer_email === currentConv.customer_email);
                                     
        if (isCurrentConversation) {
          console.log("[AdminDashboard] Atualizando mensagens do chat (Realtime)");
          setChatMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // Marcar como lida se for do cliente e o chat estiver aberto
          if (newMsg.remetente === 'cliente') {
            try {
              await supabase.from('mensagens').update({ lida: true }).eq('id', newMsg.id);
            } catch (err) {}
          }
        }

        // 2. Ações específicas para mensagens do CLIENTE
        if (newMsg.remetente === 'cliente') {
          playNotificationSound();
          
          // Automação de Status
          try {
            const { data: leadData } = await supabase
              .from('leads_veiculos')
              .select('status')
              .eq('id', newMsg.lead_id)
              .single();

            if (leadData && (leadData.status === 'novo' || leadData.status === 'proposta_enviada')) {
              await supabase.from('leads_veiculos').update({ status: 'em_contato' }).eq('id', newMsg.lead_id);
              if (selectedLeadRef.current?.id === newMsg.lead_id) {
                setSelectedLead(prev => prev ? { ...prev, status: 'em_contato' } : null);
              }
            }
          } catch (err) {}
        }

        // 3. ATUALIZAÇÃO DA SIDEBAR (LISTA DE CONVERSAS)
        setConversations(prev => {
          const leadKey = newMsg.lead_id;
          const existingIndex = prev.findIndex(c => c.lead_ids?.includes(leadKey) || c.lead_id === leadKey);
          
          if (existingIndex !== -1) {
            const updated = [...prev];
            const conv = { ...updated[existingIndex] };
            conv.last_message = newMsg.conteudo;
            conv.last_message_at = newMsg.created_at;
            
            if (newMsg.remetente === 'cliente' && !isCurrentConversation) {
              conv.unread = (conv.unread || 0) + 1;
            }
            conv.is_unanswered = newMsg.remetente === 'cliente';
            
            // Move para o topo
            updated.splice(existingIndex, 1);
            updated.unshift(conv);
            return updated;
          } else {
            // Se é um lead novo não listado, faz fetch em 1s
            setTimeout(fetchData, 1000);
            return prev;
          }
        });
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'mensagens' 
      }, (payload) => {
        // Atualiza status de leitura (lida) em tempo real no dashboard
        const newMsg = payload.new as any;
        if (newMsg.lida) {
          const leadId = newMsg.lead_id;
          
          // Atualiza mensagens no chat aberto
          const currentConv = selectedConversationRef.current;
          const isCurrent = 
            currentConv?.lead_ids?.includes(leadId) || 
            currentConv?.lead_id === leadId ||
            (currentConv?.customer_email && newMsg.customer_email === currentConv.customer_email);
                            
          if (isCurrent) {
             setChatMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, lida: true } : m));
          }
          
          // Atualiza contador no sidebar se necessário
          setConversations(prev => prev.map(c => {
             if (c.lead_id === leadId || c.lead_ids?.includes(leadId)) {
                return { ...c, unread: Math.max(0, (c.unread || 0) - (isCurrent ? 0 : 1)) };
             }
             return c;
          }));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads_veiculos'
      }, (payload) => {
        console.log("[AdminDashboard] Lead changed (realtime):", payload.eventType, payload.new);
        if (payload.eventType === 'INSERT') {
          console.log("[AdminDashboard] 🔔 NOVO LEAD DETECTADO! Disparando alerta sonoro e recarregando...");
          playNotificationSound();
          // Pequeno delay para garantir que o banco persistiu tudo antes do fetch
          setTimeout(fetchData, 1000);
        } else {
          fetchData();
        }
      })
      .subscribe();

    // Subscription para mensagens internas
    const internalSubscription = supabase
      .channel('admin_internal_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages' 
      }, async (payload) => {
        console.log("[AdminDashboard] Nova mensagem interna recebida:", payload.new);
        addLog(`Nova mensagem interna: ${payload.new.sender_id}`, 'debug', payload.new);
        
        // Tocar som de notificação
        playNotificationSound();
        
        // Atualiza chat interno se estiver aberto para este usuário
        if (selectedInternalChatRef.current === payload.new.sender_id || 
            selectedInternalChatRef.current === payload.new.receiver_id) {
          console.log("[AdminDashboard] Updating internal chat messages state");
          setInternalChatMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }

        // Atualiza chat de comprador se estiver aberto para este usuário
        if (selectedCompradorChatRef.current === payload.new.sender_id || 
            selectedCompradorChatRef.current === payload.new.receiver_id) {
          console.log("[AdminDashboard] Updating comprador chat messages state");
          setCompradorChatMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
        
        // Otimizado: Atualiza listas internas localmente sem fetch completo
        const currentUserId = userProfileRef.current?.id;
        const otherId = payload.new.sender_id === currentUserId ? payload.new.receiver_id : payload.new.sender_id;
        
        if (otherId) {
          // Tenta atualizar Equipe
          setInternalConversations(prev => {
            const idx = prev.findIndex(c => c.id === otherId);
            if (idx !== -1) {
              const updated = [...prev];
              const conv = { ...updated[idx] };
              conv.last_message = payload.new.content;
              conv.last_time = payload.new.created_at;
              if (payload.new.sender_id !== currentUserId && selectedInternalChatRef.current !== otherId) {
                conv.unread = (conv.unread || 0) + 1;
              }
              const item = updated.splice(idx, 1)[0];
              updated.unshift(conv);
              return updated;
            }
            return prev;
          });
          
          // Tenta atualizar Compradores
          setCompradoresConversations(prev => {
            const idx = prev.findIndex(c => c.id === otherId);
            if (idx !== -1) {
              const updated = [...prev];
              const conv = { ...updated[idx] };
              conv.last_message = payload.new.content;
              conv.last_time = payload.new.created_at;
              if (payload.new.sender_id !== currentUserId && selectedCompradorChatRef.current !== otherId) {
                conv.unread = (conv.unread || 0) + 1;
              }
              const item = updated.splice(idx, 1)[0];
              updated.unshift(conv);
              return updated;
            }
            return prev;
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'internal_messages'
      }, (payload) => {
        const newMsg = payload.new as any;
        const readCol = 'is_read' in newMsg ? 'is_read' : 'read';
        if (newMsg[readCol]) {
           // Atualiza chat aberto
           if (selectedInternalChatRef.current === newMsg.sender_id || selectedInternalChatRef.current === newMsg.receiver_id) {
             setInternalChatMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, [readCol]: true } : m));
           }
           if (selectedCompradorChatRef.current === newMsg.sender_id || selectedCompradorChatRef.current === newMsg.receiver_id) {
             setCompradorChatMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, [readCol]: true } : m));
           }
           // Zera unread localmente
           const otherId = newMsg.sender_id;
           setInternalConversations(prev => prev.map(c => c.id === otherId ? { ...c, unread: 0 } : c));
           setCompradoresConversations(prev => prev.map(c => c.id === otherId ? { ...c, unread: 0 } : c));
        }
      })
      .subscribe();

    // Subscription para perfis (online status e novos registros)
    const profilesSubscription = supabase
      .channel('admin_profiles_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log("Perfil alterado (realtime):", payload.eventType, payload.new);
        
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [...prev, payload.new]);
          // Se for um novo perfil, pode ser um novo lead frio
          setTimeout(fetchData, 1000);
          return;
        }

        const newProfile = payload.new as any;
        setUsers(prev => prev.map(u => u.id === newProfile.id ? { ...u, ...newProfile } : u));
        
        // Se houver mudança significativa (role ou nome), força refresh completo
        const profileInState = users.find(u => u.id === newProfile.id);
        if (profileInState) {
          if (profileInState.role !== newProfile.role || profileInState.full_name !== newProfile.full_name) {
            fetchData();
          } else {
            // Apenas atualiza o status online na lista de conversas sem fetch completo
            const isOnline = (new Date().getTime() - new Date(newProfile.last_login).getTime()) < 300000;
            setConversations(prev => prev.map(c => {
               if (c.customer_email === newProfile.email) {
                  return { ...c, is_online: isOnline };
               }
               return c;
            }));
            
            setInternalConversations(prev => prev.map(c => {
               if (c.id === newProfile.id) {
                  return { ...c, is_online: isOnline, profile: { ...c.profile, ...newProfile } };
               }
               return c;
            }));
            
            setCompradoresConversations(prev => prev.map(c => {
               if (c.id === newProfile.id) {
                  return { ...c, is_online: isOnline, profile: { ...c.profile, ...newProfile } };
               }
               return c;
            }));
          }
        }
      })
      .subscribe();

    // Subscription para chaves de API
    const apiKeysSubscription = supabase
      .channel('admin_api_keys_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'api_keys' 
      }, (payload) => {
        console.log("API Keys atualizada (realtime):", payload.new);
        setApiKeys(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new];
          if (payload.eventType === 'UPDATE') return prev.map(k => k.id === payload.new.id ? payload.new : k);
          if (payload.eventType === 'DELETE') return prev.filter(k => k.id === payload.old.id);
          return prev;
        });
        // Sincroniza o cache local do AIService
        import('../services/aiService').then(({ AIService }) => {
          AIService.getActiveKeys(true);
        });
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      internalSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      apiKeysSubscription.unsubscribe();
    };
  }, []);

  const fetchChatMessages = async (leadIds: string[]) => {
    console.log('Fetching messages for leads:', leadIds);
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .in('lead_id', leadIds)
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
      .in('lead_id', leadIds)
      .eq('remetente', 'cliente')
      .eq('lida', false);
      
    // Atualizar contador local
    setConversations(prev => prev.map(c => 
      leadIds.includes(c.lead_id) ? { ...c, unread: 0, is_unanswered: false } : c
    ));
  };

  const fetchInternalMessages = async (otherId: string) => {
    if (!userProfile) return;
    console.log('Fetching internal messages with:', otherId);
    
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userProfile.id}),and(sender_id.eq.${otherId},receiver_id.is.null)`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching internal messages:', error);
    } else {
      setInternalChatMessages(data || []);
      
      // Mark as read
      const readCol = data && data.length > 0 && 'is_read' in data[0] ? 'is_read' : 'read';
      await supabase
        .from('internal_messages')
        .update({ [readCol]: true })
        .eq('sender_id', otherId)
        .eq('receiver_id', userProfile.id)
        .eq(readCol, false);
        
      // Update unread count in local state
      setInternalConversations(prev => prev.map(c => 
        c.id === otherId ? { ...c, unread: 0 } : c
      ));
    }
  };

  const fetchCompradorMessages = async (otherId: string) => {
    if (!userProfile) return;
    console.log('Fetching comprador messages with:', otherId);
    
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userProfile.id}),and(sender_id.eq.${otherId},receiver_id.is.null)`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comprador messages:', error);
    } else {
      setCompradorChatMessages(data || []);
      
      // Mark as read
      const readCol = data && data.length > 0 && 'is_read' in data[0] ? 'is_read' : 'read';
      await supabase
        .from('internal_messages')
        .update({ [readCol]: true })
        .eq('sender_id', otherId)
        .eq('receiver_id', userProfile.id)
        .eq(readCol, false);
        
      // Update unread count in local state
      setCompradoresConversations(prev => prev.map(c => 
        c.id === otherId ? { ...c, unread: 0 } : c
      ));
    }
  };

  useEffect(() => {
    const hasExpired = leads.some(l => l.status === 'reservado_expirado');
    setShowExpiredReservationAlert(hasExpired);
  }, [leads]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUser(data.user);
        addLog('Usuário autenticado: ' + data.user.email, 'info');
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          addLog('Perfil carregado: ' + profile.role, 'info');
        } else {
          console.error('Perfil não encontrado:', profileError);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  // Set initial tab based on role on login
  useEffect(() => {
    if (!userProfile?.role) return;

    if (userProfile.role === 'buyer' || userProfile.role === 'buyer_premium' || userProfile.role === 'buyer_master') {
      setActiveTab('crm_chat');
    } else if (userProfile.role === 'admin' || userProfile.role === 'user' || userProfile.role === 'seller') {
      setActiveTab('leads');
    }
  }, [userProfile?.role]);

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

  const handleCloneVehicle = async (sourceLead: any, buyerId?: string) => {
    if (!sourceLead || isCloning) return;
    
    setIsCloning(true);
    try {
      // 1. Gerar novo código de veículo
      const newCode = `CL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // 2. Preparar dados do novo lead (clonado)
      const { id, created_at, updated_at, vehicle_code, ...clonedData } = sourceLead;
      
      const newLead = {
        ...clonedData,
        vehicle_code: newCode,
        status: 'novo',
        created_at: new Date().toISOString(),
        detalhes_proposta: {
          ...(sourceLead.detalhes_proposta || {}),
          cloned_from: sourceLead.id,
          cloned_at: new Date().toISOString()
        }
      };

      // 3. Inserir no banco
      const { data, error } = await supabase
        .from('leads_veiculos')
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;

      // 4. Atualizar estado local
      setLeads(prev => [data, ...prev]);
      setSelectedLead(data);
      
      // 5. Se estivermos em uma conversa de Mensagens (Legacy/Leads Tab)
      if (selectedConversation) {
        const updatedLeadIds = [...new Set([...selectedConversation.lead_ids, data.id])];
        
        await supabase.from('mensagens').insert({
          lead_id: data.id,
          remetente: 'admin',
          conteudo: `🔄 Veículo clonado para nova negociação: ${data.marca} ${data.modelo} (#${data.vehicle_code})`
        });

        setConversations(prev => prev.map(c => 
          c.conversation_key === selectedConversation.conversation_key 
            ? { ...c, lead_ids: updatedLeadIds } 
            : c
        ));
        
        setSelectedConversation(prev => prev ? { ...prev, lead_ids: updatedLeadIds } : null);
      }

      // 6. Se for via CRM Chat (internal_messages)
      if (buyerId || (activeTab === 'crm_chat' && sourceLead?.user_id)) {
        const targetBuyerId = buyerId || sourceLead?.user_id;
        if (targetBuyerId) {
          await supabase.from('internal_messages').insert({
            sender_id: currentUser?.id,
            receiver_id: targetBuyerId,
            content: `🔄 Veículo clonado para nova negociação: ${data.marca} ${data.modelo} (#${data.vehicle_code})`,
            is_read: false
          });
        }
      }

      setToast({ message: `Veículo clonado com sucesso! Novo código: ${newCode}`, type: 'success' });
    } catch (err: any) {
      console.error('Erro ao clonar veículo:', err);
      setToast({ message: `Erro ao clonar veículo: ${err.message}`, type: 'error' });
    } finally {
      setIsCloning(false);
      setShowVehicleSelectionModal(false);
    }
  };

  const handleSendMessage = async () => {
    if (!adminMessage.trim() || !userProfile) return;

    if (messageTab === 'internal') {
      if (!selectedInternalChat) return;
      handleSendInternalMessage();
      return;
    }

    if (messageTab === 'buyers') {
      if (!selectedCompradorChat) return;
      handleSendCompradorMessage();
      return;
    }

    if (messageTab !== 'leads') {
      console.log("Ignorando envio de mensagem: aba não é 'leads'.");
      return;
    }

    if (!selectedConversation || !selectedConversation.lead_ids || selectedConversation.lead_ids.length === 0) {
      setToast({ message: "Erro: Nenhum lead_id encontrado para esta conversa.", type: 'error' });
      return;
    }

    const messageContent = adminMessage.trim();
    setAdminMessage('');
    setIsSendingMessage(true);

    // Validate lead existence
    console.log("Sending message for lead_id:", selectedConversation.lead_ids[0]);
    console.log("Selected conversation:", selectedConversation);
    console.log("Leads in state:", leads.map(l => l.id));
    
    // Check if lead is 'frio'
    if (selectedConversation.lead?.is_frio) {
        console.log("Lead é frio, verificando existência em leads_veiculos...");
        const { data: existingLead } = await supabase
            .from('leads_veiculos')
            .select('id')
            .eq('id', selectedConversation.lead_ids[0])
            .maybeSingle();
            
        if (!existingLead) {
            console.log("Lead frio não encontrado em leads_veiculos, criando registro...");
            const { error: insertError } = await supabase
                .from('leads_veiculos')
                .insert({
                    id: selectedConversation.lead_ids[0],
                    email: selectedConversation.lead?.email,
                    cliente_nome: selectedConversation.lead?.nome || selectedConversation.lead?.cliente_nome || 'Cliente',
                    telefone: selectedConversation.lead?.telefone || '00000000000',
                    status: 'novo'
                });
            if (insertError) {
                console.error("Erro ao criar lead frio:", insertError);
                addLog('Erro ao criar lead frio: ' + insertError.message, 'error', insertError);
                setToast({ message: "Erro ao preparar lead para mensagem: " + insertError.message, type: 'error' });
                setIsSendingMessage(false);
                return;
            }
        }
    }

    const leadExists = leads.some(l => l.id === selectedConversation.lead_ids[0]);
    if (!leadExists) {
        console.error("Lead não encontrado no sistema:", selectedConversation.lead_ids[0]);
        setToast({ message: "Erro: Lead não encontrado no sistema.", type: 'error' });
        setIsSendingMessage(false);
        return;
    }

    const newMessage = {
      id: `temp-${Date.now()}`,
      lead_id: selectedConversation.lead_ids[0],
      conteudo: messageContent,
      remetente: 'admin',
      created_at: new Date().toISOString(),
      lida: true
    };

    // Optimistic update
    setChatMessages(prev => [...prev, newMessage]);

    try {
      const { error } = await supabase
        .from('mensagens')
        .insert({
          lead_id: selectedConversation.lead_ids[0],
          remetente: 'admin',
          conteudo: messageContent
        });

      if (error) throw error;

      // Aprendizado automático com a resposta do admin
      if (isGlobalAiEnabledRef.current) {
        handleAILearning({
          remetente: 'admin',
          conteudo: messageContent,
          lead_id: selectedConversation.lead_ids[0]
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setToast({ message: `Erro ao enviar mensagem: ${error.message || JSON.stringify(error)}`, type: 'error' });
      // Rollback
      setChatMessages(prev => prev.filter(m => m !== newMessage));
      setAdminMessage(messageContent);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendInternalMessage = async () => {
    if (!adminMessage.trim() || !selectedInternalChat || !userProfile) return;

    const messageContent = adminMessage.trim();
    setAdminMessage('');
    setIsSendingMessage(true);

    const newMessage = {
      id: `temp-${Date.now()}`,
      sender_id: userProfile.id,
      receiver_id: selectedInternalChat,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Optimistic update
    setInternalChatMessages(prev => [...prev, newMessage]);

    try {
      console.log("Enviando mensagem interna:", newMessage);
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: userProfile.id,
          receiver_id: selectedInternalChat,
          content: messageContent
        });

      if (error) {
        console.error('Erro ao enviar mensagem interna:', error);
        throw error;
      }
      console.log("Mensagem enviada com sucesso");
    } catch (error) {
      console.error('Error sending internal message:', error);
      // Rollback
      setInternalChatMessages(prev => prev.filter(m => m !== newMessage));
      setAdminMessage(messageContent);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendCompradorMessage = async () => {
    if (!adminMessage.trim() || !selectedCompradorChat || !userProfile) return;

    const messageContent = adminMessage.trim();
    setAdminMessage('');
    setIsSendingMessage(true);

    const newMessage = {
      id: `temp-${Date.now()}`,
      sender_id: userProfile.id,
      receiver_id: selectedCompradorChat,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Optimistic update
    setCompradorChatMessages(prev => [...prev, newMessage]);

    try {
      console.log("Enviando mensagem para comprador:", newMessage);
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: userProfile.id,
          receiver_id: selectedCompradorChat,
          content: messageContent
        });

      if (error) {
        console.error('Erro ao enviar mensagem para comprador:', error);
        throw error;
      }
      console.log("Mensagem enviada com sucesso");
    } catch (error) {
      console.error('Error sending comprador message:', error);
      // Rollback
      setCompradorChatMessages(prev => prev.filter(m => m !== newMessage));
      setAdminMessage(messageContent);
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
        if (!selectedLead || !selectedLead.id) {
            console.error("Erro ao enviar mensagem: Lead inválido");
            alert("Erro ao enviar mensagem: Lead inválido");
            return;
        }
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
        await fetchChatMessages([selectedLead.id]);
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
        if (!selectedLead || !selectedLead.id) {
            console.error("Erro ao enviar mensagem: Lead inválido");
            alert("Erro ao enviar mensagem: Lead inválido");
            return;
        }
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
        
        alert('Proposta enviada com sucesso via chat!');
        await fetchChatMessages([selectedLead.id]);
        await fetchData();
      } catch (err: any) {
        console.error(err);
        alert('Erro ao enviar proposta: ' + err.message);
      }
    }
  };

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      if (leadsScrollRef.current) {
        leadsScrollRef.current.scrollTop = leadsScrollRef.current.scrollHeight;
      }
    };
    scrollToBottom();
    // Also scroll after a short delay to account for rendering/images
    setTimeout(scrollToBottom, 100);
  }, [chatMessages, selectedConversation, internalChatMessages]);

  const handleLearnFromChat = async () => {
    const isLeads = messageTab === 'leads';
    const isBuyers = messageTab === 'buyers';
    const messages = isLeads ? chatMessages : (isBuyers ? compradorChatMessages : internalChatMessages);
    const currentMemory = isLeads ? aiMemory : aiCrmMemory;
    const memoryKey = isLeads ? 'AI_MEMORY' : 'AI_CRM_MEMORY';
    
    if (isLeads && (!selectedConversation || messages.length === 0)) return;
    if (isBuyers && (!selectedCompradorChat || messages.length === 0)) return;
    if (!isLeads && !isBuyers && (!selectedInternalChat || messages.length === 0)) return;

    try {
      const chatHistory = messages.map(m => {
        if (isLeads) {
          return `${m.remetente === 'admin' ? 'Humano' : 'Cliente'}: ${m.conteudo}`;
        } else {
          return `${m.sender_id === currentUser?.id ? 'Vendedor' : 'Comprador'}: ${m.content}`;
        }
      }).join('\n');
      
      const prompt = `Analise a conversa abaixo e extraia apenas os gatilhos de venda, informações técnicas do veículo e condições comerciais mencionadas. Ignore saudações e conversas genéricas.
        
        Conversa:
        ${chatHistory}`;
      
      const systemInstruction = isLeads 
        ? "Você é um assistente especializado em extrair informações estratégicas de vendas de veículos de conversas de chat com leads. Retorne apenas os pontos relevantes encontrados de forma concisa."
        : "Você é um assistente especializado em extrair informações estratégicas de negociações de veículos entre vendedores e compradores no CRM. Retorne apenas os pontos relevantes encontrados de forma concisa.";

      const response = await AIService.generateContent(prompt, systemInstruction);
      
      const extractedInfo = response.text;
      if (!extractedInfo || extractedInfo.trim().length < 10) {
        alert('Nenhuma informação relevante de venda encontrada nesta conversa.');
        return;
      }

      const newMemory = `${currentMemory}\n\n--- Aprendizado de Gatilhos (${new Date().toLocaleDateString()}) ---\n${extractedInfo}\n`;
      
      const { error } = await supabase.from('settings').upsert({ key: memoryKey, value: newMemory }, { onConflict: 'key' });
      if (error) throw error;
      
      if (isLeads) {
        setAiMemory(newMemory);
      } else {
        setAiCrmMemory(newMemory);
      }
      setToast({ message: 'A IA extraiu e aprendeu novos gatilhos desta conversa!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Erro ao atualizar memória da IA.', type: 'error' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Marca', 'Modelo', 'Ano', 'KM', 'Preço', 'Cliente', 'WhatsApp', 'Email', 'Status'];
    const rows = leads.map(l => [
      l.vehicle_code,
      getDayString(l.created_at),
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

  const handleAILearning = async (message: any) => {
    if (!isGlobalAiEnabledRef.current) return;

    try {
      const role = message.remetente === 'admin' ? 'Atendente' : 'Cliente';
      const prompt = `Analise a nova mensagem do ${role} e extraia informações relevantes para a memória da IA (preferências do cliente, urgência, detalhes técnicos do veículo, condições de negociação, etc).
        
        Mensagem: ${message.conteudo}`;
      
      const systemInstruction = "Você é um assistente que monitora conversas de compra e venda de veículos para extrair conhecimento estratégico. Retorne apenas os pontos novos e relevantes de forma ultra-concisa. Se não houver nada relevante, retorne 'NADA'.";

      const response = await AIService.generateContent(prompt, systemInstruction);
      
      const extractedInfo = response.text;
      if (extractedInfo && extractedInfo.trim().toUpperCase() !== 'NADA' && extractedInfo.trim().length > 5) {
        const newMemory = `${aiMemoryRef.current}\n[${new Date().toLocaleString()}] ${extractedInfo}\n`;
        await supabase.from('settings').upsert({ key: 'AI_MEMORY', value: newMemory }, { onConflict: 'key' });
        setAiMemory(newMemory);
        aiMemoryRef.current = newMemory;
      }
    } catch (err) {
      console.error("Erro no aprendizado automático da IA:", err);
    }
  };

  const handleAIAutoResponse = async (incomingMessage: any) => {
    try {
      console.log("Starting AI Auto Response for message:", incomingMessage.id);
      
      // 1. Buscar o lead e as últimas mensagens para contexto
      const { data: lead } = await supabase
        .from('leads_veiculos')
        .select('*')
        .eq('id', incomingMessage.lead_id)
        .single();

      if (!lead) {
        console.error("Lead not found for AI response");
        return;
      }

      // Se a IA estiver desativada para este lead, não responde - removido para automação total
      // if (lead.detalhes_proposta?.ai_disabled) {
      //   console.log("AI is disabled for this lead, skipping auto-response");
      //   return;
      // }

      const { data: history } = await supabase
        .from('mensagens')
        .select('*')
        .eq('lead_id', incomingMessage.lead_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const chatHistory = history?.reverse().map(m => `${m.remetente === 'cliente' ? 'Cliente' : 'Atendente'}: ${m.conteudo}`).join('\n');
      
      const isProposalMode = lead.detalhes_proposta?.proposal_mode || proposalModeEnabled;

      const prompt = `
        DADOS DO VEÍCULO:
        Marca/Modelo: ${lead.marca} ${lead.modelo}
        Ano: ${lead.ano_modelo}
        Placa: ${lead.placa}
        Código do Lead: #${lead.vehicle_code}
        Valor FIPE: ${lead.valor_fipe}
        
        HISTÓRICO DA CONVERSA:
        ${chatHistory}
        
        CONFIGURAÇÕES ATUAIS:
        Modo Proposta: ${isProposalMode ? 'ATIVADO (Envie uma proposta formal ou tente fechar o valor)' : 'DESATIVADO (Apenas converse e tire dúvidas)'}
        Memória da IA: ${aiMemory}
        
        INSTRUÇÃO:
        Responda de forma curta, direta e profissional. Use gatilhos mentais de urgência e escassez.
        Se o Modo Proposta estiver ATIVADO, você deve ser mais agressivo na negociação para finalizar o lead quente.
        Responda apenas com o texto da mensagem.
      `;

      try {
        const result = await AIService.generateContent(
          prompt, 
          aiSystemPrompt || `Você é uma I.A. Sênior da AUTOCOMPRA, especialista em negociação e compra de veículos.

SEU OBJETIVO: Converter o cliente, fechar o negócio e agendar a vistoria.

REGRAS DE OURO:
1. NUNCA DEIXE NENHUMA PERGUNTA SEM RESPOSTA. Se o cliente fizer múltiplas perguntas, responda a TODAS detalhadamente.
2. NUNCA DÊ RESPOSTAS GENÉRICAS. Use a Memória e as Regras fornecidas para fundamentar sua resposta com profundidade técnica.
3. NUNCA DIGA "NÃO POSSO AJUDAR COM ISSO". Se não tiver a informação exata agora, diga que está consultando os dados e enquanto isso, faça perguntas pertinentes para avançar o processo, como confirmar o estado do veículo ou detalhes da dívida.
4. O OBJETIVO É A NEGOCIAÇÃO. Se o cliente mudar de foco, responda a nova dúvida, mas sempre traga a conversa de volta para o fechamento do negócio/vistoria.
5. SEJA PROATIVO E INVESTIGATIVO. Se algo não estiver claro na pergunta do cliente, faça perguntas de sondagem para entender melhor a situação.
6. MANTENHA A MALEABILIDADE. Não perca serviços, mantenha a conversa flutuando.`
[diff_block_end]
        );
        const aiResponse = result.text;

        if (aiResponse) {
          if (!lead || !lead.id) {
            console.error("Erro ao enviar mensagem da IA: Lead inválido");
            return;
          }
          const { error: sendError } = await supabase.from('mensagens').insert({
            lead_id: lead.id,
            remetente: 'admin',
            conteudo: aiResponse,
            tipo: 'texto',
            metadata: { ai_generated: true, proposal_mode: isProposalMode, provider: result.provider, model: result.model }
          });

          if (sendError) throw sendError;
          console.log("AI Auto Response sent successfully via", result.provider);
        }
      } catch (aiError: any) {
        console.error("AI Auto Response failed:", aiError);
      }

    } catch (err) {
      console.error('Erro na resposta automática da IA:', err);
      addLog('Erro na resposta automática da IA', 'error', err);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.full_name || !newUserForm.password) {
      alert('Preencha os campos obrigatórios (Nome, Email e Senha)');
      addLog('Tentativa de criação de usuário sem campos obrigatórios', 'info', newUserForm);
      return;
    }
    setIsCreatingUser(true);
    addLog('Iniciando criação de usuário completa (Auth + Profile)...', 'info', { email: newUserForm.email, role: newUserForm.role });
    console.log('Criando usuário:', newUserForm);

    try {
      // 1. Criar no Auth usando um cliente temporário para não deslogar o admin
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configurações do Supabase não encontradas no ambiente.');
      }

      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      addLog('Chamando signUp no Supabase Auth...', 'debug');
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            full_name: newUserForm.full_name,
            role: newUserForm.role
          }
        }
      });

      if (authError) {
        addLog('Erro no Supabase Auth signUp', 'error', authError);
        console.error('Auth Error:', authError);
        throw authError;
      }

      if (!authData.user) {
        addLog('Usuário não retornado pelo Auth', 'error');
        throw new Error('O Supabase não retornou o usuário criado. Verifique se o email já existe ou se há restrições de segurança.');
      }

      addLog('Usuário criado no Auth com sucesso. ID: ' + authData.user.id, 'info');

      // 2. Garantir que o perfil existe com os dados corretos
      addLog('Sincronizando perfil na tabela profiles...', 'debug');
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: newUserForm.full_name,
        email: newUserForm.email,
        role: newUserForm.role,
        phone: newUserForm.phone,
        last_login: new Date().toISOString()
      });

      if (profileError) {
        addLog('Erro ao sincronizar perfil', 'error', profileError);
        console.error('Profile Sync Error:', profileError);
        throw profileError;
      }
      
      addLog('Fluxo de criação finalizado com sucesso', 'info');
      alert('Usuário criado com sucesso! Ele já pode acessar o sistema com o email e senha definidos.');
      setShowAddUserModal(false);
      setNewUserForm({ full_name: '', email: '', password: '', role: 'user', phone: '' });
      refreshUsers();
    } catch (error: any) {
      console.error('Erro detalhado na criação de usuário:', error);
      addLog('Falha crítica na criação de usuário', 'error', { message: error.message, stack: error.stack });
      alert('Erro ao criar usuário: ' + (error.message || 'Erro desconhecido. Verifique o console (F12) para detalhes.'));
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

  const handleSaveAiSettings = async () => {
    setSavingSettings(true);
    addLog('Salvando configurações de IA...', 'info');
    console.log('[AdminDashboard] Preparando para salvar chaves de IA:', aiSystemPrompt, aiMemory);
    
    const aiSettings = [
      { key: 'AI_MEMORY', value: aiMemory },
      { key: 'AI_SYSTEM_PROMPT', value: aiSystemPrompt },
      { key: 'AI_CRM_PROMPT', value: aiCrmPrompt },
      { key: 'AI_CRM_MEMORY', value: aiCrmMemory },
      { key: 'AI_CRM_ENABLED', value: isGlobalAiEnabled ? 'true' : 'false' },
      { key: 'AI_BUYER_ENABLED', value: isBuyerAiEnabled ? 'true' : 'false' }
    ];

    try {
      console.log('[AdminDashboard] Executando upsert de configurações de IA...');
      for (const setting of aiSettings) {
        const { error: upsertError } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });

        if (upsertError) throw upsertError;
      }

      addLog('Configurações de IA salvas com sucesso!', 'info');
      await fetchData(true);
    } catch (error: any) {
      console.error('[AdminDashboard] Erro ao salvar IA:', error);
      addLog('Erro ao salvar IA: ' + error.message, 'error', error);
      alert('Erro ao salvar IA. Verifique o console.');
    } finally {
      setSavingSettings(false);
      console.log('[AdminDashboard] Finalizado salvamento de IA.');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    isSavingSettingsRef.current = true;
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
        { key: 'GOOGLE_ANALYTICS_ID', value: googleAnalyticsId },
        { key: 'GOOGLE_ADS_ID', value: googleAdsId },
        { key: 'GOOGLE_ADS_CONVERSION_LABEL', value: googleAdsConversionLabel },
        { key: 'AI_MEMORY', value: aiMemory },
        { key: 'AI_SYSTEM_PROMPT', value: aiSystemPrompt },
        { key: 'AI_CRM_PROMPT', value: aiCrmPrompt },
        { key: 'AI_CRM_MEMORY', value: aiCrmMemory },
        { key: 'AI_CRM_ENABLED', value: isGlobalAiEnabled ? 'true' : 'false' },
        { key: 'AI_BUYER_ENABLED', value: isBuyerAiEnabled ? 'true' : 'false' },
        { key: 'CHAT_HEIGHT', value: chatHeight },
        { key: 'CHAT_WIDTH', value: chatWidth },
        { key: 'CHAT_COLOR', value: chatColor },
        { key: 'AUTO_PROPOSAL_ENABLED', value: autoProposalEnabled ? 'true' : 'false' },
        { key: 'CHAT_AVATAR_URL', value: chatAvatarUrl },
        { key: 'CHAT_ATTENDANT_AVATAR', value: chatAttendantAvatar },
        { key: 'BANNER_HEIGHT', value: bannerHeight },
        { key: 'PROFIT_MARGIN_PERCENTAGE', value: profitMarginPercentage.toString() },
        { key: 'BUYER_VIEW_PERMISSIONS', value: JSON.stringify(buyerPermissions) },
        { key: 'BUYER_SEND_SETTINGS', value: JSON.stringify(buyerSendSettings) },
        { key: 'RESPONSE_MODE', value: responseMode },
        { key: 'WEBHOOK_URL', value: webhookUrl }
      ];

      console.log('Final settingsToSave:', settingsToSave);
      const { data, error: upsertError } = await supabase
        .from('settings')
        .upsert(settingsToSave, { onConflict: 'key' });

      if (upsertError) {
        console.error('Supabase Upsert Error:', upsertError);
        throw upsertError;
      }

      console.log("[AdminDashboard] Configurações salvas. Forçando atualização de dados...");
      // Não damos await aqui para não travar a UI enquanto recarrega tudo
      fetchData(true);
      refreshAssets();
      
      // Feedback visual ao invés de alert travante
      addLog('Configurações salvas com sucesso!', 'info');
      // Forçamos um pequeno delay antes de dizer que terminou
    } catch (error) {
      console.error('Error saving settings:', error);
      addLog('Erro ao salvar configurações.', 'error', error);
    } finally {
      setSavingSettings(false);
      setTimeout(() => {
        isSavingSettingsRef.current = false;
      }, 1000);
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

  const handleSaveLead = async (updatedLead: any) => {
    try {
      console.log("Salvando Lead no AdminDashboard:", updatedLead);
      
      // Sanitização: Remove campos que não pertencem à tabela ou são apenas para exibição
      const { 
        id, 
        created_at, 
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

      // Update local state
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { 
        ...l, 
        suggested_value: proposalCalculator.finalValue,
        detalhes_proposta: {
          ...proposalCalculator,
          overrides: proposalOverrides,
          avarias: selectedLead.avarias || [],
          avarias_manuais: selectedLead.avarias_manuais || []
        }
      } : l));

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
      // Check for duplication before saving
      const { data: existing } = await supabase
        .from('interested_buyers')
        .select('id')
        .or(`email.eq.${newBuyer.email},phone.eq.${newBuyer.phone}`)
        .maybeSingle();

      if (existing) {
        if (!confirm('Já existe um comprador com este e-mail ou telefone. Deseja cadastrar mesmo assim?')) {
          setIsSavingBuyer(false);
          return;
        }
      }

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

    if (settings.midias) {
      const mediaItems = [
        ...(lead.foto_principal ? [lead.foto_principal] : []),
        ...(Array.isArray(lead.fotos) ? lead.fotos : (lead.fotos_url ? [lead.fotos_url] : [])),
        ...(lead.foto1 ? [lead.foto1] : []),
        ...(lead.foto2 ? [lead.foto2] : []),
        ...(lead.foto3 ? [lead.foto3] : []),
        ...(Array.isArray(lead.videos) ? lead.videos : (lead.videos_url ? [lead.videos_url] : []))
      ].filter((item, index, self) => item && self.indexOf(item) === index);

      if (mediaItems.length > 0) {
        msg += `📸 *Fotos do Veículo:*\n`;
        mediaItems.slice(0, 10).forEach((foto: string, index: number) => {
          msg += `Foto ${index + 1}: ${foto}\n`;
        });
        if (mediaItems.length > 10) msg += `... e mais ${mediaItems.length - 10} arquivos.\n`;
        msg += `\n`;
      }
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
      const rawPhone = buyer.phone.replace(/\D/g, '');
      const basePhone = rawPhone.replace(/^0+/, '');
      const formattedPhone = basePhone.startsWith('55') ? basePhone : `55${basePhone}`;
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
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
        
        if (!lead || !lead.id) {
            console.error("Erro ao enviar mensagem: Lead inválido");
            continue;
        }
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
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>;

  const okKeys = apiKeys.filter(k => k.status === 'ok');
  const activeKeyId = okKeys.length > 0 
    ? [...okKeys].sort((a, b) => {
        const timeA = a.last_used ? new Date(a.last_used).getTime() : 0;
        const timeB = b.last_used ? new Date(b.last_used).getTime() : 0;
        return timeB - timeA;
      })[0].id
    : null;

  const filteredTabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'leads', label: 'Leads', icon: Car, roles: ['admin', 'buyer', 'buyer_premium', 'buyer_master', 'user', 'seller'] },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle, badge: conversations.reduce((acc, curr) => acc + (curr.unread || 0), 0), roles: ['admin', 'user', 'seller', 'buyer', 'buyer_premium', 'buyer_master'] },
    { id: 'crm_chat', label: 'CRM Chat', icon: MessageCircle, roles: ['admin', 'buyer', 'buyer_premium', 'buyer_master'] },
    { id: 'hero', label: 'Site', icon: ImageIcon, roles: ['admin'] },
    { id: 'assets', label: 'Fotos', icon: Maximize2, roles: ['admin'] },
    { id: 'footer', label: 'Rodapé', icon: Info, roles: ['admin'] },
    { id: 'crm', label: 'CRM Compradores', icon: UserPlus, roles: ['admin'] },
    { id: 'users', label: 'Equipe & CRM', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Regras', icon: Settings, roles: ['admin'] },
    { id: 'apis', label: 'APIs', icon: Key, roles: ['admin'] },
    { id: 'chat_settings', label: 'Chat Config', icon: MessageCircle, roles: ['admin'] },
    { id: 'ai', label: 'IA', icon: Bot, roles: ['admin'] },
    { id: 'cooperatives', label: 'Cooperativas', icon: Wallet, roles: ['admin'] },
    { id: 'tags', label: 'Marketing', icon: BarChart3, roles: ['admin'] },
    { id: 'logs', label: 'Logs', icon: Database, roles: ['admin'] },
  ].filter(tab => {
    if (tab.id === 'ai') return userProfile?.role === 'admin' || currentUser?.email === 'pereira.brusque@gmail.com';
    if (!tab.roles) return true;
    const hasRole = tab.roles.includes(userProfile?.role);
    if (tab.id === 'leads' && userProfile?.role?.includes('buyer')) return userProfile.view_auth === true;
    return hasRole || currentUser?.email === 'pereira.brusque@gmail.com';
  });

  const row1Tabs = filteredTabs.slice(0, 8);
  const row2Tabs = filteredTabs.slice(8);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Top Navbar Optimized */}
      <header className="bg-slate-950 shrink-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4">
          {/* Main Row: Logo + Primary Menus + Actions */}
          <div className="flex items-center justify-between min-h-[44px] gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(242,125,38,0.3)]">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="hidden lg:block">
                  <h1 className="font-display text-sm font-black text-white leading-none tracking-tight">AUTO COMPRA</h1>
                  <p className="text-[8px] text-accent font-bold uppercase tracking-[0.2em] mt-0.5">Admin Pro</p>
                </div>
              </div>
              
              <div className="h-6 w-px bg-white/10 hidden xl:block mx-1"></div>

              {/* FIRST ROW TABS (Integrated) */}
              <nav className="hidden xl:flex items-center gap-1">
                {row1Tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-2.5 py-1.5 rounded-lg font-black text-[9px] transition-all whitespace-nowrap flex items-center gap-2 relative group shrink-0 ${
                      activeTab === tab.id 
                        ? 'bg-accent/20 text-accent border border-accent/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-accent' : 'text-slate-500 group-hover:text-accent'}`} />
                    <span className="uppercase tracking-widest">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="w-3 h-3 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full font-black ml-0.5">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
               {/* AI Status Indicator Lite */}
               <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full ${isGlobalAiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[8px] font-black text-slate-300 uppercase leading-none tracking-widest">
                  IA {isGlobalAiEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <button 
                onClick={() => window.open('/', '_blank')}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Abrir Site"
              >
                <Share2 className="w-4 h-4" />
              </button>
               <button 
                onClick={handleLogout}
                className="p-1.5 px-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Dynamic Second Row (Same Format as Row 1 but centered) */}
          <nav className="flex items-center justify-center pb-2 border-t border-white/5 overflow-visible">
            <div className="flex flex-wrap items-center justify-center gap-1.5 py-2 max-w-full lg:max-w-none">
              {/* On mobile/small screens, show all tabs here if row1 is hidden in top bar */}
              <div className="xl:hidden flex flex-wrap justify-center gap-1">
                {row1Tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all whitespace-nowrap flex items-center gap-2 relative group shrink-0 ${
                      activeTab === tab.id 
                        ? 'bg-accent text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-accent'}`} />
                    <span className="uppercase tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Row 2 Tabs (Same Compact Format) */}
              {row2Tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] transition-all whitespace-nowrap flex items-center gap-2 relative group shrink-0 ${
                    activeTab === tab.id 
                      ? 'bg-white/10 text-accent border border-accent/30 shadow-[0_0_20px_rgba(242,125,38,0.15)] scale-105' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-accent' : 'text-slate-500 group-hover:text-accent'}`} />
                  <span className="uppercase tracking-widest">{tab.label}</span>
                  
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="navTabIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(242,125,38,1)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow overflow-hidden px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto no-scrollbar"
          >
            {activeTab === 'crm_chat' && (
              <div className="flex-grow flex flex-col min-h-0">
                <CRMChatContainer 
                  role={userProfile?.role || 'admin'} 
                  onOpenLead={(lead) => {
                    console.log("[AdminDashboard] Abrindo lead via CRM Chat:", lead.id, lead.vehicle_code);
                    setSelectedLead(lead);
                  }}
                  onCloneLead={handleCloneVehicle}
                />
              </div>
            )}
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
                {showExpiredReservationAlert && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-[32px] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <div>
                        <h3 className="text-lg font-bold text-red-900">Reservas Expiradas</h3>
                        <p className="text-sm text-red-700">Existem veículos com reserva expirada que precisam de atenção humana.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('leads')}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                    >
                      Ver Leads
                    </button>
                  </div>
                )}
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div 
                    onClick={() => setActiveTab('leads')}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Car className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Leads</p>
                          <h3 className="text-2xl font-black text-slate-900">{leads.length}</h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Novos</span>
                        <span className="text-sm font-black text-blue-500">{leads.filter(l => l.status === 'novo').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Em Contato</span>
                        <span className="text-sm font-black text-amber-500">{leads.filter(l => l.status === 'em_contato').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Propostas</span>
                        <span className="text-sm font-black text-purple-500">{leads.filter(l => l.status === 'proposta_enviada').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Fechados/Perd.</span>
                        <span className="text-sm font-black text-emerald-500">{leads.filter(l => l.status === 'fechado' || l.status === 'perdido').length}</span>
                      </div>
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
                        <h3 className="text-2xl font-black text-slate-900">{users.filter(u => u.role?.includes('buyer')).length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-purple-500">{users.filter(u => u.role === 'buyer_master').length} Master</span>
                        <span className="text-emerald-500">{users.filter(u => u.role === 'buyer_premium').length} Premium</span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Tabela profiles</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveTab('users');
                      setUserManagementTab('equipe');
                    }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Administradores</p>
                        <h3 className="text-2xl font-black text-slate-900">{users.filter(u => u.role === 'admin').length}</h3>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-indigo-500">{users.filter(u => u.role === 'admin' && (new Date().getTime() - new Date(u.last_login).getTime()) < 300000).length} Online</span>
                        <span className="text-slate-400">{users.filter(u => u.role === 'admin').length} Total</span>
                      </div>
                      <p className="text-[9px] text-slate-300 italic">Fonte: Tabela profiles</p>
                    </div>
                  </div>
                </div>

                {/* User Status Cards - Detailed */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Logged In Card */}
                  <div className="bg-slate-900 p-5 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-12 h-12 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online Agora</p>
                    </div>
                    <h3 className="text-3xl font-black text-white leading-none mb-1">{userStats.online}</h3>
                    <p className="text-[10px] text-slate-500 font-bold">Usuários ativos (5min)</p>
                  </div>

                  {/* Role Stats Cards */}
                  {[
                    { label: 'Compradores', stats: userStats.buyers, color: 'amber', icon: Users, role: 'buyer', desc: 'Padrão' },
                    { label: 'Master', stats: userStats.master, color: 'emerald', icon: ShieldCheck, role: 'buyer_master', desc: 'Acesso Total' },
                    { label: 'Premium', stats: userStats.premium, color: 'purple', icon: Zap, role: 'buyer_premium', desc: 'Acesso Restrito' },
                    { label: 'Usuários/Cli', stats: userStats.users, color: 'blue', icon: User, role: 'user', desc: 'Vendedores' },
                    { label: 'Admins', stats: userStats.admins, color: 'indigo', icon: ShieldCheck, role: 'admin', desc: 'Gestão' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-[9px] text-slate-300 font-bold">{item.desc}</p>
                        </div>
                        <div className={`p-2 rounded-xl bg-${item.color}-50 text-${item.color}-500 group-hover:bg-${item.color}-500 group-hover:text-white transition-colors`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{item.stats.total}</h3>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-600">{item.stats.online} ON</p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-300">{item.stats.total - item.stats.online} OFF</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <div className="h-64 min-h-[256px] flex items-end gap-4">
                      {(() => {
                        console.log("[AdminDashboard] Leads para gráfico:", leads);
                        const channels = [
                          { id: 'chat', label: 'Chat', color: 'bg-blue-500' },
                          { id: 'formulario', label: 'Formulário', color: 'bg-emerald-500' },
                          { id: 'catalogo', label: 'Catálogo', color: 'bg-purple-500' },
                          { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500' },
                          { id: 'outros', label: 'Outros', color: 'bg-slate-400' }
                        ];
                        
                        const channelCounts = channels.map(c => {
                          if (c.id === 'outros') {
                            return leads.filter(l => !['chat', 'formulario', 'catalogo', 'whatsapp'].includes(l.origem)).length;
                          }
                          return leads.filter(l => l.origem === c.id).length;
                        });
                        
                        console.log("[AdminDashboard] Contagens por canal:", channelCounts);
                        
                        const maxCount = Math.max(...channelCounts, 1); // Avoid division by zero
                        
                        const chartData = channels.map((c, i) => ({ name: c.label, value: channelCounts[i] }));
                        
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
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
                        { label: 'Leads Fria', status: 'frio' as const, count: leads.filter(l => l.status === 'frio').length, color: 'bg-red-500' },
                        { label: 'Leads Morna', status: 'proposta_enviada' as const, count: leads.filter(l => l.status === 'proposta_enviada' || l.status === 'em_contato').length, color: 'bg-purple-500' },
                        { label: 'Lead Quente', status: 'fechado' as const, count: leads.filter(l => l.status === 'fechado').length, color: 'bg-emerald-500' },
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
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Configurações de IA</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <Bot className={`w-5 h-5 ${isBuyerAiEnabled ? 'text-amber-500' : 'text-slate-300'}`} />
                      <span className="text-sm font-bold text-slate-700">IA Comprador</span>
                      <button
                        onClick={() => {
                          const newVal = !isBuyerAiEnabled;
                          setIsBuyerAiEnabled(newVal);
                          supabase.from('settings').upsert({ key: 'AI_BUYER_ENABLED', value: newVal.toString() });
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${isBuyerAiEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isBuyerAiEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <Bot className={`w-5 h-5 ${isGlobalAiEnabled ? 'text-accent' : 'text-slate-300'}`} />
                      <span className="text-sm font-bold text-slate-700">IA Vendedor</span>
                      <button
                        onClick={() => {
                          const newVal = !isGlobalAiEnabled;
                          setIsGlobalAiEnabled(newVal);
                          supabase.from('settings').upsert({ key: 'AI_CRM_ENABLED', value: newVal.toString() });
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${isGlobalAiEnabled ? 'bg-accent' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGlobalAiEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* VENDEDOR / LEADS */}
                  <div className="space-y-6 p-6 bg-slate-50 rounded-[32px] border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">IA Vendedor (Leads)</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configurações para o Chat de Vendas</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regras da IA (System Prompt)</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none h-48 focus:ring-2 focus:ring-accent/20 transition-all"
                        placeholder="Ex: Você é um vendedor de carros experiente..."
                        value={aiSystemPrompt}
                        onChange={(e) => setAiSystemPrompt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Memória da IA (Contexto Aprendido)</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none h-48 focus:ring-2 focus:ring-accent/20 transition-all"
                        placeholder="Informações que a IA deve lembrar sobre o negócio..."
                        value={aiMemory}
                        onChange={(e) => setAiMemory(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* COMPRADOR / CRM */}
                  <div className="space-y-6 p-6 bg-slate-50 rounded-[32px] border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <Database className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">IA CRM (Compradores)</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configurações para o Chat de Compradores</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regras do CRM (System Prompt)</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none h-48 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Ex: Você é um consultor de compras especializado..."
                        value={aiCrmPrompt}
                        onChange={(e) => setAiCrmPrompt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Memória do CRM (Contexto Aprendido)</label>
                      <textarea 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none h-48 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Informações que a IA deve lembrar sobre os compradores..."
                        value={aiCrmMemory}
                        onChange={(e) => setAiCrmMemory(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveAiSettings}
                    disabled={savingSettings}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Configurações de IA
                  </button>
                </div>
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Modo de Resposta (IA)</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                      value={responseMode}
                      onChange={(e) => setResponseMode(e.target.value as 'chat' | 'webhook')}
                    >
                      <option value="chat">Responder no Chat do Site</option>
                      <option value="webhook">Enviar para Webhook Externo</option>
                    </select>
                  </div>
                  {responseMode === 'webhook' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">URL do Webhook</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
                        value={webhookUrl}
                        placeholder="https://sua-api.com/webhook"
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                  )}
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
                                  {user.created_at ? getDayString(user.created_at) : '-'}
                                </p>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-xs font-bold text-slate-600">{user.phone || '-'}</p>
                              </td>
                              <td className="px-8 py-5">
                                  {userProfile?.role === 'admin' ? (
                                    <select
                                      value={user.role || 'user'}
                                      onChange={async (e) => {
                                        const newRole = e.target.value;
                                        addLog(`Alterando cargo de ${user.email} para ${newRole}`, 'info');
                                        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
                                        if (!error) {
                                          refreshUsers();
                                          addLog('Cargo alterado com sucesso', 'info');
                                          // Se o usuário alterado for o próprio usuário logado, recarrega para atualizar permissões e evitar tela branca
                                          if (user.id === currentUser?.id) {
                                            window.location.reload();
                                          }
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
                                        Visto em: {getDateTimeString(user.last_login)}
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
                                        checked={user.view_auth || false} 
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
                                    onClick={() => {
                                      setEditingUser(user);
                                      setEditUserForm({
                                        full_name: user.full_name || '',
                                        email: user.email || '',
                                        phone: user.phone || '',
                                        role: user.role || 'user'
                                      });
                                      setIsEditUserModalOpen(true);
                                    }}
                                    className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
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
              <div className="flex flex-col gap-2 h-full pb-4">
                {/* LINHA 1: TODOS OS CAMPOS UTITLITARIOS (8 ÍTENS - DINÂMICO) */}
                <div className="flex flex-wrap items-center gap-0.5 bg-white p-1 rounded-[20px] border border-slate-100 shadow-sm w-full shrink-0 z-10 transition-all">
                    {/* 1. Exportar */}
                    <button 
                      onClick={handleExportCSV}
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1 text-[8px] font-black uppercase tracking-wider shrink-0"
                      title="Exportar para CSV"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>Exportar</span>
                    </button>

                    {/* 2 & 3. Filtros de Data */}
                    <div className="flex items-center gap-0.5 shrink-0 bg-slate-50/30 p-0.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1 px-1.5 py-1 bg-white rounded-md border border-slate-200 shadow-sm">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">DE</span>
                        <input type="date" className="bg-transparent text-[8px] font-black outline-none border-0 p-0 focus:ring-0 min-w-[70px]" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-1 bg-white rounded-md border border-slate-200 shadow-sm">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ATÉ</span>
                        <input type="date" className="bg-transparent text-[8px] font-black outline-none border-0 p-0 focus:ring-0 min-w-[70px]" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                      </div>
                    </div>

                    {/* 4. Busca */}
                    <div className="relative flex-1 min-w-[120px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Código..."
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* 5. Modo de Visualização */}
                    <button 
                      onClick={() => setLeadsViewMode(leadsViewMode === 'list' ? 'grid' : 'list')}
                      className="px-2 py-1.5 bg-slate-900 text-white rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-sm shrink-0"
                    >
                      {leadsViewMode === 'list' ? <LayoutDashboard className="w-2.5 h-2.5 text-accent" /> : <BarChart3 className="w-2.5 h-2.5 text-accent" />}
                      <span>{leadsViewMode === 'list' ? 'Grade' : 'Lista'}</span>
                    </button>

                    {/* 6. Limpar Duplicados */}
                    <button 
                      onClick={handleCleanupDuplicates}
                      disabled={isCleaningDuplicates}
                      className="px-2 py-1.5 bg-accent/5 border border-accent/10 text-accent rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 group shrink-0"
                    >
                      {isCleaningDuplicates ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500" />}
                      <span>Duplicados</span>
                    </button>

                    {/* 7. Limpar Filtros */}
                    <button 
                      onClick={() => {
                        setFilterBrand('');
                        setFilterYear('');
                        setFilterMinPrice('');
                        setFilterMaxPrice('');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setSearchCode('');
                      }}
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-1 text-[8px] font-black uppercase tracking-wider shrink-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Limpar</span>
                    </button>

                    {/* 8. Atualizar */}
                    <button 
                       onClick={() => fetchData(true)}
                       className="w-8 h-8 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md flex items-center justify-center shrink-0 group"
                       title="Atualizar Dados"
                    >
                       <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>

                {/* LINHA 2: ABAS DE STATUS (DESIGN PREMIUM & COMPACTO) */}
                <div className="flex items-center gap-1.5 bg-slate-950/5 p-1 rounded-xl w-fit mx-auto lg:mx-0 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'todos', label: 'Todos', color: 'slate' },
                    { id: 'novos_precificacao', label: 'Novos', color: 'emerald' },
                    { id: 'frio', label: 'Frio', color: 'blue' },
                    { id: 'proposta_enviada', label: 'Morna', color: 'orange' },
                    { id: 'negociar', label: 'Negociar', color: 'indigo' },
                    { id: 'contrato_enviado', label: 'Contrato', color: 'cyan' },
                    { id: 'limpa_nome', label: 'Limpa Nome', color: 'rose' },
                    { id: 'reservado', label: 'Reservados', color: 'amber' },
                    { id: 'fechado', label: 'Quente', color: 'red' },
                    { id: 'vendido', label: 'Vendido', color: 'emerald' },
                    { id: 'perdido', label: 'Perdido', color: 'slate' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLeadTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 relative overflow-hidden group ${
                        activeLeadTab === tab.id 
                          ? `bg-slate-900 text-white shadow-md scale-105 z-10` 
                          : 'text-slate-400 hover:text-slate-900 hover:bg-white transition-all duration-300'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        tab.color === 'emerald' ? 'bg-emerald-500' :
                        tab.color === 'blue' ? 'bg-blue-500' :
                        tab.color === 'orange' ? 'bg-orange-500' :
                        tab.color === 'indigo' ? 'bg-indigo-500' :
                        tab.color === 'rose' ? 'bg-rose-500' :
                        tab.color === 'amber' ? 'bg-amber-500' :
                        tab.color === 'cyan' ? 'bg-cyan-500' :
                        tab.color === 'red' ? 'bg-red-500' : 'bg-slate-400'
                      } ${activeLeadTab === tab.id ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Filtros Adicionais (Marca, Ano, Preço) - Mais compactos */}
                <div className="flex flex-wrap items-center gap-1.5 pb-0.5 border-b border-slate-100 mb-0.5 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 transition-all hover:border-accent/20">
                    <select className="bg-transparent border-0 text-[10px] font-black text-slate-600 focus:ring-0 min-w-[110px] cursor-pointer" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                      <option value="">Marcas</option>
                      {[...new Set(leads.map(l => l.marca).filter(Boolean))].sort().map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                    <div className="w-px h-4 bg-slate-200" />
                    <input type="number" placeholder="Ano" className="bg-transparent border-0 text-[10px] font-black w-14 text-slate-600 focus:ring-0 placeholder:text-slate-400" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 transition-all hover:border-accent/20">
                    <input type="number" placeholder="Min R$" className="bg-transparent border-0 text-[10px] font-black w-20 text-slate-600 focus:ring-0 placeholder:text-slate-400" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} />
                    <div className="w-1.5 h-px bg-slate-300" />
                    <input type="number" placeholder="Max R$" className="bg-transparent border-0 text-[10px] font-black w-20 text-slate-600 focus:ring-0 placeholder:text-slate-400" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} />
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden flex-grow flex flex-col min-h-0">
                  {leadsViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {filteredLeads
                        .map((lead) => (
                          <LeadCard 
                            key={lead.id} 
                            lead={lead} 
                            suggestedValue={getProposalResult(lead)?.finalValue || 0}
                            hideClientInfo={userProfile?.role === 'buyer_premium'}
                            permissions={userProfile?.role?.includes('buyer') ? buyerPermissions : null}
                            onClick={() => {
                              setSelectedLead(lead);
                              setProposalCalculator(getProposalResult(lead));
                              setSelectedBuyers([]);
                              setCurrentPhotoIndex(0);
                            }} 
                            onReserve={(e) => {
                              e.stopPropagation();
                              handleReserve(lead);
                            }}
                            onClone={(e) => {
                              e.stopPropagation();
                              handleCloneVehicle(lead);
                            }}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="flex-grow overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                          <tr className="border-b border-slate-200">
                            <th className="px-2 pr-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Data</th>
                            <th className="px-2 pl-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Status</th>
                            {activeLeadTab === 'limpa_nome' ? (
                              <>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Nome do Cliente</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">CPF</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Valor da Dívida</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Whatsapp</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Localização</th>
                              </>
                            ) : (
                              <>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Veículo</th>
                                <th className="px-2 pr-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Código</th>
                                <th className="px-2 px-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Ano/Modelo</th>
                                <th className="px-2 pl-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">FIPE</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Desejado</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Sugerido</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Contato</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Como Está</th>
                                <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Quitado</th>
                              </>
                            )}
                            <th className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">Ações</th>
                          </tr>
                        </thead>
                          <tbody>
                            {filteredLeads
                              .map((lead) => {
                                 const profile = lead.email ? users.find(u => u.email === lead.email) : null;
                                 const isBuyer = userProfile?.role?.includes('buyer');
                                 const shouldHidePrice = isBuyer && !buyerPermissions.show_price;
                                 const shouldHidePhotos = isBuyer && !buyerPermissions.show_photos;
                                 const actualHideClientInfo = isBuyer && (!buyerPermissions.show_details || userProfile?.role === 'buyer_premium');

                                 return (
                              <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => {
                                setSelectedLead(lead);
                                setProposalCalculator(getProposalResult(lead));
                                setSelectedBuyers([]);
                                setCurrentPhotoIndex(0);
                              }}>
                                <td className="px-2 pr-1 py-1.5 text-[11px] font-bold text-slate-900">
                                  {getDayString(lead.created_at)}
                                </td>
                                <td className="px-2 pl-1 py-1.5">
                                  <select 
                                    value={lead.status || 'novo'} 
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      // Map status to classification
                                      let newClass = lead.classificacao;
                                      if (newStatus === 'fechado') newClass = 'quente';
                                      else if (newStatus === 'proposta_enviada' || newStatus === 'em_contato') newClass = 'morna';
                                      else newClass = 'fria';

                                      setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus, classificacao: newClass } : l));
                                      await supabase.from('leads_veiculos').update({ 
                                        status: newStatus,
                                        classificacao: newClass
                                      }).eq('id', lead.id);
                                    }}
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border-none outline-none cursor-pointer tracking-tighter ${
                                      lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-700' :
                                      lead.status === 'perdido' ? 'bg-red-100 text-red-700' :
                                      lead.status === 'reservado' ? 'bg-amber-100 text-amber-700' :
                                      lead.status === 'proposta_enviada' ? 'bg-blue-100 text-blue-700' :
                                      lead.status === 'em_contato' ? 'bg-amber-100 text-amber-700' :
                                      lead.status === 'negociar' ? 'bg-purple-100 text-purple-700' :
                                      lead.status === 'limpa_nome' ? 'bg-indigo-100 text-indigo-700' :
                                      lead.status === 'contrato_enviado' ? 'bg-cyan-100 text-cyan-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <option value="novo">NOVO</option>
                                    <option value="em_contato">EM CONTATO</option>
                                    <option value="proposta_enviada">PROPOSTA ENVIADA</option>
                                    <option value="negociar">NEGOCIAR</option>
                                    <option value="contrato_enviado">CONTRATO ENVIADO</option>
                                    <option value="limpa_nome">LIMPA NOME</option>
                                    <option value="reservado">RESERVADO</option>
                                    <option value="fechado">FECHADO</option>
                                    <option value="perdido">PERDIDO</option>
                                  </select>
                                </td>
                                
                                {activeLeadTab === 'limpa_nome' ? (
                                  <>
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                          <User className="w-3 h-3 text-indigo-600" />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-900 truncate max-w-[150px]">
                                          {actualHideClientInfo ? 'Cliente Oculto' : (profile?.full_name || lead.cliente_nome)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-bold text-slate-600 font-mono">
                                      {lead.cpf || 'Não inf.'}
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-black text-indigo-600">
                                      {lead.valor_divida ? `R$ ${lead.valor_divida}` : '-'}
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-bold text-slate-600">
                                      {lead.telefone ? lead.telefone : '-'}
                                    </td>
                                    <td className="px-2 py-1.5 text-[10px] font-bold text-slate-500">
                                      {(lead.cidade && lead.estado) ? `${lead.cidade}-${lead.estado}` : (lead.cep || '-')}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                          {shouldHidePhotos ? (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[8px] text-white/40 font-bold uppercase tracking-tight">HIDDEN</div>
                                          ) : lead.fotos && lead.fotos[0] ? (
                                            <img src={lead.fotos[0]} alt="Veículo" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                              <Car className="w-4 h-4" />
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <div className="flex-shrink-0">
                                            {profile?.avatar_url ? (
                                              <img src={profile.avatar_url} alt={profile.full_name} className="w-6 h-6 rounded-full object-cover shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
                                            ) : (
                                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shadow-sm border border-slate-200">
                                                <User className="w-3 h-3 text-slate-400" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="overflow-hidden">
                                            {(lead.marca || lead.modelo) && (
                                              <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{lead.marca} {lead.modelo}</p>
                                            )}
                                            <p className="text-[10px] text-slate-500 truncate">{actualHideClientInfo ? 'Cliente Oculto' : (profile?.full_name || lead.cliente_nome)}</p>
                                          </div>
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
                                      {shouldHidePrice ? 'R$ ??.???' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_fipe || 0)}
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-black text-emerald-600">
                                      {shouldHidePrice ? 'R$ ??.???' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.preco_cliente || 0)}
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex flex-col">
                                        <span className={`text-[11px] font-black ${getProposalClass(getProposalResult(lead)?.finalValue || 0, lead.tipo_veiculo) || 'text-accent'}`}>
                                          {shouldHidePrice ? 'R$ ??.???' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getProposalResult(lead)?.finalValue || 0)}
                                        </span>
                                        {getProposalResult(lead)?.previousProposalValue && (
                                          <span className="text-[9px] text-slate-400 font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getProposalResult(lead)?.previousProposalValue)}
                                          </span>
                                        )}
                                        {getProposalResult(lead)?.requiresManualAnalysis && (
                                          <span className="text-[9px] text-red-500 font-bold flex items-center gap-0.5 mt-0.5" title="Requer análise manual">
                                            <AlertTriangle className="w-3 h-3" /> Análise
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-1">
                                        {lead.telefone && !actualHideClientInfo && (
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              const phone = lead.telefone?.replace(/\D/g, '');
                                              const basePhone = phone?.replace(/^0+/, '');
                                              const formattedPhone = basePhone?.startsWith('55') ? basePhone : `55${basePhone}`;
                                              const calc = getProposalResult(lead);
                                              const encodedMessage = generateOwnerMessage(lead, calc);
                                              window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
                                            }} 
                                            className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-600 animate-pulse-soft" 
                                            title="WhatsApp Proposta"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {lead.telefone && (
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              setSelectedLead(lead);
                                              setShowWhatsAppBuyerModal(true);
                                            }} 
                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 animate-pulse-soft" 
                                            title="WhatsApp Comprador"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-bold text-slate-900">
                                      {buyerProposals.find(p => p.lead_id === lead.id && p.type === 'as_is')?.proposta_final ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(buyerProposals.find(p => p.lead_id === lead.id && p.type === 'as_is').proposta_final) : '-'}
                                    </td>
                                    <td className="px-2 py-1.5 text-[11px] font-bold text-slate-900">
                                      {buyerProposals.find(p => p.lead_id === lead.id && p.type === 'quitado')?.proposta_final ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(buyerProposals.find(p => p.lead_id === lead.id && p.type === 'quitado').proposta_final) : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLead(lead);
                                        setProposalCalculator(getProposalResult(lead));
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
                            );
                          })}
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
                        placeholder="(11) 99999-9999"
                        value={newBuyer.phone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 11) val = val.slice(0, 11);
                          let masked = val;
                          if (val.length > 0) masked = `(${val.slice(0, 2)}`;
                          if (val.length > 2) masked += `) ${val.slice(2, 7)}`;
                          if (val.length > 7) masked += `-${val.slice(7, 11)}`;
                          setNewBuyer({...newBuyer, phone: masked});
                        }}
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
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 animate-pulse-soft"
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
                                    : getDateTimeString(user.last_login) || '-'}
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
                                  onClick={async () => {
                                    // Busca as permissões mais recentes do banco antes de abrir (globais)
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
                                          const { data, error } = await supabase.from('buyer_crm_permissions').insert({
                                            buyer_id: buyer.id,
                                            lead_id: selectedLead.id
                                          }).select().single();
                                          if (!error) setBuyerAuthorizations(prev => [...prev, data]);
                                        } else {
                                          const { error } = await supabase.from('buyer_crm_permissions').delete().eq('buyer_id', buyer.id).eq('lead_id', selectedLead.id);
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
                      { key: 'observacoes', label: 'Observações Internas' },
                      { key: 'whatsapp', label: 'Botão WhatsApp' }
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
                        placeholder="(11) 99999-9999"
                        value={newBuyer.phone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 11) val = val.slice(0, 11);
                          let masked = val;
                          if (val.length > 0) masked = `(${val.slice(0, 2)}`;
                          if (val.length > 2) masked += `) ${val.slice(2, 7)}`;
                          if (val.length > 7) masked += `-${val.slice(7, 11)}`;
                          setNewBuyer({...newBuyer, phone: masked});
                        }}
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
                                        ? `Visto ${getDateTimeString(buyer.last_seen)}`
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
                                  onClick={() => {
                                    setMessageTab('buyers');
                                    setSelectedCompradorChat(buyer.user_id || buyer.id);
                                    setActiveTab('messages');
                                    if (buyer.user_id) fetchCompradorMessages(buyer.user_id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                  title="Abrir Chat"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
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
              <AdminMessages
                conversations={conversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                chatMessages={chatMessages}
                adminMessage={adminMessage}
                setAdminMessage={setAdminMessage}
                handleSendMessage={handleSendMessage}
                handleLearnFromChat={handleLearnFromChat}
                setShowProposalModal={setShowProposalModal}
                setShowVehicleSelectionModal={setShowVehicleSelectionModal}
                setSelectionMode={setSelectionMode}
                onCloneLead={handleCloneVehicle}
                setSelectedLead={setSelectedLead}
                setToast={setToast}
                messageTab={messageTab}
                setMessageTab={setMessageTab}
                internalConversations={internalConversations}
                compradoresConversations={compradoresConversations}
                selectedInternalChat={selectedInternalChat}
                setSelectedInternalChat={setSelectedInternalChat}
                selectedCompradorChat={selectedCompradorChat}
                setSelectedCompradorChat={setSelectedCompradorChat}
                internalChatMessages={internalChatMessages}
                compradorChatMessages={compradorChatMessages}
                isGlobalAiEnabled={isGlobalAiEnabled}
                toggleGlobalAi={toggleGlobalAi}
                autoProposalEnabled={autoProposalEnabled}
                toggleAutoProposal={toggleAutoProposal}
                isUpdatingAi={isUpdatingAi}
                fetchChatMessages={fetchChatMessages}
                fetchInternalMessages={fetchInternalMessages}
                fetchCompradorMessages={fetchCompradorMessages}

                users={users}
                leads={leads}
                setProposalCalculator={setProposalCalculator}
                calculateProposal={getProposalResult}
                isSendingMessage={isSendingMessage}
                supabase={supabase}
                setConversations={setConversations}
              />
            )}

            {activeTab === 'hero' && (
              <div className="space-y-6">
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
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50 animate-pulse-soft"
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
                    {(asset.tipo.startsWith('card_') || asset.tipo.startsWith('trigger')) && (
                      <>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                          <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            value={asset.title || ''}
                            placeholder="Ex: Título do Card"
                            onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: e.target.value } : a))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo / Descrição</label>
                          <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-20"
                            value={asset.subtitle || ''}
                            placeholder="Ex: Descrição do Card"
                            onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, subtitle: e.target.value } : a))}
                          />
                        </div>
                        {asset.tipo.startsWith('card_') && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto do Botão</label>
                              <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                value={asset.button_text || ''}
                                placeholder="Ex: VER OFERTA"
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
                          </>
                        )}
                      </>
                    )}
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
                      className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50 animate-pulse-soft"
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
          <TagsManagement 
            googleAnalyticsId={googleAnalyticsId}
            setGoogleAnalyticsId={setGoogleAnalyticsId}
            googleAdsId={googleAdsId}
            setGoogleAdsId={setGoogleAdsId}
            googleAdsConversionLabel={googleAdsConversionLabel}
            setGoogleAdsConversionLabel={setGoogleAdsConversionLabel}
          />
        )}

        {activeTab === 'apis' && (
          <ApiManagement 
            apiKeys={apiKeys}
            showApiKeyForm={showApiKeyForm}
            setShowApiKeyForm={setShowApiKeyForm}
            editingApiKey={editingApiKey}
            setEditingApiKey={setEditingApiKey}
            setNewApiKey={setNewApiKey}
            setNewApiModel={setNewApiModel}
            setNewApiProvider={setNewApiProvider}
            isSavingKey={isSavingKey}
            handleDeleteApiKey={async (id: string) => {
              if (confirm('Tem certeza que deseja excluir esta chave?')) {
                console.log('Excluindo API Key:', id);
                try {
                  const { error, data } = await supabase.from('api_keys').delete().eq('id', id).select();
                  console.log('Resultado da exclusão:', { error, data });
                  if (error) throw error;
                  fetchData();
                } catch (err: any) {
                  console.error('Erro ao excluir API:', err);
                  alert('Erro ao excluir API: ' + err.message);
                }
              }
            }}
            handleSaveApiKey={async () => {
              if (!newApiKey || !newApiProvider || !newApiModel) {
                alert('Preencha todos os campos.');
                return;
              }
              setIsSavingKey(true);
              console.log('Salvando nova API Key:', { provider: newApiProvider, service: newApiModel });
              try {
                const { error, data } = await supabase.from('api_keys').insert([{
                  provider: newApiProvider,
                  service: newApiModel,
                  key: newApiKey,
                  status: 'ok'
                }]).select();
                console.log('Resultado do salvamento:', { error, data });
                if (error) throw error;
                fetchData();
                setShowApiKeyForm(false);
                setNewApiKey('');
              } catch (err: any) {
                console.error('Erro ao salvar API:', err);
                alert('Erro ao salvar API: ' + err.message);
              } finally {
                setIsSavingKey(false);
              }
            }}
            handleUpdateApiKey={async (id: string, provider: string, service: string, status?: string) => {
              console.log('Atualizando API Key:', { id, provider, service, status });
              try {
                const updateData: any = { provider, service };
                if (status) {
                  updateData.status = status;
                  // Sincroniza com o AIService para atualizar o selo "Em Uso" se necessário
                  if (status === 'ok' || status === 'no_credit' || status === 'disconnected' || status === 'rate_limited') {
                    AIService.updateKeyStatus(id, status as any).catch(console.error);
                  }
                }
                
                const { error, data } = await supabase
                  .from('api_keys')
                  .update(updateData)
                  .eq('id', id)
                  .select();
                console.log('Resultado da atualização:', { error, data });
                if (error) throw error;
                fetchData();
                setEditingApiKey(null);
              } catch (err: any) {
                console.error('Erro ao atualizar API:', err);
                alert('Erro ao atualizar API: ' + err.message);
              }
            }}
            newApiKey={newApiKey}
            newApiProvider={newApiProvider}
            newApiModel={newApiModel}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'chat_settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-accent" />
                Configurações do Chat
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Foto do Atendente (URL)</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0">
                        {chatAttendantAvatar ? (
                          <img src={chatAttendantAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={chatAttendantAvatar}
                        onChange={(e) => setChatAttendantAvatar(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Esta foto aparecerá para o cliente no chat como sendo o atendente real.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Avatar da IA (URL)</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0">
                        {chatAvatarUrl ? (
                          <img src={chatAvatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Bot className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={chatAvatarUrl}
                        onChange={(e) => setChatAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Avatar usado pela IA quando ela responde automaticamente.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Cor Principal do Chat</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={chatColor}
                        onChange={(e) => setChatColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={chatColor}
                        onChange={(e) => setChatColor(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Largura (px)</label>
                      <input 
                        type="text" 
                        value={chatWidth}
                        onChange={(e) => setChatWidth(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Altura (px)</label>
                      <input 
                        type="text" 
                        value={chatHeight}
                        onChange={(e) => setChatHeight(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Salvar Configurações do Chat
              </button>

              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-blue-600" />
                    <h4 className="text-lg font-bold text-blue-900">Manutenção de Dados (Compradores)</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-6">
                    Use o botão abaixo para gerar automaticamente propostas de "Como Está" e "Quitado" para todos os veículos antigos que estão no estoque mas ainda não foram precificados para compradores.
                  </p>
                  <button 
                    onClick={handleMigrateBuyerProposals}
                    disabled={isMigrating}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isMigrating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    {isMigrating ? 'Migrando Dados...' : 'Migrar e Precificar Veículos Antigos'}
                  </button>
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

              <div className="space-y-4 max-h-[80vh] overflow-y-auto mb-6 pr-2">
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
                                const { data, error } = await supabase.from('buyer_crm_permissions').insert({
                                  buyer_id: buyerToAuth.id,
                                  lead_id: lead.id
                                }).select().single();
                                if (!error) setBuyerAuthorizations(prev => [...prev, data]);
                              } else {
                                const { error } = await supabase.from('buyer_crm_permissions').delete().eq('buyer_id', buyerToAuth.id).eq('lead_id', lead.id);
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
                  setProposalCalculator(getProposalResult(updatedLead));
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

                <div className="pt-4 border-t border-slate-200 mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xl text-slate-900">Valor Final</span>
                    <span className={`font-black text-2xl ${getProposalClass(proposalCalculator.finalValue, selectedLead?.tipo_veiculo) || 'text-accent'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposalCalculator.finalValue)}</span>
                  </div>

                  <button 
                    onClick={() => {
                      handleSaveProposal(false);
                      setShowProposalDetails(false);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Proposta no Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showBuyerPermissionsModal && selectedBuyer && (
        <BuyerPermissionsModal 
          buyer={selectedBuyer} 
          onClose={() => setShowBuyerPermissionsModal(false)} 
        />
      )}

      {showProposalModal && selectedLead && (
        <ProposalModal
          selectedLead={selectedLead}
          proposalCalculator={proposalCalculator}
          onClose={() => setShowProposalModal(false)}
          onSave={(updatedLead) => {
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
          }}
          setAvarias={setAvarias}
          setShowAvariasModal={setShowAvariasModal}
          fipeRules={fipeRules}
          jurosAtraso={jurosAtraso}
          banks={banks}
          cooperativeDiscount={cooperativeDiscount}
          profitMarginPercentage={profitMarginPercentage}
          repairCosts={repairCosts}
        />
      )}

      {showVehicleSelectionModal && (
        <VehicleSelectionModal
          onClose={() => setShowVehicleSelectionModal(false)}
          title={selectionMode === 'clone' ? "Selecione o Veículo para Clonar" : "Selecione o Veículo para Proposta"}
          leads={
            messageTab === 'internal' && selectedInternalChat
              ? leads.filter(l => l.user_id === selectedInternalChat)
              : leads.filter(l => 
                  (selectedConversation?.customer_email && l.email === selectedConversation.customer_email) ||
                  (selectedConversation?.lead?.user_id && l.user_id === selectedConversation.lead.user_id) ||
                  selectedConversation?.lead_ids?.includes(l.id)
                )
          }
          onSelect={(lead) => {
            if (selectionMode === 'clone') {
              handleCloneVehicle(lead);
            } else {
              setSelectedLead(lead);
              setShowVehicleSelectionModal(false);
              setProposalCalculator(getProposalResult(lead));
              setShowProposalModal(true);
            }
          }}
        />
      )}

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
                    onChange={e => setNewUserForm({...newUserForm, phone: formatPhone(e.target.value)})}
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

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button 
                  onClick={handleCreateUser}
                  disabled={isCreatingUser}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Criar Usuário
                </button>
                <button 
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
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

        {isEditUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Editar Usuário</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={editUserForm.full_name}
                    onChange={(e) => setEditUserForm({...editUserForm, full_name: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cargo</label>
                  <select 
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <option value="user">Usuário (Vendedor)</option>
                    <option value="buyer">Comprador</option>
                    <option value="buyer_premium">Comprador Premium</option>
                    <option value="buyer_master">Comprador Master</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    console.log('Tentando atualizar usuário:', editingUser.id, editUserForm);
                    // Filtra apenas campos que existem na tabela profiles (full_name, phone, role)
                    const { email, ...dataToUpdate } = editUserForm;
                    const { error } = await supabase.from('profiles').update(dataToUpdate).eq('id', editingUser.id);
                    if (!error) {
                      refreshUsers();
                      setIsEditUserModalOpen(false);
                      setToast({ message: 'Usuário atualizado com sucesso!', type: 'success' });
                    } else {
                      console.error('Erro detalhado ao atualizar usuário:', error);
                      setToast({ message: `Erro ao atualizar usuário: ${error.message}`, type: 'error' });
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Salvar
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

      {selectedLead && (
        <LeadDetailsCard 
          lead={selectedLead} 
          onClose={() => {
            setSelectedLead(null);
            setShowWhatsAppBuyerModal(false);
          }} 
          forceShowWhatsAppBuyerModal={showWhatsAppBuyerModal}
          banks={banks}
          cooperativeDiscount={cooperativeDiscount}
          profitMarginPercentage={profitMarginPercentage}
          repairCosts={repairCosts}
          userRole={userProfile?.role}
          permissions={userProfile?.role?.includes('buyer') ? buyerPermissions : null}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          onClone={handleCloneVehicle}
          onRefresh={fetchData}
          fipeRules={fipeRules}
          jurosAtraso={jurosAtraso}
        />
      )}
      </motion.div>
      </main>
    </div>
  );
}

function BuyerPermissionsModal({ buyer, onClose }: { buyer: any, onClose: () => void }) {
  const [form, setForm] = useState({
    show_photos: true,
    show_price: true,
    show_plate: false,
    show_details: true,
    show_client_data: false,
    send_whatsapp: false,
    send_chat: false,
    send_fipe: false,
    send_banco: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      const { data } = await supabase
        .from('buyer_crm_permissions')
        .select('permissions')
        .eq('buyer_id', buyer.id)
        .is('lead_id', null)
        .limit(1);
      
      if (data && data.length > 0 && data[0].permissions) {
        setForm(data[0].permissions);
      } else {
        // Lógica de pré-definição baseada no cargo
        let permissions;
        if (buyer.role === 'buyer') permissions = { show_photos: true, show_price: false, show_plate: false, show_details: false, show_client_data: false, send_whatsapp: false, send_chat: true, send_fipe: false, send_banco: false };
        else if (buyer.role === 'buyer_premium') permissions = { show_photos: true, show_price: true, show_plate: true, show_details: true, show_client_data: false, send_whatsapp: false, send_chat: true, send_fipe: true, send_banco: true };
        else if (buyer.role === 'buyer_master') permissions = { show_photos: true, show_price: true, show_plate: true, show_details: true, show_client_data: true, send_whatsapp: true, send_chat: true, send_fipe: true, send_banco: true };
        else permissions = { show_photos: true, show_price: true, show_plate: false, show_details: true, show_client_data: false, send_whatsapp: false, send_chat: false, send_fipe: false, send_banco: false };
        setForm(permissions);
      }
      setLoading(false);
    };
    fetchPermissions();
  }, [buyer.id, buyer.role]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('buyer_crm_permissions')
        .select('id')
        .eq('buyer_id', buyer.id)
        .is('lead_id', null)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update
        const { error } = await supabase
          .from('buyer_crm_permissions')
          .update({ 
            permissions: form,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('buyer_crm_permissions')
          .insert({ 
            buyer_id: buyer.id, 
            lead_id: null,
            permissions: form,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      
      alert('Permissões salvas com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Carregando...</div>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
        <h3 className="text-xl font-bold">Permissões para {buyer.email}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-bold text-sm">Ver Fotos</span>
            <input type="checkbox" checked={form.show_photos} onChange={e => setForm({...form, show_photos: e.target.checked})} className="w-5 h-5 accent-slate-900" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-bold text-sm">Ver Preço</span>
            <input type="checkbox" checked={form.show_price} onChange={e => setForm({...form, show_price: e.target.checked})} className="w-5 h-5 accent-slate-900" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-bold text-sm">Ver Placa</span>
            <input type="checkbox" checked={form.show_plate} onChange={e => setForm({...form, show_plate: e.target.checked})} className="w-5 h-5 accent-slate-900" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-bold text-sm">Ver Detalhes Técnicos</span>
            <input type="checkbox" checked={form.show_details} onChange={e => setForm({...form, show_details: e.target.checked})} className="w-5 h-5 accent-slate-900" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-bold text-sm">Dados do Cliente</span>
            <input type="checkbox" checked={form.show_client_data} onChange={e => setForm({...form, show_client_data: e.target.checked})} className="w-5 h-5 accent-slate-900" />
          </div>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Configurações de Envio</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.send_whatsapp} onChange={e => setForm({...form, send_whatsapp: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-xs font-bold">WhatsApp</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.send_chat} onChange={e => setForm({...form, send_chat: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-xs font-bold">Chat Interno</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.send_fipe} onChange={e => setForm({...form, send_fipe: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-xs font-bold">Dados FIPE</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.send_banco} onChange={e => setForm({...form, send_banco: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-xs font-bold">Dados Banco</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar
            </button>
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
