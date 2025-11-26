import { useEffect, useState } from 'react';

declare global {
  interface Window {
    openKkiapayWidget?: (options: KkiapayOptions) => void;
    addSuccessListener?: (callback: (response: any) => void) => void;
    addFailedListener?: (callback: (error: any) => void) => void;
  }
}

export interface KkiapayOptions {
  amount: string | number;
  position?: 'left' | 'right' | 'center';
  callback?: string;
  data?: string;
  theme?: string;
  key: string;
  sandbox?: boolean | string; // Kkiapay accepte 'true' ou 'false' en string
  phone?: string;
  name?: string;
  email?: string;
  paymentmethod?: 'momo' | 'card';
  partnerId?: string;
}

export const useKkiapay = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si le SDK est déjà disponible (chargé globalement)
    const checkSDK = () => {
      if (window.openKkiapayWidget) {
        console.log('[useKkiapay] ✅ SDK détecté');
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Vérifier immédiatement
    if (checkSDK()) {
      return;
    }

    console.log('[useKkiapay] ⏳ Attente du chargement du SDK...');

    // Écouter l'événement personnalisé de chargement
    const handleSDKLoaded = () => {
      console.log('[useKkiapay] 📢 Événement kkiapay-sdk-loaded reçu');
      if (checkSDK()) {
        window.removeEventListener('kkiapay-sdk-loaded', handleSDKLoaded);
      }
    };
    window.addEventListener('kkiapay-sdk-loaded', handleSDKLoaded);

    // Si pas encore disponible, attendre un peu et réessayer
    const interval = setInterval(() => {
      if (checkSDK()) {
        clearInterval(interval);
        window.removeEventListener('kkiapay-sdk-loaded', handleSDKLoaded);
      }
    }, 100);

    // Nettoyer après 15 secondes max
    const timeout = setTimeout(() => {
      clearInterval(interval);
      window.removeEventListener('kkiapay-sdk-loaded', handleSDKLoaded);
      if (!window.openKkiapayWidget) {
        console.error('[useKkiapay] ❌ SDK non disponible après 15 secondes');
        console.error('[useKkiapay] Vérifiez que le script est bien chargé dans layout.tsx');
        // Forcer isReady à true après 15 secondes pour permettre quand même l'utilisation
        // (au cas où le SDK serait chargé mais non détecté)
        setIsReady(true);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('kkiapay-sdk-loaded', handleSDKLoaded);
    };
  }, []);

  const openWidget = (options: KkiapayOptions) => {
    if (!window.openKkiapayWidget) {
      console.error('[Kkiapay] SDK non chargé. Veuillez patienter...');
      return false;
    }

    try {
      // Normaliser le paramètre sandbox (Kkiapay attend 'true' ou 'false' en string)
      const normalizedOptions = {
        ...options,
        sandbox: typeof options.sandbox === 'boolean' 
          ? (options.sandbox ? 'true' : 'false')
          : options.sandbox,
      };
      
      console.log('[Kkiapay] Ouverture du widget avec options:', {
        amount: normalizedOptions.amount,
        keyPrefix: normalizedOptions.key?.substring(0, 20) + '...',
        keySuffix: normalizedOptions.key ? '...' + normalizedOptions.key.substring(normalizedOptions.key.length - 10) : 'null',
        keyLength: normalizedOptions.key?.length || 0,
        sandbox: normalizedOptions.sandbox,
        sandboxType: typeof normalizedOptions.sandbox,
        environment: normalizedOptions.sandbox === 'true' || normalizedOptions.sandbox === true ? 'SANDBOX' : 'PRODUCTION',
      });
      
      window.openKkiapayWidget(normalizedOptions);
      return true;
    } catch (error) {
      console.error('[Kkiapay] Erreur lors de l\'ouverture du widget:', error);
      return false;
    }
  };

  const onSuccess = (callback: (response: any) => void) => {
    if (window.addSuccessListener) {
      window.addSuccessListener(callback);
    } else {
      console.warn('[Kkiapay] addSuccessListener non disponible');
    }
  };

  const onFailed = (callback: (error: any) => void) => {
    if (window.addFailedListener) {
      window.addFailedListener(callback);
    } else {
      console.warn('[Kkiapay] addFailedListener non disponible');
    }
  };

  return {
    isReady: isReady || !!window.openKkiapayWidget,
    openWidget,
    onSuccess,
    onFailed,
  };
};

