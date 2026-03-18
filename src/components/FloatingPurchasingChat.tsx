import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function FloatingPurchasingChat({ context }: { context?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all z-50 flex items-center gap-2"
        title="Chat de Compras"
      >
        <MessageCircle className="w-8 h-8" />
      </button>

      {isOpen && (
        <ChatWidget />
      )}
    </>
  );
}
