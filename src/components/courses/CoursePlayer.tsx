'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, CheckCircle, Lock, BookOpen, Clock, Award, FileText, GraduationCap, ArrowLeft } from 'lucide-react';
import { Course, Module, Lesson } from '../../types/course';
import LessonContent from './LessonContent';
import ModuleQuizPlayer from '../dashboard/student/ModuleQuizPlayer';
import CourseEvaluationPlayer from '../dashboard/student/CourseEvaluationPlayer';
import { progressService } from '../../lib/services/progressService';
import { quizService } from '../../lib/services/quizService';
import { evaluationService } from '../../lib/services/evaluationService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface CoursePlayerProps {
  course: Course;
  initialModuleId?: string;
  initialLessonId?: string;
  className?: string;
}

export default function CoursePlayer({
  course,
  initialModuleId,
  initialLessonId,
  className = '',
}: CoursePlayerProps) {
  const router = useRouter();

  // Le thème est géré par ThemeContext (comme dans DashboardLayout), pas besoin de l'importer ici
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
    initialModuleId ? parseInt(initialModuleId, 10) : (course.modules && course.modules.length > 0 ? course.modules[0].id : null)
  );
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    initialLessonId ? parseInt(initialLessonId, 10) : null
  );
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [unlockedLessons, setUnlockedLessons] = useState<Set<number>>(new Set());
  const [courseProgress, setCourseProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'lesson' | 'quiz' | 'evaluation'>('lesson');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [moduleQuizzes, setModuleQuizzes] = useState<Map<number, string>>(new Map()); // moduleId -> quizId
  const [completedModuleQuizzes, setCompletedModuleQuizzes] = useState<Set<number>>(new Set()); // moduleId des modules dont le quiz est réussi
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [moduleProgressMap, setModuleProgressMap] = useState<Map<number, number>>(new Map());
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(0);
  const [completedDurationMinutes, setCompletedDurationMinutes] = useState<number>(0);

  const getOrderedLessons = useCallback((): Lesson[] => {
    const lessons: Lesson[] = [];
    if (!course.modules) {
      return lessons;
    }

    course.modules.forEach((module) => {
      const moduleLessons = [...(module.lessons || [])].sort((a, b) => {
        const orderA = a.order_index ?? (a as any).orderIndex ?? 0;
        const orderB = b.order_index ?? (b as any).orderIndex ?? 0;
        return orderA - orderB;
      });
      lessons.push(...moduleLessons);
    });

    return lessons;
  }, [course.modules]);

  const getOrderedLessonsByModule = useCallback(
    (moduleId: number): Lesson[] => {
      const module = course.modules?.find((m) => m.id === moduleId);
      if (!module) {
        return [];
      }

      return [...(module.lessons || [])].sort((a, b) => {
        const orderA = a.order_index ?? (a as any).orderIndex ?? 0;
        const orderB = b.order_index ?? (b as any).orderIndex ?? 0;
        return orderA - orderB;
      });
    },
    [course.modules]
  );

  useEffect(() => {
    loadProgress();
  }, [course.id]);

  useEffect(() => {
    if (enrollmentId) {
      loadCourseQuizzesAndEvaluation();
    }
  }, [enrollmentId, course.id]);

  useEffect(() => {
    if (!course.modules) {
      return;
    }

    const orderedLessons = getOrderedLessons();

    if (!selectedLessonId) {
      const unlockedOrdered = orderedLessons.find((lesson) => unlockedLessons.has(lesson.id));
      const lastCompletedOrdered = orderedLessons.filter((lesson) => completedLessons.has(lesson.id)).pop();
      const fallbackLesson = unlockedOrdered || lastCompletedOrdered || orderedLessons[0];

      if (fallbackLesson) {
        const moduleId = fallbackLesson.module_id ?? (fallbackLesson as any).moduleId ?? course.modules[0]?.id;
        setSelectedModuleId(moduleId);
        setSelectedLessonId(fallbackLesson.id);
        router.replace(`/learn/${course.id}?module=${moduleId}&lesson=${fallbackLesson.id}`);
      }
    }
    // Ne pas forcer l'ouverture du module automatiquement quand une leçon est sélectionnée
    // Laisser l'utilisateur contrôler l'ouverture/fermeture manuellement
  }, [course.modules, completedLessons, unlockedLessons, selectedLessonId, router, getOrderedLessons]);

  // Charger les quiz des modules et l'évaluation finale
  const loadCourseQuizzesAndEvaluation = async () => {
    if (!enrollmentId) return; // Pas d'enrollment, pas de quiz/évaluation à charger
    
    try {
      // Charger l'évaluation finale pour l'étudiant
      // Note: getEvaluationForStudent n'existe pas, utiliser getCourseEvaluation à la place
      const evalData = null; // TODO: Implémenter getEvaluationForStudent si nécessaire
      if (evalData?.id) {
        setEvaluationId(evalData.id);
      }

      // Charger les quiz de chaque module et vérifier leur statut de complétion
      if (course.modules && enrollmentId) {
        const quizzesMap = new Map<number, string>();
        const completedQuizzesSet = new Set<number>();
        
        for (const module of course.modules) {
          // Vérifier si le module contient déjà l'ID du quiz
          const moduleAny = module as any;
          // Vérifier plusieurs propriétés possibles pour le quiz_id
          const quizId = moduleAny.quiz_id || moduleAny.module_quiz_id || (moduleAny as any).quizId;
          
          if (quizId) {
            console.log(`✅ Quiz trouvé pour le module ${module.id}: quiz_id=${quizId}`);
            quizzesMap.set(module.id, quizId.toString());
            
            // Vérifier si le quiz est complété/réussi
            try {
              const quiz = await quizService.getModuleQuizForStudent(enrollmentId, module.id.toString());
              const quizData = (quiz as any)?.quiz || quiz;
              const previousAttempts = (quiz as any)?.previous_attempts || [];
              
              // Vérifier si une tentative a réussi (is_passed = true)
              const hasPassedAttempt = previousAttempts.some((attempt: any) => attempt.is_passed === true || attempt.is_passed === 1);
              if (hasPassedAttempt) {
                completedQuizzesSet.add(module.id);
                console.log(`✅ Quiz du module ${module.id} est réussi`);
              }
            } catch (error) {
              console.log(`⚠️ Erreur lors de la vérification du quiz pour le module ${module.id}:`, error);
            }
          } else {
            // Essayer de récupérer le quiz via l'API pour les étudiants
            try {
              const quiz = await quizService.getModuleQuizForStudent(enrollmentId, module.id.toString());
              // Le quiz peut être dans quiz.id ou directement dans l'objet
              const quizId = quiz?.id || (quiz as any)?.quiz?.id;
              if (quizId) {
                console.log(`✅ Quiz récupéré via API pour le module ${module.id}: quiz_id=${quizId}`);
                quizzesMap.set(module.id, quizId.toString());
                
                // Vérifier si le quiz est complété/réussi
                const quizData = (quiz as any)?.quiz || quiz;
                const previousAttempts = (quiz as any)?.previous_attempts || [];
                const hasPassedAttempt = previousAttempts.some((attempt: any) => attempt.is_passed === true || attempt.is_passed === 1);
                if (hasPassedAttempt) {
                  completedQuizzesSet.add(module.id);
                  console.log(`✅ Quiz du module ${module.id} est réussi`);
                }
              } else {
                console.log(`⚠️ Pas de quiz pour le module ${module.id} (quiz=${JSON.stringify(quiz)})`);
              }
            } catch (error) {
              // Pas de quiz pour ce module, continuer
              console.log(`⚠️ Erreur lors de la récupération du quiz pour le module ${module.id}:`, error);
            }
          }
        }
        console.log(`📊 Total quiz chargés: ${quizzesMap.size}`, Array.from(quizzesMap.entries()));
        console.log(`✅ Quiz complétés: ${completedQuizzesSet.size}`, Array.from(completedQuizzesSet));
        setModuleQuizzes(quizzesMap);
        setCompletedModuleQuizzes(completedQuizzesSet);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des quiz et évaluation:', error);
    }
  };

  const loadProgress = async () => {
    const numericCourseId = Number(course.id);
    const orderedLessons = getOrderedLessons();

    const courseAny = course as any;
    const enrollmentData = courseAny.enrollment || courseAny.enrollmentId || null;
    let enrollmentValue: number | null = null;

    if (enrollmentData !== null && enrollmentData !== undefined) {
      const parsed = typeof enrollmentData === 'object' ? Number(enrollmentData.id) : Number(enrollmentData);
      if (!Number.isNaN(parsed)) {
        enrollmentValue = parsed;
        setEnrollmentId(parsed);
      }
    }

    if (!enrollmentValue) {
      const unlockedSet = new Set<number>();
      if (orderedLessons.length > 0) {
        unlockedSet.add(orderedLessons[0].id);
      }
      const emptyCompleted = new Set<number>();
      const durations = calculateCourseDurations(orderedLessons, emptyCompleted);
      setCompletedLessons(emptyCompleted);
      setUnlockedLessons(unlockedSet);
      setCourseProgress(0);
      setTotalDurationMinutes(durations.totalMinutes);
      setCompletedDurationMinutes(0);
      return;
    }

    const unlockedSet = new Set<number>();
    const completedSet = new Set<number>();

    let progressFromApi = 0;

    try {
      const progressPayload: any = await progressService.getCourseProgress(
        Number.isNaN(numericCourseId) ? 0 : numericCourseId
      );

      const summary = progressPayload?.summary || {};
      const progressRows: any[] = progressPayload?.progress || [];
      const modulesData: any[] = progressPayload?.modules || [];
      const enrollmentInfo: any = progressPayload?.enrollment;

      progressRows.forEach((row) => {
        const lessonId = Number(row.lesson_id || row.lessonId);
        if (Number.isNaN(lessonId)) {
          return;
        }
        if (row.status === 'completed') {
          completedSet.add(lessonId);
          unlockedSet.add(lessonId);
        }
      });

      const moduleProgressEntries: [number, number][] = modulesData.map((moduleRow) => {
        const moduleId = Number(moduleRow.id || moduleRow.module_id);
        const total = Number(moduleRow.total_lessons || 0);
        const completed = Number(moduleRow.completed_lessons || 0);
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        return [moduleId, percentage];
      });

      setModuleProgressMap(new Map(moduleProgressEntries));

      if (summary?.next_lesson_id) {
        const nextLessonId = Number(summary.next_lesson_id);
        if (!Number.isNaN(nextLessonId)) {
          unlockedSet.add(nextLessonId);
        }
      }

      const courseProgressValueRaw =
        typeof enrollmentInfo?.progress_percentage === 'number'
          ? enrollmentInfo.progress_percentage
          : Number(summary.progress_percentage || summary.progress || 0);

      const courseProgressValue = Number.isFinite(courseProgressValueRaw)
        ? courseProgressValueRaw
        : 0;

      progressFromApi = courseProgressValue;
    } catch (error) {
      console.warn('Erreur lors du chargement de la progression:', error);
    }

    const { totalMinutes, completedMinutes } = calculateCourseDurations(orderedLessons, completedSet);
    setTotalDurationMinutes(totalMinutes);
    setCompletedDurationMinutes(completedMinutes);

    const lessonsCount = orderedLessons.length;
    const progressFromLessons = lessonsCount > 0 ? (completedSet.size / lessonsCount) * 100 : 0;
    const progressFromDuration = totalMinutes > 0 ? (completedMinutes / Math.max(totalMinutes, 1)) * 100 : 0;
    const computedProgress = Number.isFinite(progressFromDuration) && progressFromDuration > 0
      ? progressFromDuration
      : progressFromLessons;

    const preferredProgress = progressFromApi > 0 ? progressFromApi : computedProgress;

    setCourseProgress(Number.isFinite(preferredProgress) ? preferredProgress : 0);

    if (orderedLessons.length > 0 && unlockedSet.size === 0) {
      unlockedSet.add(orderedLessons[0].id);
    }

    if (completedSet.size === 0 && unlockedSet.size === 0 && orderedLessons.length > 0) {
      unlockedSet.add(orderedLessons[0].id);
    }

    setCompletedLessons((prev) => new Set([...prev, ...completedSet]));
    setUnlockedLessons((prev) => new Set([...prev, ...unlockedSet]));
  };

  const selectedModule = course.modules?.find((m) => m.id === selectedModuleId);
  const selectedLesson = selectedModule?.lessons?.find((l) => l.id === selectedLessonId);

  const selectedLessonWithStatus = useMemo(() => {
    if (!selectedLesson) {
      return null;
    }

    const lessonCompleted = completedLessons.has(selectedLesson.id);
    const originalProgress = (selectedLesson as any)?.progress || {};
    const progressStatus = lessonCompleted ? 'completed' : originalProgress?.status;

    return {
      ...selectedLesson,
      isCompleted: lessonCompleted,
      status: progressStatus ?? (selectedLesson as any)?.status,
      progress: {
        ...originalProgress,
        status: progressStatus,
      },
    } as Lesson;
  }, [selectedLesson, completedLessons]);

  // Si aucune leçon n'est sélectionnée mais qu'un module l'est, sélectionner la première leçon
  useEffect(() => {
    if (selectedModuleId && !selectedLessonId && selectedModule?.lessons && selectedModule.lessons.length > 0) {
      const firstLesson = selectedModule.lessons[0];
      // S'assurer qu'on désélectionne toute leçon précédente
      setSelectedLessonId(null);
      // Puis sélectionner la première leçon du module
      setTimeout(() => {
        setSelectedLessonId(firstLesson.id);
        router.replace(`/learn/${course.id}?module=${selectedModuleId}&lesson=${firstLesson.id}`);
      }, 0);
    }
  }, [selectedModuleId]);

  const handleLessonSelect = async (lesson: Lesson) => {
    // Vérifier l'accès à la leçon
    if (enrollmentId && !isLessonUnlocked(lesson)) {
      // Afficher un message d'erreur
      alert('Cette leçon est verrouillée. Vous devez compléter la leçon précédente pour y accéder.');
      return;
    }

    // S'assurer que le module de la leçon est ouvert/expanded
    const lessonModuleId = lesson.module_id ?? (lesson as any).moduleId;
    
    // D'abord, désélectionner l'ancienne leçon en mettant à jour selectedLessonId
    // Puis ouvrir le module si nécessaire
    if (lessonModuleId && lessonModuleId !== selectedModuleId) {
      setSelectedModuleId(lessonModuleId);
    }
    
    // Mettre à jour la leçon sélectionnée (cela désélectionnera automatiquement l'ancienne)
    setSelectedLessonId(lesson.id);
    
    // Mettre à jour l'URL
    router.replace(`/learn/${course.id}?module=${lessonModuleId || selectedModuleId}&lesson=${lesson.id}`);
  };

  const handleLessonComplete = async () => {
    if (!selectedLessonId || !enrollmentId) {
      return;
    }

    const lessonId = selectedLessonId;
    const orderedLessons = getOrderedLessons();
    const lessonIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
    const currentLesson = lessonIndex !== -1 ? orderedLessons[lessonIndex] : selectedLesson;
    const moduleId =
      currentLesson?.module_id ??
      (currentLesson as any)?.moduleId ??
      selectedLesson?.module_id ??
      (selectedLesson as any)?.moduleId ??
      null;
    const nextLesson =
      lessonIndex !== -1 ? orderedLessons[lessonIndex + 1] : undefined;

    const previousCompleted = new Set(completedLessons);
    const previousUnlocked = new Set(unlockedLessons);
    const previousCourseProgress = courseProgress;
    const previousModuleProgressMap = new Map(moduleProgressMap);

    try {
      const optimisticCompleted = new Set(previousCompleted);
      optimisticCompleted.add(lessonId);
      setCompletedLessons(optimisticCompleted);

      const lessonsCount = orderedLessons.length;
      if (lessonsCount > 0) {
        const progressRatio =
          (optimisticCompleted.size / Math.max(lessonsCount, 1)) * 100;
        setCourseProgress((current) =>
          progressRatio > current ? progressRatio : current
        );
      }

      if (moduleId !== null) {
        setModuleProgressMap((prevMap) => {
          const updatedMap = new Map(prevMap);
          const module = course.modules?.find((m) => m.id === Number(moduleId));
          const totalLessonsInModule = module?.lessons?.length ?? 0;
          if (totalLessonsInModule > 0) {
            const completedInModule =
              module?.lessons?.filter((lesson) => optimisticCompleted.has(lesson.id)).length ?? 0;
            const moduleProgress = (completedInModule / totalLessonsInModule) * 100;
            updatedMap.set(Number(moduleId), moduleProgress);
          }
          return updatedMap;
        });
      }

      setUnlockedLessons((prev) => {
        const updated = new Set(prev);
        updated.add(lessonId);
        if (nextLesson) {
          updated.add(nextLesson.id);
        }
        return updated;
      });

      const result = await progressService.completeLesson(enrollmentId, lessonId);

      if (result.success === false) {
        throw new Error('La complétion de la leçon a été refusée par le serveur');
      }

      if (result.unlockedLessonId) {
        setUnlockedLessons((prev) => new Set([...prev, result.unlockedLessonId!]));
      }

      await loadProgress();
    } catch (error) {
      console.error('Erreur lors de la complétion de la leçon:', error);
      setCompletedLessons(previousCompleted);
      setUnlockedLessons(previousUnlocked);
      setCourseProgress(previousCourseProgress);
      setModuleProgressMap(previousModuleProgressMap);
    }
  };

  const isLessonUnlocked = (lesson: Lesson): boolean => {
    if (!enrollmentId) return true;
    
    if (unlockedLessons.has(lesson.id)) {
      return true;
    }
    
    const moduleId = lesson.module_id ?? (lesson as any).moduleId;
    if (!moduleId) {
      return unlockedLessons.size === 0 || completedLessons.has(lesson.id);
    }

    const orderedLessonsInModule = getOrderedLessonsByModule(Number(moduleId));
    const lessonIndex = orderedLessonsInModule.findIndex((item) => item.id === lesson.id);

    if (lessonIndex === -1) {
      return false;
    }

    if (lessonIndex === 0) {
      const moduleIndex = course.modules?.findIndex((module) => module.id === moduleId) ?? -1;
      if (moduleIndex <= 0) {
          return true;
      }

      // Vérifier que tous les modules précédents sont complétés
      // (toutes les leçons + quiz réussi si présent)
      const previousModules = course.modules?.slice(0, moduleIndex) || [];
      const previousModulesCompleted = previousModules.every((module) => {
        // Vérifier que toutes les leçons sont complétées
        const allLessonsCompleted = (module.lessons || []).every((moduleLesson) => completedLessons.has(moduleLesson.id));
        if (!allLessonsCompleted) return false;
        
        // Si le module a un quiz, vérifier qu'il est réussi (obligatoire)
        if (moduleQuizzes.has(module.id)) {
          return completedModuleQuizzes.has(module.id);
        }
        
        // Pas de quiz, le module est complété
        return true;
      });

      return previousModulesCompleted;
    }

    const previousLesson = orderedLessonsInModule[lessonIndex - 1];
    return completedLessons.has(previousLesson.id);
  };

  const isLessonLocked = (lesson: Lesson): boolean => {
    return !isLessonUnlocked(lesson);
  };

  const getModuleProgress = (module: Module): number => {
    const moduleId = module.id;
    
    // Si le module n'a pas de leçons, retourner 0
    if (!module.lessons || module.lessons.length === 0) {
      // Si le module a un quiz, vérifier s'il est complété
      if (moduleQuizzes.has(moduleId)) {
        return completedModuleQuizzes.has(moduleId) ? 100 : 0;
      }
      return 0;
    }
    
    // Calculer la progression des leçons
    const completedLessonsCount = module.lessons.filter((l) => completedLessons.has(l.id)).length;
    const lessonsProgress = (completedLessonsCount / module.lessons.length) * 100;
    
    // Si toutes les leçons sont complétées
    if (lessonsProgress === 100) {
      // Vérifier si le module a un quiz
      if (moduleQuizzes.has(moduleId)) {
        // Le quiz est obligatoire : le module n'est complété que si le quiz est réussi
        if (completedModuleQuizzes.has(moduleId)) {
          return 100; // Toutes les leçons + quiz réussi = 100%
        } else {
          // Toutes les leçons complétées mais quiz non réussi = 90% (pour indiquer qu'il reste le quiz)
          return 90;
        }
      }
      // Pas de quiz, le module est complété à 100%
      return 100;
    }
    
    // Sinon, retourner la progression des leçons uniquement
    return lessonsProgress;
  };

  const isModuleCompleted = (module: Module): boolean => {
    const moduleId = module.id;
    
    // Vérifier que toutes les leçons sont complétées
    if (!module.lessons || module.lessons.length === 0) {
      // Si pas de leçons mais un quiz, vérifier le quiz
      if (moduleQuizzes.has(moduleId)) {
        return completedModuleQuizzes.has(moduleId);
      }
      return false;
    }
    
    const allLessonsCompleted = module.lessons.every((l) => completedLessons.has(l.id));
    if (!allLessonsCompleted) {
      return false;
    }
    
    // Si toutes les leçons sont complétées, vérifier le quiz (obligatoire si présent)
    if (moduleQuizzes.has(moduleId)) {
      return completedModuleQuizzes.has(moduleId);
    }
    
    // Pas de quiz, le module est complété
    return true;
  };

  const handleQuizClick = (moduleId: number) => {
    const quizId = moduleQuizzes.get(moduleId);
    if (quizId) {
      setSelectedQuizId(quizId);
      setViewMode('quiz');
    }
  };

  const handleEvaluationClick = () => {
    if (evaluationId) {
      setSelectedEvaluationId(evaluationId);
      setViewMode('evaluation');
    }
  };

  const handleBackToLesson = () => {
    setViewMode('lesson');
    setSelectedQuizId(null);
    setSelectedEvaluationId(null);
  };

  const handleQuizComplete = (result: any) => {
    // Si le quiz est réussi, ajouter le module aux quiz complétés
    if (result?.passed && selectedModuleId) {
      setCompletedModuleQuizzes((prev) => {
        const newSet = new Set(prev);
        newSet.add(selectedModuleId!);
        return newSet;
      });
    }
    // Recharger la progression après complétion du quiz
    loadProgress();
    // Recharger les quiz pour mettre à jour les statuts
    loadCourseQuizzesAndEvaluation();
    // Retourner aux leçons
    handleBackToLesson();
  };

  const handleEvaluationComplete = (result: any) => {
    // Recharger la progression après complétion de l'évaluation
    loadProgress();
    // Retourner aux leçons
    handleBackToLesson();
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours} h`;
    return `${hours} h ${remainingMinutes} min`;
  };

  const getLessonDurationMinutes = (lesson: Lesson | any): number => {
    const durationRaw =
      lesson?.duration_minutes ??
      lesson?.durationMinutes ??
      lesson?.duration ??
      lesson?.durationMinutes ??
      0;
    const duration =
      typeof durationRaw === 'number' && Number.isFinite(durationRaw)
        ? durationRaw
        : Number(durationRaw ?? 0);
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  };

  const calculateCourseDurations = (
    lessons: Lesson[],
    completedIds: Set<number>
  ): { totalMinutes: number; completedMinutes: number } => {
    let total = 0;
    let completed = 0;

    lessons.forEach((lesson) => {
      const duration = getLessonDurationMinutes(lesson);
      total += duration;
      if (completedIds.has(lesson.id)) {
        completed += duration;
      }
    });

    if (total === 0) {
      const fallbackRaw =
        (course as any)?.total_duration_minutes ??
        (course as any)?.duration_minutes ??
        course.duration ??
        0;
      const fallbackTotal =
        typeof fallbackRaw === 'number' && Number.isFinite(fallbackRaw)
          ? fallbackRaw
          : Number(fallbackRaw ?? 0);
      const safeFallback = Number.isFinite(fallbackTotal) ? Math.max(fallbackTotal, 0) : 0;
      if (safeFallback > 0) {
        total = safeFallback;
        completed = Math.min(
          safeFallback,
          Math.round((completedIds.size / Math.max(lessons.length, 1)) * safeFallback)
        );
      }
    }

    return {
      totalMinutes: total,
      completedMinutes: Math.min(completed, total),
    };
  };

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen ${className}`}>
      {/* Sidebar - Modules et Leçons */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto max-h-[50vh] lg:max-h-none flex-shrink-0">
        <div className="p-6 border-b border-gray-200 bg-mdsc-blue-primary text-white">
          <h2 className="text-xl font-bold mb-2">{course.title}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.modules?.length || 0} modules</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(totalDurationMinutes)}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progression</span>
              <span>{Math.round(courseProgress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-mdsc-orange h-2 rounded-full transition-all durée-300"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/70 mt-1">
              <span>{formatDuration(completedDurationMinutes)} suivies</span>
              <span>{formatDuration(totalDurationMinutes)} au total</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {/* Bouton Évaluation Finale */}
          {evaluationId && courseProgress >= 100 && (
            <button
              onClick={handleEvaluationClick}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md mb-4"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-semibold">Évaluation Finale</p>
                  <p className="text-xs text-blue-100">Passer l'évaluation pour obtenir un certificat</p>
                </div>
              </div>
            </button>
          )}

          {course.modules?.map((module, moduleIndex) => {
            const moduleProgress = getModuleProgress(module);
            const isExpanded = selectedModuleId === module.id;

            return (
              <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Permettre l'ouverture/fermeture manuelle des modules
                    if (isExpanded) {
                      // Fermer le module si on clique dessus quand il est ouvert
                      setSelectedModuleId(null);
                    } else {
                      // Ouvrir le module si on clique dessus quand il est fermé
                      setSelectedModuleId(module.id);
                    }
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      {moduleProgress === 100 && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {module.lessons?.length || 0} leçons • {module.lessons?.reduce((sum, l) => sum + getLessonDurationMinutes(l), 0) || 0} min
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-mdsc-blue-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${moduleProgress}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {/* Quiz du module (si disponible) */}
                    {moduleQuizzes.has(module.id) && (
                      <button
                        onClick={() => handleQuizClick(module.id)}
                        disabled={!(module.lessons && module.lessons.every((l) => completedLessons.has(l.id)))}
                            className={`w-full p-3 text-left text-sm transition-colors border-b border-gray-200 ${
                          // Le quiz est accessible si toutes les leçons sont complétées (même si le quiz n'est pas encore réussi)
                          module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                            ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer'
                            : 'bg-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Award className={`h-4 w-4 flex-shrink-0 ${
                            module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                              ? completedModuleQuizzes.has(module.id)
                                ? 'text-green-600'
                                : 'text-purple-600'
                              : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <p className={`font-medium ${
                              module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                                ? completedModuleQuizzes.has(module.id)
                                  ? 'text-green-900'
                                  : 'text-purple-900'
                                : 'text-gray-600'
                            }`}>
                              Quiz du module
                              {completedModuleQuizzes.has(module.id) && (
                                <span className="ml-2 text-xs text-green-600">✓ Réussi</span>
                              )}
                            </p>
                            <p className={`text-xs ${
                              module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                                ? completedModuleQuizzes.has(module.id)
                                  ? 'text-green-600'
                                  : 'text-purple-600'
                                : 'text-gray-500'
                            }`}>
                              {completedModuleQuizzes.has(module.id)
                                ? 'Quiz réussi - Module complété'
                                : module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                                ? 'Passer le quiz pour compléter le module (obligatoire)'
                                : 'Complétez toutes les leçons du module pour accéder au quiz'}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Liste des leçons */}
                    {module.lessons && module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.has(lesson.id);
                      const isLocked = isLessonLocked(lesson);
                      // Une seule leçon peut être sélectionnée à la fois - vérification stricte
                      const isSelected = selectedLessonId !== null && selectedLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && handleLessonSelect(lesson)}
                          disabled={isLocked}
                          className={`
                            w-full p-3 text-left text-sm transition-all duration-200 border-b border-gray-200 last:border-b-0
                            ${isSelected 
                              ? 'bg-mdsc-blue-primary text-white shadow-md' 
                              : isCompleted 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'hover:bg-white'
                            }
                            ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            {isLocked ? (
                              <Lock className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-white/80' : 'text-gray-400'}`} />
                            ) : isCompleted ? (
                              <CheckCircle className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-green-600'}`} />
                            ) : (
                              <div className={`h-4 w-4 flex-shrink-0 rounded-full border-2 ${isSelected ? 'border-white/50' : 'border-gray-300'}`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                  {lesson.duration || 0} min
                                </p>
                                {isLocked && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    isSelected 
                                      ? 'bg-white/20 text-white' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    Verrouillée
                                  </span>
                                )}
                                {lesson.contentType && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    isSelected 
                                      ? 'bg-white/20 text-white' 
                                      : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {lesson.contentType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <Link href="/" className="inline-flex items-center justify-center mb-2 sm:mb-0">
                <Image
                  src="/mdsc-logo1.png"
                  alt="Maison de la Société Civile"
                  width={160}
                  height={48}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <Link
                href="/dashboard/student/courses"
                className="inline-flex items-center text-sm font-medium text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à mes cours
              </Link>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{Math.round(courseProgress)}%</span>
              <span className="ml-1">complété</span>
            </div>
          </div>
        </div>
        {viewMode === 'quiz' && selectedQuizId ? (
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-6">
              <button
                onClick={handleBackToLesson}
                className="inline-flex items-center text-sm font-medium text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors"
              >
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                <span>Retour aux leçons</span>
              </button>
            </div>
            <ModuleQuizPlayer
              quizId={selectedQuizId}
              moduleId={selectedModuleId?.toString() || ''}
              enrollmentId={enrollmentId || undefined}
              onComplete={handleQuizComplete}
              onCancel={handleBackToLesson}
            />
          </div>
        ) : viewMode === 'evaluation' && selectedEvaluationId ? (
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-6">
              <button
                onClick={handleBackToLesson}
                className="inline-flex items-center text-sm font-medium text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors"
              >
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                <span>Retour aux leçons</span>
              </button>
            </div>
            <CourseEvaluationPlayer
              evaluationId={selectedEvaluationId}
              courseId={course.id.toString()}
              enrollmentId={enrollmentId || undefined}
              onComplete={handleEvaluationComplete}
              onCancel={handleBackToLesson}
            />
          </div>
        ) : selectedLessonWithStatus ? (
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <LessonContent
              lesson={selectedLessonWithStatus}
              courseId={typeof course.id === 'number' ? course.id.toString() : course.id}
              enrollmentId={course.enrollment?.id ? (typeof course.enrollment.id === 'number' ? course.enrollment.id : parseInt(course.enrollment.id)) : undefined}
              onComplete={handleLessonComplete}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center px-4 py-6 sm:px-8 sm:py-8">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">
                Sélectionnez une leçon pour commencer
              </h3>
              <p className="text-gray-600">
                Choisissez un module dans la barre latérale pour voir les leçons disponibles
              </p>
              {evaluationId && (
                <button
                  onClick={handleEvaluationClick}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span>Passer l'évaluation finale</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
