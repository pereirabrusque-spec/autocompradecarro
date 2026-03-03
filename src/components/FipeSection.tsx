import React from 'react';
import { motion } from 'motion/react';

export default function FipeSection() {
  return (
    <section className="py-24 bg-[#003366] text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="font-display text-5xl md:text-7xl font-black mb-8 leading-tight">
          Quer saber o valor real?
        </h2>
        
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Utilizamos a Tabela FIPE oficial como base para todas as nossas negociações. Transparência total.
        </p>
        
        <button 
          onClick={() => window.location.href = '/vender'}
          className="px-12 py-6 bg-blue-500 text-white rounded-xl font-black text-xl hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/40"
        >
          Simular Tabela FIPE Agora
        </button>
      </div>
    </section>
  );
}
