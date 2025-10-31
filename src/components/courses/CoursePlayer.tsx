'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Lock, BookOpen, Clock, Award } from 'lucide-react';
import { Course, Module, Lesson } from '../../types/course';
import LessonContent from './LessonContent';
import { progressService } from '../../lib/services/progressService';
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
  const [courseProgress, setCourseProgress] = useState(0);

  useEffect(() => {
    loadProgress();
  }, [course.id]);

  const loadProgress = async () => {
    try {
      const progress = await progressService.getCourseProgress(course.id);
      setCourseProgress(progress.progress_percentage || 0);
      
      // Note: completed_lessons est un nombre total, pas un array
      // Pour obtenir la liste, il faudrait une autre API call
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

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    router.replace(`/learn/${course.id}?module=${selectedModuleId}&lesson=${lesson.id}`);
  };

  const handleLessonComplete = () => {
    if (selectedLessonId) {
      setCompletedLessons(prev => new Set([...prev, selectedLessonId]));
      loadProgress();
    }
  };

  const isLessonLocked = (lesson: Lesson, moduleIndex: number): boolean => {
    if (lesson.orderIndex === 1 && moduleIndex === 0) {
      return false; // Première leçon du premier module
    }

    // Si c'est la première leçon d'un module, vérifier que toutes les leçons du module précédent sont complétées
    if (lesson.orderIndex === 1 && moduleIndex > 0 && course.modules) {
      const previousModule = course.modules[moduleIndex - 1];
      if (previousModule.lessons) {
        const allPreviousCompleted = previousModule.lessons.every(l => completedLessons.has(l.id));
        return !allPreviousCompleted;
      }
    }

    // Sinon, vérifier que la leçon précédente est complétée
    if (lesson.orderIndex > 1 && selectedModule?.lessons) {
      const previousLesson = selectedModule.lessons.find(l => l.orderIndex === lesson.orderIndex - 1);
      if (previousLesson) {
        return !completedLessons.has(previousLesson.id);
      }
    }

    return false;
  };

  const getModuleProgress = (module: Module): number => {
    if (!module.lessons || module.lessons.length === 0) return 0;
    const completed = module.lessons.filter(l => completedLessons.has(l.id)).length;
    return (completed / module.lessons.length) * 100;
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

                {isExpanded && module.lessons && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.has(lesson.id);
                      const isLocked = isLessonLocked(lesson, moduleIndex);
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
        {selectedLesson ? (
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
