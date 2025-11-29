'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { CourseService } from '../../../lib/services/courseService';
import { LiveSessionService } from '../../../lib/services/liveSessionService';
import CoursePlayer from '../../../components/courses/CoursePlayer';
import { Course } from '../../../types/course';
import { LiveSession } from '../../../types/liveSession';
import { useTheme } from '../../../lib/context/ThemeContext';
import toast from '../../../lib/utils/toast';

export default function LearnCoursePage() {
  const { theme } = useTheme(); // Utiliser useTheme comme dans DashboardLayout
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const moduleId = searchParams?.get('module') || undefined;
  const lessonId = searchParams?.get('lesson') || undefined;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingLiveSession, setCheckingLiveSession] = useState(false);
  const [hasCheckedLiveSession, setHasCheckedLiveSession] = useState(false);
  const [redirectingToJitsi, setRedirectingToJitsi] = useState(false);

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
          console.warn("Impossible de vérifier l'inscription du cours:", enrollmentError);
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

  // Pour les cours live, vérifier si le cours a démarré et s'il y a une session live en cours
  const courseAny = course as any;
  const isLiveCourse = courseAny?.course_type === 'live' || courseAny?.courseType === 'live';
  
  // Fonction pour vérifier et rediriger vers une session live si elle est en cours
  const checkAndRedirectToLiveSession = useCallback(async () => {
    if (!course || !isLiveCourse) return;
    
    try {
      setCheckingLiveSession(true);
      const courseIdNum = courseAny.id || courseAny.course_id || parseInt(courseId, 10);
      
      if (!courseIdNum) return;
      
      // Récupérer les sessions live du cours
      const sessionsResponse = await LiveSessionService.getCourseSessions(courseIdNum);
      const sessions = sessionsResponse.data || [];
      
      // Chercher une session avec le statut "live"
      const liveSession = sessions.find(
        (session: LiveSession) => 
          session.status === 'live' || 
          (session as any).session_status === 'live'
      );
      
      if (liveSession) {
        // Une session live est en cours, rediriger vers Jitsi
        const courseSlug = courseAny.slug || `course-${courseIdNum}`;
        toast.success('Session live en cours', 'Redirection vers la session Jitsi Meet...');
        
        // Construire l'URL Jitsi directement
        const jitsiDomain = liveSession.jitsi_server_url
          ? (() => {
              try {
                return new URL(liveSession.jitsi_server_url).hostname;
              } catch {
                return liveSession.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0];
              }
            })()
          : 'meet.jit.si';
        
        const urlParams = new URLSearchParams();
        
        // Ajouter le mot de passe si disponible
        if (liveSession.jitsi_room_password) {
          urlParams.append('pwd', liveSession.jitsi_room_password);
        }
        
        const queryString = urlParams.toString();
        const jitsiUrl = `https://${jitsiDomain}/${liveSession.jitsi_room_name}${queryString ? `?${queryString}` : ''}`;
        
        // Marquer qu'on redirige vers Jitsi
        setRedirectingToJitsi(true);
        
        // Rediriger directement vers Jitsi
        window.location.href = jitsiUrl;
        return;
      }
      
      // Vérifier si le cours est terminé
      const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
      if (courseEndDate) {
        const endDate = new Date(courseEndDate);
        const now = new Date();
        
        if (now > endDate) {
          // Le cours est terminé
          toast.info('Cours terminé', 'Ce cours live est terminé. Vous pouvez consulter les enregistrements si disponibles.');
          setError('Ce cours live est terminé.');
          return;
        }
      }
      
      // Vérifier si le cours n'a pas encore démarré
      const courseStartDate = courseAny?.course_start_date || courseAny?.courseStartDate;
      if (courseStartDate) {
        const startDate = new Date(courseStartDate);
        const now = new Date();
        
        if (now < startDate) {
          // Le cours n'a pas encore démarré, rediriger vers la salle d'attente
          router.push(`/learn/${courseId}/waiting-room`);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Erreur lors de la vérification des sessions live:', err);
      // En cas d'erreur, continuer normalement avec le cours
    } finally {
      setCheckingLiveSession(false);
    }
  }, [course, isLiveCourse, courseId, router, courseAny]);
  
  // Hook pour vérifier les sessions live et rediriger si nécessaire
  useEffect(() => {
    if (course && isLiveCourse && course.enrollment && !hasCheckedLiveSession) {
      setHasCheckedLiveSession(true);
      checkAndRedirectToLiveSession();
    }
  }, [course, isLiveCourse, checkAndRedirectToLiveSession, hasCheckedLiveSession]);

  if (loading || checkingLiveSession || redirectingToJitsi) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {redirectingToJitsi 
              ? 'Redirection vers la session Jitsi Meet...' 
              : checkingLiveSession 
                ? 'Vérification des sessions live...' 
                : 'Chargement du cours...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-lg font-semibold">{error || 'Cours non trouvé'}</p>
          {error && error.includes('terminé') && (
            <p className="text-gray-600 text-sm mt-2">
              Vous pouvez consulter les enregistrements ou le contenu du cours si disponibles.
            </p>
          )}
          <a
            href="/dashboard/student/courses"
            className="mt-4 inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
          >
            Retour à mes cours
          </a>
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
  
  // Si le cours est live et n'a pas démarré, afficher un loader pendant la redirection
  if (course && isLiveCourse) {
    const courseStartDate = courseAny.course_start_date || courseAny.courseStartDate;
    if (courseStartDate) {
      const startDate = new Date(courseStartDate);
      const now = new Date();
      if (now < startDate) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Redirection vers la salle d'attente...</p>
            </div>
          </div>
        );
      }
    }
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
