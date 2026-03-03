import React from 'react';
import { CarFront } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0b1b2b] text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <CarFront className="w-8 h-8 text-white" />
              <span className="font-display text-2xl font-bold tracking-tight">AutoCompra</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Compramos seu carro com a melhor avaliação do mercado. Pagamento rápido e seguro.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Links Rápidos</h4>
            <ul className="space-y-4 text-slate-400">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/admin" className="hover:text-white transition-colors">Área Administrativa</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Contato</h4>
            <ul className="space-y-4 text-slate-400">
              <li>contato@autocompra.com.br</li>
              <li>(11) 99999-9999</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Social & Parceiros</h4>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/10 text-center text-slate-500 text-sm">
          <p>© 2026 AutoCompra. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
