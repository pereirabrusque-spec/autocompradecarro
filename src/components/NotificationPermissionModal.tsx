import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/authContext';

export default function NotificationPermissionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only show if user is logged in and permission is default (not granted or denied)
    if (user && 'Notification' in window && Notification.permission === 'default') {
      // Small delay to not annoy immediately on load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAllow = async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Notificações ativadas!', {
          body: 'Você receberá alertas sobre suas negociações.',
          icon: '/favicon.ico'
        });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Optionally store in localStorage to not ask again for a session
    sessionStorage.setItem('notification_dismissed', 'true');
  };

  // Check if dismissed in this session
  if (sessionStorage.getItem('notification_dismissed') === 'true') {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-top sm:justify-center pointer-events-none p-4 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-accent">
                <Bell className="w-8 h-8" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Ative as Notificações
              </h3>
              
              <p className="text-sm text-slate-500 mb-6">
                Não perca nenhuma mensagem importante sobre a negociação do seu veículo. Receba alertas em tempo real.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Agora não
                </button>
                <button
                  onClick={handleAllow}
                  className="flex-1 py-3 px-4 bg-accent text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-sm shadow-lg shadow-accent/20"
                >
                  Ativar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
