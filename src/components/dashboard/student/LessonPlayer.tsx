'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Play, 
  FileText, 
  Video, 
  BookOpen, 
  Headphones, 
  Presentation,
  Loader,
  AlertCircle,
  Clock,
  Trophy,
  Award
} from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/authStore';
import { progressService } from '../../../lib/services/progressService';
import { QuizComponent } from '../../courses/QuizComponent';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'quiz' | 'h5p' | 'assignment' | 'document' | 'audio' | 'presentation';
  content_url?: string;
  content_text?: string;
  video_url?: string;
  duration_minutes: number;
  is_required: boolean;
  order_index: number;
}

interface LessonPlayerProps {
  lesson: Lesson;
  courseId: string;
  enrollmentId?: string;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  className?: string;
}

export default function LessonPlayer({
  lesson,
  courseId,
  enrollmentId,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  className = '',
}: LessonPlayerProps) {
  const { user } = useAuthStore();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(new Date());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [badgesEarned, setBadgesEarned] = useState<any[]>([]);
  const [hasFormativeQuiz, setHasFormativeQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Simuler le tracking de temps
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      setTimeSpent(elapsed);
      
      // Pour les vidéos, simuler 80% après 80% du temps de durée
      if (lesson.content_type === 'video' && lesson.duration_minutes) {
        const totalSeconds = lesson.duration_minutes * 60;
        const simulatedProgress = Math.min((elapsed / totalSeconds) * 0.8, 0.8);
        setProgress(simulatedProgress);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lesson.content_type, lesson.duration_minutes, startTime]);

  // Auto-complétion pour texte après défilement complet
  useEffect(() => {
    if (lesson.content_type === 'text') {
      const checkScroll = () => {
        const element = document.getElementById('lesson-content-text');
        if (element) {
          const scrolled = element.scrollTop;
          const total = element.scrollHeight - element.clientHeight;
          const progress = total > 0 ? scrolled / total : 0;
          setProgress(progress);
        }
      };

      const element = document.getElementById('lesson-content-text');
      if (element) {
        element.addEventListener('scroll', checkScroll);
        return () => element.removeEventListener('scroll', checkScroll);
      }
    }
  }, [lesson.content_type]);

  const handleMarkAsCompleted = async () => {
    if (!enrollmentId || !user) return;

    setIsCompleting(true);
    try {
      // Appeler l'API pour marquer la leçon comme complétée
      await progressService.updateLessonProgress(Number(enrollmentId), Number(lesson.id), {
        status: 'completed',
        completion_percentage: 100,
        time_spent: timeSpent,
      });

      setIsCompleted(true);
      
      // Simuler gain de XP et badges
      const earnedXP = 50; // Points pour complétion de leçon
      setXpGained(earnedXP);
      
      // Vérifier si des badges sont obtenus (à implémenter avec le backend)
      const earnedBadges: any[] = []; // Remplacer par appel API
      setBadgesEarned(earnedBadges);

      setShowCompletionModal(true);
      onComplete?.();

      // Auto-fermer la modal après 5 secondes si pas d'interaction
      setTimeout(() => {
        setShowCompletionModal(false);
      }, 5000);

    } catch (error) {
      console.error('Erreur lors de la complétion de la leçon:', error);
      alert('Erreur lors de la complétion. Veuillez réessayer.');
    } finally {
      setIsCompleting(false);
    }
  };

  const getContentIcon = () => {
    switch (lesson.content_type) {
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'document':
        return <FileText className="h-6 w-6" />;
      case 'audio':
        return <Headphones className="h-6 w-6" />;
      case 'presentation':
        return <Presentation className="h-6 w-6" />;
      default:
        return <BookOpen className="h-6 w-6" />;
    }
  };

  const renderContent = () => {
    switch (lesson.content_type) {
      case 'video':
        return (
          <div className="relative w-full">
            {lesson.video_url ? (
              <iframe
                src={lesson.video_url}
                className="w-full aspect-video rounded-lg"
                allowFullScreen
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <Play className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div
            id="lesson-content-text"
            className="prose max-w-none bg-white rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: lesson.content_text || '' }}
          />
        );

      case 'document':
        return (
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            {lesson.content_url ? (
              <iframe
                src={lesson.content_url}
                className="w-full h-full rounded-lg"
              />
            ) : (
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Document non disponible</p>
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="h-5 w-5 text-purple-600" />
              <p className="font-medium text-gray-900">Quiz Formatif</p>
            </div>
            <QuizComponent
              quizId={lesson.id}
              lessonId={lesson.id}
              onComplete={(attempt) => {
                setQuizCompleted(true);
                if (attempt.is_passed) {
                  // XP déjà gagné via le quiz
                }
              }}
            />
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-500">Type de contenu non supporté : {lesson.content_type}</p>
          </div>
        );
    }
  };

  const canComplete = () => {
    // Pour les quiz formatifs, attendre la complétion du quiz
    if (lesson.content_type === 'quiz' && !quizCompleted) {
      return false;
    }
    
    // Pour les autres types, progression >= 80%
    return progress >= 0.8 || isCompleted;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getContentIcon()}
              <span className="text-sm font-medium text-gray-500 capitalize">
                {lesson.content_type}
              </span>
              {lesson.is_required && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  Obligatoire
                </span>
              )}
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-gray-600">{lesson.description}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {lesson.content_type === 'video' || lesson.content_type === 'text' ? (
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Time Spent */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {lesson.duration_minutes > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{lesson.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Temps écoulé : {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderContent()}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center space-x-2"
          >
            <span>←</span>
            <span>Précédent</span>
          </Button>

          {!isCompleted && (
            <Button
              variant="primary"
              onClick={handleMarkAsCompleted}
              disabled={!canComplete() || isCompleting}
              className="flex items-center space-x-2"
            >
              {isCompleting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>En cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Marquer comme complété</span>
                </>
              )}
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Leçon complétée !</span>
            </div>
          )}

          <Button
            variant="primary"
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center space-x-2"
          >
            <span>Suivant</span>
            <span>→</span>
          </Button>
        </div>
      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="Félicitations ! 🎉"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Leçon complétée avec succès !
            </h3>
            <p className="text-gray-600">
              Vous avez terminé "{lesson.title}"
            </p>
          </div>

          {/* XP Gained */}
          {xpGained > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Points XP gagnés</p>
                  <p className="text-sm text-blue-600">Vous avez gagné {xpGained} points XP !</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">+{xpGained}</span>
            </div>
          )}

          {/* Badges Earned */}
          {badgesEarned.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Award className="h-5 w-5 text-orange-600" />
                <p className="font-medium text-orange-900">Nouveaux badges obtenus !</p>
              </div>
              <div className="space-y-2">
                {badgesEarned.map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCompletionModal(false)}
            >
              Continuer
            </Button>
            {onNext && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowCompletionModal(false);
                  onNext();
                }}
              >
                Leçon suivante →
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

