import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fuel, Gauge, Settings2, Heart, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Car } from '../types';
import { supabase } from '../lib/supabase';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leads_veiculos').insert([{
        cliente_nome: formData.name,
        email: formData.email,
        telefone: formData.phone,
        marca: car.brand,
        modelo: car.model,
        ano_modelo: car.year,
        preco_cliente: car.price,
        status: 'novo',
        observacoes: `Interesse no veículo ID: ${car.id}`
      }]);

      if (!error) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setIsSuccess(false);
          setFormData({ name: '', email: '', phone: '' });
        }, 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <button className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
            <Heart className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
              {car.year}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{car.brand}</h3>
              <h2 className="font-display text-xl font-bold text-slate-900">{car.model}</h2>
            </div>
            <div className="text-right">
              <p className="text-accent font-display text-xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-2xl">
              <Gauge className="w-4 h-4 text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500 font-medium">{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-2xl">
              <Fuel className="w-4 h-4 text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500 font-medium">{car.fuel}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-2xl">
              <Settings2 className="w-4 h-4 text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500 font-medium">{car.transmission}</span>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-accent transition-colors"
          >
            Tenho Interesse
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display text-2xl font-bold">Tenho Interesse</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isSuccess ? (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Sucesso!</h4>
                    <p className="text-slate-500">Nossa equipe entrará em contato em breve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Veículo Selecionado</p>
                      <p className="font-bold text-slate-900">{car.brand} {car.model}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nome Completo</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">E-mail</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Telefone / WhatsApp</label>
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Interesse'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
