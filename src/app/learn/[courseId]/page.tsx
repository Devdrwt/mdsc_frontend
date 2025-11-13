'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CourseService } from '../../../lib/services/courseService';
import CoursePlayer from '../../../components/courses/CoursePlayer';
import { Course } from '../../../types/course';
import { useTheme } from '../../../lib/context/ThemeContext';

export default function LearnCoursePage() {
  const { theme } = useTheme(); // Utiliser useTheme comme dans DashboardLayout
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.courseId as string;
  const moduleId = searchParams?.get('module') || undefined;
  const lessonId = searchParams?.get('lesson') || undefined;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour appliquer le thème (même logique que le script inline dans layout.tsx)
  const applyTheme = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const storedPref = localStorage.getItem('mdsc-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement;
    
    let actualTheme: 'light' | 'dark';
    if (storedPref === 'light' || storedPref === 'dark') {
      actualTheme = storedPref;
    } else if (storedPref === 'system' || !storedPref) {
      actualTheme = prefersDark ? 'dark' : 'light';
    } else {
      actualTheme = theme; // Fallback sur le thème du contexte
    }
    
    root.classList.toggle('dark', actualTheme === 'dark');
    root.dataset.theme = actualTheme;
  }, [theme]);

  // Appliquer le thème au chargement et lors des changements
  useEffect(() => {
    applyTheme();

    // Écouter les changements de thème depuis le dashboard (comme DashboardLayout)
    const handleThemeChange = () => {
      applyTheme();
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'mdsc-theme') {
        applyTheme();
      }
    };

    window.addEventListener('mdsc-theme-changed', handleThemeChange);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('mdsc-theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [applyTheme]);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const baseCourse = await CourseService.getCourseById(courseId);
      const enrichedCourse: Course = { ...(baseCourse as any) };

      const numericCourseId = Number(courseId);
      if (!Number.isNaN(numericCourseId)) {
        try {
          const enrollmentInfo = await CourseService.checkEnrollment(numericCourseId);
          if (enrollmentInfo?.is_enrolled) {
            (enrichedCourse as any).enrollment = enrollmentInfo.enrollment;
            if (enrollmentInfo.enrollment?.progress_percentage !== undefined) {
              (enrichedCourse as any).progress = enrollmentInfo.enrollment.progress_percentage;
            }
          }
        } catch (enrollmentError) {
          console.warn('Impossible de vérifier l’inscription du cours:', enrollmentError);
        }
      }

      setCourse(enrichedCourse);
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
    <div className="min-h-screen bg-gray-50">
      <CoursePlayer
        course={course}
        initialModuleId={moduleId}
        initialLessonId={lessonId}
      />
    </div>
  );
}
