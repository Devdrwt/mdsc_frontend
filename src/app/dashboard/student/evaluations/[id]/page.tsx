'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../../lib/middleware/auth';
import { evaluationService, Evaluation } from '../../../../../lib/services/evaluationService';
import { Clock, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import ConfirmModal from '../../../../../components/ui/ConfirmModal';
import { useNotification } from '../../../../../lib/hooks/useNotification';

export default function EvaluationSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useNotification();
  const evaluationId = params.id as string;
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes en secondes
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const data = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(data);
        
        // Initialiser les réponses vides
        const initialAnswers: Record<string, any> = {};
        // Supposons que l'évaluation a des questions
        // initialAnswers serait initialisé selon la structure de l'évaluation
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'évaluation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [evaluationId]);

  // Timer pour le temps restant
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (timeRemaining <= 0) {
      showError('Temps écoulé', 'Le temps imparti est écoulé.');
      return;
    }

    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      await evaluationService.submitEvaluation(evaluationId, answers);
      showSuccess('Évaluation soumise', 'Votre évaluation a été soumise avec succès');
      router.push(`/dashboard/student/evaluations/${evaluationId}/results`);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      showError('Erreur de soumission', 'Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await evaluationService.saveDraft(evaluationId, answers);
      showSuccess('Brouillon sauvegardé', 'Votre brouillon a été sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du brouillon:', error);
      showError('Erreur', 'Erreur lors de la sauvegarde du brouillon.');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="student">
        <DashboardLayout userRole="student">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de l'évaluation...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!evaluation) {
    return (
      <AuthGuard requiredRole="student">
        <DashboardLayout userRole="student">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Évaluation introuvable</h3>
            <p className="text-gray-500">Cette évaluation n'existe pas ou vous n'y avez pas accès.</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{evaluation.title}</h1>
                <p className="text-white/90">{evaluation.description}</p>
              </div>
            </div>
            
            {/* Timer */}
            <div className="mt-4 flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-500' : timeRemaining < 600 ? 'bg-yellow-500' : 'bg-white/20'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>
              {timeRemaining < 300 && (
                <div className="flex items-center space-x-2 text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  <span>Attention ! Temps restant limité</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire d'évaluation */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Ici, il faudrait afficher les questions dynamiquement selon le type d'évaluation */}
            {/* Pour l'instant, on crée un formulaire générique */}
            <div className="space-y-6">
              <div className="text-gray-600">
                <p className="mb-4">
                  Cette évaluation est un {evaluation.type} d'une durée de {evaluation.maxScore} points.
                </p>
                <p className="text-sm text-gray-500">
                  ⚠️ Attention: Une fois soumise, vous ne pourrez plus modifier vos réponses.
                </p>
              </div>

              {/* Zone de réponses - À adapter selon le type d'évaluation */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réponse
                  </label>
                  <textarea
                    value={answers['response'] || ''}
                    onChange={(e) => handleAnswerChange('response', e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
                    placeholder="Saisissez votre réponse ici..."
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Sauvegarder le brouillon</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={submitting || timeRemaining <= 0}
                className="flex items-center space-x-2 px-6 py-2 bg-mdsc-blue-primary text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Soumission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Soumettre l'évaluation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Modal de confirmation de soumission */}
          <ConfirmModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            onConfirm={handleSubmit}
            title="Confirmer la soumission"
            message="Êtes-vous sûr de vouloir soumettre cette évaluation ? Vous ne pourrez plus la modifier."
            confirmText="Soumettre"
            cancelText="Annuler"
            confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            isLoading={submitting}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
