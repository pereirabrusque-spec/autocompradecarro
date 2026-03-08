import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

export default function ChatThemeSettings() {
  const [height, setHeight] = useState('600');
  const [width, setWidth] = useState('400');
  const [color, setColor] = useState('#000000');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const h = data.find(s => s.key === 'CHAT_HEIGHT');
      const w = data.find(s => s.key === 'CHAT_WIDTH');
      const c = data.find(s => s.key === 'CHAT_COLOR');
      if (h) setHeight(h.value);
      if (w) setWidth(w.value);
      if (c) setColor(c.value);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('settings').upsert([
      { key: 'CHAT_HEIGHT', value: height },
      { key: 'CHAT_WIDTH', value: width },
      { key: 'CHAT_COLOR', value: color }
    ], { onConflict: 'key' });
    setLoading(false);
    alert('Configurações salvas!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-lg font-bold">Configurações do Chat</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500">Altura (px)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Largura (px)</label>
          <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Cor Principal</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full p-1 border rounded-lg h-10" />
        </div>
      </div>
      <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
        <Save className="w-4 h-4" />
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
