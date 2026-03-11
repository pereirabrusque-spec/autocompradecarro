import React, { useState } from 'react';
import { X, RefreshCw, Save, Trash2, ShieldCheck, Wallet, ImageIcon } from 'lucide-react';

interface LeadDetailsCardProps {
  lead: any;
  onClose: () => void;
  onSave: (updatedLead: any) => void;
  onDelete: (leadId: string) => void;
  onRefresh: () => void;
}

export default function LeadDetailsCard({ lead, onClose, onSave, onDelete, onRefresh }: LeadDetailsCardProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold font-display">Detalhes do Lead #{currentLead.vehicle_code}</h2>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Atualizar">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Fotos e Dados */}
          <div className="space-y-6">
            <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center">
              {currentLead.fotos?.[currentPhotoIndex] ? (
                <img src={currentLead.fotos[currentPhotoIndex]} alt="Veículo" className="w-full h-full object-cover rounded-2xl" />
              ) : <ImageIcon className="w-12 h-12 text-slate-300" />}
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
              <h3 className="font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Dados do Veículo</h3>
              <div className="grid grid-cols-2 gap-3">
                <input className="p-2 border rounded" value={currentLead.marca} onChange={e => setCurrentLead({...currentLead, marca: e.target.value})} />
                <input className="p-2 border rounded" value={currentLead.modelo} onChange={e => setCurrentLead({...currentLead, modelo: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Coluna 2: Financeiro e Ações */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-accent" /> Financeiro</h3>
            <div className="space-y-2">
              <p>FIPE: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentLead.valor_fipe || 0)}</p>
              <button onClick={() => onSave(currentLead)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
              <button onClick={() => onDelete(currentLead.id)} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Excluir Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
