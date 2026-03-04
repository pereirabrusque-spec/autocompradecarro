import React from 'react';
import { motion } from 'motion/react';
import { useAssets } from '../lib/assetsContext';

export default function TriggersSection() {
  const { banners } = useAssets();
  const triggers = banners.filter(b => b.tipo.startsWith('trigger'));

  if (triggers.length === 0) return null;

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold mb-4">Por que vender para a AutoCompra?</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Oferecemos as melhores condições do mercado para você resolver seu problema hoje mesmo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {triggers.map((trigger, i) => (
            <motion.div
              key={trigger.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={trigger.url} 
                  alt={trigger.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-bold text-white">{trigger.title}</h3>
                </div>
              </div>
              <div className="p-8">
                <p className="text-slate-500 leading-relaxed">{trigger.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
