'use client';

import React from 'react';
import Modal from '../../ui/Modal';
import { CheckCircle, XCircle, GraduationCap, Award, RotateCcw, BookOpen, AlertCircle } from 'lucide-react';

interface QuestionResult {
  question_id: number;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  student_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean;
  points_earned: number;
  points_lost: number;
}

interface EvaluationResult {
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  certificate_eligible?: boolean;
  question_results?: QuestionResult[];
}

interface EvaluationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult;
  evaluation: {
    passing_score: number;
    max_attempts: number;
  };
  attemptsUsed: number;
  onRequestCertificate?: () => void;
  onRetryEvaluation?: () => void;
  onBackToCourse?: () => void;
  requestingCertificate?: boolean;
}

export default function EvaluationResultsModal({
  isOpen,
  onClose,
  result,
  evaluation,
  attemptsUsed,
  onRequestCertificate,
  onRetryEvaluation,
  onBackToCourse,
  requestingCertificate = false,
}: EvaluationResultsModalProps) {
  const hasRemainingAttempts = attemptsUsed < evaluation.max_attempts;
  const allAttemptsUsed = attemptsUsed >= evaluation.max_attempts;

  // Préparer les données du récapitulatif
  const getQuestionResults = () => {
    if (result.question_results && result.question_results.length > 0) {
      const correct = result.question_results
        .filter(q => q.is_correct)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(q => ({
          question: {
            id: q.question_id,
            question_text: q.question_text,
            question: q.question_text,
            question_type: q.question_type,
            points: q.points,
            order_index: q.order_index,
          },
          userAnswer: q.student_answer || 'Non répondue',
          correctAnswer: q.correct_answer || '',
          points: q.points_earned,
        }));

      const incorrect = result.question_results
        .filter(q => !q.is_correct)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(q => ({
          question: {
            id: q.question_id,
            question_text: q.question_text,
            question: q.question_text,
            question_type: q.question_type,
            points: q.points,
            order_index: q.order_index,
          },
          userAnswer: q.student_answer || 'Non répondue',
          correctAnswer: q.correct_answer || '',
          points: q.points_lost,
        }));

      return { correct, incorrect };
    }

    return { correct: [], incorrect: [] };
  };

  const { correct, incorrect } = getQuestionResults();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closable={true}
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* En-tête avec résultat */}
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
              {allAttemptsUsed ? (
                <p className="text-gray-600 mt-2 font-medium">
                  Nombre de tentatives épuisé
                </p>
              ) : (
                <p className="text-gray-600 mt-2">
                  Il vous reste {evaluation.max_attempts - attemptsUsed} tentative(s)
                </p>
              )}
            </>
          )}

          {/* Statistiques */}
          <div className="mt-4 sm:mt-6 space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Score obtenu</p>
                <p className={`text-2xl sm:text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Score minimum</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-700">{evaluation.passing_score}%</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600">Points</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-700">
                  {result.score} / {result.total_points}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Récapitulatif détaillé des questions */}
        {result.question_results && result.question_results.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Récapitulatif des résultats</h3>
              <p className="text-sm text-gray-600 mt-1">
                {correct.length} question(s) validée(s) sur {correct.length + incorrect.length}
              </p>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {/* Questions validées */}
              {correct.length > 0 && (
                <div className="p-4 bg-green-50/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="text-base font-semibold text-green-900">
                      Questions validées ({correct.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {correct.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {item.question.question_text || item.question.question}
                              </p>
                            </div>
                            <div className="ml-8 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">Votre réponse :</span>
                                <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">
                                  {item.userAnswer}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">Points obtenus :</span>
                                <span className="text-xs font-semibold text-green-700">
                                  +{item.points} point{item.points > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions ratées */}
              {incorrect.length > 0 && (
                <div className="p-4 bg-red-50/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h4 className="text-base font-semibold text-red-900">
                      Questions ratées ({incorrect.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {incorrect.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                {correct.length + index + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {item.question.question_text || item.question.question}
                              </p>
                            </div>
                            <div className="ml-8 space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">Votre réponse :</span>
                                <span className="text-xs text-red-700 font-medium bg-red-100 px-2 py-1 rounded">
                                  {item.userAnswer}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">Bonne réponse :</span>
                                <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">
                                  {item.correctAnswer}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">Points perdus :</span>
                                <span className="text-xs font-semibold text-red-700">
                                  {item.points} point{item.points > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Note finale */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Award className="h-8 w-8 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Note finale</h3>
          </div>
          <p className={`text-4xl font-extrabold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
            {result.percentage}%
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {result.score} point{result.score > 1 ? 's' : ''} sur {result.total_points}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {result.passed && result.certificate_eligible && onRequestCertificate && (
            <button
              onClick={onRequestCertificate}
              disabled={requestingCertificate}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Award className="h-5 w-5" />
              <span>{requestingCertificate ? 'Traitement...' : 'Obtenir mon certificat'}</span>
            </button>
          )}

          {!result.passed && hasRemainingAttempts && onRetryEvaluation && (
            <button
              onClick={onRetryEvaluation}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reprendre l'évaluation</span>
            </button>
          )}

          {!result.passed && allAttemptsUsed && onBackToCourse && (
            <>
              <div className="w-full mb-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800 font-medium">
                    Nombre de tentatives épuisé
                  </p>
                </div>
              </div>
              <button
                onClick={onBackToCourse}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md w-full sm:w-auto"
              >
                <BookOpen className="h-5 w-5" />
                <span>Reprendre le cours</span>
              </button>
            </>
          )}

          {result.passed && !result.certificate_eligible && onBackToCourse && (
            <button
              onClick={onBackToCourse}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md"
            >
              <BookOpen className="h-5 w-5" />
              <span>Retour au cours</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

