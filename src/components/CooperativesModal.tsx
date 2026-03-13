import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CooperativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  onRefresh: () => void;
  cooperativeDiscount: number;
}

export default function CooperativesModal({ isOpen, onClose, banks, onRefresh, cooperativeDiscount }: CooperativesModalProps) {
  const [newBank, setNewBank] = useState({ name: '', discount_percentage: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(cooperativeDiscount);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newBank.name || !newBank.discount_percentage) return;
    setIsSaving(true);
    await supabase.from('banks').insert({ name: newBank.name, discount_percentage: parseFloat(newBank.discount_percentage), is_cooperativa: true });
    setNewBank({ name: '', discount_percentage: '' });
    onRefresh();
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('banks').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl w-96">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Gerenciar Cooperativas</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <label className="text-sm font-bold">Porcentagem Global de Cooperativas (%)</label>
            <input 
              type="number"
              className="w-full p-2 border rounded"
              value={globalDiscount}
              onChange={e => setGlobalDiscount(parseFloat(e.target.value))}
            />
            <button 
              onClick={async () => {
                await supabase.from('settings').upsert({ key: 'COOPERATIVE_DISCOUNT_PERCENTAGE', value: globalDiscount.toString() }, { onConflict: 'key' });
                onRefresh();
              }}
              className="w-full p-2 bg-slate-900 text-white rounded font-bold"
            >
              Salvar Porcentagem Global
            </button>
          </div>
          <button 
            onClick={async () => {
              const banksToPopulate = ['Sicoob', 'Sicredi', 'Unicred', 'Cresol', 'Viacredi', 'Ailos', 'Credisis', 'Credicoamo'];
              for (const name of banksToPopulate) {
                await supabase.from('banks').insert({ name, discount_percentage: globalDiscount, is_cooperativa: true });
              }
              onRefresh();
            }}
            className="w-full p-2 bg-slate-100 text-slate-900 rounded font-bold"
          >
            Popular com Cooperativas Padrão
          </button>
          <hr />
          <input 
            placeholder="Nome da Cooperativa" 
            className="w-full p-2 border rounded"
            value={newBank.name}
            onChange={e => setNewBank({...newBank, name: e.target.value})}
          />
          <input 
            placeholder="Porcentagem de Desconto" 
            type="number"
            className="w-full p-2 border rounded"
            value={newBank.discount_percentage}
            onChange={e => setNewBank({...newBank, discount_percentage: e.target.value})}
          />
          <button onClick={handleAdd} className="w-full p-2 bg-slate-900 text-white rounded font-bold" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {banks.map(bank => (
            <div key={bank.id} className="flex justify-between items-center p-2 border rounded">
              <span>{bank.name} - {bank.discount_percentage}%</span>
              <button onClick={() => handleDelete(bank.id)} className="text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
