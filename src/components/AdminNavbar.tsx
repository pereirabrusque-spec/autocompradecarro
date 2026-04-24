import React from 'react';
import { ShieldCheck, LayoutDashboard, Car, MessageCircle, Users, Settings, Key, Bot, Wallet, BarChart3, ImageIcon, Maximize2, Info, Database, Share2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminNavbar({ 
  activeTab, 
  setActiveTab, 
  conversations, 
  userProfile, 
  currentUser, 
  handleLogout 
}: any) {
  return (
    <header className="bg-slate-950 border-b border-white/5 sticky top-0 z-[100] shadow-2xl backdrop-blur-xl bg-opacity-90 shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1 overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.4)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="hidden xl:block">
              <h1 className="font-display text-lg font-black text-white leading-none tracking-tight">AUTO COMPRA</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mt-1">Admin Pro</p>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'dashboard', label: 'Início', icon: LayoutDashboard, roles: ['admin'] },
              { id: 'leads', label: 'Leads', icon: Car, roles: ['admin', 'buyer_premium', 'buyer_master', 'user', 'seller'] },
              { id: 'messages', label: 'Mensagens', icon: MessageCircle, badge: conversations.reduce((acc: any, curr: any) => acc + (curr.unread || 0), 0), roles: ['admin', 'user', 'seller'] },
              { id: 'crm_chat', label: 'CRM Chat', icon: MessageCircle, roles: ['admin', 'buyer', 'buyer_premium', 'buyer_master'] },
              { id: 'users', label: 'Equipe & CRM', icon: Users, roles: ['admin'] },
              { id: 'settings', label: 'Config', icon: Settings, roles: ['admin'] },
              { id: 'apis', label: 'APIs', icon: Key, roles: ['admin'] },
              { id: 'ai', label: 'IA', icon: Bot, roles: ['admin'] },
              { id: 'cooperatives', label: 'Cooperativas', icon: Wallet, roles: ['admin'] },
              { id: 'tags', label: 'Marketing', icon: BarChart3, roles: ['admin'] },
              { id: 'hero', label: 'Site', icon: ImageIcon, roles: ['admin'] },
              { id: 'assets', label: 'Fotos', icon: Maximize2, roles: ['admin'] },
              { id: 'footer', label: 'Rodapé', icon: Info, roles: ['admin'] },
              { id: 'logs', label: 'Logs', icon: Database, roles: ['admin'] },
            ].filter(tab => {
              const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'pereira.brusque@gmail.com';
              if (tab.id === 'ai') return isAdmin;
              return !tab.roles || tab.roles.includes(userProfile?.role) || currentUser?.email === 'pereira.brusque@gmail.com';
            }).map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 py-2.5 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap flex items-center gap-2.5 relative group ${
                  activeTab === tab.id 
                    ? 'bg-accent text-white shadow-[0_0_20px_rgba(242,125,38,0.3)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-accent'}`} />
                <span className="uppercase tracking-wider">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-slate-950 font-black">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 border border-white/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
            <button 
            onClick={() => window.location.href = '/'}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Ver Site"
          >
            <Share2 className="w-5 h-5" />
          </button>
            <button 
            onClick={handleLogout}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
