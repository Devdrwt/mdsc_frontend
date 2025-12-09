'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/courses/CourseCard';
import Button from '../../components/ui/Button';
import { Search, Clock, Users, Award, AlertCircle, X } from 'lucide-react';
import { Course } from '../../types';
import { CourseService, Course as ServiceCourse } from '../../lib/services/courseService';
import { useAuthStore } from '../../lib/stores/authStore';
import { DEFAULT_COURSE_IMAGE, resolveMediaUrl } from '../../lib/utils/media';

const categories = [
  'Toutes les catégories',
  'Management',
  'Communication',
  'Gestion de projet',
  'Technologie',
  'Pédagogie',
  'E-learning'
];

// Fonction utilitaire pour convertir en nombre
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

const resolveCourseStatus = (courseAny: Record<string, any>, options: { endDate?: Date | null; explicitExpired?: boolean }): { status: string; isExpired: boolean; isLive: boolean } => {
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

// Fonction pour convertir ServiceCourse en Course (pour CourseCard)
const convertToCourse = (serviceCourse: ServiceCourse): any => {
  // Convertir la durée en string pour CourseCard
  const durationInWeeks = Math.ceil((serviceCourse.duration || 0) / 60 / 7); // Convertir minutes en semaines
  const durationString = durationInWeeks > 0 ? `${durationInWeeks} semaines` : 'Variable';
  
  // Convertir le niveau pour CourseCard
  const courseAny = serviceCourse as any;
  const difficultyRaw =
    courseAny.difficulty ||
    courseAny.course_type ||
    courseAny.courseType ||
    'beginner';
  const levelString = difficultyRaw === 'beginner' || difficultyRaw === 'debutant' ? 'Débutant' 
    : difficultyRaw === 'intermediate' || difficultyRaw === 'intermediaire' ? 'Intermédiaire' 
    : difficultyRaw === 'advanced' || difficultyRaw === 'avance' ? 'Avancé'
    : 'Débutant';

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
    'Formateur';

  const instructorAvatarRaw =
    courseAny.instructor?.avatar ||
    courseAny.instructor_avatar ||
    courseAny.instructorAvatar ||
    null;

  const instructorData = {
    id: courseAny.instructor?.id || courseAny.instructor_id || '',
    name: instructorName,
    avatar: resolveMediaUrl(instructorAvatarRaw) || undefined,
  };

  const rawCategory =
    courseAny.category ||
    courseAny.course_category ||
    courseAny.category_name ||
    courseAny.category_label ||
    serviceCourse.category;

  const categoryValue = (() => {
    if (!rawCategory) return 'Non catégorisé';
    if (typeof rawCategory === 'string') {
      return rawCategory;
    }
    if (Array.isArray(rawCategory)) {
      const labels = rawCategory
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            return (
              (item as any).name ||
              (item as any).label ||
              (item as any).title ||
              null
            );
          }
          return null;
        })
        .filter(Boolean);
      return labels.length ? labels.join(', ') : 'Non catégorisé';
    }
    if (typeof rawCategory === 'object') {
      const categoryAny = rawCategory as any;
      return (
        categoryAny.name ||
        categoryAny.label ||
        categoryAny.title ||
        categoryAny.slug ||
        'Non catégorisé'
      );
    }
    return String(rawCategory);
  })();

  // Gérer l'image du cours - utiliser thumbnail_url, thumbnail, etc.
  const courseImageRaw =
    courseAny.thumbnail_url ||
    serviceCourse.thumbnail ||
    courseAny.thumbnailUrl ||
    null;

  const courseImage = resolveMediaUrl(courseImageRaw) || DEFAULT_COURSE_IMAGE;

  const rawPrice =
    courseAny.price ??
    courseAny.pricing?.amount ??
    courseAny.cost ??
    serviceCourse.price ??
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

  // Récupérer le niveau/difficulty depuis les données brutes de l'API
  const rawDifficulty = courseAny.difficulty || courseAny.level || '';
  
  return {
    id: serviceCourse.id,
    title: serviceCourse.title,
    slug: serviceCourse.slug || serviceCourse.id, // Utiliser le slug s'il existe, sinon l'id
    description: serviceCourse.description || '',
    shortDescription: serviceCourse.shortDescription || '',
    category: categoryValue,
    level: levelString, // Pour CourseCard
    difficulty: difficultyRaw, // Valeur brute de la base de données (beginner, intermediate, advanced)
    level_database: difficultyRaw === 'beginner' ? 'debutant' : difficultyRaw === 'intermediate' ? 'intermediaire' : 'avance', // Pour le type
    duration: durationString, // String pour CourseCard
    language: 'fr',
    thumbnail_url: courseImage,
    instructor: instructorData,
    is_published: serviceCourse.isPublished !== undefined ? serviceCourse.isPublished : true,
    enrollment_count: courseAny.enrollment_count || courseAny.metrics?.enrollment_count || serviceCourse.totalStudents || 0,
    total_lessons: courseAny.total_lessons || courseAny.metrics?.total_lessons || 0,
    rating: serviceCourse.rating || 0,
    // Conversions pour CourseCard
    thumbnail: courseImage,
    students: serviceCourse.totalStudents || 0,
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

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  
  // État pour la vérification de certificat
  const [certificateCode, setCertificateCode] = useState('');
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  
  // Faire disparaître le message d'erreur après 5 secondes
  useEffect(() => {
    if (certificateError) {
      const timer = setTimeout(() => {
        setCertificateError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [certificateError]);
  
  const handleCertificateVerify = () => {
    const code = certificateCode.trim().toUpperCase();
    if (code && code.length > 0) {
      // Valider le format du code (MDSC-XXXXXXXXX-BJ ou Maison-de-la-Societe-Civile-XXXXXXXXX-BJ)
      const codePattern = /^(MDSC|Maison-de-la-Societe-Civile)-\d+-BJ$/;
      if (!codePattern.test(code)) {
        setCertificateError('Format de code invalide. Utilisez le format MDSC-XXXXXXXXX-BJ ou Maison-de-la-Societe-Civile-XXXXXXXXX-BJ');
        certificateInputRef.current?.focus();
        return;
      }
      router.push(`/verify-certificate/${encodeURIComponent(code)}`);
    } else {
      setCertificateError('Veuillez saisir un code de vérification de certificat');
      certificateInputRef.current?.focus();
    }
  };
  
  const handleCertificateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCertificateCode(value);
    if (certificateError) {
      setCertificateError(null);
    }
  };
  
  const handleCertificateKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCertificateVerify();
    }
  };

  // Charger les cours depuis l'API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const response = await CourseService.getAllCourses();
        
        console.log('📦 Réponse API getAllCourses:', response);
        
        // Extraire les cours de la réponse - la structure est { data: { courses: [...], pagination: {...} } }
        const serviceCourses = response.data?.courses || response.courses || response.data || (Array.isArray(response) ? response : []);
        console.log('📚 Cours extraits:', serviceCourses);
        
        const convertedCourses = Array.isArray(serviceCourses) 
          ? serviceCourses.map(convertToCourse)
          : [];
        
        console.log('✅ Cours convertis:', convertedCourses.length, 'cours');
        
        setCourses(convertedCourses);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des cours:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

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
        console.warn('Impossible de charger les cours inscrits (page publique):', error);
        setEnrolledCourseIds(new Set());
      } finally {
        setLoadingEnrollments(false);
      }
    };

    loadCourses();
    loadEnrollments();
  }, [user]);

  // Filtrage des cours
  useEffect(() => {
    if (!Array.isArray(courses)) {
      setFilteredCourses([]);
      return;
    }

    let filtered = courses;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof course.instructor === 'string' 
          ? course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
          : course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'Toutes les catégories') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedCategory]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);

    try {
      // TODO: Remplacer par l'appel API réel
      // const results = await searchCourses(query);
      // setCourses(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = (course: Course) => {
    const numericId = Number(course.id);
    const rawSlug = (course as any).slug || course.slug || course.id;
    const slug = typeof rawSlug === 'string' ? rawSlug : String(rawSlug);

    if (!Number.isNaN(numericId) && enrolledCourseIds.has(numericId)) {
      router.push(`/learn/${numericId}`);
      return;
    }

    router.push(`/courses/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary py-16 "
        // className="min-h-screen flex items-center relative overflow-hidden bg-cover bg-center"
  style={{
    backgroundImage: `url('/Hero.png')`
  }}
      
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Catalogue de formations
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Explorez notre collection complète de formations certifiantes et trouvez celle qui correspond à vos objectifs
          </p>
        </div>
      </section>

      <main className="py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Vérification d'attestation */}
          <div className="mb-6 -mt-8 relative z-10">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg">
                    <Award className="h-5 w-5 text-mdsc-blue-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Vérifier l'authenticité d'un certificat
                    </h3>
                    <p className="text-sm text-gray-600">
                      Saisissez le code de vérification
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:w-80">
                    <input
                      ref={certificateInputRef}
                      type="text"
                      placeholder="Ex: MDSC-23974999-BJ"
                      value={certificateCode}
                      onChange={handleCertificateInputChange}
                      onKeyPress={handleCertificateKeyPress}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent text-gray-900 placeholder:text-gray-400 uppercase transition-colors ${
                        certificateError 
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300'
                      }`}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <button
                    onClick={handleCertificateVerify}
                    className="px-5 py-2.5 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium whitespace-nowrap"
                  >
                    Vérifier
                  </button>
                </div>
              </div>
              
              {/* Message d'erreur */}
              {certificateError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">
                      {certificateError}
                    </p>
                  </div>
                  <button
                    onClick={() => setCertificateError(null)}
                    className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Fermer le message"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-8 -mt-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Recherche */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {/* Filtre catégorie */}
                <div className="w-full sm:min-w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-8">
            <p className="text-lg font-medium text-gray-700">
              {filteredCourses.length} formation{filteredCourses.length > 1 ? 's' : ''} trouvée{filteredCourses.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille des cours */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="bg-gray-300 h-4 rounded"></div>
                    <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredCourses.map((course) => {
                const numericId = Number(course.id);
                const isEnrolled = !Number.isNaN(numericId) && enrolledCourseIds.has(numericId);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnroll={handleEnroll}
                    isEnrolled={isEnrolled}
                    loadingState={loadingEnrollments}
                  />
                );
              })}
            </div>
          )}

          {/* Message si aucun cours trouvé */}
          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-mdsc-gray mb-4">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Aucun cours trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
