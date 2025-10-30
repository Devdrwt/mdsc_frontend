'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';
import DataTable from '../shared/DataTable';

interface CourseStats {
  totalStudents: number;
  completionRate: number;
  averageRating: number;
  lastActivity: string;
}

export default function CourseManagement() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [serverPagination, setServerPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const list = await courseService.getInstructorCourses(user.id.toString(), { status: filterStatus, page, limit });
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

  useEffect(() => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.title || !createFormData.description || !createFormData.short_description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreating(true);
    try {
      const newCourse = await courseService.createCourse(createFormData);
      alert('Cours créé avec succès !');
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
      });
      // Recharger la liste des cours
      const instructorCourses = await courseService.getMyCourses();
      setCourses(instructorCourses || []);
      setFilteredCourses(instructorCourses || []);
    } catch (error: any) {
      console.error('Erreur lors de la création du cours:', error);
      alert(error.message || 'Erreur lors de la création du cours');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (course: Course) => {
    if (course.updatedAt && new Date(course.updatedAt) < new Date()) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="h-3 w-3 mr-1" />
          Archivé
        </span>
      );
    } else if (course.progress > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Play className="h-3 w-3 mr-1" />
          Actif
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

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) {
      return;
    }

    try {
      // TODO: Implémenter la suppression de cours via l'API Moodle
      console.log('Suppression du cours:', courseId);
      // Mettre à jour la liste locale
      setCourses(prev => prev.filter(course => course.id !== courseId.toString()));
    } catch (error) {
      console.error('Erreur lors de la suppression du cours:', error);
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
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cours actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.progress > 0).length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((acc, course) => acc + getCourseStats(course).totalStudents, 0)}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round(courses.reduce((acc, course) => acc + getCourseStats(course).completionRate, 0) / courses.length)
                  : 0}%
              </p>
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
                          <span>{course.category}</span>
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
                          onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Voir le cours"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/dashboard/instructor/courses/${course.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Modifier le cours"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/dashboard/instructor/courses/${course.id}/analytics`}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Analytics du cours"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(parseInt(course.id))}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer le cours"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Bouton principal */}
                      <a
                        href={`/dashboard/instructor/courses/${course.id}`}
                        className="btn-mdsc-secondary text-sm"
                      >
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Créer un nouveau cours</h2>
              <p className="text-gray-600 mt-1">Remplissez les informations pour créer votre cours</p>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du cours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                  placeholder="Une description détaillée de votre cours..."
                  required
                />
              </div>

              {/* Catégorie et Niveau */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Catégorie
                  </label>
                  <input
                    type="text"
                    value={createFormData.category_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                    placeholder="Ex: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de difficulté
                  </label>
                  <select
                    value={createFormData.difficulty}
                    onChange={(e) => setCreateFormData({ ...createFormData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
              </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                    placeholder="Ex: 0"
                  />
                </div>
              </div>

              {/* URL de l'image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image de couverture
                </label>
                <input
                  type="url"
                  value={createFormData.thumbnail_url}
                  onChange={(e) => setCreateFormData({ ...createFormData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              {/* URL de la vidéo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la vidéo (optionnel)
                </label>
                <input
                  type="url"
                  value={createFormData.video_url}
                  onChange={(e) => setCreateFormData({ ...createFormData, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
                  placeholder="https://exemple.com/video.mp4"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Créer le cours</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
