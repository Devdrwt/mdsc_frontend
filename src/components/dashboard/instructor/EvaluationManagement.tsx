'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar, 
  Clock, 
  Users,
  FileText,
  BarChart3,
  Filter,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { courseService } from '../../../lib/services/courseService';
import { quizService } from '../../../lib/services/quizService';

interface Evaluation {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'exam';
  courseName: string;
  status: 'draft' | 'published' | 'closed';
  dueDate: string;
  submissionsCount: number;
  averageScore: number;
  createdAt: string;
}

export default function EvaluationManagement() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'assignment' | 'exam'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [updateBusyId, setUpdateBusyId] = useState<string | null>(null);

  // Charger les évaluations
  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      // Récupérer les cours de l'instructeur
      const courses = await courseService.getMyCourses();
      
      // Pour chaque cours, récupérer les quizzes (évaluations)
      const allEvaluations: Evaluation[] = [];
      for (const course of courses) {
        try {
          const quizzes = await quizService.getQuizzesByCourse(course.id);
          const transformed = quizzes.map((q: any) => ({
            id: String(q.id),
            title: q.title || q.name || 'Quiz',
            type: 'quiz' as const,
            courseName: course.title,
            status: (q.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published' | 'closed',
            dueDate: q.due_date || q.deadline || new Date().toISOString(),
            submissionsCount: Number(q.total_attempts || 0),
            averageScore: Number(q.avg_score || 0),
            createdAt: q.created_at || q.createdAt || new Date().toISOString(),
          }));
          allEvaluations.push(...transformed);
        } catch (error) {
          console.error(`Error loading evaluations for course ${course.id}:`, error);
        }
      }
      
      setEvaluations(allEvaluations);
    } catch (error) {
      console.error('Error loading evaluations:', error);
      // En cas d'erreur, utiliser des données vides
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (searchTerm && !evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !evaluation.courseName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && evaluation.type !== filterType) return false;
    if (filterStatus !== 'all' && evaluation.status !== filterStatus) return false;
    return true;
  });

  const openAttempts = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setShowAttemptsModal(true);
    setAttemptsLoading(true);
    try {
      const data = await quizService.getAttemptHistory(quizId);
      setAttempts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erreur chargement tentatives', e);
      setAttempts([]);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const quickAdjustScore = async (attemptId: string, delta: number) => {
    try {
      setUpdateBusyId(attemptId);
      const current = attempts.find(a => String(a.id) === String(attemptId));
      const nextScore = Math.max(0, Math.min(100, Number(current?.score || 0) + delta));
      const updated = await quizService.updateAttempt(attemptId, { score: nextScore });
      setAttempts(prev => prev.map(a => String(a.id) === String(attemptId) ? { ...a, score: updated.score } : a));
    } catch (e) {
      console.error('Erreur mise à jour tentative', e);
    } finally {
      setUpdateBusyId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'exam':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <ClipboardList className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Brouillon
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publié
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Clock className="h-3 w-3 mr-1" />
            Fermé
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Évaluations</h2>
          <p className="text-gray-600 mt-1">Créez et gérez les évaluations de vos cours</p>
        </div>
        <button className="btn-mdsc-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle évaluation
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Publiées</p>
              <p className="text-2xl font-bold text-gray-900">
                {evaluations.filter(e => e.status === 'published').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Soumissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {evaluations.reduce((sum, e) => sum + e.submissionsCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(evaluations.reduce((sum, e) => sum + e.averageScore, 0) / evaluations.length) || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une évaluation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Devoir</option>
                <option value="exam">Examen</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="closed">Fermé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des évaluations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Évaluation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Soumissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                        {getTypeIcon(evaluation.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{evaluation.title}</div>
                        <div className="text-sm text-gray-500">{evaluation.courseName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{evaluation.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(evaluation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{evaluation.submissionsCount}</div>
                    {evaluation.averageScore > 0 && (
                      <div className="text-sm text-gray-500">Moyenne: {evaluation.averageScore}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {new Date(evaluation.dueDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openAttempts(evaluation.id)} className="text-blue-600 hover:text-blue-900" title="Voir tentatives">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" title="Modifier">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvaluations.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune évaluation</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer une nouvelle évaluation.
            </p>
          </div>
        )}
      </div>

      {/* Modal tentatives */}
      {showAttemptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tentatives du quiz</h3>
              <button onClick={() => setShowAttemptsModal(false)} className="text-gray-500 hover:text-gray-700">Fermer</button>
            </div>
            <div className="p-4">
              {attemptsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mdsc-gold"></div>
                </div>
              ) : attempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soumis</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attempts.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {a.user_name || a.student_name || `#${a.user_id || a.student_id || '-'}`}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{a.score ?? 0}%</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                disabled={updateBusyId === String(a.id)}
                                onClick={() => quickAdjustScore(String(a.id), +5)}
                                className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              >
                                +5
                              </button>
                              <button
                                disabled={updateBusyId === String(a.id)}
                                onClick={() => quickAdjustScore(String(a.id), -5)}
                                className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              >
                                -5
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-600 py-12">Aucune tentative trouvée</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
