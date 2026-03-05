import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rafael Alves',
    location: 'São Paulo/SP',
    text: 'Meu carro estava com busca e apreensão. Eles resolveram tudo rápido e ainda recebi um valor justo. Confiança total!',
    avatar: 'https://i.pravatar.cc/150?u=rafael'
  },
  {
    name: 'André Silva',
    location: 'Campinas/SP',
    text: 'Bati o carro e o conserto ficava inviável. Vendi para eles no estado em que estava e o dinheiro caiu na hora.',
    avatar: 'https://i.pravatar.cc/150?u=andre_man'
  },
  {
    name: 'Jessica Luiza',
    location: 'Curitiba/PR',
    text: 'Estava com o financiamento atrasado há meses. Assumiram a dívida e limparam meu nome. Excelente serviço.',
    avatar: 'https://i.pravatar.cc/150?u=jessica_woman'
  },
  {
    name: 'Mariana Costa',
    location: 'Belo Horizonte/MG',
    text: 'Vendi minha moto com motor fundido. Não achei que conseguiria algo por ela, mas me pagaram super bem.',
    avatar: 'https://i.pravatar.cc/150?u=mariana_woman'
  },
  {
    name: 'Fernando Silva',
    location: 'Recife/PE',
    text: 'Tinha um caminhão parado no pátio dando prejuízo. Eles vieram com o guincho, levaram e pagaram à vista.',
    avatar: 'https://i.pravatar.cc/150?u=fernando'
  },
  {
    name: 'Juliana Lima',
    location: 'Salvador/BA',
    text: 'Meu carro tinha bloqueio judicial (Renajud). A equipe jurídica deles é fantástica, resolveram tudo sem dor de cabeça.',
    avatar: 'https://i.pravatar.cc/150?u=juliana'
  },
  {
    name: 'Ricardo Gomes',
    location: 'Porto Alegre/RS',
    text: 'Compraram minha frota de veículos com problemas mecânicos. Negociação transparente e pagamento rápido.',
    avatar: 'https://i.pravatar.cc/150?u=ricardo'
  },
  {
    name: 'Beatriz Rocha',
    location: 'Fortaleza/CE',
    text: 'Renegociaram minha dívida com o banco e compraram meu carro. Fiquei livre do problema e com dinheiro no bolso.',
    avatar: 'https://i.pravatar.cc/150?u=beatriz'
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl font-black mb-6">O que dizem nossos clientes</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">Histórias reais de quem resolveu seus problemas automotivos conosco.</p>
        </div>

        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-8 no-scrollbar">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[280px] md:min-w-[350px] lg:min-w-0 snap-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-slate-100 group-hover:text-slate-200 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              
              <p className="text-slate-600 mb-8 italic leading-relaxed">"{t.text}"</p>
              
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
