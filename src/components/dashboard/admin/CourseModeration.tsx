'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Star,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Award,
  Loader2,
} from 'lucide-react';
import Modal from '../../ui/Modal';
import DataTable from '../shared/DataTable';
import { adminService } from '../../../lib/services/adminService';
import { courseService } from '../../../lib/services/courseService';
import toast from '../../../lib/utils/toast';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorEmail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  studentsEnrolled: number;
  averageRating: number;
  totalLessons: number;
  duration: string;
  price: number;
  tags: string[];
  isPublic: boolean;
  hasCertificate: boolean;
}

const toDisplayLevel = (raw?: string): 'Débutant' | 'Intermédiaire' | 'Avancé' => {
  if (!raw) return 'Débutant';
  const value = raw.toLowerCase();
  if (['intermediate', 'intermédiaire'].includes(value)) return 'Intermédiaire';
  if (['advanced', 'avancé'].includes(value)) return 'Avancé';
  return 'Débutant';
};

const toApiLevel = (display: 'Débutant' | 'Intermédiaire' | 'Avancé'): string => {
  switch (display) {
    case 'Intermédiaire':
      return 'intermediate';
    case 'Avancé':
      return 'advanced';
    default:
      return 'beginner';
  }
};

export default function CourseModeration() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'published'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'Débutant' | 'Intermédiaire' | 'Avancé'>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
const [editCourse, setEditCourse] = useState<Course | null>(null);
const [editForm, setEditForm] = useState({
  title: '',
  shortDescription: '',
  description: '',
  level: 'Débutant' as 'Débutant' | 'Intermédiaire' | 'Avancé',
  price: 0,
  isPublished: false,
});
const [editLoading, setEditLoading] = useState(false);
const [editSaving, setEditSaving] = useState(false);

const loadCourses = useCallback(async () => {
  try {
    setLoading(true);

    const response = await adminService.getAllCourses();
    const coursesData: any[] = response.courses || [];

    const apiCourses: Course[] = coursesData.map((course: any) => ({
      id: String(course.id || course.course_id || ''),
      title: course.title || course.course_title || 'Sans titre',
      description: course.description || course.short_description || '',
      instructor:
        course.instructor_name ||
        (course.instructor_first_name && course.instructor_last_name
          ? `${course.instructor_first_name} ${course.instructor_last_name}`
          : course.instructor || 'Instructeur inconnu'),
      instructorEmail: course.instructor_email || course.instructorEmail || '',
      category: course.category_name || course.category || 'Non catégorisé',
      level: toDisplayLevel(course.level || course.difficulty),
      status: course.status || 'draft',
      createdAt: course.created_at || course.createdAt || new Date().toISOString(),
      updatedAt: course.updated_at || course.updatedAt || course.created_at || new Date().toISOString(),
      studentsEnrolled: course.students_enrolled || course.enrollment_count || course.studentsEnrolled || 0,
      averageRating: course.average_rating || course.rating || course.averageRating || 0,
      totalLessons: course.total_lessons || course.lessons_count || course.totalLessons || 0,
      duration:
        course.duration || course.duration_minutes
          ? `${Math.round((course.duration_minutes || course.duration || 0) / 60)} heures`
          : 'Non spécifié',
      price: course.price || course.price_amount || 0,
      tags: course.tags || course.tag_names || [],
      isPublic:
        course.is_public !== undefined ? course.is_public : course.isPublic !== undefined ? course.isPublic : true,
      hasCertificate:
        course.has_certificate !== undefined
          ? course.has_certificate
          : course.hasCertificate !== undefined
          ? course.hasCertificate
          : false,
    }));

    setCourses(apiCourses);
    setFilteredCourses(apiCourses);
  } catch (error: any) {
    console.error('Erreur lors du chargement des cours:', error);

    if (error.status !== 404) {
      toast.error('Erreur', error.message || 'Impossible de charger les cours depuis la base de données');
    } else {
      console.warn('⚠️ [CourseModeration] Endpoint non disponible, affichage d\'une liste vide');
    }

    setCourses([]);
    setFilteredCourses([]);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  loadCourses();
}, [loadCourses]);

  useEffect(() => {
    let filtered = courses;

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(course => course.status === filterStatus);
    }

    // Filtrage par niveau
    if (filterLevel !== 'all') {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterStatus, filterLevel]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Publié
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Approuvé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            En attente
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm">
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Brouillon
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Rejeté
          </span>
        );
      default:
        return null;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Débutant':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm">
            Débutant
          </span>
        );
      case 'Intermédiaire':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200 shadow-sm">
            Intermédiaire
          </span>
        );
      case 'Avancé':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 shadow-sm">
            Avancé
          </span>
        );
      default:
        return null;
    }
  };

const handleCourseAction = async (courseId: string, action: string) => {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return;

  switch (action) {
    case 'view':
      setViewCourse(course);
      break;
    case 'edit':
      try {
        setEditCourse(course);
        setEditLoading(true);
        const details = await adminService.getCourseForApproval(courseId);
        setEditForm({
          title: details.title || course.title,
          shortDescription: details.short_description || details.shortDescription || course.description || '',
          description: details.description || course.description || '',
          level: toDisplayLevel(details.level || details.difficulty || course.level),
          price: Number(details.price ?? course.price ?? 0),
          isPublished:
            details.is_published !== undefined
              ? Boolean(details.is_published)
              : ['published', 'approved'].includes((details.status || course.status || '').toLowerCase()),
        });
      } catch (error: any) {
        console.error('Erreur lors du chargement du cours:', error);
        toast.error('Erreur', error.message || 'Impossible de charger les détails du cours.');
        setEditCourse(null);
      } finally {
        setEditLoading(false);
      }
      break;
    case 'approve':
    case 'reject':
      console.log(`Action ${action} sur le cours ${courseId}`);
      toast.info('Fonctionnalité à venir', 'La modération avancée sera bientôt disponible.');
      break;
    default:
      console.log(`Action ${action} sur le cours ${courseId}`);
  }
};

  const handleBulkAction = (action: string) => {
    console.log(`Action en masse ${action} sur ${selectedCourses.length} cours`);
    // Implémenter les actions en masse
  };

const handleCloseEditModal = () => {
  setEditCourse(null);
  setEditLoading(false);
  setEditSaving(false);
  setEditForm({
    title: '',
    shortDescription: '',
    description: '',
    level: 'Débutant',
    price: 0,
    isPublished: false,
  });
};

const handleSaveEdit = async () => {
  if (!editCourse) return;
  try {
    setEditSaving(true);
    const payload = {
      title: editForm.title,
      shortDescription: editForm.shortDescription,
      description: editForm.description,
      level: toApiLevel(editForm.level),
      price: Number.isFinite(editForm.price) ? editForm.price : 0,
      isPublished: editForm.isPublished,
    };
    await courseService.updateCourse(editCourse.id, payload);
    toast.success('Cours mis à jour', 'Les modifications ont été enregistrées avec succès.');
    handleCloseEditModal();
    await loadCourses();
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du cours:', error);
    toast.error('Erreur', error.message || 'Impossible de mettre à jour le cours.');
  } finally {
    setEditSaving(false);
  }
};

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
      render: (value: any, course: Course) => (
        <div className="text-sm font-medium text-gray-900 line-clamp-2">
          {course.title}
        </div>
      )
    },
    {
      key: 'level',
      label: 'Niveau',
      sortable: true,
      render: (value: any, course: Course) => getLevelBadge(course.level)
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value: any, course: Course) => getStatusBadge(course.status)
    },
    {
      key: 'metrics',
      label: 'Métriques',
      sortable: true,
      render: (value: any, course: Course) => (
        <div className="text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{course.studentsEnrolled}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{course.averageRating > 0 ? course.averageRating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {course.totalLessons} leçons • {course.duration}
          </div>
        </div>
      )
    },
    {
      key: 'pricing',
      label: 'Tarification',
      sortable: true,
      render: (value: any, course: Course) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {course.price === 0 ? 'Gratuit' : `${course.price.toLocaleString()} FCFA`}
          </div>
          <div className="text-xs text-gray-500">
            {course.isPublic ? 'Public' : 'Privé'}
          </div>
        </div>
      )
    },
    {
      key: 'created',
      label: 'Créé le',
      sortable: true,
      render: (value: any, course: Course) => (
        <div className="text-sm text-gray-600">
          {new Date(course.createdAt).toLocaleDateString('fr-FR')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, course: Course) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCourseAction(course.id, 'view')}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Voir le cours"
          >
            <Eye className="h-4 w-4" />
          </button>
          {course.status === 'pending' && (
            <>
              <button
                onClick={() => handleCourseAction(course.id, 'approve')}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="Approuver"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCourseAction(course.id, 'reject')}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Rejeter"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleCourseAction(course.id, 'edit')}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* En-tête moderne avec gradient et ombre */}
      <div className="relative bg-gradient-to-br from-mdsc-blue-dark via-[#0C3C5C] to-[#1a4d6b] rounded-xl p-8 text-white shadow-2xl overflow-hidden">
        {/* Effet de brillance animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Modération des Cours</h1>
            </div>
            <p className="text-gray-200 text-base max-w-2xl">
              Validez, modérez et gérez tous les cours de votre plateforme d'apprentissage avec des outils puissants et intuitifs.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleBulkAction('export')}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                Exporter
              </span>
            </button>
            <button
              onClick={() => handleBulkAction('approve')}
              className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approuver en masse
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total cours</p>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'pending').length}
              </p>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Publiés</p>
              <p className="text-3xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'published').length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejetés</p>
              <p className="text-3xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Brouillons</p>
              <p className="text-3xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche avec design moderne */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-mdsc-blue-dark transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un cours, instructeur, catégorie..."
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
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium"
              >
                <option value="all">Tous les niveaux</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cours */}
      <DataTable
        columns={columns}
        data={filteredCourses}
        searchable={false}
        filterable={false}
        pagination={true}
        pageSize={10}
      />

      {/* Modale de visualisation */}
      {viewCourse && (
        <Modal
          isOpen
          onClose={() => setViewCourse(null)}
          title="Détails du cours"
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{viewCourse.title}</h3>
                <p className="text-sm text-gray-500">{viewCourse.instructor}</p>
              </div>
              <span className="text-sm text-gray-400">
                Créé le {new Date(viewCourse.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Résumé</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {viewCourse.description || 'Aucune description fournie.'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Niveau</span>
                  {getLevelBadge(viewCourse.level)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Statut</span>
                  {getStatusBadge(viewCourse.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Catégorie</span>
                  <span className="text-gray-800 font-medium">{viewCourse.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Prix</span>
                  <span className="text-gray-800 font-medium">
                    {viewCourse.price === 0 ? 'Gratuit' : `${viewCourse.price.toLocaleString()} FCFA`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Durée</span>
                  <span className="text-gray-800 font-medium">{viewCourse.duration}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>Inscrits</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {viewCourse.studentsEnrolled.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2 text-gray-500">
                  <Star className="h-4 w-4" />
                  <span>Note moyenne</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {viewCourse.averageRating > 0 ? viewCourse.averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="h-4 w-4" />
                  <span>Leçons</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">{viewCourse.totalLessons}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Mis à jour</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(viewCourse.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale d’édition */}
      {editCourse && (
        <Modal
          isOpen
          onClose={handleCloseEditModal}
          title={`Éditer le cours · ${editCourse.title}`}
          size="xl"
        >
          {editLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-mdsc-blue-dark" />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du cours
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau
                  </label>
                  <select
                    value={editForm.level}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, level: e.target.value as typeof prev.level }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description courte
                  </label>
                  <textarea
                    value={editForm.shortDescription}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description principale
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Publication</p>
                  <p className="text-xs text-gray-500">
                    Permettre aux apprenants de voir ce cours dans le catalogue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm((prev) => ({ ...prev, isPublished: !prev.isPublished }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    editForm.isPublished ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      editForm.isPublished ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={editSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-mdsc-blue-dark px-5 py-2 text-sm font-medium text-white hover:bg-mdsc-blue-primary transition disabled:opacity-60"
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enregistrement…</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
