'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentForm from '../../../components/payments/PaymentForm';
import { courseService } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import { Payment, isDemoMode, paymentService } from '../../../lib/services/paymentService';
import { Loader, AlertCircle } from 'lucide-react';
import toast from '../../../lib/utils/toast';

function NewPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams?.get('courseId');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Cours non trouvé</p>
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 space-y-6">
      {paymentInstructions && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Instructions GobiPay</h3>
            <p className="text-sm text-gray-700">
              Suivez attentivement les étapes ci-dessous pour finaliser le paiement depuis votre application mobile ou via USSD.
            </p>
            <pre className="mt-4 bg-gray-900 text-gray-100 text-xs md:text-sm rounded-lg p-4 overflow-x-auto">
{JSON.stringify(paymentInstructions, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {isPolling && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800">
              {pollingMessage || 'Vérification du paiement en cours...'}
            </p>
          </div>
        </div>
      )}

      <PaymentForm
        courseId={course.id.toString()}
        courseTitle={course.title}
        amount={price}
        currency={currency}
        onPaymentInitiated={handlePaymentInitiated}
        onCancel={() => router.push('/dashboard/student/courses')}
      />
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <NewPaymentContent />
    </Suspense>
  );
}
