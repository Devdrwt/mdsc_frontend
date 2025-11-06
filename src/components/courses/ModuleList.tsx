'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Lock, CheckCircle, Clock, BookOpen, Award, Plus, FileQuestion } from 'lucide-react';
import { Module, Enrollment, Progress } from '../../types/course';
import { moduleService } from '../../lib/services/moduleService';
import { progressService } from '../../lib/services/progressService';
import { useAuthStore } from '../../lib/stores/authStore';
import { quizService } from '../../lib/services/quizService';

interface ModuleListProps {
  courseId: number;
  modules: Module[];
  enrollmentId?: number;
  onModuleSelect?: (module: Module) => void;
  onReorder?: (modules: Module[]) => void;
  onQuizClick?: (moduleId: string) => void; // Pour les instructeurs
  onAddLessonClick?: (moduleId: number) => void; // Pour les instructeurs - créer une leçon pour un module
  quizReloadTrigger?: number; // Clé pour forcer le rechargement des quiz
  className?: string;
}

export default function ModuleList({
  courseId,
  modules,
  enrollmentId,
  onModuleSelect,
  onReorder,
  onQuizClick,
  onAddLessonClick,
  quizReloadTrigger = 0,
  className = '',
}: ModuleListProps) {
  const { user } = useAuthStore();
  const isInstructor = user?.role === 'instructor';
  const [unlockStatus, setUnlockStatus] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [localModules, setLocalModules] = useState<Module[]>(modules);
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<number, boolean>>({}); // moduleId -> hasQuiz
  // DnD basique pour réordonner les modules
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => { setLocalModules(modules); }, [modules]);

  // Fonction pour recharger les quiz (peut être appelée depuis le parent)
  const reloadQuizzes = React.useCallback(async () => {
    if (!isInstructor) return;
    try {
      const quizzesMap: Record<number, boolean> = {};
      await Promise.all(
        modules.map(async (module) => {
          try {
            const quiz = await quizService.getModuleQuiz(String(module.id));
            quizzesMap[module.id] = !!quiz;
          } catch (error) {
            quizzesMap[module.id] = false;
          }
        })
      );
      setModuleQuizzes(quizzesMap);
    } catch (error) {
      console.error('Erreur lors du rechargement des quiz:', error);
    }
  }, [modules, isInstructor]);

  useEffect(() => {
    const loadUnlockStatus = async () => {
      try {
        const status = await moduleService.getModulesUnlockStatus(courseId);
        setUnlockStatus(status);
      } catch (error) {
        console.error('Erreur lors du chargement du statut de déverrouillage:', error);
        // Fallback: premier module toujours déverrouillé
        if (modules.length > 0) {
          setUnlockStatus({ [modules[0].id]: true });
        }
      } finally {
        setLoading(false);
      }
    };

    const loadProgress = async () => {
      if (!enrollmentId) return;
      try {
        const progressData = await progressService.getEnrollmentProgress(enrollmentId);
        setProgress(progressData);
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
      }
    };

    const loadModuleQuizzes = async () => {
      if (!isInstructor) return; // Seulement pour les instructeurs
      try {
        const quizzesMap: Record<number, boolean> = {};
        // Charger les quiz pour chaque module
        await Promise.all(
          modules.map(async (module) => {
            try {
              const quiz = await quizService.getModuleQuiz(String(module.id));
              // Vérifier strictement si le quiz existe et est valide (a un id ou des questions)
              const hasQuiz = quiz !== null && 
                             quiz !== undefined && 
                             (quiz.id || (quiz.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0));
              quizzesMap[module.id] = !!hasQuiz;
            } catch (error) {
              // Si pas de quiz, c'est normal (404)
              quizzesMap[module.id] = false;
            }
          })
        );
        setModuleQuizzes(quizzesMap);
      } catch (error) {
        console.error('Erreur lors du chargement des quiz:', error);
      }
    };

    loadUnlockStatus();
    if (enrollmentId) {
      loadProgress();
    }
    if (isInstructor) {
      loadModuleQuizzes();
    }
  }, [courseId, enrollmentId, modules, isInstructor, quizReloadTrigger]);

  // Recharger les quiz quand la clé change (depuis le parent)
  useEffect(() => {
    if (isInstructor && quizReloadTrigger > 0) {
      reloadQuizzes();
    }
  }, [quizReloadTrigger, isInstructor, reloadQuizzes]);

  const getModuleProgress = (module: Module): number => {
    if (!module.lessons || module.lessons.length === 0) return 0;
    
    const completedCount = module.lessons.filter(lesson => {
      const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
      return lessonProgress?.status === 'completed';
    }).length;
    
    return (completedCount / module.lessons.length) * 100;
  };

  const isModuleUnlocked = (module: Module, index: number): boolean => {
    if (index === 0) return true; // Premier module toujours déverrouillé
    if (unlockStatus[module.id] !== undefined) return unlockStatus[module.id];
    
    // Vérifier si le module précédent est complété
    const prevModule = modules[index - 1];
    if (!prevModule.lessons || prevModule.lessons.length === 0) return true;
    
    const prevModuleComplete = prevModule.lessons.every(lesson => {
      const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
      return lessonProgress?.status === 'completed';
    });
    
    return prevModuleComplete;
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...localModules];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setLocalModules(reordered);
    setDragIndex(index);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    onReorder?.(localModules);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {localModules.map((module, index) => {
        const isUnlocked = isModuleUnlocked(module, index);
        const moduleProgress = getModuleProgress(module);
        const isExpanded = false; // TODO: Ajouter gestion d'état expanded si nécessaire

        return (
          <div
            key={module.id}
            draggable={!!onReorder}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`border-2 rounded-lg overflow-hidden transition-all ${
              isUnlocked
                ? 'border-gray-200 hover:border-mdsc-blue-primary bg-white'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <button
              onClick={() => isUnlocked && onModuleSelect?.(module)}
              disabled={!isUnlocked}
              className={`w-full p-4 text-left transition-colors ${
                isUnlocked ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isUnlocked ? 'bg-mdsc-blue-primary/10' : 'bg-gray-200'
                  }`}>
                    {isUnlocked ? (
                      <BookOpen className="h-5 w-5 text-mdsc-blue-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        Module {index + 1}: {module.title}
                      </h3>
                      {!isUnlocked && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Verrouillé
                        </span>
                      )}
                    </div>
                    {module.description && (
                      <p className={`text-sm mt-1 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {module.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {(() => {
                        const totalMinutes = module.lessons?.reduce((sum, l) => {
                          const duration = l.duration || l.duration_minutes || 0;
                          return sum + (typeof duration === 'number' ? duration : 0);
                        }, 0) || 0;
                        const lessonsCount = module.lessons?.length || module.lessons_count || 0;
                        // Vérifier strictement si le module a un quiz (doit être explicitement true)
                        const hasQuiz = moduleQuizzes[module.id] === true;
                        
                        return (
                          <>
                            {totalMinutes > 0 && (
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{totalMinutes} min</span>
                              </span>
                            )}
                            {lessonsCount > 0 && (
                              <span className="flex items-center space-x-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{lessonsCount} leçons</span>
                              </span>
                            )}
                            {isInstructor && (
                              <span className="flex items-center space-x-1">
                                <FileQuestion className="h-3 w-3" />
                                <span>{hasQuiz ? 1 : 0} quiz</span>
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Barre de progression */}
                    {isUnlocked && enrollmentId && module.lessons && module.lessons.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Progression</span>
                          <span className="font-medium text-gray-900">{Math.round(moduleProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-mdsc-blue-primary h-2 rounded-full transition-all"
                            style={{ width: `${moduleProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {moduleProgress === 100 && isUnlocked && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {isInstructor && onAddLessonClick && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onAddLessonClick(module.id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Ajouter une leçon à ce module"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                          onAddLessonClick(module.id);
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </div>
                  )}
                  {isInstructor && onQuizClick && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onQuizClick(String(module.id));
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Créer/Modifier le quiz du module"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                          onQuizClick(String(module.id));
                        }
                      }}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                  )}
                  <ChevronRight className={`h-5 w-5 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  } ${isUnlocked ? 'text-gray-400' : 'text-gray-300'}`} />
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
