import { useEffect } from 'react';
import { useAssets } from '../lib/assetsContext';

export default function TawkTo() {
  const { settings } = useAssets();

  useEffect(() => {
    const enabled = settings['TAWKTO_ENABLED'] === 'true';
    const propertyId = settings['TAWKTO_PROPERTY_ID'];
    const widgetId = settings['TAWKTO_WIDGET_ID'];

    const cleanup = () => {
      const existingScript = document.getElementById('tawkto-script');
      if (existingScript) {
        existingScript.remove();
      }
      const tawkContainer = document.getElementById('tawkto-chat-container');
      if (tawkContainer) {
        tawkContainer.remove();
      }
      const tawkElements = document.querySelectorAll('[id^="tawk-"]');
      tawkElements.forEach(el => el.remove());
    };

    if (enabled && propertyId && widgetId) {
      cleanup(); // Clean up before adding new one

      const script = document.createElement('script');
      script.id = 'tawkto-script';
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      document.head.appendChild(script);
    } else {
      cleanup();
    }

    return cleanup;
  }, [settings]);

  return null;
}
