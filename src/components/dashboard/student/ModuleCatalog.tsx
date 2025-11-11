'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  DollarSign,
  Users,
  Target,
  BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseService, Course } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import { useAuthStore } from '../../../lib/stores/authStore';
import toast from '../../../lib/utils/toast';

const difficultyLabels: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

const difficultyStyles: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
  expert: 'bg-purple-100 text-purple-800'
};

const AVAILABLE_LEVELS = ['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const;

type DifficultyFilter = (typeof AVAILABLE_LEVELS)[number];

type ExtendedCourse = Course & {
  shortDescription?: string;
  thumbnail?: string;
  category?: string;
};

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const resolveThumbnail = (value?: string | null): string => {
  if (!value) {
    return '/apprenant.png';
  }

  const normalized = value.replace(/\\/g, '/');

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${apiBaseUrl}${withSlash}`;
};

export default function ModuleCatalog() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<ExtendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<DifficultyFilter>('all');

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const response = await CourseService.getAllCourses();
        const data = response?.data?.courses || response?.data || (Array.isArray(response) ? response : []);
        const asCourses = Array.isArray(data) ? (data as ExtendedCourse[]) : [];
        setCourses(asCourses);
        setFilteredCourses(asCourses);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        toast.error('Erreur', "Impossible de charger le catalogue de formations");
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) {
        setEnrolledCourseIds(new Set());
        setLoadingEnrollments(false);
        return;
      }

      try {
        setLoadingEnrollments(true);
        const myCourses = await CourseService.getMyCourses();
        const ids = new Set<number>();
        (myCourses || []).forEach((course: any) => {
          const id = Number(course.id ?? course.course_id ?? course.courseId);
          if (!Number.isNaN(id)) {
            ids.add(id);
          }
        });
        setEnrolledCourseIds(ids);
      } catch (error) {
        console.warn('Impossible de charger les cours inscrits:', error);
        setEnrolledCourseIds(new Set());
      } finally {
        setLoadingEnrollments(false);
      }
    };

    loadEnrollments();
  }, [user]);

  useEffect(() => {
    let current = courses;

    if (searchTerm) {
      const lowered = searchTerm.toLowerCase();
      current = current.filter((course) => {
        const titleMatch = course.title?.toLowerCase().includes(lowered);
        const descriptionMatch = course.description?.toLowerCase().includes(lowered);
        const instructorMatch = typeof course.instructor === 'string'
          ? course.instructor.toLowerCase().includes(lowered)
          : course.instructor?.name?.toLowerCase().includes(lowered);

        return titleMatch || descriptionMatch || instructorMatch;
      });
    }

    if (selectedCategory !== 'all') {
      current = current.filter((course) => {
        if (typeof course.category === 'string') {
          return course.category === selectedCategory;
        }
        if (course.category && typeof course.category === 'object') {
          return course.category.name === selectedCategory;
        }
        return false;
      });
    }

    if (selectedLevel !== 'all') {
      current = current.filter((course) => (course.level || '').toLowerCase() === selectedLevel);
    }

    setFilteredCourses(current);
  }, [courses, searchTerm, selectedCategory, selectedLevel]);

  const categories = useMemo(() => {
    const names = new Set<string>();

    courses.forEach((course) => {
      if (!course.category) {
        return;
      }
      if (typeof course.category === 'string') {
        names.add(course.category);
      } else if (typeof course.category === 'object' && course.category?.name) {
        names.add(course.category.name);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const handleEnroll = async (course: ExtendedCourse) => {
    const numericId = Number(course.id);
    if (enrolledCourseIds.has(numericId)) {
      router.push(`/learn/${course.id}`);
      return;
    }

    const rawPrice = (course as any).price ?? course.price ?? 0;
    const price = Number(rawPrice);

    if (price > 0) {
      router.push(`/payments/new?courseId=${course.id}`);
      return;
    }

    try {
      await EnrollmentService.enrollInCourse(Number(course.id));
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours');
      setEnrolledCourseIds((prev) => {
        const next = new Set(prev);
        if (!Number.isNaN(numericId)) {
          next.add(numericId);
        }
        return next;
      });
      router.push('/dashboard/student/courses');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      toast.error('Erreur', error?.message || "Impossible de vous inscrire à cette formation");
    }
  };

  const renderDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) {
      return null;
    }

    const key = difficulty.toLowerCase();
    const label = difficultyLabels[key] || difficulty;
    const style = difficultyStyles[key] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        <Target className="h-3 w-3 mr-1" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Catalogue des formations</h1>
        <p className="text-mdsc-gray-light">
          Retrouvez l'ensemble des formations disponibles et inscrivez-vous directement depuis votre espace.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent w-full"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(event) => setSelectedLevel(event.target.value as DifficultyFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            >
              <option value="all">Tous les niveaux</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>
              {filteredCourses.length} formation{filteredCourses.length > 1 ? 's' : ''} affichée{filteredCourses.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune formation trouvée</h3>
          <p className="text-gray-500">
            Ajustez vos filtres ou réinitialisez la recherche pour découvrir d'autres cours.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const thumbnail = resolveThumbnail((course as any).thumbnail_url || course.thumbnail);
            const categoryName = typeof course.category === 'string'
              ? course.category
              : course.category?.name;
            const numericId = Number(course.id);
            const isEnrolled = !Number.isNaN(numericId) && enrolledCourseIds.has(numericId);

            return (
              <div
                key={course.id}
                className={`bg-white rounded-xl border shadow-sm transition-all flex flex-col overflow-hidden ${
                  isEnrolled
                    ? 'border-green-400 shadow-green-100 ring-2 ring-green-100'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="relative h-40 w-full bg-gray-200">
                  {isEnrolled && (
                    <span className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow">
                      <BadgeCheck className="h-3 w-3 mr-1" /> Inscrit
                    </span>
                  )}
                  <img
                    src={thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      const target = event.currentTarget;
                      if (target.src !== '/apprenant.png') {
                        target.src = '/apprenant.png';
                      }
                    }}
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {course.shortDescription || course.description || 'Aucune description renseignée.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {categoryName && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {categoryName}
                      </span>
                    )}
                    {renderDifficultyBadge(course.level)}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      {course.duration && (
                        <span className="inline-flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {Math.ceil(Number(course.duration) / 60)} h
                        </span>
                      )}
                      {course.price && Number(course.price) > 0 ? (
                        <span className="inline-flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {Number(course.price)} €
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-green-600 font-semibold">
                          Gratuit
                        </span>
                      )}
                    </div>
                    {course.instructor && typeof course.instructor === 'object' && course.instructor?.name && (
                      <span className="inline-flex items-center text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {course.instructor.name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleEnroll(course)}
                    disabled={loadingEnrollments}
                    className={`mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isEnrolled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-mdsc-blue-primary text-white hover:bg-mdsc-blue-dark'
                    } ${loadingEnrollments ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loadingEnrollments
                      ? 'Chargement...'
                      : isEnrolled
                        ? 'Continuer'
                        : "S'inscrire"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
