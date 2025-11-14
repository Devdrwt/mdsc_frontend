'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseService, Course as ServiceCourse } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import { useAuthStore } from '../../../lib/stores/authStore';
import toast from '../../../lib/utils/toast';
import CourseCard from '../../courses/CourseCard';
import { Course as DisplayCourse } from '../../../types';
import { DEFAULT_COURSE_IMAGE, resolveMediaUrl } from '../../../lib/utils/media';

const AVAILABLE_LEVELS = ['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const;

type DifficultyFilter = (typeof AVAILABLE_LEVELS)[number];

type ExtendedCourse = ServiceCourse & {
  shortDescription?: string;
  thumbnail?: string;
  category?: string | { name?: string };
};

const toNumber = (value: any, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toDateISOString = (value: any): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const resolveCourseStatus = (
  courseAny: Record<string, any>,
  options: { endDate?: Date | null; explicitExpired?: boolean }
): { status: string; isExpired: boolean; isLive: boolean } => {
  const now = new Date();
  const statusRaw = (courseAny.status || courseAny.course_status || courseAny.state || '').toString().toLowerCase();
  const liveFlag = Boolean(
    courseAny.is_live ||
      courseAny.isLive ||
      courseAny.live ||
      statusRaw === 'live' ||
      statusRaw === 'en direct' ||
      statusRaw === 'live-stream'
  );

  const inferredExpired = options.endDate ? options.endDate.getTime() < now.getTime() : false;
  const isExpired = Boolean(options.explicitExpired || inferredExpired || statusRaw === 'expired');

  if (isExpired) {
    return { status: 'expired', isExpired: true, isLive: false };
  }

  if (liveFlag) {
    return { status: 'live', isExpired: false, isLive: true };
  }

  return {
    status: statusRaw || 'active',
    isExpired: false,
    isLive: false,
  };
};

const convertToDisplayCourse = (course: ExtendedCourse): DisplayCourse => {
  const courseAny = course as any;

  const durationInWeeks = Math.ceil((course.duration || 0) / 60 / 7);
  const durationLabel = durationInWeeks > 0 ? `${durationInWeeks} semaines` : 'Durée variable';

  const levelLabel =
    course.level === 'beginner'
      ? 'Débutant'
      : course.level === 'intermediate'
        ? 'Intermédiaire'
        : course.level === 'advanced'
          ? 'Avancé'
          : (course.level as string) || 'Non précisé';

  const instructorFirstName =
    courseAny.instructor_first_name ||
    courseAny.instructorFirstName ||
    courseAny.instructor?.firstName ||
    '';
  const instructorLastName =
    courseAny.instructor_last_name ||
    courseAny.instructorLastName ||
    courseAny.instructor?.lastName ||
    '';
  const instructorName =
    courseAny.instructor?.name ||
    courseAny.instructor_name ||
    [instructorFirstName, instructorLastName].filter(Boolean).join(' ') ||
    'Instructeur';

  const instructorAvatarRaw =
    courseAny.instructor?.avatar ||
    courseAny.instructor_avatar ||
    courseAny.instructorAvatar ||
    null;

  const instructorData =
    typeof course.instructor === 'string'
      ? course.instructor
      : {
          id: courseAny.instructor?.id || courseAny.instructor_id || '',
          name: instructorName,
          avatar: resolveMediaUrl(instructorAvatarRaw) || undefined,
        };

  const rawCategory =
    courseAny.category ||
    courseAny.course_category ||
    courseAny.category_name ||
    courseAny.category_label ||
    course.category;

  const categoryValue = (() => {
    if (!rawCategory) return 'Non catégorisé';
    if (typeof rawCategory === 'string') return rawCategory;
    if (Array.isArray(rawCategory)) {
      const labels = rawCategory
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            return item.name || item.label || item.title || null;
          }
          return null;
        })
        .filter(Boolean);
      return labels.length ? labels.join(', ') : 'Non catégorisé';
    }
    if (typeof rawCategory === 'object') {
      const categoryAny = rawCategory as any;
      return categoryAny.name || categoryAny.label || categoryAny.title || categoryAny.slug || 'Non catégorisé';
    }
    return String(rawCategory);
  })();

  const courseImageRaw =
    courseAny.thumbnail_url ||
    course.thumbnail ||
    courseAny.thumbnailUrl ||
    courseAny.image_url ||
    null;

  const courseImage = resolveMediaUrl(courseImageRaw) || DEFAULT_COURSE_IMAGE;

  const rawPrice =
    courseAny.price ??
    courseAny.pricing?.amount ??
    courseAny.cost ??
    course.price ??
    0;

  const priceValue = toNumber(rawPrice, 0);
  const currencyCode = (courseAny.currency || courseAny.pricing?.currency || 'XOF').toString().toUpperCase();
  const explicitFreeFlag =
    courseAny.is_free ??
    courseAny.isFree ??
    courseAny.free ??
    null;
  const isFree = explicitFreeFlag !== null ? Boolean(explicitFreeFlag) : priceValue <= 0;

  const startDateRaw =
    courseAny.start_date ||
    courseAny.startDate ||
    courseAny.course_start_date ||
    courseAny.begin_at ||
    courseAny.available_from ||
    null;

  const endDateRaw =
    courseAny.end_date ||
    courseAny.endDate ||
    courseAny.course_end_date ||
    courseAny.enrollment_deadline ||
    courseAny.available_until ||
    courseAny.closing_date ||
    null;

  const normalizeDate = (value: any): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startDate = normalizeDate(startDateRaw);
  const endDate = normalizeDate(endDateRaw);
  const explicitExpired = courseAny.is_expired ?? courseAny.expired ?? false;

  const statusInfo = resolveCourseStatus(courseAny, {
    endDate,
    explicitExpired: Boolean(explicitExpired),
  });

  return {
    id: course.id,
    title: course.title,
    slug: course.slug || course.id.toString(),
    description: course.description || '',
    shortDescription: course.shortDescription || '',
    category: categoryValue,
    level: levelLabel,
    duration: durationLabel,
    language: 'fr',
    thumbnail_url: courseImage,
    thumbnail: courseImage,
    instructor: instructorData,
    is_published: course.isPublished ?? true,
    enrollment_count: courseAny.enrollment_count || courseAny.metrics?.enrollment_count || course.totalStudents || 0,
    ...(courseAny.metrics ? { metrics: courseAny.metrics } : {
      metrics: {
        enrollment_count: courseAny.enrollment_count || course.totalStudents || 0,
        average_rating: courseAny.average_rating || course.rating || 0,
        review_count: courseAny.review_count || 0,
        total_views: courseAny.total_views || 0
      }
    }),
    rating: course.rating || 0,
    students: courseAny.enrollment_count || courseAny.metrics?.enrollment_count || course.totalStudents || 0,
    price: priceValue,
    priceAmount: priceValue,
    currency: currencyCode,
    isFree,
    isLive: statusInfo.isLive,
    isExpired: statusInfo.isExpired,
    status: statusInfo.status,
    startDate: startDate ? startDate.toISOString() : toDateISOString(startDateRaw),
    endDate: endDate ? endDate.toISOString() : toDateISOString(endDateRaw),
  };
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
        const data =
          response?.data?.courses ||
          response?.data ||
          (Array.isArray(response) ? response : []);
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
        const instructorMatch = (() => {
          if (typeof course.instructor === 'string') {
            return course.instructor.toLowerCase().includes(lowered);
          }
          const instructorAny = course.instructor as any;
          return instructorAny?.name?.toLowerCase().includes(lowered) || false;
        })();

        return titleMatch || descriptionMatch || instructorMatch;
      });
    }

    if (selectedCategory !== 'all') {
      current = current.filter((course) => {
        if (typeof course.category === 'string') {
          return course.category === selectedCategory;
        }
        if (course.category && typeof course.category === 'object') {
          return (course.category as any).name === selectedCategory;
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
      } else if (typeof course.category === 'object' && (course.category as any)?.name) {
        names.add((course.category as any).name);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const displayCourses = useMemo(
    () => filteredCourses.map((course) => convertToDisplayCourse(course)),
    [filteredCourses]
  );

  const handleCourseAction = async (displayCourse: DisplayCourse) => {
    const numericId = Number(displayCourse.id);

    if (!Number.isNaN(numericId) && enrolledCourseIds.has(numericId)) {
      router.push(`/learn/${displayCourse.id}`);
      return;
    }

    const originalCourse =
      courses.find((course) => String(course.id) === String(displayCourse.id)) || null;

    const courseAny = originalCourse ? (originalCourse as any) : (displayCourse as any);
    const rawPrice =
      courseAny.price ??
      courseAny.priceAmount ??
      displayCourse.price ??
      (displayCourse as any).priceAmount ??
      0;
    const price = Number(rawPrice);

    if (price > 0) {
      router.push(`/payments/new?courseId=${displayCourse.id}`);
      return;
    }

    if (Number.isNaN(numericId)) {
      toast.error('Erreur', "Identifiant de cours invalide");
      return;
    }

    try {
      await EnrollmentService.enrollInCourse(numericId);
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours');
      setEnrolledCourseIds((prev) => {
        const next = new Set(prev);
        next.add(numericId);
        return next;
      });
      router.push('/dashboard/student/courses');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      toast.error('Erreur', error?.message || "Impossible de vous inscrire à cette formation");
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Catalogue de formations
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
            Explorez notre collection complète de formations certifiantes et trouvez celle qui correspond à vos objectifs
          </p>
        </div>
      </section>

      <div className="bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 -mt-12 relative z-10">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="min-w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[180px]">
                  <select
                    value={selectedLevel}
                    onChange={(event) => setSelectedLevel(event.target.value as DifficultyFilter)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    <option value="all">Tous les niveaux</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-8">
            <p className="text-lg font-medium text-gray-700">
              {displayCourses.length} formation{displayCourses.length > 1 ? 's' : ''} trouvée{displayCourses.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4" />
                  <div className="space-y-3">
                    <div className="bg-gray-300 h-4 rounded" />
                    <div className="bg-gray-300 h-4 rounded w-3/4" />
                    <div className="bg-gray-300 h-4 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-xl font-semibold text-gray-900 mb-2">Aucune formation trouvée</p>
              <p className="text-gray-500">
                Ajustez vos filtres ou réinitialisez la recherche pour découvrir d'autres cours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCourses.map((course) => {
                const numericId = Number(course.id);
                const isEnrolled = !Number.isNaN(numericId) && enrolledCourseIds.has(numericId);

                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnroll={handleCourseAction}
                    isEnrolled={isEnrolled}
                    loadingState={loadingEnrollments}
                    ctaLabel="S'inscrire"
                    enrolledCtaLabel="Continuer"
                    loadingCtaLabel="Chargement..."
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
