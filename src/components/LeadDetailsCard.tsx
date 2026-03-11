import React, { useState } from 'react';
import { X, Maximize2, ChevronLeft, ChevronRight, ImageIcon, ShieldCheck, Wallet, Trash2, Save, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeadDetailsCardProps {
  lead: any;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
  onDelete: (leadId: string) => void;
}

export default function LeadDetailsCard({ lead, onClose, onSave, onDelete }: LeadDetailsCardProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleFieldChange = (field: string, value: any) => {
    setCurrentLead({ ...currentLead, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-8 pb-4 border-b border-slate-100">
          <h2 className="text-3xl font-bold font-display">Detalhes do Lead #{currentLead.vehicle_code}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-8">
          {/* New component content will go here */}
          <p>Componente LeadDetailsCard em construção...</p>
        </div>
      </div>
    </div>
  );
}
