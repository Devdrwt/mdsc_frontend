'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, AlertCircle, Loader, FileText, GraduationCap, Info, Timer, Target, AlertTriangle, RotateCcw } from 'lucide-react';
import { evaluationService } from '../../../lib/services/evaluationService';
import { certificateService } from '../../../lib/services/certificateService';
import toast from '../../../lib/utils/toast';
import ConfirmModal from '../../ui/ConfirmModal';
import ProfileVerificationModal from './ProfileVerificationModal';

interface EvaluationQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | Array<{ id: string | number; text: string }>; // Supporte les deux formats
  correct_answer: string;
  points: number | string;
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
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [showProfileVerificationModal, setShowProfileVerificationModal] = useState(false);
  const [requestingCertificate, setRequestingCertificate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadEvaluation();
  }, [evaluationId]);

  // Log pour déboguer l'état du modal de vérification
  useEffect(() => {
    if (showProfileVerificationModal) {
      console.log('[CourseEvaluationPlayer] ✅ Modal de vérification ouvert:', {
        showProfileVerificationModal,
        courseId,
        enrollmentId
      });
    } else {
      console.log('[CourseEvaluationPlayer] ❌ Modal de vérification fermé');
    }
  }, [showProfileVerificationModal, courseId, enrollmentId]);

  // Gérer le cas où le temps est écoulé au chargement
  useEffect(() => {
    if (evaluation && timerStarted && timeRemaining === 0 && !submitting && !result) {
      console.log('[CourseEvaluationPlayer] ⏱️ Temps écoulé au chargement, soumission automatique');
      // Utiliser setTimeout pour éviter les problèmes de dépendances
      setTimeout(() => {
        handleAutoSubmit();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation, timerStarted, timeRemaining, submitting, result]);

  // Timer pour le temps restant - calculé à partir du startTime réel (comme la page d'évaluation)
  useEffect(() => {
    // Arrêter le timer si les conditions ne sont pas remplies ou si l'évaluation est soumise
    if (timeRemaining === null || !timerStarted || !startTime || !evaluation?.duration_minutes || submitting || result || isSubmitted) return;

    const durationSeconds = evaluation.duration_minutes * 60;
    let hasCalledSubmit = false; // Flag local pour éviter les appels multiples

    const updateTimer = () => {
      // Arrêter si déjà soumis
      if (submitting || result || isSubmitted || hasCalledSubmit) return;
      
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
  }, [timerStarted, startTime, evaluation, submitting, result, isSubmitted]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      // Utiliser l'endpoint spécifique si enrollmentId est fourni
      let evalData: FinalEvaluation | null = null;
      
      if (enrollmentId) {
        // Utiliser l'endpoint pour les étudiants avec enrollmentId
        const evalDataResult = await evaluationService.getEnrollmentEvaluation(enrollmentId);
        if (evalDataResult?.evaluation) {
          evalData = evalDataResult.evaluation as FinalEvaluation;
        }
      } else {
        // Fallback : utiliser getCourseEvaluation (pour instructeurs)
        const evalDataResult = await evaluationService.getCourseEvaluation(courseId);
        if (evalDataResult) {
          evalData = { ...evalDataResult, id: evalDataResult.id || evaluationId } as FinalEvaluation;
        }
      }
      
      if (!evalData) {
        toast.error('Erreur', 'Évaluation non trouvée');
        return;
      }
      
      // Normaliser les questions pour s'assurer que le format est cohérent
      if (evalData.questions && Array.isArray(evalData.questions)) {
        evalData.questions = evalData.questions.map((q: any) => {
          // S'assurer que les options sont dans le bon format
          if (q.options && Array.isArray(q.options)) {
            // Les options peuvent être des strings ou des objets {id, text}
            // On les laisse telles quelles, le rendu s'en chargera
          }
          return q;
        });
      }
      
      setEvaluation(evalData);
      
      // Vérifier si l'évaluation a déjà été soumise (tentative complétée)
      if (enrollmentId && evalData.id) {
        try {
          const evalDataResult = await evaluationService.getEnrollmentEvaluation(enrollmentId);
          if (evalDataResult?.previous_attempts && Array.isArray(evalDataResult.previous_attempts)) {
            // Vérifier s'il y a une tentative complétée (avec completed_at)
            const completedAttempt = evalDataResult.previous_attempts.find(
              (attempt: any) => attempt.completed_at || attempt.completedAt
            );
            if (completedAttempt) {
              // Charger et afficher les résultats de la tentative complétée
              const attemptResult: EvaluationResult = {
                score: Number(completedAttempt.score ?? 0),
                total_points: Number(completedAttempt.total_points ?? 0),
                percentage: Number(completedAttempt.percentage ?? 0),
                passed: Boolean(completedAttempt.is_passed ?? completedAttempt.passed ?? false),
                certificate_eligible: Boolean(completedAttempt.certificate_eligible ?? (completedAttempt.is_passed ?? completedAttempt.passed ?? false)),
              };
              
              // Mettre à jour le nombre de tentatives utilisées
              const attemptsCount = evalDataResult.previous_attempts.length;
              setAttemptsUsed(attemptsCount);
              
              // Vérifier si l'étudiant peut réessayer (pas réussi ET tentatives restantes)
              const canRetry = !attemptResult.passed && attemptsCount < evalData.max_attempts;
              
              if (canRetry) {
                // Si l'étudiant peut réessayer, ne pas marquer comme soumis pour permettre une nouvelle tentative
                setIsSubmitted(false);
                setResult(attemptResult);
                setShowResults(true);
                console.log('[CourseEvaluationPlayer] ⚠️ Évaluation non réussie, possibilité de réessayer:', { attemptsCount, maxAttempts: evalData.max_attempts });
              } else {
                // Si l'étudiant a réussi ou n'a plus de tentatives, marquer comme soumis
                setIsSubmitted(true);
                setResult(attemptResult);
                setShowResults(true);
                console.log('[CourseEvaluationPlayer] ⚠️ Évaluation déjà soumise, résultats chargés:', attemptResult);
              }
            }
          }
        } catch (error) {
          console.warn('[CourseEvaluationPlayer] Erreur lors de la vérification des tentatives:', error);
        }
      }
      
      // Vérifier s'il existe une tentative en cours (pour restaurer la minuterie)
      if (evalData.id && evalData.duration_minutes) {
        try {
          const attemptCheck = await evaluationService.checkEvaluationAttempt(evalData.id);
          
          // Utiliser la durée de l'évaluation si elle n'est pas dans la tentative
          const durationMinutes = attemptCheck.durationMinutes || evalData.duration_minutes;
          
          if (attemptCheck.exists && attemptCheck.startedAt && durationMinutes) {
            // Calculer le temps restant basé sur startedAt
            const startedAt = new Date(attemptCheck.startedAt);
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
            const totalSeconds = durationMinutes * 60;
            const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
            
            if (remainingSeconds > 0) {
              // Il reste du temps, restaurer la minuterie avec startTime
              const startedAtDate = new Date(attemptCheck.startedAt);
              setStartTime(startedAtDate);
              setTimeRemaining(remainingSeconds);
              setTimerStarted(true);
              console.log('[CourseEvaluationPlayer] ⏱️ Minuterie restaurée:', {
                startedAt: attemptCheck.startedAt,
                elapsedSeconds,
                remainingSeconds,
                totalSeconds
              });
            } else {
              // Le temps est écoulé, soumettre automatiquement
              console.log('[CourseEvaluationPlayer] ⏱️ Temps écoulé, soumission automatique');
              const startedAtDate = new Date(attemptCheck.startedAt);
              setStartTime(startedAtDate);
              setTimeRemaining(0);
              setTimerStarted(true);
              // Ne pas appeler handleAutoSubmit ici car l'évaluation n'est peut-être pas encore complètement chargée
              // On le fera dans un useEffect qui surveille timeRemaining === 0
            }
          } else {
            // Pas de tentative en cours, réinitialiser les états
            setTimeRemaining(null);
            setTimerStarted(false);
            setStartTime(null);
          }
        } catch (attemptError: any) {
          // Ne pas logger les erreurs 404 - c'est normal si la route n'existe pas encore
          if (attemptError?.status !== 404 && attemptError?.response?.status !== 404) {
            console.warn('[CourseEvaluationPlayer] Erreur lors de la vérification de la tentative:', attemptError);
          }
          // En cas d'erreur, réinitialiser les états
          setTimeRemaining(null);
          setTimerStarted(false);
          setStartTime(null);
        }
      } else {
        // Pas de durée limitée, réinitialiser les états
        setTimeRemaining(null);
        setTimerStarted(false);
        setStartTime(null);
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

  const handleAnswerChange = async (questionId: string, answer: string) => {
    // Démarrer la minuterie lors de la première sélection de réponse (si elle n'a pas déjà été restaurée)
    if (!timerStarted && evaluation?.duration_minutes && evaluation?.id) {
      try {
        // Vérifier s'il existe déjà une tentative
        const attemptCheck = await evaluationService.checkEvaluationAttempt(evaluation.id);
        
        if (!attemptCheck.exists) {
          // Créer une nouvelle tentative
          const attemptResult = await evaluationService.startEvaluationAttempt(evaluation.id);
          console.log('[CourseEvaluationPlayer] ⏱️ Nouvelle tentative créée:', attemptResult);
          // Démarrer la minuterie avec startTime
          const startedAtDate = new Date(attemptResult.startedAt);
          setStartTime(startedAtDate);
          setTimerStarted(true);
          setTimeRemaining(evaluation.duration_minutes * 60);
        } else if (attemptCheck.startedAt) {
          // Tentative existante, utiliser le startedAt pour calculer en temps réel
          // Utiliser la durée de l'évaluation si elle n'est pas dans la tentative
          const durationMinutes = attemptCheck.durationMinutes || evaluation.duration_minutes || 0;
          const startedAtDate = new Date(attemptCheck.startedAt);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startedAtDate.getTime()) / 1000);
          const totalSeconds = durationMinutes * 60;
          const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
          
          console.log('[CourseEvaluationPlayer] ⏱️ Tentative existante, temps restant:', remainingSeconds);
          setStartTime(startedAtDate);
          setTimerStarted(true);
          setTimeRemaining(remainingSeconds);
        } else {
          // Tentative existante mais sans info de temps, créer une nouvelle tentative
          const attemptResult = await evaluationService.startEvaluationAttempt(evaluation.id);
          const startedAtDate = new Date(attemptResult.startedAt);
          setStartTime(startedAtDate);
          setTimerStarted(true);
          setTimeRemaining(evaluation.duration_minutes * 60);
        }
      } catch (error: any) {
        // Ne pas logger les erreurs 404 - c'est normal si la route n'existe pas encore
        if (error?.status !== 404 && error?.response?.status !== 404) {
          console.error('[CourseEvaluationPlayer] Erreur lors du démarrage de la tentative:', error);
        }
        // En cas d'erreur, utiliser l'heure actuelle comme startTime
        const now = new Date();
        setStartTime(now);
        setTimerStarted(true);
        setTimeRemaining(evaluation.duration_minutes * 60);
      }
    }
    
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    const questionsLength = evaluation?.questions?.length || 0;
    if (evaluation && questionsLength > 0 && currentQuestionIndex < questionsLength - 1) {
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
    const unanswered = (evaluation?.questions || []).filter((q) => !answers[q.id || '']);
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
      
      // Utiliser l'endpoint standard - le backend récupère automatiquement l'enrollmentId si nécessaire
      if (evaluation?.id) {
        try {
          // Le backend gère automatiquement l'enrollmentId et retourne une réponse structurée
          const result = await evaluationService.submitEvaluation(
            String(evaluation.id), 
            answers,
            enrollmentId || undefined
          );
          
          // Utiliser les données du backend (qui sont maintenant fiables)
          submissionResult = {
            score: Number(result.score ?? 0),
            total_points: Number(result.total_points ?? 0),
            percentage: Number(result.percentage ?? 0),
            passed: Boolean(result.passed ?? result.is_passed ?? false),
            certificate_eligible: Boolean(result.certificate_eligible ?? (result.passed ?? result.is_passed ?? false)),
          };
        } catch (error: any) {
          // Si l'endpoint échoue, utiliser le calcul côté client comme fallback
          console.warn('[CourseEvaluationPlayer] Erreur lors de la soumission, utilisation du calcul côté client:', error);
          // Fallback : calcul côté client
          const totalPoints = (evaluation?.questions || []).reduce((sum, q) => {
            const raw = q.points;
            if (typeof raw === 'number' && Number.isFinite(raw)) return sum + raw;
            if (typeof raw === 'string') {
              const parsed = parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
              return sum + (Number.isFinite(parsed) ? parsed : 0);
            }
            return sum;
          }, 0);
          const score = (evaluation?.questions || []).reduce((sum, q) => {
            const answer = answers[q.id || ''];
            if (answer && q.correct_answer && String(answer).toLowerCase() === String(q.correct_answer).toLowerCase()) {
              const raw = q.points;
              if (typeof raw === 'number' && Number.isFinite(raw)) return sum + raw;
              if (typeof raw === 'string') {
                const parsed = parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
                return sum + (Number.isFinite(parsed) ? parsed : 0);
              }
              return sum;
            }
            return sum;
          }, 0);
          const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
          const passed = percentage >= evaluation.passing_score;

          submissionResult = {
            score,
            total_points: totalPoints,
            percentage: Math.round(percentage),
            passed,
            certificate_eligible: passed,
          };
        }
      } else {
        // Si pas d'evaluation.id, utiliser le calcul côté client
        const totalPoints = (evaluation?.questions || []).reduce((sum, q) => {
          const raw = q.points;
          if (typeof raw === 'number' && Number.isFinite(raw)) return sum + raw;
          if (typeof raw === 'string') {
            const parsed = parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
            return sum + (Number.isFinite(parsed) ? parsed : 0);
          }
          return sum;
        }, 0);
        const score = (evaluation?.questions || []).reduce((sum, q) => {
          const answer = answers[q.id || ''];
          if (answer && q.correct_answer && String(answer).toLowerCase() === String(q.correct_answer).toLowerCase()) {
            const raw = q.points;
            if (typeof raw === 'number' && Number.isFinite(raw)) return sum + raw;
            if (typeof raw === 'string') {
              const parsed = parseFloat(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
              return sum + (Number.isFinite(parsed) ? parsed : 0);
            }
            return sum;
          }
          return sum;
        }, 0);
        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
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
      setIsSubmitted(true);
      setShowResults(true);
      setAttemptsUsed(prev => prev + 1);
      
      // Appeler onComplete avant d'afficher les toasts
      // Si onComplete est fourni, c'est que le parent gère l'affichage (popup), donc on n'affiche pas les toasts
      const hasParentHandler = !!onComplete;
      onComplete?.(submissionResult);

      // N'afficher les toasts que si onComplete n'est pas fourni (pas de popup parent)
      if (!hasParentHandler) {
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
      }

      // Si l'évaluation est réussie et éligible pour certificat, ouvrir le modal de vérification
      // IMPORTANT: Le modal de vérification doit s'afficher AVANT toute création de certificat
      console.log('[CourseEvaluationPlayer] 🔍 Vérification éligibilité certificat:', {
        passed: submissionResult.passed,
        certificate_eligible: submissionResult.certificate_eligible,
        hasParentHandler,
        willShowModal: submissionResult.passed && submissionResult.certificate_eligible,
        submissionResult
      });
      
      // Si l'évaluation est réussie, afficher le modal de vérification
      // certificate_eligible peut être undefined, donc on considère que si passed est true, on est éligible
      const isEligible = submissionResult.passed && (submissionResult.certificate_eligible !== false);
      
      // Si onComplete est fourni, c'est que le parent (CoursePlayer) gère le modal de vérification
      // Sinon, on gère le modal ici
      if (isEligible && !hasParentHandler) {
        console.log('[CourseEvaluationPlayer] ✅ Ouverture du modal de vérification (pas de parent handler)...');
        // Afficher le modal immédiatement si pas de parent handler
        setTimeout(() => {
          console.log('[CourseEvaluationPlayer] 🎯 Affichage du modal de vérification maintenant');
          setShowProfileVerificationModal(true);
        }, 100);
      } else if (isEligible && hasParentHandler) {
        console.log('[CourseEvaluationPlayer] ℹ️ Modal de vérification géré par le parent (CoursePlayer)');
      } else {
        console.log('[CourseEvaluationPlayer] ❌ Modal de vérification non affiché:', {
          reason: !submissionResult.passed ? 'Évaluation non réussie' : 'Non éligible pour certificat',
          passed: submissionResult.passed,
          certificate_eligible: submissionResult.certificate_eligible,
          isEligible,
          hasParentHandler
        });
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

  const handleConfirmProfileData = async () => {
    if (!courseId) {
      toast.error('Erreur', 'Impossible de générer le certificat sans courseId');
      return;
    }

    setRequestingCertificate(true);
    try {
      // Utiliser generateForCourse pour créer le certificat après confirmation des données
      // Le backend vérifie que l'évaluation finale est réussie avant de créer le certificat
      await certificateService.generateForCourse(courseId);
      toast.success(
        'Certificat généré',
        'Votre certificat a été généré avec succès avec les données de votre profil.'
      );
      setShowProfileVerificationModal(false);
      // Rediriger vers la page des certificats
      window.location.href = `/dashboard/student/certificates?courseId=${courseId}`;
    } catch (error: any) {
      console.error('Erreur lors de la génération du certificat:', error);
      toast.error('Erreur', error.message || 'Impossible de générer le certificat');
    } finally {
      setRequestingCertificate(false);
    }
  };

  const handleUpdateProfile = () => {
    // Rediriger vers le profil avec un paramètre pour revenir après
    const returnUrl = encodeURIComponent(`/dashboard/student/certificates?courseId=${courseId}&requestCertificate=true`);
    window.location.href = `/dashboard/student/profile?returnUrl=${returnUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-12 w-12 text-[#3B7C8A] animate-spin" />
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
          {!result.passed && attemptsUsed < evaluation.max_attempts && (
            <button
              onClick={() => {
                // Réinitialiser l'état pour permettre une nouvelle tentative
                setResult(null);
                setShowResults(false);
                setIsSubmitted(false);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setTimeRemaining(null);
                setTimerStarted(false);
                setStartTime(null);
                console.log('[CourseEvaluationPlayer] 🔄 Nouvelle tentative démarrée');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Réessayer ({evaluation.max_attempts - attemptsUsed} tentative{evaluation.max_attempts - attemptsUsed > 1 ? 's' : ''} restante{evaluation.max_attempts - attemptsUsed > 1 ? 's' : ''})</span>
            </button>
          )}
          {result.passed && result.certificate_eligible && (
            <button
              onClick={() => {
                // Ouvrir le modal de vérification des données
                setShowProfileVerificationModal(true);
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

  // Vérifier que les questions existent et sont un tableau
  if (!evaluation.questions || !Array.isArray(evaluation.questions) || evaluation.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucune question disponible pour cette évaluation</p>
        </div>
      </div>
    );
  }

  const sortedQuestions = evaluation.questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sortedQuestions.length) * 100;

  // Calculer le score maximum (somme des points de toutes les questions)
  const maxScore = (() => {
    let total = 0;
    for (const q of sortedQuestions) {
      let points = 0;
      if (typeof q.points === 'number' && Number.isFinite(q.points)) {
        points = q.points;
      } else if (typeof q.points === 'string') {
        // Nettoyer la chaîne et parser (enlever tous les caractères non numériques sauf le point)
        const cleaned = q.points.replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        points = Number.isFinite(parsed) ? parsed : 0;
      }
      total += points;
    }
    return Math.round(total);
  })();
  const passingScore = evaluation.passing_score || 70;
  const hasStartedTimer = timerStarted && timeRemaining !== null && evaluation.duration_minutes;

  return (
    <div className="space-y-6">
      {/* Informations sur l'évaluation */}
      <div className="bg-gradient-to-br from-[#3B7C8A]/10 to-[#3B7C8A]/5 border border-[#3B7C8A]/30 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="h-5 w-5 text-[#3B7C8A]" />
          <h3 className="text-lg font-semibold text-gray-900">Informations sur l'évaluation</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-[#3B7C8A]/20">
            <FileText className="h-5 w-5 text-[#3B7C8A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Questions</p>
              <p className="text-sm font-semibold text-gray-900">{sortedQuestions.length} question{sortedQuestions.length > 1 ? 's' : ''} technique{sortedQuestions.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-[#3B7C8A]/20">
            <Award className="h-5 w-5 text-[#3B7C8A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Score maximum</p>
              <p className="text-sm font-semibold text-gray-900">
                {typeof maxScore === 'number' && Number.isFinite(maxScore) 
                  ? Math.round(maxScore).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                  : '0'} point{maxScore > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-[#3B7C8A]/20">
            <Target className="h-5 w-5 text-[#3B7C8A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Score minimum</p>
              <p className="text-sm font-semibold text-[#2d5f6a]">{passingScore}% pour réussir</p>
            </div>
          </div>
          
          {evaluation.duration_minutes && (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-[#3B7C8A]/20">
              <Clock className="h-5 w-5 text-[#3B7C8A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Durée</p>
                <p className="text-sm font-semibold text-gray-900">{evaluation.duration_minutes} minute{evaluation.duration_minutes > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Section Minuterie */}
        {evaluation.duration_minutes && (
          <div className="mt-4 pt-4 border-t border-[#3B7C8A]/30">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${hasStartedTimer ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Timer className={`h-5 w-5 ${hasStartedTimer ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Minuterie</p>
                <p className="text-sm text-gray-600 mb-2">
                  La minuterie démarre automatiquement dès que vous commencez l'évaluation (lors de la première sélection de réponse).
                </p>
                {!hasStartedTimer && (
                  <div className="flex items-center space-x-2 text-sm text-[#3B7C8A] bg-[#3B7C8A]/10 px-3 py-2 rounded-lg">
                    <Info className="h-4 w-4" />
                    <span>La minuterie n'a pas encore démarré. Elle commencera dès que vous sélectionnerez votre première réponse.</span>
                  </div>
                )}
                {hasStartedTimer && timeRemaining !== null && (
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

      {/* En-tête avec timer */}
      <div className="bg-gradient-to-r from-[#3B7C8A] to-[#2d5f6a] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{evaluation.title}</h2>
            {evaluation.description && (
              <p className="text-white/80 text-sm">{evaluation.description}</p>
            )}
            <p className="text-white/80 text-xs mt-2">
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
            <span>Question {currentQuestionIndex + 1} sur {sortedQuestions.length}</span>
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
              {(() => {
                // Normaliser les options : gérer les deux formats (string[] ou Array<{id, text}>)
                const normalizedOptions = currentQuestion.options.map((opt: any) => {
                  if (typeof opt === 'string') {
                    return { id: opt, text: opt };
                  }
                  return { id: String(opt.id || opt), text: opt.text || String(opt) };
                }).filter((opt: any) => opt.text && opt.text.trim());
                
                return normalizedOptions.map((option: any, index: number) => {
                  const optionValue = String(option.id);
                  const optionText = option.text;
                  
                  return (
                    <label
                      key={index}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                        result || isSubmitted
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      } ${
                        answers[currentQuestion.id || ''] === optionValue
                          ? 'border-[#3B7C8A] bg-[#3B7C8A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={optionValue}
                        checked={answers[currentQuestion.id || ''] === optionValue}
                        onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                        disabled={!!result || isSubmitted}
                        className="h-4 w-4 text-[#3B7C8A] focus:ring-[#3B7C8A] disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 text-gray-700">{optionText}</span>
                    </label>
                  );
                });
              })()}
            </>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <>
              {(() => {
                // Normaliser les options vrai/faux : utiliser les options du backend si disponibles, sinon fallback
                let trueFalseOptions: Array<{ id: string; text: string }> = [];
                
                if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
                  // Utiliser les options du backend
                  trueFalseOptions = currentQuestion.options.map((opt: any) => {
                    if (typeof opt === 'string') {
                      return { id: opt, text: opt };
                    }
                    return { id: String(opt.id || opt), text: opt.text || String(opt) };
                  });
                } else {
                  // Fallback : valeurs par défaut
                  trueFalseOptions = [
                    { id: 'true', text: 'Vrai' },
                    { id: 'false', text: 'Faux' }
                  ];
                }
                
                return trueFalseOptions.map((option: any) => {
                  const optionValue = String(option.id);
                  const optionText = option.text;
                  
                  return (
                    <label
                      key={optionValue}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                        result || isSubmitted
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      } ${
                        answers[currentQuestion.id || ''] === optionValue
                          ? 'border-[#3B7C8A] bg-[#3B7C8A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={optionValue}
                        checked={answers[currentQuestion.id || ''] === optionValue}
                        onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
                        disabled={!!result || isSubmitted}
                        className="h-4 w-4 text-[#3B7C8A] focus:ring-[#3B7C8A] disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 text-gray-700">{optionText}</span>
                    </label>
                  );
                });
              })()}
            </>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <textarea
              value={answers[currentQuestion.id || ''] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id || '', e.target.value)}
              disabled={!!result || isSubmitted}
              readOnly={!!result || isSubmitted}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B7C8A] focus:border-[#3B7C8A] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Votre réponse..."
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || !!result || isSubmitted}
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
                  ? 'bg-[#3B7C8A] w-8'
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
            disabled={!!result || isSubmitted}
            className="px-6 py-2 bg-[#3B7C8A] text-white rounded-lg hover:bg-[#2d5f6a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
            disabled={submitting || !!result || isSubmitted}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Soumission...</span>
              </>
            ) : result || isSubmitted ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Évaluation soumise</span>
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
        confirmButtonClass="bg-[#3B7C8A] hover:bg-[#2d5f6a]"
        isLoading={submitting}
      />

      {/* Modal de vérification des données du profil */}
      <ProfileVerificationModal
        isOpen={showProfileVerificationModal}
        onClose={() => {
          console.log('[CourseEvaluationPlayer] ❌ Fermeture du modal de vérification');
          setShowProfileVerificationModal(false);
        }}
        onConfirm={handleConfirmProfileData}
        onUpdateProfile={handleUpdateProfile}
        courseId={courseId}
      />
    </div>
  );
}

