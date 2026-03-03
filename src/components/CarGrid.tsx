import React from 'react';
import { motion } from 'motion/react';
import { useAssets } from '../lib/assetsContext';

export default function CarGrid() {
  const { assets } = useAssets();

  const vehicles = [
    // CARROS
    {
      type: 'CARRO',
      image: assets['card_carro_1'] || 'https://images.unsplash.com/photo-1597328290883-50c5787b7c7e?auto=format&fit=crop&q=80&w=800',
      message: 'Transforme seu prejuízo em dinheiro vivo agora.',
      color: 'bg-red-600'
    },
    {
      type: 'CARRO',
      image: assets['card_carro_2'] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800',
      message: 'Motor estourado? Nós compramos e assumimos o conserto.',
      color: 'bg-red-600'
    },
    {
      type: 'CARRO',
      image: assets['card_carro_3'] || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
      message: 'Financiado e atrasado? Saia da dívida agora.',
      color: 'bg-green-600'
    },
    {
      type: 'CARRO',
      image: assets['card_carro_4'] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800',
      message: 'Carro bloqueado? Liberte seu nome e receba por ele.',
      color: 'bg-green-600'
    },
    {
      type: 'CARRO',
      image: assets['card_carro_5'] || 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&q=80&w=800',
      message: 'Seu carro parado está perdendo valor. Venda hoje!',
      color: 'bg-orange-600'
    },
    // MOTOS
    {
      type: 'MOTO',
      image: assets['card_moto_1'] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800',
      message: 'Moto batida não precisa ser sucata. Faça um orçamento.',
      color: 'bg-red-600'
    },
    {
      type: 'MOTO',
      image: assets['card_moto_2'] || 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80&w=800',
      message: 'Pagamos preço justo mesmo com motor quebrado.',
      color: 'bg-red-600'
    },
    {
      type: 'MOTO',
      image: assets['card_moto_3'] || 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800',
      message: 'Troque sua moto com problema por dinheiro no bolso.',
      color: 'bg-orange-600'
    },
    {
      type: 'MOTO',
      image: assets['card_moto_4'] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
      message: 'Recuperamos seu investimento em motos sinistradas.',
      color: 'bg-orange-600'
    },
    {
      type: 'MOTO',
      image: assets['card_moto_5'] || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800',
      message: 'Evite a busca e apreensão. Nós quitamos para você.',
      color: 'bg-green-600'
    },
    // CAMINHÕES
    {
      type: 'CAMINHÃO',
      image: assets['card_truck_1'] || 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800',
      message: 'Caminhão batido? Resolvemos a burocracia e compramos.',
      color: 'bg-red-600'
    },
    {
      type: 'CAMINHÃO',
      image: assets['card_truck_2'] || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
      message: 'Caminhão parado é prejuízo. Nós assumimos a reforma.',
      color: 'bg-red-600'
    },
    {
      type: 'CAMINHÃO',
      image: assets['card_truck_3'] || 'https://images.unsplash.com/photo-1591768793355-74d74b262bb4?auto=format&fit=crop&q=80&w=800',
      message: 'Problemas com cooperativa? Saiba como limpar seu nome.',
      color: 'bg-green-600'
    },
    {
      type: 'CAMINHÃO',
      image: assets['card_truck_4'] || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800',
      message: 'Logística própria para retirar seu veículo onde estiver.',
      color: 'bg-orange-600'
    },
    {
      type: 'CAMINHÃO',
      image: assets['card_truck_5'] || 'https://images.unsplash.com/photo-1501700493717-9ae98220b74b?auto=format&fit=crop&q=80&w=800',
      message: 'Antecipe o valor do seu caminhão antes do leilão.',
      color: 'bg-orange-600'
    },
    // MIX
    {
      type: 'MIX',
      image: assets['card_mix_1'] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
      message: 'Compramos frotas com dívidas ou problemas mecânicos.',
      color: 'bg-orange-600'
    },
    {
      type: 'MIX',
      image: assets['card_mix_2'] || 'https://images.unsplash.com/photo-1530046339160-ce3e5b0c7a2f?auto=format&fit=crop&q=80&w=800',
      message: 'Análise técnica justa. Pagamos o que seu carro vale.',
      color: 'bg-orange-600'
    },
    {
      type: 'MIX',
      image: assets['card_mix_3'] || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800',
      message: 'CONSULTE A TABELA FIPE E RECEBA NOSSA OFERTA.',
      color: 'bg-orange-600'
    },
    {
      type: 'MIX',
      image: assets['card_mix_4'] || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
      message: 'ASSUMIMOS SUA DÍVIDA NO BANCO. NOME LIMPO JÁ.',
      color: 'bg-green-600'
    },
    {
      type: 'MIX',
      image: assets['card_mix_5'] || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800',
      message: 'MAIS DE 1.000 NEGOCIAÇÕES FEITAS. VEJA A PROPOSTA.',
      color: 'bg-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[32px] overflow-hidden card-shadow flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={v.image} 
                  alt={v.message} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest">
                  {v.type}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div 
                  onClick={() => window.location.href = '/vender'}
                  className={`mt-auto ${v.color} text-white p-6 rounded-2xl text-center font-black text-sm leading-tight min-h-[80px] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  {v.message.toUpperCase()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
