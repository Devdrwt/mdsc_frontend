'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, AlertCircle, Loader, Trophy } from 'lucide-react';
import { quizService, QuizResult } from '../../../lib/services/quizService';
import toast from '../../../lib/utils/toast';
import ConfirmModal from '../../ui/ConfirmModal';

interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface ModuleQuiz {
  id: string;
  module_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  questions: QuizQuestion[];
}

interface ModuleQuizPlayerProps {
  quizId: string;
  moduleId: string;
  enrollmentId?: number; // Optionnel, pour utiliser l'endpoint spécifique
  onComplete?: (result: QuizResult) => void;
  onCancel?: () => void;
}

export default function ModuleQuizPlayer({
  quizId,
  moduleId,
  enrollmentId,
  onComplete,
  onCancel,
}: ModuleQuizPlayerProps) {
  const [quiz, setQuiz] = useState<ModuleQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.duration_minutes && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeRemaining]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      let quizData: ModuleQuiz;
      if (enrollmentId) {
        const quiz = await quizService.getModuleQuizForStudent(enrollmentId, moduleId);
        if (!quiz) {
          throw new Error('Quiz non trouvé');
        }
        quizData = quiz;
      } else {
        quizData = await quizService.getQuizForStudent(quizId);
      }
      setQuiz(quizData);
      
      // Initialiser le timer si durée limitée
      if (quizData.duration_minutes) {
        setTimeRemaining(quizData.duration_minutes * 60);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du quiz:', error);
      toast.error('Erreur', error.message || 'Impossible de charger le quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || result) return;
    // Pour l'auto-submit, on soumet directement sans confirmation
    await handleSubmit();
  };

  const handleSubmitClick = () => {
    if (!quiz) return;

    // Vérifier que toutes les questions sont répondues
    const unanswered = quiz.questions.filter((q) => !answers[q.id || '']);
    if (unanswered.length > 0) {
      setUnansweredCount(unanswered.length);
      setShowSubmitModal(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      // Récupérer l'enrollmentId depuis le contexte ou les props
      // Pour l'instant, on utilise l'endpoint générique
      // TODO: Passer enrollmentId en prop ou le récupérer depuis le contexte
      let submissionResult: QuizResult;
      
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      if (enrollmentId) {
        submissionResult = await quizService.submitModuleQuizAttempt(enrollmentId, moduleId, answers);
      } else {
        // Fallback vers l'endpoint générique
        submissionResult = await quizService.submitQuiz({
          quiz_id: quizId,
          answers,
        });
      }

      setResult(submissionResult);
      setShowResults(true);
      onComplete?.(submissionResult);

      if (submissionResult.passed && submissionResult.badge_earned) {
        toast.success(
          'Félicitations !',
          `Vous avez réussi le quiz et obtenu le badge "${submissionResult.badge_name || 'Badge du module'}" !`
        );
      } else if (submissionResult.passed) {
        toast.success('Quiz réussi !', `Vous avez obtenu ${submissionResult.percentage}%`);
      } else {
        toast.warning(
          'Quiz non réussi',
          `Vous avez obtenu ${submissionResult.percentage}%. Le score minimum requis est ${quiz.passing_score}%`
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission du quiz:', error);
      toast.error('Erreur', error.message || 'Impossible de soumettre le quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Quiz non trouvé</p>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="space-y-6">
        <div className={`rounded-lg p-6 text-center ${
          result.passed
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200'
        }`}>
          {result.passed ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Quiz réussi !</h2>
              {result.badge_earned && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <p className="text-lg font-semibold text-yellow-800">
                    Badge obtenu : {result.badge_name || 'Badge du module'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Quiz non réussi</h2>
            </>
          )}

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center space-x-4">
              <div>
                <p className="text-sm text-gray-600">Score obtenu</p>
                <p className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-600">Score minimum</p>
                <p className="text-2xl font-semibold text-gray-700">{quiz.passing_score}%</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {result.score} / {result.total_points}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions.sort((a, b) => a.order_index - b.order_index)[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* En-tête avec timer */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-purple-100 text-sm">{quiz.description}</p>
            )}
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Question {currentQuestionIndex + 1} sur {quiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question actuelle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentQuestion.question_text}
          </h3>
          <p className="text-sm text-gray-500">
            {currentQuestion.points} point(s) • {currentQuestion.question_type === 'multiple_choice' ? 'QCM' : 
             currentQuestion.question_type === 'true_false' ? 'Vrai/Faux' : 'Réponse courte'}
          </p>
        </div>

        {/* Réponses */}
        <div className="space-y-3">
          {currentQuestion.question_type === 'multiple_choice' && (
            <>
              {currentQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.id || ''] === option
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id || ''] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <>
              {['Vrai', 'Faux'].map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.id || ''] === option.toLowerCase()
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.toLowerCase()}
                    checked={answers[currentQuestion.id || ''] === option.toLowerCase()}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <textarea
              value={answers[currentQuestion.id || ''] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Votre réponse..."
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>

        <div className="flex items-center space-x-2">
          {quiz.questions.map((q, idx) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full ${
                idx === currentQuestionIndex
                  ? 'bg-purple-600 w-8'
                  : answers[q.id || '']
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={q.question_text.substring(0, 50)}
            />
          ))}
        </div>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Soumission...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Soumettre le quiz</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal de confirmation de soumission */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        title="Confirmer la soumission"
        message={`Vous avez ${unansweredCount} question(s) sans réponse. Voulez-vous quand même soumettre ?`}
        confirmText="Soumettre"
        cancelText="Annuler"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
        isLoading={submitting}
      />
    </div>
  );
}

