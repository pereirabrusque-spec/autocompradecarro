import React from 'react';
import { motion } from 'motion/react';
import { DollarSign, ShieldCheck, Clock } from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Pagamento à Vista',
    desc: 'Receba o valor acordado imediatamente após a aprovação. Sem enrolação.',
    color: 'text-green-500',
    bg: 'bg-green-50'
  },
  {
    icon: ShieldCheck,
    title: 'Segurança Jurídica',
    desc: 'Contrato registrado em cartório. Assumimos a responsabilidade pelo veículo.',
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    icon: Clock,
    title: 'Resolução em 48h',
    desc: 'Do contato inicial ao dinheiro na conta, nosso processo é otimizado.',
    color: 'text-orange-500',
    bg: 'bg-orange-50'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-start gap-6"
            >
              <div className={`w-16 h-16 ${f.bg} rounded-2xl flex items-center justify-center`}>
                <f.icon className={`w-8 h-8 ${f.color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
