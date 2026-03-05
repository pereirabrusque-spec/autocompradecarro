import { useEffect } from 'react';
import { useAssets } from '../lib/assetsContext';

export default function TawkTo() {
  const { settings } = useAssets();

  useEffect(() => {
    const enabled = settings['TAWKTO_ENABLED'] === 'true';
    const propertyId = settings['TAWKTO_PROPERTY_ID'];
    const widgetId = settings['TAWKTO_WIDGET_ID'];

    if (enabled && propertyId && widgetId) {
      // Remove existing script if any
      const existingScript = document.getElementById('tawkto-script');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'tawkto-script';
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      document.head.appendChild(script);
    } else {
      // Remove script if disabled
      const existingScript = document.getElementById('tawkto-script');
      if (existingScript) {
        existingScript.remove();
      }
      // Remove Tawk.to container if it exists
      const tawkContainer = document.getElementById('tawkto-chat-container');
      if (tawkContainer) {
        tawkContainer.remove();
      }
      // Also try to remove any other Tawk.to elements
      const tawkElements = document.querySelectorAll('[id^="tawk-"]');
      tawkElements.forEach(el => el.remove());
    }
  }, [settings]);

  return null;
}
