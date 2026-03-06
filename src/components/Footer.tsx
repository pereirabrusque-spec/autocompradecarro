import React, { useState } from 'react';
import { CarFront, Instagram, Facebook, MessageCircle, Youtube, Linkedin, Video } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';
import { useAuth } from '../lib/authContext';
import AuthModal from './AuthModal';

export default function Footer() {
  const { settings, banners } = useAssets();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const footerText = settings['FOOTER_TEXT'] || 'Compramos seu carro com a melhor avaliação do mercado. Pagamento rápido e seguro.';
  const footerCopyright = settings['FOOTER_COPYRIGHT'] || '© 2026 AutoCompra. Todos os direitos reservados.';
  const contactEmail = settings['CONTACT_EMAIL'] || 'contato@autocompra.com.br';
  const contactPhone = settings['CONTACT_PHONE'] || '(11) 99999-9999';
  const socialInstagram = settings['SOCIAL_INSTAGRAM'];
  const socialFacebook = settings['SOCIAL_FACEBOOK'];
  const socialYoutube = settings['SOCIAL_YOUTUBE'];
  const socialTiktok = settings['SOCIAL_TIKTOK'];
  const socialLinkedin = settings['SOCIAL_LINKEDIN'];

  const specialistEnabled = settings['SPECIALIST_BUTTON_ENABLED'] === 'true';
  const specialistText = settings['SPECIALIST_BUTTON_TEXT'] || 'Falar com Especialista';
  const specialistLink = settings['SPECIALIST_BUTTON_LINK'] || '#';
  const specialistAction = settings['SPECIALIST_BUTTON_ACTION'] || 'whatsapp';

  const handleSpecialistClick = (e: React.MouseEvent) => {
    if (specialistAction === 'chat') {
      e.preventDefault();
      if (!user) {
        setShowAuthModal(true);
      } else {
        window.dispatchEvent(new CustomEvent('open-chat'));
      }
    }
  };

  const partners = banners.filter(b => b.tipo.startsWith('partner_'));

  return (
    <footer className="bg-[#0b1b2b] text-white py-20 relative">
      {specialistEnabled && (
        <a 
          href={specialistAction === 'whatsapp' ? specialistLink : '#'} 
          target={specialistAction === 'whatsapp' ? "_blank" : undefined} 
          rel={specialistAction === 'whatsapp' ? "noopener noreferrer" : undefined}
          onClick={handleSpecialistClick}
          className="fixed bottom-8 left-8 z-50 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-green-700 transition-all hover:scale-105 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-bold text-sm uppercase tracking-wide">{specialistText}</span>
        </a>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <CarFront className="w-8 h-8 text-white" />
              <span className="font-display text-2xl font-bold tracking-tight">AutoCompra</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {footerText}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Links Rápidos</h4>
            <ul className="space-y-4 text-slate-400">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/vender" className="hover:text-white transition-colors">Vender Meu Carro</a></li>
              <li><a href="/admin" className="hover:text-white transition-colors">Área Administrativa</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Contato</h4>
            <ul className="space-y-4 text-slate-400">
              <li>{contactEmail}</li>
              <li>{contactPhone}</li>
            </ul>
            <div className="flex gap-4 mt-6 flex-wrap">
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {socialYoutube && (
                <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <Youtube className="w-6 h-6" />
                </a>
              )}
              {socialTiktok && (
                <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <Video className="w-6 h-6" />
                </a>
              )}
              {socialLinkedin && (
                <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Parceiros</h4>
            <div className="grid grid-cols-3 gap-4">
              {partners.map(partner => (
                <div key={partner.id} className="bg-white/10 p-2 rounded-lg flex items-center justify-center h-16 w-16" title={partner.legenda}>
                  <img src={partner.url} alt={partner.legenda} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ))}
              {partners.length === 0 && <p className="text-slate-500 text-sm col-span-3">Nenhum parceiro cadastrado.</p>}
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/10 text-center text-slate-500 text-sm">
          <p>{footerCopyright}</p>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </footer>
  );
}
