'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentForm from '../../../components/payments/PaymentForm';
import { paymentService } from '../../../lib/services/paymentService';
import { courseService } from '../../../lib/services/courseService';
import { Loader, AlertCircle } from 'lucide-react';
import toast from '../../../lib/utils/toast';

export default function NewPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams?.get('courseId');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    } else {
      toast.error('Erreur', 'Aucun cours spécifié');
      router.push('/courses');
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId!);
      setCourse(courseData);
    } catch (error: any) {
      console.error('Erreur lors du chargement du cours:', error);
      toast.error('Erreur', error.message || 'Impossible de charger le cours');
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInitiated = async (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
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
    // Cours gratuit, rediriger vers l'inscription directe
    router.push(`/courses/${course.slug || course.id}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <PaymentForm
        courseId={course.id.toString()}
        courseTitle={course.title}
        amount={price}
        currency={currency}
        onPaymentInitiated={handlePaymentInitiated}
        onCancel={() => router.push(`/courses/${course.slug || course.id}`)}
      />
    </div>
  );
}

