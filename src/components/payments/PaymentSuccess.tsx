'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isDemoMode } from '../../lib/services/paymentService';
import { CourseService } from '../../lib/services/courseService';
import { addToCalendar } from '../../lib/utils/calendar';
import toast from '../../lib/utils/toast';

interface PaymentSuccessProps {
  paymentId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
}

export default function PaymentSuccess({
  paymentId,
  courseId,
  courseTitle,
  amount,
  currency,
}: PaymentSuccessProps) {
  const router = useRouter();
  const demoMode = isDemoMode();
  const isDemoPayment = paymentId.startsWith('demo_');
  const [calendarAdded, setCalendarAdded] = useState(false);

  useEffect(() => {
    // Ajouter au calendrier si c'est un cours live
    const addToCalendarIfLive = async () => {
      try {
        const course = await CourseService.getCourseById(courseId);
        const courseAny = course as any;
        const isLiveCourse = courseAny.course_type === 'live' || courseAny.courseType === 'live';
        
        if (isLiveCourse && !calendarAdded) {
          const courseStartDate = courseAny.course_start_date || courseAny.courseStartDate;
          const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
          
          if (courseStartDate) {
            const startDate = new Date(courseStartDate);
            const endDate = courseEndDate ? new Date(courseEndDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            
            addToCalendar({
              title: courseTitle,
              description: course.description || course.short_description || '',
              startDate,
              endDate,
              location: 'En ligne',
              url: `${window.location.origin}/learn/${courseId}`,
            });
            
            setCalendarAdded(true);
            toast.success('Ajouté au calendrier', 'Le cours a été ajouté à votre calendrier');
          }
        }
      } catch (error) {
        console.error('Erreur ajout calendrier:', error);
        // Ne pas bloquer l'affichage si l'ajout au calendrier échoue
      }
    };

    addToCalendarIfLive();
  }, [courseId, courseTitle, calendarAdded]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        {(demoMode || isDemoPayment) && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-yellow-900 mb-1">
                  🎭 PAIEMENT SIMULÉ (MODE DÉMO)
                </p>
                <p className="text-xs text-yellow-800">
                  Ce paiement GobiPay a été simulé. Aucun paiement réel n'a été effectué.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isDemoPayment ? 'Paiement GobiPay simulé !' : 'Paiement GobiPay réussi !'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isDemoPayment
            ? 'Le paiement a été simulé avec succès. Vous pouvez maintenant accéder au cours.'
            : 'Votre paiement GobiPay a été traité avec succès. Vous pouvez maintenant accéder au cours.'}
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Cours</span>
              <span className="font-medium text-gray-900">{courseTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant payé</span>
              <span className="font-medium text-gray-900">
                {amount.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Référence GobiPay</span>
              <span className="font-mono text-sm text-gray-600">{paymentId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/student/courses')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>Accéder à mes cours</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Un email de confirmation a été envoyé à votre adresse email.
        </p>
      </div>
    </div>
  );
}

