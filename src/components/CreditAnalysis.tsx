import React from 'react';
import { motion } from 'motion/react';

export default function CreditAnalysis() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Análise de Crédito em Tempo Real</h2>
              <p className="text-slate-500">Processando propostas na sua região...</p>
              
              <div className="mt-8 relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-green-500"
                />
              </div>
              <p className="mt-4 text-center text-sm text-slate-400 font-medium">
                Envie a foto do CRLV para finalizar e receber o valor na conta em 48h.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-black text-slate-900 mb-1">85%</div>
              <div className="text-green-500 font-black tracking-widest text-sm">QUASE LÁ!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
