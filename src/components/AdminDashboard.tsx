import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Phone, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { useAssets } from '../lib/assetsContext';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'assets'>('leads');
  const [savingAsset, setSavingAsset] = useState<string | null>(null);
  const { refreshAssets } = useAssets();

  useEffect(() => {
    const fetchData = async () => {
      const [leadsRes, assetsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/assets')
      ]);
      const leadsData = await leadsRes.json();
      const assetsData = await assetsRes.json();
      setLeads(leadsData);
      setDbAssets(assetsData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleUpdateAsset = async (identificador: string, url: string, legenda: string) => {
    setSavingAsset(identificador);
    try {
      const res = await fetch('/api/admin/assets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador_secao: identificador, url_foto: url, legenda })
      });
      if (res.ok) {
        await refreshAssets();
        // Update local state
        setDbAssets(prev => prev.map(a => a.identificador_secao === identificador ? { ...a, url_foto: url, legenda } : a));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingAsset(null);
    }
  };

  const getSituationLabel = (s: string) => {
    const labels: any = {
      normal: 'Normal',
      debt: 'Dívida Atrasada',
      renajud: 'RENAJUD',
      busca_apreensao: 'Busca e Apreensão',
      engine_blown: 'Motor Estourado',
      maintenance_needed: 'Manutenção',
      future_payoff: 'Futura Quitação'
    };
    return labels[s] || s;
  };

  if (isLoading) return <div className="p-20 text-center">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold">Painel Administrativo</h1>
            <p className="text-slate-500">Gerencie leads e conteúdo do site.</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            <button 
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'leads' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Leads ({leads.length})
            </button>
            <button 
              onClick={() => setActiveTab('assets')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'assets' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Assets do Site
            </button>
          </div>
        </div>

        {activeTab === 'leads' ? (
          <div className="grid grid-cols-1 gap-6">
            {leads.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                          v.type === 'Avaliação Completa' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {v.type} • Score: {v.score_veiculo || 'N/A'}
                        </span>
                        <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Recebido em: {new Date(v.created_at).toLocaleDateString('pt-BR')} às {new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <h2 className="font-display text-2xl font-bold">{v.brand} {v.model}</h2>
                        <p className="text-slate-400 text-sm">{v.year} • {v.plate} • {v.mileage?.toLocaleString()} km</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Desejado</p>
                        <p className="text-2xl font-bold text-accent">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.desired_price)}
                        </p>
                        <p className="text-xs text-slate-400">Quitação Est.: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valor_quitacao_estimado)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Contato</span>
                        </div>
                        <p className="font-bold text-sm">{v.owner_name}</p>
                        <p className="text-xs text-slate-500">{v.owner_phone}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Financeiro</span>
                        </div>
                        <p className="font-bold text-sm">{v.bank}</p>
                        <p className="text-xs text-slate-500">{v.installments_paid}/{v.installments_paid + v.installments_remaining} parcelas</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Situação</span>
                        </div>
                        <p className="font-bold text-sm">{getSituationLabel(v.situation)}</p>
                        <p className="text-xs text-slate-500">{v.is_crashed ? 'Com Sinistro' : 'Sem Sinistro'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64 flex flex-col gap-4">
                    <button className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:bg-blue-600 transition-all">
                      Aprovar Proposta
                    </button>
                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                      Solicitar Mais Fotos
                    </button>
                    <button className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">
                      Reprovar Lead
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {leads.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400">Nenhum lead recebido até o momento.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dbAssets.map((asset) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative h-48 bg-slate-100">
                  <img 
                    src={asset.url_foto} 
                    alt={asset.legenda} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                    {asset.identificador_secao}
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                      value={asset.legenda}
                      onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, legenda: e.target.value } : a))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL da Imagem (Supabase/Unsplash)</label>
                    <input 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-accent/20"
                      value={asset.url_foto}
                      onChange={(e) => setDbAssets(prev => prev.map(a => a.id === asset.id ? { ...a, url_foto: e.target.value } : a))}
                    />
                  </div>
                  <button 
                    onClick={() => handleUpdateAsset(asset.identificador_secao, asset.url_foto, asset.legenda)}
                    disabled={savingAsset === asset.identificador_secao}
                    className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {savingAsset === asset.identificador_secao ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
