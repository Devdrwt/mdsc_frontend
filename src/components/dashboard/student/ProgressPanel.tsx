'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award, 
  BarChart3,
  Calendar,
  Target,
  Zap,
  Trophy,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: string;
  enrolledAt: string;
  status: 'not-started' | 'in-progress' | 'completed';
  estimatedTimeRemaining: number;
  category: string;
}

export default function ProgressPanel() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userCourses = await courseService.getMyCourses();
        
        // Transformer les cours en format de progression
        const progressData: CourseProgress[] = (userCourses || []).map((course: any) => {
          const progress = course.progress || 0;
          const totalLessons = course.lessons?.length || 0;
          const completedLessons = Math.round((progress / 100) * totalLessons);
          
          return {
            courseId: course.id,
            courseTitle: course.title,
            progress: progress,
            completedLessons,
            totalLessons,
            lastAccessedAt: course.lastAccessedAt || course.updatedAt || new Date().toISOString(),
            enrolledAt: course.enrolledAt || course.createdAt || new Date().toISOString(),
            status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
            estimatedTimeRemaining: Math.ceil((100 - progress) / 10), // Temps estimé en heures
            category: course.category || 'Général',
          };
        });
        
        setCourses(progressData);
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const filteredCourses = courses.filter(course => 
    activeFilter === 'all' ? true : course.status === activeFilter
  );

  const overallStats = {
    totalCourses: courses.length,
    completedCourses: courses.filter(c => c.status === 'completed').length,
    inProgressCourses: courses.filter(c => c.status === 'in-progress').length,
    averageProgress: courses.length > 0 
      ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) 
      : 0,
    totalCompletedLessons: courses.reduce((sum, c) => sum + c.completedLessons, 0),
    totalLessons: courses.reduce((sum, c) => sum + c.totalLessons, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminé
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </span>
        );
      case 'not-started':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Non commencé
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cours</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalCourses}</p>
              <p className="text-xs text-gray-500">{overallStats.completedCourses} terminés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Progression Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.averageProgress}%</p>
              <p className="text-xs text-gray-500">Sur tous les cours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Leçons Complétées</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalCompletedLessons}</p>
              <p className="text-xs text-gray-500">sur {overallStats.totalLessons} total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En Cours</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.inProgressCourses}</p>
              <p className="text-xs text-gray-500">cours actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="bg-gradient-to-r from-mdsc-blue-primary to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Progression Globale</h3>
            <p className="text-blue-100 text-sm">Votre avancement sur tous vos cours</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{overallStats.averageProgress}%</p>
            <p className="text-blue-100 text-sm">
              {overallStats.totalCompletedLessons} / {overallStats.totalLessons} leçons
            </p>
          </div>
        </div>
        <div className="w-full bg-blue-700 rounded-full h-4">
          <div 
            className="bg-white h-4 rounded-full transition-all duration-500"
            style={{ width: `${overallStats.averageProgress}%` }}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tous les cours', count: overallStats.totalCourses },
            { key: 'in-progress', label: 'En cours', count: overallStats.inProgressCourses },
            { key: 'completed', label: 'Terminés', count: overallStats.completedCourses },
            { key: 'not-started', label: 'Non commencés', count: overallStats.totalCourses - overallStats.completedCourses - overallStats.inProgressCourses },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeFilter === filter.key
                  ? 'bg-mdsc-blue-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des cours avec progression */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div key={course.courseId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{course.courseTitle}</h3>
                    {getStatusBadge(course.status)}
                  </div>
                  <p className="text-sm text-gray-500">{course.category}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Barre de progression */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm font-bold text-gray-900">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${getProgressColor(course.progress)} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {course.completedLessons}/{course.totalLessons}
                    </div>
                    <p className="text-xs text-gray-500">Leçons</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {course.estimatedTimeRemaining}h
                    </div>
                    <p className="text-xs text-gray-500">Temps restant</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {course.status === 'completed' ? '✓' : '⏱'}
                    </div>
                    <p className="text-xs text-gray-500">
                      {course.status === 'completed' ? 'Terminé' : 'En cours'}
                    </p>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="pt-3 border-t border-gray-200">
                  <a 
                    href={`/courses/${course.courseId}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {course.status === 'not-started' ? 'Commencer' : 'Continuer'} 
                    <TrendingUp className="h-4 w-4 ml-2" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune progression</h3>
          <p className="text-gray-600 mb-6">
            {activeFilter === 'all' 
              ? 'Vous n\'êtes inscrit à aucun cours pour le moment.'
              : `Aucun cours ${activeFilter === 'in-progress' ? 'en cours' : activeFilter === 'completed' ? 'terminé' : 'non commencé'}.`
            }
          </p>
          <a 
            href="/courses"
            className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Explorer les cours
          </a>
        </div>
      )}

      {/* Graphique de tendance (placeholder) */}
      {filteredCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance de Progression</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Graphique de progression en développement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

