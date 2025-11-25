'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import LiveSessionList from '../../../../components/live/LiveSessionList';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { courseService } from '../../../../lib/services/courseService';
import { Course } from '../../../../types/course';
import { Loader2 } from 'lucide-react';

export default function CourseLiveSessionsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [slug]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseBySlug(slug);
      setCourse(courseData);
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (): 'student' | 'instructor' | 'admin' => {
    if (!user) return 'student';
    if (user.role === 'admin') return 'admin';
    if (course && course.instructor_id === user.id) return 'instructor';
    return 'student';
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
            href="/courses"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Retour au catalogue
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
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour au cours
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sessions Live
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {course.title} - Sessions en direct programmées
        </p>
      </div>

      {/* Liste des sessions */}
      <LiveSessionList
        courseId={course.id}
        userRole={getUserRole()}
      />
    </div>
  );
}

