'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  MessageSquare,
  Eye,
  Award,
  Clock,
  TrendingUp,
  CheckCircle,
  Star,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/authStore';
import {
  InstructorService,
  InstructorStudentEntry,
  InstructorStudentStatus,
} from '../../../lib/services/instructorService';
import toast from '../../../lib/utils/toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  courseTitle?: string;
  enrolledAt?: string;
  currentLevel: string;
  lastActivity?: string;
  progress: number;
  averageGrade: number;
  status: 'active' | 'inactive' | 'completed';
}

interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  avgProgress: number;
}

interface CourseOption {
  id: string;
  title: string;
}

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const fallbackId = () => `student-${Math.random().toString(36).slice(2, 10)}`;

export default function StudentManagement() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InstructorStudentStatus>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [sort, setSort] = useState<'enrolled_at' | 'progress' | 'last_activity' | 'last_login'>('last_activity');
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [stats, setStats] = useState<StudentsStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    if (!user) return;

    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await InstructorService.getStudents({
          page,
          limit,
          search: searchTerm || undefined,
          course_id: selectedCourseId || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          sort,
          order,
        });

        const mapped: Student[] = response.students.map((entry: InstructorStudentEntry) => {
          const studentInfo = entry.student ?? {};
          const courseInfo = entry.course ?? {};
          const progress = safeNumber(entry.progress_percentage);
          const status: Student['status'] = entry.completed_at
            ? 'completed'
            : entry.is_active
            ? 'active'
            : 'inactive';

          return {
            id: String(studentInfo.id ?? entry.enrollment_id ?? fallbackId()),
            firstName: studentInfo.first_name ?? '',
            lastName: studentInfo.last_name ?? '',
            email: studentInfo.email ?? '',
            avatar: studentInfo.profile_picture_url ?? studentInfo.profile_picture ?? undefined,
            courseTitle: courseInfo.title ?? undefined,
            enrolledAt: entry.enrolled_at ?? undefined,
            currentLevel: courseInfo.language ?? '',
            lastActivity:
              entry.last_accessed_at ?? studentInfo.last_login_at ?? entry.enrolled_at ?? undefined,
            progress: Math.round(progress),
            averageGrade: 0,
            status,
          };
        });

        setStudents(mapped);
        setPagination(response.pagination);
        setStats({
          totalStudents: safeNumber(response.stats?.total_students),
          activeStudents: safeNumber(response.stats?.active_students),
          completedStudents: safeNumber(response.stats?.completed_students),
          avgProgress: safeNumber(response.stats?.avg_progress),
        });

        if (Array.isArray(response.filters?.courses)) {
          setCourses(
            response.filters.courses.map((course) => ({
              id: String(course.id),
              title: course.title,
            }))
          );
        }
      } catch (e: any) {
        console.error('Erreur chargement étudiants', e);
        setStudents([]);
        setPagination({ page: 1, limit, total: 0, pages: 1 });
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          completedStudents: 0,
          avgProgress: 0,
        });

        const isAuthError =
          e?.status === 403 ||
          e?.message?.includes('autorisé') ||
          e?.message?.includes('Non autorisé') ||
          e?.message?.includes('Accès interdit') ||
          e?.message?.includes('Permissions insuffisantes');

        if (isAuthError) {
          toast.error(
            'Accès refusé',
            e.message || 'Vous n\'êtes pas autorisé à consulter les inscrits de ce cours'
          );
        } else {
          toast.error('Erreur', 'Impossible de charger les inscriptions. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [user, page, limit, searchTerm, filterStatus, selectedCourseId, sort, order]);

  const total = pagination.total || students.length;
  const totalPages = pagination.pages || Math.max(1, Math.ceil(total / limit));

  const averageProgress = useMemo(() => {
    if (stats.avgProgress) return Math.round(stats.avgProgress);
    if (students.length === 0) return 0;
    const sum = students.reduce((acc, student) => acc + student.progress, 0);
    return Math.round(sum / students.length);
  }, [students, stats.avgProgress]);

  const exportCsv = () => {
    const rows = [
      [
        'id',
        'firstName',
        'lastName',
        'email',
        'courseTitle',
        'enrolledAt',
        'progress',
        'status',
        'lastActivity',
      ],
      ...students.map((student) => [
        student.id,
        student.firstName,
        student.lastName,
        student.email,
        student.courseTitle ?? '',
        student.enrolledAt ?? '',
        String(student.progress),
        student.status,
        student.lastActivity ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Award className="h-3 w-3 mr-1" />
            Terminé
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Inactif
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleSortToggle = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Gestion des Étudiants 👥</h1>
        <p className="text-yellow-100">
          Suivez la progression de vos étudiants et gérez leurs parcours d'apprentissage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total étudiants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeStudents || students.filter((student) => student.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cours complétés</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedStudents || students.filter((student) => student.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Progression moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{averageProgress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="">Tous les cours</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as any);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="all">Tous les étudiants</option>
                <option value="active">Actifs</option>
                <option value="completed">Terminés</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="last_activity">Dernière activité</option>
                <option value="enrolled_at">Date d'inscription</option>
                <option value="progress">Progression</option>
                <option value="last_login">Dernière connexion</option>
              </select>
              <button
                onClick={handleSortToggle}
                className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                title="Changer l'ordre de tri"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {order === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>

            <button onClick={exportCsv} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {students.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {students.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-mdsc-gold rounded-full flex items-center justify-center text-white font-semibold">
                        {`${student.firstName?.charAt(0) ?? ''}${student.lastName?.charAt(0) ?? ''}` || 'É'}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        {getStatusBadge(student.status)}
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{student.email}</p>

                      <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{student.courseTitle ?? 'Cours'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Inscription: {formatDate(student.enrolledAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span className="text-gray-400">—/5</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Dernière activité: {formatDate(student.lastActivity)}</span>
                        </div>
                      </div>

                      <div className="max-w-md">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progression globale</span>
                          <span className="font-medium">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(student.progress)}`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.location.href = `/dashboard/instructor/students/${student.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Voir le profil"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.location.href = `mailto:${student.email}`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Envoyer un email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.location.href = `/dashboard/instructor/messages?student=${student.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Envoyer un message"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun étudiant trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Aucun étudiant ne correspond à vos critères de recherche.'
                : 'Vous n\'avez aucun étudiant inscrit à vos cours.'}
            </p>
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Page {page} / {totalPages} · {total} étudiants
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 disabled:opacity-50"
            >
              Suivant
            </button>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="ml-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
