'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  BarChart3, 
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Globe,
  Image as ImageIcon,
  Video,
  Star,
  Settings,
  AlertTriangle,
  Link as LinkIcon,
  X,
  Upload,
  Loader
} from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { FileService } from '../../../lib/services/fileService';
import { useAuthStore } from '../../../lib/stores/authStore';
import InstructorService from '../../../lib/services/instructorService';
import DataTable from '../shared/DataTable';
import toast from '../../../lib/utils/toast';
import Modal from '../../ui/Modal';
import CoursePreviewModal from './CoursePreviewModal';
import CourseEditModal from './CourseEditModal';
import CourseAnalyticsModal from './CourseAnalyticsModal';

interface CourseStats {
  totalStudents: number;
  completionRate: number;
  averageRating: number;
  lastActivity: string;
}

interface GlobalStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  averageCompletionRate: number;
}

export default function CourseManagement() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    averageCompletionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [serverPagination, setServerPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsCourse, setAnalyticsCourse] = useState<Course | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // États pour les listes déroulantes
  const [categories, setCategories] = useState<Array<{ id: number; name: string; color: string; icon: string }>>([]);
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: number; title: string }>>([]);
  
  // États pour les uploads de fichiers
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // État du formulaire de création
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category_id: '',
    thumbnail_url: '',
    video_url: '',
    duration_minutes: 0,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'fr',
    price: 0,
    currency: 'XOF',
    course_type: 'on_demand' as 'live' | 'on_demand',
    max_students: 0,
    prerequisite_course_id: '',
    enrollment_deadline: '',
    course_start_date: '',
    course_end_date: '',
  });
  const [creating, setCreating] = useState(false);

  // Fonction pour charger les statistiques globales
  const loadGlobalStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setStatsLoading(true);
      // Charger tous les cours pour calculer les statistiques globales
      const allCoursesResponse = await InstructorService.getCourses({ status: 'all', limit: 1000 });
      const allCourses = allCoursesResponse.courses || [];
      
      // Calculer les statistiques globales
      const totalCourses = allCourses.length;
      const publishedCourses = allCourses.filter((c: any) => c.status === 'published' || c.status === 'active').length;
      const draftCourses = allCourses.filter((c: any) => c.status === 'draft' || c.status === 'pending').length;
      
      // Calculer le total d'étudiants et le taux de complétion moyen
      let totalStudents = 0;
      let totalCompletionRate = 0;
      let coursesWithStats = 0;
      
      allCourses.forEach((course: any) => {
        const enrollments = course.enrollments || course.total_enrollments || 0;
        totalStudents += typeof enrollments === 'number' ? enrollments : 0;
        
        const completionRate = course.completion_rate || course.avg_completion_rate || 0;
        if (completionRate > 0) {
          totalCompletionRate += completionRate;
          coursesWithStats++;
        }
      });
      
      const averageCompletionRate = coursesWithStats > 0 
        ? Math.round(totalCompletionRate / coursesWithStats) 
        : 0;

      setGlobalStats({
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        averageCompletionRate,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // En cas d'erreur, utiliser les statistiques du dashboard
      try {
        const dashboardData = await InstructorService.getDashboard();
        const stats = dashboardData.stats || {};
        const coursesStats = stats.courses || {};
        const studentsStats = stats.students || {};
        
        setGlobalStats({
          totalCourses: coursesStats.total || 0,
          publishedCourses: coursesStats.published || 0,
          draftCourses: coursesStats.draft || 0,
          totalStudents: studentsStats.total || 0,
          averageCompletionRate: 0, // Pas disponible dans le dashboard
        });
      } catch (dashboardError) {
        console.error('Erreur lors du chargement du dashboard:', dashboardError);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Charger les statistiques globales au montage
  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const list = await courseService.getInstructorCourses(String(user.id), { status: filterStatus, page, limit });
        const arr = Array.isArray(list) ? list : (list as any)?.data || list || [];
        const pagination = (list as any)?.pagination || { page, limit, total: arr.length, pages: Math.max(1, Math.ceil(arr.length / limit)) };
        setCourses(arr);
        setFilteredCourses(arr);
        setServerPagination(pagination);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        // En cas d'erreur, initialiser avec un tableau vide
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user, page, limit, filterStatus]);

  // Charger les catégories et les cours disponibles pour les listes déroulantes
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const catsResponse = await courseService.getCategories();
        const categoriesData = Array.isArray(catsResponse)
          ? catsResponse
          : (catsResponse as any)?.data?.categories || (catsResponse as any)?.categories || [];
        setCategories(categoriesData);

        const coursesResponse = await courseService.getAllCourses();
        const coursesData = Array.isArray(coursesResponse?.courses)
          ? coursesResponse.courses
          : Array.isArray(coursesResponse)
          ? coursesResponse
          : [];
        setAvailableCourses(coursesData.map((c: any) => ({ id: c.id, title: c.title })));
      } catch (error) {
        console.error('Erreur lors du chargement des données du formulaire:', error);
        setCategories([]);
        setAvailableCourses([]);
      }
    };

    loadFormData();
  }, []);

  useEffect(() => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(course => {
        const categoryStr = typeof course.category === 'string' 
          ? course.category 
          : (course.category as any)?.name || '';
        return (
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryStr.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  // Handlers pour les uploads de fichiers
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'L\'image ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const uploaded = await FileService.uploadFile(file, { category: 'course_thumbnail' });
      const photoUrl = uploaded.url || (uploaded as any).storage_path;
      if (photoUrl) {
        setThumbnailFile(file);
        setThumbnailPreview(photoUrl);
        setCreateFormData({ ...createFormData, thumbnail_url: photoUrl });
        toast.success('Image uploadée', 'Votre image de couverture a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une vidéo');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'La vidéo ne doit pas dépasser 100 MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const uploaded = await FileService.uploadFile(file, { category: 'course_intro_video' });
      const videoUrl = uploaded.url || (uploaded as any).storage_path;
      if (videoUrl) {
        setVideoFile(file);
        setCreateFormData({ ...createFormData, video_url: videoUrl });
        toast.success('Vidéo uploadée', 'Votre vidéo a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de la vidéo');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.title || !createFormData.description || !createFormData.short_description) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation conditionnelle selon le type de cours
    if (createFormData.course_type === 'live') {
      if (!createFormData.enrollment_deadline || !createFormData.course_start_date || !createFormData.course_end_date || !createFormData.max_students || createFormData.max_students <= 0) {
        toast.warning('Formulaire incomplet', 'Pour un cours en Live, les dates et le nombre maximum d\'étudiants sont obligatoires');
        return;
      }
    }

    setCreating(true);
    try {
      // Nettoyer les champs vides optionnels avant l'envoi
      const cleanedData: any = {
        ...createFormData,
        prerequisite_course_id: createFormData.prerequisite_course_id || undefined,
        // Pour les cours on_demand, les dates sont optionnelles
        enrollment_deadline: createFormData.course_type === 'live' ? createFormData.enrollment_deadline : (createFormData.enrollment_deadline || undefined),
        course_start_date: createFormData.course_type === 'live' ? createFormData.course_start_date : (createFormData.course_start_date || undefined),
        course_end_date: createFormData.course_type === 'live' ? createFormData.course_end_date : (createFormData.course_end_date || undefined),
        max_students: createFormData.course_type === 'live' ? createFormData.max_students : (createFormData.max_students || undefined),
      };
      
      // Logger les données envoyées pour debug
      console.log('📤 Envoi des données du cours:', cleanedData);
      const newCourse = await courseService.createCourse(cleanedData);
      toast.success('Cours créé', 'Votre cours a été créé avec succès !');
      setShowCreateModal(false);
      // Réinitialiser le formulaire
      setCreateFormData({
        title: '',
        description: '',
        short_description: '',
        category_id: '',
        thumbnail_url: '',
        video_url: '',
        duration_minutes: 0,
        difficulty: 'beginner',
        language: 'fr',
        price: 0,
        currency: 'XOF',
        course_type: 'on_demand',
        max_students: 0,
        prerequisite_course_id: '',
        enrollment_deadline: '',
        course_start_date: '',
        course_end_date: '',
      });
      // Réinitialiser les états de preview
      setThumbnailFile(null);
      setThumbnailPreview('');
      setVideoFile(null);
      // Recharger la liste des cours
      const instructorCourses = await courseService.getMyCourses();
      setCourses(instructorCourses || []);
      setFilteredCourses(instructorCourses || []);
      // Recharger les statistiques globales
      await loadGlobalStats();
    } catch (error: any) {
      console.error('Erreur lors de la création du cours:', error);
      toast.errorFromApi('Erreur de création', error, 'Erreur lors de la création du cours');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (course: Course) => {
    // Vérifier si le cours est publié (gérer différents formats du backend)
    const courseAny = course as any;
    const isPublishedValue = courseAny.is_published ?? course.isPublished ?? courseAny.isPublished ?? false;
    
    // Convertir différents formats en booléen
    let isPublished = false;
    if (typeof isPublishedValue === 'boolean') {
      isPublished = isPublishedValue;
    } else if (typeof isPublishedValue === 'number') {
      isPublished = isPublishedValue === 1;
    } else if (typeof isPublishedValue === 'string') {
      isPublished = isPublishedValue === 'true' || isPublishedValue === '1' || isPublishedValue.toLowerCase() === 'published';
    }
    
    if (isPublished) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publié
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Brouillon
        </span>
      );
    }
  };

  const getCourseStats = (course: Course): CourseStats => {
    // Simulation des statistiques - dans un vrai projet, on récupérerait ces données depuis l'API
    return {
      totalStudents: Math.floor(Math.random() * 50) + 10,
      completionRate: Math.floor(Math.random() * 40) + 60,
      averageRating: 3.5 + Math.random() * 1.5,
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
  };

  const handleDeleteClick = (courseId: number) => {
    setCourseToDelete(courseId);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await courseService.deleteCourse(courseToDelete.toString());
      toast.success('Cours supprimé', 'Le cours a été supprimé avec succès');
      // Mettre à jour la liste locale
      setCourses(prev => prev.filter(course => course.id !== courseToDelete.toString()));
      setFilteredCourses(prev => prev.filter(course => course.id !== courseToDelete.toString()));
      // Recharger les cours depuis l'API
      if (user) {
        const list = await courseService.getInstructorCourses(user.id.toString(), { status: filterStatus, page, limit });
        const arr = Array.isArray(list) ? list : (list as any)?.data || list || [];
        setCourses(arr);
        setFilteredCourses(arr);
      }
      // Recharger les statistiques globales
      await loadGlobalStats();
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du cours:', error);
      toast.error('Erreur', error.message || 'Impossible de supprimer le cours. Veuillez réessayer.');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Gestion des Cours 📚</h1>
            <p className="text-yellow-100">
              Créez, gérez et suivez vos cours d'apprentissage.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-mdsc-gold px-6 py-3 rounded-lg font-medium hover:bg-yellow-50 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Créer un cours</span>
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-mdsc-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total des cours</p>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalCourses}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cours publiés</p>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{globalStats.publishedCourses}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total étudiants</p>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalStudents}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de complétion moyen</p>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{globalStats.averageCompletionRate}%</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              >
                <option value="all">Tous les cours</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredCourses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredCourses.map((course) => {
              const stats = getCourseStats(course);
              return (
                <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        {getStatusBadge(course)}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {course.description || 'Aucune description disponible'}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{typeof course.category === 'string' ? course.category : (course.category as any)?.name || 'Non catégorisé'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{course.totalStudents || 0} étudiants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Dernière activité: {new Date(course.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Métriques du cours */}
                      <div className="grid grid-cols-3 gap-4 max-w-md">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stats.completionRate}%</div>
                          <div className="text-xs text-gray-500">Complétion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Note moyenne</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{course.progress}%</div>
                          <div className="text-xs text-gray-500">Progression</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col items-end space-y-2">
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setPreviewCourse(course);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Voir les détails du cours"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditCourse(course);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Modifier le cours"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            setAnalyticsCourse(course);
                            setShowAnalyticsModal(true);
                            setLoadingAnalytics(true);
                            setCourseAnalytics(null);
                            try {
                              const analytics = await courseService.getCourseAnalytics(String(course.id));
                              console.log('📊 Analytics récupérées:', analytics);
                              setCourseAnalytics(analytics);
                            } catch (error: any) {
                              console.error('❌ Erreur lors du chargement des analytics:', error);
                              // Afficher un message d'erreur mais garder le modal ouvert pour afficher un message
                              toast.warning('Analytics non disponibles', 'Les analytics détaillées ne sont pas disponibles pour ce cours pour le moment.');
                              // Définir analytics à null pour afficher le message dans le modal
                              setCourseAnalytics(null);
                            } finally {
                              setLoadingAnalytics(false);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Analytics du cours"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(parseInt(course.id))}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer le cours"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Bouton principal */}
                      <a
                        href={`/instructor/courses/${course.id}`}
                        className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors text-sm font-medium"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gérer le cours
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : 'Vous n\'avez créé aucun cours pour le moment.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-mdsc-gold text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier cours
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCourses.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Page {serverPagination.page} / {serverPagination.pages} · {serverPagination.total} cours
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
              disabled={page >= (serverPagination.pages || 1)}
              onClick={() => setPage(p => Math.min(serverPagination.pages || 1, p + 1))}
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

      {/* Modal de création de cours */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête avec gradient */}
            <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Créer un nouveau cours</h2>
                    <p className="text-yellow-50 text-sm mt-1">Remplissez les informations pour créer votre cours</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setThumbnailFile(null);
                    setThumbnailPreview('');
                    setVideoFile(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2"
                  type="button"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu avec scroll */}
            <form onSubmit={handleCreateCourse} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6 bg-gray-50 space-y-6 min-h-0">
              {/* Section: Informations générales */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-gray-200">
                  <BookOpen className="h-5 w-5 text-mdsc-gold" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                </div>

                <div className="space-y-4">
                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du cours <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.title}
                      onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors placeholder-gray-400"
                      placeholder="Ex: Leadership et Management d'Équipe"
                      required
                    />
                  </div>

                  {/* Description courte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description courte <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={createFormData.short_description}
                      onChange={(e) => setCreateFormData({ ...createFormData, short_description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors resize-none"
                      placeholder="Une description courte et accrocheuse..."
                      required
                    />
                  </div>

                  {/* Description complète */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description complète <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors resize-none"
                      placeholder="Une description détaillée de votre cours..."
                      required
                    />
                  </div>

                  {/* Catégorie et Niveau */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={createFormData.category_id}
                        onChange={(e) => setCreateFormData({ ...createFormData, category_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau de difficulté
                      </label>
                      <select
                        value={createFormData.difficulty}
                        onChange={(e) => setCreateFormData({ ...createFormData, difficulty: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                      >
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Configuration du cours */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-gray-200">
                  <Settings className="h-5 w-5 text-mdsc-gold" />
                  <h3 className="text-lg font-semibold text-gray-900">Configuration du cours</h3>
                </div>

                <div className="space-y-4">
                  {/* Durée et Prix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Durée (en minutes)
                      </label>
                      <input
                        type="number"
                        value={createFormData.duration_minutes}
                        onChange={(e) => setCreateFormData({ ...createFormData, duration_minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        placeholder="Ex: 480"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix (FCFA)
                      </label>
                      <input
                        type="number"
                        value={createFormData.price}
                        onChange={(e) => setCreateFormData({ ...createFormData, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        placeholder="Ex: 0"
                      />
                    </div>
                  </div>

                  {/* Upload de l'image et de la vidéo */}
                  <div className="space-y-4">
                    {/* Image de couverture */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image de couverture
                      </label>
                      {thumbnailPreview ? (
                        <div className="relative mb-2">
                          <img
                            src={thumbnailPreview}
                            alt="Aperçu"
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                          />
                          {uploadingThumbnail && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <Loader className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aucune image sélectionnée</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label
                        htmlFor="thumbnail-upload"
                        className="inline-flex items-center px-4 py-2 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        {thumbnailPreview ? 'Changer l\'image' : 'Uploader une image'}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Formats acceptés : JPG, PNG (Max 5 MB)</p>
                    </div>

                    {/* Vidéo introductive */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vidéo introductive (optionnel)
                      </label>
                      {videoFile ? (
                        <div className="border border-gray-300 rounded-lg p-4 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Video className="h-8 w-8 text-mdsc-gold" />
                              <div>
                                <p className="font-medium text-gray-900">{videoFile.name}</p>
                                <p className="text-xs text-gray-600">
                                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            {uploadingVideo && (
                              <Loader className="h-6 w-6 text-mdsc-gold animate-spin" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aucune vidéo sélectionnée</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                      />
                      <label
                        htmlFor="video-upload"
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        {videoFile ? 'Changer la vidéo' : 'Uploader une vidéo'}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Formats acceptés : MP4, AVI, MOV (Max 100 MB)</p>
                    </div>
                  </div>

                  {/* Langue */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue du cours
                    </label>
                    <input
                      type="text"
                      value={createFormData.language}
                      onChange={(e) => setCreateFormData({ ...createFormData, language: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                      placeholder="fr"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Type de cours et Configuration */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-gray-200">
                  <Settings className="h-5 w-5 text-mdsc-gold" />
                  <h3 className="text-lg font-semibold text-gray-900">Type de cours</h3>
                </div>

                <div className="space-y-4">
                  {/* Type de cours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de cours <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createFormData.course_type}
                      onChange={(e) => setCreateFormData({ ...createFormData, course_type: e.target.value as 'live' | 'on_demand' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                    >
                      <option value="on_demand">Cours à la demande (On-demand)</option>
                      <option value="live">Cours en Live (en direct)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {createFormData.course_type === 'live' 
                        ? '⚠️ Les dates et le nombre maximum d\'étudiants sont obligatoires pour les cours en Live'
                        : 'Les dates sont optionnelles pour les cours à la demande'
                      }
                    </p>
                  </div>

                  {/* Nombre maximum d'étudiants (conditionnel pour Live) */}
                  {createFormData.course_type === 'live' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre maximum d'étudiants <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={createFormData.max_students}
                        onChange={(e) => setCreateFormData({ ...createFormData, max_students: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        placeholder="Ex: 50"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Dates et prérequis */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-gray-200">
                  <Calendar className="h-5 w-5 text-mdsc-gold" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dates et prérequis
                    {createFormData.course_type === 'live' && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Cours prérequis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cours prérequis
                    </label>
                    <select
                      value={createFormData.prerequisite_course_id}
                      onChange={(e) => setCreateFormData({ ...createFormData, prerequisite_course_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                    >
                      <option value="">Aucun cours prérequis</option>
                      {availableCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates conditionnelles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date limite d'inscription
                        {createFormData.course_type === 'live' && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={createFormData.enrollment_deadline}
                        onChange={(e) => setCreateFormData({ ...createFormData, enrollment_deadline: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        required={createFormData.course_type === 'live'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début du cours
                        {createFormData.course_type === 'live' && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={createFormData.course_start_date}
                        onChange={(e) => setCreateFormData({ ...createFormData, course_start_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        required={createFormData.course_type === 'live'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin du cours
                        {createFormData.course_type === 'live' && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={createFormData.course_end_date}
                        onChange={(e) => setCreateFormData({ ...createFormData, course_end_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-colors"
                        required={createFormData.course_type === 'live'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action - en bas de la modal */}
            <div className="border-t border-gray-200 bg-white p-6 flex justify-end space-x-4 shadow-lg flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setThumbnailFile(null);
                  setThumbnailPreview('');
                  setVideoFile(null);
                }}
                disabled={creating}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-md hover:shadow-lg"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Créer le cours</span>
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCourseToDelete(null);
        }}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="py-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.
              </p>
              <p className="text-sm text-gray-500">
                Toutes les données associées à ce cours (leçons, quiz, inscriptions, etc.) seront également supprimées.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setCourseToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteCourse}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation du cours */}
      <CoursePreviewModal
        course={previewCourse}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewCourse(null);
        }}
        onEdit={(courseId) => {
          window.location.href = `/instructor/courses/${courseId}`;
        }}
      />

      {/* Modal d'édition rapide du cours */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditCourse(null);
        }}
        title="Modifier le cours"
        size="lg"
      >
        {editCourse && (
          <CourseEditModal
            course={editCourse}
            categories={categories}
            availableCourses={availableCourses}
            onSave={async (updatedData) => {
              setUpdating(true);
              try {
                await courseService.updateCourse(String(editCourse.id), updatedData);
                toast.success('Cours mis à jour', 'Les modifications ont été enregistrées avec succès');
                setShowEditModal(false);
                setEditCourse(null);
                // Recharger les cours
                if (user) {
                  const list = await courseService.getInstructorCourses(user.id.toString(), { status: filterStatus, page, limit });
                  const arr = Array.isArray(list) ? list : (list as any)?.data || list || [];
                  setCourses(arr);
                  setFilteredCourses(arr);
                }
                await loadGlobalStats();
              } catch (error: any) {
                console.error('Erreur lors de la mise à jour:', error);
                toast.error('Erreur', error.message || 'Impossible de mettre à jour le cours');
              } finally {
                setUpdating(false);
              }
            }}
            onCancel={() => {
              setShowEditModal(false);
              setEditCourse(null);
            }}
            updating={updating}
          />
        )}
      </Modal>

      {/* Modal d'analytics du cours */}
      <Modal
        isOpen={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setAnalyticsCourse(null);
          setCourseAnalytics(null);
        }}
        title={analyticsCourse ? `Analytics - ${analyticsCourse.title}` : 'Analytics du cours'}
        size="xl"
      >
        <CourseAnalyticsModal
          course={analyticsCourse}
          analytics={courseAnalytics}
          loading={loadingAnalytics}
        />
      </Modal>
    </div>
  );
}
