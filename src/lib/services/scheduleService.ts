import { apiRequest } from './api';
import { CourseSchedule, ScheduleItem } from '../../types/schedule';

export class ScheduleService {
  /**
   * Récupère le planning d'un cours pour l'utilisateur connecté
   * @param courseId ID du cours
   * @returns Planning du cours avec tous les items (leçons, quiz, milestones)
   */
  static async getCourseSchedule(courseId: number): Promise<CourseSchedule> {
    const candidateEndpoints = [
      `/student/courses/${courseId}/schedule`,
      `/student/schedule/${courseId}`,
      `/courses/${courseId}/schedule`,
    ];

    let lastError: any = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await apiRequest<CourseSchedule>(endpoint, { method: 'GET' });

        if (response.success && response.data) {
          return response.data;
        }
      } catch (error: any) {
        lastError = error;

        // Si l'endpoint n'existe pas (404), essayer le suivant
        if (error?.status === 404) {
          continue;
        }

        throw error;
      }
    }

    // Si toutes les routes sont introuvables, retourner un planning vide pour éviter le crash
    if (lastError?.status === 404 || !lastError) {
      console.warn(
        `[scheduleService] Aucun endpoint de planning disponible pour le cours ${courseId}.`,
        lastError?.message || 'Route non trouvée'
      );

      return {
        enrollment_id: 0,
        course_id: courseId,
        schedule: [],
      };
    }

    throw lastError;
  }

  /**
   * Récupère un item de planning spécifique
   * @param courseId ID du cours
   * @param itemId ID de l'item
   * @returns Item de planning
   */
  static async getScheduleItem(courseId: number, itemId: number): Promise<ScheduleItem> {
    const schedule = await this.getCourseSchedule(courseId);
    const item = schedule.schedule.find((s) => s.id === itemId);

    if (!item) {
      throw new Error('Item de planning non trouvé');
    }

    return item;
  }

  /**
   * Récupère les items en retard pour un cours
   * @param courseId ID du cours
   * @returns Liste des items en retard
   */
  static async getOverdueItems(courseId: number): Promise<ScheduleItem[]> {
    const schedule = await this.getCourseSchedule(courseId);
    return schedule.schedule.filter((item) => item.status === 'overdue');
  }

  /**
   * Récupère les prochains items pour un cours
   * @param courseId ID du cours
   * @param limit Nombre maximum d'items à retourner (défaut: 5)
   * @returns Liste des prochains items
   */
  static async getUpcomingItems(courseId: number, limit: number = 5): Promise<ScheduleItem[]> {
    const schedule = await this.getCourseSchedule(courseId);
    const now = new Date();

    return schedule.schedule
      .filter((item) => {
        const scheduledDate = new Date(item.scheduled_date);
        return scheduledDate >= now && item.status !== 'completed';
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_date);
        const dateB = new Date(b.scheduled_date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  }
}

export const scheduleService = ScheduleService;

