'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Lock, BookOpen, Clock, Award, FileText, GraduationCap } from 'lucide-react';
import { Course, Module, Lesson } from '../../types/course';
import LessonContent from './LessonContent';
import ModuleQuizPlayer from '../dashboard/student/ModuleQuizPlayer';
import CourseEvaluationPlayer from '../dashboard/student/CourseEvaluationPlayer';
import { progressService } from '../../lib/services/progressService';
import { quizService } from '../../lib/services/quizService';
import { evaluationService } from '../../lib/services/evaluationService';
import { useRouter } from 'next/navigation';

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
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, [course.id]);

  useEffect(() => {
    if (enrollmentId) {
      loadCourseQuizzesAndEvaluation();
    }
  }, [enrollmentId, course.id]);

  // Charger les quiz des modules et l'évaluation finale
  const loadCourseQuizzesAndEvaluation = async () => {
    if (!enrollmentId) return; // Pas d'enrollment, pas de quiz/évaluation à charger
    
    try {
      // Charger l'évaluation finale pour l'étudiant
      const evalData = await evaluationService.getEvaluationForStudent(enrollmentId);
      if (evalData?.id) {
        setEvaluationId(evalData.id);
      }

      // Charger les quiz de chaque module
      if (course.modules && enrollmentId) {
        const quizzesMap = new Map<number, string>();
        for (const module of course.modules) {
          // Vérifier si le module contient déjà l'ID du quiz
          const moduleAny = module as any;
          if (moduleAny.quiz_id) {
            quizzesMap.set(module.id, moduleAny.quiz_id);
          } else {
            // Essayer de récupérer le quiz via l'API pour les étudiants
            try {
              const quiz = await quizService.getModuleQuizForStudent(enrollmentId, module.id.toString());
              if (quiz?.id) {
                quizzesMap.set(module.id, quiz.id);
              }
            } catch (error) {
              // Pas de quiz pour ce module, continuer
            }
          }
        }
        setModuleQuizzes(quizzesMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des quiz et évaluation:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const progress = await progressService.getCourseProgress(course.id);
      setCourseProgress(progress.progress_percentage || 0);
      
      // Récupérer l'enrollmentId depuis le cours
      const courseAny = course as any;
      const enrollment = courseAny.enrollment || courseAny.enrollmentId;
      if (enrollment) {
        setEnrollmentId(typeof enrollment === 'object' ? enrollment.id : enrollment);
        
        // Récupérer les leçons déverrouillées
        if (enrollmentId) {
          const unlocked = await progressService.getUnlockedLessons(enrollmentId, course.id);
          setUnlockedLessons(new Set(unlocked));
        }
      }
      
      // Récupérer les leçons complétées depuis la progression
      if (progress.completed_lessons) {
        const completed = Array.isArray(progress.completed_lessons) 
          ? progress.completed_lessons 
          : [];
        setCompletedLessons(new Set(completed.map((l: any) => typeof l === 'object' ? l.id : l)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  };

  const selectedModule = course.modules?.find(m => m.id === selectedModuleId);
  const selectedLesson = selectedModule?.lessons?.find(l => l.id === selectedLessonId);
  
  // Calculer la durée totale du cours
  const totalDuration = course.modules?.reduce((total, module) => {
    return total + (module.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0);
  }, 0) || course.duration || 0;

  // Si aucune leçon n'est sélectionnée mais qu'un module l'est, sélectionner la première leçon
  useEffect(() => {
    if (selectedModuleId && !selectedLessonId && selectedModule?.lessons && selectedModule.lessons.length > 0) {
      const firstLesson = selectedModule.lessons[0];
      setSelectedLessonId(firstLesson.id);
      router.replace(`/learn/${course.id}?module=${selectedModuleId}&lesson=${firstLesson.id}`);
    }
  }, [selectedModuleId]);

  const handleLessonSelect = async (lesson: Lesson) => {
    // Vérifier l'accès à la leçon
    if (enrollmentId && !isLessonUnlocked(lesson)) {
      // Afficher un message d'erreur
      alert('Cette leçon est verrouillée. Vous devez compléter la leçon précédente pour y accéder.');
      return;
    }

    setSelectedLessonId(lesson.id);
    router.replace(`/learn/${course.id}?module=${selectedModuleId}&lesson=${lesson.id}`);
  };

  const handleLessonComplete = async () => {
    if (selectedLessonId && enrollmentId) {
      try {
        // Marquer la leçon comme complétée et déverrouiller la suivante
        const result = await progressService.completeLesson(enrollmentId, selectedLessonId);
        
        if (result.success) {
          setCompletedLessons(prev => new Set([...prev, selectedLessonId]));
          
          // Recharger les leçons déverrouillées
          if (enrollmentId) {
            const unlocked = await progressService.getUnlockedLessons(enrollmentId, course.id);
            setUnlockedLessons(new Set(unlocked));
          }
          
          loadProgress();
          
          // Si la prochaine leçon a été déverrouillée, afficher un message
          if (result.nextLessonUnlocked) {
            // Optionnel : afficher une notification
          }
        }
      } catch (error) {
        console.error('Erreur lors de la complétion de la leçon:', error);
      }
    }
  };

  const isLessonUnlocked = (lesson: Lesson): boolean => {
    // Si pas d'enrollment, toutes les leçons sont déverrouillées (pour preview)
    if (!enrollmentId) return true;
    
    // Vérifier si la leçon est dans la liste des leçons déverrouillées
    if (unlockedLessons.has(lesson.id)) {
      return true;
    }
    
    // La première leçon du cours est toujours déverrouillée
    if (course.modules && course.modules.length > 0) {
      const firstModule = course.modules[0];
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0];
        if (firstLesson.id === lesson.id) {
          return true;
        }
      }
    }
    
    return false;
  };

  const isLessonLocked = (lesson: Lesson): boolean => {
    return !isLessonUnlocked(lesson);
  };

  const getModuleProgress = (module: Module): number => {
    if (!module.lessons || module.lessons.length === 0) return 0;
    const completed = module.lessons.filter(l => completedLessons.has(l.id)).length;
    return (completed / module.lessons.length) * 100;
  };

  const isModuleCompleted = (module: Module): boolean => {
    return getModuleProgress(module) === 100;
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
    // Recharger la progression après complétion du quiz
    loadProgress();
    // Retourner aux leçons
    handleBackToLesson();
  };

  const handleEvaluationComplete = (result: any) => {
    // Recharger la progression après complétion de l'évaluation
    loadProgress();
    // Retourner aux leçons
    handleBackToLesson();
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Sidebar - Modules et Leçons */}
      <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-6 border-b border-gray-200 bg-mdsc-blue-primary text-white">
          <h2 className="text-xl font-bold mb-2">{course.title}</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.modules?.length || 0} modules</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{totalDuration} min</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progression</span>
              <span>{Math.round(courseProgress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-mdsc-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseProgress}%` }}
              />
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
                  onClick={() => setSelectedModuleId(isExpanded ? null : module.id)}
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
                      {module.lessons?.length || 0} leçons • {module.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0} min
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
                    {/* Quiz du module (si disponible et module complété) */}
                    {isModuleCompleted(module) && moduleQuizzes.has(module.id) && (
                      <button
                        onClick={() => handleQuizClick(module.id)}
                        className="w-full p-3 text-left text-sm transition-colors border-b border-gray-200 bg-purple-50 hover:bg-purple-100"
                      >
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-purple-900">Quiz du module</p>
                            <p className="text-xs text-purple-600">Passer le quiz pour obtenir un badge</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Liste des leçons */}
                    {module.lessons && module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.has(lesson.id);
                      const isLocked = isLessonLocked(lesson);
                      const isSelected = selectedLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && handleLessonSelect(lesson)}
                          disabled={isLocked}
                          className={`
                            w-full p-3 text-left text-sm transition-colors border-b border-gray-200 last:border-b-0
                            ${isSelected ? 'bg-mdsc-blue-primary text-white' : 'hover:bg-white'}
                            ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${isCompleted && !isSelected ? 'bg-green-50' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            {isLocked ? (
                              <Lock className="h-4 w-4 flex-shrink-0" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                            ) : (
                              <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
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
      <main className="flex-1 overflow-y-auto">
        {viewMode === 'quiz' && selectedQuizId ? (
          <div className="p-8">
            <div className="mb-4">
              <button
                onClick={handleBackToLesson}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
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
          <div className="p-8">
            <div className="mb-4">
              <button
                onClick={handleBackToLesson}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
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
        ) : selectedLesson ? (
          <div className="p-8">
            <LessonContent
              lesson={selectedLesson}
              courseId={typeof course.id === 'number' ? course.id.toString() : course.id}
              enrollmentId={course.enrollment?.id ? (typeof course.enrollment.id === 'number' ? course.enrollment.id : parseInt(course.enrollment.id)) : undefined}
              onComplete={handleLessonComplete}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700">
                Sélectionnez une leçon pour commencer
              </h3>
              <p className="text-gray-500">
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
