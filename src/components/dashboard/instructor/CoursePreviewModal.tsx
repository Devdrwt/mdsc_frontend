'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Users,
  Clock,
  Star,
  BarChart3,
  Calendar,
  Globe,
  DollarSign,
  Award,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Settings,
  ExternalLink,
  TrendingUp,
  FileText,
  Video,
  Image as ImageIcon,
  Play,
  Pause,
  Link as LinkIcon,
  Copy,
  Share2,
} from 'lucide-react';
import { Course } from '../../../lib/services/courseService';
import { resolveMediaUrl, DEFAULT_COURSE_IMAGE } from '../../../lib/utils/media';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import toast from '../../../lib/utils/toast';
import { useRouter } from 'next/navigation';

interface CoursePreviewModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (courseId: number) => void;
}

export default function CoursePreviewModal({
  course,
  isOpen,
  onClose,
  onEdit,
}: CoursePreviewModalProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course && isOpen) {
      loadCourseDetails();
    }
  }, [course, isOpen]);

  const loadCourseDetails = async () => {
    if (!course) return;
    
    try {
      setLoading(true);
      // Charger les détails complets du cours
      const courseAny = course as any;
      setCourseDetails(courseAny);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  const courseAny = course as any;
  const courseImageRaw =
    courseAny?.thumbnail_url ||
    course?.thumbnail ||
    courseAny?.thumbnailUrl ||
    courseAny?.image_url ||
    null;
  const courseImage = imageError
    ? DEFAULT_COURSE_IMAGE
    : resolveMediaUrl(courseImageRaw) || DEFAULT_COURSE_IMAGE;

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getLanguageLabel = (langCode: string | undefined | null) => {
    if (!langCode) return 'Non spécifié';
    const languages: Record<string, string> = {
      fr: 'Français',
      en: 'Anglais',
      es: 'Espagnol',
      de: 'Allemand',
      it: 'Italien',
      pt: 'Portugais',
      ar: 'Arabe',
      zh: 'Chinois',
      ja: 'Japonais',
      ru: 'Russe',
    };
    return languages[langCode.toLowerCase()] || langCode;
  };

  const getStatusBadge = () => {
    const isPublished = courseAny?.is_published || courseAny?.isPublished || (course as any)?.status === 'published';
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          isPublished
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        }`}
      >
        {isPublished ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Publié
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 mr-1" />
            Brouillon
          </>
        )}
      </span>
    );
  };

  const getLevelBadge = () => {
    const level = courseAny?.difficulty || course.level || 'beginner';
    const levels: Record<string, { label: string; color: string }> = {
      beginner: { label: 'Débutant', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      intermediate: { label: 'Intermédiaire', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      advanced: { label: 'Avancé', color: 'bg-red-100 text-red-700 border-red-200' },
    };
    const levelInfo = levels[level] || levels.beginner;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${levelInfo.color}`}>
        {levelInfo.label}
      </span>
    );
  };

  const handleCopyLink = () => {
    const courseUrl = `${window.location.origin}/courses/${course.id}`;
    navigator.clipboard.writeText(courseUrl);
    toast.success('Lien copié', 'Le lien du cours a été copié dans le presse-papiers');
  };

  const handleShare = () => {
    const courseUrl = `${window.location.origin}/courses/${course.id}`;
    if (navigator.share) {
      navigator.share({
        title: course.title,
        text: course.description?.substring(0, 100) || '',
        url: courseUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleViewPublic = () => {
    window.open(`/courses/${course.id}`, '_blank');
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(typeof course.id === 'string' ? parseInt(course.id, 10) : course.id);
    } else {
      router.push(`/instructor/courses/${course.id}`);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <div className="relative">
        {/* En-tête avec image de couverture */}
        <div className="relative h-48 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-t-xl overflow-hidden">
          <img
            src={courseImage}
            alt={course.title}
            className="w-full h-full object-cover opacity-80"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Badges et actions en haut */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getLevelBadge()}
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Titre du cours */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{course.title}</h2>
            <p className="text-white/90 text-sm line-clamp-2">
              {course.shortDescription || course.description?.substring(0, 150)}
            </p>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 space-y-6">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {course.totalStudents || 0}
              </div>
              <div className="text-xs text-blue-700">Étudiants</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {courseAny?.completion_rate || courseAny?.completionRate || 0}%
              </div>
              <div className="text-xs text-purple-700">Taux de complétion</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {(course.rating || 0).toFixed(1)}
              </div>
              <div className="text-xs text-yellow-700">Note moyenne</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-900">
                {course.duration ? `${Math.round(course.duration / 60)}h` : 'N/A'}
              </div>
              <div className="text-xs text-green-700">Durée</div>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Dates importantes</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Créé le:</span>
                  <span className="font-medium">{formatDate(course.createdAt)}</span>
                </div>
                {courseAny?.course_start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Début:</span>
                    <span className="font-medium">{formatDate(courseAny.course_start_date)}</span>
                  </div>
                )}
                {courseAny?.course_end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fin:</span>
                    <span className="font-medium">{formatDate(courseAny.course_end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Paramètres</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Langue:</span>
                  <span className="font-medium">{getLanguageLabel(courseAny?.language || 'fr')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix:</span>
                  <span className="font-medium">
                    {courseAny?.price > 0
                      ? `${courseAny.price.toLocaleString()} ${courseAny.currency || 'FCFA'}`
                      : 'Gratuit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Catégorie:</span>
                  <span className="font-medium">
                    {courseAny?.category?.name || course.category || 'Non spécifiée'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier le cours
            </Button>
            <Button
              variant="outline"
              onClick={handleViewPublic}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Voir la page publique
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copier le lien
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

