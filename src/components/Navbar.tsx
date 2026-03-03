import React from 'react';
import { CarFront, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <CarFront className="w-8 h-8 text-slate-900" />
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">AutoCompra</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-bold text-slate-900 hover:text-accent transition-colors">Home</a>
            <a href="/vender" className="text-sm font-bold text-slate-900 hover:text-accent transition-colors">Avaliar Carro</a>
            <a href="/admin" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Admin
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
