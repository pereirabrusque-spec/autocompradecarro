import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function GoogleTags() {
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from('settings').select('*').in('key', ['GOOGLE_ANALYTICS_ID', 'GOOGLE_ADS_ID', 'GOOGLE_TAG_MANAGER_ID']);
      if (data) {
        let gaId = data.find(s => s.key === 'GOOGLE_ANALYTICS_ID')?.value;
        let adsId = data.find(s => s.key === 'GOOGLE_ADS_ID')?.value;
        let gtmId = data.find(s => s.key === 'GOOGLE_TAG_MANAGER_ID')?.value;

        // Fallback apenas para Analytics e GTM se não estiverem no banco
        if (!gaId) gaId = 'G-SE8DRN12VH';
        if (!gtmId) gtmId = 'GTM-MJ49SD3J';
        // O Ads (AW-11148282770) está fixo no index.html para garantir verificação

        // Google Tag Manager
        if (gtmId) {
          const gtmScript = document.createElement('script');
          gtmScript.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `;
          document.head.appendChild(gtmScript);
        }

        // O Ads (AW-11148282770) está fixo no index.html para garantir verificação e evitar timeout
        // Analytics e GTM são injetados apenas se não houver conflito
        if (gaId && gaId !== 'AW-11148282770') {
          const script1 = document.createElement('script');
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script1);

          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            if (!window.gtag) {
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
            }
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);
        }

        // Não injetamos adsId aqui para evitar duplicidade com o index.html
      }
    };
    fetchTags();
  }, []);

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
