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

  /**
   * Vérifier l'accès à une leçon (progression séquentielle)
   */
  static async checkLessonAccess(
    enrollmentId: number,
    lessonId: number
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    try {
      const response = await apiRequest(
        `/enrollments/${enrollmentId}/lessons/${lessonId}/access`,
        {
          method: 'GET',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      // En cas d'erreur, permettre l'accès pour ne pas bloquer l'utilisateur
      return { hasAccess: true };
    }
  }

  /**
   * Compléter une leçon et déverrouiller la suivante
   */
  static async completeLesson(
    enrollmentId: number,
    lessonId: number,
    timeSpent?: number
  ): Promise<{ success: boolean; nextLessonUnlocked?: boolean }> {
    const response = await apiRequest(
      `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ time_spent: timeSpent }),
      }
    );
    return response.data;
  }

  /**
   * Obtenir la liste des leçons déverrouillées pour un cours
   */
  static async getUnlockedLessons(
    enrollmentId: number,
    courseId: number
  ): Promise<number[]> {
    try {
      const response = await apiRequest(
        `/enrollments/${enrollmentId}/progress`,
        {
          method: 'GET',
        }
      );
      // Retourner les IDs des leçons déverrouillées
      const progress = response.data;
      return progress.unlocked_lessons || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des leçons déverrouillées:', error);
      return [];
    }
  }
}

export const progressService = ProgressService;
