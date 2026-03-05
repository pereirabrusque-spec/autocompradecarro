import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import AuthModal from './AuthModal';
import { CarFront, LayoutDashboard, Phone, User, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappButtonText, setWhatsappButtonText] = useState('WhatsApp');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data) {
          const waEnabledSetting = data.find((s: any) => s.key === 'WHATSAPP_ENABLED');
          const waNumberSetting = data.find((s: any) => s.key === 'WHATSAPP_NUMBER');
          const waTextSetting = data.find((s: any) => s.key === 'WHATSAPP_BUTTON_TEXT');
          
          if (waEnabledSetting) {
            setWhatsappEnabled(waEnabledSetting.value === 'true');
          }
          if (waNumberSetting) {
            setWhatsappNumber(waNumberSetting.value);
          }
          if (waTextSetting) {
            setWhatsappButtonText(waTextSetting.value);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <CarFront className="w-8 h-8 text-slate-900" />
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900">AutoCompra</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-sm font-bold text-slate-900 hover:text-accent transition-colors">Home</a>
              <a href="/vender" className="text-sm font-bold text-slate-900 hover:text-accent transition-colors">Avaliar Carro</a>
              
              {whatsappEnabled && whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" className="px-6 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {whatsappButtonText}
                </a>
              )}

              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span>{profile?.full_name?.split(' ')[0] || 'Minha Conta'}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                      {isAdmin && (
                        <a 
                          href="/admin" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-accent transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Painel Admin
                        </a>
                      )}
                      <button 
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-accent transition-colors"
                >
                  <User className="w-4 h-4" />
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
