import React, { useState, useEffect } from 'react';
import { CarFront, LayoutDashboard, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
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

            <a href="/admin" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Admin
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
