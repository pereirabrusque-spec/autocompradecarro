import React from 'react';
import { motion } from 'motion/react';
import { useAssets } from '../lib/assetsContext';

export default function CarGrid() {
  const { banners } = useAssets();

  // Filter and sort card assets
  const vehicles = banners
    .filter(b => b.tipo.startsWith('card_'))
    .sort((a, b) => a.ordem - b.ordem);

  // Fallback colors if not specified (could be added to DB later)
  const colors = ['bg-red-600', 'bg-green-600', 'bg-orange-600'];

  if (vehicles.length === 0) return null;

  return (
    <section className="py-20 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[32px] overflow-hidden card-shadow flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={v.url} 
                  alt={v.legenda} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest">
                  {v.badge_text || 'VEÍCULO'}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div 
                  onClick={() => window.location.href = v.button_link || '/vender'}
                  className={`mt-auto ${colors[i % colors.length]} text-white p-6 rounded-2xl text-center font-black text-sm leading-tight min-h-[80px] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  {(v.button_text || v.legenda).toUpperCase()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
