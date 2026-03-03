import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, MessageSquare } from 'lucide-react';

export default function NegotiationSection() {
  return (
    <section className="py-20 bg-[#001a33] text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <Briefcase className="w-96 h-96 -mr-20 -mt-20" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-8">
            <Briefcase className="w-8 h-8 text-blue-400" />
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight">
            Especialistas em Renegociação de Dívidas Automotivas
          </h2>
          
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Seu veículo está com busca e apreensão, financiamento atrasado ou bloqueio judicial? Nós somos especialistas em negociação bancária. Podemos assumir sua dívida ou atuar como seus representantes para reduzir juros e quitar o débito com descontos de até 80%.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openSellModal'))}
              className="w-full sm:w-auto px-10 py-5 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
            >
              Quero Renegociar Minha Dívida
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
