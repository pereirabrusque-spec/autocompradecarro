import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';

export default function Hero() {
  const { banners, settings } = useAssets();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all hero banners (keys starting with 'hero_bg')
  const heroBanners = banners
    .filter(b => b.tipo.startsWith('hero_bg'))
    .sort((a, b) => a.ordem - b.ordem);
    
  // Fallback if no assets found
  const hasBanners = heroBanners.length > 0;
  const currentBanner = hasBanners ? heroBanners[currentImageIndex] : null;
  const fallbackImage = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1920";

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    
    const timerDuration = parseInt(settings['HERO_TIMER'] || '5000', 10);
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroBanners.length);
    }, timerDuration);
    
    return () => clearInterval(interval);
  }, [heroBanners.length, settings]);

  return (
    <section 
      className="relative flex items-center overflow-hidden bg-black" 
      style={{ 
        height: settings['BANNER_HEIGHT'] || '100vh',
        minHeight: settings['BANNER_HEIGHT'] || '100vh' 
      }}
    >
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode='wait'>
          <motion.img 
            key={currentImageIndex}
            src={currentBanner ? currentBanner.url : fallbackImage} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            alt={currentBanner?.legenda || "Hero Background"} 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col justify-center h-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="inline-block px-3 py-1 mb-4 text-[10px] md:text-xs font-black tracking-widest text-white uppercase bg-red-600 rounded-lg">
            {currentBanner?.badge_text || 'SOLUÇÃO IMEDIATA'}
          </span>
          
          <h1 
            className="font-display text-4xl md:text-7xl lg:text-8xl font-black mb-4 leading-[0.9] tracking-tighter"
            dangerouslySetInnerHTML={{ __html: currentBanner?.title || `<span class="text-red-600">Transforme</span> <span class="text-green-500">seu</span><br />
            <span class="text-white">problema</span> <span class="text-red-600">em</span><br />
            <span class="text-green-500">dinheiro</span> <span class="text-white">vivo</span><br />
            <span class="text-red-600">agora.</span>` }}
          />

          <p className="text-base md:text-xl text-white/90 mb-8 max-w-2xl font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
            {currentBanner?.subtitle || currentBanner?.legenda || 'Especialistas em veículos com dívidas, financiamento atrasado, motor estourado ou batidos. Assumimos a burocracia e limpamos seu nome.'}
          </p>

          <button 
            onClick={() => window.location.href = currentBanner?.button_link || '/vender'}
            className="btn-orange text-sm md:text-xl py-3 md:py-5 px-6 md:px-10 group"
          >
            {currentBanner?.button_text || 'QUERO MINHA PROPOSTA AGORA'}
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
