/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AssetsProvider, useAssets } from './lib/assetsContext';
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
import { supabase } from './lib/supabase';

function AppContent() {
  const [view, setView] = useState<'home' | 'admin' | 'login' | 'forgot-password' | 'reset-password' | 'sell'>('home');
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { settings } = useAssets();

  const primaryContact = settings['PRIMARY_CONTACT_METHOD'] || 'chat';
  const specialistAction = settings['SPECIALIST_BUTTON_ACTION'] || 'chat';
  const chatEnabled = settings['CHAT_ENABLED'] === 'true';
  const whatsappEnabled = settings['WHATSAPP_ENABLED'] === 'true';
  const tawkToEnabled = settings['TAWKTO_ENABLED'] === 'true';

  const showChat = (primaryContact === 'chat' || specialistAction === 'chat') && chatEnabled;
  const showWhatsApp = (primaryContact === 'whatsapp' || specialistAction === 'whatsapp') && whatsappEnabled;
  const showTawkTo = primaryContact === 'tawkto' && tawkToEnabled;

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (isAuthLoading) return;

      const path = window.location.pathname;
      if (path === '/admin') {
        if (!user) {
          setView('login');
        } else {
          const { data, error } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', user.email)
            .single();

          if (error || !data) {
            await supabase.auth.signOut();
            setView('login');
          } else {
            setView('admin');
          }
        }
      } else if (path === '/reset-password') {
        setView('reset-password');
      } else if (path === '/vender') {
        setView('sell');
      } else {
        setView('home');
      }
    };

    checkAdminAccess();
  }, [user, isAuthLoading]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setView('admin');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'admin':
        return <AdminDashboard />;
      case 'login':
        return <Login onLogin={handleLogin} onForgotPassword={() => setView('forgot-password')} />;
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
      <Navbar />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
      
      {/* Contact Widgets based on Primary Method */}
      {showChat && <ChatAssistant />}
      {showWhatsApp && <WhatsAppButton />}
      {showTawkTo && <TawkTo />}
      
      <SellModal />
    </div>
  );
}

export default function App() {
  return (
    <AssetsProvider>
      <AppContent />
    </AssetsProvider>
  );
}
