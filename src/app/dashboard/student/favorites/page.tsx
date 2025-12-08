'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { Bookmark, Search, X, Heart, BookOpen, Clock, Star, RefreshCw, FileText, Quote, Save } from 'lucide-react';
import { courseService, Course } from '../../../../lib/services/courseService';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { testimonialService } from '../../../../lib/services/testimonialService';
import toast from '../../../../lib/utils/toast';

type FavoriteCourse = Course & {
  progressValue: number;
  categoryLabel: string;
};

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<FavoriteCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<FavoriteCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFavorite, setRemovingFavorite] = useState<string | number | null>(null);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<FavoriteCourse | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    quote: '',
    rating: 5,
  });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  const loadFavorites = async (showRefreshing = false) => {
    if (!user) {
      console.log('⚠️ [FavoritesPage] Utilisateur non connecté, impossible de charger les favoris');
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('🔄 [FavoritesPage] Chargement des cours favoris...');
      const favoriteCourses = await courseService.getFavoriteCourses();
      
      console.log('📋 [FavoritesPage] Cours favoris reçus:', {
        count: favoriteCourses?.length || 0,
        courses: favoriteCourses,
      });
      
      // Filtrer les cours valides (qui ont un id et un title)
      const validCourses = (favoriteCourses || []).filter((course: any) => {
        const isValid = course && course.id && course.title;
        if (!isValid) {
          console.warn('⚠️ [FavoritesPage] Cours invalide ignoré:', course);
        }
        return isValid;
      });
      
      console.log(`✅ [FavoritesPage] ${validCourses.length} cours valides après filtrage`);
      
      const normalizedCourses: FavoriteCourse[] = validCourses.map((course: any) => {
        const categoryLabel = typeof course.category === 'string'
          ? course.category
          : course.category?.name || 'Sans catégorie';

        const progressRaw = course.progress ?? course.progressValue ?? course.enrollment?.progress_percentage ?? course.progress_percentage ?? 0;
        const progressValue = Number(progressRaw);

        return {
          ...course,
          category: categoryLabel,
          categoryLabel,
          progressValue: Number.isFinite(progressValue) ? Math.min(Math.max(progressValue, 0), 100) : 0,
        } as FavoriteCourse;
      });

      console.log(`✅ [FavoritesPage] ${normalizedCourses.length} cours normalisés, mise à jour de l'état`);
      setCourses(normalizedCourses);
      setFilteredCourses(normalizedCourses);
    } catch (error: any) {
        console.error('❌ [FavoritesPage] Erreur lors du chargement des favoris:', {
          error: error.message,
          status: error.status,
          details: error.details,
          fullError: error,
        });
        
        // Gérer spécifiquement les erreurs 404 (endpoint non trouvé)
        if (error.status === 404) {
          console.warn('⚠️ [FavoritesPage] Endpoint /courses/favorites non trouvé (404)');
          toast.info('Information', 'La fonctionnalité des favoris n\'est pas encore disponible');
        } else if (error.message?.includes('Cours non trouvé')) {
          // Si certains cours n'existent plus, on affiche juste un avertissement
          console.warn('⚠️ [FavoritesPage] Certains cours favoris n\'existent plus');
          toast.warning('Attention', 'Certains cours favoris ne sont plus disponibles');
        } else {
          toast.error('Erreur', error.message || 'Impossible de charger vos cours favoris');
        }
        
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const handleRefresh = () => {
    loadFavorites(true);
  };

  useEffect(() => {
    let filtered = courses;

    // Filtrage par recherche
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        (course.title || '').toLowerCase().includes(lower) ||
        (course.description || '').toLowerCase().includes(lower) ||
        (course.categoryLabel || '').toLowerCase().includes(lower)
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  const handleRemoveFavorite = async (course: FavoriteCourse) => {
    if (!course.id) return;

    try {
      setRemovingFavorite(course.id);
      await courseService.removeFromFavorites(String(course.id));
      
      // Retirer le cours de la liste
      setCourses(prev => prev.filter(c => c.id !== course.id));
      toast.success('Favori retiré', 'Le cours a été retiré de vos favoris');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du favori:', error);
      
      // Si le cours n'existe plus (404), on le retire quand même de la liste locale
      if (error.status === 404 || error.message?.includes('Cours non trouvé')) {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        toast.info('Information', 'Ce cours n\'existe plus et a été retiré de vos favoris');
      } else {
        toast.error('Erreur', error.message || 'Impossible de retirer le cours des favoris');
      }
    } finally {
      setRemovingFavorite(null);
    }
  };

  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes || minutes === 0) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleOpenTestimonialModal = (course: FavoriteCourse) => {
    setSelectedCourse(course);
    setTestimonialForm({
      quote: '',
      rating: 5,
    });
    setShowTestimonialModal(true);
  };

  const handleCloseTestimonialModal = () => {
    setShowTestimonialModal(false);
    setSelectedCourse(null);
    setTestimonialForm({
      quote: '',
      rating: 5,
    });
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Soumission du témoignage...', {
      selectedCourse: selectedCourse?.id,
      quoteLength: testimonialForm.quote.trim().length,
      user: user?.id,
    });
    
    if (!selectedCourse) {
      toast.error('Erreur', 'Aucun cours sélectionné');
      return;
    }
    
    if (!testimonialForm.quote.trim()) {
      toast.error('Erreur', 'Veuillez entrer votre témoignage');
      return;
    }

    if (testimonialForm.quote.trim().length < 20) {
      toast.error('Erreur', 'Le témoignage doit contenir au moins 20 caractères');
      return;
    }

    if (!user) {
      toast.error('Erreur', 'Vous devez être connecté pour soumettre un témoignage');
      return;
    }

    try {
      setSubmittingTestimonial(true);
      
      await testimonialService.createTestimonial({
        quote: testimonialForm.quote.trim(),
        author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Utilisateur',
        title: 'Utilisateur',
        avatar: user?.firstName?.[0] && user?.lastName?.[0] 
          ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
          : '',
        rating: testimonialForm.rating,
        is_active: false,
        display_order: 0,
        status: 'pending',
        course_id: selectedCourse.id, // Lier le témoignage au cours
        user_id: user?.id,
      });

      toast.success('Succès', 'Votre témoignage a été soumis et est en attente de modération');
      handleCloseTestimonialModal();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue lors de la soumission');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Bookmark className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Mes Favoris</h1>
                </div>
                <p className="text-white/90">Cours sauvegardés pour plus tard</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rafraîchir la liste"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans vos favoris..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Liste des favoris */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Aucun résultat' : 'Aucun favori'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Aucun cours ne correspond à votre recherche.'
                  : 'Vous n\'avez pas encore de cours favoris. Explorez le catalogue pour en ajouter !'}
              </p>
              {!searchTerm && (
                <Link
                  href="/courses"
                  className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Explorer le catalogue
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Link
                              href={`/courses/${course.slug || course.id}`}
                              className="block group"
                            >
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors mb-2">
                                {course.title}
                              </h3>
                            </Link>
                            
                            {/* Catégorie */}
                            {course.categoryLabel && (
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-mdsc-blue-primary/10 text-mdsc-blue-primary text-xs font-medium mb-3">
                                <FileText className="h-3 w-3 mr-1.5" />
                                {course.categoryLabel}
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton retirer favori */}
                          <button
                            onClick={() => handleRemoveFavorite(course)}
                            disabled={removingFavorite === course.id}
                            className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
                            title="Retirer des favoris"
                          >
                            <Heart className={`h-5 w-5 ${removingFavorite === course.id ? 'fill-red-500' : 'fill-current'}`} />
                          </button>
                        </div>

                        {/* Description */}
                        {(course.shortDescription || course.description) && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {course.shortDescription || course.description}
                          </p>
                        )}

                        {/* Informations en ligne */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          {course.duration && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                              <span>{formatDuration(course.duration)}</span>
                            </div>
                          )}
                          {course.rating !== undefined && course.rating !== null ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{(course.rating ?? 0).toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Barre de progression si le cours est suivi */}
                        {course.progressValue > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span className="font-medium">Progression</span>
                              <span className="font-semibold">{Math.round(course.progressValue)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${course.progressValue}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap">
                          <Link
                            href={course.enrollment ? `/learn/${course.id}` : `/courses/${course.slug || course.id}`}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            {course.enrollment ? 'Continuer le cours' : 'Voir le cours'}
                          </Link>
                          <button
                            onClick={() => handleOpenTestimonialModal(course)}
                            className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-mdsc-orange text-mdsc-orange rounded-lg hover:bg-mdsc-orange hover:text-white transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                          >
                            <Quote className="h-4 w-4 mr-2" />
                            Faire un témoignage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistiques */}
          {!loading && courses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{courses.length}</span> cours favoris
                {searchTerm && filteredCourses.length !== courses.length && (
                  <>
                    {' • '}
                    <span className="font-semibold text-gray-900">{filteredCourses.length}</span> résultat(s) trouvé(s)
                  </>
                )}
              </p>
            </div>
          )}

          {/* Modal de témoignage */}
          {showTestimonialModal && selectedCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Faire un témoignage</h3>
                    <p className="text-sm text-gray-600 mt-1">Cours: {selectedCourse.title}</p>
                  </div>
                  <button
                    onClick={handleCloseTestimonialModal}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    disabled={submittingTestimonial}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitTestimonial} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre témoignage sur ce cours <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={testimonialForm.quote}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                      required
                      rows={6}
                      minLength={20}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                      placeholder="Partagez votre expérience avec ce cours. Décrivez ce que vous avez appris, ce qui vous a plu, ou ce que vous recommanderiez à d'autres utilisateurs..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 20 caractères. {testimonialForm.quote.length} caractères saisis.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (étoiles)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setTestimonialForm({ ...testimonialForm, rating })}
                          className={`p-2 rounded-lg transition-colors ${
                            testimonialForm.rating >= rating
                              ? 'text-mdsc-orange'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              testimonialForm.rating >= rating ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {testimonialForm.rating} {testimonialForm.rating > 1 ? 'étoiles' : 'étoile'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Votre témoignage sera soumis pour modération. 
                      Il sera publié sur la page d'accueil une fois approuvé par un administrateur.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseTestimonialModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={submittingTestimonial}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTestimonial || testimonialForm.quote.trim().length < 20}
                      className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingTestimonial ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Soumettre
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

