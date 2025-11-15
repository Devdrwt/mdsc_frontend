'use client';

import React from 'react';
import Modal from './Modal';
import { XCircle, Clock, Award, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface EvaluationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    score: number;
    totalPoints: number;
    percentage: number;
    isPassed: boolean;
    isTimeExpired?: boolean;
    evaluationTitle?: string;
    courseName?: string;
    passingScore?: number;
    isQuiz?: boolean;
  };
}

export default function EvaluationResultModal({
  isOpen,
  onClose,
  result
}: EvaluationResultModalProps) {
  const { score, totalPoints, percentage, isPassed, isTimeExpired, evaluationTitle, courseName, passingScore, isQuiz } = result;
  
  // Déterminer les textes selon le type (quiz ou évaluation)
  const typeLabel = isQuiz ? 'quiz' : 'évaluation';
  const typeLabelCapitalized = isQuiz ? 'Quiz' : 'Évaluation';

  // Déterminer la couleur du backdrop selon le résultat
  const backdropColor = isPassed && !isTimeExpired ? 'green' : 'red';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Résultats du ${typeLabel}`}
      size="lg"
      closable={true}
      backdropColor={backdropColor}
    >
      <div className="py-4">
        {/* Message principal selon le résultat */}
        <div className={`rounded-xl p-6 mb-6 ${
          isTimeExpired 
            ? 'bg-red-50 border-2 border-red-200' 
            : isPassed 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {isTimeExpired ? (
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              ) : isPassed ? (
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              {isTimeExpired ? (
                <>
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    Temps écoulé
                  </h3>
                  <p className="text-red-800 mb-3">
                    Le temps imparti pour cette évaluation est écoulé. Votre évaluation a été soumise automatiquement avec les réponses que vous avez fournies jusqu'à présent.
                  </p>
                </>
              ) : isPassed ? (
                <>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    {typeLabelCapitalized} réussie !
                  </h3>
                  <p className="text-green-800">
                    Félicitations ! Vous avez réussi ce {typeLabel}.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    ❌ {typeLabelCapitalized} échouée
                  </h3>
                  <p className="text-red-800">
                    Malheureusement, vous n'avez pas atteint le score minimum requis pour réussir ce {typeLabel}.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informations sur l'évaluation/quiz */}
        {(evaluationTitle || courseName) && (
          <div className="mb-6">
            {evaluationTitle && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">{typeLabelCapitalized} :</span>
                <p className="text-lg font-semibold text-gray-900">{evaluationTitle}</p>
              </div>
            )}
            {courseName && (
              <div>
                <span className="text-sm font-medium text-gray-500">Formation :</span>
                <p className="text-lg font-semibold text-gray-900">{courseName}</p>
              </div>
            )}
          </div>
        )}

        {/* Score détaillé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Score obtenu</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {score} / {totalPoints}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Pourcentage</span>
            </div>
            <p className={`text-2xl font-bold ${
              isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
              {percentage.toFixed(1)}%
            </p>
          </div>

          {passingScore !== undefined && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Score requis</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {passingScore}%
              </p>
            </div>
          )}
        </div>

        {/* Message d'échec et certification (uniquement pour les évaluations finales) */}
        {(!isPassed || isTimeExpired) && !isQuiz && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-red-900 mb-2">
                  Formation échouée
                </h4>
                <p className="text-red-800 mb-3">
                  Malheureusement, vous ne pouvez pas obtenir de certification pour cette formation car vous n'avez pas réussi l'évaluation finale.
                </p>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>Pour obtenir votre certification :</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
                    <li>Vous devez obtenir un score minimum de {passingScore !== undefined ? `${passingScore}%` : '70%'} à l'évaluation finale</li>
                    <li>Vous pouvez réessayer l'évaluation si vous avez encore des tentatives disponibles</li>
                    <li>Consultez les cours et les ressources pour mieux vous préparer</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {isPassed && !isTimeExpired && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-green-900 mb-2">
                  Félicitations !
                </h4>
                <p className="text-green-800">
                  {isQuiz 
                    ? `Vous avez réussi ce ${typeLabel} ! Continuez ainsi pour progresser dans votre formation.`
                    : `Vous avez réussi l'évaluation finale ! Vous êtes éligible pour obtenir votre certification de formation.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de fermeture */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

