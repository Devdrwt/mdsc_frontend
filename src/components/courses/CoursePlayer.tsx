'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, CheckCircle, Lock, BookOpen, Clock, Award, FileText, GraduationCap, ArrowLeft, Loader, XCircle } from 'lucide-react';
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
import Modal from '../ui/Modal';
import FloatingChatButton from './FloatingChatButton';
import CertificateCelebrateModal from '../certificates/CertificateCelebrateModal';
import ProfileVerificationModal from '../dashboard/student/ProfileVerificationModal';
import { certificateService } from '../../lib/services/certificateService';
import { useAuthStore } from '../../lib/stores/authStore';
import toast from '../../lib/utils/toast';

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
  const [finalEvaluation, setFinalEvaluation] = useState<any | null>(null);
  const [finalEvaluationAttempts, setFinalEvaluationAttempts] = useState<any[]>([]);
  const [allModulesCompleted, setAllModulesCompleted] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [showEvaluationResultModal, setShowEvaluationResultModal] = useState(false);
  const [evaluationAttemptsUsed, setEvaluationAttemptsUsed] = useState(0);
  const [showProfileVerificationModal, setShowProfileVerificationModal] = useState(false);
  const [requestingCertificate, setRequestingCertificate] = useState(false);
  const [moduleProgressMap, setModuleProgressMap] = useState<Map<number, number>>(new Map());
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(0);
  const [completedDurationMinutes, setCompletedDurationMinutes] = useState<number>(0);
  const { user } = useAuthStore();
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<any>(null);

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
      loadCourseQuizzesAndEvaluation().then(() => {
        // Recharger la progression après avoir chargé l'évaluation finale
        // pour ajuster le pourcentage si nécessaire
        loadProgress();
      });
    }
  }, [enrollmentId, course.id]);

  // Recalculer la progression quand l'évaluation finale ou ses tentatives changent
  // MAIS seulement si la progression actuelle n'est pas déjà à 100% depuis l'API
  useEffect(() => {
    if (enrollmentId) {
      // Attendre un peu pour s'assurer que finalEvaluation et finalEvaluationAttempts sont à jour
      const timer = setTimeout(() => {
        // Ne recharger que si la progression n'est pas déjà à 100%
        // Si elle est à 100%, c'est que le backend a confirmé que l'évaluation est complétée
        // On ne veut pas risquer de la réduire à 90% avec une vérification qui pourrait échouer
        if (courseProgress < 100) {
          console.log('[CoursePlayer] 🔄 Recalcul de la progression (actuellement < 100%)');
          loadProgress();
        } else {
          console.log('[CoursePlayer] ⏭️ Progression déjà à 100%, pas de recalcul nécessaire');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [finalEvaluation, finalEvaluationAttempts.length, enrollmentId, courseProgress]);

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
      try {
        const evalData = await evaluationService.getEnrollmentEvaluation(enrollmentId);
        console.log('[CoursePlayer] 📊 Données d\'évaluation chargées:', {
          hasEvaluation: !!evalData?.evaluation,
          evaluationId: evalData?.evaluation?.id,
          previousAttemptsCount: evalData?.previous_attempts?.length || 0,
          previousAttempts: evalData?.previous_attempts?.map((a: any) => ({
            id: a.id,
            completed_at: a.completed_at,
            percentage: a.percentage,
            is_passed: a.is_passed
          })) || []
        });
        
        if (evalData?.evaluation?.id) {
          setEvaluationId(String(evalData.evaluation.id));
          setFinalEvaluation(evalData.evaluation);
          setFinalEvaluationAttempts(evalData.previous_attempts || []);
          console.log('[CoursePlayer] ✅ Évaluation finale chargée, tentatives:', evalData.previous_attempts?.length || 0);
        } else {
          setEvaluationId(null);
          setFinalEvaluation(null);
          setFinalEvaluationAttempts([]);
          console.log('[CoursePlayer] ⚠️ Pas d\'évaluation finale trouvée');
        }
      } catch (error) {
        console.log('[CoursePlayer] ⚠️ Pas d\'évaluation finale pour ce cours:', error);
        setEvaluationId(null);
        setFinalEvaluation(null);
        setFinalEvaluationAttempts([]);
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

      let courseProgressValueRaw =
        typeof enrollmentInfo?.progress_percentage === 'number'
          ? enrollmentInfo.progress_percentage
          : Number(summary.progress_percentage || summary.progress || 0);

      console.log('[CoursePlayer] 📊 Progression depuis l\'API:', {
        courseProgressValueRaw,
        enrollmentInfo: enrollmentInfo ? {
          progress_percentage: enrollmentInfo.progress_percentage,
          status: enrollmentInfo.status
        } : null,
        summary: summary ? {
          progress_percentage: summary.progress_percentage,
          progress: summary.progress
        } : null,
        finalEvaluation: finalEvaluation ? { id: finalEvaluation.id } : null,
        finalEvaluationAttemptsCount: finalEvaluationAttempts.length,
        finalEvaluationAttempts: finalEvaluationAttempts.map((a: any) => ({
          id: a.id,
          completed_at: a.completed_at,
          percentage: a.percentage
        }))
      });

      // IMPORTANT: Si la progression de l'API est à 100%, on fait TOUJOURS confiance au backend
      // Le backend a déjà vérifié que l'évaluation finale est complétée
      // On ne fait AUCUNE vérification supplémentaire qui pourrait réduire cette valeur
      if (courseProgressValueRaw === 100) {
        // Le backend indique 100%, donc l'évaluation finale est complétée
        // On garde 100% sans ajustement - AUCUNE vérification supplémentaire
        console.log('[CoursePlayer] ✅ Progression à 100% depuis l\'API - évaluation finale complétée (confiance totale au backend)');
        // Ne pas modifier courseProgressValueRaw, garder 100%
      } else if (courseProgressValueRaw > 100) {
        // Cas anormal, limiter à 100%
        courseProgressValueRaw = 100;
        console.log('[CoursePlayer] ⚠️ Progression > 100% détectée, limitée à 100%');
      } else if (finalEvaluation && courseProgressValueRaw >= 90 && courseProgressValueRaw < 100) {
        // Si la progression est entre 90% et 100%, vérifier côté frontend
        // Vérifier si l'évaluation finale est complétée (peu importe si réussie ou échouée)
        const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
          return attempt.completed_at !== null && attempt.completed_at !== undefined;
        });
        
        console.log('[CoursePlayer] 🔍 Vérification évaluation finale (progression entre 90-100%):', {
          hasCompletedEvaluation,
          attempts: finalEvaluationAttempts.map((a: any) => ({
            completed_at: a.completed_at,
            hasCompletedAt: a.completed_at !== null && a.completed_at !== undefined
          }))
        });
        
        if (hasCompletedEvaluation) {
          // L'évaluation est complétée, mettre à 100%
          courseProgressValueRaw = 100;
          console.log('[CoursePlayer] ✅ Évaluation complétée détectée, progression mise à 100%');
        } else {
          // L'évaluation n'est pas complétée, garder à 90%
          courseProgressValueRaw = 90;
          console.log('[CoursePlayer] ⚠️ Évaluation non complétée détectée, progression limitée à 90%');
        }
      }

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
    let computedProgress = Number.isFinite(progressFromDuration) && progressFromDuration > 0
      ? progressFromDuration
      : progressFromLessons;

    // Ajuster le calcul local si une évaluation finale existe et n'est pas complétée
    // MAIS seulement si progressFromApi n'est pas déjà à 100%
    // Si progressFromApi est à 100%, on ne touche pas à computedProgress car le backend a déjà vérifié
    if (progressFromApi !== 100 && finalEvaluation && computedProgress >= 100) {
      // Vérifier si l'évaluation finale est complétée (peu importe si réussie ou échouée)
      const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
        return attempt.completed_at !== null && attempt.completed_at !== undefined;
      });
      
      if (!hasCompletedEvaluation) {
        // Tous les modules sont complétés mais l'évaluation finale n'est pas encore complétée
        computedProgress = 90;
        console.log('[CoursePlayer] ⚠️ Calcul local ajusté à 90% (évaluation non complétée, progressFromApi !== 100)');
      } else {
        // L'évaluation est complétée, mettre à 100%
        computedProgress = 100;
        console.log('[CoursePlayer] ✅ Calcul local ajusté à 100% (évaluation complétée, progressFromApi !== 100)');
      }
    } else if (progressFromApi === 100) {
      // Si progressFromApi est à 100%, on ne touche pas à computedProgress
      // Le backend a déjà confirmé que l'évaluation est complétée
      console.log('[CoursePlayer] ⏭️ Calcul local non ajusté (progressFromApi === 100%, confiance au backend)');
    }

    // Utiliser la progression de l'API (qui tient compte de l'évaluation finale) en priorité
    // La valeur de l'API est déjà ajustée par le backend pour tenir compte de l'évaluation finale
    // Si l'API renvoie 0 ou n'est pas disponible, utiliser le calcul local (déjà ajusté)
    let preferredProgress = progressFromApi > 0 ? progressFromApi : computedProgress;
    
    console.log('[CoursePlayer] 🔄 Calcul de preferredProgress:', {
      progressFromApi,
      computedProgress,
      preferredProgress,
      finalEvaluation: finalEvaluation ? { id: finalEvaluation.id } : null,
      finalEvaluationAttemptsCount: finalEvaluationAttempts.length
    });
    
    // IMPORTANT: Si la progression de l'API est à 100%, on fait TOUJOURS confiance au backend
    // Le backend a déjà vérifié que l'évaluation finale est complétée
    // On ne fait AUCUNE vérification supplémentaire qui pourrait réduire cette valeur
    if (progressFromApi === 100) {
      // Le backend confirme 100%, on garde cette valeur SANS AUCUNE vérification
      preferredProgress = 100;
      console.log('[CoursePlayer] ✅ Progression confirmée à 100% par le backend (progressFromApi === 100) - AUCUNE vérification supplémentaire');
    } else if (preferredProgress >= 100 && progressFromApi !== 100) {
      // Si preferredProgress >= 100 mais que progressFromApi n'est pas 100, c'est que computedProgress est à 100%
      // Dans ce cas, vérifier si l'évaluation finale est complétée
      if (finalEvaluation) {
        // L'évaluation finale est chargée, vérifier si elle est complétée
        const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
          const hasCompleted = attempt.completed_at !== null && attempt.completed_at !== undefined;
          console.log('[CoursePlayer] 🔍 Tentative d\'évaluation:', {
            id: attempt.id,
            completed_at: attempt.completed_at,
            hasCompleted
          });
          return hasCompleted;
        });
        
        console.log('[CoursePlayer] 🔍 Résultat vérification évaluation:', {
          hasCompletedEvaluation,
          attemptsCount: finalEvaluationAttempts.length
        });
        
        if (hasCompletedEvaluation) {
          // L'évaluation est complétée, mettre à 100%
          preferredProgress = 100;
          console.log('[CoursePlayer] ✅ Évaluation complétée détectée, progression à 100%');
        } else {
          preferredProgress = 90;
          console.log('[CoursePlayer] ⚠️ Évaluation non complétée, progression limitée à 90%');
        }
      } else {
        // L'évaluation finale n'est pas encore chargée, mais toutes les leçons sont complétées
        // Limiter temporairement à 90% pour éviter d'afficher 100% avant que l'évaluation soit vérifiée
        preferredProgress = 90;
        console.log('[CoursePlayer] ⚠️ Évaluation finale non chargée, progression limitée à 90%');
      }
    }
    
    console.log('[CoursePlayer] 📊 Progression finale calculée:', {
      preferredProgress,
      progressFromApi,
      computedProgress,
      source: progressFromApi === 100 ? 'API (100%)' : progressFromApi > 0 ? 'API' : 'Calcul local'
    });

    // Sécurité finale: si une évaluation finale existe mais aucune tentative complétée,
    // ne jamais afficher 100% (cap à 90%), sauf si l'API confirme 100%.
    if (progressFromApi !== 100 && finalEvaluation) {
      const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
        return attempt?.completed_at !== null && attempt?.completed_at !== undefined;
      });
      if (!hasCompletedEvaluation && preferredProgress > 90) {
        preferredProgress = 90;
      }
    }

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
        let progressRatio =
          (optimisticCompleted.size / Math.max(lessonsCount, 1)) * 100;
        
        // Ajuster la progression si une évaluation finale existe et n'est pas complétée
        // IMPORTANT: Ne jamais dépasser 90% si l'évaluation finale n'est pas complétée
        if (finalEvaluation && progressRatio >= 100) {
          // Vérifier si l'évaluation finale est complétée (peu importe si réussie ou échouée)
          const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
            return attempt.completed_at !== null && attempt.completed_at !== undefined;
          });
          
          if (!hasCompletedEvaluation) {
            // Tous les modules sont complétés mais l'évaluation finale n'est pas encore complétée
            progressRatio = 90;
          }
        } else if (finalEvaluation === null && progressRatio >= 100) {
          // Si l'évaluation finale n'est pas encore chargée mais que toutes les leçons sont complétées,
          // limiter temporairement à 90% pour éviter d'afficher 100% avant que l'évaluation soit chargée
          progressRatio = 90;
        }
        
        // Ne mettre à jour que si la nouvelle valeur est supérieure ET ne dépasse pas 90% si évaluation non complétée
        setCourseProgress((current) => {
          // Si l'évaluation finale existe et n'est pas complétée, ne jamais dépasser 90%
          if (finalEvaluation) {
            const hasCompletedEvaluation = finalEvaluationAttempts.some((attempt: any) => {
              return attempt.completed_at !== null && attempt.completed_at !== undefined;
            });
            if (!hasCompletedEvaluation && progressRatio > 90) {
              return Math.max(current, 90);
            }
          }
          return progressRatio > current ? progressRatio : current;
        });
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
    
    // Si le module n'a pas de leçons
    if (!module.lessons || module.lessons.length === 0) {
      // S'il a un quiz, progression 100% si quiz réussi, sinon 0
      if (moduleQuizzes.has(moduleId)) {
        return completedModuleQuizzes.has(moduleId) ? 100 : 0;
      }
      // Pas de leçons ni de quiz → considérer complété
      return 100;
    }
    
    // Calculer la progression des leçons
    const completedLessonsCount = module.lessons.filter((l) => completedLessons.has(l.id)).length;
    const lessonsProgress = (completedLessonsCount / module.lessons.length) * 100;
    
    // Si toutes les leçons sont complétées
    if (lessonsProgress === 100) {
      // Si un quiz est associé, il doit être réussi pour 100% (sinon 90%)
      if (moduleQuizzes.has(moduleId)) {
        return completedModuleQuizzes.has(moduleId) ? 100 : 90;
      }
      return 100; // Pas de quiz → 100%
    }
    
    // Sinon, retourner la progression des leçons uniquement
    return lessonsProgress;
  };

  const isModuleCompleted = (module: Module): boolean => {
    const moduleId = module.id;
    
    // Un module est complété si:
    // - Toutes ses leçons sont validées
    // - ET si un quiz est lié, ce quiz est réussi
    if (!module.lessons || module.lessons.length === 0) {
      // Aucun contenu leçon: s'il existe un quiz, il doit être réussi; sinon considéré complété
      if (moduleQuizzes.has(moduleId)) {
        return completedModuleQuizzes.has(moduleId);
      }
      return true;
    }
    const allLessonsCompleted = module.lessons.every((l) => completedLessons.has(l.id));
    if (!allLessonsCompleted) return false;
    if (moduleQuizzes.has(moduleId)) {
      return completedModuleQuizzes.has(moduleId);
    }
    return true;
  };

  // Vérifier si tous les modules sont complétés
  const checkAllModulesCompleted = useCallback(() => {
    if (!course.modules || course.modules.length === 0) {
      setAllModulesCompleted(false);
      return false;
    }
    
    const moduleStatuses: Array<{ moduleId: number; title: string; completed: boolean; reason: string }> = [];
    
    const allCompleted = course.modules.every((module) => {
      const moduleId = module.id;
      // Baser l'état sur isModuleCompleted pour assurer cohérence
      const completed = isModuleCompleted(module);
      let reason = '';
      if (!module.lessons || module.lessons.length === 0) {
        reason = moduleQuizzes.has(moduleId)
          ? (completed ? 'Quiz complété' : 'Quiz non complété')
          : 'Aucune leçon ni quiz';
      } else {
        const lessonsCount = module.lessons.length;
        const lessonsCompletedCount = module.lessons.filter((l) => completedLessons.has(l.id)).length;
        if (lessonsCompletedCount < lessonsCount) {
          reason = `${lessonsCompletedCount}/${lessonsCount} leçons complétées`;
        } else if (moduleQuizzes.has(moduleId)) {
          reason = completed ? 'Toutes les leçons + quiz complétés' : 'Leçons complétées mais quiz non réussi';
        } else {
          reason = 'Toutes les leçons complétées (pas de quiz)';
        }
      }
      moduleStatuses.push({
        moduleId,
        title: module.title || `Module ${moduleId}`,
        completed,
        reason
      });
      return completed;
    });
    
    console.log('[CoursePlayer] 📊 Statut des modules:', {
      totalModules: course.modules.length,
      allCompleted,
      moduleStatuses
    });
    
    setAllModulesCompleted(allCompleted);
    return allCompleted;
  }, [course.modules, completedLessons, moduleQuizzes, completedModuleQuizzes]);

  // Vérifier si l'évaluation finale peut être activée
  const canActivateFinalEvaluation = useMemo(() => {
    const debugInfo = {
      hasFinalEvaluation: !!finalEvaluation,
      hasEnrollmentId: !!enrollmentId,
      allModulesCompleted,
      courseProgress,
      finalEvaluationId: finalEvaluation?.id,
      enrollmentIdValue: enrollmentId
    };
    
    if (!finalEvaluation || !enrollmentId) {
      console.log('[CoursePlayer] 🔒 Évaluation finale verrouillée:', {
        ...debugInfo,
        reason: !finalEvaluation ? 'Pas d\'évaluation finale' : 'Pas d\'enrollment ID'
      });
      return false;
    }
    
    // Tous les modules doivent être complétés
    if (!allModulesCompleted) {
      console.log('[CoursePlayer] 🔒 Évaluation finale verrouillée:', {
        ...debugInfo,
        reason: 'Tous les modules ne sont pas complétés',
        allModulesCompletedValue: allModulesCompleted
      });
      return false;
    }
    
    // L'évaluation finale est accessible si tous les modules sont complétés
    // (même si le cours est à 100%, car l'évaluation finale fait partie du cours)
    // La progression peut être à 90% (modules complétés mais évaluation pas encore faite) ou 100% (évaluation complétée)
    console.log('[CoursePlayer] ✅ Évaluation finale débloquée:', {
      ...debugInfo,
      note: 'Tous les modules sont complétés, évaluation finale accessible'
    });
    return true;
  }, [finalEvaluation, allModulesCompleted, courseProgress, enrollmentId]);

  // Mettre à jour le statut de complétion des modules
  useEffect(() => {
    checkAllModulesCompleted();
  }, [checkAllModulesCompleted, completedLessons, moduleQuizzes, completedModuleQuizzes]);

  const handleQuizClick = (moduleId: number) => {
    const quizId = moduleQuizzes.get(moduleId);
    if (quizId) {
      setSelectedQuizId(quizId);
      setViewMode('quiz');
    }
  };

  const handleEvaluationClick = () => {
    // Utiliser l'ID de l'évaluation finale chargée
    const evalId = finalEvaluation?.id ? String(finalEvaluation.id) : evaluationId;
    if (evalId) {
      setSelectedEvaluationId(evalId);
      setViewMode('evaluation');
    } else {
      console.error('[CoursePlayer] ❌ Pas d\'ID d\'évaluation disponible');
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

  const handleEvaluationComplete = async (result: any) => {
    console.log('[CoursePlayer] 🎉 handleEvaluationComplete appelé:', {
      result,
      enrollmentId,
      hasFinalEvaluation: !!finalEvaluation
    });
    
    // Stocker le résultat et afficher la modal
    setEvaluationResult(result);
    setShowEvaluationResultModal(true);
    setEvaluationAttemptsUsed(prev => prev + 1);
    
    // Si l'évaluation est réussie et éligible pour certificat, ouvrir le modal de vérification
    // Le modal de vérification doit s'afficher après la modal de résultat
    if (result.passed && result.certificate_eligible) {
      console.log('[CoursePlayer] ✅ Évaluation réussie et éligible, ouverture du modal de vérification après 1 seconde...');
      setTimeout(() => {
        console.log('[CoursePlayer] 🎯 Affichage du modal de vérification maintenant');
        setShowProfileVerificationModal(true);
      }, 1000);
    }
    
    // Recharger les tentatives d'évaluation pour mettre à jour finalEvaluationAttempts
    if (enrollmentId) {
      console.log('[CoursePlayer] 🔄 Rechargement des quiz et évaluation...');
      await loadCourseQuizzesAndEvaluation();
      console.log('[CoursePlayer] ✅ Quiz et évaluation rechargés');
      
      // Attendre un peu pour s'assurer que les données sont bien chargées
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Recharger la progression après complétion de l'évaluation
    // La progression devrait maintenant être à 100% car l'évaluation est complétée
    console.log('[CoursePlayer] 🔄 Rechargement de la progression...');
    await loadProgress();
    console.log('[CoursePlayer] ✅ Progression rechargée');
    
    // Attendre encore un peu et recharger une dernière fois pour s'assurer que tout est à jour
    // Le backend a peut-être besoin d'un peu de temps pour mettre à jour la progression
    setTimeout(async () => {
      console.log('[CoursePlayer] 🔄 Rechargement final après délai...');
      await loadCourseQuizzesAndEvaluation();
      await loadProgress();
      console.log('[CoursePlayer] ✅ Rechargement final terminé');
    }, 1500);
  };

  const handleConfirmProfileData = async () => {
    if (!course.id) {
      toast.error('Erreur', 'Impossible de générer le certificat sans courseId');
      return;
    }

    setRequestingCertificate(true);
    try {
      // Utiliser generateForCourse pour créer le certificat après confirmation des données
      // Le backend vérifie que l'évaluation finale est réussie avant de créer le certificat
      const courseId = typeof course.id === 'number' ? course.id.toString() : course.id;
      await certificateService.generateForCourse(courseId);
      toast.success(
        'Certificat généré',
        'Votre certificat a été généré avec succès avec les données de votre profil.'
      );
      setShowProfileVerificationModal(false);
      // Rediriger vers la page des certificats
      window.location.href = `/dashboard/student/certificates?courseId=${courseId}`;
    } catch (error: any) {
      console.error('Erreur lors de la génération du certificat:', error);
      toast.error('Erreur', error.message || 'Impossible de générer le certificat');
    } finally {
      setRequestingCertificate(false);
    }
  };

  const handleUpdateProfile = () => {
    if (!course.id) return;
    // Rediriger vers le profil avec un paramètre pour revenir après
    const courseId = typeof course.id === 'number' ? course.id.toString() : course.id;
    const returnUrl = encodeURIComponent(`/dashboard/student/certificates?courseId=${courseId}&requestCertificate=true`);
    window.location.href = `/dashboard/student/profile?returnUrl=${returnUrl}`;
  };

  const handleCloseEvaluationResultModal = () => {
    const wasPassed = evaluationResult?.passed;
    setShowEvaluationResultModal(false);
    setEvaluationResult(null);
    // Ne plus générer automatiquement le certificat ici
    // Le modal de vérification dans CourseEvaluationPlayer gère la création du certificat
    // après vérification des données du profil
    if (!wasPassed) {
      // Retour aux leçons si non réussi
      handleBackToLesson();
    }
    // Si réussi, le modal de vérification dans CourseEvaluationPlayer s'affichera
    // et le certificat sera créé seulement après confirmation des données
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
    <>
      {/* Modal de résultats d'évaluation */}
      {showEvaluationResultModal && evaluationResult && finalEvaluation && (
        <Modal
          isOpen={showEvaluationResultModal}
          onClose={handleCloseEvaluationResultModal}
          title="Résultats de l'évaluation"
          size="lg"
        >
          <div className="space-y-6">
            <div className={`rounded-lg p-6 text-center ${
              evaluationResult.passed
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200'
            }`}>
              {evaluationResult.passed ? (
                <>
                  <GraduationCap className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Évaluation réussie !</h2>
                  {evaluationResult.certificate_eligible && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Award className="h-6 w-6 text-yellow-600" />
                        <p className="text-lg font-semibold text-yellow-800">
                          Vous êtes éligible pour obtenir un certificat !
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-900 mb-2">Évaluation non réussie</h2>
                  <p className="text-gray-600 mt-2">
                    Il vous reste {finalEvaluation.max_attempts - evaluationAttemptsUsed} tentative(s)
                  </p>
                </>
              )}

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-600">Score obtenu</p>
                    <p className={`text-3xl font-bold ${evaluationResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {evaluationResult.percentage}%
                    </p>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Score minimum</p>
                    <p className="text-2xl font-semibold text-gray-700">{finalEvaluation.passing_score}%</p>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Points</p>
                    <p className="text-2xl font-semibold text-gray-700">
                      {evaluationResult.score} / {evaluationResult.total_points}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCloseEvaluationResultModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className={`flex flex-col lg:flex-row h-screen ${className}`}>
      {/* Sidebar - Modules et Leçons */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto flex-shrink-0 h-full">
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
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Quiz du module (si disponible) - en bas des leçons */}
                    {moduleQuizzes.has(module.id) && (
                      <button
                        onClick={() => handleQuizClick(module.id)}
                        disabled={!(module.lessons && module.lessons.every((l) => completedLessons.has(l.id)))}
                        className={`w-full p-3 text-left text-sm transition-colors border-t border-gray-200 ${
                          // Le quiz est accessible si toutes les leçons sont complétées (même si le quiz n'est pas encore réussi)
                          module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                            ? 'bg-[#3B7C8A]/10 hover:bg-[#3B7C8A]/20 cursor-pointer'
                            : 'bg-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Award className={`h-4 w-4 flex-shrink-0 ${
                            module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                              ? completedModuleQuizzes.has(module.id)
                                ? 'text-green-600'
                                : 'text-[#3B7C8A]'
                              : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <p className={`font-medium ${
                              module.lessons && module.lessons.every((l) => completedLessons.has(l.id))
                                ? completedModuleQuizzes.has(module.id)
                                  ? 'text-green-900'
                                  : 'text-[#2d5f6a]'
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
                                  : 'text-[#3B7C8A]'
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
                  </div>
                )}
              </div>
            );
          })}

          {/* Évaluation Finale - En bas de tous les modules */}
          {finalEvaluation ? (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={canActivateFinalEvaluation ? handleEvaluationClick : undefined}
                disabled={!canActivateFinalEvaluation}
                className={`w-full p-4 text-left transition-all ${
                  canActivateFinalEvaluation
                    ? 'bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] text-white hover:from-[#2d5f6a] hover:to-[#1f4a52] cursor-pointer shadow-md'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <GraduationCap className={`h-5 w-5 flex-shrink-0 ${
                    canActivateFinalEvaluation ? 'text-white' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`font-semibold ${
                        canActivateFinalEvaluation ? 'text-white' : 'text-gray-600'
                      }`}>
                        Évaluation Finale
                      </p>
                      {finalEvaluationAttempts.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          canActivateFinalEvaluation
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {finalEvaluationAttempts.length} tentative(s)
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${
                      canActivateFinalEvaluation ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {canActivateFinalEvaluation
                        ? 'Tous les modules sont complétés. Passez l\'évaluation finale pour obtenir votre certificat.'
                        : !allModulesCompleted
                          ? 'Complétez tous les modules et leurs quiz pour accéder à l\'évaluation finale'
                          : 'En attente...'}
                    </p>
                  </div>
                  {!canActivateFinalEvaluation && (
                    <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>
          ) : (
            // Afficher un message si l'évaluation finale n'est pas encore chargée mais que les modules sont complétés
            allModulesCompleted && enrollmentId && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600">Évaluation Finale</p>
                    <p className="text-xs text-gray-500">Chargement des informations de l'évaluation...</p>
                  </div>
                  <Loader className="h-5 w-5 text-gray-400 animate-spin flex-shrink-0" />
                </div>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white h-full flex flex-col">
        <div className="flex-shrink-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <Link href="/" className="inline-flex items-center justify-center mb-2 sm:mb-0">
                <Image
                  src="/mdsc-logo.png"
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
        <div className="flex-1 overflow-y-auto">
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
            
            {/* Quiz du module en bas des leçons */}
            {selectedModuleId && moduleQuizzes.has(selectedModuleId) && selectedModule && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-gradient-to-r from-[#3B7C8A]/10 to-[#3B7C8A]/5 rounded-lg p-6 border border-[#3B7C8A]/30">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Award className="h-8 w-8 text-[#3B7C8A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Quiz du module : {selectedModule.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {completedModuleQuizzes.has(selectedModuleId) ? (
                          <span className="text-green-600 font-medium">✓ Quiz réussi - Module complété</span>
                        ) : selectedModule.lessons && selectedModule.lessons.every((l) => completedLessons.has(l.id)) ? (
                          <span>Complétez le quiz pour finaliser ce module (obligatoire)</span>
                        ) : (
                          <span className="text-gray-500">Complétez toutes les leçons du module pour accéder au quiz</span>
                        )}
                      </p>
                      {selectedModule.lessons && selectedModule.lessons.every((l) => completedLessons.has(l.id)) ? (
                        <button
                          onClick={() => handleQuizClick(selectedModuleId)}
                          className="inline-flex items-center px-6 py-3 bg-[#3B7C8A] text-white rounded-lg hover:bg-[#2d5f6a] transition-colors font-medium"
                        >
                          <Award className="h-5 w-5 mr-2" />
                          {completedModuleQuizzes.has(selectedModuleId) ? 'Voir les résultats du quiz' : 'Passer le quiz'}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {selectedModule.lessons ? (
                            <>
                              {selectedModule.lessons.filter((l) => completedLessons.has(l.id)).length} / {selectedModule.lessons.length} leçons complétées
                            </>
                          ) : (
                            'Aucune leçon dans ce module'
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  className="mt-4 px-6 py-3 bg-[#3B7C8A] text-white rounded-lg hover:bg-[#2d5f6a] transition-colors flex items-center space-x-2 mx-auto"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span>Passer l'évaluation finale</span>
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
      
      {/* Bouton de chat flottant pour contacter le formateur */}
      <FloatingChatButton 
        courseId={course.id} 
        courseTitle={course.title}
      />
      {/* Popup Certificat avec confettis (après réussite) */}
      <CertificateCelebrateModal
        isOpen={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          // Retour aux leçons après célébration
          handleBackToLesson();
        }}
        fullName={
          (user && ((user as any).first_name || (user as any).firstName) && ((user as any).last_name || (user as any).lastName))
            ? `${(user as any).first_name || (user as any).firstName} ${(user as any).last_name || (user as any).lastName}`
            : ((user as any)?.fullName || (user as any)?.name || (user as any)?.username || 'Étudiant(e)')
        }
        courseTitle={course.title || 'Formation'}
        code={(generatedCertificate as any)?.certificate_code || (generatedCertificate as any)?.certificateCode}
        issuedAt={
          (generatedCertificate as any)?.issued_at
            ? new Date((generatedCertificate as any).issued_at)
            : undefined
        }
      />

      {/* Modal de vérification des données du profil */}
      <ProfileVerificationModal
        isOpen={showProfileVerificationModal}
        onClose={() => setShowProfileVerificationModal(false)}
        onConfirm={handleConfirmProfileData}
        onUpdateProfile={handleUpdateProfile}
        courseId={typeof course.id === 'number' ? course.id.toString() : course.id}
      />
    </div>
    </>
  );
}
