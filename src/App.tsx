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
import BuyerView from './components/BuyerView';
import TawkTo from './components/TawkTo';
import WhatsAppButton from './components/WhatsAppButton';
import ChatWidget from './components/ChatWidget';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [view, setView] = useState<'home' | 'admin' | 'buyer' | 'login' | 'forgot-password' | 'reset-password' | 'sell' | 'auth-callback'>('home');
  const { user, isAdmin, isBuyer, isLoading } = useAuth();
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

      if (path === '/auth/callback') {
        setView('auth-callback');
        // Redirection will happen in the renderContent or another useEffect
        return;
      }

      if (path === '/admin') {
        if (!user) {
          setView('login');
        } else if (isAdmin) {
          setView('admin');
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
    if (view === 'auth-callback' && !isLoading) {
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
  }, [view, isAdmin, isLoading]);

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
      case 'buyer':
        return (isBuyer || isAdmin) ? <BuyerView /> : null;
      case 'login':
        return <Login 
          onLogin={() => {
            if (isAdmin) window.location.href = '/admin';
            else if (isBuyer) window.location.href = '/comprar';
            else window.location.href = '/';
          }} 
          onForgotPassword={() => setView('forgot-password')} 
        />;
      case 'forgot-password':
        return <ForgotPassword onBack={() => setView('login')} />;
      case 'reset-password':
        return <ResetPassword />;
      case 'sell':
        return <SellCar />;
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
      {view !== 'admin' && view !== 'buyer' && <Navbar />}
      
      <main className="flex-grow">
        {renderContent()}
      </main>
      
      {view !== 'admin' && view !== 'buyer' && <Footer />}
      
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
