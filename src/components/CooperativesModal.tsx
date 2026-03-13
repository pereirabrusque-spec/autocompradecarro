import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CooperativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  onRefresh: () => void;
  cooperativeDiscount: number;
}

export default function CooperativesModal({ isOpen, onClose, banks, onRefresh }: CooperativesModalProps) {
  if (!isOpen) return null;

  const promptText = banks.map(b => b.name).join('; ');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl w-96">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Cooperativas</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Copiar Cooperativas (Prompt)</label>
            <textarea 
              readOnly
              className="w-full p-2 border rounded text-xs h-40"
              value={promptText}
            />
            <button 
              onClick={() => navigator.clipboard.writeText(promptText)}
              className="w-full p-2 bg-slate-900 text-white rounded font-bold text-sm"
            >
              Copiar Prompt
            </button>
          </div>

          <button 
            onClick={async () => {
              const banksToPopulate = ['Sicoob', 'Sicredi', 'Unicred', 'Cresol', 'Viacredi', 'Ailos', 'Credisis', 'Credicoamo'];
              for (const name of banksToPopulate) {
                await supabase.from('banks').insert({ name, discount_percentage: 5, is_cooperativa: true });
              }
              onRefresh();
            }}
            className="w-full p-2 bg-slate-100 text-slate-900 rounded font-bold"
          >
            Popular com Cooperativas Padrão
          </button>
        </div>
      </div>
    </div>
  );
}
