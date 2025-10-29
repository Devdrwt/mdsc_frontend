import { apiRequest } from './api';
import { Progress, LessonProgress, CourseProgressStats } from '../../types/course';

export class ProgressService {
  /**
   * Récupérer la progression détaillée d'une inscription
   */
  static async getEnrollmentProgress(enrollmentId: number): Promise<Progress[]> {
    const response = await apiRequest(`/progress/enrollment/${enrollmentId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer la progression d'un cours
   */
  static async getCourseProgress(courseId: number): Promise<CourseProgressStats> {
    const response = await apiRequest(`/progress/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer la progression d'une leçon
   */
  static async getLessonProgress(lessonId: number): Promise<Progress[]> {
    const response = await apiRequest(`/progress/lesson/${lessonId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Mettre à jour la progression d'une leçon
   */
  static async updateLessonProgress(
    enrollmentId: number,
    lessonId: number,
    data: {
      status: 'not_started' | 'in_progress' | 'completed';
      completion_percentage: number;
      time_spent: number;
    }
  ): Promise<Progress> {
    const response = await apiRequest(
      `/progress/enrollment/${enrollmentId}/lesson/${lessonId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  /**
   * Marquer une leçon comme complétée
   */
  static async markLessonCompleted(
    enrollmentId: number,
    lessonId: number,
    timeSpent?: number
  ): Promise<Progress> {
    const response = await apiRequest(
      `/progress/enrollment/${enrollmentId}/lesson/${lessonId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ time_spent: timeSpent }),
      }
    );
    return response.data;
  }

  // Méthodes de compatibilité avec l'ancien format
  static async completeLesson(courseId: string | number, lessonId: string | number, timeSpent?: number): Promise<LessonProgress> {
    // Méthode de compatibilité - utiliser enrollmentId si disponible
    console.warn('completeLesson est déprécié, utilisez markLessonCompleted avec enrollmentId');
    // Pour compatibilité, essayer de trouver l'enrollment
    const response = await apiRequest(`/progress/lesson/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ time_spent: timeSpent }),
    });
    return response.data;
  }

  static async getCourseProgressStats(courseId: string | number): Promise<CourseProgressStats> {
    return this.getCourseProgress(Number(courseId));
  }

  static async getStudentCourseProgress(courseId: string | number): Promise<CourseProgressStats> {
    return this.getCourseProgress(Number(courseId));
  }
}

export const progressService = ProgressService;
