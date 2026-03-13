import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CooperativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: any[];
  onRefresh: () => void;
  cooperativeDiscount: number;
}

export default function CooperativesModal({ isOpen, onClose, banks, onRefresh }: CooperativesModalProps) {
  const [promptText, setPromptText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'prompt'>('list');

  // Sincronizar o texto do prompt APENAS quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const currentText = banks.filter(b => b.is_cooperativa).map(b => b.name).join('; ');
      setPromptText(currentText);
    }
  }, [isOpen]); // Removi 'banks' das dependências para não resetar enquanto o usuário edita

  if (!isOpen) return null;

  const handleSavePrompt = async () => {
    if (!window.confirm('Isso irá substituir todas as cooperativas atuais pela lista do prompt. Deseja continuar?')) return;
    
    setIsSaving(true);
    try {
      const newBanks = promptText.split(';').map(s => s.trim()).filter(s => s !== '');
      
      // Remove antigas cooperativas
      await supabase.from('banks').delete().eq('is_cooperativa', true);
      
      // Insere novas
      if (newBanks.length > 0) {
        const insertData = newBanks.map(name => ({
          name,
          discount_percentage: 5,
          is_cooperativa: true
        }));
        await supabase.from('banks').insert(insertData);
      }
      
      onRefresh();
      alert('Lista de cooperativas atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      alert('Erro ao salvar cooperativas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIndividual = async () => {
    if (!newBankName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('banks').insert({
        name: newBankName.trim(),
        discount_percentage: 5,
        is_cooperativa: true
      });
      
      if (error) throw error;
      
      setNewBankName('');
      onRefresh();
    } catch (error) {
      console.error('Erro ao adicionar banco:', error);
      alert('Erro ao adicionar cooperativa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!window.confirm('Deseja remover esta cooperativa?')) return;
    
    try {
      await supabase.from('banks').delete().eq('id', id);
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
    }
  };

  const cooperativeBanks = banks.filter(b => b.is_cooperativa);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold font-display">Gerenciar Cooperativas</h2>
            <p className="text-slate-500 text-sm">Configure os bancos que recebem desconto automático</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'list' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Lista de Cooperativas ({cooperativeBanks.length})
          </button>
          <button 
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'prompt' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Importar via Prompt
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'list' ? (
            <div className="space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nome da nova cooperativa..."
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIndividual()}
                />
                <button 
                  onClick={handleAddIndividual}
                  disabled={isSaving || !newBankName.trim()}
                  className="px-4 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cooperativeBanks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-accent/30 transition-all">
                    <span className="font-medium text-slate-700">{bank.name}</span>
                    <button 
                      onClick={() => handleDeleteBank(bank.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {cooperativeBanks.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    Nenhuma cooperativa cadastrada.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-blue-700 text-xs leading-relaxed">
                  <strong>Dica:</strong> Você pode colar uma lista de nomes separados por ponto e vírgula (;) para adicionar várias cooperativas de uma vez.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Conteúdo do Prompt</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-64 focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
                  placeholder="Ex: Sicoob; Sicredi; Unicred..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleSavePrompt}
                  className="flex-1 p-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  disabled={isSaving}
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Salvando...' : 'Salvar e Substituir Lista'}
                </button>
                <button 
                  onClick={() => {
                    const banksToPopulate = ['Sicoob', 'Sicredi', 'Unicred', 'Cresol', 'Viacredi', 'Ailos', 'Credisis', 'Credicoamo'];
                    setPromptText(banksToPopulate.join('; '));
                  }}
                  className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                  title="Carregar Padrão"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
