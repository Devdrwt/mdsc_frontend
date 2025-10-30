'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Star,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/authStore';
import { courseService, Course } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  enrolledCourses: number;
  completedCourses: number;
  currentLevel: string;
  totalPoints: number;
  lastActivity: string;
  progress: number;
  averageGrade: number;
  status: 'active' | 'inactive' | 'suspended';
}

export default function StudentManagement() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sort, setSort] = useState<'enrolled_at' | 'progress' | 'last_accessed_at' | 'completed_at' | 'first_name' | 'last_name'>('last_accessed_at');
  const [serverPagination, setServerPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({ page: 1, limit: 10, total: 0, pages: 1 });

  useEffect(() => {
    const loadStudents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Simulation des données d'étudiants - dans un vrai projet, on récupérerait depuis l'API
        const mockStudents: Student[] = [
          {
            id: '1',
            firstName: 'Marie',
            lastName: 'Koné',
            email: 'marie.kone@example.com',
            enrolledCourses: 3,
            completedCourses: 1,
            currentLevel: 'Intermédiaire',
            totalPoints: 450,
            lastActivity: '2024-01-15',
            progress: 75,
            averageGrade: 4.2,
            status: 'active'
          },
          {
            id: '2',
            firstName: 'Jean',
            lastName: 'Traoré',
            email: 'jean.traore@example.com',
            enrolledCourses: 2,
            completedCourses: 2,
            currentLevel: 'Avancé',
            totalPoints: 680,
            lastActivity: '2024-01-14',
            progress: 90,
            averageGrade: 4.5,
            status: 'active'
          },
          {
            id: '3',
            firstName: 'Fatou',
            lastName: 'Diabaté',
            email: 'fatou.diabate@example.com',
            enrolledCourses: 4,
            completedCourses: 0,
            currentLevel: 'Débutant',
            totalPoints: 120,
            lastActivity: '2024-01-10',
            progress: 25,
            averageGrade: 3.8,
            status: 'active'
          },
          {
            id: '4',
            firstName: 'Paul',
            lastName: 'N\'Guessan',
            email: 'paul.nguessan@example.com',
            enrolledCourses: 1,
            completedCourses: 1,
            currentLevel: 'Expert',
            totalPoints: 850,
            lastActivity: '2024-01-05',
            progress: 100,
            averageGrade: 4.8,
            status: 'inactive'
          },
          {
            id: '5',
            firstName: 'Aminata',
            lastName: 'Ouattara',
            email: 'aminata.ouattara@example.com',
            enrolledCourses: 2,
            completedCourses: 1,
            currentLevel: 'Intermédiaire',
            totalPoints: 320,
            lastActivity: '2024-01-12',
            progress: 60,
            averageGrade: 4.0,
            status: 'active'
          }
        ];

        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [user]);

  useEffect(() => {
    let filtered = students;

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    // Filtrage par cours
    if (selectedCourse !== 'all') {
      // Dans un vrai projet, on filtrerait par cours spécifique
      filtered = filtered;
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterStatus, selectedCourse]);

  // Charger les cours de l'instructeur
  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;
      try {
        const list = await courseService.getInstructorCourses(user.id.toString(), { status: 'all', page: 1, limit: 100 });
        const arr = Array.isArray(list) ? list : (list as any)?.data || [];
        setCourses(arr);
        if (!selectedCourseId && arr[0]?.id) setSelectedCourseId(String(arr[0].id));
      } catch (e) {
        console.error('Erreur chargement cours', e);
      }
    };
    loadCourses();
  }, [user]);

  // Charger les inscriptions (pagination serveur)
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!selectedCourseId) return;
      try {
        setLoading(true);
        const { data, pagination } = await EnrollmentService.getCourseEnrollments(selectedCourseId, {
          page,
          limit,
          search: searchTerm,
          status: filterStatus,
          sort: 'last_accessed_at',
          order: 'DESC',
        });
        const mapped: Student[] = data.map((r: any) => ({
          id: String(r.user_id),
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          avatar: r.avatar_url || undefined,
          enrolledCourses: 0,
          completedCourses: r.status === 'completed' ? 1 : 0,
          currentLevel: '',
          totalPoints: 0,
          lastActivity: r.last_accessed_at || r.enrolled_at,
          progress: Math.round(Number(r.progress_percentage || 0)),
          averageGrade: Number(r.avg_quiz_score || 0) / 20 * 5 || 0,
          status: 'active',
        }));
        setStudents(mapped);
        setFilteredStudents(mapped);
        setServerPagination(pagination);
      } catch (e) {
        console.error('Erreur chargement inscriptions', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [selectedCourseId, page, limit, searchTerm, filterStatus]);

  // Pagination client (en attendant l'API paginée)
  const total = serverPagination.total || filteredStudents.length;
  const totalPages = serverPagination.pages || Math.max(1, Math.ceil(total / limit));
  const pagedStudents = filteredStudents;

  const exportCsv = () => {
    const rows = [
      ['id', 'firstName', 'lastName', 'email', 'enrolledCourses', 'completedCourses', 'progress', 'averageGrade', 'status'],
      ...filteredStudents.map(s => [s.id, s.firstName, s.lastName, s.email, String(s.enrolledCourses), String(s.completedCourses), String(s.progress), String(s.averageGrade), s.status])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Inactif
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspendu
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

  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return 'text-green-600';
    if (grade >= 4.0) return 'text-yellow-600';
    if (grade >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Gestion des Étudiants 👥</h1>
        <p className="text-yellow-100">
          Suivez la progression de vos étudiants et gérez leurs parcours d'apprentissage.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total étudiants</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
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
                {students.filter(s => s.status === 'active').length}
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
                {students.reduce((acc, s) => acc + s.completedCourses, 0)}
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
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres, recherche et export */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <select
                value={selectedCourseId}
                onChange={(e) => { setSelectedCourseId(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="">Sélectionner un cours</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="all">Tous les étudiants</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>
            <button onClick={exportCsv} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {pagedStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-mdsc-gold rounded-full flex items-center justify-center text-white font-semibold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                    </div>
                    
                    {/* Informations de l'étudiant */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        {getStatusBadge(student.status)}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{student.email}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{student.enrolledCourses} cours inscrits</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4" />
                          <span>{student.completedCourses} terminés</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span className={getGradeColor(student.averageGrade)}>
                            {student.averageGrade.toFixed(1)}/5
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Dernière activité: {student.lastActivity}</span>
                        </div>
                      </div>

                      {/* Progression */}
                      <div className="max-w-md">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progression globale</span>
                          <span className="font-medium">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(student.progress)}`}
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
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
                : 'Vous n\'avez aucun étudiant inscrit à vos cours.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Page {page} / {totalPages} · {total} étudiants
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 disabled:opacity-50"
            >
              Suivant
            </button>
            <select
              value={limit}
              onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
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
