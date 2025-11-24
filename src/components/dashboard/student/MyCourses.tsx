'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Play, CheckCircle, Award, Filter, Search, X, Trash2, AlertTriangle, Users, User } from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';
import DataTable from '../shared/DataTable';
import toast from '../../../lib/utils/toast';
// import { BookOpen } from "heroicons-react" ;

type StudentCourse = Course & {
  progressValue: number;
  categoryLabel: string;
  createdAt?: string | null;
};

export default function MyCourses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [unenrollingCourse, setUnenrollingCourse] = useState<string | number | null>(null);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState<StudentCourse | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userCourses = await courseService.getMyCourses();
        const normalizedCourses: StudentCourse[] = (userCourses || []).map((course: any) => {
          const categoryLabel = typeof course.category === 'string'
            ? course.category
            : course.category?.name || 'Sans catégorie';

          const progressRaw = course.progress ?? course.progressValue ?? course.enrollment?.progress_percentage ?? course.progress_percentage ?? 0;
          const progressValue = Number(progressRaw);

          const createdAt = course.createdAt || course.created_at || course.enrollment?.enrolled_at || null;

          return {
            ...course,
            category: categoryLabel,
            categoryLabel,
            progressValue: Number.isFinite(progressValue) ? Math.min(Math.max(progressValue, 0), 100) : 0,
            createdAt,
          } as StudentCourse;
        });

        setCourses(normalizedCourses);
        setFilteredCourses(normalizedCourses);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  useEffect(() => {
    let filtered = courses;

    // Filtrage par statut
    switch (filterStatus) {
      case 'in-progress':
        filtered = filtered.filter(course => course.progressValue > 0 && course.progressValue < 100);
        break;
      case 'completed':
        filtered = filtered.filter(course => course.progressValue === 100);
        break;
      case 'not-started':
        filtered = filtered.filter(course => course.progressValue === 0);
        break;
    }

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
  }, [courses, searchTerm, filterStatus]);

  const getStatusBadge = (course: StudentCourse) => {
    if (course.progressValue === 100) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Terminé
        </span>
      );
    } else if (course.progressValue > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Play className="h-3 w-3 mr-1" />
          En cours
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Non commencé
        </span>
      );
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCategoryLabel = (category: any): string => {
    if (!category) return 'Autre';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      const categoryAny = category as any;
      if (categoryAny?.name || categoryAny?.label || categoryAny?.title) {
        return categoryAny.name || categoryAny.label || categoryAny.title;
      }
      if (Array.isArray(categoryAny)) {
        const labels = categoryAny
          .map((item: any) => item?.name || item?.label || item?.title)
          .filter(Boolean);
        return labels.length ? labels.join(', ') : 'Autre';
      }
      return 'Autre';
    }
    return String(category);
  };

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return;
    
    setUnenrollingCourse(String(courseToUnenroll.id));
    try {
      await courseService.unenrollFromCourse(String(courseToUnenroll.id));
      // Retirer le cours de la liste
      setCourses(courses.filter(c => String(c.id) !== String(courseToUnenroll.id)));
      setFilteredCourses(filteredCourses.filter(c => String(c.id) !== String(courseToUnenroll.id)));
      setShowUnenrollModal(false);
      setCourseToUnenroll(null);
      toast.success('Désinscription réussie', `Vous avez été désinscrit du cours "${courseToUnenroll.title}"`);
    } catch (error: any) {
      console.error('Erreur lors de la désinscription:', error);
      const errorMessage = error?.message || 'Erreur lors de la désinscription. Veuillez réessayer.';
      toast.error('Erreur de désinscription', errorMessage);
    } finally {
      setUnenrollingCourse(null);
    }
  };

  const openUnenrollModal = (course: StudentCourse) => {
    setCourseToUnenroll(course);
    setShowUnenrollModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-mdsc-blue-primary rounded-lg p-6 text-white">
  <div className="flex items-center space-x-2 mb-2">
    <BookOpen className="h-7 w-7" />
    <h1 className="text-2xl font-bold">Mes Cours</h1>
  </div>
  <p className="text-mdsc-gray-light">
    Gérez vos cours, suivez votre progression et accédez à vos contenus d'apprentissage.
  </p>
</div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
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
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.progressValue === 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Play className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.progressValue > 0 && c.progressValue < 100).length}
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
              <p className="text-sm font-medium text-gray-600">Progression moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round(courses.reduce((acc, c) => acc + c.progressValue, 0) / courses.length)
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              >
                <option value="all">Tous les cours</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminés</option>
                <option value="not-started">Non commencés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredCourses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 transition-colors bg-white hover:bg-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      {getStatusBadge(course)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description || 'Aucune description disponible'}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.categoryLabel || getCategoryLabel((course as any).category)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Pas de date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end space-y-3">
                    {/* Barre de progression */}
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{course.progressValue}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progressValue)}`}
                          style={{ width: `${course.progressValue}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {/* Bouton d'action */}
                      <a
                        href={`/learn/${course.id}`}
                        className="btn-mdsc-primary text-sm"
                      >
                        {course.progressValue === 100 ? 'Revoir' : course.progressValue > 0 ? 'Continuer' : 'Commencer'}
                      </a>
                      
                      {/* Bouton de désinscription */}
                      <button
                        onClick={() => openUnenrollModal(course)}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                        disabled={unenrollingCourse === course.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Se désinscrire</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : 'Vous n\'êtes inscrit à aucun cours pour le moment.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <a
                href="/dashboard/student/courses/catalogue"
                className="mt-4 inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-md hover:bg-mdsc-blue-dark transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Découvrir les cours
              </a>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de désinscription */}
      {showUnenrollModal && courseToUnenroll && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center border-2 border-red-500">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-red-900 mb-2">Confirmer la désinscription</h2>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir vous désinscrire de ce cours ?
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-3">
              <p className="font-semibold text-gray-900 text-lg mb-2">{courseToUnenroll.title}</p>
              
              {/* Nombre d'inscrits */}
              {(() => {
                const enrollmentCount = (courseToUnenroll as any).enrollment_count || (courseToUnenroll as any).metrics?.enrollment_count || 0;
                return enrollmentCount > 0 ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span>{enrollmentCount} personne{enrollmentCount > 1 ? 's' : ''} inscrite{enrollmentCount > 1 ? 's' : ''}</span>
                  </div>
                ) : null;
              })()}
              
              {/* Nom de l'instructeur */}
              {(() => {
                const instructor = (courseToUnenroll as any).instructor;
                let instructorName = '';
                if (typeof instructor === 'string' && instructor && instructor !== 'Instructeur') {
                  instructorName = instructor;
                } else if (instructor && typeof instructor === 'object') {
                  instructorName = instructor.name || [instructor.first_name, instructor.last_name].filter(Boolean).join(' ') || '';
                } else if ((courseToUnenroll as any).instructor_first_name || (courseToUnenroll as any).instructor_last_name) {
                  instructorName = [(courseToUnenroll as any).instructor_first_name, (courseToUnenroll as any).instructor_last_name].filter(Boolean).join(' ') || '';
                }
                return instructorName && instructorName.trim() && instructorName !== 'Instructeur' ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                    <User className="h-4 w-4 text-gray-600" />
                    <span>Instructeur : {instructorName}</span>
                  </div>
                ) : null;
              })()}
              
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600 pt-2 border-t border-gray-200">
                <AlertTriangle className="h-4 w-4" />
                <span>Vos progrès dans ce cours seront perdus</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowUnenrollModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                Annuler
              </button>
              <button
                onClick={handleUnenroll}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                {unenrollingCourse === courseToUnenroll.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Désinscription...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Confirmer la désinscription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
