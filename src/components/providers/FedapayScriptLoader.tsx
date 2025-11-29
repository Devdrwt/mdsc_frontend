'use client';

import { useEffect } from 'react';

const FEDAPAY_SCRIPT_SRC = 'https://cdn.fedapay.com/checkout.js?v=1.1.7';

function normalizeFedapayAPI() {
  const fedapayAPI =
    (window as any).FedaPay ||
    (window as any).fedapay ||
    (window as any).FedaPayCheckout ||
    (window as any).FedaPayCheckoutJS;

  if (!fedapayAPI) {
    return false;
  }

  if (!(window as any).FedaPay) {
    (window as any).FedaPay = fedapayAPI;
    console.log('[Fedapay] ✅ API normalisée dans window.FedaPay');
  }

  console.log('[Fedapay] ✅ API détectée:', {
    hasFedaPay: !!(window as any).FedaPay,
    hasfedapay: !!(window as any).fedapay,
    hasFedaPayCheckout: !!(window as any).FedaPayCheckout,
    hasFedaPayCheckoutJS: !!(window as any).FedaPayCheckoutJS,
    apiType: typeof fedapayAPI,
    apiKeys: Object.keys(fedapayAPI),
    hasInit: typeof fedapayAPI.init === 'function',
    hasCheckout: typeof fedapayAPI.checkout === 'function',
  });

  window.dispatchEvent(new Event('fedapay-sdk-loaded'));
  return true;
}

export default function FedapayScriptLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Si déjà chargé, normaliser et sortir
    if (normalizeFedapayAPI()) {
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${FEDAPAY_SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    const script = existingScript || document.createElement('script');
    script.src = FEDAPAY_SCRIPT_SRC;
    script.async = true;

    let attempts = 0;
    const maxAttempts = 50;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };

    const handleLoad = () => {
      console.log('[Fedapay] ✅ Script checkout.js chargé');
      checkInterval = setInterval(() => {
        attempts += 1;
        if (normalizeFedapayAPI()) {
          cleanup();
        } else if (attempts >= maxAttempts) {
          cleanup();
          console.error(
            `[Fedapay] ❌ API non disponible après ${maxAttempts} tentatives`
          );
          console.error(
            '[Fedapay] window keys:',
            Object.keys(window).filter((k) => {
              const lower = k.toLowerCase();
              return lower.includes('feda') || lower.includes('pay');
            })
          );
          window.dispatchEvent(new Event('fedapay-sdk-error'));
        }
      }, 100);
    };

    const handleError = () => {
      console.error('[Fedapay] ❌ Erreur lors du chargement du script checkout.js');
      window.dispatchEvent(new Event('fedapay-sdk-error'));
      cleanup();
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!existingScript) {
      document.head.appendChild(script);
    } else if ((existingScript as any)._fedapayLoaded) {
      handleLoad();
    }

    (script as any)._fedapayLoaded = true;

    return () => {
      cleanup();
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}


