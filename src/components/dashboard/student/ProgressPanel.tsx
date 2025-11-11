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
  completedDurationMinutes: number;
  totalDurationMinutes: number;
  remainingDurationMinutes: number;
  lastAccessedAt: string;
  enrolledAt: string;
  status: 'not-started' | 'in-progress' | 'completed';
  estimatedTimeRemainingHours: number;
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
          const progressValueRaw =
            course.progress_percentage ??
            course.progress ??
            course.enrollment?.progress_percentage ??
            0;
          const progress =
            typeof progressValueRaw === 'number' && Number.isFinite(progressValueRaw)
              ? Math.round(progressValueRaw)
              : 0;

          const lessonsArray = Array.isArray(course.lessons)
            ? course.lessons
            : Array.isArray(course.modules)
            ? course.modules.flatMap((module: any) => module?.lessons || [])
            : [];

          const totalLessons = (() => {
            const dbTotalLessonsRaw =
              course.total_lessons ??
              course.totalLessons ??
              course.enrollment?.total_lessons;
            if (typeof dbTotalLessonsRaw === 'number' && Number.isFinite(dbTotalLessonsRaw)) {
              return dbTotalLessonsRaw;
            }
            const parsed = Number(dbTotalLessonsRaw);
            if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
              return parsed;
            }
            return lessonsArray.length;
          })();

          const completedLessons = (() => {
            const dbCompletedLessonsRaw =
              course.completed_lessons ??
              course.completedLessons ??
              course.enrollment?.completed_lessons;
            if (typeof dbCompletedLessonsRaw === 'number' && Number.isFinite(dbCompletedLessonsRaw)) {
              return dbCompletedLessonsRaw;
            }
            const parsed = Number(dbCompletedLessonsRaw);
            if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
              return parsed;
            }
            if (totalLessons > 0) {
              return Math.round((progress / 100) * totalLessons);
            }
            return 0;
          })();

          const summedLessonsDuration = lessonsArray.reduce((sum: number, lesson: any) => {
            const durationRaw = lesson?.duration_minutes ?? lesson?.duration ?? 0;
            const duration =
              typeof durationRaw === 'number' && Number.isFinite(durationRaw)
                ? durationRaw
                : Number(durationRaw ?? 0);
            return sum + (Number.isFinite(duration) ? duration : 0);
          }, 0);

          const courseDurationRaw =
            course.total_duration_minutes ??
            course.duration_minutes ??
            course.duration ??
            0;
          const courseDuration =
            typeof courseDurationRaw === 'number' && Number.isFinite(courseDurationRaw)
              ? courseDurationRaw
              : Number(courseDurationRaw ?? 0);

          const totalDurationMinutes = summedLessonsDuration > 0 ? summedLessonsDuration : Math.max(courseDuration, 0);
          const completedDurationMinutes =
            totalLessons > 0
              ? Math.round((completedLessons / Math.max(totalLessons, 1)) * totalDurationMinutes)
              : Math.round((progress / 100) * totalDurationMinutes);

          const remainingDurationMinutes = Math.max(totalDurationMinutes - completedDurationMinutes, 0);
          const estimatedTimeRemainingHours = totalDurationMinutes > 0
            ? Math.max(Math.ceil(remainingDurationMinutes / 60), 0)
            : Math.max(Math.ceil((100 - progress) / 10), 0);

          const categoryValue = (() => {
            const cat = course.category || course.category_id || course.courseCategory;
            if (!cat) return 'Général';
            if (typeof cat === 'string') return cat;
            if (Array.isArray(cat)) {
              const first = cat[0];
              if (!first) return 'Général';
              if (typeof first === 'string') return first;
              if (typeof first?.name === 'string') return first.name;
            }
            if (typeof cat?.name === 'string') return cat.name;
            return 'Général';
          })();

          return {
            courseId: String(course.id ?? course.courseId ?? ''),
            courseTitle: course.title ?? course.name ?? 'Cours sans titre',
            progress,
            completedLessons,
            totalLessons,
            completedDurationMinutes,
            totalDurationMinutes,
            remainingDurationMinutes,
            lastAccessedAt:
              course.lastAccessedAt ||
              course.updatedAt ||
              course.enrollment?.last_accessed_at ||
              new Date().toISOString(),
            enrolledAt:
              course.enrolledAt ||
              course.createdAt ||
              course.enrollment?.enrolled_at ||
              new Date().toISOString(),
            status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
            estimatedTimeRemainingHours,
            category: categoryValue,
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
    totalCompletedMinutes: courses.reduce((sum, c) => sum + c.completedDurationMinutes, 0),
    totalMinutes: courses.reduce((sum, c) => sum + c.totalDurationMinutes, 0),
    totalRemainingMinutes: courses.reduce((sum, c) => sum + c.remainingDurationMinutes, 0),
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

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0 h';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) {
      return `${remainingMinutes} min`;
    }
    if (remainingMinutes === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${remainingMinutes} min`;
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Leçons Complétées</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalCompletedLessons}</p>
              <p className="text-xs text-gray-500">
                {overallStats.totalLessons} au total · {formatDuration(overallStats.totalCompletedMinutes)} suivies
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
            <p className="text-blue-100 text-xs">
              {formatDuration(overallStats.totalCompletedMinutes)} suivies / {formatDuration(overallStats.totalMinutes)}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
            <div key={course.courseId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {course.completedLessons}/{course.totalLessons}
                    </div>
                    <p className="text-xs text-gray-500">Leçons</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {course.totalDurationMinutes > 0
                        ? formatDuration(course.remainingDurationMinutes)
                        : `${course.estimatedTimeRemainingHours}h`}
                    </div>
                    <p className="text-xs text-gray-500">Temps restant</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatDuration(course.completedDurationMinutes)}
                    </div>
                    <p className="text-xs text-gray-500">Temps suivi</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {course.totalDurationMinutes > 0 ? formatDuration(course.totalDurationMinutes) : '—'}
                    </div>
                    <p className="text-xs text-gray-500">Durée totale</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun cours trouvé pour votre filtre actuel.</p>
        </div>
      )}
    </div>
  );
}