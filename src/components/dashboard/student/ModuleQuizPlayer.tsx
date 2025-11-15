'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, AlertCircle, Loader, Trophy, ChevronRight } from 'lucide-react';
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
  max_attempts?: number;
  duration_minutes?: number;
  questions: QuizQuestion[];
}

interface QuizAttemptInfo {
  previous_attempts?: any[];
  can_attempt?: boolean;
  remaining_attempts?: number;
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
  const [showResultModal, setShowResultModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [attemptInfo, setAttemptInfo] = useState<QuizAttemptInfo | null>(null);

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
      let attemptInfoData: QuizAttemptInfo | null = null;
      
      if (enrollmentId) {
        const quiz = await quizService.getModuleQuizForStudent(enrollmentId, moduleId);
        if (!quiz) {
          throw new Error('Quiz non trouvé');
        }
        // S'assurer que l'ID est défini
        quizData = { ...quiz, id: quiz.id || quizId } as ModuleQuiz;
        // Extraire les informations sur les tentatives
        attemptInfoData = {
          previous_attempts: (quiz as any).previous_attempts || [],
          can_attempt: (quiz as any).can_attempt !== false,
          remaining_attempts: (quiz as any).remaining_attempts || (quizData.max_attempts ? Math.max(0, quizData.max_attempts - ((quiz as any).previous_attempts?.length || 0)) : undefined)
        };
      } else {
        const quiz = await quizService.getQuizForStudent(quizId);
        // S'assurer que l'ID est défini
        quizData = { ...quiz, id: quiz.id || quizId } as ModuleQuiz;
      }
      setQuiz(quizData);
      setAttemptInfo(attemptInfoData);
      
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

  // Calculer sortedQuestions une seule fois pour éviter la duplication
  const sortedQuestions = quiz?.questions?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) || [];
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const hasCurrentAnswer = currentQuestion ? (answers[currentQuestion?.id || ''] && answers[currentQuestion?.id || ''].trim() !== '') : false;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (!quiz || !quiz.questions) return;
    
    if (!currentQuestion) return;
    
    if (!hasCurrentAnswer) {
      toast.warning('Réponse requise', 'Veuillez répondre à cette question avant de continuer');
      return;
    }
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
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

    // Vérifier que la question actuelle est répondue
    if (currentQuestion && !hasCurrentAnswer) {
      toast.warning('Réponse requise', 'Veuillez répondre à cette question avant de soumettre');
      return;
    }

    // Vérifier que toutes les questions sont répondues
    const unanswered = (quiz.questions || []).filter((q) => {
      const answer = answers[q.id || ''];
      return !answer || answer.trim() === '';
    });
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
      // Logs de débogage pour voir ce qui est envoyé
      console.log('📤 [Quiz Submission] Données envoyées:', {
        enrollmentId,
        moduleId,
        quizId,
        answersCount: Object.keys(answers).length,
        answers: answers,
        quizQuestions: quiz.questions?.map(q => ({ id: q.id, type: q.question_type }))
      });

      let submissionResult: QuizResult;
      
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      if (enrollmentId) {
        console.log('📤 [Quiz Submission] Utilisation de submitModuleQuizAttempt');
        submissionResult = await quizService.submitModuleQuizAttempt(enrollmentId, moduleId, answers);
      } else {
        console.log('📤 [Quiz Submission] Utilisation de submitQuiz (fallback)');
        // Fallback vers l'endpoint générique
        submissionResult = await quizService.submitQuiz({
          quiz_id: quizId,
          answers,
        });
      }

      console.log('✅ [Quiz Submission] Résultat reçu:', submissionResult);

      setResult(submissionResult);
      setShowResultModal(true); // Afficher le modal de résultat au lieu de showResults
      // Ne pas appeler onComplete immédiatement, attendre que l'utilisateur choisisse une action
    } catch (error: any) {
      console.error('❌ [Quiz Submission] Erreur complète:', {
        error,
        message: error?.message,
        status: error?.status,
        details: error?.details,
        stack: error?.stack
      });
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Impossible de soumettre le quiz';
      if (error?.message) {
        errorMessage = error.message;
        // Vérifier si c'est un message sur les tentatives
        if (error.message.toLowerCase().includes('tentative') || error.message.toLowerCase().includes('attempt')) {
          errorMessage = `Nombre maximum de tentatives atteint. ${error.message}`;
        }
      } else if (error?.status === 404) {
        errorMessage = 'Quiz non trouvé. Veuillez rafraîchir la page.';
      } else if (error?.status === 400) {
        // Vérifier le message dans les détails
        const detailsMessage = error?.details?.message || error?.message || '';
        if (detailsMessage.toLowerCase().includes('tentative') || detailsMessage.toLowerCase().includes('attempt')) {
          errorMessage = 'Nombre maximum de tentatives atteint. Contactez un administrateur pour réinitialiser.';
        } else {
          errorMessage = detailsMessage || 'Données invalides. Veuillez vérifier vos réponses.';
        }
      } else if (error?.status === 403) {
        errorMessage = 'Vous n\'êtes pas autorisé à soumettre ce quiz.';
      } else if (error?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
      
      toast.error('Erreur de soumission', errorMessage);
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

  // Vérifier que le quiz a des questions
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Ce quiz n'a pas encore de questions</p>
      </div>
    );
  }

  const handleContinue = () => {
    setShowResultModal(false);
    setShowResults(true);
    onComplete?.(result!);
  };

  const handleRetry = () => {
    setShowResultModal(false);
    setResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    // Recharger le quiz pour mettre à jour les tentatives
    loadQuiz();
  };

  // Calculer la progression
  const progress = sortedQuestions.length > 0 ? ((currentQuestionIndex + 1) / sortedQuestions.length) * 100 : 0;

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Question non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informations sur les tentatives */}
      {attemptInfo && quiz.max_attempts && (
        <div className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Tentatives :</span> {attemptInfo.remaining_attempts !== undefined ? attemptInfo.remaining_attempts : quiz.max_attempts} sur {quiz.max_attempts} restante(s)
              </p>
            </div>
            {attemptInfo.can_attempt === false && (
              <span className="text-xs text-red-600">
                Nombre maximum de tentatives atteint
              </span>
            )}
          </div>
        </div>
      )}

      {/* En-tête avec timer */}
      <div className="bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-gray-600">{quiz.description}</p>
            )}
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 bg-gray-100">
              <Clock className="h-5 w-5 text-gray-700" />
              <span className="font-mono text-lg font-bold text-gray-900">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2 text-gray-600">
            <span>Question {currentQuestionIndex + 1} sur {sortedQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200">
            <div
              className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question actuelle */}
      <div className="bg-white">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
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
                      ? 'border-mdsc-blue-primary bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id || ''] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
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
                      ? 'border-mdsc-blue-primary bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.toLowerCase()}
                    checked={answers[currentQuestion.id || ''] === option.toLowerCase()}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
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
              className="w-full px-4 py-3 border border-gray-300"
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
          {sortedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full ${
                idx === currentQuestionIndex
                  ? 'bg-mdsc-blue-primary w-8'
                  : answers[q.id || '']
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={q.question_text.substring(0, 50)}
            />
          ))}
        </div>

        {currentQuestionIndex < sortedQuestions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!hasCurrentAnswer}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              hasCurrentAnswer
                ? 'bg-mdsc-blue-primary text-white hover:bg-mdsc-blue-dark cursor-pointer'
                : 'bg-gray-300'
            }`}
          >
            <span>Suivant</span>
            {!hasCurrentAnswer && (
              <span className="text-xs">(Réponse requise)</span>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
            disabled={submitting || !hasCurrentAnswer}
            className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
              hasCurrentAnswer && !submitting
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Soumission...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>{hasCurrentAnswer ? 'Soumettre le quiz' : 'Répondez à cette question pour soumettre'}</span>
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

      {/* Modal de résultat du quiz */}
      {showResultModal && result && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 ${
          result.passed ? 'bg-green-900/40' : 'bg-red-900/40'
        }`}>
          <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center ${
            result.passed ? 'border-2 border-green-500' : 'border-2 border-red-500'
          }`}>
            {result.passed ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">Félicitations !</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quiz réussi !</h3>
                {result.badge_earned && (
                  <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-yellow-50 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <p className="text-lg font-semibold text-yellow-800">
                      Badge obtenu : {result.badge_name || 'Badge du module'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-red-100 p-4">
                    <XCircle className="h-16 w-16 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Quiz non réussi</h2>
                <p className="text-gray-600 mb-4">
                  Vous devez obtenir au moins {quiz.passing_score}% pour réussir
                </p>
              </>
            )}

            <div className="mt-6 mb-6 space-y-3">
              <div className="flex items-center justify-center space-x-4 bg-gray-50 p-4 rounded-lg">
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!result.passed && attemptInfo && attemptInfo.remaining_attempts !== undefined && attemptInfo.remaining_attempts > 0 && (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Trophy className="h-5 w-5" />
                  <span>Réessayer ({attemptInfo.remaining_attempts} tentative{attemptInfo.remaining_attempts > 1 ? 's' : ''} restante{attemptInfo.remaining_attempts > 1 ? 's' : ''})</span>
                </button>
              )}
              <button
                onClick={handleContinue}
                className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                  result.passed
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
                <span>{result.passed ? 'Continuer la formation' : 'Retour aux leçons'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des résultats détaillés après fermeture du modal */}
      {showResults && result && (
        <div className="space-y-6">
          <div className={`rounded-lg p-6 text-center border-2 ${
            result.passed
              ? 'bg-green-50'
              : 'bg-red-50'
          }`}>
            {result.passed ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-600" />
                <h2 className="text-2xl font-bold text-green-900">Quiz réussi !</h2>
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
                <XCircle className="h-16 w-16 text-red-600" />
                <h2 className="text-2xl font-bold text-red-900">Quiz non réussi</h2>
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
                className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                <span>Retour aux leçons</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

