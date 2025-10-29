'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Course } from '../../../types/course';
import { courseService } from '../../../lib/services/courseService';
import { courseService as modernCourseService } from '../../../lib/services/modernCourseService';
import CoursePlayer from '../../../components/courses/CoursePlayer';

export default function LearnCoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.courseId as string;
  const moduleId = searchParams?.get('module') || undefined;
  const lessonId = searchParams?.get('lesson') || undefined;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      // Charger le cours avec modules et leçons
      try {
        const data = await modernCourseService.getCourseById(courseId);
        // Si le service moderne ne retourne pas les modules, charger séparément
        if (!data.modules || data.modules.length === 0) {
          // TODO: Charger les modules et leçons séparément via une API dédiée
          // Pour l'instant, on garde le cours tel quel
        }
        setCourse(data);
      } catch {
        // Fallback sur l'ancien service
        const data = await courseService.getCourseById(courseId);
        setCourse(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Cours non trouvé'}</p>
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est inscrit
  if (!course.enrollment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">
            Vous devez être inscrit à ce cours pour y accéder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CoursePlayer
      course={course}
      initialModuleId={moduleId}
      initialLessonId={lessonId}
    />
  );
}
