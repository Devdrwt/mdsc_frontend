'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, AlertCircle, Loader, FileText, GraduationCap } from 'lucide-react';
import { evaluationService } from '../../../lib/services/evaluationService';
import toast from '../../../lib/utils/toast';
import ConfirmModal from '../../ui/ConfirmModal';

interface EvaluationQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface FinalEvaluation {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  max_attempts: number;
  questions: EvaluationQuestion[];
}

interface EvaluationResult {
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  certificate_eligible?: boolean;
}

interface CourseEvaluationPlayerProps {
  evaluationId: string;
  courseId: string;
  enrollmentId?: number; // Optionnel, pour utiliser l'endpoint spécifique
  onComplete?: (result: EvaluationResult) => void;
  onCancel?: () => void;
}

export default function CourseEvaluationPlayer({
  evaluationId,
  courseId,
  enrollmentId,
  onComplete,
  onCancel,
}: CourseEvaluationPlayerProps) {
  const [evaluation, setEvaluation] = useState<FinalEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    loadEvaluation();
  }, [evaluationId]);

  useEffect(() => {
    if (evaluation?.duration_minutes && timeRemaining !== null && timeRemaining > 0) {
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
  }, [evaluation, timeRemaining]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      let evalData: FinalEvaluation | null = null;
      if (enrollmentId) {
        evalData = await evaluationService.getEvaluationForStudent(enrollmentId);
      } else {
        // Fallback vers l'endpoint pour instructeur
        evalData = await evaluationService.getCourseEvaluation(courseId);
      }
      
      if (!evalData) {
        toast.error('Erreur', 'Évaluation non trouvée');
        return;
      }
      setEvaluation(evalData);
      
      // Initialiser le timer si durée limitée
      if (evalData.duration_minutes) {
        setTimeRemaining(evalData.duration_minutes * 60);
      }

      // TODO: Charger le nombre de tentatives utilisées depuis l'API
      // const attempts = await evaluationService.getAttemptsCount(evaluationId);
      // setAttemptsUsed(attempts);
    } catch (error: any) {
      console.error('Erreur lors du chargement de l\'évaluation:', error);
      toast.error('Erreur', error.message || 'Impossible de charger l\'évaluation');
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
    if (evaluation && currentQuestionIndex < evaluation.questions.length - 1) {
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
    if (!evaluation) return;

    // Vérifier le nombre de tentatives
    if (attemptsUsed >= evaluation.max_attempts) {
      toast.error('Tentatives épuisées', `Vous avez utilisé toutes vos ${evaluation.max_attempts} tentative(s)`);
      return;
    }

    // Vérifier que toutes les questions sont répondues
    const unanswered = evaluation.questions.filter((q) => !answers[q.id || '']);
    if (unanswered.length > 0) {
      setUnansweredCount(unanswered.length);
      setShowSubmitModal(true);
      return;
    }

    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!evaluation) return;

    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      let submissionResult: EvaluationResult;
      
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      if (enrollmentId) {
        const result = await evaluationService.submitEvaluationAttempt(enrollmentId, answers);
        submissionResult = {
          score: result.score,
          total_points: result.total_points,
          percentage: result.percentage,
          passed: result.passed,
          certificate_eligible: result.certificate_eligible,
        };
      } else {
        // Fallback : calcul côté client (temporaire)
        const totalPoints = evaluation.questions.reduce((sum, q) => sum + q.points, 0);
        const score = evaluation.questions.reduce((sum, q) => {
          const answer = answers[q.id || ''];
          if (answer && answer.toLowerCase() === q.correct_answer.toLowerCase()) {
            return sum + q.points;
          }
          return sum;
        }, 0);
        const percentage = (score / totalPoints) * 100;
        const passed = percentage >= evaluation.passing_score;

        submissionResult = {
          score,
          total_points: totalPoints,
          percentage: Math.round(percentage),
          passed,
          certificate_eligible: passed,
        };
      }

      setResult(submissionResult);
      setShowResults(true);
      setAttemptsUsed(prev => prev + 1);
      onComplete?.(submissionResult);

      if (submissionResult.passed) {
        toast.success(
          'Félicitations !',
          `Vous avez réussi l'évaluation finale ! Vous êtes maintenant éligible pour obtenir un certificat.`
        );
      } else {
        toast.warning(
          'Évaluation non réussie',
          `Vous avez obtenu ${submissionResult.percentage}%. Le score minimum requis est ${evaluation.passing_score}%`
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission de l\'évaluation:', error);
      toast.error('Erreur', error.message || 'Impossible de soumettre l\'évaluation');
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
        <Loader className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Évaluation non trouvée</p>
      </div>
    );
  }

  if (attemptsUsed >= evaluation.max_attempts) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-900 mb-2">Tentatives épuisées</h2>
        <p className="text-gray-600 mb-4">
          Vous avez utilisé toutes vos {evaluation.max_attempts} tentative(s) pour cette évaluation.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour
          </button>
        )}
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
              <GraduationCap className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Évaluation réussie !</h2>
              {result.certificate_eligible && (
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
                Il vous reste {evaluation.max_attempts - attemptsUsed} tentative(s)
              </p>
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
                <p className="text-2xl font-semibold text-gray-700">{evaluation.passing_score}%</p>
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
          {result.passed && result.certificate_eligible && (
            <button
              onClick={() => {
                // Rediriger vers la demande de certificat
                window.location.href = `/dashboard/student/certificates?courseId=${courseId}`;
              }}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <Award className="h-5 w-5" />
              <span>Demander le certificat</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = evaluation.questions.sort((a, b) => a.order_index - b.order_index)[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / evaluation.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* En-tête avec timer */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{evaluation.title}</h2>
            {evaluation.description && (
              <p className="text-blue-100 text-sm">{evaluation.description}</p>
            )}
            <p className="text-blue-100 text-xs mt-2">
              ⚠️ Évaluation finale - {evaluation.max_attempts - attemptsUsed} tentative(s) restante(s)
            </p>
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
            <span>Question {currentQuestionIndex + 1} sur {evaluation.questions.length}</span>
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
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id || ''] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
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
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.toLowerCase()}
                    checked={answers[currentQuestion.id || ''] === option.toLowerCase()}
                    onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          {evaluation.questions.map((q, idx) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full ${
                idx === currentQuestionIndex
                  ? 'bg-blue-600 w-8'
                  : answers[q.id || '']
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={q.question_text.substring(0, 50)}
            />
          ))}
        </div>

        {currentQuestionIndex < evaluation.questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <FileText className="h-5 w-5" />
                <span>Soumettre l'évaluation</span>
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

