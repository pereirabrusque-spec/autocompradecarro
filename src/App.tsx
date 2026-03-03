/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AssetsProvider } from './lib/assetsContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CarGrid from './components/CarGrid';
import CreditAnalysis from './components/CreditAnalysis';
import NegotiationSection from './components/NegotiationSection';
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

export default function App() {
  const [view, setView] = useState<'home' | 'admin' | 'login' | 'forgot-password' | 'reset-password' | 'sell'>('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check URL to determine view
    const path = window.location.pathname;
    if (path === '/admin') {
      if (!user) setView('login');
      else setView('admin');
    } else if (path === '/reset-password') {
      setView('reset-password');
    } else if (path === '/vender') {
      setView('sell');
    } else {
      setView('home');
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setView('admin');
  };

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
            <Testimonials />
            <FipeSection />
            <FeaturesSection />
          </>
        );
    }
  };

  return (
    <AssetsProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {renderContent()}
        </main>
        <Footer />
        <ChatAssistant />
        <SellModal />
      </div>
    </AssetsProvider>
  );
}
