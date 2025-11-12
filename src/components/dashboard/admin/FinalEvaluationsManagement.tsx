'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { EvaluationService, InstructorFinalEvaluationEntry } from '../../../lib/services/evaluationService';
import { adminService } from '../../../lib/services/adminService';
import toast from '../../../lib/utils/toast';
import DataTable from '../shared/DataTable';
import Modal from '../../ui/Modal';

export default function FinalEvaluationsManagement() {
  const [evaluations, setEvaluations] = useState<InstructorFinalEvaluationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'pending'>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<InstructorFinalEvaluationEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await EvaluationService.getInstructorFinalEvaluations();
      setEvaluations(response.evaluations || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des évaluations:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les évaluations finales');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations;

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(eval => {
        const courseStatus = (eval.course?.status ?? '').toLowerCase();
        return courseStatus === filterStatus;
      });
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(eval =>
        eval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eval.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((eval.course as any)?.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [evaluations, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Publié
          </span>
        );
      case 'pending':
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            En attente
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Brouillon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm">
            {status || 'Inconnu'}
          </span>
        );
    }
  };

  const handleViewDetails = (evaluation: InstructorFinalEvaluationEntry) => {
    setSelectedEvaluation(evaluation);
    setShowDetailsModal(true);
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = evaluations.length;
    const published = evaluations.filter(e => (e.course?.status ?? '').toLowerCase() === 'published').length;
    const totalSubmissions = evaluations.reduce((sum, e) => sum + (e.statistics?.totalSubmissions ?? 0), 0);
    const totalPassed = evaluations.reduce((sum, e) => sum + (e.statistics?.passedCount ?? e.statistics?.passedStudents ?? 0), 0);
    const averagePassRate = totalSubmissions > 0 ? (totalPassed / totalSubmissions) * 100 : 0;

    return {
      total,
      published,
      totalSubmissions,
      totalPassed,
      averagePassRate: averagePassRate.toFixed(1),
    };
  }, [evaluations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark"></div>
      </div>
    );
  }

  const columns = [
    {
      key: 'course',
      label: 'Cours',
      sortable: true,
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {evaluation.course?.title || 'Cours sans titre'}
            </div>
            <div className="text-xs text-gray-500">
              {(evaluation.course as any)?.instructor_name || 'Instructeur inconnu'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'evaluation',
      label: 'Évaluation',
      sortable: true,
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{evaluation.title}</div>
          <div className="text-xs text-gray-500 mt-1">
            {evaluation.statistics?.totalQuestions || 0} question{evaluation.statistics?.totalQuestions !== 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => 
        getStatusBadge(evaluation.course?.status || '')
    },
    {
      key: 'statistics',
      label: 'Statistiques',
      sortable: false,
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => (
        <div className="text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{evaluation.statistics?.totalSubmissions || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">{evaluation.statistics?.passedCount || evaluation.statistics?.passedStudents || 0}</span>
            </div>
          </div>
          {evaluation.statistics?.totalSubmissions > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Taux de réussite: {((evaluation.statistics.passedCount || evaluation.statistics.passedStudents || 0) / (evaluation.statistics.totalSubmissions || 1) * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )
    },
    {
      key: 'passing_score',
      label: 'Score requis',
      sortable: true,
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {evaluation.passingScore || evaluation.passing_score || 'N/A'}%
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, evaluation: InstructorFinalEvaluationEntry) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetails(evaluation)}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* En-tête moderne */}
      <div className="relative bg-gradient-to-br from-mdsc-blue-dark via-[#0C3C5C] to-[#1a4d6b] rounded-xl p-8 text-white shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Award className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Évaluations Finales</h1>
            </div>
            <p className="text-gray-200 text-base max-w-2xl">
              Gérez et consultez toutes les évaluations finales des cours de la plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total évaluations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Publiées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Soumissions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Taux de réussite</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averagePassRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-mdsc-blue-dark transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un cours, évaluation, instructeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-mdsc-blue-dark transition-all w-full bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="pending">En attente</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des évaluations */}
      <DataTable
        columns={columns}
        data={filteredEvaluations}
        searchable={false}
        filterable={false}
        pagination={true}
        pageSize={10}
      />

      {/* Modal de détails */}
      {showDetailsModal && selectedEvaluation && (
        <Modal
          isOpen
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvaluation(null);
          }}
          title={`Détails de l'évaluation - ${selectedEvaluation.title}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Informations du cours */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Informations du cours</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Titre:</span>
                  <p className="font-medium text-gray-900">{selectedEvaluation.course?.title || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Instructeur:</span>
                  <p className="font-medium text-gray-900">{(selectedEvaluation.course as any)?.instructor_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut:</span>
                  <div className="mt-1">{getStatusBadge(selectedEvaluation.course?.status || '')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Score requis:</span>
                  <p className="font-medium text-gray-900">{selectedEvaluation.passingScore || selectedEvaluation.passing_score || 'N/A'}%</p>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">Soumissions</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{selectedEvaluation.statistics?.totalSubmissions || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Réussies</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{selectedEvaluation.statistics?.passedCount || selectedEvaluation.statistics?.passedStudents || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm font-medium">Taux de réussite</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {selectedEvaluation.statistics?.totalSubmissions > 0
                    ? ((selectedEvaluation.statistics.passedCount || selectedEvaluation.statistics.passedStudents || 0) / (selectedEvaluation.statistics.totalSubmissions || 1) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            {/* Informations supplémentaires */}
            {(selectedEvaluation as any).description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{(selectedEvaluation as any).description}</p>
              </div>
            )}

            {/* Liens */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {selectedEvaluation.links?.detail && (
                <a
                  href={selectedEvaluation.links.detail}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-mdsc-blue-dark text-white rounded-lg hover:bg-mdsc-blue-primary transition-colors text-sm font-medium"
                >
                  Voir l'évaluation
                </a>
              )}
              {selectedEvaluation.links?.edit && (
                <a
                  href={selectedEvaluation.links.edit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Modifier
                </a>
              )}
              {selectedEvaluation.course?.detailUrl && (
                <a
                  href={selectedEvaluation.course.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Voir le cours
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

