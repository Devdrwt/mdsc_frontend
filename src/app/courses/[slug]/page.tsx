'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Clock, 
  User, 
  Star, 
  Play, 
  CheckCircle, 
  Lock,
  Calendar,
  DollarSign,
  Globe,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Award,
  Info,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { CourseService, Course as ServiceCourse } from '../../../lib/services/courseService';
import { ModuleService } from '../../../lib/services/moduleService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import { paymentService } from '../../../lib/services/paymentService';
import { Module } from '../../../types/course';
import toast from '../../../lib/utils/toast';
import Button from '../../../components/ui/Button';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import { resolveMediaUrl, DEFAULT_COURSE_IMAGE, DEFAULT_INSTRUCTOR_AVATAR } from '../../../lib/utils/media';
import CourseSchedule from '../../../components/courses/CourseSchedule';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [course, setCourse] = useState<ServiceCourse | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (slug) {
      loadCourse();
    }
  }, [slug]);

  // Réinitialiser imageError quand le cours change
  useEffect(() => {
    setImageError(false);
  }, [course]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      
      // Si le slug est un nombre, utiliser getCourseById, sinon getCourseBySlug
      const isNumeric = !isNaN(Number(slug));
      const courseData = isNumeric 
        ? await CourseService.getCourseById(slug)
        : await CourseService.getCourseBySlug(slug);
      
      console.log('📚 Données du cours récupérées:', courseData);
      console.log('🖼️ Image du cours:', {
        thumbnail: courseData.thumbnail,
        thumbnail_url: (courseData as any).thumbnail_url,
        thumbnailUrl: (courseData as any).thumbnailUrl,
      });
      console.log('👤 Données de l\'instructeur dans courseData:', {
        instructor: (courseData as any).instructor,
        instructor_id: (courseData as any).instructor_id,
        instructor_name: (courseData as any).instructor_name,
        instructor_avatar: (courseData as any).instructor_avatar,
        instructor_avatar_url: (courseData as any).instructor_avatar_url,
        instructor_profile_picture: (courseData as any).instructor_profile_picture,
        instructorProfilePicture: (courseData as any).instructorProfilePicture,
        allKeys: Object.keys(courseData as any).filter(k => 
          k.toLowerCase().includes('instructor') || 
          k.toLowerCase().includes('avatar') || 
          k.toLowerCase().includes('profile')
        ),
      });
      
      setCourse(courseData);
      
      // Utiliser les modules retournés par getCourseBySlug/getCourseById qui incluent déjà les leçons
      const courseAny = courseData as any;
      if (courseAny.modules && Array.isArray(courseAny.modules)) {
        setModules(courseAny.modules);
      } else {
        // Fallback : charger les modules séparément si pas inclus dans la réponse
        const courseId = typeof courseData.id === 'string' ? parseInt(courseData.id, 10) : courseData.id;
        if (courseId) {
          try {
            const modulesData = await ModuleService.getCourseModules(courseId);
            setModules(modulesData || []);
          } catch (err) {
            console.error('Erreur lors du chargement des modules:', err);
            setModules([]);
          }
        }
      }
      
      // Charger l'avatar de l'instructeur depuis les données du cours
      // Le backend retourne maintenant instructor_profile_picture dans les données du cours
      const instructor = courseAny?.instructor;
      
      // Log pour vérifier les données retournées par le backend
      console.log('🔍 Vérification de l\'avatar de l\'instructeur dans les données du cours:', {
        instructor_profile_picture: courseAny?.instructor_profile_picture,
        instructor_avatar: courseAny?.instructor_avatar,
        instructor: instructor,
        instructorAvatar: instructor?.avatar,
        instructorProfilePicture: instructor?.profile_picture,
      });
      
      // Chercher l'avatar dans toutes les variantes possibles
      // Le backend retourne maintenant instructor_profile_picture avec l'URL complète
      const avatarUrl = courseAny?.instructor_profile_picture ||  // Priorité: champ retourné par le backend corrigé
                       courseAny?.instructor_profile_picture_url ||
                       instructor?.avatar || 
                       instructor?.avatar_url || 
                       instructor?.profile_picture || 
                       instructor?.profile_picture_url ||
                       courseAny?.instructor_avatar ||
                       courseAny?.instructor_avatar_url ||
                       null;
      
      if (avatarUrl && avatarUrl !== null && avatarUrl.trim() !== '') {
        console.log('✅ Avatar de l\'instructeur trouvé dans les données du cours:', avatarUrl);
      } else {
        console.log('ℹ️ Aucun avatar trouvé pour l\'instructeur, utilisation de l\'image par défaut');
      }
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
      setError(err.message || 'Erreur lors du chargement du cours');
      toast.error('Erreur', err.message || 'Impossible de charger le cours');
    } finally {
      setLoading(false);
    }
  };

  // Tous les hooks doivent être appelés avant les retours conditionnels
  // Utiliser useMemo pour éviter les redéfinitions
  const courseAny = useMemo(() => course ? (course as any) : null, [course]);

  // Vérifier si l'inscription est possible
  const canEnroll = useCallback(() => {
    if (!course || !courseAny) return false;
    
    const enrollmentDeadline = courseAny.enrollment_deadline || courseAny.enrollmentDeadline;
    
    // Si pas de date limite, l'inscription est toujours possible
    if (!enrollmentDeadline) return true;
    
    // Vérifier si la date limite est dépassée
    const deadline = new Date(enrollmentDeadline);
    const now = new Date();
    
    // Comparer les dates sans les heures pour permettre l'inscription jusqu'à la fin du jour de la deadline
    deadline.setHours(23, 59, 59, 999);
    
    return now <= deadline;
  }, [course, courseAny]);

  const handleEnroll = useCallback(async () => {
    if (!course || !courseAny) {
      toast.error('Erreur', 'Cours non chargé');
      return;
    }
    
    // Vérifier la date limite d'inscription avant de tenter l'inscription
    const enrollmentDeadline = courseAny.enrollment_deadline || courseAny.enrollmentDeadline;
    
    if (enrollmentDeadline) {
      const deadline = new Date(enrollmentDeadline);
      const now = new Date();
      deadline.setHours(23, 59, 59, 999);
      
      if (now > deadline) {
        toast.error(
          'Inscription impossible', 
          `La date limite d'inscription était le ${formatDate(enrollmentDeadline)}. Les inscriptions sont maintenant fermées pour ce cours.`
        );
        return;
      }
    }
    
    // Vérifier si le cours est payant
    const coursePrice = courseAny?.price || course.price || 0;
    const isPaidCourse = coursePrice > 0;
    
    if (isPaidCourse) {
      // Rediriger vers la page de paiement
      router.push(`/payments/new?courseId=${course.id}`);
      return;
    }
    
    // Cours gratuit : inscription directe
    try {
      const courseId = typeof course.id === 'string' ? parseInt(course.id, 10) : course.id;
      await EnrollmentService.enrollInCourse(courseId);
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours !');
      router.push(`/learn/${course.id}`);
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Impossible de s\'inscrire au cours';
      if (err.message) {
        if (err.message.includes('date limite')) {
          errorMessage = `La date limite d'inscription est dépassée. Les inscriptions sont maintenant fermées pour ce cours.`;
        } else if (err.message.includes('prérequis')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error('Erreur d\'inscription', errorMessage);
    }
  }, [course, courseAny, router]);

  const handleStartLearning = useCallback(() => {
    if (course) {
      router.push(`/learn/${course.id}`);
    }
  }, [course, router]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Fonction utilitaire pour formater une date (utilisable partout)
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const courseImageRaw = useMemo(() => {
    if (!courseAny) return null;
    return (
      courseAny?.thumbnail_url ||
      course?.thumbnail ||
      courseAny?.thumbnailUrl ||
      courseAny?.image_url ||
      courseAny?.cover_image ||
      courseAny?.coverImage ||
      null
    );
  }, [courseAny, course]);

  // Résoudre l'URL de l'image
  const resolvedImageUrl = useMemo(() => resolveMediaUrl(courseImageRaw), [courseImageRaw]);
  const courseImage = useMemo(() => {
    return imageError || !resolvedImageUrl
      ? DEFAULT_COURSE_IMAGE
      : resolvedImageUrl;
  }, [imageError, resolvedImageUrl]);

  // Log pour déboguer
  useEffect(() => {
    if (course) {
      console.log('🖼️ Image de couverture du cours:', {
        courseImageRaw,
        resolvedImageUrl,
        courseImage,
        imageError,
        courseId: course.id,
      });
    }
  }, [course, courseImageRaw, resolvedImageUrl, courseImage, imageError]);

  const instructorInfo = useMemo(() => {
    const instructor = courseAny?.instructor;

    const firstName =
      instructor?.first_name ||
      instructor?.firstName ||
      courseAny?.instructor_first_name ||
      '';

    const lastName =
      instructor?.last_name ||
      instructor?.lastName ||
      courseAny?.instructor_last_name ||
      '';

    const email =
      instructor?.email ||
      courseAny?.instructor_email ||
      '';

    const organization =
      instructor?.organization ||
      courseAny?.instructor_organization ||
      '';

    const title =
      instructor?.title ||
      instructor?.jobTitle ||
      courseAny?.instructor_title ||
      '';

    const bio =
      instructor?.bio ||
      instructor?.biography ||
      courseAny?.instructor_bio ||
      '';

    const name =
      instructor?.name ||
      courseAny?.instructor_name ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      'Instructeur';

    const avatarRaw =
      instructor?.avatar ||
      instructor?.avatar_url ||
      instructor?.avatarUrl ||
      instructor?.profile_picture ||
      instructor?.profile_picture_url ||
      courseAny?.instructor_profile_picture ||
      courseAny?.instructor_avatar ||
      null;

    let avatar = DEFAULT_INSTRUCTOR_AVATAR;
    if (avatarRaw && avatarRaw.trim() !== '') {
      avatar = resolveMediaUrl(avatarRaw) || avatarRaw || DEFAULT_INSTRUCTOR_AVATAR;
    }

    return {
      name,
      title,
      organization,
      email,
      bio,
      avatar,
    };
  }, [courseAny]);

  // Fonction pour convertir les codes de langue en noms complets
  const getLanguageLabel = useCallback((langCode: string | undefined | null): string => {
    if (!langCode) return 'Français';
    
    const lang = langCode.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'fr': 'Français',
      'en': 'Anglais',
      'es': 'Espagnol',
      'de': 'Allemand',
      'it': 'Italien',
      'pt': 'Portugais',
      'ar': 'Arabe',
      'zh': 'Chinois',
      'ja': 'Japonais',
      'ru': 'Russe',
      'français': 'Français',
      'anglais': 'Anglais',
      'espagnol': 'Espagnol',
      'allemand': 'Allemand',
      'italien': 'Italien',
      'portugais': 'Portugais',
      'arabe': 'Arabe',
      'chinois': 'Chinois',
      'japonais': 'Japonais',
      'russe': 'Russe',
    };
    
    return languageMap[lang] || langCode;
  }, []);

  // Calculer la durée totale du cours (en heures)
  const courseDuration = useMemo(() => {
    if (!course || !courseAny) return 0;
    
    let duration = 
      courseAny.duration_minutes ||
      course.duration ||
      courseAny.duration ||
      courseAny.total_duration ||
      courseAny.totalDuration ||
      0;
    
    if (typeof duration === 'string') {
      const parsed = parseInt(duration, 10);
      duration = isNaN(parsed) ? 0 : parsed;
    }
    
    if (duration === 0 && modules.length > 0) {
      duration = modules.reduce((total, module) => {
        const moduleAny = module as any;
        const lessons = moduleAny.lessons || [];
        const moduleDuration = lessons.reduce((sum: number, lesson: any) => {
          return sum + (lesson.duration || lesson.duration_minutes || 0);
        }, 0);
        return total + moduleDuration;
      }, 0);
    }
    
    if (duration === 0 && course.lessons && course.lessons.length > 0) {
      duration = course.lessons.reduce((total, lesson) => {
        const lessonAny = lesson as any;
        return total + (lessonAny.duration || lessonAny.duration_minutes || 0);
      }, 0);
    }
    
    return typeof duration === 'number' ? duration : 0;
  }, [course, courseAny, modules]);

  const totalDurationHours = courseDuration > 0 ? Math.floor(courseDuration / 60) : 0;
  const totalDurationMinutes = courseDuration > 0 ? courseDuration % 60 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du cours...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Cours non trouvé'}</p>
            <Button variant="primary" onClick={() => router.push('/courses')}>
              Retour aux cours
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isEnrolled = course.enrollment !== undefined;
  
  // Extraire toutes les informations du cours
  const price = courseAny.price || course.price || 0;
  const currency = courseAny.currency || 'FCFA';
  const languageRaw = courseAny.language || courseAny.lang || 'fr';
  const language = getLanguageLabel(languageRaw);
  const prerequisiteCourse = courseAny.prerequisite_course || courseAny.prerequisiteCourse;
  const enrollmentDeadline = courseAny.enrollment_deadline || courseAny.enrollmentDeadline;
  const courseStartDate = courseAny.course_start_date || courseAny.courseStartDate;
  const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
  const maxStudents = courseAny.max_students || courseAny.maxStudents;
  const shortDescription = course.shortDescription || course.description?.substring(0, 300);
  
  // Utiliser instructorInfo qui est déjà calculé avec useMemo plus haut
  // Il contient toutes les informations de l'instructeur de manière optimisée
  
  const categoryLabels: { [key: string]: string } = {
    sante: 'Santé',
    education: 'Éducation',
    gouvernance: 'Gouvernance',
    environnement: 'Environnement',
    economie: 'Économie',
    management: 'Management',
    communication: 'Communication',
    'gestion de projet': 'Gestion de projet',
    technologie: 'Technologie',
    pedagogie: 'Pédagogie',
    'e-learning': 'E-learning',
  };
  
  const levelLabels: { [key: string]: string } = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    debutant: 'Débutant',
    intermediaire: 'Intermédiaire',
    avance: 'Avancé',
    'débutant': 'Débutant',
    'intermédiaire': 'Intermédiaire',
    'avancé': 'Avancé',
  };

  // Fonction utilitaire pour extraire la valeur de catégorie/niveau (peut être string ou objet)
  const getCategoryValue = (category: any): string => {
    if (typeof category === 'string') {
      return category.toLowerCase();
    }
    if (category && typeof category === 'object') {
      return (category.name || category.category_name || '').toLowerCase();
    }
    return '';
  };

  const getCategoryLabel = (category: any): string => {
    const value = getCategoryValue(category);
    if (value && categoryLabels[value]) {
      return categoryLabels[value];
    }
    if (typeof category === 'string') {
      return category;
    }
    if (category && typeof category === 'object') {
      return category.name || category.category_name || 'Non spécifié';
    }
    return 'Non spécifié';
  };

  // Normaliser le niveau depuis la base de données (cherche dans level ET difficulty)
  const getLevelValue = (level: any, courseData?: any): string => {
    // Si courseData est fourni, chercher dans level ET difficulty
    if (courseData) {
      const courseAny = courseData as any;
      const rawLevel = courseAny.level || courseAny.difficulty || level || '';
      const levelStr = String(rawLevel).toLowerCase().trim();
      
      // Mapper toutes les variantes possibles
      if (levelStr === 'beginner' || levelStr === 'debutant' || levelStr === 'débutant') {
        return 'beginner';
      }
      if (levelStr === 'intermediate' || levelStr === 'intermediaire' || levelStr === 'intermédiaire') {
        return 'intermediate';
      }
      if (levelStr === 'advanced' || levelStr === 'avance' || levelStr === 'avancé') {
        return 'advanced';
      }
      return levelStr || 'beginner';
    }
    
    // Sinon, utiliser l'ancienne logique pour compatibilité
    if (typeof level === 'string') {
      return level.toLowerCase().trim();
    }
    if (level && typeof level === 'object') {
      return (level.name || level.level_name || '').toLowerCase().trim();
    }
    return '';
  };

  const getLevelLabel = (level: any, courseData?: any): string => {
    // Si courseData est fourni, chercher directement dans level ET difficulty
    if (courseData) {
      const courseAny = courseData as any;
      const rawLevel = courseAny.level || courseAny.difficulty || level || '';
      const levelStr = String(rawLevel).toLowerCase().trim();
      
      // Mapper toutes les variantes possibles
      if (levelStr === 'beginner' || levelStr === 'debutant' || levelStr === 'débutant') {
        return 'Débutant';
      }
      if (levelStr === 'intermediate' || levelStr === 'intermediaire' || levelStr === 'intermédiaire') {
        return 'Intermédiaire';
      }
      if (levelStr === 'advanced' || levelStr === 'avance' || levelStr === 'avancé') {
        return 'Avancé';
      }
      // Si la chaîne n'est pas vide, essayer de la formater
      if (levelStr) {
        return levelStr.charAt(0).toUpperCase() + levelStr.slice(1);
      }
    }
    
    // Utiliser getLevelValue pour extraire la valeur
    const value = getLevelValue(level, courseData);
    
    // Si value est vide, essayer de chercher directement dans level
    if (!value || value.trim() === '') {
      if (typeof level === 'string' && level.trim()) {
        const trimmed = level.trim().toLowerCase();
        if (trimmed === 'débutant' || trimmed === 'debutant' || trimmed === 'beginner') {
          return 'Débutant';
        }
        if (trimmed === 'intermédiaire' || trimmed === 'intermediaire' || trimmed === 'intermediate') {
          return 'Intermédiaire';
        }
        if (trimmed === 'avancé' || trimmed === 'avance' || trimmed === 'advanced') {
          return 'Avancé';
        }
        return level.trim().charAt(0).toUpperCase() + level.trim().slice(1);
      }
      if (level && typeof level === 'object') {
        return level.name || level.level_name || 'Non spécifié';
      }
      return 'Non spécifié';
    }
    
    // Si value existe, chercher dans levelLabels
    const normalized = value.toLowerCase().trim();
    if (levelLabels[normalized]) {
      return levelLabels[normalized];
    }
    
    // Gérer les variantes avec accents
    if (normalized === 'débutant' || normalized === 'debutant' || normalized === 'beginner') {
      return 'Débutant';
    }
    if (normalized === 'intermédiaire' || normalized === 'intermediaire' || normalized === 'intermediate') {
      return 'Intermédiaire';
    }
    if (normalized === 'avancé' || normalized === 'avance' || normalized === 'advanced') {
      return 'Avancé';
    }
    
    // Si c'est une string, essayer de la formater
    if (typeof level === 'string' && level.trim()) {
      const trimmed = level.trim();
      // Si ça ressemble à un niveau connu, le formater
      if (trimmed.toLowerCase() === 'débutant' || trimmed.toLowerCase() === 'debutant' || trimmed.toLowerCase() === 'beginner') {
        return 'Débutant';
      }
      if (trimmed.toLowerCase() === 'intermédiaire' || trimmed.toLowerCase() === 'intermediaire' || trimmed.toLowerCase() === 'intermediate') {
        return 'Intermédiaire';
      }
      if (trimmed.toLowerCase() === 'avancé' || trimmed.toLowerCase() === 'avance' || trimmed.toLowerCase() === 'advanced') {
        return 'Avancé';
      }
      // Sinon, capitaliser la première lettre
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
    
    if (level && typeof level === 'object') {
      return level.name || level.level_name || 'Non spécifié';
    }
    
    return 'Non spécifié';
  };

  // Vérifier si l'inscription est possible (appelé après vérification que course n'est pas null)
  const enrollmentPossible = canEnroll();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section avec image */}
        <div className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Bouton retour au catalogue */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.push('/courses')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au catalogue
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image du cours */}
              <div className="lg:col-span-1">
                <div className="relative rounded-lg overflow-hidden shadow-2xl bg-gray-200">
                  <img
                    src={courseImage}
                    alt={course.title}
                    className="w-full h-64 lg:h-96 object-cover"
                    onError={(e) => {
                      console.error('❌ Erreur de chargement de l\'image:', {
                        courseImage,
                        courseImageRaw,
                        resolvedImageUrl,
                        error: e,
                      });
                      setImageError(true);
                      // Essayer de charger l'image par défaut si ce n'est pas déjà fait
                      if (courseImage !== DEFAULT_COURSE_IMAGE) {
                        (e.target as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Image chargée avec succès:', courseImage);
                    }}
                  />
                </div>
              </div>

              {/* Informations principales */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {getCategoryLabel(course.category)}
                    </span>
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {getLevelLabel(course.level, courseAny)}
                    </span>
                    {price === 0 && (
                      <span className="inline-block px-3 py-1 bg-green-500/80 rounded-full text-sm font-medium">
                        Gratuit
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                  <p className="text-xl text-white/90 leading-relaxed">
                    {shortDescription}
                  </p>
                </div>

                {/* Métriques du cours */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-t border-white/20">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-white/80" />
                    <div>
                      <p className="text-sm text-white/70">Instructeur</p>
                      <p className="font-semibold">{instructorInfo.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-white/80" />
                    <div>
                      <p className="text-sm text-white/70">Durée</p>
                      <p className="font-semibold">
                        {totalDurationHours > 0 ? `${totalDurationHours}h` : ''}
                        {totalDurationMinutes > 0 ? ` ${totalDurationMinutes}min` : ''}
                        {!totalDurationHours && !totalDurationMinutes ? 'Variable' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-white/80" />
                    <div>
                      <p className="text-sm text-white/70">Leçons</p>
                      <p className="font-semibold">{courseAny.total_lessons || courseAny.metrics?.total_lessons || modules.reduce((acc, m) => acc + ((m as any).lessons?.length || 0), 0) || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <div>
                      <p className="text-sm text-white/70">Note</p>
                      <p className="font-semibold">{(course.rating || 0).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-white/80" />
                    <div>
                      <p className="text-sm text-white/70">Inscrits</p>
                      <p className="font-semibold">{course.totalStudents || courseAny.enrollment_count || courseAny.metrics?.enrollment_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Message d'avertissement si la date limite est dépassée */}
                {!isEnrolled && enrollmentDeadline && !enrollmentPossible && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-4">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-100 mb-1">Inscriptions fermées</p>
                        <p className="text-sm text-red-200">
                          La date limite d'inscription était le {formatDate(enrollmentDeadline)}. 
                          Les inscriptions sont maintenant fermées pour ce cours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton d'inscription */}
                <div className="flex items-center space-x-4 pt-4 border-t border-white/20">
                  {isEnrolled ? (
                    <Button variant="primary" size="lg" onClick={handleStartLearning} className="bg-white text-mdsc-blue-dark hover:bg-gray-100 font-semibold">
                      <Play className="h-5 w-5 mr-2" />
                      Continuer l'apprentissage
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleEnroll} 
                      disabled={!enrollmentPossible}
                      className={`bg-white text-mdsc-blue-dark hover:bg-gray-100 font-semibold ${
                        !enrollmentPossible ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <GraduationCap className="h-5 w-5 mr-2" />
                      {enrollmentPossible ? 'S\'inscrire maintenant' : 'Inscriptions fermées'}
                    </Button>
                  )}
                  {price > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-white/70">Prix</p>
                      <p className="text-3xl font-bold">{price.toLocaleString()} <span className="text-lg">{currency}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section principale avec contenu détaillé */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description complète */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">À propos de ce cours</h2>
                </div>
                <div className="prose max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
                    {course.description?.split('\n').map((paragraph, idx) => (
                      paragraph.trim() && (
                        <p key={idx} className="text-base leading-7">
                          {paragraph.trim()}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistiques du cours */}
              <div className="bg-gradient-to-br from-mdsc-blue-primary/5 to-mdsc-blue-dark/5 rounded-xl border border-mdsc-blue-primary/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-mdsc-blue-primary" />
                  Statistiques du cours
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-mdsc-blue-primary mb-1">
                      {modules.length || course.lessons?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Module{modules.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-mdsc-blue-primary mb-1">
                      {modules.reduce((acc, m) => acc + ((m as any).lessons?.length || 0), 0) || course.lessons?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Leçon{modules.reduce((acc, m) => acc + ((m as any).lessons?.length || 0), 0) > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-mdsc-blue-primary mb-1">
                      {totalDurationHours > 0 ? `${totalDurationHours}h` : totalDurationMinutes > 0 ? `${totalDurationMinutes}min` : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Durée totale</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-mdsc-blue-primary mb-1">
                      {course.totalStudents || 0}
                    </div>
                    <div className="text-sm text-gray-600">Étudiant{(course.totalStudents || 0) > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>

              {/* Modules et leçons */}
              {modules.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Programme du cours</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {modules.length} module{modules.length > 1 ? 's' : ''} • {modules.reduce((acc, m) => acc + ((m as any).lessons?.length || 0), 0)} leçon{modules.reduce((acc, m) => acc + ((m as any).lessons?.length || 0), 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {modules.map((module, moduleIndex) => {
                      const moduleAny = module as any;
                      const lessons = moduleAny.lessons || [];
                      const isExpanded = expandedModules[module.id];
                      
                      return (
                        <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4 flex-1 text-left">
                              <div className="flex-shrink-0 w-10 h-10 bg-mdsc-blue-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-mdsc-blue-primary">
                                  {moduleIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {lessons.length} leçon{lessons.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              <div className="divide-y divide-gray-200">
                                {lessons.map((lesson: any, lessonIndex: number) => {
                                  const ContentIcon = lesson.content_type === 'video' ? Video :
                                                    lesson.content_type === 'quiz' ? FileText :
                                                    lesson.content_type === 'assignment' ? FileText :
                                                    BookOpen;
                                  return (
                                    <div key={lesson.id} className="p-4 flex items-center space-x-4">
                                      <div className="flex-shrink-0">
                                        <ContentIcon className="h-5 w-5 text-gray-400" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900">
                                          {lesson.title}
                                        </h4>
                                        {lesson.duration && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            {lesson.duration} min
                                          </p>
                                        )}
                                      </div>
                                      <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Planning d'apprentissage (uniquement si inscrit) */}
              {isEnrolled && course && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <CourseSchedule
                    courseId={typeof course.id === 'string' ? parseInt(course.id, 10) : course.id}
                    onItemClick={(item) => {
                      if (item.type === 'lesson' && item.lesson_id) {
                        router.push(`/learn/${course.id}?lesson=${item.lesson_id}`);
                      } else if (item.type === 'quiz' && item.quiz_id) {
                        router.push(`/learn/${course.id}?quiz=${item.quiz_id}`);
                      }
                    }}
                  />
                </div>
              )}

              {/* Leçons directes (si pas de modules) */}
              {course.lessons && course.lessons.length > 0 && modules.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Contenu du cours</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.lessons.length} leçon{course.lessons.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {course.lessons.map((lesson, lessonIndex) => {
                      const lessonAny = lesson as any;
                      const contentIcon = lessonAny.content_type === 'video' ? Video :
                                        lessonAny.content_type === 'quiz' ? FileText :
                                        lessonAny.content_type === 'assignment' ? FileText :
                                        BookOpen;
                      return (
                        <div key={lesson.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-mdsc-blue-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-mdsc-blue-primary">
                              {lessonIndex + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            {lesson.duration && (
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {lesson.duration} min
                                </span>
                              </div>
                            )}
                          </div>
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informations sur l'instructeur */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Votre instructeur</h2>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={instructorInfo.avatar || DEFAULT_INSTRUCTOR_AVATAR}
                        alt={instructorInfo.name}
                        className="w-24 h-24 rounded-full object-cover bg-mdsc-blue-primary/10 border-4 border-mdsc-blue-primary/20 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== DEFAULT_INSTRUCTOR_AVATAR && !target.src.includes('mdsc-logo.png')) {
                            target.src = DEFAULT_INSTRUCTOR_AVATAR;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {instructorInfo.name}
                      </h3>
                      {(instructorInfo.title || instructorInfo.organization) && (
                        <p className="text-gray-600 font-medium">
                          {[instructorInfo.title, instructorInfo.organization].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      {instructorInfo.email && (
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <span>{instructorInfo.email}</span>
                        </p>
                      )}
                    </div>
                    {instructorInfo.bio && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {instructorInfo.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prérequis */}
              {prerequisiteCourse && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-amber-500 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Prérequis</h3>
                      <p className="text-gray-700">
                        Ce cours nécessite d'avoir complété : <span className="font-semibold">
                          {typeof prerequisiteCourse === 'string' 
                            ? prerequisiteCourse 
                            : prerequisiteCourse.title || 'Cours prérequis requis'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar avec informations pratiques */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Card d'inscription */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                  <div className="text-center mb-6">
                    {price > 0 ? (
                      <>
                        <p className="text-sm text-gray-600 mb-1">Prix du cours</p>
                        <p className="text-4xl font-bold text-gray-900">
                          {price.toLocaleString()} <span className="text-lg">{currency}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">Gratuit</p>
                    )}
                  </div>

                  {!isEnrolled ? (
                    <>
                      {enrollmentDeadline && !enrollmentPossible && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-red-800">Inscriptions fermées</p>
                              <p className="text-xs text-red-600 mt-1">
                                Date limite: {formatDate(enrollmentDeadline)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleEnroll}
                        disabled={!enrollmentPossible}
                        className={`w-full mb-4 ${
                          !enrollmentPossible ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <GraduationCap className="h-5 w-5 mr-2" />
                        {enrollmentPossible ? 'S\'inscrire maintenant' : 'Inscriptions fermées'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartLearning}
                      className="w-full mb-4"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Continuer l'apprentissage
                    </Button>
                  )}

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Durée
                      </span>
                      <span className="font-medium">
                        {totalDurationHours > 0 ? `${totalDurationHours}h` : ''}
                        {totalDurationMinutes > 0 ? ` ${totalDurationMinutes}min` : ''}
                        {!totalDurationHours && !totalDurationMinutes ? 'Variable' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Étudiants
                      </span>
                      <span className="font-medium">{course.totalStudents || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Note
                      </span>
                      <span className="font-medium">{(course.rating || 0).toFixed(1)} ⭐</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Langue
                      </span>
                      <span className="font-medium">{language}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Niveau
                      </span>
                      <span className="font-medium">
                        {getLevelLabel(course.level, courseAny)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations pratiques */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-mdsc-blue-primary/10 rounded-lg">
                      <Info className="h-5 w-5 text-mdsc-blue-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Informations pratiques</h3>
                  </div>
                  <div className="space-y-4">
                    {enrollmentDeadline && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-mdsc-blue-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date limite d'inscription</p>
                            <p className="font-semibold text-gray-900">{formatDate(enrollmentDeadline)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {courseStartDate && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-mdsc-blue-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Début du cours</p>
                            <p className="font-semibold text-gray-900">{formatDate(courseStartDate)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {courseEndDate && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-mdsc-blue-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fin du cours</p>
                            <p className="font-semibold text-gray-900">{formatDate(courseEndDate)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {maxStudents && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <Users className="h-5 w-5 text-mdsc-blue-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Places disponibles</p>
                            <p className="font-semibold text-gray-900">
                              {maxStudents - (course.totalStudents || 0)} / {maxStudents}
                            </p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-mdsc-blue-primary h-2 rounded-full transition-all"
                                style={{ width: `${((maxStudents - (course.totalStudents || 0)) / maxStudents) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
