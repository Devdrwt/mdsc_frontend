'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader, Info, Home, CreditCard, AlertCircle, Wallet, Smartphone, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { paymentService, PaymentInitiation, isDemoMode, Payment } from '../../lib/services/paymentService';
import { useAuthStore } from '../../lib/stores/authStore';
import { useKkiapay } from '../../hooks/useKkiapay';
import { useFedapay } from '../../hooks/useFedapay';
import { getActivePaymentProviders, PaymentProvider } from '../../lib/services/paymentProvidersService';
import toast from '../../lib/utils/toast';

interface PaymentFormProps {
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  onPaymentInitiated: (payment: Payment) => void;
  onCancel: () => void;
}

export default function PaymentForm({
  courseId,
  courseTitle,
  amount,
  currency,
  onPaymentInitiated,
  onCancel,
}: PaymentFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isReady: isKkiapayReady, openWidget: openKkiapayWidget, onSuccess, onFailed } = useKkiapay();
  const { isReady: isFedapayReady, initWidget: initFedapayWidget, openWidget: openFedapayWidget, constants: fedapayConstants } = useFedapay();
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentMetadata, setPaymentMetadata] = useState<{ temp_payment_id?: string; user_id?: number; course_id?: string } | null>(null);
  // Utiliser une ref pour stocker les métadonnées afin qu'elles soient accessibles dans les listeners
  const paymentMetadataRef = useRef<{ temp_payment_id?: string; user_id?: number; course_id?: string } | null>(null);
  const demoMode = isDemoMode();
  
  // États pour les providers
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  
  // Ref pour stocker l'instance du widget Fedapay
  const fedapayWidgetRef = useRef<any>(null);

  // Récupérer les informations de l'utilisateur
  const fullname = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  // Essayer plusieurs façons de récupérer l'email
  const email = user?.email || (user as any)?.email || '';
  const phone = (user as any)?.phone || user?.phone || '';
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>(phone || '');

  useEffect(() => {
    setCustomerPhoneInput(phone || '');
  }, [phone]);

  const normalizeGobipayPhone = (input: string): string => {
    if (!input) return '';
    let value = input.replace(/[^0-9+]/g, '');
    // Convert leading 00 to +
    if (value.startsWith('00')) {
      value = `+${value.slice(2)}`;
    }
    // Remove +
    if (value.startsWith('+')) {
      value = value.slice(1);
    }
    // Remove leading country code duplicates
    if (value.startsWith('00229')) {
      value = value.slice(4);
    }
    if (value.startsWith('229') && value.length > 11) {
      value = value.slice(0, 11);
    }
    if (value.length === 8) {
      value = `229${value}`;
    }
    if (value.startsWith('229') && value.length === 11) {
      return value;
    }
    return value.length >= 8 ? value : '';
  };

  // Charger les providers actifs au montage
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoadingProviders(true);
        const activeProviders = await getActivePaymentProviders();
        setProviders(activeProviders);
        
        // Sélectionner le premier provider par défaut s'il y en a un
        if (activeProviders.length > 0) {
          setSelectedProvider(activeProviders[0]);
        }
      } catch (error: any) {
        console.error('[PaymentForm] ❌ Erreur lors du chargement des providers:', error);
        const errorMessage = error?.message || 'Impossible de charger les providers de paiement.';
        toast.error('Erreur', errorMessage);
      } finally {
        setLoadingProviders(false);
      }
    };
    
    loadProviders();
  }, []);


  // Configurer les listeners Kkiapay une seule fois au chargement
  useEffect(() => {
    if (!isKkiapayReady) {
      console.log('[PaymentForm] ⏳ SDK not ready yet, skipping listener setup');
      return;
    }

    console.log('[PaymentForm] 🔧 Setting up Kkiapay listeners...');
    console.log('[PaymentForm] SDK check:', {
      hasOpenWidget: typeof window !== 'undefined' && !!window.openKkiapayWidget,
      hasAddSuccessListener: typeof window !== 'undefined' && !!window.addSuccessListener,
      hasAddFailedListener: typeof window !== 'undefined' && !!window.addFailedListener,
    });

    // Listener pour le succès - utiliser une fonction qui accède aux valeurs actuelles via ref
    const handleSuccess = async (response: any) => {
      console.log('[PaymentForm] 🎉 Kkiapay success callback triggered!', response);
      setProcessing(false);
      
      // Récupérer les métadonnées depuis la ref (toujours à jour)
      const currentMetadata = paymentMetadataRef.current;
      if (!currentMetadata) {
        console.error('[PaymentForm] Payment metadata missing', {
          paymentMetadata: paymentMetadataRef.current,
          response,
        });
        toast.error('Erreur', 'Les métadonnées de paiement sont manquantes. Veuillez contacter le support.');
        return;
      }

      try {
        // Préparer les métadonnées AVANT le spread pour éviter qu'elles soient écrasées
        const metadata = {
          temp_payment_id: currentMetadata.temp_payment_id,
          user_id: currentMetadata.user_id,
          course_id: currentMetadata.course_id,
        };
        
        // Appeler le backend pour finaliser le paiement et créer l'inscription
        const webhookPayload = {
          ...response, // Mettre response en premier
          transaction_id: response.transaction_id || response.id || response.transactionId,
          status: 'SUCCESS',
          amount: amount,
          currency: currency,
          metadata: metadata, // Mettre metadata après pour qu'elle ne soit pas écrasée
        };
        
        console.log('[PaymentForm] 📦 Prepared payload:', {
          transaction_id: webhookPayload.transaction_id,
          status: webhookPayload.status,
          amount: webhookPayload.amount,
          currency: webhookPayload.currency,
          metadata: webhookPayload.metadata,
        });

        console.log('[PaymentForm] 🚀 Finalizing payment with backend', {
          payload: webhookPayload,
          url: '/payments/finalize-kkiapay',
        });
        
        const apiRequest = (await import('../../lib/services/api')).apiRequest;
        console.log('[PaymentForm] 📞 Calling finalize payment API...');
        
        const finalizeResponse = await apiRequest('/payments/finalize-kkiapay', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        });

        console.log('[PaymentForm] ✅ Payment finalized successfully:', finalizeResponse);
        
        if (finalizeResponse.success !== false) {
          toast.success('Paiement réussi', 'Votre paiement a été traité avec succès !');
          
          // Rediriger vers le dashboard après un court délai
          setTimeout(() => {
            router.push('/dashboard/student/courses');
          }, 2000);
        } else {
          throw new Error(finalizeResponse.error || finalizeResponse.message || 'Erreur lors de l\'enregistrement');
        }
      } catch (error: any) {
        console.error('[PaymentForm] ❌ Error finalizing payment:', error);
        console.error('[PaymentForm] ❌ Error details:', {
          message: error.message,
          status: error.status,
          response: error.response,
          stack: error.stack,
        });
        toast.warning('Paiement réussi', 'Le paiement a été traité, mais une erreur est survenue lors de l\'enregistrement. Veuillez contacter le support.');
      }
    };

    // Listener pour l'échec
    const handleFailed = async (error: any) => {
      console.error('[PaymentForm] Kkiapay failed:', error);
      setProcessing(false);
      
      const currentMetadata = paymentMetadataRef.current;
      if (!currentMetadata) {
        toast.error('Paiement échoué', error.message || 'Le paiement n\'a pas pu être traité. Veuillez réessayer.');
        return;
      }

      try {
        // Appeler le webhook backend pour enregistrer l'échec
        const webhookPayload = {
          transaction_id: error.transaction_id || error.id || error.transactionId || null,
          status: 'FAILED',
          amount: amount,
          currency: currency,
          error_message: error.message || 'Paiement échoué',
          metadata: {
            temp_payment_id: currentMetadata.temp_payment_id,
            user_id: currentMetadata.user_id,
            course_id: currentMetadata.course_id,
          },
          ...error,
        };

        console.log('[PaymentForm] Sending failure to webhook', webhookPayload);
        
        const apiRequest = (await import('../../lib/services/api')).apiRequest;
        await apiRequest('/payments/webhook/kkiapay', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        });
      } catch (webhookError: any) {
        console.error('[PaymentForm] Error calling webhook:', webhookError);
      }
      
      toast.error('Paiement échoué', error.message || 'Le paiement n\'a pas pu être traité. Veuillez réessayer.');
    };

    // Configurer les listeners
    console.log('[PaymentForm] 📝 Registering success listener...');
    onSuccess(handleSuccess);
    console.log('[PaymentForm] 📝 Registering failed listener...');
    onFailed(handleFailed);
    console.log('[PaymentForm] ✅ Listeners registered successfully');

    // Nettoyer les listeners au démontage
    return () => {
      console.log('[PaymentForm] 🧹 Cleaning up listeners');
      // Note: Kkiapay ne fournit pas de méthode pour supprimer les listeners
      // mais on peut les ignorer en vérifiant paymentMetadata dans les handlers
    };
      }, [isKkiapayReady, onSuccess, onFailed]); // Ne pas inclure paymentMetadata, amount, currency dans les dépendances

  const handlePayWithProvider = async (provider: PaymentProvider) => {
    if (!provider) {
      toast.error('Erreur', 'Aucun provider sélectionné');
      return;
    }

    if (provider.provider_name === 'kkiapay') {
      await handlePayWithKkiapay();
    } else if (provider.provider_name === 'fedapay') {
      await handlePayWithFedapay();
    } else if (provider.provider_name === 'gobipay') {
      await handlePayWithGobipay();
    } else {
      toast.error('Erreur', 'Provider non supporté');
    }
  };
  const handlePayWithGobipay = async () => {
    if (!email) {
      toast.warning('Email requis', 'Votre profil doit contenir une adresse email pour effectuer un paiement.');
      return;
    }

    const trimmedPhone = customerPhoneInput.trim();
    if (!trimmedPhone) {
      toast.error('Téléphone requis', 'Veuillez renseigner votre numéro Mobile Money pour continuer avec Gobipay.');
      return;
    }

    setProcessing(true);

    try {
      console.log('[PaymentForm] Initiating Gobipay payment', {
        courseId,
        amount,
        currency,
        fullname,
        email,
        phone: trimmedPhone,
      });

      const paymentData: PaymentInitiation = {
        courseId,
        paymentMethod: 'gobipay',
        paymentProvider: 'gobipay',
        customerFullname: fullname || 'Utilisateur Maison de la Société Civile',
        customerEmail: email,
        customerPhone: trimmedPhone,
      };

      const paymentResponse = await paymentService.initiatePayment(paymentData);
      setPayment(paymentResponse);

      const redirectUrl =
        paymentResponse.redirect_url ||
        (paymentResponse.metadata as any)?.redirect_url ||
        (paymentResponse.metadata as any)?.instructions?.redirect_url;

      if (redirectUrl) {
        console.log('[PaymentForm] 🔗 Redirection vers Gobipay', redirectUrl);
        window.location.href = redirectUrl;
        return;
      }

      toast.info(
        'Instructions envoyées',
        'Suivez les étapes affichées par Gobipay pour finaliser votre paiement.'
      );
      setProcessing(false);
    } catch (error: any) {
      console.error('[PaymentForm] Error initiating Gobipay payment:', error);
      setProcessing(false);
      toast.error('Erreur', error.message || "Impossible d'initier le paiement Gobipay");
    }
  };

  // Configurer les listeners Fedapay une seule fois au chargement
  useEffect(() => {
    if (!isFedapayReady || !fedapayConstants) {
      return;
    }

    console.log('[PaymentForm] 🔧 Fedapay SDK ready, widget can be initialized');
  }, [isFedapayReady, fedapayConstants]);

  const handlePayWithFedapay = async () => {
    if (!email) {
      toast.warning('Email requis', 'Votre profil doit contenir une adresse email pour effectuer un paiement.');
      return;
    }

    // Vérifier si le SDK est disponible, sinon attendre un peu
    if (!isFedapayReady) {
      console.log('[PaymentForm] Fedapay SDK pas encore prêt, attente...');
      let attempts = 0;
      const maxAttempts = 30; // 3 secondes max (30 * 100ms)
      const checkSDK = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && (window as any).FedaPay) {
          clearInterval(checkSDK);
          console.log('[PaymentForm] Fedapay SDK maintenant disponible, continuation...');
          setTimeout(() => handlePayWithFedapay(), 100);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkSDK);
          toast.error('Erreur', 'Le widget de paiement Fedapay n\'a pas pu être chargé. Veuillez rafraîchir la page.');
          setProcessing(false);
        }
      }, 100);
      return;
    }

    setProcessing(true);

    try {
      console.log('[PaymentForm] Initiating Fedapay payment', {
        courseId,
        amount,
        currency,
        fullname,
        email,
      });

      // Initier le paiement côté backend
      const paymentData: PaymentInitiation = {
        courseId,
        paymentMethod: 'fedapay',
        paymentProvider: 'fedapay',
        customerFullname: fullname || 'Utilisateur Maison de la Société Civile',
        customerEmail: email,
        customerPhone: phone,
      };

      const paymentResponse = await paymentService.initiatePayment(paymentData);
      setPayment(paymentResponse);

      // Stocker les métadonnées pour le webhook
      const userId = user?.id || (user as any)?.userId || (user as any)?.user_id;
      if (!userId) {
        console.error('[PaymentForm] ❌ User ID not found in user object:', user);
        throw new Error('Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter.');
      }
      
      if (!courseId) {
        console.error('[PaymentForm] ❌ Course ID not found');
        throw new Error('Identifiant du cours manquant. Veuillez réessayer.');
      }

      const metadata = {
        temp_payment_id: paymentResponse.id || paymentResponse.temp_payment_id,
        user_id: userId,
        course_id: courseId,
      };
      setPaymentMetadata(metadata);
      paymentMetadataRef.current = metadata;

      console.log('[PaymentForm] ✅ Payment metadata stored', {
        ...metadata,
        user_id_type: typeof metadata.user_id,
        course_id_type: typeof metadata.course_id,
      });

      // Extraire la clé publique et l'environnement depuis les métadonnées (comme Kkiapay)
      const rawPaymentData = paymentResponse.metadata?.raw || paymentResponse.metadata || {};
      const publicKey = rawPaymentData.public_key || paymentResponse.metadata?.public_key;
      const environment = rawPaymentData.environment || paymentResponse.metadata?.environment || 'sandbox';

      if (!publicKey) {
        throw new Error('Clé publique Fedapay manquante. Veuillez contacter le support.');
      }

      // S'assurer que l'environnement est 'live' ou 'sandbox'
      const fedapayEnvironment = (environment === 'live' || environment === 'sandbox') 
        ? environment 
        : 'sandbox';

      // Séparer le prénom et le nom pour Fedapay
      const nameParts = (fullname || 'Utilisateur Maison de la Société Civile').split(' ');
      const firstname = nameParts[0] || 'Utilisateur';
      const lastname = nameParts.slice(1).join(' ') || 'Maison de la Société Civile';

      console.log('[PaymentForm] Opening Fedapay widget', {
        amount,
        publicKeyPrefix: publicKey.substring(0, 20) + '...',
        publicKeySuffix: '...' + publicKey.substring(publicKey.length - 10),
        publicKeyLength: publicKey.length,
        environment: fedapayEnvironment,
        environmentType: typeof fedapayEnvironment,
      });

      // Vérifier que le bouton existe dans le DOM
      const payButton = document.querySelector('#fedapay-pay-btn');
      if (!payButton) {
        console.error('[PaymentForm] ❌ Le bouton #fedapay-pay-btn n\'existe pas dans le DOM');
        toast.error('Erreur', 'Le bouton de paiement n\'est pas disponible. Veuillez rafraîchir la page.');
        setProcessing(false);
        return;
      }
      console.log('[PaymentForm] ✅ Bouton #fedapay-pay-btn trouvé dans le DOM');

      // Vérifier que le SDK Fedapay est chargé (vérifier plusieurs noms possibles)
      const fedapayAPI = (window as any).FedaPay || (window as any).fedapay || (window as any).FedaPayCheckout || (window as any).FedaPayCheckoutJS;
      
      if (!fedapayAPI) {
        console.error('[PaymentForm] ❌ SDK Fedapay non chargé');
        console.error('[PaymentForm] window keys:', Object.keys(window).filter(k => 
          k.toLowerCase().includes('feda') || k.toLowerCase().includes('pay')
        ));
        
        // Attendre un peu plus si le SDK n'est pas encore chargé
        let attempts = 0;
        const maxAttempts = 20; // 2 secondes
        const checkSDK = setInterval(() => {
          attempts++;
          const api = (window as any).FedaPay || (window as any).fedapay || (window as any).FedaPayCheckout;
          if (api) {
            clearInterval(checkSDK);
            console.log('[PaymentForm] ✅ SDK maintenant disponible, continuation...');
            setTimeout(() => handlePayWithFedapay(), 100);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkSDK);
            toast.error('Erreur', 'Le widget de paiement FedaPay n\'a pas pu être chargé. Veuillez rafraîchir la page.');
            setProcessing(false);
          }
        }, 100);
        return;
      }
      
      // Normaliser dans window.FedaPay si nécessaire
      if (!(window as any).FedaPay && fedapayAPI) {
        (window as any).FedaPay = fedapayAPI;
      }
      
      const hasInit = typeof fedapayAPI.init === 'function';
      const hasCheckout = typeof fedapayAPI.checkout === 'function';
      
      if (!hasInit && !hasCheckout) {
        console.error('[PaymentForm] ❌ Aucune méthode disponible (init ou checkout)');
        console.error('[PaymentForm] API disponible:', {
          type: typeof fedapayAPI,
          keys: Object.keys(fedapayAPI),
        });
        toast.error('Erreur', 'Le widget de paiement FedaPay n\'a pas pu être chargé. Veuillez rafraîchir la page.');
        setProcessing(false);
        return;
      }
      console.log('[PaymentForm] ✅ SDK Fedapay chargé:', {
        hasFedaPay: !!(window as any).FedaPay,
        hasInit: hasInit,
        hasCheckout: hasCheckout,
        apiType: typeof fedapayAPI,
        apiKeys: Object.keys(fedapayAPI),
      });

      // Initialiser le widget Fedapay avec le sélecteur de bouton (format recommandé)
      // IMPORTANT: Avec FedaPay.init('#button-id', options), le widget s'ouvre automatiquement au clic
      console.log('[PaymentForm] 🔧 Initialisation du widget Fedapay...');
      console.log('[PaymentForm] Options Fedapay:', {
        publicKey: publicKey.substring(0, 20) + '...',
        environment: fedapayEnvironment,
        amount: amount,
        currency: currency,
        customerEmail: email,
      });
      
      // Structure selon la documentation Fedapay officielle
      // Pas besoin de 'environment' - Fedapay détecte automatiquement via la clé publique
      const fedapayOptions = {
        public_key: publicKey, // pk_live_* ou pk_sandbox_* - Fedapay détecte automatiquement
        transaction: {
          amount: amount,
          description: `Paiement formation - ${courseTitle}`,
          currency: currency,
        },
        customer: {
          email: email,
          firstname: firstname,
          lastname: lastname,
        },
        onComplete: async (reason: number, transaction: any) => {
          console.log('========================================');
          console.log('[PaymentForm] 🔔🔔🔔 FEDAPAY onComplete CALLBACK 🔔🔔🔔');
          console.log('========================================');
          console.log('[PaymentForm] 📋 REASON:', {
            value: reason,
            type: typeof reason,
            stringified: String(reason),
            isNumber: typeof reason === 'number',
            isString: typeof reason === 'string',
          });
          console.log('[PaymentForm] 📦 TRANSACTION OBJECT (FULL):', JSON.stringify(transaction, null, 2));
          console.log('[PaymentForm] 📦 TRANSACTION OBJECT (STRUCTURE):', {
            keys: transaction ? Object.keys(transaction) : 'null',
            hasId: !!transaction?.id,
            hasTransactionId: !!transaction?.transaction_id,
            hasTransaction: !!transaction?.transaction,
            hasStatus: !!transaction?.status,
            hasState: !!transaction?.state,
            status: transaction?.status,
            state: transaction?.state,
            transactionStatus: transaction?.transaction?.status,
            transactionState: transaction?.transaction?.state,
            amount: transaction?.amount,
            currency: transaction?.currency,
            fullTransaction: transaction,
          });
          console.log('========================================');
          
          // Vérifier les constantes disponibles (peuvent être des strings ou des nombres)
          const CHECKOUT_COMPLETED = fedapayConstants?.CHECKOUT_COMPLETED ?? window.FedaPay?.CHECKOUT_COMPLETED;
          const DIALOG_DISMISSED = fedapayConstants?.DIALOG_DISMISSED ?? window.FedaPay?.DIALOG_DISMISSED;
          
          // Normaliser reason - peut être un objet, un nombre, ou une string
          let reasonValue = reason;
          let reasonObject = null;
          if (typeof reason === 'object' && reason !== null) {
            reasonObject = reason;
            // Si reason est un objet, essayer d'extraire une valeur
            const reasonAny = reason as any;
            reasonValue = reasonAny?.value || reasonAny?.reason || reasonAny?.status || reasonAny?.code || reasonAny?.message || reasonAny?.type || String(reason);
            console.log('[PaymentForm] ⚠️ Reason is an object, analyzing...');
            console.log('[PaymentForm] 📦 Reason object keys:', Object.keys(reason));
            console.log('[PaymentForm] 📦 Reason object full:', JSON.stringify(reason, null, 2));
            console.log('[PaymentForm] 📦 Reason object extracted value:', reasonValue);
          }
          
          // Convertir en string pour comparaison
          const reasonString = String(reasonValue).toUpperCase();
          const completedString = String(CHECKOUT_COMPLETED || '').toUpperCase();
          const dismissedString = String(DIALOG_DISMISSED || '').toUpperCase();
          
          // Vérifier aussi dans l'objet reason si c'est un objet
          let reasonStatusFromObject = null;
          if (reasonObject) {
            reasonStatusFromObject = reasonObject.status || reasonObject.state || reasonObject.type || reasonObject.code;
            if (reasonStatusFromObject) {
              console.log('[PaymentForm] 📦 Found status in reason object:', reasonStatusFromObject);
            }
          }
          
          console.log('[PaymentForm] Fedapay constants and reason:', { 
            CHECKOUT_COMPLETED, 
            DIALOG_DISMISSED,
            reasonRaw: reason,
            reasonObject,
            reasonValue,
            reasonString,
            reasonStatusFromObject,
            completedString,
            dismissedString,
            reasonMatchesCompleted: reasonString.includes(completedString) || reasonString.includes('COMPLETE') || reasonString.includes('SUCCESS') || reasonString.includes('APPROVED'),
            reasonMatchesDismissed: reasonString.includes(dismissedString) || reasonString.includes('DISMISS') || reasonString.includes('CANCEL'),
          });
          
          // Extraire le statut de la transaction (peut être dans transaction.status, transaction.state, ou reason lui-même)
          const transactionStatus = transaction?.status || 
                                   transaction?.state || 
                                   transaction?.transaction?.status || 
                                   transaction?.transaction?.state ||
                                   reasonStatusFromObject ||
                                   (reasonObject?.status) ||
                                   (reasonObject?.state) ||
                                   (reasonObject?.type) ||
                                   reasonString ||
                                   'unknown';
          
          const normalizedStatus = String(transactionStatus).toLowerCase();
          const isApproved = normalizedStatus === 'approved' || 
                            normalizedStatus === 'completed' || 
                            normalizedStatus === 'success' ||
                            normalizedStatus === 'transferred' ||
                            normalizedStatus.includes('complete') ||
                            normalizedStatus.includes('success') ||
                            normalizedStatus.includes('approved');
          const isDeclined = normalizedStatus === 'declined' || 
                            normalizedStatus === 'failed' || 
                            normalizedStatus === 'error' ||
                            normalizedStatus === 'cancelled' ||
                            normalizedStatus === 'canceled' ||
                            normalizedStatus.includes('fail') ||
                            normalizedStatus.includes('error') ||
                            normalizedStatus.includes('cancel') ||
                            normalizedStatus.includes('decline');
          const isPending = normalizedStatus === 'pending' || 
                           normalizedStatus === 'processing' ||
                           normalizedStatus.includes('pending') ||
                           normalizedStatus.includes('processing');
          
          console.log('[PaymentForm] Transaction status analysis:', {
            rawStatus: transactionStatus,
            normalizedStatus,
            isApproved,
            isDeclined,
            isPending,
            reasonStatusFromObject,
          });
          
          // Vérifier si le paiement est réussi
          // Si reason contient "COMPLETE" ou "SUCCESS", ou si le statut est approuvé
          // OU si transaction existe et a un statut approuvé
          const isPaymentSuccess = reasonString.includes('COMPLETE') || 
                                  reasonString.includes('SUCCESS') ||
                                  reasonString.includes('APPROVED') ||
                                  (reasonStatusFromObject && String(reasonStatusFromObject).toLowerCase().includes('approved')) ||
                                  (reasonStatusFromObject && String(reasonStatusFromObject).toLowerCase().includes('complete')) ||
                                  (transaction && isApproved) ||
                                  (isApproved && !reasonString.includes('DISMISS') && !reasonString.includes('CANCEL') && !reasonString.includes('FAIL'));
          
          // Vérifier si c'est une annulation
          const isPaymentCancelled = reasonString.includes('DISMISS') || 
                                    reasonString.includes('CANCEL') ||
                                    (reasonStatusFromObject && String(reasonStatusFromObject).toLowerCase().includes('cancel')) ||
                                    (isDeclined && !isApproved && !reasonString.includes('COMPLETE') && !reasonString.includes('SUCCESS'));
          
          console.log('[PaymentForm] Payment decision:', {
            isPaymentSuccess,
            isPaymentCancelled,
            isDeclined,
            reasonString,
            normalizedStatus,
          });
          
          if (isPaymentSuccess) {
            // Paiement réussi
            console.log('[PaymentForm] 🎉 Fedapay payment successful!', transaction);
            setProcessing(false);

            const currentMetadata = paymentMetadataRef.current;
            if (!currentMetadata) {
              console.error('[PaymentForm] Payment metadata missing');
              toast.error('Erreur', 'Les métadonnées de paiement sont manquantes. Veuillez contacter le support.');
              return;
            }

            try {
              // Vérifier que les métadonnées sont complètes
              if (!currentMetadata.user_id || !currentMetadata.course_id) {
                console.error('[PaymentForm] ❌ Metadata incomplete:', currentMetadata);
                toast.error('Erreur', 'Les informations de paiement sont incomplètes. Veuillez contacter le support.');
                return;
              }

              // Déterminer le statut à envoyer au backend
              // Si la transaction a un statut "approved", utiliser SUCCESS, sinon utiliser le statut normalisé
              const backendStatus = isApproved ? 'SUCCESS' : 
                                   normalizedStatus === 'pending' ? 'PENDING' :
                                   normalizedStatus === 'processing' ? 'PROCESSING' :
                                   'SUCCESS'; // Par défaut, considérer comme succès si reason === CHECKOUT_COMPLETED
              
              // Appeler le backend pour finaliser le paiement et créer l'inscription
              // Extraire transaction_id de manière sécurisée
              let extractedTransactionId = null;
              if (transaction) {
                extractedTransactionId = transaction.id || 
                                        transaction.transaction_id || 
                                        transaction.transaction?.id ||
                                        transaction.transaction?.transaction_id ||
                                        null;
              }
              // Si transaction est undefined, essayer depuis reason si c'est un objet
              if (!extractedTransactionId && reasonObject) {
                extractedTransactionId = reasonObject.id || 
                                       reasonObject.transaction_id || 
                                       reasonObject.transactionId ||
                                       null;
              }
              
              // Extraire amount de manière sécurisée
              let extractedAmount = amount;
              if (transaction) {
                extractedAmount = transaction.amount || 
                                transaction.transaction?.amount || 
                                amount;
              }
              if (extractedAmount === amount && reasonObject) {
                extractedAmount = reasonObject.amount || amount;
              }
              
              // Extraire currency de manière sécurisée
              let extractedCurrency = currency;
              if (transaction) {
                extractedCurrency = transaction.currency || 
                                   transaction.transaction?.currency || 
                                   currency;
              }
              if (extractedCurrency === currency && reasonObject) {
                extractedCurrency = reasonObject.currency || currency;
              }
              
              const webhookPayload = {
                transaction_id: extractedTransactionId,
                status: backendStatus,
                amount: extractedAmount,
                currency: extractedCurrency,
                metadata: {
                  user_id: currentMetadata.user_id,
                  course_id: currentMetadata.course_id,
                  temp_payment_id: currentMetadata.temp_payment_id,
                },
                // Inclure les données complètes de la transaction pour le débogage
                transaction_data: transaction || reasonObject || null,
              };

              console.log('========================================');
              console.log('[PaymentForm] 🚀 ENVOI AU BACKEND');
              console.log('========================================');
              console.log('[PaymentForm] 📤 PAYLOAD COMPLET:', JSON.stringify(webhookPayload, null, 2));
              console.log('[PaymentForm] 📤 PAYLOAD STRUCTURE:', {
                transaction_id: webhookPayload.transaction_id,
                status: webhookPayload.status,
                amount: webhookPayload.amount,
                currency: webhookPayload.currency,
                metadata: webhookPayload.metadata,
                hasTransactionData: !!webhookPayload.transaction_data,
              });
              console.log('========================================');

              const apiRequest = (await import('../../lib/services/api')).apiRequest;
              let finalizeResponse;
              try {
                console.log('[PaymentForm] 📡 Appel API vers /payments/finalize-fedapay...');
                finalizeResponse = await apiRequest('/payments/finalize-fedapay', {
                  method: 'POST',
                  body: JSON.stringify(webhookPayload),
                });
                console.log('========================================');
                console.log('[PaymentForm] ✅ RÉPONSE BACKEND REÇUE');
                console.log('========================================');
                console.log('[PaymentForm] 📥 RESPONSE COMPLETE:', JSON.stringify(finalizeResponse, null, 2));
                console.log('[PaymentForm] 📥 RESPONSE STRUCTURE:', {
                  success: finalizeResponse?.success,
                  message: finalizeResponse?.message,
                  error: finalizeResponse?.error,
                  data: finalizeResponse?.data,
                  fullResponse: finalizeResponse,
                });
                console.log('========================================');
              } catch (apiError: any) {
                console.log('========================================');
                console.log('[PaymentForm] ❌ ERREUR API');
                console.log('========================================');
                console.error('[PaymentForm] ❌ API Error (full):', apiError);
                console.error('[PaymentForm] ❌ API Error (structure):', {
                  message: apiError.message,
                  response: apiError.response,
                  data: apiError.data,
                  status: apiError.status,
                  statusText: apiError.statusText,
                  stack: apiError.stack,
                });
                // Si c'est une erreur HTTP, essayer d'extraire le message
                if (apiError.response || apiError.data) {
                  const errorData = apiError.response?.data || apiError.data;
                  console.error('[PaymentForm] ❌ Error Data:', JSON.stringify(errorData, null, 2));
                  throw new Error(errorData?.message || errorData?.error || apiError.message || 'Erreur lors de la communication avec le serveur');
                }
                throw apiError;
              }

              if (finalizeResponse && finalizeResponse.success !== false) {
                const courseId = currentMetadata.course_id || finalizeResponse.data?.course_id;
                toast.success('Paiement réussi', 'Votre paiement a été traité avec succès !');
                
                // Rediriger vers le dashboard avec le course_id après un court délai
                setTimeout(() => {
                  if (courseId) {
                    router.push(`/dashboard/student/courses?payment=success&course_id=${courseId}`);
                  } else {
                    router.push('/dashboard/student/courses?payment=success');
                  }
                }, 1500);
              } else {
                const errorMessage = finalizeResponse?.error || finalizeResponse?.message || 'Erreur lors de l\'enregistrement';
                console.error('[PaymentForm] ❌ Backend returned error:', finalizeResponse);
                throw new Error(errorMessage);
              }
            } catch (error: any) {
              console.error('[PaymentForm] ❌ Error finalizing Fedapay payment:', error);
              const errorMessage = error.message || 'Une erreur est survenue lors de l\'enregistrement';
              toast.error('Erreur', `Le paiement a été traité, mais ${errorMessage}. Veuillez contacter le support si le problème persiste.`);
              // Rediriger quand même vers la page des cours
              setTimeout(() => {
                router.push('/dashboard/student/courses?payment=success');
              }, 2000);
            }
          } else if (isPaymentCancelled || isDeclined) {
            // Dialog fermé par l'utilisateur OU paiement refusé/échoué
            const isUserCancelled = reasonString.includes('DISMISS') || reasonString.includes('CANCEL');
            const isPaymentDeclined = isDeclined && !isUserCancelled;
            
            console.log('[PaymentForm] Fedapay payment ended (cancelled/declined)', {
              reason,
              reasonString,
              isUserCancelled,
              isPaymentDeclined,
              transactionStatus: normalizedStatus,
            });
            
            setProcessing(false);
            
            const currentMetadata = paymentMetadataRef.current;
            if (currentMetadata) {
              // Enregistrer l'annulation ou l'échec côté backend
              try {
                const finalStatus = isPaymentDeclined ? 'FAILED' : 'CANCELLED';
                const errorMessage = isPaymentDeclined 
                  ? `Paiement refusé/échoué (statut: ${transactionStatus})`
                  : 'Paiement annulé par l\'utilisateur';
                
                // Extraire les données de manière sécurisée
                let extractedTransactionId = null;
                let extractedAmount = amount;
                let extractedCurrency = currency;
                
                if (transaction) {
                  extractedTransactionId = transaction.id || 
                                          transaction.transaction_id || 
                                          transaction.transaction?.id ||
                                          null;
                  extractedAmount = transaction.amount || 
                                   transaction.transaction?.amount || 
                                   amount;
                  extractedCurrency = transaction.currency || 
                                     transaction.transaction?.currency || 
                                     currency;
                }
                
                // Si transaction est undefined, essayer depuis reason si c'est un objet
                if (!extractedTransactionId && reasonObject) {
                  extractedTransactionId = reasonObject.id || 
                                         reasonObject.transaction_id || 
                                         reasonObject.transactionId ||
                                         null;
                }
                if (extractedAmount === amount && reasonObject) {
                  extractedAmount = reasonObject.amount || amount;
                }
                if (extractedCurrency === currency && reasonObject) {
                  extractedCurrency = reasonObject.currency || currency;
                }
                
                const webhookPayload = {
                  transaction_id: extractedTransactionId,
                  status: finalStatus,
                  amount: extractedAmount,
                  currency: extractedCurrency,
                  error_message: errorMessage,
                  metadata: currentMetadata,
                  transaction_data: transaction || reasonObject || null,
                };

                console.log('[PaymentForm] 📤 Sending payment status to backend', {
                  status: finalStatus,
                  transactionStatus,
                  errorMessage,
                });

                const apiRequest = (await import('../../lib/services/api')).apiRequest;
                await apiRequest('/payments/finalize-fedapay', {
                  method: 'POST',
                  body: JSON.stringify(webhookPayload),
                });
                
                console.log('[PaymentForm] ✅ Payment status sent to backend');
              } catch (error: any) {
                console.error('[PaymentForm] ❌ Error recording payment status:', error);
              }
            }
            
            if (isPaymentDeclined) {
              toast.error('Paiement échoué', 'Le paiement a été refusé ou a échoué. Veuillez réessayer.');
              setTimeout(() => {
                router.push('/dashboard/student/courses?payment=failed');
              }, 1500);
            } else {
              toast.info('Paiement annulé', 'Le paiement a été annulé.');
              setTimeout(() => {
                router.push('/dashboard/student/courses?payment=cancelled');
              }, 1500);
            }
          } else {
            // Autre raison inconnue - traiter comme échec par défaut
            console.warn('[PaymentForm] ⚠️ Fedapay payment ended with unknown reason:', {
              reason,
              reasonValue,
              reasonString,
              transactionStatus: normalizedStatus,
              transaction: transaction,
              CHECKOUT_COMPLETED,
              DIALOG_DISMISSED,
            });
            setProcessing(false);
            
            const currentMetadata = paymentMetadataRef.current;
            if (currentMetadata) {
              // Enregistrer l'échec côté backend
              try {
                // Essayer d'extraire transaction_id depuis reason si c'est un objet
                let extractedTransactionId = null;
                if (typeof reason === 'object' && reason !== null) {
                  const reasonAny = reason as any;
                  extractedTransactionId = reasonAny?.id || reasonAny?.transaction_id || reasonAny?.transactionId;
                }
                
                // Extraire les données de manière sécurisée
                let finalTransactionId = null;
                let finalAmount = amount;
                let finalCurrency = currency;
                
                if (transaction) {
                  finalTransactionId = transaction.id || 
                                     transaction.transaction_id || 
                                     transaction.transaction?.id ||
                                     null;
                  finalAmount = transaction.amount || 
                               transaction.transaction?.amount || 
                               amount;
                  finalCurrency = transaction.currency || 
                                 transaction.transaction?.currency || 
                                 currency;
                }
                
                // Si transaction est undefined, essayer depuis reason si c'est un objet
                if (!finalTransactionId && reasonObject) {
                  finalTransactionId = reasonObject.id || 
                                     reasonObject.transaction_id || 
                                     reasonObject.transactionId ||
                                     extractedTransactionId ||
                                     null;
                }
                if (finalAmount === amount && reasonObject) {
                  finalAmount = reasonObject.amount || amount;
                }
                if (finalCurrency === currency && reasonObject) {
                  finalCurrency = reasonObject.currency || currency;
                }
                
                const webhookPayload = {
                  transaction_id: finalTransactionId,
                  status: 'FAILED',
                  amount: finalAmount,
                  currency: finalCurrency,
                  error_message: `Paiement terminé avec raison inconnue: ${JSON.stringify(reason)} (statut transaction: ${transactionStatus})`,
                  metadata: currentMetadata,
                  transaction_data: transaction || reasonObject || null,
                };

                console.log('[PaymentForm] 📤 Sending unknown reason failure to backend:', webhookPayload);

                const apiRequest = (await import('../../lib/services/api')).apiRequest;
                await apiRequest('/payments/finalize-fedapay', {
                  method: 'POST',
                  body: JSON.stringify(webhookPayload),
                });
              } catch (error: any) {
                console.error('[PaymentForm] ❌ Error recording failure:', error);
              }
            }
            
            toast.error('Paiement échoué', 'Le paiement n\'a pas pu être traité. Veuillez réessayer.');
            setTimeout(() => {
              router.push('/dashboard/student/courses?payment=failed');
            }, 1500);
          }
        },
      };

      // Utiliser checkout() qui ouvre directement le widget (méthode la plus simple)
      if (hasCheckout) {
        console.log('[PaymentForm] 🚀 Utilisation de FedaPay.checkout() pour ouvrir directement le widget');
        try {
          fedapayAPI.checkout(fedapayOptions);
          console.log('[PaymentForm] ✅ Widget Fedapay ouvert via checkout()');
          // Le widget s'ouvre automatiquement avec checkout()
          // Ne pas mettre setProcessing(false) car le widget gère son propre état
          return;
        } catch (error: any) {
          console.error('[PaymentForm] ❌ Erreur avec checkout():', error);
          toast.error('Erreur', `Erreur lors de l'ouverture du widget: ${error.message || 'Erreur inconnue'}`);
          setProcessing(false);
          return;
        }
      }

      // Si checkout() n'est pas disponible, utiliser init()
      if (hasInit) {
        console.log('[PaymentForm] 🚀 Utilisation de FedaPay.init()');
        try {
          const widgetInstance = fedapayAPI.init(fedapayOptions);
          console.log('[PaymentForm] ✅ Widget initialisé via init()');
          
          if (widgetInstance && typeof widgetInstance.open === 'function') {
            // Ouvrir le widget immédiatement
            setTimeout(() => {
              try {
                widgetInstance.open();
                console.log('[PaymentForm] ✅ Widget Fedapay ouvert via open()');
              } catch (error: any) {
                console.error('[PaymentForm] ❌ Erreur lors de l\'ouverture:', error);
                toast.error('Erreur', `Impossible d'ouvrir le widget: ${error.message || 'Erreur inconnue'}`);
                setProcessing(false);
              }
            }, 300);
          } else {
            console.warn('[PaymentForm] ⚠️ Widget initialisé mais pas de méthode open()');
            toast.info('Prêt', 'Le widget est initialisé. Le paiement devrait se déclencher automatiquement.');
          }
          
          fedapayWidgetRef.current = widgetInstance;
          return;
        } catch (error: any) {
          console.error('[PaymentForm] ❌ Erreur avec init():', error);
          toast.error('Erreur', `Erreur lors de l'initialisation: ${error.message || 'Erreur inconnue'}`);
          setProcessing(false);
          return;
        }
      }

      // Si aucune méthode n'est disponible
      throw new Error('Aucune méthode FedaPay disponible (ni checkout() ni init())');
    } catch (error: any) {
      console.error('[PaymentForm] Error initiating Fedapay payment:', error);
      setProcessing(false);
      toast.error('Erreur', error.message || "Impossible d'initier le paiement Fedapay");
    }
  };

  const handlePayWithKkiapay = async () => {
    if (!email) {
      toast.warning('Email requis', 'Votre profil doit contenir une adresse email pour effectuer un paiement.');
      return;
    }

    // Vérifier si le SDK est disponible, sinon attendre un peu
    if (!isKkiapayReady) {
      console.log('[PaymentForm] SDK pas encore prêt, attente...');
      // Attendre jusqu'à 3 secondes pour que le SDK se charge
      let attempts = 0;
      const maxAttempts = 30; // 3 secondes max (30 * 100ms)
      const checkSDK = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && (window as any).openKkiapayWidget) {
          clearInterval(checkSDK);
          console.log('[PaymentForm] SDK maintenant disponible, continuation...');
          // Relancer la fonction après un court délai
          setTimeout(() => handlePayWithKkiapay(), 100);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkSDK);
          toast.error('Erreur', 'Le widget de paiement n\'a pas pu être chargé. Veuillez rafraîchir la page.');
          setProcessing(false);
        }
      }, 100);
      return;
    }

    setProcessing(true);

    try {
      console.log('[PaymentForm] Initiating Kkiapay payment', {
        courseId,
        amount,
        currency,
        fullname,
        email,
      });

      // Initier le paiement côté backend
      const paymentData: PaymentInitiation = {
        courseId,
        paymentMethod: 'kkiapay',
        paymentProvider: 'kkiapay',
        customerFullname: fullname || 'Utilisateur Maison de la Société Civile',
        customerEmail: email,
        customerPhone: phone,
      };

      const paymentResponse = await paymentService.initiatePayment(paymentData);
      setPayment(paymentResponse);
      
      // Stocker les métadonnées pour le webhook (état et ref)
      const metadata = {
        temp_payment_id: paymentResponse.id || paymentResponse.temp_payment_id,
        user_id: user?.id || (user as any)?.userId,
        course_id: courseId,
      };
      setPaymentMetadata(metadata);
      paymentMetadataRef.current = metadata; // Mettre à jour la ref aussi
      
      console.log('[PaymentForm] Payment metadata stored', metadata);

      // Vérifier que la clé publique est présente
      const publicKey = paymentResponse.metadata?.public_key;
      let sandbox = paymentResponse.metadata?.sandbox;
      
      // Normaliser sandbox en booléen
      if (typeof sandbox === 'string') {
        sandbox = sandbox === 'true' || sandbox === '1';
      }
      sandbox = Boolean(sandbox);

      if (!publicKey) {
        throw new Error('Clé publique Kkiapay manquante. Veuillez contacter le support.');
      }

      // Vérifier si c'est une Private API Key
      if (publicKey.startsWith('tpk_') || publicKey.startsWith('pk_')) {
        throw new Error('Configuration incorrecte: Private API Key détectée. Veuillez contacter le support.');
      }

      console.log('[PaymentForm] Opening Kkiapay widget', {
        amount: String(amount),
        publicKeyPrefix: publicKey.substring(0, 20) + '...',
        publicKeySuffix: '...' + publicKey.substring(publicKey.length - 10),
        publicKeyLength: publicKey.length,
        sandbox: sandbox,
        sandboxType: typeof sandbox,
        environment: sandbox ? 'SANDBOX' : 'PRODUCTION',
      });

      // Ouvrir le widget Kkiapay
      // Note: paymentmethod n'est pas inclus car Kkiapay choisit automatiquement
      // Position: center pour centrer le widget
      // Theme: utilise la couleur principale de la plateforme #3B7C8A
      const widgetOpened = openKkiapayWidget({
        amount: String(amount),
        position: 'center',
        theme: '#3B7C8A', // Couleur principale de la plateforme Maison de la Société Civile
        key: publicKey,
        sandbox: sandbox,
        name: fullname || undefined,
        email: email,
        phone: phone || undefined,
        // paymentmethod n'est pas inclus - laissé par défaut
      });

      if (!widgetOpened) {
        throw new Error('Impossible d\'ouvrir le widget de paiement. Veuillez réessayer.');
      }

      toast.info('Widget ouvert', 'Suivez les instructions dans le widget de paiement.');
    } catch (error: any) {
      console.error('[PaymentForm] Error initiating payment:', error);
      setProcessing(false);
      toast.error('Erreur', error.message || "Impossible d'initier le paiement Kkiapay");
    }
  };

  return (
    <div className="w-full">
      {demoMode && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-900 mb-1">
                🎭 MODE DEMO ACTIVÉ
              </p>
              <p className="text-xs text-yellow-800">
                Le paiement est simulé. Aucun débit réel ne sera effectué.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résumé du cours et montant */}
      <div className="mb-8 bg-gradient-to-br from-[#3B7C8A]/5 to-[#2d5f6a]/5 border-2 border-[#3B7C8A]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Formation</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{courseTitle}</p>
          </div>
          <div className="flex-shrink-0 md:text-right">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Montant total</p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] bg-clip-text text-transparent">
              {amount.toLocaleString('fr-FR')} {currency}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sélection du provider */}
        {loadingProviders ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader className="h-5 w-5 text-[#3B7C8A] animate-spin" />
              <p className="text-sm text-gray-700">Chargement des méthodes de paiement...</p>
            </div>
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Aucune méthode de paiement disponible</p>
                <p className="text-xs text-red-700">
                  Aucun provider de paiement n'est actuellement configuré. Veuillez contacter l'administrateur.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Choisissez votre méthode de paiement
              </label>
              <div className="grid grid-cols-1 gap-3">
                {providers.map((provider) => {
                  const isSelected = selectedProvider?.id === provider.id;
                  const isKkiapay = provider.provider_name === 'kkiapay';
                  const isFedapay = provider.provider_name === 'fedapay';
                  
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? isKkiapay
                            ? 'border-[#3B7C8A] bg-gradient-to-r from-[#3B7C8A]/10 to-[#2d5f6a]/10'
                            : isFedapay
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100'
                            : 'border-gray-300 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-3 rounded-lg ${
                          isKkiapay
                            ? 'bg-gradient-to-br from-[#3B7C8A] to-[#2d5f6a]'
                            : isFedapay
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                            : 'bg-gray-200'
                        }`}>
                          {isKkiapay ? (
                            <CreditCard className="h-6 w-6 text-white" />
                          ) : isFedapay ? (
                            <Wallet className="h-6 w-6 text-white" />
                          ) : (
                            <Smartphone className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <p className={`font-semibold ${
                              isSelected ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {isKkiapay ? 'Kkiapay' : isFedapay ? 'Fedapay' : provider.provider_name}
                            </p>
                            {provider.is_sandbox && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Sandbox
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isKkiapay 
                              ? 'Paiement sécurisé par carte bancaire ou mobile money'
                              : isFedapay
                              ? 'Paiement sécurisé par Fedapay'
                              : 'Méthode de paiement'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-4">
                          <div className={`p-2 rounded-full ${
                            isKkiapay
                              ? 'bg-[#3B7C8A]'
                              : isFedapay
                              ? 'bg-purple-500'
                              : 'bg-gray-400'
                          }`}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {selectedProvider && (
          <div className={`rounded-xl p-5 border ${
            selectedProvider.provider_name === 'kkiapay'
              ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200/50'
              : selectedProvider.provider_name === 'fedapay'
              ? 'bg-gradient-to-r from-purple-50/50 to-purple-100/50 border-purple-200/50'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm text-gray-700 leading-relaxed">
              {selectedProvider.provider_name === 'kkiapay' ? (
                <>
                  <span className="font-semibold text-[#3B7C8A]">Cliquez sur "Payer"</span> pour ouvrir le widget de paiement sécurisé.
                  Vous pourrez y finaliser votre transaction en toute sécurité.
                </>
              ) : selectedProvider.provider_name === 'fedapay' ? (
                <>
                  <span className="font-semibold text-purple-700">Cliquez sur "Payer"</span> pour être redirigé vers Fedapay.
                  Vous pourrez y finaliser votre transaction en toute sécurité.
                </>
              ) : selectedProvider.provider_name === 'gobipay' ? (
                <>
                  <span className="font-semibold text-blue-700">Indiquez votre numéro Mobile Money</span> puis validez.
                  Vous serez redirigé vers l’interface Gobipay pour confirmer la transaction.
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">Cliquez sur "Payer"</span> pour continuer avec votre méthode de paiement sélectionnée.
                </>
              )}
            </p>
          </div>
        )}

        {selectedProvider?.provider_name === 'gobipay' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <label className="text-sm font-semibold text-blue-900">
              Numéro Mobile Money
            </label>
            <input
              type="tel"
              value={customerPhoneInput}
              onChange={(e) => setCustomerPhoneInput(e.target.value)}
              placeholder="Ex: 0102030405"
              className="w-full px-4 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <p className="text-xs text-blue-800">
              Ce numéro doit correspondre à celui qui validera le paiement (MTN, Moov, etc.).
            </p>
          </div>
        )}

        {/* Alertes */}
        {!email && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Email requis</p>
                <p className="text-xs text-red-700">
                  Votre profil doit contenir une adresse email pour effectuer un paiement.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isKkiapayReady && selectedProvider?.provider_name === 'kkiapay' && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 text-yellow-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Chargement en cours</p>
                <p className="text-xs text-yellow-700">Le widget de paiement se charge, veuillez patienter...</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            disabled={processing}
          >
            <span>Annuler</span>
          </button>
          <button
            id={selectedProvider?.provider_name === 'fedapay' ? 'fedapay-pay-btn' : undefined}
            type="button"
            onClick={async () => {
              if (selectedProvider?.provider_name === 'fedapay') {
                await handlePayWithFedapay();
              } else if (selectedProvider?.provider_name === 'gobipay') {
                await handlePayWithGobipay();
              } else {
                if (selectedProvider) {
                  handlePayWithProvider(selectedProvider);
                }
              }
            }}
            disabled={
              processing ||
              !email ||
              !selectedProvider ||
              (selectedProvider.provider_name === 'kkiapay' && !isKkiapayReady) ||
              (selectedProvider.provider_name === 'fedapay' && !isFedapayReady) ||
              (selectedProvider.provider_name === 'gobipay' && !customerPhoneInput.trim()) ||
              loadingProviders
            }
            className={`px-8 py-3.5 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] ${
              selectedProvider?.provider_name === 'kkiapay'
                ? 'bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] hover:from-[#2d5f6a] hover:to-[#1f4a52] disabled:hover:from-[#3B7C8A] disabled:hover:to-[#2d5f6a]'
                : selectedProvider?.provider_name === 'fedapay'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:hover:from-purple-500 disabled:hover:to-purple-600'
                : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:hover:from-gray-600 disabled:hover:to-gray-700'
            }`}
          >
            {processing ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Ouverture...</span>
              </>
            ) : !isKkiapayReady && selectedProvider?.provider_name === 'kkiapay' ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                {selectedProvider?.provider_name === 'kkiapay' ? (
                  <CreditCard className="h-5 w-5" />
                ) : selectedProvider?.provider_name === 'fedapay' ? (
                  <Wallet className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
                <span>Payer{selectedProvider ? ` avec ${selectedProvider.provider_name === 'kkiapay' ? 'Kkiapay' : selectedProvider.provider_name === 'fedapay' ? 'Fedapay' : selectedProvider.provider_name}` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
