import { apiRequest } from './api';

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
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  isCompleted?: boolean;
  videoUrl?: string;
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
  content: string;
  duration: number;
  order: number;
  videoUrl?: string;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  duration?: number;
  order?: number;
  videoUrl?: string;
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
    // Le backend renvoie { course, modules, lessons, quizzes }
    return response.data.course || response.data;
  }

  // Récupérer un cours par slug
  static async getCourseBySlug(slug: string): Promise<Course> {
    const response = await apiRequest(`/courses/slug/${slug}`, {
      method: 'GET',
    });
    // Le backend renvoie { course, modules, lessons, quizzes }
    return response.data.course || response.data;
  }

  // Vérifier si l'utilisateur est inscrit
  static async checkEnrollment(courseId: number): Promise<{ is_enrolled: boolean; enrollment?: any }> {
    const response = await apiRequest(`/courses/${courseId}/check-enrollment`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les cours de l'utilisateur connecté
  static async getMyCourses(): Promise<Course[]> {
    const response = await apiRequest('/courses/my', {
      method: 'GET',
    });
    return response.data;
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

  // Publier/Dépublier un cours
  static async toggleCourseStatus(id: string): Promise<Course> {
    const response = await apiRequest(`/courses/${id}/toggle-status`, {
      method: 'PATCH',
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
    await apiRequest(`/courses/${courseId}/favorite`, {
      method: 'POST',
    });
  }

  // Retirer un cours des favoris
  static async removeFromFavorites(courseId: string): Promise<void> {
    await apiRequest(`/courses/${courseId}/favorite`, {
      method: 'DELETE',
    });
  }

  // Récupérer les cours favoris
  static async getFavoriteCourses(): Promise<Course[]> {
    const response = await apiRequest('/courses/favorites', {
      method: 'GET',
    });
    return response.data;
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
    return response.data;
  }

  // Créer une leçon
  static async createLesson(courseId: string | number, data: CreateLessonData): Promise<Lesson> {
    const response = await apiRequest(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une leçon (alignement backend)
  static async updateLesson(courseId: string | number, lessonId: string | number, data: UpdateLessonData): Promise<Lesson> {
    const response = await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer une leçon
  static async deleteLesson(lessonId: string): Promise<void> {
    await apiRequest(`/lessons/${lessonId}`, {
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

}

// Export par défaut
export default CourseService;

// Export nommé pour compatibilité
export const courseService = CourseService;