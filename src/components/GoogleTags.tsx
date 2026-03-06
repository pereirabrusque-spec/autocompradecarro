import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function GoogleTags() {
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from('settings').select('*').in('key', ['GOOGLE_ANALYTICS_ID', 'GOOGLE_ADS_ID']);
      if (data) {
        const gaId = data.find(s => s.key === 'GOOGLE_ANALYTICS_ID')?.value;
        const adsId = data.find(s => s.key === 'GOOGLE_ADS_ID')?.value;

        if (gaId) {
          const script1 = document.createElement('script');
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script1);

          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);
        }

        if (adsId && adsId !== gaId) {
          const script3 = document.createElement('script');
          script3.async = true;
          script3.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
          document.head.appendChild(script3);

          const script4 = document.createElement('script');
          script4.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${adsId}');
          `;
          document.head.appendChild(script4);
        }
      }
    };
    fetchTags();
  }, []);

  return null;
}

export const triggerAdsConversion = async () => {
  const { data } = await supabase.from('settings').select('*').in('key', ['GOOGLE_ADS_ID', 'GOOGLE_ADS_CONVERSION_LABEL']);
  if (data) {
    const adsId = data.find(s => s.key === 'GOOGLE_ADS_ID')?.value;
    const convLabel = data.find(s => s.key === 'GOOGLE_ADS_CONVERSION_LABEL')?.value;
    
    if (adsId && convLabel && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': `${adsId}/${convLabel}`
      });
      console.log('Google Ads Conversion Triggered');
    }
  }
};
