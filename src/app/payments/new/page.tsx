'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentForm from '../../../components/payments/PaymentForm';
import { courseService } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import { Loader, AlertCircle, ArrowLeft, Shield, Lock, CheckCircle2, CreditCard } from 'lucide-react';
import { Payment, isDemoMode, paymentService } from '../../../lib/services/paymentService';
import toast from '../../../lib/utils/toast';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import { useTheme } from '../../../lib/context/ThemeContext';

function NewPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const courseId = searchParams?.get('courseId');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Forcer le mode light pour la page de paiement
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    } else {
      toast.error('Erreur', 'Aucun cours spécifié');
      router.push('/dashboard/student/courses');
    }
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId!);
      setCourse(courseData);
    } catch (error: any) {
      console.error('Erreur lors du chargement du cours:', error);
      toast.error('Erreur', error.message || 'Impossible de charger le cours');
      router.push('/dashboard/student/courses');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInitiated = async (payment: Payment) => {
    if (!course) {
      router.push('/dashboard/student/courses');
      return;
    }

    setPaymentInstructions(null);
    setCurrentPaymentId(payment.id);

    if (!isDemoMode() && payment.redirect_url) {
      window.location.href = payment.redirect_url;
      return;
    }

    if (!isDemoMode()) {
      if (payment.instructions) {
        setPaymentInstructions(payment.instructions);
      }
      toast.info('Paiement en cours', 'Veuillez suivre les instructions de GobiPay pour finaliser la transaction.');
      startPollingPayment(payment.id);
      return;
    }

    await completeEnrollmentAndRedirect(payment.id, {
      successTitle: 'Paiement simulé',
      successMessage: 'Votre inscription est confirmée.',
    });
  };

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const completeEnrollmentAndRedirect = async (
    paymentIdValue: string,
    messages: { successTitle: string; successMessage: string }
  ) => {
    if (!course) {
      router.push('/dashboard/student/courses');
      return;
    }

    try {
      await EnrollmentService.enrollInCourse(Number(course.id), { paymentId: paymentIdValue });
      
      toast.success(messages.successTitle, messages.successMessage);
    } catch (error: any) {
      console.error("Erreur lors de la création de l'inscription:", error);
      toast.error('Erreur', error?.message || "Impossible de finaliser l'inscription");
    } finally {
      router.push('/dashboard/student/courses');
    }
  };

  const startPollingPayment = (paymentIdValue: string) => {
    clearPolling();
    setCurrentPaymentId(paymentIdValue);
    setIsPolling(true);
    setPollingMessage('En attente de la confirmation du paiement GobiPay...');

    pollingRef.current = setInterval(async () => {
      try {
        const paymentStatus = await paymentService.verifyPayment(paymentIdValue);
        console.log('[Payment] Statut GobiPay mis à jour', paymentStatus.status);

        if (paymentStatus.status === 'completed') {
          clearPolling();
          setPaymentInstructions(null);
          setPollingMessage('Paiement confirmé !');
          await completeEnrollmentAndRedirect(paymentIdValue, {
            successTitle: 'Paiement confirmé',
            successMessage: 'Votre inscription est confirmée.',
          });
        } else if (paymentStatus.status === 'failed') {
          clearPolling();
          setPaymentInstructions(null);
          setPollingMessage("Le paiement a échoué. Veuillez réessayer.");
          toast.error('Paiement échoué', "Le paiement n'a pas pu être traité");
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du paiement GobiPay:', error);
      }
    }, 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
        <Header />
        <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="h-12 w-12 text-[#3B7C8A] animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Chargement des informations de paiement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
        <Header />
        <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Cours non trouvé</p>
          </div>
        </div>
      </div>
    );
  }

  const courseAny = course as any;
  const price = courseAny.price || course.price || 0;
  const currency = courseAny.currency || 'XOF';

  if (price === 0) {
    router.push('/dashboard/student/courses');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
      <Header />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-700 mb-6">
            <button
              onClick={() => router.push('/dashboard/student/courses/catalogue')}
              className="flex items-center space-x-1 hover:text-[#3B7C8A] transition-colors font-medium text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au catalogue</span>
            </button>
          </div>

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="p-4 bg-gradient-to-br from-[#3B7C8A] to-[#2d5f6a] rounded-2xl shadow-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Finaliser votre paiement
                  </h1>
                  <p className="text-gray-700 text-lg">
                    Paiement sécurisé pour votre formation
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-[#3B7C8A]/10 to-[#2d5f6a]/10 rounded-xl p-4 border border-[#3B7C8A]/20">
                <Shield className="h-6 w-6 text-[#3B7C8A]" />
                <div>
                  <p className="text-xs text-gray-700 font-medium">Paiement sécurisé</p>
                  <p className="text-sm font-semibold text-[#3B7C8A]">SSL Encrypté</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions GobiPay */}
          {paymentInstructions && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-blue-700">Instructions GobiPay</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Suivez attentivement les étapes ci-dessous pour finaliser le paiement depuis votre application mobile ou via USSD.
              </p>
              <pre className="bg-gray-50 text-gray-900 text-xs md:text-sm rounded-xl p-4 overflow-x-auto border border-gray-300">
{JSON.stringify(paymentInstructions, null, 2)}
              </pre>
            </div>
          )}

          {/* Statut de polling */}
          {isPolling && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-md mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {pollingMessage || 'Vérification du paiement en cours...'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Veuillez patienter, cela ne prendra que quelques instants</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire de paiement */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] p-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Informations de paiement</h2>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <PaymentForm
                courseId={course.id.toString()}
                courseTitle={course.title}
                amount={price}
                currency={currency}
                onPaymentInitiated={handlePaymentInitiated}
                onCancel={() => router.push('/dashboard/student/courses/catalogue')}
              />
            </div>
          </div>

          {/* Informations de sécurité */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Paiement 100% sécurisé</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Vos informations de paiement sont cryptées et sécurisées. Nous ne stockons jamais vos données bancaires.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Chiffrement SSL</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Conforme PCI DSS</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Données protégées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
        <Header />
        <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="h-12 w-12 text-[#3B7C8A] animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <NewPaymentContent />
    </Suspense>
  );
}
