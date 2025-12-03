import { apiRequest } from './api';
import { MediaFile } from '../../types';

export interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  shortDescription: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  price: number;
  thumbnail: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  rating: number;
  totalStudents: number;
  lessons: Lesson[];
  enrollment?: Enrollment;
  progress?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId?: string | number;
  title: string;
  description: string;
  content: string;
  content_type?: 'video' | 'text' | 'quiz' | 'h5p' | 'assignment' | 'document' | 'audio' | 'presentation';
  content_url?: string;
  content_text?: string;
  media_file_id?: string | number;
  duration: number;
  order: number;
  isCompleted?: boolean;
  videoUrl?: string;
  isRequired?: boolean;
  isPublished?: boolean;
  attachments?: Attachment[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  progress: number;
  completedLessons: string[];
  isCompleted: boolean;
  certificateId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CourseFilter {
  category?: string;
  level?: string;
  price?: string;
  rating?: number;
  search?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  short_description: string;
  category_id: string | number;
  thumbnail_url?: string;
  video_url?: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number;
  currency?: string;
  prerequisite_course_id?: string | number;
  enrollment_deadline?: string;
  course_start_date?: string;
  course_end_date?: string;
  course_type?: 'live' | 'on_demand';
  max_students?: number;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  level?: string;
  duration?: number;
  price?: number;
  thumbnail?: string;
  isPublished?: boolean;
}

export interface CreateLessonData {
  title: string;
  description: string;
  content?: string;
  content_type: 'video' | 'text' | 'quiz' | 'h5p' | 'assignment' | 'document' | 'audio' | 'presentation';
  content_url?: string;
  content_text?: string;
  media_file_id?: number;
  module_id?: number;
  duration: number;
  duration_minutes?: number;
  order: number;
  order_index?: number;
  is_required?: boolean;
  is_published?: boolean;
  videoUrl?: string; // Deprecated, use content_url
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  content_type?: 'video' | 'text' | 'quiz' | 'h5p' | 'assignment' | 'document' | 'audio' | 'presentation';
  content_url?: string;
  content_text?: string;
  media_file_id?: number;
  module_id?: number;
  duration?: number;
  duration_minutes?: number;
  order?: number;
  order_index?: number;
  is_required?: boolean;
  is_published?: boolean;
  videoUrl?: string; // Deprecated, use content_url
}

export interface CourseAnalytics {
  totalViews: number;
  totalEnrollments: number;
  completionRate: number;
  averageRating: number;
  revenue: number;
  studentProgress: Array<{
    userId: string;
    userName: string;
    progress: number;
    lastActivity: string;
  }>;
}

export interface CourseReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

// Service principal
export class CourseService {
  // Récupérer tous les cours
  static async getAllCourses(filters?: CourseFilter): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.price) params.append('price', filters.price);
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await apiRequest(`/courses?${params.toString()}`, {
      method: 'GET',
    });
    return response;
  }

  // Récupérer un cours par ID
  static async getCourseById(id: string | number): Promise<Course> {
    const response = await apiRequest(`/courses/${id}`, {
      method: 'GET',
    });
    // Le backend renvoie { course, modules (avec lessons incluses), quizzes }
    if (response.data?.course) {
      const payload: any = response.data;
      const course: any = { ...payload.course };

      // Les modules contiennent déjà leurs leçons si le backend les a incluses
      const modules: any[] = Array.isArray(payload.modules)
        ? payload.modules.map((module: any) => {
            // Si le module a déjà des leçons, les utiliser directement
            if (Array.isArray(module.lessons) && module.lessons.length > 0) {
              return {
                ...module,
                lessons: module.lessons.map((lesson: any) => {
                  // Créer l'objet mediaFile si les données médias sont disponibles
                  // Priorité 1: lesson.media (nouvelle structure - peut être un objet ou un tableau)
                  // Priorité 1a: lesson.media_files (nouveau format backend - médias associés automatiquement)
                  let mediaFile: any = null;
                  
                  if (lesson.media_files && Array.isArray(lesson.media_files) && lesson.media_files.length > 0) {
                    // Filtrer les médias valides (avec URL)
                    const validMedia = lesson.media_files.filter((m: any) => m && m.url);
                    if (validMedia.length > 0) {
                      mediaFile = validMedia[0];
                    }
                  }
                  // Priorité 1b: lesson.media_file (objet unique)
                  else if (lesson.media_file && typeof lesson.media_file === 'object' && lesson.media_file !== null && lesson.media_file.url) {
                    mediaFile = lesson.media_file;
                  }
                  // Priorité 1c: lesson.media (ancienne structure - peut être un objet ou un tableau)
                  else if (lesson.media) {
                    // Si c'est un tableau, prendre le premier média valide
                    if (Array.isArray(lesson.media) && lesson.media.length > 0) {
                      const validMedia = lesson.media.filter((m: any) => m && m.url);
                      if (validMedia.length > 0) {
                        mediaFile = validMedia[0];
                      }
                    } 
                    // Si c'est un objet
                    else if (typeof lesson.media === 'object' && lesson.media !== null && lesson.media.url) {
                      mediaFile = lesson.media;
                    }
                  }
                  // Priorité 2: Construire depuis les champs individuels
                  else {
                    const mediaFileId = lesson.media_file_id || lesson.media_file_id_from_join;
                    // Essayer plusieurs sources pour l'URL du média (content_url est souvent la source principale après upload)
                    const mediaUrl = lesson.media_url || 
                                     lesson.content_url || 
                                     lesson.video_url || 
                                     lesson.document_url || 
                                     lesson.audio_url || 
                                     '';
                    
                    // Déterminer le file_category basé sur content_type si file_category n'est pas fourni
                    const contentType = lesson.content_type || lesson.contentType || 'text';
                    const fileCategory = lesson.file_category || lesson.fileCategory || 
                                        (contentType === 'video' ? 'video' :
                                         contentType === 'audio' ? 'audio' :
                                         contentType === 'document' ? 'document' :
                                         contentType === 'presentation' ? 'presentation' :
                                         contentType === 'h5p' ? 'h5p' : 'other');
                    
                    // Si on a un media_file_id ou une URL, créer l'objet mediaFile
                    if (mediaFileId || mediaUrl) {
                      // Extraire le nom de fichier depuis l'URL si original_filename n'est pas fourni
                      let originalFilename = lesson.original_filename || lesson.originalFilename || '';
                      if (!originalFilename && mediaUrl) {
                        try {
                          const urlParts = mediaUrl.split('/');
                          originalFilename = urlParts[urlParts.length - 1].split('?')[0]; // Enlever les query params
                        } catch (e) {
                          originalFilename = lesson.title || '';
                        }
                      }
                      
                      mediaFile = {
                        id: mediaFileId || lesson.id,
                        url: mediaUrl,
                        thumbnail_url: lesson.thumbnail_url || lesson.thumbnailUrl,
                        thumbnailUrl: lesson.thumbnail_url || lesson.thumbnailUrl,
                        file_category: fileCategory,
                        fileCategory: fileCategory,
                        original_filename: originalFilename,
                        originalFilename: originalFilename,
                        file_size: lesson.file_size || lesson.fileSize || 0,
                        fileSize: lesson.file_size || lesson.fileSize || 0,
                        file_type: lesson.file_type || lesson.fileType || '',
                        fileType: lesson.file_type || lesson.fileType || '',
                        lesson_id: lesson.id,
                        lessonId: lesson.id,
                      };
                    }
                  }

                  return {
                    ...lesson,
                    module_id: module.id,
                    moduleId: module.id,
                    order_index: lesson.order_index ?? lesson.orderIndex ?? lesson.order ?? 0,
                    order: lesson.order_index ?? lesson.orderIndex ?? lesson.order ?? 0,
                    duration: lesson.duration_minutes ?? lesson.duration ?? 0,
                    duration_minutes: lesson.duration_minutes ?? lesson.duration ?? 0,
                    content_type: lesson.content_type ?? 'text',
                    contentType: lesson.content_type ?? 'text',
                    content_text: lesson.content_text ?? lesson.content ?? '',
                    contentText: lesson.content_text ?? lesson.content ?? '',
                    content_url: lesson.content_url ?? lesson.video_url ?? lesson.media_url ?? null,
                    contentUrl: lesson.content_url ?? lesson.video_url ?? lesson.media_url ?? null,
                    media_url: lesson.media_url || mediaFile?.url || null,
                    video_url: lesson.video_url || (lesson.content_type === 'video' ? mediaFile?.url : null) || null,
                    media_file_id: lesson.media_file_id || mediaFile?.id || null,
                    mediaFileId: lesson.media_file_id || mediaFile?.id || null,
                    mediaFile: mediaFile,
                    media: lesson.media || (mediaFile ? [mediaFile] : null),
                    is_published: lesson.is_published ?? true,
                    isPublished: lesson.is_published ?? true,
                  };
                }),
              };
            }
            // Sinon, retourner le module tel quel (pour compatibilité)
            return module;
          })
        : [];

      if (modules.length > 0) {
        course.modules = modules;
      }

      // Si pas de modules mais des leçons séparées (ancien format)
      const lessons: any[] = Array.isArray(payload.lessons) ? payload.lessons : [];
      if (lessons.length > 0 && (!course.modules || course.modules.length === 0)) {
        course.lessons = lessons;
      }

      if (payload.quizzes) {
        course.quizzes = payload.quizzes;
      }

      return course as Course;
    }

    return response.data;
  }

  // Récupérer un cours par slug
  static async getCourseBySlug(slug: string): Promise<Course> {
    const response = await apiRequest(`/courses/slug/${slug}`, {
      method: 'GET',
    });
    // Le backend renvoie { course, modules, lessons, quizzes }
    const payload: any = response.data;
    const course: any = payload.course || payload;
    
    // Inclure les modules dans l'objet cours si disponibles
    if (payload.modules && Array.isArray(payload.modules)) {
      course.modules = payload.modules.map((module: any) => {
        // Si le module a déjà des leçons, les utiliser directement
        if (Array.isArray(module.lessons) && module.lessons.length > 0) {
          return {
            ...module,
            lessons: module.lessons.map((lesson: any) => {
              // Créer l'objet mediaFile si les données médias sont disponibles
              // Priorité 1: lesson.media_files (nouveau format backend - médias associés automatiquement)
              let mediaFile: any = null;
              
              if (lesson.media_files && Array.isArray(lesson.media_files) && lesson.media_files.length > 0) {
                // Filtrer les médias valides (avec URL)
                const validMedia = lesson.media_files.filter((m: any) => m && m.url);
                if (validMedia.length > 0) {
                  mediaFile = validMedia[0];
                }
              }
              // Priorité 1b: lesson.media_file (objet unique)
              else if (lesson.media_file && typeof lesson.media_file === 'object' && lesson.media_file !== null && lesson.media_file.url) {
                mediaFile = lesson.media_file;
              }
              // Priorité 1c: lesson.media (ancienne structure - peut être un objet ou un tableau)
              else if (lesson.media) {
                // Si c'est un tableau, prendre le premier média valide
                if (Array.isArray(lesson.media) && lesson.media.length > 0) {
                  const validMedia = lesson.media.filter((m: any) => m && m.url);
                  if (validMedia.length > 0) {
                    mediaFile = validMedia[0];
                  }
                } 
                // Si c'est un objet
                else if (typeof lesson.media === 'object' && lesson.media !== null && lesson.media.url) {
                  mediaFile = lesson.media;
                }
              }
              // Priorité 2: Construire depuis les champs individuels
              else {
                const mediaFileId = lesson.media_file_id || lesson.media_file_id_from_join;
                // Essayer plusieurs sources pour l'URL du média (content_url est souvent la source principale après upload)
                const mediaUrl = lesson.media_url || 
                                 lesson.content_url || 
                                 lesson.video_url || 
                                 lesson.document_url || 
                                 lesson.audio_url || 
                                 '';
                
                // Déterminer le file_category basé sur content_type si file_category n'est pas fourni
                const contentType = lesson.content_type || lesson.contentType || 'text';
                const fileCategory = lesson.file_category || lesson.fileCategory || 
                                    (contentType === 'video' ? 'video' :
                                     contentType === 'audio' ? 'audio' :
                                     contentType === 'document' ? 'document' :
                                     contentType === 'presentation' ? 'presentation' :
                                     contentType === 'h5p' ? 'h5p' : 'other');
                
                // Si on a un media_file_id ou une URL, créer l'objet mediaFile
                if (mediaFileId || mediaUrl) {
                  // Extraire le nom de fichier depuis l'URL si original_filename n'est pas fourni
                  let originalFilename = lesson.original_filename || lesson.originalFilename || '';
                  if (!originalFilename && mediaUrl) {
                    try {
                      const urlParts = mediaUrl.split('/');
                      originalFilename = urlParts[urlParts.length - 1].split('?')[0]; // Enlever les query params
                    } catch (e) {
                      originalFilename = lesson.title || '';
                    }
                  }
                  
                  mediaFile = {
                    id: mediaFileId || lesson.id,
                    url: mediaUrl,
                    thumbnail_url: lesson.thumbnail_url || lesson.thumbnailUrl,
                    thumbnailUrl: lesson.thumbnail_url || lesson.thumbnailUrl,
                    file_category: fileCategory,
                    fileCategory: fileCategory,
                    original_filename: originalFilename,
                    originalFilename: originalFilename,
                    file_size: lesson.file_size || lesson.fileSize || 0,
                    fileSize: lesson.file_size || lesson.fileSize || 0,
                    file_type: lesson.file_type || lesson.fileType || '',
                    fileType: lesson.file_type || lesson.fileType || '',
                    lesson_id: lesson.id,
                    lessonId: lesson.id,
                  };
                }
              }

              return {
                ...lesson,
                module_id: module.id,
                moduleId: module.id,
                order_index: lesson.order_index ?? lesson.orderIndex ?? lesson.order ?? 0,
                order: lesson.order_index ?? lesson.orderIndex ?? lesson.order ?? 0,
                duration: lesson.duration_minutes ?? lesson.duration ?? 0,
                duration_minutes: lesson.duration_minutes ?? lesson.duration ?? 0,
                content_type: lesson.content_type ?? 'text',
                contentType: lesson.content_type ?? 'text',
                content_text: lesson.content_text ?? lesson.content ?? '',
                contentText: lesson.content_text ?? lesson.content ?? '',
                content_url: lesson.content_url ?? lesson.video_url ?? lesson.media_url ?? null,
                contentUrl: lesson.content_url ?? lesson.video_url ?? lesson.media_url ?? null,
                media_url: lesson.media_url || mediaFile?.url || null,
                video_url: lesson.video_url || (lesson.content_type === 'video' ? mediaFile?.url : null) || null,
                media_file_id: lesson.media_file_id || mediaFile?.id || null,
                mediaFileId: lesson.media_file_id || mediaFile?.id || null,
                mediaFile: mediaFile,
                media: lesson.media || (mediaFile ? [mediaFile] : null),
                is_published: lesson.is_published ?? true,
                isPublished: lesson.is_published ?? true,
              };
            }),
          };
        }
        return module;
      });
    }
    
    // S'assurer que l'instructeur est correctement formaté
    if (course.instructor) {
      const instructorAny = course.instructor as any;
      if (!instructorAny.name) {
        const firstName = instructorAny.first_name || instructorAny.firstName || '';
        const lastName = instructorAny.last_name || instructorAny.lastName || '';
        instructorAny.name = [firstName, lastName].filter(Boolean).join(' ') || 'Instructeur';
      }
    } else if (payload.course) {
      // Si l'instructeur n'est pas dans course, vérifier dans payload
      const coursePayload = payload.course as any;
      if (coursePayload.instructor_first_name || coursePayload.instructor_last_name) {
        course.instructor = {
          id: coursePayload.instructor_id || '',
          name: [coursePayload.instructor_first_name, coursePayload.instructor_last_name].filter(Boolean).join(' ') || 'Instructeur',
          avatar: coursePayload.instructor_profile_picture || coursePayload.instructor_avatar || undefined,
        };
      }
    }
    
    return course as Course;
  }

  // Vérifier si l'utilisateur est inscrit
  static async checkEnrollment(courseId: number): Promise<{ is_enrolled: boolean; enrollment?: any }> {
    try {
      const response = await apiRequest(`/courses/${courseId}/check-enrollment`, {
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        return { is_enrolled: false };
      }
      throw error;
    }
  }

  // Récupérer les cours de l'utilisateur connecté
  static async getMyCourses(): Promise<Course[]> {
    const response = await apiRequest('/courses/my', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Alias pour compatibilité avec les composants qui attendent getStudentCourses.
   * Retourne les mêmes données que getMyCourses (cours de l'étudiant connecté).
   */
  static async getStudentCourses(): Promise<Course[]> {
    return this.getMyCourses();
  }

  // Récupérer les cours d'un instructeur
  static async getInstructorCourses(instructorId: string | number, params?: { status?: 'all' | 'published' | 'draft'; page?: number; limit?: number; }): Promise<Course[]> {
    const search = new URLSearchParams();
    if (params?.status && params.status !== 'all') search.append('status', params.status);
    if (params?.page) search.append('page', String(params.page));
    if (params?.limit) search.append('limit', String(params.limit));
    const qs = search.toString();
    const response = await apiRequest(`/courses/instructor/${instructorId}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
    return response.data?.courses || response.data || [];
  }

  // Créer un nouveau cours
  static async createCourse(data: CreateCourseData): Promise<Course> {
    const response = await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un cours
  static async updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
    const response = await apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer un cours
  static async deleteCourse(id: string): Promise<void> {
    await apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Demander la suppression d'un cours publié (pour instructeur)
  static async requestCourseDeletion(id: string, reason?: string): Promise<void> {
    await apiRequest(`/courses/${id}/request-deletion`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Publier/Dépublier un cours
  static async toggleCourseStatus(id: string): Promise<Course> {
    const response = await apiRequest(`/courses/${id}/toggle-status`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // Demander la publication d'un cours (pour validation admin)
  static async requestCoursePublication(courseId: string): Promise<Course> {
    const response = await apiRequest(`/instructor/courses/${courseId}/request-publication`, {
      method: 'POST',
    });
    return response.data;
  }

  // S'inscrire à un cours
  static async enrollInCourse(courseId: string): Promise<Enrollment> {
    const response = await apiRequest(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
    return response.data;
  }

  // Se désinscrire d'un cours
  static async unenrollFromCourse(courseId: string): Promise<void> {
    await apiRequest(`/courses/${courseId}/unenroll`, {
      method: 'DELETE',
    });
  }

  // Marquer une leçon comme complétée
  static async completeLesson(courseId: string, lessonId: string): Promise<void> {
    await apiRequest(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
    });
  }

  // Récupérer les analytics d'un cours
  static async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await apiRequest(`/courses/${courseId}/analytics`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les avis d'un cours
  static async getCourseReviews(courseId: string): Promise<CourseReview[]> {
    const response = await apiRequest(`/courses/${courseId}/reviews`, {
      method: 'GET',
    });
    return response.data;
  }

  // Ajouter un avis à un cours
  static async addCourseReview(courseId: string, rating: number, comment: string): Promise<CourseReview> {
    const response = await apiRequest(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return response.data;
  }

  // Récupérer toutes les catégories
  static async getCategories(): Promise<any[]> {
    const response = await apiRequest('/categories', {
      method: 'GET',
    });
    return response.data?.categories || response.data || [];
  }

  // Ajouter un cours aux favoris
  static async addToFavorites(courseId: string): Promise<void> {
    try {
      console.log(`🔄 [CourseService] Ajout du cours ${courseId} aux favoris...`);
      const response = await apiRequest(`/courses/${courseId}/favorite`, {
        method: 'POST',
      });
      
      console.log(`✅ [CourseService] Réponse ajout favori:`, {
        success: response.success,
        message: response.message,
        status: response.status,
        data: response.data,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'ajout aux favoris');
      }
    } catch (error: any) {
      // Extraire les informations d'erreur de manière sécurisée
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorStatus = error?.status || error?.statusCode || 'inconnu';
      const errorDetails = error?.details || {};
      
      // Si c'est une erreur 400 (cours déjà dans les favoris), ne pas logger comme erreur
      if (errorStatus === 400) {
        // Le cours est déjà dans les favoris, c'est une situation normale
        // On propage l'erreur mais avec un message clair
        const friendlyMessage = errorMessage?.toLowerCase().includes('déjà') || 
                                errorMessage?.toLowerCase().includes('already') ||
                                errorMessage?.toLowerCase().includes('existe')
          ? errorMessage
          : 'Ce cours est déjà dans vos favoris';
        throw new Error(friendlyMessage);
      }
      
      console.error('❌ [CourseService] Erreur lors de l\'ajout aux favoris:', {
        courseId,
        endpoint: `/courses/${courseId}/favorite`,
        error: errorMessage,
        status: errorStatus,
        errorObject: error,
        details: errorDetails,
      });
      
      // Si c'est une erreur 404, fournir un message utilisateur-friendly
      if (errorStatus === 404 || errorMessage?.toLowerCase().includes('route non trouvée') || errorMessage?.toLowerCase().includes('not found')) {
        throw new Error(
          `La fonctionnalité des favoris n'est pas encore disponible sur le serveur. ` +
          `Veuillez contacter l'administrateur pour activer cette fonctionnalité.`
        );
      }
      
      // Pour les autres erreurs, utiliser le message d'erreur original ou un message générique
      throw new Error(errorMessage || 'Impossible d\'ajouter le cours aux favoris. Veuillez réessayer plus tard.');
    }
  }

  // Retirer un cours des favoris
  static async removeFromFavorites(courseId: string): Promise<void> {
    try {
      const response = await apiRequest(`/courses/${courseId}/favorite`, {
        method: 'DELETE',
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du retrait des favoris');
      }
    } catch (error: any) {
      // Extraire les informations d'erreur de manière sécurisée
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorStatus = error?.status || error?.statusCode || 'inconnu';
      const errorDetails = error?.details || {};
      
      console.error('❌ [CourseService] Erreur lors du retrait des favoris:', {
        courseId,
        endpoint: `/courses/${courseId}/favorite`,
        error: errorMessage,
        status: errorStatus,
        errorObject: error,
        details: errorDetails,
      });
      
      // Si c'est une erreur 404, fournir un message utilisateur-friendly
      if (errorStatus === 404 || errorMessage?.toLowerCase().includes('route non trouvée') || errorMessage?.toLowerCase().includes('not found')) {
        throw new Error(
          `La fonctionnalité des favoris n'est pas encore disponible sur le serveur. ` +
          `Veuillez contacter l'administrateur pour activer cette fonctionnalité.`
        );
      }
      
      // Pour les autres erreurs, utiliser le message d'erreur original ou un message générique
      throw new Error(errorMessage || 'Impossible de retirer le cours des favoris. Veuillez réessayer plus tard.');
    }
  }

  // Récupérer les cours favoris
  static async getFavoriteCourses(): Promise<Course[]> {
    try {
      const response = await apiRequest('/courses/favorites', {
        method: 'GET',
      });
      
      // Selon la documentation API, la réponse peut avoir plusieurs formats :
      // Format 1: { success: true, count: 45, courses: [...], data: { courses: [...], pagination: {...} } }
      // Format 2: { success: true, data: { courses: [...], pagination: {...} } }
      // Format 3: { success: true, courses: [...] }
      
      // Essayer d'abord response.data.courses (format avec pagination dans data)
      if (response.data?.courses && Array.isArray(response.data.courses)) {
        return response.data.courses;
      }
      
      // Essayer ensuite si courses est directement dans response.data (au niveau racine après traitement)
      // Cela peut arriver si l'API retourne { success: true, courses: [...], data: {...} }
      // et que notre traitement a préservé courses dans response.data
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        if (response.data.courses && Array.isArray(response.data.courses)) {
          return response.data.courses;
        }
      }
      
      // Essayer ensuite response.data si c'est directement un tableau de cours
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Vérifier que ce sont bien des cours (ont un id et un title)
        const firstItem = response.data[0];
        if (firstItem && (firstItem.id || firstItem.title)) {
          return response.data;
        }
      }
      
      // Si aucune donnée valide, retourner un tableau vide
      return [];
    } catch (error: any) {
      // Si l'endpoint n'existe pas (404), retourner un tableau vide plutôt que de lancer une erreur
      if (error.status === 404) {
        console.warn('⚠️ [CourseService] Endpoint /courses/favorites non trouvé (404)');
        return [];
      }
      
      // Logger les autres erreurs pour déboguer
      console.error('❌ [CourseService] Erreur lors de la récupération des favoris:', {
        error: error.message,
        status: error.status,
        details: error.details,
      });
      
      // Pour les autres erreurs, relancer
      throw error;
    }
  }

  // Récupérer les statistiques des cours
  static async getCourseStats(): Promise<CourseStats> {
    const response = await apiRequest('/courses/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Rechercher des cours
  static async searchCourses(query: string, filters?: CourseFilter): Promise<Course[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.price) params.append('price', filters.price);
    if (filters?.rating) params.append('rating', filters.rating.toString());

    const response = await apiRequest(`/courses/search?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les cours populaires
  static async getPopularCourses(limit: number = 10): Promise<Course[]> {
    const response = await apiRequest(`/courses/popular?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les cours récents
  static async getRecentCourses(limit: number = 10): Promise<Course[]> {
    const response = await apiRequest(`/courses/recent?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les cours recommandés
  static async getRecommendedCourses(limit: number = 10): Promise<Course[]> {
    const response = await apiRequest(`/courses/recommended?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer la progression d'un cours
  static async getCourseProgress(courseId: string): Promise<{ courseId: string; progress: number; completedLessons: string[]; lastAccessedAt: string }> {
    const response = await apiRequest(`/courses/${courseId}/progress`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les leçons d'un cours
  static async getCourseLessons(courseId: string): Promise<Lesson[]> {
    const response = await apiRequest(`/courses/${courseId}/lessons`, {
      method: 'GET',
    });
    console.log('📚 getCourseLessons response:', response);
    // Le backend peut renvoyer les leçons dans response.data ou response.data.data
    const lessons = response.data?.lessons || response.data?.data || response.data || [];
    console.log('📚 getCourseLessons lessons:', lessons);
    return Array.isArray(lessons) ? lessons : [];
  }

  // Créer une leçon
  static async createLesson(courseId: string | number, data: CreateLessonData): Promise<Lesson> {
    const response = await apiRequest(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Normaliser la réponse pour s'assurer que tous les champs sont présents
    const lesson: any = response.data?.lesson || response.data || {};
    
    // Résoudre le mediaFile si media_file_id est présent
    let mediaFile: MediaFile | null = null;
    if (lesson.media_file_id && lesson.media_files && Array.isArray(lesson.media_files) && lesson.media_files.length > 0) {
      const validMedia = lesson.media_files.filter((m: any) => m && m.url);
      if (validMedia.length > 0) {
        mediaFile = validMedia[0] as MediaFile;
      }
    } else if (lesson.media_file && typeof lesson.media_file === 'object' && lesson.media_file !== null && lesson.media_file.url) {
      mediaFile = lesson.media_file as MediaFile;
    } else if (lesson.media && Array.isArray(lesson.media) && lesson.media.length > 0) {
      const validMedia = lesson.media.filter((m: any) => m && m.url);
      if (validMedia.length > 0) {
        mediaFile = validMedia[0] as MediaFile;
      }
    }
    
    return {
      ...lesson,
      content_type: lesson.content_type || data.content_type || 'text',
      contentType: lesson.content_type || data.content_type || 'text',
      content_url: lesson.content_url || data.content_url || mediaFile?.url || null,
      contentUrl: lesson.content_url || data.content_url || mediaFile?.url || null,
      content_text: lesson.content_text || data.content_text || '',
      contentText: lesson.content_text || data.content_text || '',
      media_file_id: lesson.media_file_id || data.media_file_id || null,
      mediaFileId: lesson.media_file_id || data.media_file_id || null,
      mediaFile: mediaFile,
      media: lesson.media || lesson.media_files || (mediaFile ? [mediaFile] : null),
    } as Lesson;
  }

  // Mettre à jour une leçon (alignement backend)
  static async updateLesson(courseId: string | number, lessonId: string | number, data: UpdateLessonData): Promise<Lesson> {
    const response = await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Récupérer une leçon complète pour un étudiant (avec tous les contenus et médias)
  static async getLessonForStudent(courseId: string | number, lessonId: string | number): Promise<Lesson> {
    // Utiliser la route /student qui inclut les médias distribués automatiquement
    const response = await apiRequest(`/courses/${courseId}/lessons/${lessonId}/student`, {
      method: 'GET',
    });
    
    // Le backend retourne maintenant les contenus et médias dans la réponse (y compris les médias distribués automatiquement)
    const lesson: any = response.data?.lesson || response.data || {};
    
    // Résoudre le mediaFile en priorisant les médias distribués automatiquement
    let mediaFile: MediaFile | null = null;
    
    // Priorité 1: media_files (médias distribués automatiquement par le backend)
    if (lesson.media_files && Array.isArray(lesson.media_files) && lesson.media_files.length > 0) {
      const validMedia = lesson.media_files.filter((m: any) => m && m.url);
      if (validMedia.length > 0) {
        mediaFile = validMedia[0] as MediaFile;
      }
    }
    // Priorité 2: media_file (objet unique)
    else if (lesson.media_file && typeof lesson.media_file === 'object' && lesson.media_file !== null && lesson.media_file.url) {
      mediaFile = lesson.media_file as MediaFile;
    }
    // Priorité 3: media (ancienne structure)
    else if (lesson.media) {
      if (Array.isArray(lesson.media) && lesson.media.length > 0) {
        const validMedia = lesson.media.filter((m: any) => m && m.url);
        if (validMedia.length > 0) {
          mediaFile = validMedia[0] as MediaFile;
        }
      } else if (typeof lesson.media === 'object' && lesson.media !== null && lesson.media.url) {
        mediaFile = lesson.media as MediaFile;
      }
    }
    // Priorité 4: mediaFile (propriété directe)
    else if (lesson.mediaFile && lesson.mediaFile.url) {
      mediaFile = lesson.mediaFile;
    }
    // Priorité 5: Construire depuis les URLs individuelles
    else {
      const mediaUrl = lesson.content_url || lesson.media_url || lesson.video_url || lesson.document_url || lesson.audio_url || '';
      if (mediaUrl) {
        const contentType = lesson.content_type || lesson.contentType || 'text';
        const fileCategory = lesson.file_category || lesson.fileCategory || 
          (contentType === 'video' ? 'video' : 
           contentType === 'audio' ? 'audio' :
           contentType === 'document' ? 'document' :
           contentType === 'presentation' ? 'presentation' :
           contentType === 'h5p' ? 'h5p' : 'other');
        
        const originalFilename = lesson.original_filename || '';
        mediaFile = {
          id: String(lesson.media_file_id || lesson.id),
          url: mediaUrl,
          thumbnail_url: lesson.thumbnail_url || '',
          thumbnailUrl: lesson.thumbnail_url || '',
          file_category: fileCategory,
          fileCategory: fileCategory,
          original_filename: originalFilename,
          originalFilename: originalFilename,
          filename: originalFilename || 'media-file',
          file_size: lesson.file_size || 0,
          fileSize: lesson.file_size || 0,
          file_type: lesson.file_type || '',
          fileType: lesson.file_type || '',
          lesson_id: String(lesson.id),
          lessonId: String(lesson.id),
          storage_type: 'local',
          storage_path: mediaUrl,
          uploaded_by: lesson.uploaded_by || '',
          uploaded_at: lesson.uploaded_at || new Date().toISOString(),
        } as MediaFile;
      }
    }
    
    // Normaliser la leçon pour s'assurer qu'elle a toutes les propriétés nécessaires
    const normalizedLesson: Lesson = {
      ...lesson,
      id: lesson.id || Number(lessonId),
      course_id: lesson.course_id || Number(courseId),
      module_id: lesson.module_id || lesson.moduleId,
      title: lesson.title || '',
      content_type: lesson.content_type || lesson.contentType || 'text',
      contentType: lesson.content_type || lesson.contentType || 'text',
      content_url: lesson.content_url || lesson.contentUrl || mediaFile?.url || lesson.media_url || lesson.video_url || null,
      contentUrl: lesson.content_url || lesson.contentUrl || mediaFile?.url || lesson.media_url || lesson.video_url || null,
      content_text: lesson.content_text || lesson.contentText || lesson.content || '',
      contentText: lesson.content_text || lesson.contentText || lesson.content || '',
      media_file_id: lesson.media_file_id || lesson.mediaFileId || mediaFile?.id || null,
      mediaFileId: lesson.media_file_id || lesson.mediaFileId || mediaFile?.id || null,
      duration_minutes: lesson.duration_minutes || lesson.duration || 0,
      duration: lesson.duration_minutes || lesson.duration || 0,
      order_index: lesson.order_index || lesson.orderIndex || lesson.order || 0,
      order: lesson.order_index || lesson.orderIndex || lesson.order || 0,
      is_required: lesson.is_required ?? lesson.isRequired ?? true,
      is_published: lesson.is_published ?? lesson.isPublished ?? true,
      // Gérer les médias (prioriser les médias distribués automatiquement)
      mediaFile: mediaFile,
      media: lesson.media || lesson.media_files || (mediaFile ? [mediaFile] : null),
      media_url: lesson.media_url || mediaFile?.url || null,
      video_url: lesson.video_url || (lesson.content_type === 'video' ? mediaFile?.url : null) || null,
    };
    
    return normalizedLesson as Lesson;
  }

  // Supprimer une leçon (endpoint RESTful /courses/:courseId/lessons/:lessonId)
  static async deleteLesson(courseId: string | number, lessonId: string | number): Promise<void> {
    await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  }

  // Réorganiser les leçons
  static async reorderLessons(courseId: string, lessonOrders: Array<{ id: string; order: number }>): Promise<void> {
    await apiRequest(`/lessons/courses/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ lessonOrders }),
    });
  }

  static async getMyCourseProgress(): Promise<{ courseId: number; progress: number; completedLessons: number; totalLessons: number }[]> {
    const response = await apiRequest('/courses/my', {
      method: 'GET',
    });

    const courses = response.data?.courses || response.data || [];
    return courses.map((course: any) => ({
      courseId: Number(course.id),
      progress: Number(course.progress_percentage || course.progress || 0),
      completedLessons: Number(course.completed_lessons || 0),
      totalLessons: Number(course.total_lessons || 0),
    }));
  }

}

// Export par défaut
export default CourseService;

// Export nommé pour compatibilité
export const courseService = CourseService;