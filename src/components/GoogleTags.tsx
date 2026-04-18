import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function GoogleTags() {
  // A injeção de scripts agora é feita de forma estática no index.html 
  // para evitar problemas de detecção do Google Ads e timeouts de verificação.
  return null;
}

export const triggerAdsConversion = async () => {
  const { data } = await supabase.from('settings').select('*').in('key', ['GOOGLE_ADS_ID', 'GOOGLE_ADS_CONVERSION_LABEL']);
  
  let adsId = 'AW-11148282770'; // Padrão fornecido pelo usuário
  let convLabel = '';

  if (data) {
    const dbAdsId = data.find(s => s.key === 'GOOGLE_ADS_ID')?.value;
    if (dbAdsId) adsId = dbAdsId;
    convLabel = data.find(s => s.key === 'GOOGLE_ADS_CONVERSION_LABEL')?.value || '';
  }
  
  if (adsId && convLabel && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      'send_to': `${adsId}/${convLabel}`
    });
    console.log('Google Ads Conversion Triggered');
  }
};
