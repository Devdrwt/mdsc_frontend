'use client';

import React, { useEffect, useState } from 'react';
import { Loader, Info, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { paymentService, PaymentInitiation, isDemoMode, Payment } from '../../lib/services/paymentService';
import { useAuthStore } from '../../lib/stores/authStore';
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
  const [processing, setProcessing] = useState(false);
  const [customerFullname, setCustomerFullname] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const demoMode = isDemoMode();

  useEffect(() => {
    if (user) {
      const fullname = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullname) {
        setCustomerFullname(fullname);
      }
      if (user.email) {
        setCustomerEmail(user.email);
      }
      if ((user as any).phone || user.phone) {
        const phoneValue = (user as any).phone || user.phone || '';
        setCustomerPhone(phoneValue);
      }
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fullname = customerFullname.trim();
    const email = customerEmail.trim();
    const phone = customerPhone.trim().replace(/\s+/g, '');

    if (!fullname) {
      toast.warning('Informations requises', 'Veuillez entrer votre nom complet.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning('Email invalide', 'Veuillez saisir une adresse email valide.');
      return;
    }

    if (phone.length < 8) {
      toast.warning('Téléphone requis', 'Veuillez saisir un numéro de téléphone valide (inclure indicatif, ex. 22961000000).');
      return;
    }

    setProcessing(true);
    console.log('[PaymentForm] Initiating GobiPay payment', {
      courseId,
      fullname,
      email,
      phone,
    });

    try {
      const paymentData: PaymentInitiation = {
        courseId,
        paymentMethod: 'gobipay',
        paymentProvider: 'gobipay',
        customerFullname: fullname,
        customerEmail: email,
        customerPhone: phone,
      };

      const payment = await paymentService.initiatePayment(paymentData);

      if (demoMode) {
        toast.success('Paiement simulé', 'Le paiement a été simulé avec succès !');
      } else if (payment.redirect_url) {
        toast.success('Paiement initié', 'Redirection vers GobiPay...');
      } else {
        toast.info('Paiement initié', 'Suivez les instructions de GobiPay affichées ci-dessous.');
      }

      onPaymentInitiated(payment);
    } catch (error: any) {
      console.error('Erreur GobiPay:', error);
      toast.error('Erreur', error.message || "Impossible d'initier le paiement GobiPay");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {demoMode && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement via GobiPay</h2>
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Vous serez redirigé vers l'interface sécurisée de GobiPay pour finaliser votre paiement.
              Merci de confirmer la transaction sur la page suivante.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerFullname}
                onChange={(event) => setCustomerFullname(event.target.value)}
                placeholder="Nom Prénom"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="email@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="22961000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Inclure l'indicatif pays (ex. 229 pour le Bénin) et ne pas ajouter d'espaces.
              </p>
            </div>
          </div>

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
                disabled={
                  processing ||
                  !customerFullname.trim() ||
                  !customerEmail.trim() ||
                  !customerPhone.trim()
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Redirection...</span>
                  </>
                ) : (
                  <span>Payer avec GobiPay</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

