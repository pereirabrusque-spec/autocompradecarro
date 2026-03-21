import { useState } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export const ApiManagement = ({ 
  apiKeys, 
  showApiKeyForm, 
  setShowApiKeyForm, 
  setEditingApiKey, 
  setNewApiKey, 
  setNewApiModel, 
  setNewApiProvider,
  isSavingKey,
  handleDeleteApiKey,
  handleSaveApiKey,
  newApiKey,
  newApiProvider,
  newApiModel
}: any) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de APIs & Chaves</h2>
          <button 
            onClick={() => {
              setShowApiKeyForm(!showApiKeyForm);
              if (!showApiKeyForm) {
                setEditingApiKey(null);
                setNewApiKey('');
                setNewApiModel('gemini-1.5-flash');
                setNewApiProvider('gemini');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
          >
            <Plus className="w-5 h-5" />
            {showApiKeyForm ? 'Cancelar' : 'Nova Chave'}
          </button>
        </div>
        {showApiKeyForm && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-6 space-y-4">
            <h3 className="font-bold text-slate-900">Configurar Nova Chave</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Provedor (ex: gemini, openai)" 
                value={newApiProvider} 
                onChange={(e) => setNewApiProvider(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm"
              />
              <input 
                type="text" 
                placeholder="Modelo (ex: gemini-1.5-flash)" 
                value={newApiModel} 
                onChange={(e) => setNewApiModel(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm"
              />
              <input 
                type="password" 
                placeholder="Chave API" 
                value={newApiKey} 
                onChange={(e) => setNewApiKey(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <button 
              onClick={handleSaveApiKey}
              disabled={isSavingKey}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Salvar Chave
            </button>
          </div>
        )}

        <div className="space-y-4">
          {apiKeys.map((key: any) => (
            <div key={key.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div>
                <p className="font-bold text-slate-900">{key.provider} - {key.service}</p>
                <p className="text-xs text-slate-500 font-mono">****{key.key.slice(-4)}</p>
              </div>
              <button 
                onClick={() => handleDeleteApiKey(key.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
