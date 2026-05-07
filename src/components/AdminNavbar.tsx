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
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'pereira.brusque@gmail.com';
  
  const allTabs = [
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
    if (tab.id === 'ai') return isAdmin;
    return !tab.roles || tab.roles.includes(userProfile?.role) || isAdmin;
  });

  const row1Tabs = allTabs.slice(0, 8);
  const row2Tabs = allTabs.slice(8);

  return (
    <header className="bg-slate-950 border-b border-white/5 sticky top-0 z-[100] shadow-2xl backdrop-blur-xl bg-opacity-95 shrink-0 px-4 sm:px-6 lg:px-8 py-2 md:py-3 font-sans">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-between">
        
        {/* LOGO E INFOS TIPO 1 LINHA */}
        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.4)]">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-sm md:text-lg font-black text-white leading-none tracking-tight">AUTO COMPRA</h1>
              <p className="text-[8px] md:text-[10px] text-accent font-bold uppercase tracking-[0.15em] mt-1">Admin Pro</p>
            </div>
          </div>
          <div className="h-6 md:h-8 w-px bg-white/10 mx-2"></div>
        </div>

        {/* MENU DUPLO (REDUZIDO EM ALTURA) */}
        <div className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
          {/* LINHA 1 */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
            {row1Tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-3 py-1.5 rounded-lg font-bold text-[9px] md:text-[10px] transition-all whitespace-nowrap flex items-center gap-2 relative group flex-1 justify-center min-w-[80px] ${
                  activeTab === tab.id 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-accent'}`} />
                <span className="uppercase tracking-tight">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full border border-slate-950 font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* LINHA 2 */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
            {row2Tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-3 py-1.5 rounded-lg font-bold text-[9px] md:text-[10px] transition-all whitespace-nowrap flex items-center gap-2 relative group flex-1 justify-center min-w-[80px] ${
                  activeTab === tab.id 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-accent'}`} />
                <span className="uppercase tracking-tight">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full border border-slate-950 font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* LOGOUT / VISUALIZAR SITE */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center pb-2 md:pb-0">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
            title="Ver Site"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-white/5"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
