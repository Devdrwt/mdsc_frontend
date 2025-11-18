'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader, Info, Home, CreditCard, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { paymentService, PaymentInitiation, isDemoMode, Payment } from '../../lib/services/paymentService';
import { useAuthStore } from '../../lib/stores/authStore';
import { useKkiapay } from '../../hooks/useKkiapay';
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
  const { isReady, openWidget, onSuccess, onFailed } = useKkiapay();
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentMetadata, setPaymentMetadata] = useState<{ temp_payment_id?: string; user_id?: number; course_id?: string } | null>(null);
  // Utiliser une ref pour stocker les métadonnées afin qu'elles soient accessibles dans les listeners
  const paymentMetadataRef = useRef<{ temp_payment_id?: string; user_id?: number; course_id?: string } | null>(null);
  const demoMode = isDemoMode();

  // Récupérer les informations de l'utilisateur
  const fullname = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  // Essayer plusieurs façons de récupérer l'email
  const email = user?.email || (user as any)?.email || '';
  const phone = (user as any)?.phone || user?.phone || '';


  // Configurer les listeners Kkiapay une seule fois au chargement
  useEffect(() => {
    if (!isReady) {
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
  }, [isReady, onSuccess, onFailed]); // Ne pas inclure paymentMetadata dans les dépendances

  const handlePayWithKkiapay = async () => {
    if (!email) {
      toast.warning('Email requis', 'Votre profil doit contenir une adresse email pour effectuer un paiement.');
      return;
    }

    // Vérifier si le SDK est disponible, sinon attendre un peu
    if (!isReady) {
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
        customerFullname: fullname || 'Étudiant MdSC',
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
      const sandbox = paymentResponse.metadata?.sandbox;

      if (!publicKey) {
        throw new Error('Clé publique Kkiapay manquante. Veuillez contacter le support.');
      }

      // Vérifier si c'est une Private API Key
      if (publicKey.startsWith('tpk_') || publicKey.startsWith('pk_')) {
        throw new Error('Configuration incorrecte: Private API Key détectée. Veuillez contacter le support.');
      }

      console.log('[PaymentForm] Opening Kkiapay widget', {
        amount: String(amount),
        publicKey: publicKey.substring(0, 10) + '...',
        sandbox,
      });

      // Ouvrir le widget Kkiapay
      // Note: paymentmethod n'est pas inclus car Kkiapay choisit automatiquement
      // Position: center pour centrer le widget
      // Theme: utilise la couleur principale de la plateforme #3B7C8A
      const widgetOpened = openWidget({
        amount: String(amount),
        position: 'center',
        theme: '#3B7C8A', // Couleur principale de la plateforme MdSC
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
        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#3B7C8A]">Cliquez sur "Payer avec Kkiapay"</span> pour ouvrir le widget de paiement sécurisé.
            Vous pourrez y finaliser votre transaction en toute sécurité.
          </p>
        </div>

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

        {!isReady && (
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
            type="button"
            onClick={handlePayWithKkiapay}
            disabled={processing || !email}
            className="px-8 py-3.5 bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] text-white rounded-xl hover:from-[#2d5f6a] hover:to-[#1f4a52] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#3B7C8A] disabled:hover:to-[#2d5f6a] font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Ouverture du widget...</span>
              </>
            ) : !isReady ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>Payer avec Kkiapay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
