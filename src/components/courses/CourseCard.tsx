'use client';

import React, { useMemo, useState } from 'react';
import { Users, User, BadgeCheck, AlertCircle, BookOpen } from 'lucide-react';
import { Course } from '../../types';
import Button from '../ui/Button';
import { DEFAULT_COURSE_IMAGE, resolveMediaUrl } from '../../lib/utils/media';

interface CourseCardProps {
  course: Course;
  onEnroll?: (course: Course) => void;
  showEnrollButton?: boolean;
  isEnrolled?: boolean;
  loadingState?: boolean;
  ctaLabel?: string;
  enrolledCtaLabel?: string;
  loadingCtaLabel?: string;
}

export default function CourseCard({
  course,
  onEnroll,
  showEnrollButton = true,
  isEnrolled = false,
  loadingState = false,
  ctaLabel,
  enrolledCtaLabel,
  loadingCtaLabel,
}: CourseCardProps) {
  const [imageError, setImageError] = useState(false);
  const courseAny = course as any;

  const rawThumbnail =
    course.thumbnail || courseAny.thumbnail_url || courseAny.thumbnailUrl || courseAny.image_url;
  const resolvedThumbnail = resolveMediaUrl(rawThumbnail) || DEFAULT_COURSE_IMAGE;
  const imageSrc = imageError ? DEFAULT_COURSE_IMAGE : resolvedThumbnail;

  const priceValue = useMemo(() => {
    const rawPrice = courseAny.priceAmount ?? courseAny.price ?? 0;
    const numeric = Number(rawPrice);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [courseAny.price, courseAny.priceAmount]);

  const currencyCode = useMemo(() => {
    const currency = (courseAny.currency || courseAny.price_currency || 'XOF').toString().toUpperCase();
    return currency.length === 3 ? currency : 'XOF';
  }, [courseAny.currency, courseAny.price_currency]);

  const isFree = useMemo(() => {
    const explicit = courseAny.isFree ?? courseAny.is_free ?? courseAny.free;
    if (explicit !== undefined && explicit !== null) {
      return Boolean(explicit);
    }
    return priceValue <= 0;
  }, [courseAny.free, courseAny.isFree, courseAny.is_free, priceValue]);

  const priceLabel = useMemo(() => {
    if (isFree) return 'Gratuit';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 0,
      }).format(priceValue);
    } catch {
      return `${priceValue.toLocaleString('fr-FR')} ${currencyCode}`;
    }
  }, [currencyCode, isFree, priceValue]);

  const instructorName = useMemo(() => {
    if (typeof course.instructor === 'string') {
      return course.instructor;
    }

    if (course.instructor?.name) {
      return course.instructor.name;
    }

    const instructorAny = course.instructor as any;
    const firstName =
      instructorAny?.firstName ||
      instructorAny?.first_name ||
      courseAny.instructor_first_name ||
      '';
    const lastName =
      instructorAny?.lastName ||
      instructorAny?.last_name ||
      courseAny.instructor_last_name ||
      '';

    const fallback =
      courseAny.instructor_name || [firstName, lastName].filter(Boolean).join(' ') || 'Instructeur';

    return fallback;
  }, [course.instructor, courseAny]);

  const categoryLabel = useMemo(() => {
    if (!course.category) return 'Autre';
    if (typeof course.category === 'string') return course.category;
    if (typeof course.category === 'object') {
      const categoryAny = course.category as any;
      if (categoryAny?.name || categoryAny?.label || categoryAny?.title) {
        return categoryAny?.name || categoryAny?.label || categoryAny?.title;
      }
      if (Array.isArray(categoryAny)) {
        const labels = categoryAny
          .map((item: any) => item?.name || item?.label || item?.title)
          .filter(Boolean);
        return labels.length ? labels.join(', ') : 'Autre';
      }
      return 'Autre';
    }
    return String(course.category);
  }, [course.category]);

  // Normaliser le niveau depuis la base de données
  const normalizedLevel = useMemo(() => {
    const courseAny = course as any;
    // Chercher dans toutes les variantes possibles de noms de champs
    // Priorité: difficulty (valeur brute de la DB) > level (peut être formaté)
    const rawLevel = 
      courseAny.difficulty ||  // Valeur brute de la base de données (beginner, intermediate, advanced)
      courseAny.difficulty_level ||
      course.level || 
      courseAny.level ||  // Peut être formaté (Débutant, Intermédiaire, Avancé)
      courseAny.course_type ||
      courseAny.courseType ||
      courseAny.level_name ||
      (course as any).difficulty ||
      '';
    
    // Si c'est null, undefined, ou une chaîne vide, retourner une chaîne vide
    if (!rawLevel || rawLevel === 'null' || rawLevel === 'undefined') {
      return '';
    }
    
    const levelStr = String(rawLevel).toLowerCase().trim();
    
    // Si la chaîne est vide après trim, retourner vide
    if (!levelStr) {
      return '';
    }
    
    // Mapper toutes les variantes possibles (y compris les strings formatées)
    if (levelStr === 'beginner' || levelStr === 'debutant' || levelStr === 'débutant') {
      return 'debutant';
    }
    if (levelStr === 'intermediate' || levelStr === 'intermediaire' || levelStr === 'intermédiaire') {
      return 'intermediaire';
    }
    if (levelStr === 'advanced' || levelStr === 'avance' || levelStr === 'avancé') {
      return 'avance';
    }
    // Si c'est une autre valeur, la retourner telle quelle (normalisée)
    return levelStr;
  }, [course]);

  // Formater le niveau pour l'affichage
  const levelLabel = useMemo(() => {
    // Si le niveau est vide, retourner "Non spécifié"
    if (!normalizedLevel || normalizedLevel.trim() === '') {
      return 'Non spécifié';
    }
    
    switch (normalizedLevel) {
      case 'beginner':
      case 'debutant':
      case 'débutant':
        return 'Débutant';
      case 'intermediate':
      case 'intermediaire':
      case 'intermédiaire':
        return 'Intermédiaire';
      case 'advanced':
      case 'avance':
      case 'avancé':
        return 'Avancé';
      default:
        // Si c'est une autre valeur, capitaliser la première lettre
        return normalizedLevel.charAt(0).toUpperCase() + normalizedLevel.slice(1);
    }
  }, [normalizedLevel]);

  const getLevelColor = (level: string) => {
    // Si le niveau est vide, retourner une couleur par défaut
    if (!level || level.trim() === '') {
      return 'bg-gray-100 text-gray-600';
    }
    
    const normalized = String(level).toLowerCase().trim();
    // Gérer toutes les variantes possibles
    if (normalized === 'beginner' || normalized === 'debutant' || normalized === 'débutant') {
      return 'bg-green-100 text-green-800';
    }
    if (normalized === 'intermediate' || normalized === 'intermediaire' || normalized === 'intermédiaire') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (normalized === 'advanced' || normalized === 'avance' || normalized === 'avancé') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const parseISODate = (value: any): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startDate = useMemo(
    () => parseISODate(courseAny.startDate || courseAny.start_date || courseAny.course_start_date),
    [courseAny.startDate, courseAny.start_date, courseAny.course_start_date]
  );
  const endDate = useMemo(
    () => parseISODate(courseAny.endDate || courseAny.end_date || courseAny.course_end_date),
    [courseAny.endDate, courseAny.end_date, courseAny.course_end_date]
  );

  const isExpired = useMemo(() => {
    if (courseAny.isExpired || courseAny.is_expired || courseAny.expired) return true;
    if (!endDate) return false;
    return endDate.getTime() < Date.now();
  }, [courseAny.expired, courseAny.isExpired, courseAny.is_expired, endDate]);

  const statusRaw = (courseAny.status || courseAny.course_status || '').toString().toLowerCase();

  const isLive = useMemo(() => {
    if (courseAny.isLive || courseAny.is_live || courseAny.live) return true;
    return statusRaw === 'live' || statusRaw === 'en direct' || statusRaw === 'live-stream';
  }, [courseAny.isLive, courseAny.is_live, courseAny.live, statusRaw]);

  const statusLabel = useMemo(() => {
    if (isExpired) return 'Expiré';
    if (isLive) return 'En direct';
    if (statusRaw === 'upcoming') return 'À venir';
    if (statusRaw === 'draft') return 'Brouillon';
    return 'Actif';
  }, [isExpired, isLive, statusRaw]);

  const statusClasses = useMemo(() => {
    if (isExpired) return 'bg-red-600 text-white';
    if (isLive) return 'bg-orange-500 text-white';
    if (statusRaw === 'upcoming') return 'bg-indigo-500 text-white';
    if (statusRaw === 'draft') return 'bg-gray-500 text-white';
    return 'bg-emerald-600 text-white';
  }, [isExpired, isLive, statusRaw]);

  const expiryText = useMemo(() => {
    if (isExpired && endDate) {
      return `Expiré le ${endDate.toLocaleDateString('fr-FR')}`;
    }
    if (!isExpired && endDate) {
      // Pour les cours live, afficher la date avec l'heure
      if (isLive) {
        // Formater avec date et heure pour les cours live
        // Utiliser un formatage manuel pour garantir l'affichage de l'heure
        const day = String(endDate.getDate()).padStart(2, '0');
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const year = endDate.getFullYear();
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        
        return `Disponible jusqu'au ${day}/${month}/${year} à ${hours}:${minutes}`;
      }
      return `Disponible jusqu'au ${endDate.toLocaleDateString('fr-FR')}`;
    }
    if (!isExpired && startDate) {
      return `Commence le ${startDate.toLocaleDateString('fr-FR')}`;
    }
    return null;
  }, [endDate, isExpired, startDate, isLive]);

  const handleClick = () => {
    const rawSlug = (course as any).slug || (course as any).id;
    const slug = typeof rawSlug === 'string' ? rawSlug : String(rawSlug);
    window.location.href = `/courses/${slug}`;
  };

  return (
    <div
      className={`bg-white rounded-lg overflow-hidden transition-all duration-300 group border shadow-sm ${
        isEnrolled ? 'border-green-400 shadow-green-100 ring-2 ring-green-100' : 'border-gray-200 hover:shadow-lg'
      }`}
    >
      <div className="relative overflow-hidden">
        {isEnrolled && (
          <span className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow">
            <BadgeCheck className="h-3 w-3 mr-1" /> Inscrit
          </span>
        )}
        <img
          src={imageSrc}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(normalizedLevel)}`}>
            {levelLabel}
          </span>
        </div>
        {/* Badge prix - en haut à gauche */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
              isFree ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
            }`}
          >
            {priceLabel}
          </span>
          {statusLabel && statusLabel !== 'Actif' && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusClasses}`}>
              {statusLabel}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-white bg-opacity-95 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-mdsc-blue-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{course.description}</p>
        </div>

        {expiryText && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
            <span>{expiryText}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{courseAny.enrollment_count || courseAny.metrics?.enrollment_count || courseAny.totalStudents || course.students || 0} inscrit{(courseAny.enrollment_count || courseAny.metrics?.enrollment_count || courseAny.totalStudents || course.students || 0) > 1 ? 's' : ''}</span>
          </div>
          {(() => {
            const totalLessons = courseAny.total_lessons || courseAny.metrics?.total_lessons || 0;
            return totalLessons > 0 ? (
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{totalLessons} leçon{totalLessons > 1 ? 's' : ''}</span>
              </div>
            ) : null;
          })()}
          {(() => {
            const instructor = course.instructor;
            let name = '';
            if (typeof instructor === 'string' && instructor && instructor !== 'Instructeur') {
              name = instructor;
            } else if (instructor && typeof instructor === 'object') {
              const instructorAny = instructor as any;
              name = instructorAny.name || [instructorAny.first_name, instructorAny.last_name].filter(Boolean).join(' ') || '';
            } else if (courseAny.instructor_first_name || courseAny.instructor_last_name) {
              name = [courseAny.instructor_first_name, courseAny.instructor_last_name].filter(Boolean).join(' ') || '';
            }
            return name && name.trim() && name !== 'Instructeur' ? (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{name}</span>
              </div>
            ) : null;
          })()}
        </div>

        {showEnrollButton && (
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              size="sm"
              disabled={loadingState}
              onClick={() => {
                if (onEnroll) {
                  onEnroll(course);
                  return;
                }
                handleClick();
              }}
              className={`w-full sm:flex-1 ${
                isEnrolled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-mdsc-blue-primary hover:bg-mdsc-blue-dark text-white'
              } ${loadingState ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loadingState
                ? loadingCtaLabel || 'Chargement...'
                : isEnrolled
                  ? enrolledCtaLabel || 'Continuer'
                  : ctaLabel || "S'inscrire"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClick}
              className="w-full sm:flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Voir détail
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
