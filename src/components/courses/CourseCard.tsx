import React, { useMemo, useState } from 'react';
import { Clock, Users, Star, Play, BookOpen, Award, User } from 'lucide-react';
import { Course } from '../../types';
import Button from '../ui/Button';
import { DEFAULT_COURSE_IMAGE, resolveMediaUrl } from '../../lib/utils/media';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  showEnrollButton?: boolean;
}

export default function CourseCard({ 
  course, 
  onEnroll, 
  showEnrollButton = true 
}: CourseCardProps) {
  // État pour gérer l'erreur de chargement d'image
  const [imageError, setImageError] = useState(false);
  
  const courseAny = course as any;
  const rawThumbnail = course.thumbnail || courseAny.thumbnail_url || courseAny.thumbnailUrl || courseAny.image_url;
  const resolvedThumbnail = resolveMediaUrl(rawThumbnail) || DEFAULT_COURSE_IMAGE;
  const imageSrc = imageError ? DEFAULT_COURSE_IMAGE : resolvedThumbnail;

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
      courseAny.instructor_name ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      'Instructeur';

    return fallback;
  }, [course.instructor, courseAny]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'finance':
        return <Award className="h-5 w-5" />;
      case 'communication':
        return <Play className="h-5 w-5" />;
      case 'évaluation':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={imageSrc}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            // Si l'image ne peut pas être chargée, utiliser l'image par défaut
            setImageError(true);
          }}
        />
        {/* Badge de niveau - en haut à droite */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
        </div>
        {/* Badge de catégorie - en bas de l'image */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white bg-opacity-95 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
            {course.category}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-mdsc-blue-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
            {course.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{course.students}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{instructorName}</span>
          </div>
        </div>

        {showEnrollButton && (
          <div className="pt-4">
            <Button 
              size="sm"
              onClick={() => {
                const slug = (course as any).slug || (course as any).slug?.toString();
                if (slug) {
                  window.location.href = `/courses/${slug}`;
                } else {
                  onEnroll?.(String((course as any).id));
                }
              }}
              className="w-full"
            >
              Voir détails
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
