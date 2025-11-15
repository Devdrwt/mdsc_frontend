'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../../lib/middleware/auth';
import { evaluationService, Evaluation } from '../../../../../lib/services/evaluationService';
import { Clock, Send, AlertCircle, CheckCircle, Info, Timer, FileQuestion, Target, Award, AlertTriangle } from 'lucide-react';
import ConfirmModal from '../../../../../components/ui/ConfirmModal';
import EvaluationResultModal from '../../../../../components/ui/EvaluationResultModal';
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Flag pour éviter les soumissions multiples
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const isStartingAttempt = useRef(false);
  const answersRef = useRef<Record<string, any>>({});
  const evaluationRef = useRef<Evaluation | null>(null);
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  
  // Mettre à jour les refs quand les fonctions changent
  useEffect(() => {
    showErrorRef.current = showError;
    showSuccessRef.current = showSuccess;
  }, [showError, showSuccess]);
  
  // Mettre à jour la ref de l'évaluation
  useEffect(() => {
    evaluationRef.current = evaluation;
  }, [evaluation]);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const data = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(data);
        
        // Initialiser les réponses vides
        const initialAnswers: Record<string, any> = {};
        
        // Si c'est une évaluation finale avec des questions, initialiser les réponses
        if ((data as any).questions && Array.isArray((data as any).questions)) {
          (data as any).questions.forEach((question: any) => {
            const questionId = String(question.id);
            if (question.question_type === 'multiple_choice') {
              initialAnswers[questionId] = '';
            } else if (question.question_type === 'true_false') {
              initialAnswers[questionId] = null;
            } else if (question.question_type === 'short_answer') {
              initialAnswers[questionId] = '';
            }
          });
        }
        
        setAnswers(initialAnswers);
        answersRef.current = initialAnswers;
        
        // Si c'est une évaluation finale, vérifier s'il y a déjà une tentative en cours
        // mais ne pas démarrer automatiquement - on attendra la première réponse
        if ((data as any).is_final && (data as any).duration_minutes) {
          try {
            // Vérifier s'il y a déjà une tentative en cours (incomplète) - SANS EN CRÉER UNE NOUVELLE
            const attemptData = await evaluationService.checkEvaluationAttempt(evaluationId);
            // Si une tentative existe déjà, récupérer son startedAt pour continuer le timer
            if (attemptData && attemptData.exists && attemptData.startedAt) {
              setAttemptId(attemptData.attemptId!);
              const startedAt = new Date(attemptData.startedAt);
              setStartTime(startedAt);
              setHasStarted(true);
              
              // Calculer le temps restant en fonction du temps écoulé
              const durationSeconds = attemptData.durationMinutes * 60;
              const now = new Date();
              const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
              const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
              
              setTimeRemaining(remainingSeconds);
            } else {
              // Pas de tentative en cours, on attendra la première réponse
              setHasStarted(false);
              setTimeRemaining(null);
            }
          } catch (error: any) {
            console.error('Erreur lors de la vérification de la tentative:', error);
            // En cas d'erreur, on attendra quand même la première réponse
            setHasStarted(false);
            setTimeRemaining(null);
          }
        } else if ((data as any).duration_minutes) {
          // Pour les évaluations classiques, initialiser le timer sans créer de tentative
          setTimeRemaining((data as any).duration_minutes * 60);
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'évaluation:', error);
        showErrorRef.current('Erreur', error.message || 'Impossible de charger l\'évaluation');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [evaluationId]);

  // Fonction de soumission (mémorisée)
  const handleAutoSubmit = useCallback(async () => {
    // Éviter les soumissions multiples
    if (submitting || isSubmitted) return;
    
    setSubmitting(true);
    setIsSubmitted(true); // Marquer comme soumis pour éviter les appels répétés
    setIsTimeExpired(true); // Marquer que c'est une soumission automatique (temps écoulé)
    
    try {
      const result = await evaluationService.submitEvaluation(evaluationId, answersRef.current);
      const resultData = (result as any)?.data || result;
      
      // Préparer les données pour le modal de résultats
      const currentEval = evaluationRef.current as any;
      const percentage = typeof resultData.percentage === 'number' 
        ? resultData.percentage 
        : parseFloat(resultData.percentage) || 0;
      const modalResult = {
        score: resultData.score || resultData.earnedPoints || 0,
        totalPoints: resultData.totalPoints || resultData.total_points || 100,
        percentage: percentage,
        isPassed: resultData.isPassed || resultData.is_passed || false,
        isTimeExpired: true,
        evaluationTitle: currentEval?.title || 'Évaluation',
        courseName: currentEval?.courseName || currentEval?.course_name || '',
        passingScore: currentEval?.passing_score || 70
      };
      
      setEvaluationResult(modalResult);
      setShowResultModal(true);
      
      // Ne pas afficher de toast - le popup gère déjà l'affichage
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      const errorMessage = error.message || 'Erreur lors de la soumission.';
      
      // Si c'est une erreur de tentatives max, ne pas permettre de réessayer
      if (errorMessage.includes('maximum de tentatives') || errorMessage.includes('tentatives atteint')) {
        showErrorRef.current('Tentatives épuisées', 'Vous avez atteint le nombre maximum de tentatives pour cette évaluation.');
        // Rediriger vers la liste des évaluations après un délai
        setTimeout(() => {
          router.push('/dashboard/student/evaluations');
        }, 2000);
      } else {
        showErrorRef.current('Erreur de soumission', errorMessage);
        // En cas d'erreur autre que tentatives max, permettre de réessayer
        setSubmitting(false);
        setIsSubmitted(false);
        setIsTimeExpired(false);
      }
    }
  }, [evaluationId, submitting, isSubmitted, router]);

  // Timer pour le temps restant - calculé à partir du startTime réel
  useEffect(() => {
    // Arrêter le timer si déjà soumis ou si les conditions ne sont pas remplies
    if (timeRemaining === null || !hasStarted || !startTime || isSubmitted) return;

    const durationMinutes = (evaluation as any)?.duration_minutes;
    if (!durationMinutes) return;

    const durationSeconds = durationMinutes * 60;
    let hasCalledSubmit = false; // Flag local pour éviter les appels multiples

    const updateTimer = () => {
      // Arrêter si déjà soumis
      if (isSubmitted || hasCalledSubmit) return;
      
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
      
      setTimeRemaining(remainingSeconds);
      
      // Si le temps est écoulé, soumettre automatiquement (une seule fois)
      if (remainingSeconds <= 0 && !hasCalledSubmit) {
        hasCalledSubmit = true;
        handleAutoSubmit();
      }
    };

    // Mettre à jour immédiatement
    updateTimer();

    // Puis mettre à jour toutes les secondes
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, startTime, evaluation, handleAutoSubmit, isSubmitted]);

  const startAttemptIfNeeded = useCallback(async () => {
    // Ne démarrer que si ce n'est pas déjà démarré et qu'on n'est pas en train de démarrer
    if (hasStarted || isStartingAttempt.current) return;
    
    const currentEvaluation = evaluationRef.current;
    if ((currentEvaluation as any)?.is_final && (currentEvaluation as any)?.duration_minutes) {
      isStartingAttempt.current = true;
      try {
        // Démarrer la tentative (créera une nouvelle tentative ou récupérera l'existante)
        const attemptData = await evaluationService.startEvaluationAttempt(evaluationId);
        setAttemptId(attemptData.attemptId);
        const startedAt = new Date(attemptData.startedAt);
        setStartTime(startedAt);
        setHasStarted(true);
        
        // Calculer le temps restant en fonction du temps écoulé
        const durationSeconds = attemptData.durationMinutes * 60;
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
        
        setTimeRemaining(remainingSeconds);
      } catch (error: any) {
        console.error('Erreur lors du démarrage:', error);
        showErrorRef.current('Erreur', 'Impossible de démarrer la minuterie');
        isStartingAttempt.current = false;
      }
    }
  }, [hasStarted, evaluationId]);

  const handleAnswerChange = useCallback((questionId: string | number, value: any) => {
    // S'assurer que l'ID est une string
    const questionIdStr = String(questionId);
    
    // Démarrer l'évaluation si ce n'est pas déjà fait
    if (!hasStarted) {
      startAttemptIfNeeded();
    }
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionIdStr]: value
      };
      answersRef.current = newAnswers;
      return newAnswers;
    });
  }, [hasStarted, startAttemptIfNeeded]);

  const handleSubmitClick = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (timeRemaining !== null && timeRemaining <= 0) {
      showErrorRef.current('Temps écoulé', 'Le temps imparti est écoulé.');
      return;
    }

    setShowSubmitModal(true);
  }, [timeRemaining]);

  const handleSubmit = useCallback(async () => {
    // Éviter les soumissions multiples
    if (submitting || isSubmitted) return;
    
    setSubmitting(true);
    setIsSubmitted(true); // Marquer comme soumis
    setShowSubmitModal(false);
    setIsTimeExpired(false); // Soumission manuelle, pas de temps écoulé
    try {
      const result = await evaluationService.submitEvaluation(evaluationId, answersRef.current);
      const resultData = (result as any)?.data || result;
      
      // Préparer les données pour le modal de résultats
      const currentEval = evaluationRef.current as any;
      const percentage = typeof resultData.percentage === 'number' 
        ? resultData.percentage 
        : parseFloat(resultData.percentage) || 0;
      const modalResult = {
        score: resultData.score || resultData.earnedPoints || 0,
        totalPoints: resultData.totalPoints || resultData.total_points || 100,
        percentage: percentage,
        isPassed: resultData.isPassed || resultData.is_passed || false,
        isTimeExpired: false,
        evaluationTitle: currentEval?.title || 'Évaluation',
        courseName: currentEval?.courseName || currentEval?.course_name || '',
        passingScore: currentEval?.passing_score || 70
      };
      
      setEvaluationResult(modalResult);
      setShowResultModal(true);
      
      // Ne pas afficher de toast - le popup gère déjà l'affichage
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      const errorMessage = error.message || 'Erreur lors de la soumission. Veuillez réessayer.';
      
      // Si c'est une erreur de tentatives max, ne pas permettre de réessayer
      if (errorMessage.includes('maximum de tentatives') || errorMessage.includes('tentatives atteint')) {
        showErrorRef.current('Tentatives épuisées', 'Vous avez atteint le nombre maximum de tentatives pour cette évaluation.');
        // Rediriger vers la liste des évaluations après un délai
        setTimeout(() => {
          router.push('/dashboard/student/evaluations');
        }, 2000);
      } else {
        showErrorRef.current('Erreur de soumission', errorMessage);
        // En cas d'erreur autre que tentatives max, permettre de réessayer
        setSubmitting(false);
        setIsSubmitted(false);
      }
    }
  }, [evaluationId, submitting, isSubmitted, router]);


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
            {timeRemaining !== null && (
              <div className="mt-4 flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  timeRemaining < 300 ? 'bg-red-500' : timeRemaining < 600 ? 'bg-yellow-500' : 'bg-white/20'
                }`}>
                  <Clock className="h-5 w-5" />
                  <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
                </div>
                {timeRemaining < 300 && timeRemaining > 0 && (
                  <div className="flex items-center space-x-2 text-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <span>Attention ! Temps restant limité</span>
                  </div>
                )}
                {timeRemaining <= 0 && (
                  <div className="flex items-center space-x-2 text-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <span>Temps écoulé ! Soumission automatique...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulaire d'évaluation */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Informations sur l'évaluation */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations sur l'évaluation</h3>
                </div>
                
                {(evaluation as any).is_final ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                      <FileQuestion className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Questions</p>
                        <p className="text-sm font-semibold text-gray-900">{(evaluation as any).questions?.length || 0} questions techniques</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                      <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Score maximum</p>
                        <p className="text-sm font-semibold text-gray-900">{evaluation.maxScore || 100} points</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Score minimum</p>
                        <p className="text-sm font-semibold text-blue-700">{(evaluation as any).passing_score || 70}% pour réussir</p>
                      </div>
                    </div>
                    
                    {(evaluation as any).duration_minutes && (
                      <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Durée</p>
                          <p className="text-sm font-semibold text-gray-900">{(evaluation as any).duration_minutes} minutes</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="font-medium">Type :</span>
                      <span>{evaluation.type}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="font-medium">Score maximum :</span>
                      <span>{evaluation.maxScore || 100} points</span>
                    </div>
                  </div>
                )}
                
                {/* Section Minuterie */}
                {(evaluation as any).duration_minutes && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${hasStarted ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Timer className={`h-5 w-5 ${hasStarted ? 'text-green-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Minuterie</p>
                        <p className="text-sm text-gray-600 mb-2">
                          La minuterie démarre automatiquement dès que vous commencez l'évaluation (lors de la première sélection de réponse).
                        </p>
                        {!hasStarted && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            <Info className="h-4 w-4" />
                            <span>La minuterie n'a pas encore démarré. Elle commencera dès que vous sélectionnerez votre première réponse.</span>
                          </div>
                        )}
                        {hasStarted && timeRemaining !== null && (
                          <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            <span>La minuterie est active. Temps restant : <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Avertissement */}
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">Important</p>
                      <p className="text-sm text-red-700">
                        Une fois soumise, vous ne pourrez plus modifier vos réponses. Cette évaluation ne peut être soumise qu'une seule fois.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Afficher les questions si c'est une évaluation finale */}
              {(evaluation as any).questions && Array.isArray((evaluation as any).questions) && (evaluation as any).questions.length > 0 ? (
                <div className="space-y-6">
                  {(evaluation as any).questions.map((question: any, index: number) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-semibold text-mdsc-blue-primary">
                              Question {index + 1}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({question.points} point{question.points > 1 ? 's' : ''})
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">
                            {question.question_text}
                          </h3>
                        </div>
                      </div>

                      {/* Réponses selon le type de question */}
                      {question.question_type === 'multiple_choice' && question.answers && question.answers.length > 0 && (
                        <div className="space-y-2">
                          {question.answers.map((answer: any, answerIndex: number) => {
                            const questionIdStr = String(question.id);
                            return (
                              <label
                                key={answer.id}
                                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  answers[questionIdStr] === answer.text
                                    ? 'border-mdsc-blue-primary bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={answer.text}
                                  checked={answers[questionIdStr] === answer.text}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="h-4 w-4 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                                />
                                <span className="flex-1 text-gray-700">{answer.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {question.question_type === 'true_false' && (
                        <div className="space-y-2">
                          {['Vrai', 'Faux'].map((option) => {
                            const questionIdStr = String(question.id);
                            return (
                              <label
                                key={option}
                                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  answers[questionIdStr] === option
                                    ? 'border-mdsc-blue-primary bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={answers[questionIdStr] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="h-4 w-4 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                                />
                                <span className="flex-1 text-gray-700">{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {question.question_type === 'short_answer' && (
                        <textarea
                          value={answers[String(question.id)] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
                          placeholder="Saisissez votre réponse ici..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Formulaire générique si pas de questions */
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
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={submitting || (timeRemaining !== null && timeRemaining <= 0) || ((evaluation as any)?.max_attempts && (evaluation as any).attempts_count >= (evaluation as any).max_attempts)}
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

          {/* Modal de résultats de l'évaluation */}
          {evaluationResult && (
            <EvaluationResultModal
              isOpen={showResultModal}
              onClose={() => {
                setShowResultModal(false);
                // Rediriger vers la liste des évaluations après fermeture du modal
                // Utiliser replace pour éviter de pouvoir revenir en arrière
                setTimeout(() => {
                  router.replace('/dashboard/student/evaluations');
                }, 300);
              }}
              result={evaluationResult}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
