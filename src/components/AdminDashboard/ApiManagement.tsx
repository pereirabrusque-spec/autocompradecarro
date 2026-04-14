import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Upload, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const ApiManagement = ({ 
  apiKeys, 
  showApiKeyForm, 
  setShowApiKeyForm, 
  editingApiKey,
  setEditingApiKey, 
  setNewApiKey, 
  setNewApiModel, 
  setNewApiProvider,
  isSavingKey,
  handleDeleteApiKey,
  handleSaveApiKey,
  handleUpdateApiKey,
  fetchData,
  newApiKey,
  newApiProvider,
  newApiModel
}: any) => {
  const [editProvider, setEditProvider] = useState('');
  const [editModel, setEditModel] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [currentInUseKeyId, setCurrentInUseKeyId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('ai_last_successful_key_id') : null
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const id = localStorage.getItem('ai_last_successful_key_id');
      console.log('[ApiManagement] 🔄 Detectada mudança na chave em uso:', id);
      setCurrentInUseKeyId(id);
    };

    window.addEventListener('storage', handleStorageChange);
    // Também verifica periodicamente ou quando apiKeys mudam
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [apiKeys]);

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onTestKey = async (key: any) => {
    setTestingKeyId(key.id);
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: key.provider, 
          key: key.key,
          service: key.service,
          fullTest: true // Teste completo para garantir que tem quota real
        })
      });
      
      const data = await response.json();
      let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'ok';
      
      if (!response.ok) {
        const errMsg = data.error?.toLowerCase() || '';
        if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('insufficient') || errMsg.includes('billing') || errMsg.includes('429')) {
          newStatus = 'no_credit';
        } else if (errMsg.includes('denied access') || errMsg.includes('suspended') || errMsg.includes('disabled') || errMsg.includes('access_denied') || errMsg.includes('invalid') || errMsg.includes('key')) {
          newStatus = 'disconnected';
        } else {
          newStatus = 'disconnected';
        }
      }

      // Update status in Supabase via handleUpdateApiKey
      await handleUpdateApiKey(key.id, key.provider, key.service, newStatus);
      
      if (newStatus === 'ok') {
        alert('Teste concluído: API Conectada e com Crédito! 🟢');
      } else if (newStatus === 'no_credit') {
        alert('Teste concluído: API Conectada, mas SEM CRÉDITO ou QUOTA EXCEDIDA. 🟡\n\nVerifique o faturamento no painel do provedor.');
      } else {
        alert(`Teste concluído: API DESCONECTADA ou ACESSO NEGADO. 🔴\n\nDetalhe: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      alert('Erro ao testar API: ' + err.message);
    } finally {
      setTestingKeyId(null);
    }
  };

  const sortedApiKeys = [...apiKeys].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      'ok': 0,
      'no_credit': 1,
      'rate_limited': 1,
      'disconnected': 2,
      'error': 2
    };
    
    const orderA = statusOrder[a.status] ?? 3;
    const orderB = statusOrder[b.status] ?? 3;
    
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de APIs & Chaves</h2>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button 
                onClick={async () => {
                  setTestingKeyId('all');
                  try {
                    const { AIService } = await import('../../services/aiService');
                    await AIService.testConnections(true);
                    if (fetchData) await fetchData();
                    alert('Varredura completa concluída! O status de todas as APIs foi atualizado.');
                  } catch (err: any) {
                    alert('Erro ao testar APIs: ' + err.message);
                  } finally {
                    setTestingKeyId(null);
                  }
                }}
                disabled={testingKeyId === 'all'}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-50 shadow-md shadow-amber-200 active:scale-95"
              >
                {testingKeyId === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Testar Todas as APIs
              </button>
              <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">Verifica saldo e conexão de todas</span>
            </div>
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
          {sortedApiKeys.map((key: any) => (
            <div 
              key={key.id} 
              className={`p-4 bg-white border rounded-xl shadow-sm transition-all ${editingApiKey === key.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-100'}`}
            >
              <div 
                onClick={() => {
                  setEditingApiKey(editingApiKey === key.id ? null : key.id);
                  setEditProvider(key.provider);
                  setEditModel(key.service);
                }}
                className="flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    key.status === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                    (key.status === 'no_credit' || key.status === 'rate_limited') ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 
                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{key.provider} - {key.service}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        key.status === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                        (key.status === 'no_credit' || key.status === 'rate_limited') ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {key.status === 'ok' ? 'Conectada (Online)' :
                         (key.status === 'no_credit' || key.status === 'rate_limited') ? 'Sem Crédito / Quota' : 'Desconectada / Erro'}
                      </span>
                      {key.id === currentInUseKeyId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-blue-600 text-white animate-pulse shadow-sm shadow-blue-200 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          Em Uso
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-slate-500 font-mono">
                        {showKeys[key.id] ? key.key : `****${key.key.slice(-4)}`}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleShowKey(key.id); }}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        {showKeys[key.id] ? 'Ocultar' : 'Visualizar'}
                      </button>
                      {key.last_used && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          Último uso: {new Date(key.last_used).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTestKey(key); }}
                    disabled={testingKeyId === key.id || testingKeyId === 'all'}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {testingKeyId === key.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Testar Individual
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteApiKey(key.id); }}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Excluir Chave"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {editingApiKey === key.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">Configurações da API</p>
                    <button 
                      onClick={() => onTestKey(key)}
                      disabled={testingKeyId === key.id || testingKeyId === 'all'}
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {testingKeyId === key.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      Testar agora
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={editProvider}
                      onChange={(e) => setEditProvider(e.target.value)}
                      className="p-3 rounded-xl border border-slate-200 text-sm"
                      placeholder="Provedor"
                    />
                    <input 
                      type="text" 
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      className="p-3 rounded-xl border border-slate-200 text-sm"
                      placeholder="Modelo"
                    />
                  </div>
                  <button 
                    onClick={() => handleUpdateApiKey(key.id, editProvider, editModel)}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
