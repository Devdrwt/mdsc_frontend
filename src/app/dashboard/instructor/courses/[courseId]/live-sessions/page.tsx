'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LiveSessionManager from '../../../../../../components/live/LiveSessionManager';
import { courseService, Course as ServiceCourse } from '../../../../../../lib/services/courseService';
import { useAuthStore } from '../../../../../../lib/stores/authStore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InstructorLiveSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.courseId as string);
  const { user } = useAuthStore();
  const [course, setCourse] = useState<ServiceCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      router.push('/dashboard');
      return;
    }
    loadCourse();
  }, [courseId, user]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId);
      // Vérifier que l'utilisateur est le formateur
      const courseAny = courseData as any;
      if (courseAny.instructor_id !== user?.id && courseAny.instructor?.id !== user?.id) {
        router.push('/dashboard');
        return;
      }
      setCourse(courseData);
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
      router.push('/dashboard/instructor/courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Cours non trouvé</p>
          <Link
            href="/dashboard/instructor/courses"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Retour à mes cours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          href={`/dashboard/instructor/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour au cours
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Sessions Live
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {course.title} - Créez et gérez vos sessions en direct
        </p>
      </div>

      {/* Gestionnaire de sessions */}
      <LiveSessionManager courseId={courseId} />
    </div>
  );
}

