import { useEffect, useState } from 'react';

declare global {
  interface Window {
    FedaPay?: {
      init: (selectorOrOptions: string | FedapayOptions, options?: FedapayOptions) => FedapayWidget;
      CHECKOUT_COMPLETED: number;
      DIALOG_DISMISSED: number;
    };
  }
}

export interface FedapayOptions {
  public_key: string;
  environment?: 'live' | 'sandbox';
  transaction?: {
    amount?: number;
    description?: string;
    currency?: string;
    id?: number;
    custom_metadata?: Record<string, any>;
  };
  customer?: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone_number?: {
      number?: string;
      country?: string;
    };
  };
  onComplete?: (reason: number, transaction: any) => void;
  container?: string;
  locale?: string;
}

export interface FedapayWidget {
  open: () => void;
  close?: () => void;
}

export const useFedapay = () => {
  const [isReady, setIsReady] = useState(false);
  const [widget, setWidget] = useState<FedapayWidget | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si le SDK est déjà disponible (chargé globalement)
    const checkSDK = () => {
      if (window.FedaPay && typeof window.FedaPay.init === 'function') {
        console.log('[useFedapay] ✅ SDK détecté');
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Vérifier immédiatement
    if (checkSDK()) {
      return;
    }

    console.log('[useFedapay] ⏳ Attente du chargement du SDK...');

    // Écouter l'événement personnalisé de chargement
    const handleSDKLoaded = () => {
      console.log('[useFedapay] 📢 Événement fedapay-sdk-loaded reçu');
      if (checkSDK()) {
        window.removeEventListener('fedapay-sdk-loaded', handleSDKLoaded);
      }
    };
    window.addEventListener('fedapay-sdk-loaded', handleSDKLoaded);

    // Si pas encore disponible, attendre un peu et réessayer
    const interval = setInterval(() => {
      if (checkSDK()) {
        clearInterval(interval);
        window.removeEventListener('fedapay-sdk-loaded', handleSDKLoaded);
      }
    }, 100);

    // Nettoyer après 15 secondes max
    const timeout = setTimeout(() => {
      clearInterval(interval);
      window.removeEventListener('fedapay-sdk-loaded', handleSDKLoaded);
      if (!window.FedaPay) {
        console.error('[useFedapay] ❌ SDK non disponible après 15 secondes');
        console.error('[useFedapay] Vérifiez que le script est bien chargé dans layout.tsx');
        // Forcer isReady à true après 15 secondes pour permettre quand même l'utilisation
        setIsReady(true);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('fedapay-sdk-loaded', handleSDKLoaded);
    };
  }, []);

  const initWidget = (selectorOrOptions: string | FedapayOptions, options?: FedapayOptions): FedapayWidget | null => {
    if (!window.FedaPay || typeof window.FedaPay.init !== 'function') {
      console.error('[Fedapay] SDK non chargé. Veuillez patienter...');
      return null;
    }

    try {
      // Si un sélecteur est fourni, utiliser le format avec sélecteur
      if (typeof selectorOrOptions === 'string') {
        const finalOptions = options || {};
        console.log('[Fedapay] Initialisation du widget avec sélecteur:', {
          selector: selectorOrOptions,
          public_key: finalOptions.public_key?.substring(0, 10) + '...',
          environment: finalOptions.environment || 'sandbox',
          amount: finalOptions.transaction?.amount,
        });

        const fedapayWidget = window.FedaPay.init(selectorOrOptions, finalOptions);
        setWidget(fedapayWidget);
        return fedapayWidget;
      } else {
        // Format sans sélecteur (ancien format)
        const finalOptions = selectorOrOptions;
        console.log('[Fedapay] Initialisation du widget avec options:', {
          public_key: finalOptions.public_key?.substring(0, 10) + '...',
          environment: finalOptions.environment || 'sandbox',
          amount: finalOptions.transaction?.amount,
        });

        const fedapayWidget = window.FedaPay.init(finalOptions);
        setWidget(fedapayWidget);
        return fedapayWidget;
      }
    } catch (error) {
      console.error('[Fedapay] Erreur lors de l\'initialisation du widget:', error);
      return null;
    }
  };

  const openWidget = (widgetInstance: FedapayWidget) => {
    if (!widgetInstance || typeof widgetInstance.open !== 'function') {
      console.error('[Fedapay] Widget non valide. Veuillez initialiser le widget d\'abord.');
      return false;
    }

    try {
      console.log('[Fedapay] Ouverture du widget...');
      widgetInstance.open();
      return true;
    } catch (error) {
      console.error('[Fedapay] Erreur lors de l\'ouverture du widget:', error);
      return false;
    }
  };

  return {
    isReady: isReady || !!(window.FedaPay && typeof window.FedaPay.init === 'function'),
    initWidget,
    openWidget,
    widget,
    constants: window.FedaPay ? {
      CHECKOUT_COMPLETED: window.FedaPay.CHECKOUT_COMPLETED,
      DIALOG_DISMISSED: window.FedaPay.DIALOG_DISMISSED,
    } : null,
  };
};

