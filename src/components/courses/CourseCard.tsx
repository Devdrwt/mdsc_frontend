import React, { useState } from 'react';
import { Clock, Users, Star, Play, BookOpen, Award, User, BadgeCheck } from 'lucide-react';
import { Course } from '../../types';
import Button from '../ui/Button';

interface CourseCardProps {
  course: Course;
  onEnroll?: (course: Course) => void;
  showEnrollButton?: boolean;
  isEnrolled?: boolean;
  loadingState?: boolean;
}

export default function CourseCard({ 
  course, 
  onEnroll, 
  showEnrollButton = true,
  isEnrolled = false,
  loadingState = false,
}: CourseCardProps) {
  // État pour gérer l'erreur de chargement d'image
  const [imageError, setImageError] = useState(false);
  
  // Image par défaut si l'image du cours ne peut pas être chargée
  const defaultImage = '/apprenant.png';
  
  // Utiliser l'image du cours ou l'image par défaut
  const imageSrc = imageError || !course.thumbnail ? defaultImage : course.thumbnail;

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
    <div
      className={`bg-white rounded-lg overflow-hidden transition-all duration-300 group border shadow-sm ${
        isEnrolled ? 'border-green-400 shadow-green-100 ring-2 ring-green-100' : 'border-gray-200 hover:shadow-lg'
      }`}
    >
      {/* Thumbnail */}
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
            <span>
              {typeof course.instructor === 'string' 
                ? course.instructor 
                : course.instructor?.name || 'Instructeur'}
            </span>
          </div>
        </div>

        {showEnrollButton && (
          <div className="pt-4">
            <Button 
              size="sm"
              disabled={loadingState}
              onClick={() => {
                if (onEnroll) {
                  onEnroll(course);
                  return;
                }
                const rawSlug = (course as any).slug || (course as any).id;
                const slug = typeof rawSlug === 'string' ? rawSlug : String(rawSlug);
                window.location.href = `/courses/${slug}`;
              }}
              className={`w-full ${
                isEnrolled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-mdsc-blue-primary hover:bg-mdsc-blue-dark text-white'
              } ${loadingState ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loadingState ? 'Chargement...' : isEnrolled ? 'Continuer' : 'Voir détails'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
