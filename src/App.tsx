/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AssetsProvider, useAssets } from './lib/assetsContext';
import { AuthProvider, useAuth } from './lib/authContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CarGrid from './components/CarGrid';
import CreditAnalysis from './components/CreditAnalysis';
import NegotiationSection from './components/NegotiationSection';
import TriggersSection from './components/TriggersSection';
import Testimonials from './components/Testimonials';
import FipeSection from './components/FipeSection';
import FeaturesSection from './components/FeaturesSection';
import ChatAssistant from './components/ChatAssistant';
import GlobalAIResponder from './components/GlobalAIResponder';
import Footer from './components/Footer';
import SellModal from './components/SellModal';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SellCar from './components/SellCar';
import BuyerView from './components/BuyerView';
import TawkTo from './components/TawkTo';
import WhatsAppButton from './components/WhatsAppButton';
import ChatWidget from './components/ChatWidget';
import InternalChat from './components/InternalChat';
import FloatingPurchasingChat from './components/FloatingPurchasingChat';
import BackgroundAIManager from './components/crm/BackgroundAIManager';
import AuthModal from './components/AuthModal';
import { GoogleTags } from './components/GoogleTags';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import ThankYou from './components/ThankYou';
import { AIService } from './services/aiService';
import { authManager } from './lib/authManager';

function AppContent() {
  const [view, setView] = useState<'home' | 'admin' | 'buyer' | 'login' | 'forgot-password' | 'reset-password' | 'sell' | 'auth-callback' | 'thank-you'>('home');
  const { user, profile, isAdmin, isBuyer, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Rescue timeout for iOS/Slow networks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('[App] Rescue timeout triggered - forcing load');
        setIsLoading(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);
  const { settings } = useAssets();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Tenta carregar tema e dados básicos de forma segura para evitar white screen no iOS
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
    } catch (e) {
      console.warn('[App] LocalStorage inacessível:', e);
    }
  }, []);

  const isBuyerMaster = profile?.role === 'buyer_master';

  const specialistButtonEnabled = settings['SPECIALIST_BUTTON_ENABLED'] === 'true';
  const primaryContact = settings['PRIMARY_CONTACT_METHOD'] || 'chat';
  const specialistAction = settings['SPECIALIST_BUTTON_ACTION'] || 'chat';
  const chatEnabled = settings['CHAT_ENABLED'] === 'true';
  const whatsappEnabled = settings['WHATSAPP_ENABLED'] === 'true';
  const tawkToEnabled = settings['TAWKTO_ENABLED'] === 'true';

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [purchasingContext, setPurchasingContext] = useState<string>('Chat de Compras');

  useEffect(() => {
    // Trigger initial check and setup interval for 6-hour health check
    // The logic for 6h check is inside getActiveKeys
    const checkAPIs = () => {
      AIService.getActiveKeys().catch(console.error);
    };
    
    checkAPIs();
    const interval = setInterval(checkAPIs, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  const showChat = (primaryContact === 'chat' || (specialistButtonEnabled && specialistAction === 'chat')) && chatEnabled;
  const showWhatsApp = (primaryContact === 'whatsapp' || (specialistButtonEnabled && specialistAction === 'whatsapp')) && whatsappEnabled;
  const showTawkTo = primaryContact === 'tawkto' && tawkToEnabled;

  const buyerSendSettings = (() => {
    try {
      return settings['BUYER_SEND_SETTINGS'] ? JSON.parse(settings['BUYER_SEND_SETTINGS']) : {};
    } catch (e) {
      console.warn('[App] Erro ao parsear BUYER_SEND_SETTINGS:', e);
      return {};
    }
  })();
  const isWhatsAppEnabledInCRM = buyerSendSettings.whatsapp !== false;

  useEffect(() => {
    if (user && !profile?.role?.includes('admin')) {
      const createColdLead = async () => {
        // Check if lead already exists for this email
        const { data: existingLead } = await supabase
          .from('leads_veiculos')
          .select('id')
          .eq('email', user.email)
          .limit(1)
          .maybeSingle();

        if (!existingLead) {
          console.log('[App] Creating cold lead for logged user:', user.email);
          await supabase
            .from('leads_veiculos')
            .insert([{ 
              cliente_nome: user.user_metadata?.full_name || profile?.full_name || 'Cliente', 
              email: user.email,
              telefone: profile?.phone || user.user_metadata?.phone || '00000000000',
              status: 'frio'
            }]);
        }
      };
      createColdLead();
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      const updateLastLogin = async () => {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      };
      updateLastLogin();
      const interval = setInterval(updateLastLogin, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    console.log('[DEBUG] Verificando rota:', window.location.pathname, 'user:', user, 'isLoading:', isLoading);
    const checkRoute = () => {
      const path = window.location.pathname;
      
      if (isLoading) return;

      if (path === '/auth/callback') {
        setView('auth-callback');
        // Redirection will happen in the renderContent or another useEffect
        return;
      }

      if (path === '/admin') {
        if (!user) {
          console.log('[DEBUG] Usuário não logado, redirecionando para login');
          setView('login');
        } else if (isAdmin) {
          setView('admin');
        } else if (isBuyer) {
          console.log('[DEBUG] Usuário é comprador em /admin, redirecionando para /comprar');
          window.history.pushState({}, '', '/comprar');
          setView('buyer');
        } else {
          window.history.pushState({}, '', '/');
          setView('home');
        }
      } else if (path === '/comprar') {
        if (!user) {
          setView('login');
        } else if (isBuyer || isAdmin) {
          setView('buyer');
        } else {
          window.history.pushState({}, '', '/');
          setView('home');
        }
      } else if (path === '/reset-password') {
        setView('reset-password');
      } else if (path === '/vender') {
        setView('sell');
      } else if (path === '/obrigado') {
        setView('thank-you');
      } else {
        if (isAdmin && (path === '/' || path === '')) {
          window.history.pushState({}, '', '/admin');
          setView('admin');
        } else if (isBuyer && (path === '/' || path === '')) {
          window.history.pushState({}, '', '/comprar');
          setView('buyer');
        } else {
          setView('home');
        }
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    console.log('[DEBUG] handleAuthCallback view:', view, 'isLoading:', isLoading);
    const handleAuthCallback = async () => {
      if (view === 'auth-callback' && !isLoading) {
        console.log('[AUTH-DEBUG] Usando authManager para processar callback...');
        const result = await authManager.handleCallback();
        
        if (!result.success) {
          console.error('[AUTH-DEBUG] Erro no callback:', result.error);
          setView('login');
        } else {
          console.log('[AUTH-DEBUG] Sessão trocada com sucesso via authManager!');
          if (isAdmin) {
            window.history.pushState({}, '', '/admin');
            setView('admin');
          } else if (isBuyer) {
            window.history.pushState({}, '', '/comprar');
            setView('buyer');
          } else {
            window.history.pushState({}, '', '/');
            setView('home');
          }
        }
      }
    };
    handleAuthCallback();
  }, [view, isAdmin, isBuyer, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden relative">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/5 border-t-accent rounded-full animate-spin"></div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-white font-bold text-lg tracking-tight">CARREGANDO</h2>
            <div className="flex gap-1 justify-center">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'admin':
        if (isAdmin) return <AdminDashboard />;
        // Se cair aqui (mudou role e o useEffect ainda não disparou), mostra um loader ou redireciona
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;
      case 'buyer':
        return (isBuyer || isAdmin) ? <BuyerView /> : null;
      case 'login':
        return <Login 
          onLogin={() => {
            // Force a reload or state update to trigger redirection logic
            window.location.reload();
          }} 
          onForgotPassword={() => setView('forgot-password')} 
        />;
      case 'forgot-password':
        return <ForgotPassword onBack={() => setView('login')} />;
      case 'reset-password':
        return <ResetPassword />;
      case 'sell':
        return <SellCar />;
      case 'thank-you':
        return <ThankYou />;
      case 'auth-callback':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        );
      default:
        return (
          <>
            <Hero />
            <CreditAnalysis />
            <CarGrid setPurchasingContext={setPurchasingContext} />
            <NegotiationSection />
            <TriggersSection />
            <Testimonials />
            <FipeSection />
            <FeaturesSection />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {view !== 'admin' && view !== 'buyer' && <Navbar />}
      
      <main className="flex-grow">
        {renderContent()}
      </main>
      
      {view !== 'admin' && view !== 'buyer' && <Footer />}
      
      <SellModal />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <NotificationPermissionModal />
      
      {/* Floating Chat Buttons */}
      {view !== 'admin' && view !== 'buyer' && (
        <div className="fixed md:bottom-6 bottom-[calc(2rem+env(safe-area-inset-bottom))] right-6 flex flex-col gap-4 z-[50]">
          {/* Main Chat Assistant Button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-accent text-white p-4 rounded-full shadow-2xl hover:bg-accent/90 transition-all flex items-center justify-center"
            title="Falar com Especialista"
            id="main-chat-button"
          >
            <MessageCircle className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Real-time Chat Widget (Bottom Right) */}
      {view !== 'admin' && !profile?.role?.includes('buyer') && (
        <ChatAssistant 
          isOpen={isChatOpen} 
          onOpen={() => setIsChatOpen(true)} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {user && view !== 'admin' && profile?.role === 'seller' && (
        <InternalChat 
          hideFloatingButton={false} 
          leadTitle="Suporte ao Vendedor"
        />
      )}
      
      {user && <BackgroundAIManager />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AssetsProvider>
        <GoogleTags />
        <AppContent />
      </AssetsProvider>
    </AuthProvider>
  );
}
