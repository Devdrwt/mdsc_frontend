import { useEffect, useState } from 'react';

declare global {
  interface Window {
    FedaPay?: {
      init: (selectorOrOptions: string | FedapayOptions, options?: FedapayOptions) => FedapayWidget;
      checkout?: (options: { public_key: string; transaction: any }) => void;
      CHECKOUT_COMPLETED?: number;
      DIALOG_DISMISSED?: number;
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
    // Vérifier que le SDK est chargé
    if (!window.FedaPay) {
      console.error('[Fedapay] SDK non chargé. Veuillez patienter...');
      console.error('[Fedapay] window.FedaPay:', window.FedaPay);
      return null;
    }

    // Vérifier les méthodes disponibles
    const hasInit = typeof window.FedaPay.init === 'function';
    const hasCheckout = typeof window.FedaPay.checkout === 'function';
    
    console.log('[Fedapay] Méthodes disponibles:', { 
      hasInit, 
      hasCheckout, 
      FedaPayKeys: Object.keys(window.FedaPay),
      FedaPayType: typeof window.FedaPay,
    });

    if (!hasInit && !hasCheckout) {
      console.error('[Fedapay] Aucune méthode disponible (init ou checkout)');
      return null;
    }

    try {
      // Si un sélecteur est fourni, utiliser le format avec sélecteur
      if (typeof selectorOrOptions === 'string') {
        const finalOptions = options || {};
        console.log('[Fedapay] Initialisation du widget avec sélecteur:', {
          selector: selectorOrOptions,
          publicKeyPrefix: finalOptions.public_key?.substring(0, 20) + '...',
          publicKeySuffix: finalOptions.public_key ? '...' + finalOptions.public_key.substring(finalOptions.public_key.length - 10) : 'null',
          publicKeyLength: finalOptions.public_key?.length || 0,
          environment: finalOptions.environment || 'sandbox',
          environmentType: typeof finalOptions.environment,
          amount: finalOptions.transaction?.amount,
        });

        // Vérifier que le bouton existe dans le DOM
        const button = document.querySelector(selectorOrOptions);
        if (!button) {
          console.error(`[Fedapay] ❌ Le bouton ${selectorOrOptions} n'existe pas dans le DOM`);
          return null;
        }
        console.log(`[Fedapay] ✅ Le bouton ${selectorOrOptions} existe dans le DOM`);

        // Utiliser init() si disponible
        if (hasInit) {
          console.log('[Fedapay] Utilisation de FedaPay.init()');
          console.log('[Fedapay] Options complètes:', {
            public_key: finalOptions.public_key?.substring(0, 20) + '...',
            environment: finalOptions.environment,
            transaction: finalOptions.transaction,
            customer: finalOptions.customer ? {
              email: finalOptions.customer.email,
              firstname: finalOptions.customer.firstname,
              lastname: finalOptions.customer.lastname,
            } : null,
          });
          
          try {
            // Vérifier que le bouton existe avant d'initialiser
            const buttonElement = document.querySelector(selectorOrOptions);
            if (!buttonElement) {
              console.error(`[Fedapay] ❌ Le bouton ${selectorOrOptions} n'existe pas dans le DOM`);
              return null;
            }
            console.log(`[Fedapay] ✅ Bouton ${selectorOrOptions} trouvé:`, buttonElement);
            
            // Initialiser le widget - il s'ouvrira automatiquement au clic sur le bouton
            const fedapayWidget = window.FedaPay.init(selectorOrOptions, finalOptions);
            console.log('[Fedapay] Widget initialisé:', { 
              widget: fedapayWidget, 
              widgetType: typeof fedapayWidget,
              isArray: Array.isArray(fedapayWidget),
              hasOpen: typeof fedapayWidget?.open === 'function',
              widgetKeys: fedapayWidget ? Object.keys(fedapayWidget) : null,
            });
            
            // Si c'est un tableau (comme dans les logs), prendre le premier élément
            const actualWidget = Array.isArray(fedapayWidget) ? fedapayWidget[0] : fedapayWidget;
            console.log('[Fedapay] Widget réel:', { 
              actualWidget,
              hasOpen: typeof actualWidget?.open === 'function',
            });
            
            // Le widget est maintenant attaché au bouton et s'ouvrira automatiquement au clic
            console.log('[Fedapay] ✅ Widget attaché au bouton. Il s\'ouvrira automatiquement au clic.');
            
            // Vérifier que le bouton a bien l'événement de clic attaché
            const button = document.querySelector(selectorOrOptions) as HTMLElement;
            if (button) {
              console.log('[Fedapay] ✅ Bouton trouvé, prêt pour le clic');
              // Tester si le widget s'ouvre en simulant un clic (optionnel, pour debug)
              // button.click(); // Décommenter pour tester automatiquement
            }
            
            setWidget(actualWidget || fedapayWidget);
            return actualWidget || fedapayWidget;
          } catch (error) {
            console.error('[Fedapay] ❌ Erreur lors de l\'appel à init():', error);
            console.error('[Fedapay] Stack:', error instanceof Error ? error.stack : 'N/A');
            throw error;
          }
        } else if (hasCheckout) {
          // Utiliser checkout() si init() n'est pas disponible
          console.log('[Fedapay] Utilisation de FedaPay.checkout()');
          window.FedaPay.checkout({
            public_key: finalOptions.public_key!,
            transaction: finalOptions.transaction,
            customer: finalOptions.customer,
            onComplete: finalOptions.onComplete,
          });
          const mockWidget = { open: () => {} };
          setWidget(mockWidget);
          return mockWidget;
        }
      } else {
        // Format sans sélecteur (ancien format)
        const finalOptions = selectorOrOptions;
        console.log('[Fedapay] Initialisation du widget avec options:', {
          publicKeyPrefix: finalOptions.public_key?.substring(0, 20) + '...',
          publicKeySuffix: finalOptions.public_key ? '...' + finalOptions.public_key.substring(finalOptions.public_key.length - 10) : 'null',
          publicKeyLength: finalOptions.public_key?.length || 0,
          environment: finalOptions.environment || 'sandbox',
          environmentType: typeof finalOptions.environment,
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

