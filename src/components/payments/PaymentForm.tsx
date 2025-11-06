'use client';

import React, { useState } from 'react';
import { CreditCard, Smartphone, Loader, AlertCircle, Info, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PaymentMethodSelector from './PaymentMethodSelector';
import { paymentService, PaymentInitiation, isDemoMode } from '../../lib/services/paymentService';
import toast from '../../lib/utils/toast';

interface PaymentFormProps {
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  onPaymentInitiated: (paymentId: string) => void;
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
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'mobile_money' | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Pour carte bancaire
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      toast.warning('Méthode requise', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (selectedMethod === 'mobile_money' && !paymentProvider) {
      toast.warning('Opérateur requis', 'Veuillez sélectionner un opérateur Mobile Money');
      return;
    }

    // En mode démo, validation simplifiée (juste pour l'UX)
    if (!demoMode && selectedMethod === 'card') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs de la carte');
        return;
      }
    }

    setProcessing(true);
    try {
      const paymentData: PaymentInitiation = {
        courseId,
        paymentMethod: selectedMethod,
        paymentProvider: selectedMethod === 'mobile_money' ? paymentProvider : undefined,
      };

      const payment = await paymentService.initiatePayment(paymentData);
      
      if (demoMode) {
        toast.success('Paiement simulé', 'Le paiement a été simulé avec succès en mode démo !');
      } else {
        toast.success('Paiement initié', 'Redirection vers le traitement du paiement...');
      }
      
      onPaymentInitiated(payment.id);
    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      toast.error('Erreur', error.message || 'Impossible d\'initier le paiement');
    } finally {
      setProcessing(false);
    }
  };

  const demoMode = isDemoMode();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Bannière Mode Démo */}
        {demoMode && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-yellow-900 mb-1">
                  🎭 MODE DÉMO ACTIVÉ
                </p>
                <p className="text-xs text-yellow-800">
                  Le paiement est simulé. Aucun paiement réel ne sera effectué. 
                  Vous pouvez utiliser n'importe quelles informations de carte ou numéro de téléphone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cours</p>
                <p className="font-semibold text-gray-900">{courseTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Montant</p>
                <p className="text-2xl font-bold text-blue-600">
                  {amount.toLocaleString('fr-FR')} {currency}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de la méthode */}
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />

          {/* Formulaire selon la méthode */}
          {selectedMethod === 'card' && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Informations de la carte</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom sur la carte <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setCardExpiry(value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value);
                      }
                    }}
                    placeholder="MM/AA"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'mobile_money' && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Sélectionner l'opérateur</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {['orange', 'mtn', 'moov'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setPaymentProvider(provider)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentProvider === provider
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className={`h-8 w-8 mx-auto mb-2 ${
                      paymentProvider === provider ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      paymentProvider === provider ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {provider === 'orange' ? 'Orange Money' : provider === 'mtn' ? 'MTN Mobile Money' : 'Moov Money'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Instructions
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Vous recevrez un code de confirmation sur votre téléphone. Entrez ce code pour finaliser le paiement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/student')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              disabled={processing}
            >
              <Home className="h-5 w-5" />
              <span>Retour au dashboard</span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={processing || !selectedMethod || (selectedMethod === 'mobile_money' && !paymentProvider)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <span>Payer {amount.toLocaleString('fr-FR')} {currency}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

