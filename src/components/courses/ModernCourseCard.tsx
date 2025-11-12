'use client';

import React, { useState, useMemo } from 'react';
import { Star, Clock, Users, Play, Bookmark, Share2, Eye } from 'lucide-react';
import { Course } from '../../lib/services/courseService';
import { resolveMediaUrl, DEFAULT_COURSE_IMAGE } from '../../lib/utils/media';

interface ModernCourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  onBookmark?: (courseId: string) => void;
  onShare?: (courseId: string) => void;
  showActions?: boolean;
  className?: string;
}

export default function ModernCourseCard({
  course,
  onEnroll,
  onView,
  onBookmark,
  onShare,
  showActions = true,
  className = ''
}: ModernCourseCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const courseAny = course as any;
  const rawThumbnail = useMemo(() => {
    return course.thumbnail || courseAny.thumbnail_url || courseAny.thumbnailUrl || courseAny.image_url || null;
  }, [course.thumbnail, courseAny]);
  
  const resolvedThumbnail = useMemo(() => resolveMediaUrl(rawThumbnail), [rawThumbnail]);
  const imageSrc = useMemo(() => {
    return imageError || !resolvedThumbnail ? DEFAULT_COURSE_IMAGE : resolvedThumbnail;
  }, [imageError, resolvedThumbnail]);

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(course.id);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(course.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(course.id);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`
      group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
      hover:shadow-lg hover:scale-105 transition-all duration-300
      ${className}
    `}>
      {/* Image du cours */}
      <div className="relative h-48 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark overflow-hidden">
        <img
          src={imageSrc}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
          {course.price === 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Gratuit
            </span>
          )}
        </div>

        {/* Actions rapides */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleBookmark}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Bookmark className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Bouton play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleView}
            className="p-4 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Play className="h-8 w-8 text-mdsc-blue-primary" />
          </button>
        </div>
      </div>

      {/* Contenu du cours */}
      <div className="p-6">
        {/* En-tête */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-mdsc-blue-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {course.description}
          </p>
        </div>

        {/* Instructeur */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {course.instructor.name.charAt(0)}
            </span>
          </div>
          <span className="text-sm text-gray-600">{course.instructor.name}</span>
        </div>

        {/* Métadonnées */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.totalStudents || 0}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(course.price)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleView}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </button>
              <button
                onClick={handleEnroll}
                className="px-4 py-2 bg-mdsc-blue-primary text-white text-sm font-medium rounded-lg hover:bg-mdsc-blue-dark transition-colors"
              >
                S'inscrire
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
