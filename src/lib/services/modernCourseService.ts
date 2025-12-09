/**
 * Service moderne pour la gestion des cours avec l'API étendue
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructor: string;
  instructorId?: string;
  duration: string;
  durationHours?: number;
  students: number;
  maxStudents?: number;
  rating: number;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  price: number;
  isFree: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  prerequisites?: string[];
  objectives?: string[];
  syllabus?: string[];
  resources?: CourseResource[];
  enrollmentDeadline?: string;
  startDate?: string;
  endDate?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'link';
  url?: string;
  filePath?: string;
  description?: string;
  isRequired: boolean;
  order: number;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  lastAccessedAt?: string;
}

export interface CourseManifest {
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  category: string;
  price: number;
  thumbnail: string;
  resources: CourseResource[];
  objectives: string[];
  prerequisites: string[];
  tags: string[];
}

// Gestion des erreurs API
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fonction helper pour les requêtes fetch
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token d'authentification si disponible
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Une erreur est survenue',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur réseau ou autre
    throw new ApiError(
      'Impossible de se connecter au serveur. Vérifiez votre connexion.',
      0
    );
  }
}

// Récupérer tous les cours avec pagination et filtres
export async function getCourses(params?: {
  category?: string;
  level?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ courses: Course[]; total: number; page: number; totalPages: number }> {
  const queryParams = new URLSearchParams();
  
  if (params?.category) queryParams.append('category', params.category);
  if (params?.level) queryParams.append('level', params.level);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const endpoint = `/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return fetchAPI<{ courses: Course[]; total: number; page: number; totalPages: number }>(endpoint);
}

// Récupérer un cours par ID
export async function getCourseById(courseId: string): Promise<Course> {
  return fetchAPI<Course>(`/courses/${courseId}`);
}

// Rechercher des cours avec suggestions
export async function searchCourses(query: string, filters?: {
  category?: string;
  level?: string;
  priceRange?: { min: number; max: number };
  duration?: string;
  rating?: number;
}): Promise<{ courses: Course[]; suggestions: string[] }> {
  const queryParams = new URLSearchParams({ q: query });
  
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.level) queryParams.append('level', filters.level);
  if (filters?.priceRange) {
    queryParams.append('price_min', filters.priceRange.min.toString());
    queryParams.append('price_max', filters.priceRange.max.toString());
  }
  if (filters?.duration) queryParams.append('duration', filters.duration);
  if (filters?.rating) queryParams.append('rating', filters.rating.toString());

  const response = await fetchAPI<{ courses: Course[]; suggestions: string[] }>(`/courses/search?${queryParams.toString()}`);
  return response;
}

// Récupérer les cours d'un formateur
export async function getInstructorCourses(instructorId: string): Promise<Course[]> {
  const response = await fetchAPI<{ courses: Course[] }>(`/courses/instructor/${instructorId}`);
  return response.courses;
}

// Récupérer les cours d'un utilisateur
export async function getStudentCourses(studentId: string): Promise<Course[]> {
  const response = await fetchAPI<{ courses: Course[] }>(`/courses/student/${studentId}`);
  return response.courses;
}

// S'inscrire à un cours
export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  return fetchAPI<CourseEnrollment>(`/courses/${courseId}/enroll`, {
    method: 'POST',
  });
}

// Se désinscrire d'un cours
export async function unenrollFromCourse(courseId: string): Promise<void> {
  return fetchAPI<void>(`/courses/${courseId}/unenroll`, {
    method: 'DELETE',
  });
}

// Récupérer la progression d'un cours
export async function getCourseProgress(courseId: string): Promise<{
  courseId: string;
  userId: string;
  progress: number;
  completedLessons: string[];
  currentLesson?: string;
  timeSpent: number;
  lastAccessedAt: string;
}> {
  return fetchAPI<any>(`/courses/${courseId}/progress`);
}

// Mettre à jour la progression d'un cours
export async function updateCourseProgress(
  courseId: string, 
  progress: Partial<{
    progress: number;
    completedLessons: string[];
    currentLesson?: string;
    timeSpent: number;
  }>
): Promise<any> {
  return fetchAPI<any>(`/courses/${courseId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(progress),
  });
}

// Marquer une leçon comme terminée
export async function markLessonCompleted(courseId: string, lessonId: string): Promise<void> {
  return fetchAPI<void>(`/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: 'POST',
  });
}

// Récupérer les ressources d'un cours
export async function getCourseResources(courseId: string): Promise<CourseResource[]> {
  const response = await fetchAPI<{ resources: CourseResource[] }>(`/courses/${courseId}/resources`);
  return response.resources;
}

// Récupérer les avis d'un cours
export async function getCourseReviews(courseId: string): Promise<Array<{
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}>> {
  const response = await fetchAPI<{ reviews: any[] }>(`/courses/${courseId}/reviews`);
  return response.reviews;
}

// Ajouter un avis à un cours
export async function addCourseReview(
  courseId: string, 
  rating: number, 
  comment: string
): Promise<any> {
  return fetchAPI<any>(`/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}

// Récupérer les catégories de cours
export async function getCourseCategories(): Promise<string[]> {
  const response = await fetchAPI<{ categories: string[] }>('/courses/categories');
  return response.categories;
}

// Récupérer les cours populaires
export async function getPopularCourses(limit: number = 6): Promise<Course[]> {
  try {
    const response = await fetchAPI<any>(`/courses/popular?limit=${limit}`);
    // Gérer les deux formats possibles : { courses: Course[] } ou Course[]
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.courses)) {
      return response.courses;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des cours populaires:', error);
    return [];
  }
}

// Récupérer les cours récents
export async function getRecentCourses(limit: number = 6): Promise<Course[]> {
  const response = await fetchAPI<{ courses: Course[] }>(`/courses/recent?limit=${limit}`);
  return response.courses;
}

// Récupérer les cours recommandés pour un utilisateur
export async function getRecommendedCourses(userId: string, limit: number = 6): Promise<Course[]> {
  const response = await fetchAPI<{ courses: Course[] }>(`/courses/recommended/${userId}?limit=${limit}`);
  return response.courses;
}
