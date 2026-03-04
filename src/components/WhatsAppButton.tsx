import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';

export default function WhatsAppButton() {
  const { settings } = useAssets();
  
  const enabled = settings['WHATSAPP_ENABLED'] === 'true';
  const number = settings['WHATSAPP_NUMBER'] || '';
  const text = settings['WHATSAPP_BUTTON_TEXT'] || 'WhatsApp';

  if (!enabled || !number) return null;

  const whatsappUrl = `https://wa.me/${number.replace(/\D/g, '')}`;

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center gap-2 group"
      title={text}
    >
      <MessageCircle className="w-8 h-8" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
        {text}
      </span>
    </a>
  );
}
