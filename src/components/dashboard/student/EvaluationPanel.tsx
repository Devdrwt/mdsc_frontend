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
  Download,
  Eye
} from 'lucide-react';
import { evaluationService, Evaluation, EvaluationStats } from '../../../lib/services/evaluationService';
import { useAuthStore } from '../../../lib/stores/authStore';

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-started' | 'in-progress' | 'submitted' | 'graded'>('all');

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
      } catch (error) {
        console.error('Erreur lors du chargement des évaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [user]);

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filterType !== 'all' && evaluation.type !== filterType) return false;
    if (filterStatus !== 'all' && evaluation.status !== filterStatus) return false;
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
      <div className="bg-gradient-to-r from-mdsc-blue-primary to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Mes Évaluations 📝</h1>
        <p className="text-blue-100">
          Suivez vos quiz, devoirs et examens et consultez vos résultats.
        </p>
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
                <p className="text-2xl font-bold text-gray-900">{(stats.totalEvaluations || 0) - (stats.completedEvaluations || 0)}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Devoirs</option>
              <option value="exam">Examens</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="not-started">À faire</option>
              <option value="in-progress">En cours</option>
              <option value="submitted">Soumis</option>
              <option value="graded">Notés</option>
            </select>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard/student/evaluations/report'}
            className="flex items-center space-x-2 px-4 py-2 bg-mdsc-blue-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger le rapport</span>
          </button>
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
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{evaluation.title}</h3>
                        {getStatusBadge(evaluation.status)}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {getTypeLabel(evaluation.type)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {evaluation.description}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue(evaluation.dueDate) && evaluation.status !== 'graded' ? 'text-red-500 font-medium' : ''}>
                            {isOverdue(evaluation.dueDate) && evaluation.status !== 'graded' ? 'En retard: ' : ''}
                            {new Date(evaluation.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>60 minutes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4" />
                          <span>3 tentatives</span>
                        </div>
                      </div>

                      {evaluation.status === 'graded' && evaluation.score !== undefined && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Note obtenue:</span>
                            <span className={`text-lg font-bold ${
                              (evaluation.score / (evaluation.maxScore || 100)) * 100 >= 80 ? 'text-green-600' :
                              (evaluation.score / (evaluation.maxScore || 100)) * 100 >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {evaluation.score}/{evaluation.maxScore || 100} ({((evaluation.score / (evaluation.maxScore || 100)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Commentaire:</strong> Excellent travail !
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    {evaluation.status === 'not-started' && (
                      <button
                        onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                        className="btn-mdsc-primary text-sm"
                      >
                        Commencer
                      </button>
                    )}
                    {evaluation.status === 'in-progress' && (
                      <button
                        onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}`}
                        className="btn-mdsc-secondary text-sm"
                      >
                        Continuer
                      </button>
                    )}
                    {evaluation.status === 'graded' && (
                      <button
                        onClick={() => window.location.href = `/dashboard/student/evaluations/${evaluation.id}/results`}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Voir les résultats</span>
                      </button>
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
    </div>
  );
}
