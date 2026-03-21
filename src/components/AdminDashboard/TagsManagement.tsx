import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TagsManagementProps {
  googleAnalyticsId: string;
  setGoogleAnalyticsId: (value: string) => void;
  googleAdsId: string;
  setGoogleAdsId: (value: string) => void;
  googleAdsConversionLabel: string;
  setGoogleAdsConversionLabel: (value: string) => void;
}

export function TagsManagement({
  googleAnalyticsId,
  setGoogleAnalyticsId,
  googleAdsId,
  setGoogleAdsId,
  googleAdsConversionLabel,
  setGoogleAdsConversionLabel,
}: TagsManagementProps) {
  const handleSaveTags = async () => {
    try {
      await supabase.from('settings').upsert({ key: 'GOOGLE_ANALYTICS_ID', value: googleAnalyticsId }, { onConflict: 'key' });
      await supabase.from('settings').upsert({ key: 'GOOGLE_ADS_ID', value: googleAdsId }, { onConflict: 'key' });
      await supabase.from('settings').upsert({ key: 'GOOGLE_ADS_CONVERSION_LABEL', value: googleAdsConversionLabel }, { onConflict: 'key' });
      alert('Tags salvas com sucesso!');
    } catch (error) {
      console.error('Error saving tags:', error);
      alert('Erro ao salvar tags.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Tags & Marketing (Google Ads / Analytics)</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Google Analytics ID (ex: G-XXXXXXXXXX)</label>
            <input 
              type="text"
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              placeholder="G-..."
            />
            <p className="text-xs text-slate-500 mt-2">Usado para rastrear visitas e comportamento no site.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Google Ads ID (ex: AW-XXXXXXXXXX)</label>
            <input 
              type="text"
              value={googleAdsId}
              onChange={(e) => setGoogleAdsId(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              placeholder="AW-..."
            />
            <p className="text-xs text-slate-500 mt-2">ID da sua conta do Google Ads para remarketing e conversões.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Google Ads Conversion Label (ex: abcdefg123456)</label>
            <input 
              type="text"
              value={googleAdsConversionLabel}
              onChange={(e) => setGoogleAdsConversionLabel(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              placeholder="Label de conversão..."
            />
            <p className="text-xs text-slate-500 mt-2">Disparado SOMENTE quando o cliente finaliza o formulário de venda.</p>
          </div>
          <button 
            onClick={handleSaveTags}
            className="px-8 py-4 bg-accent text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Tags
          </button>
        </div>
      </div>
    </div>
  );
}
