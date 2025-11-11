'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  Eye,
  Edit,
  Users,
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  EvaluationService,
  InstructorFinalEvaluationEntry,
} from '../../../lib/services/evaluationService';

type StatusFilter =
  | 'all'
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'published';

export default function EvaluationManagement() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<InstructorFinalEvaluationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
      loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await EvaluationService.getInstructorFinalEvaluations();
      setEvaluations(response.evaluations);
    } catch (err: any) {
      console.error('Erreur chargement évaluations finales instructeur:', err);
      setEvaluations([]);
      setError(
        err?.message ||
          "Impossible de récupérer les évaluations finales pour l'instant."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return evaluations.filter((evaluation) => {
      const courseStatus = (evaluation.course?.status ?? '').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || courseStatus === statusFilter;

      const matchesSearch =
        !term ||
        evaluation.title.toLowerCase().includes(term) ||
        evaluation.course.title.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [evaluations, searchTerm, statusFilter]);

  const totalEvaluations = evaluations.length;
  const publishedCount = evaluations.filter(
    (evaluation) => (evaluation.course.status ?? '').toLowerCase() === 'published'
  ).length;
  const totalSubmissions = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.statistics.totalSubmissions ?? 0),
    0
  );
  const totalPassed = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.statistics.passedCount ?? 0),
    0
  );
  const successRate = totalSubmissions
    ? Math.round((totalPassed / totalSubmissions) * 100)
    : 0;

  const formatStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publié
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvé
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejeté
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Brouillon
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'final_exam':
        return 'Examen final';
      case 'exam':
        return 'Examen';
      case 'final':
      default:
        return 'Évaluation finale';
    }
  };

  const handleView = (evaluation: InstructorFinalEvaluationEntry) => {
    const courseId = evaluation.course?.id;
    if (courseId) {
      router.push(`/instructor/courses/${courseId}?tab=evaluations`);
      return;
    }
    if (evaluation.links?.detail) {
      router.push(evaluation.links.detail);
      return;
    }
    console.log('Voir évaluation finale', evaluation.id);
  };

  const handleEdit = (evaluation: InstructorFinalEvaluationEntry) => {
    const courseId = evaluation.course?.id;
    if (courseId) {
      router.push(`/instructor/courses/${courseId}?tab=evaluations`);
      return;
    }
    if (evaluation.links?.edit) {
      router.push(evaluation.links.edit);
      return;
    }
    console.log('Modifier évaluation finale', evaluation.id);
  };

  return (
    <div className="space-y-6">
        <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Évaluations finales
        </h2>
        <p className="text-gray-600 mt-1">
          Retrouvez toutes vos évaluations finales par cours.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total"
          value={totalEvaluations}
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          label="Publiées"
          value={publishedCount}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          label="Soumissions"
          value={totalSubmissions}
          icon={<Users className="h-6 w-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          label="Taux de réussite"
          value={`${successRate}%`}
          icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une évaluation ou un cours..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
                <option value="pending_approval">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
            <button
              onClick={loadEvaluations}
              className="text-sm text-mdsc-blue-primary hover:underline"
              disabled={loading}
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    Chargement des évaluations...
                  </td>
                </tr>
              ) : filteredEvaluations.length > 0 ? (
                filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                          <ClipboardList className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {evaluation.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {evaluation.course.title}
                          </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getTypeLabel(evaluation.type)}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      {formatStatusBadge(evaluation.course.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {evaluation.statistics.totalSubmissions}
                      </div>
                      {evaluation.statistics.totalSubmissions > 0 && (
                        <div className="text-xs text-gray-500">
                          {evaluation.statistics.passedCount ?? evaluation.statistics.passedStudents ?? 0} validée(s)
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleView(evaluation)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          title="Voir"
                        >
                        <Eye className="h-4 w-4" />
                      </button>
                        <button
                          onClick={() => handleEdit(evaluation)}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900"
                          title="Modifier"
                        >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Aucune évaluation finale
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Les évaluations finales enregistrées apparaîtront ici.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>{icon}</div>
        </div>
    </div>
  );
}

function ClockIcon() {
  return <svg className="h-3 w-3 mr-1 text-yellow-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12.5a.75.75 0 00-1.5 0v4.19l-2.22 2.22a.75.75 0 101.06 1.06l2.4-2.39c.18-.18.28-.43.28-.68V5.5z" clipRule="evenodd" /></svg>;
}
