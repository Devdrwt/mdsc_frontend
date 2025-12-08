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
import ConfirmModal from '../../ui/ConfirmModal';
import DataTable from '../shared/DataTable';
import { adminService } from '../../../lib/services/adminService';
import { CourseService } from '../../../lib/services/courseService';
import toast from '../../../lib/utils/toast';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorEmail: string;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  studentsEnrolled: number;
  averageRating: number;
  totalLessons: number;
  duration: string;
  price: number;
  currency?: string;
  tags: string[];
  isPublic: boolean;
  hasCertificate: boolean;
}


export default function CourseModeration() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'published'>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
const [editCourse, setEditCourse] = useState<Course | null>(null);
const [editForm, setEditForm] = useState({
  title: '',
  shortDescription: '',
  description: '',
  price: 0,
  isPublished: false,
});
const [editLoading, setEditLoading] = useState(false);
const [editSaving, setEditSaving] = useState(false);
const [bulkProcessing, setBulkProcessing] = useState(false);
const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

const loadCourses = useCallback(async () => {
  try {
    setLoading(true);

    const response = await adminService.getAllCourses();
    let coursesData: any[] = response.courses || [];

    // Log de débogage pour vérifier les champs de prix et métriques
    if (coursesData.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('[CourseModeration] 🔍 Exemple de données de cours (premier cours):', {
        courseId: coursesData[0].id,
        courseTitle: coursesData[0].title,
        priceFields: {
          price: coursesData[0].price,
          price_amount: coursesData[0].price_amount,
          pricing: coursesData[0].pricing,
          course_price: coursesData[0].course_price,
          pricing_info: coursesData[0].pricing_info,
          allPriceKeys: Object.keys(coursesData[0]).filter(key => key.toLowerCase().includes('price') || key.toLowerCase().includes('pricing'))
        },
        metricsFields: {
          students_enrolled: coursesData[0].students_enrolled,
          enrollment_count: coursesData[0].enrollment_count,
          studentsEnrolled: coursesData[0].studentsEnrolled,
          average_rating: coursesData[0].average_rating,
          rating: coursesData[0].rating,
          averageRating: coursesData[0].averageRating,
          total_lessons: coursesData[0].total_lessons,
          lessons_count: coursesData[0].lessons_count,
          totalLessons: coursesData[0].totalLessons,
          allMetricsKeys: Object.keys(coursesData[0]).filter(key => 
            key.toLowerCase().includes('enrollment') || 
            key.toLowerCase().includes('student') || 
            key.toLowerCase().includes('rating') || 
            key.toLowerCase().includes('lesson')
          )
        },
        allKeys: Object.keys(coursesData[0])
      });
    }

    // Enrichir les données avec les détails complets si les métriques ou le prix manquent
    // On fait des appels parallèles pour récupérer les détails manquants (limité à 10 cours à la fois pour éviter la surcharge)
    const coursesToEnrich = coursesData.filter((course: any) => {
      const needsEnrichment = (!course.price && course.price !== 0) || 
                              (!course.enrollment_count && course.enrollment_count !== 0) || 
                              (!course.average_rating && course.average_rating !== 0) || 
                              (!course.total_lessons && course.total_lessons !== 0);
      return needsEnrichment && course.id;
    });

    if (coursesToEnrich.length > 0) {
      console.log(`[CourseModeration] 🔄 Enrichissement de ${coursesToEnrich.length} cours avec des données manquantes...`);
      
      // Limiter à 10 cours à la fois pour éviter la surcharge
      const coursesToEnrichBatch = coursesToEnrich.slice(0, 10);
      const enrichedCoursesMap = new Map();
      
      await Promise.all(
        coursesToEnrichBatch.map(async (course: any) => {
          try {
            // Récupérer les détails complets du cours
            const courseDetails = await CourseService.getCourseById(course.id);
            const detailsAny = courseDetails as any;
            
            // Fusionner les données enrichies avec les données de base
            enrichedCoursesMap.set(course.id, {
              // Prix
              price: course.price ?? detailsAny.price ?? detailsAny.price_amount ?? 0,
              currency:
                course.currency ??
                detailsAny.currency ??
                detailsAny.currency_code ??
                detailsAny.price_currency ??
                'FCFA',
              // Métriques
              enrollment_count: course.enrollment_count ?? detailsAny.enrollment_count ?? detailsAny.enrollmentCount ?? detailsAny.studentsEnrolled ?? 0,
              average_rating: course.average_rating ?? detailsAny.average_rating ?? detailsAny.rating ?? detailsAny.averageRating ?? 0,
              total_lessons: course.total_lessons ?? detailsAny.total_lessons ?? detailsAny.lessons_count ?? detailsAny.totalLessons ?? 
                            (detailsAny.modules && Array.isArray(detailsAny.modules) 
                              ? detailsAny.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)
                              : 0),
              // Durée
              duration_minutes: course.duration_minutes ?? detailsAny.duration_minutes ?? detailsAny.duration ?? 0,
            });
          } catch (error) {
            console.warn(`[CourseModeration] ⚠️ Impossible d'enrichir le cours ${course.id}:`, error);
          }
        })
      );
      
      // Fusionner les données enrichies dans les cours
      coursesData = coursesData.map((course: any) => {
        const enriched = enrichedCoursesMap.get(course.id);
        if (enriched) {
          return { ...course, ...enriched };
        }
        return course;
      });
      
      console.log(`[CourseModeration] ✅ ${enrichedCoursesMap.size} cours enrichis avec succès`);
    }

    const apiCourses: Course[] = coursesData.map((course: any) => ({
      id: String(course.id || course.course_id || ''),
      title: course.title || course.course_title || 'Sans titre',
      description: course.description || course.short_description || '',
      instructor:
        course.instructor_name ||
        (course.instructor_first_name && course.instructor_last_name
          ? `${course.instructor_first_name} ${course.instructor_last_name}`
          : course.instructor || 'Formateur inconnu'),
      instructorEmail: course.instructor_email || course.instructorEmail || '',
      category: course.category_name || course.category || 'Non catégorisé',
      status: course.status || 'draft',
      createdAt: course.created_at || course.createdAt || new Date().toISOString(),
      updatedAt: course.updated_at || course.updatedAt || course.created_at || new Date().toISOString(),
      studentsEnrolled: (() => {
        // Vérifier toutes les variantes possibles du nombre d'utilisateurs inscrits
        const enrolledValue = course.students_enrolled || 
                             course.enrollment_count || 
                             course.enrollments_count ||
                             course.studentsEnrolled ||
                             course.students_count ||
                             (course.metrics && typeof course.metrics === 'object' ? course.metrics.enrollment_count : null) ||
                             0;
        const numEnrolled = typeof enrolledValue === 'number' ? enrolledValue : parseInt(String(enrolledValue)) || 0;
        return numEnrolled >= 0 ? numEnrolled : 0;
      })(),
      averageRating: (() => {
        // Vérifier toutes les variantes possibles de la note moyenne
        const ratingValue = course.average_rating || 
                           course.rating || 
                           course.averageRating ||
                           course.avg_rating ||
                           (course.metrics && typeof course.metrics === 'object' ? course.metrics.average_rating : null) ||
                           0;
        const numRating = typeof ratingValue === 'number' ? ratingValue : parseFloat(String(ratingValue)) || 0;
        return numRating >= 0 && numRating <= 5 ? numRating : 0;
      })(),
      totalLessons: (() => {
        // Vérifier toutes les variantes possibles du nombre total de leçons
        const lessonsValue = course.total_lessons || 
                            course.lessons_count || 
                            course.totalLessons ||
                            course.lesson_count ||
                            (course.metrics && typeof course.metrics === 'object' ? course.metrics.total_lessons : null) ||
                            (course.modules && Array.isArray(course.modules) 
                              ? course.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)
                              : null) ||
                            0;
        const numLessons = typeof lessonsValue === 'number' ? lessonsValue : parseInt(String(lessonsValue)) || 0;
        return numLessons >= 0 ? numLessons : 0;
      })(),
      duration:
        course.duration || course.duration_minutes
          ? `${Math.round((course.duration_minutes || course.duration || 0) / 60)} heures`
          : 'Non spécifié',
      price: (() => {
        // Vérifier toutes les variantes possibles du champ prix
        const priceValue = course.price || 
                          course.price_amount || 
                          course.pricing || 
                          course.course_price || 
                          (course.pricing_info && typeof course.pricing_info === 'object' ? course.pricing_info.amount : null) ||
                          0;
        // S'assurer que c'est un nombre valide
        const numPrice = typeof priceValue === 'number' ? priceValue : parseFloat(String(priceValue)) || 0;
        return numPrice >= 0 ? numPrice : 0;
      })(),
      currency:
        course.currency ||
        course.currency_code ||
        course.price_currency ||
        (course.pricing_info && typeof course.pricing_info === 'object' ? course.pricing_info.currency : null) ||
        'FCFA',
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
    setSelectedCourses((prev) =>
      prev.filter((id) => filtered.some((course) => course.id === id))
    );
  }, [courses, searchTerm, filterStatus]);

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getCoursesForActions = () => {
    if (selectedCourses.length === 0) {
      return filteredCourses;
    }
    return filteredCourses.filter((course) => selectedCourses.includes(course.id));
  };

  const exportCoursesToCsv = (dataset: Course[]) => {
    const headers = [
      'ID',
      'Titre',
      'Formateur',
      'Email formateur',
      'Catégorie',
      'Statut',
      'Inscrits',
      'Note moyenne',
      'Prix',
    ];
    const rows = dataset.map((course) => [
      `"${course.id}"`,
      `"${course.title}"`,
      `"${course.instructor}"`,
      `"${course.instructorEmail}"`,
      `"${course.category}"`,
      course.status,
      course.studentsEnrolled ?? 0,
      course.averageRating ?? 0,
      course.price ?? 0,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mdsc-cours-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkApprove = async () => {
    const dataset = getCoursesForActions().filter(
      (course) => course.status === 'pending'
    );
    if (dataset.length === 0) {
      toast.info('Aucun cours en attente', 'Sélectionnez des cours avec le statut "en attente".');
      return;
    }
    setBulkProcessing(true);
    try {
      await Promise.all(
        dataset.map((course) =>
          adminService.approveCourse(course.id, 'Approbation groupée via le dashboard')
        )
      );
      toast.success('Cours approuvés', `${dataset.length} cours validés.`);
      setSelectedCourses([]);
      await loadCourses();
    } catch (error: any) {
      console.error('Erreur lors de l’approbation groupée:', error);
      toast.error('Erreur', error?.message || 'Impossible d’approuver certains cours.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCourses = () => {
    const dataset = getCoursesForActions();
    if (dataset.length === 0) {
      toast.info('Aucun cours à exporter', 'Aucun résultat correspondant aux filtres actuels.');
      return;
    }
    exportCoursesToCsv(dataset);
    toast.success('Export prêt', `${dataset.length} cours exportés en CSV.`);
  };

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
    switch (action) {
      case 'export':
        handleExportCourses();
        break;
      case 'approve':
        handleBulkApprove();
        break;
      default:
        console.log(`Action en masse ${action} sur ${selectedCourses.length} cours`);
    }
  };

const handleCloseEditModal = () => {
  setEditCourse(null);
  setEditLoading(false);
  setEditSaving(false);
  setEditForm({
    title: '',
    shortDescription: '',
    description: '',
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
      price: Number.isFinite(editForm.price) ? editForm.price : 0,
      isPublished: editForm.isPublished,
    };
    await CourseService.updateCourse(editCourse.id, payload);
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

const handleDeleteCourse = (course: Course) => {
  setCourseToDelete(course);
};

const confirmDeleteCourse = async () => {
  if (!courseToDelete) return;

  setIsDeleting(true);
  try {
    await CourseService.deleteCourse(courseToDelete.id);
    toast.success('Cours supprimé', 'Le cours a été supprimé définitivement.');
    setCourseToDelete(null);
    await loadCourses();
  } catch (error: any) {
    console.error('Erreur lors de la suppression du cours:', error);
    toast.error('Erreur', error.message || 'Impossible de supprimer le cours.');
  } finally {
    setIsDeleting(false);
  }
};

const cancelDeleteCourse = () => {
  setCourseToDelete(null);
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
      key: 'select',
      label: '',
      render: (_value: any, course: Course) => (
        <input
          type="checkbox"
          className="h-4 w-4 text-mdsc-blue-dark border-gray-300 rounded focus:ring-mdsc-blue-dark"
          checked={selectedCourses.includes(course.id)}
          onChange={() => toggleCourseSelection(course.id)}
          aria-label={`Sélectionner ${course.title}`}
        />
      ),
    },
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
      key: 'price',
      label: 'Tarification',
      sortable: true,
      render: (value: any, course: Course) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {course.price === 0
              ? 'Gratuit'
              : `${Number(course.price || 0).toLocaleString('fr-FR')} ${course.currency || 'FCFA'}`}
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
          <button
            onClick={() => handleDeleteCourse(course)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Supprimer définitivement"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const selectedCount = selectedCourses.length;
  const allCoursesSelected =
    filteredCourses.length > 0 && selectedCount === filteredCourses.length;

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
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={filteredCourses.length === 0}
            >
              <span className="relative z-10 flex items-center gap-2">
                Exporter
              </span>
            </button>
            <button
              onClick={() => handleBulkAction('approve')}
              className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={bulkProcessing}
            >
              <span className="relative z-10 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {bulkProcessing ? 'Traitement...' : 'Approuver en masse'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50/70 dark:bg-slate-800/70 border border-amber-200 dark:border-slate-700 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-slate-100">
            {selectedCount > 0
              ? `${selectedCount} cours sélectionné${selectedCount > 1 ? 's' : ''}`
              : 'Aucun cours sélectionné'}
          </p>
          <p className="text-xs text-amber-800/80 dark:text-slate-300">
            Sélectionnez des cours pour les exporter ou lancer une approbation groupée.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (allCoursesSelected) {
                setSelectedCourses([]);
              } else {
                setSelectedCourses(filteredCourses.map((course) => course.id));
              }
            }}
            disabled={filteredCourses.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-amber-300 text-amber-900 bg-white/80 hover:bg-white disabled:opacity-50"
          >
            {allCoursesSelected ? 'Tout désélectionner' : 'Sélectionner tous les résultats'}
          </button>
          {selectedCount > 0 && (
            <button
              onClick={() => setSelectedCourses([])}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-amber-900 hover:text-amber-700"
            >
              Effacer la sélection
            </button>
          )}
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
                placeholder="Rechercher un cours, formateur, catégorie..."
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
                    Permettre aux utilisateurs de voir ce cours dans le catalogue.
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

      {/* Modal de confirmation de suppression */}
      {courseToDelete && (
        <Modal
          isOpen={courseToDelete !== null}
          onClose={cancelDeleteCourse}
          title="Supprimer définitivement le cours"
          size="md"
        >
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-3">
                    Êtes-vous sûr de vouloir supprimer définitivement le cours <strong>"{courseToDelete.title}"</strong> ?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Cette action est irréversible et supprimera :</p>
                    <ul className="text-sm text-red-700 space-y-1.5 list-disc list-inside">
                      <li>Le cours et toutes ses informations</li>
                      <li>Toutes les leçons et modules associés</li>
                      <li>Toutes les inscriptions des utilisateurs</li>
                      <li>Toutes les progressions et statistiques</li>
                      <li>Les certificats délivrés pour ce cours</li>
                      <li>Les évaluations et quiz associés</li>
                      <li>Les fichiers multimédias (vidéos, documents, etc.)</li>
                      <li>Les commentaires et avis sur le cours</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Cette suppression sera effective <strong>partout dans le système</strong> et ne pourra pas être annulée.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={cancelDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer définitivement'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
