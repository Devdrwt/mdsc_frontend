'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/courses/CourseCard';
import Button from '../../components/ui/Button';
import { Search, Clock, Users } from 'lucide-react';
import { Course } from '../../types';
import { CourseService, Course as ServiceCourse } from '../../lib/services/courseService';
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

const levels = [
  'Tous les niveaux',
  'Débutant',
  'Intermédiaire',
  'Avancé'
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
  const durationString = durationInWeeks > 0 ? `${durationInWeeks} semaines` : 'Durée variable';
  
  // Convertir le niveau pour CourseCard
  const levelString = serviceCourse.level === 'beginner' ? 'Débutant' 
    : serviceCourse.level === 'intermediate' ? 'Intermédiaire' 
    : 'Avancé';

  const courseAny = serviceCourse as any;

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

  const instructorData = {
    id: courseAny.instructor?.id || courseAny.instructor_id || '',
    name: instructorName,
    avatar: resolveMediaUrl(instructorAvatarRaw) || undefined,
  };

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

  return {
    id: serviceCourse.id,
    title: serviceCourse.title,
    slug: serviceCourse.slug || serviceCourse.id, // Utiliser le slug s'il existe, sinon l'id
    description: serviceCourse.description || '',
    shortDescription: serviceCourse.shortDescription || '',
    category: serviceCourse.category || 'non-categorisé',
    level: levelString, // Pour CourseCard
    level_database: serviceCourse.level === 'beginner' ? 'debutant' : serviceCourse.level === 'intermediate' ? 'intermediaire' : 'avance', // Pour le type
    duration: durationString, // String pour CourseCard
    language: 'fr',
    thumbnail_url: courseImage,
    instructor: instructorData,
    is_published: serviceCourse.isPublished !== undefined ? serviceCourse.isPublished : true,
    enrollment_count: serviceCourse.totalStudents || 0,
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [selectedLevel, setSelectedLevel] = useState('Tous les niveaux');
  const [isLoading, setIsLoading] = useState(true);

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
    loadCourses();
  }, []);

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

    // Filtre par niveau
    if (selectedLevel !== 'Tous les niveaux') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

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

  const handleEnroll = (courseId: string) => {
    // TODO: Implémenter l'inscription au cours
    console.log('Enroll in course:', courseId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Catalogue de formations
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Explorez notre collection complète de formations certifiantes et trouvez celle qui correspond à vos objectifs
          </p>
        </div>
      </section>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 -mt-8 relative z-10">
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
              <div className="flex gap-4">
                {/* Filtre catégorie */}
                <div className="min-w-[200px]">
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

                {/* Filtre niveau */}
                <div className="min-w-[150px]">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                />
              ))}
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
