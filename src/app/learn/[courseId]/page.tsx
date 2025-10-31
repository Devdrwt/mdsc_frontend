'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CourseService, Course as ServiceCourse } from '../../../lib/services/courseService';
import CoursePlayer from '../../../components/courses/CoursePlayer';
import { Course } from '../../../types/course';

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
      const data = await CourseService.getCourseById(courseId);
      // Convertir ServiceCourse vers Course
      const convertedCourse: Course = data as any;
      setCourse(convertedCourse);
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
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
