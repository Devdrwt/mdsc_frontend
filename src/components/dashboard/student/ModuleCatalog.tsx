'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Star, 
  Users,
  PlayCircle,
  Award,
  TrendingUp,
  ChevronRight,
  MapPin,
  Target
} from 'lucide-react';
import { CourseService, courseService, Course } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import toast from '../../../lib/utils/toast';

export default function ModuleCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Charger tous les cours disponibles (publiés uniquement)
      const allCourses = await CourseService.getAllCourses();
      // S'assurer que allCourses est toujours un tableau
      setCourses(Array.isArray(allCourses) ? allCourses : []);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      await EnrollmentService.enrollInCourse(courseId.toString());
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours');
      loadCourses();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'inscription');
    }
  };

  const filteredCourses = Array.isArray(courses) ? courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDifficulty = filterDifficulty === 'all' || course.level === filterDifficulty;
    
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    
    return matchesSearch && matchesDifficulty && matchesCategory;
  }) : [];

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      expert: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[difficulty as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[difficulty as keyof typeof labels] || difficulty}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catalogue des Formations</h1>
        <p className="text-gray-600 mt-2">Découvrez et inscrivez-vous aux cours de formation</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {Array.isArray(courses) && courses.filter((c, i, arr) => arr.findIndex(cc => c.category === cc.category) === i).map((course) => (
            <option key={course.category} value={course.category}>{course.category}</option>
          ))}
            </select>
          </div>

          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les niveaux</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
          </div>

          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {filteredCourses.length} cours trouvé{filteredCourses.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours trouvé</h3>
          <p className="text-gray-500">Aucun cours ne correspond à vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image du cours */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-white opacity-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Contenu */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {course.shortDescription || course.description}
                </p>

                <div className="flex items-center flex-wrap gap-2 mb-4">
                  {course.level && getDifficultyBadge(course.level)}
                  {course.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {course.category}
                    </span>
                  )}
                </div>

                {/* Statistiques */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    {course.duration && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.ceil(course.duration / 60)}h
                      </span>
                    )}
                    {course.price && course.price > 0 ? (
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {course.price}€
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600 font-semibold">
                        Gratuit
                      </span>
                    )}
                  </div>
                  {course.instructor && (
                    <span className="flex items-center text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {course.instructor.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleEnroll(Number(course.id))}
                  className="w-full btn-mdsc-primary flex items-center justify-center space-x-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>S'inscrire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
