/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
import Footer from './components/Footer';
import SellModal from './components/SellModal';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SellCar from './components/SellCar';
import TawkTo from './components/TawkTo';
import WhatsAppButton from './components/WhatsAppButton';
import ChatWidget from './components/ChatWidget';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [view, setView] = useState<'home' | 'admin' | 'login' | 'forgot-password' | 'reset-password' | 'sell'>('home');
  const { user, isAdmin, isLoading } = useAuth();
  const { settings } = useAssets();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const primaryContact = settings['PRIMARY_CONTACT_METHOD'] || 'chat';
  const specialistAction = settings['SPECIALIST_BUTTON_ACTION'] || 'chat';
  const chatEnabled = settings['CHAT_ENABLED'] === 'true';
  const whatsappEnabled = settings['WHATSAPP_ENABLED'] === 'true';
  const tawkToEnabled = settings['TAWKTO_ENABLED'] === 'true';

  const showChat = (primaryContact === 'chat' || specialistAction === 'chat') && chatEnabled;
  const showWhatsApp = (primaryContact === 'whatsapp' || specialistAction === 'whatsapp') && whatsappEnabled;
  const showTawkTo = primaryContact === 'tawkto' && tawkToEnabled;

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      
      if (isLoading) return;

      if (path === '/admin') {
        if (!user) {
          // If accessing admin and not logged in, show login
          setView('login');
        } else if (isAdmin) {
          // If admin, show dashboard
          setView('admin');
        } else {
          // If logged in but not admin, redirect to home
          window.history.pushState({}, '', '/');
          setView('home');
        }
      } else if (path === '/reset-password') {
        setView('reset-password');
      } else if (path === '/vender') {
        // Protect /vender route? User said "se clicar para mandar o formulario tem que logar"
        // Let's allow viewing but block submission inside the component, or block access here.
        // User request: "se clicar para mandar o formulario tem que logar" -> implies action, not necessarily page view.
        // But let's keep it accessible and handle auth on submit for better UX (conversion).
        setView('sell');
      } else {
        setView('home');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, [user, isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'admin':
        return isAdmin ? <AdminDashboard /> : null;
      case 'login':
        return <Login onLogin={() => window.location.href = '/admin'} onForgotPassword={() => setView('forgot-password')} />;
      case 'forgot-password':
        return <ForgotPassword onBack={() => setView('login')} />;
      case 'reset-password':
        return <ResetPassword />;
      case 'sell':
        return <SellCar />;
      default:
        return (
          <>
            <Hero />
            <CreditAnalysis />
            <CarGrid />
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
      {view !== 'admin' && <Navbar />}
      
      <main className="flex-grow">
        {renderContent()}
      </main>
      
      {view !== 'admin' && <Footer />}
      
      {/* Contact Widgets */}
      {showChat && <ChatAssistant />}
      {showWhatsApp && <WhatsAppButton />}
      {showTawkTo && <TawkTo />}
      
      {/* Real-time Chat Widget for logged users */}
      <ChatWidget />
      
      <SellModal />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AssetsProvider>
        <AppContent />
      </AssetsProvider>
    </AuthProvider>
  );
}
