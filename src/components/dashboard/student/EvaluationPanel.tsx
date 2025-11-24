'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  FileText,
  BarChart3,
  Lock
} from 'lucide-react';
import { evaluationService, Evaluation, EvaluationStats } from '../../../lib/services/evaluationService';
import { useAuthStore } from '../../../lib/stores/authStore';
import EvaluationResultModal from '../../ui/EvaluationResultModal';
import { progressService } from '../../../lib/services/progressService';

export default function EvaluationPanel() {
  const { user } = useAuthStore();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats>({
    totalEvaluations: 0,
    completedEvaluations: 0,
    averageScore: 0,
    totalPoints: 0,
    earnedPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'assignment' | 'exam'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-started' | 'graded' | 'pending'>('all');
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedEvaluationResult, setSelectedEvaluationResult] = useState<any>(null);
  // Carte des verrous dérivés côté client pour les évaluations finales
  const [derivedLocks, setDerivedLocks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadEvaluations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Récupérer les évaluations
        const userEvaluations = await evaluationService.getUserEvaluations(user.id);
        setEvaluations(userEvaluations);

        // Récupérer les statistiques
        const userStats = await evaluationService.getUserEvaluationStats(user.id);
        setStats(userStats);

        // Préparer l'état des quiz de modules par cours (passés ou non)
        const moduleQuizzes = (userEvaluations || []).filter((ev: any) => (ev as any)?.is_module_quiz);
        const pendingModuleQuizByCourseId: Record<string, boolean> = {};
        moduleQuizzes.forEach((qz: any) => {
          const cId = String(qz?.courseId ?? qz?.course_id ?? '');
          if (!cId) return;
          const scoreNum = typeof qz?.score === 'number' ? qz.score : Number(qz?.score || 0);
          const passing = typeof qz?.passing_score === 'number' ? qz.passing_score : Number(qz?.passing_score || 70);
          const isGraded = qz?.status === 'graded';
          const isPassed = isGraded && scoreNum >= passing;
          // S'il y a au moins un quiz non passé pour ce cours, marquer comme en attente
          if (!isPassed) {
            pendingModuleQuizByCourseId[cId] = true;
          } else if (!(cId in pendingModuleQuizByCourseId)) {
            // Si aucun état précédent, et celui-ci est passé, ne marque pas en attente
            pendingModuleQuizByCourseId[cId] = false;
          }
        });

        // Calculer côté client le verrouillage des évaluations finales
        // Règle: Verrouillé si (progression du cours < 90%) OU (au moins un quiz de module non réussi)
        const finals = (userEvaluations || []).filter((ev: any) => {
          const courseIdNormalized = ev?.courseId ?? (ev as any)?.course_id;
          return ev && (ev as any).is_final && courseIdNormalized;
        });
        if (finals.length > 0) {
          const lockEntries = await Promise.all(
            finals.map(async (ev: any) => {
              try {
                const courseIdNormalized = ev?.courseId ?? (ev as any)?.course_id;
                const progress = await progressService.getCourseProgress(Number(courseIdNormalized));
                const progressPercentage =
                  typeof (progress as any)?.progress_percentage === 'number'
                    ? (progress as any).progress_percentage
                    : Number((progress as any)?.progress || 0);
                // Verrouiller si progression < 90
                const isLockedByProgress = progressPercentage < 90;
                // Verrouiller si quiz de module non réussi détecté pour ce cours
                const hasPendingModuleQuiz = !!pendingModuleQuizByCourseId[String(courseIdNormalized)];
                const shouldLock = isLockedByProgress || hasPendingModuleQuiz;
                return [String(ev.id), shouldLock] as [string, boolean];
              } catch {
                // En cas d'erreur, ne verrouille pas par défaut (ne pas bloquer inutilement)
                return [String(ev.id), false] as [string, boolean];
              }
            })
          );
          const lockMap: Record<string, boolean> = {};
          lockEntries.forEach(([id, locked]) => {
            lockMap[id] = locked;
          });
          setDerivedLocks(lockMap);
        } else {
          setDerivedLocks({});
        }
      } catch (error) {
        console.error('Erreur lors du chargement des évaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [user]);

  const filteredEvaluations = evaluations.filter(evaluation => {
    // Filtre par type
    if (filterType !== 'all') {
      // Pour les évaluations finales, les considérer comme des examens
      if ((evaluation as any).is_final) {
        if (filterType !== 'exam') return false;
      } else {
        if (evaluation.type !== filterType) return false;
      }
    }
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      if (filterStatus === 'not-started') {
        // "À faire" inclut les évaluations non commencées et celles en cours
        if (evaluation.status !== 'not-started' && evaluation.status !== 'in-progress') return false;
      } else if (filterStatus === 'pending') {
        // "En attente" inclut tous les statuts non complétés : not-started, in-progress, locked, submitted (non noté)
        if (evaluation.status === 'graded') return false;
      } else if (filterStatus === 'graded') {
        // "Notés" inclut uniquement les évaluations notées
        if (evaluation.status !== 'graded') return false;
      }
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-started':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            À faire
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            En cours
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            Soumis
          </span>
        );
      case 'graded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Noté
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Lock className="h-3 w-3 mr-1" />
            Verrouillé
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'exam':
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <ClipboardList className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Devoir';
      case 'exam': return 'Examen';
      case 'peer-review': return 'Évaluation par les pairs';
      default: return 'Évaluation';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Composant Timer pour les évaluations en cours
  const EvaluationTimer = ({ startedAt, durationMinutes, evaluationId }: { startedAt: string; durationMinutes: number; evaluationId: string }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const calculateTimeRemaining = () => {
        const startTime = new Date(startedAt).getTime();
        const durationMs = durationMinutes * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeRemaining(remaining);
        setIsExpired(remaining === 0);
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }, [startedAt, durationMinutes]);

    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      }
      return `${minutes}m ${secs}s`;
    };

    if (isExpired) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg">
          <Clock className="h-4 w-4 text-red-600" />
          <span className="text-sm font-semibold text-red-600">Temps écoulé</span>
        </div>
      );
    }

    const isWarning = timeRemaining < 300; // Moins de 5 minutes

    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
        isWarning 
          ? 'bg-red-50 border-red-300' 
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <Clock className={`h-4 w-4 ${isWarning ? 'text-red-600' : 'text-yellow-600'}`} />
        <span className={`text-sm font-semibold ${isWarning ? 'text-red-600' : 'text-yellow-600'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
<div className="bg-mdsc-blue-primary dark:from-mdsc-blue-dark dark:via-mdsc-blue-primary dark:to-mdsc-blue-dark text-white rounded-lg p-6 shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <FileText className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Mes Évaluations</h1>
      </div>
      <p className="text-white/90">
        Suivez vos quiz, devoirs et examens et consultez vos résultats
      </p>
    </div>
  </div>
</div>


      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Complétées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedEvaluations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.averageScore || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingEvaluations !== undefined ? stats.pendingEvaluations : (stats.totalEvaluations || 0) - (stats.completedEvaluations || 0)}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Examens</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="not-started">À faire</option>
            <option value="pending">En attente</option>
            <option value="graded">Notés</option>
          </select>
        </div>
      </div>

      {/* Liste des évaluations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredEvaluations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(evaluation.type)}
                    </div>
                    
                    <div className="flex-1">
                      {/* Afficher les quiz de modules avec leur module */}
                      {(evaluation as any).is_module_quiz ? (
                        <div className="mb-3">
                          {evaluation.courseName && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation :</span>
                              <h4 className="text-base font-semibold text-gray-900 mt-1">{evaluation.courseName}</h4>
                            </div>
                          )}
                          {(evaluation as any).module_title && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Module :</span>
                              <h4 className="text-base font-semibold text-gray-900 mt-1">{(evaluation as any).module_title}</h4>
                            </div>
                          )}
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{evaluation.title}</h3>
                            {getStatusBadge(evaluation.status)}
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {getTypeLabel(evaluation.type)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {evaluation.description}
                          </p>
                          {/* Afficher le score s'il existe */}
                          {evaluation.score !== undefined && evaluation.score !== null && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Note obtenue:</span>
                                <span className={`text-lg font-bold ${
                                  evaluation.score >= 80 ? 'text-green-600' : evaluation.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {evaluation.score.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : !(evaluation as any).is_final ? (
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{evaluation.title}</h3>
                          {getStatusBadge(evaluation.status)}
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {getTypeLabel(evaluation.type)}
                          </span>
                        </div>
                      ) : null}
                      
                      {/* Pour les évaluations finales, afficher seulement la description */}
                      {(evaluation as any).is_final ? (
                        <div className="mb-3">
                          {/* Afficher le titre de la formation */}
                          {evaluation.courseName && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation :</span>
                              <h4 className="text-base font-semibold text-gray-900 mt-1">{evaluation.courseName}</h4>
                            </div>
                          )}
                          <p className="text-gray-600 text-sm mb-3">
                            {evaluation.description}
                          </p>
                          {/* Afficher le timer si l'évaluation est en cours */}
                          {evaluation.status === 'in-progress' && (evaluation as any).incomplete_started_at && (evaluation as any).duration_minutes && (
                            <div className="mb-3">
                              <EvaluationTimer 
                                startedAt={(evaluation as any).incomplete_started_at}
                                durationMinutes={(evaluation as any).duration_minutes}
                                evaluationId={evaluation.id}
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            {(evaluation as any).duration_minutes && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{(evaluation as any).duration_minutes} minutes</span>
                              </div>
                            )}
                            {(evaluation as any).max_attempts && (
                              <div className="flex items-center space-x-1">
                                <Award className="h-4 w-4" />
                                <span>
                                  {Math.min((evaluation as any).attempts_count || 0, (evaluation as any).max_attempts)}/{(evaluation as any).max_attempts} tentative{(evaluation as any).max_attempts > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            {(evaluation as any).passing_score && (
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Score minimum: {(evaluation as any).passing_score}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {evaluation.description}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            {evaluation.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span className={isOverdue(evaluation.dueDate) && evaluation.status !== 'graded' ? 'text-red-500 font-medium' : ''}>
                                  {isOverdue(evaluation.dueDate) && evaluation.status !== 'graded' ? 'En retard: ' : ''}
                                  {new Date(evaluation.dueDate).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                            {(evaluation as any).duration_minutes && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{(evaluation as any).duration_minutes} minutes</span>
                              </div>
                            )}
                            {(evaluation as any).max_attempts && (
                              <div className="flex items-center space-x-1">
                                <Award className="h-4 w-4" />
                                <span>
                                  {Math.min((evaluation as any).attempts_count || 0, (evaluation as any).max_attempts)}/{(evaluation as any).max_attempts} tentative{(evaluation as any).max_attempts > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            {(evaluation as any).passing_score && (
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Score minimum: {(evaluation as any).passing_score}%</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Afficher le score s'il existe et n'est pas null (pour toutes les évaluations, pas seulement "graded") */}
                      {evaluation.score !== undefined && evaluation.score !== null && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Note obtenue:</span>
                            <span className={`text-lg font-bold ${
                              // Pour les évaluations finales, le score est déjà un pourcentage
                              (evaluation as any).is_final 
                                ? (evaluation.score >= 80 ? 'text-green-600' : evaluation.score >= 60 ? 'text-yellow-600' : 'text-red-600')
                                : ((evaluation.score / (evaluation.maxScore || 100)) * 100 >= 80 ? 'text-green-600' :
                                    (evaluation.score / (evaluation.maxScore || 100)) * 100 >= 60 ? 'text-yellow-600' :
                                    'text-red-600')
                            }`}>
                              {(evaluation as any).is_final 
                                ? `${evaluation.score.toFixed(1)}%`
                                : `${evaluation.score}/${evaluation.maxScore || 100} (${((evaluation.score / (evaluation.maxScore || 100)) * 100).toFixed(1)}%)`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    {/* Pour les quiz de modules */}
                    {(evaluation as any).is_module_quiz ? (
                      <>
                        {(evaluation as any).is_locked ? (
                          <button
                            disabled
                            className="px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl shadow-sm cursor-not-allowed text-sm whitespace-nowrap"
                            title="Complétez toutes les leçons du module pour déverrouiller ce quiz"
                          >
                            Verrouillé
                          </button>
                        ) : evaluation.status === 'not-started' ? (
                          <button
                            onClick={() => {
                              const courseId = evaluation.courseId;
                              const moduleId = (evaluation as any).module_id;
                              const lessonId = (evaluation as any).lesson_id;
                              if (courseId && moduleId && lessonId) {
                                window.location.href = `/learn/${courseId}?module=${moduleId}&lesson=${lessonId}`;
                              }
                            }}
                            className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Commencer
                          </button>
                        ) : evaluation.status === 'graded' ? (
                          <button
                            onClick={() => {
                              // Préparer les données pour le modal de résultats
                              const quizData = evaluation as any;
                              const percentage = quizData.score !== null && quizData.score !== undefined ? Number(quizData.score) : 0;
                              const passingScore = quizData.passing_score || 70;
                              const isPassed = percentage >= passingScore;
                              
                              // Calculer le score en points (approximation basée sur le pourcentage)
                              const totalPoints = 100;
                              const scoreInPoints = Math.round((percentage / 100) * totalPoints);
                              
                              const result = {
                                score: scoreInPoints,
                                totalPoints: totalPoints,
                                percentage: percentage,
                                isPassed: isPassed,
                                isTimeExpired: false,
                                evaluationTitle: evaluation.title,
                                courseName: evaluation.courseName || '',
                                passingScore: passingScore,
                                isQuiz: true
                              };
                              
                              setSelectedEvaluationResult(result);
                              setShowResultModal(true);
                            }}
                            className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Voir les résultats
                          </button>
                        ) : null}
                      </>
                    ) : (evaluation as any).is_final ? (
                      <>
                        {((evaluation as any).is_locked || derivedLocks[String(evaluation.id)]) ? (
                          <button
                            disabled
                            className="px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl shadow-sm cursor-not-allowed text-sm whitespace-nowrap"
                            title="Complétez tous les modules de la formation pour déverrouiller cette évaluation"
                          >
                            Verrouillé
                          </button>
                        ) : (evaluation as any).attempts_count < (evaluation as any).max_attempts ? (
                          evaluation.status === 'not-started' ? (
                            <button
                              onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                              className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                            >
                              Commencer
                            </button>
                          ) : (
                            <button
                              onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                              className="px-6 py-3 bg-mdsc-gold text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-yellow-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                            >
                              Continuer
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              // Préparer les données pour le modal de résultats
                              const evalData = evaluation as any;
                              // Pour les évaluations finales, le score est déjà un pourcentage (best_score)
                              const percentage = evalData.score !== null && evalData.score !== undefined ? Number(evalData.score) : 0;
                              const passingScore = evalData.passing_score || 70;
                              const isPassed = percentage >= passingScore;
                              
                              // Calculer le score en points (approximation basée sur le pourcentage)
                              const totalPoints = 100;
                              const scoreInPoints = Math.round((percentage / 100) * totalPoints);
                              
                              const result = {
                                score: scoreInPoints,
                                totalPoints: totalPoints,
                                percentage: percentage,
                                isPassed: isPassed,
                                isTimeExpired: false,
                                evaluationTitle: evaluation.title,
                                courseName: evaluation.courseName || '',
                                passingScore: passingScore
                              };
                              
                              setSelectedEvaluationResult(result);
                              setShowResultModal(true);
                            }}
                            className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Voir les résultats
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {evaluation.status === 'not-started' && (
                          <button
                            onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                            className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Commencer
                          </button>
                        )}
                        {evaluation.status === 'in-progress' && (
                          <button
                            onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                            className="px-6 py-3 bg-mdsc-gold text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-yellow-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Continuer
                          </button>
                        )}
                        {evaluation.status === 'graded' && (
                          <button
                            onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}/results`}
                            className="px-6 py-3 bg-mdsc-blue-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 ease-out text-sm whitespace-nowrap"
                          >
                            Voir les résultats
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune évaluation trouvée</h3>
            <p className="text-gray-500">
              {filterType !== 'all' || filterStatus !== 'all'
                ? 'Aucune évaluation ne correspond à vos filtres.'
                : 'Vous n\'avez aucune évaluation en cours.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de résultats de l'évaluation */}
      {selectedEvaluationResult && (
        <EvaluationResultModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setSelectedEvaluationResult(null);
          }}
          result={selectedEvaluationResult}
        />
      )}
    </div>
  );
}
