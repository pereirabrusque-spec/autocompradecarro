import React from 'react';
import { X, Car } from 'lucide-react';

interface VehicleSelectionModalProps {
  leads: any[];
  onSelect: (lead: any) => void;
  onClose: () => void;
}

export const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  leads,
  onSelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Selecione o Veículo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <div 
              key={lead.id}
              onClick={() => onSelect(lead)}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{lead.marca} {lead.modelo}</p>
                <p className="text-xs text-slate-500">#{lead.vehicle_code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
