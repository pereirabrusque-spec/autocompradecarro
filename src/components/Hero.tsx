import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';

export default function Hero() {
  const { assets } = useAssets();
  const bgImage = assets['hero_bg'] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1920";

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Car in desert" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="inline-block px-4 py-1.5 mb-8 text-sm font-black tracking-widest text-white uppercase bg-red-600 rounded-lg">
            RESOLUÇÃO IMEDIATA
          </span>
          
          <h1 className="font-display text-6xl md:text-9xl font-black mb-8 leading-[0.9] tracking-tighter">
            <span className="text-red-600">Transforme</span> <span className="text-green-500">seu</span><br />
            <span className="text-white">problema</span> <span className="text-red-600">em</span><br />
            <span className="text-green-500">dinheiro</span> <span className="text-white">vivo</span><br />
            <span className="text-red-600">agora.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl font-medium leading-relaxed">
            Especialistas em veículos com dívidas, financiamento atrasado, motor estourado ou batidos. Assumimos a burocracia e limpamos seu nome.
          </p>

          <button 
            onClick={() => window.location.href = '/vender'}
            className="btn-orange text-xl py-6 px-12 group"
          >
            QUERO MINHA PROPOSTA AGORA
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
