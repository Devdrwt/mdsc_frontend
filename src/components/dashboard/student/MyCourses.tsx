'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, Star, Play, CheckCircle, Award, Filter, Search, X, Trash2 } from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';
import DataTable from '../shared/DataTable';

export default function MyCourses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [unenrollingCourse, setUnenrollingCourse] = useState<string | null>(null);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState<Course | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userCourses = await courseService.getMyCourses();
        setCourses(userCourses || []);
        setFilteredCourses(userCourses || []);
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
  }, [user]);

  useEffect(() => {
    let filtered = courses;

    // Filtrage par statut
    switch (filterStatus) {
      case 'in-progress':
        filtered = filtered.filter(course => course.progress > 0 && course.progress < 100);
        break;
      case 'completed':
        filtered = filtered.filter(course => course.progress === 100);
        break;
      case 'not-started':
        filtered = filtered.filter(course => course.progress === 0);
        break;
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterStatus]);

  const getStatusBadge = (course: Course) => {
    if (course.progress === 100) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Terminé
        </span>
      );
    } else if (course.progress > 0) {
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

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return;
    
    setUnenrollingCourse(courseToUnenroll.id);
    try {
      await courseService.unenrollFromCourse(courseToUnenroll.id);
      // Retirer le cours de la liste
      setCourses(courses.filter(c => c.id !== courseToUnenroll.id));
      setFilteredCourses(filteredCourses.filter(c => c.id !== courseToUnenroll.id));
      setShowUnenrollModal(false);
      setCourseToUnenroll(null);
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      alert('Erreur lors de la désinscription. Veuillez réessayer.');
    } finally {
      setUnenrollingCourse(null);
    }
  };

  const openUnenrollModal = (course: Course) => {
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
      <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Mes Cours 📚</h1>
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
                {courses.filter(c => c.progress === 100).length}
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
                {courses.filter(c => c.progress > 0 && c.progress < 100).length}
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
                  ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
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
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.category}</span>
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
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progress)}`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {/* Bouton d'action */}
                      <a
                        href={`/dashboard/student/courses/${course.id}`}
                        className="btn-mdsc-primary text-sm"
                      >
                        {course.progress === 100 ? 'Revoir' : course.progress > 0 ? 'Continuer' : 'Commencer'}
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
                href="/courses"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la désinscription</h3>
              <button
                onClick={() => setShowUnenrollModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Êtes-vous sûr de vouloir vous désinscrire du cours :
              </p>
              <p className="font-semibold text-gray-900">{courseToUnenroll.title}</p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Vos progrès dans ce cours seront perdus.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnenrollModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                Annuler
              </button>
              <button
                onClick={handleUnenroll}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                {unenrollingCourse === courseToUnenroll.id ? 'Désinscription...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
