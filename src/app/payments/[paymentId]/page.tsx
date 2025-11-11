'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentForm from '../../../components/payments/PaymentForm';
import PaymentSuccess from '../../../components/payments/PaymentSuccess';
import { paymentService, Payment, isDemoMode } from '../../../lib/services/paymentService';
import { courseService } from '../../../lib/services/courseService';
import { enrollmentService } from '../../../lib/services/enrollmentService';
import { Loader, AlertCircle } from 'lucide-react';
import toast from '../../../lib/utils/toast';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.paymentId as string;
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [courseId, setCourseId] = useState<string>('');
  const [course, setCourse] = useState<any>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = isDemoMode();

  useEffect(() => {
    loadPaymentData();
  }, [paymentId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const paymentData = await paymentService.getPayment(paymentId);
      setPayment(paymentData);
      setCourseId(paymentData.course_id);

      const courseData = await courseService.getCourseById(paymentData.course_id);
      setCourse(courseData);

      if (paymentData.status === 'completed') {
        setStep('success');
        try {
          await enrollmentService.enrollInCourse(Number(paymentData.course_id), { paymentId });
        } catch (error) {
          console.log('Inscription déjà existante ou erreur:', error);
        }
      } else if (paymentData.status === 'failed') {
        setStep('error');
      } else {
        setStep('form');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du paiement:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les informations de paiement');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInitiated = async (paymentInit: Payment) => {
    if (!paymentInit?.id) {
      toast.error('Erreur', 'Paiement invalide');
      return;
    }

    if (!demoMode && paymentInit.redirect_url) {
      window.location.href = paymentInit.redirect_url;
      return;
    }

    setStep('processing');
    const newPaymentId = paymentInit.id;

    const checkInterval = setInterval(async () => {
      try {
        const paymentStatus = await paymentService.verifyPayment(newPaymentId);
        if (paymentStatus.status === 'completed') {
          clearInterval(checkInterval);
          try {
            await enrollmentService.enrollInCourse(Number(paymentStatus.course_id || paymentInit.course_id), { paymentId: newPaymentId });
            setPayment(paymentStatus);
            setStep('success');
            toast.success('Paiement réussi', 'Votre inscription a été créée avec succès');
          } catch (error: any) {
            console.error('Erreur lors de la création de l\'inscription:', error);
            setPayment(paymentStatus);
            setStep('success');
          }
        } else if (paymentStatus.status === 'failed') {
          clearInterval(checkInterval);
          setStep('error');
          toast.error('Paiement échoué', 'Le paiement n\'a pas pu être traité');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du paiement:', error);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(checkInterval);
    }, 300000);
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

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de paiement</h2>
          <p className="text-gray-600 mb-6">
            Une erreur est survenue lors du traitement de votre paiement.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard/student/courses')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retour à mes cours
            </button>
            <button
              onClick={() => setStep('form')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Traitement du paiement</h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous traitons votre paiement...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success' && payment && course) {
    return (
      <PaymentSuccess
        paymentId={payment.id}
        courseId={course.id}
        courseTitle={course.title}
        amount={payment.amount}
        currency={payment.currency}
      />
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <PaymentForm
        courseId={course.id}
        courseTitle={course.title}
        amount={course.price || 0}
        currency={course.currency || 'XOF'}
        onPaymentInitiated={handlePaymentInitiated}
        onCancel={() => router.push('/dashboard/student/courses')}
      />
    </div>
  );
}

