import { apiRequest } from './api';
import { Progress, LessonProgress, CourseProgressStats } from '../../types/course';

export class ProgressService {
  /**
   * Récupérer la progression détaillée d'une inscription
   */
  static async getEnrollmentProgress(enrollmentId: number): Promise<Progress[]> {
    try {
      const response = await apiRequest(`/progress/enrollment/${enrollmentId}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.warn('ProgressService.getEnrollmentProgress fallback:', error);
      return [];
    }
  }

  /**
   * Récupérer la progression d'un cours
   */
  static async getCourseProgress(courseId: number): Promise<CourseProgressStats> {
    try {
      const response = await apiRequest(`/progress/course/${courseId}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.warn('ProgressService.getCourseProgress fallback:', error);
      return {
        progress_percentage: 0,
        enrollment_status: 'enrolled',
        total_lessons: 0,
        completed_lessons: 0,
      };
    }
  }

  /**
   * Récupérer la progression d'une leçon
   */
  static async getLessonProgress(lessonId: number): Promise<Progress[]> {
    try {
      const response = await apiRequest(`/progress/lesson/${lessonId}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.warn('ProgressService.getLessonProgress fallback:', error);
      return [];
    }
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
  ): Promise<{ success: boolean; unlockedLessonId?: number }> {
    try {
      const response = await apiRequest(
        `/progress/enrollment/${enrollmentId}/lesson/${lessonId}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ time_spent: timeSpent }),
        }
      );
      const payload: any = response.data || {};
      const unlockedLessonId =
        payload?.unlockedNextLesson?.unlockedLessonId ?? payload?.unlockedLessonId;
      return {
        success: true,
        unlockedLessonId: typeof unlockedLessonId === 'number' ? unlockedLessonId : undefined,
      };
    } catch (error: any) {
      if (error?.status === 403) {
        console.warn('Accès refusé lors de la complétion de la leçon:', error.message);
        return { success: false };
      }
      throw error;
    }
  }

  // Méthodes de compatibilité avec l'ancien format
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
        `/progress/enrollment/${enrollmentId}/lesson/${lessonId}/access`,
        {
          method: 'GET',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la vérification d\'accès:', error);
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
  ): Promise<{ success: boolean; unlockedLessonId?: number }> {
    try {
      const response = await apiRequest(
        `/progress/enrollment/${enrollmentId}/lesson/${lessonId}/complete-sequential`,
        {
          method: 'POST',
          body: JSON.stringify({ time_spent: timeSpent }),
        }
      );
      const payload: any = response.data || {};
      const unlockedLessonId =
        payload?.unlockedNextLesson?.unlockedLessonId ?? payload?.unlockedLessonId;
      return {
        success: true,
        unlockedLessonId: typeof unlockedLessonId === 'number' ? unlockedLessonId : undefined,
      };
    } catch (error: any) {
      if (error?.status === 403) {
        console.warn('Accès refusé lors de la complétion de la leçon:', error.message);
        return { success: false };
      }
      throw error;
    }
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
        `/progress/enrollment/${enrollmentId}`,
        {
          method: 'GET',
        }
      );
      const progress = response.data?.progress || [];
      return progress
        .filter((item: any) => item.status === 'completed')
        .map((item: any) => Number(item.lesson_id))
        .filter((id: number) => !Number.isNaN(id));
    } catch (error) {
      console.error('Erreur lors de la récupération des leçons déverrouillées:', error);
      return [];
    }
  }

  /**
   * Marquer un cours entier comme terminé
   */
  static async markCourseCompleted(
    enrollmentId: number,
    courseId: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiRequest(
        `/progress/enrollment/${enrollmentId}/course/${courseId}/complete`,
        {
          method: 'POST',
        }
      );
      return {
        success: true,
        message: response.data?.message || 'Cours marqué comme terminé avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors du marquage du cours comme terminé:', error);
      if (error?.status === 403) {
        return {
          success: false,
          message: 'Vous n\'avez pas l\'autorisation de marquer ce cours comme terminé',
        };
      }
      if (error?.status === 400) {
        return {
          success: false,
          message: error?.message || 'Impossible de marquer le cours comme terminé. Vérifiez que toutes les conditions sont remplies.',
        };
      }
      throw error;
    }
  }
}

export const progressService = ProgressService;
