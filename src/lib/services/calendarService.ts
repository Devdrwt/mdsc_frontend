import { apiRequest } from './api';
import { CalendarEvent, CalendarQueryParams } from '../../types/schedule';

export class CalendarService {
  /**
   * Récupère les événements du calendrier
   * @param params Paramètres de requête (dates, type, upcoming)
   * @returns Liste des événements calendrier
   */
  static async getEvents(params?: CalendarQueryParams): Promise<CalendarEvent[]> {
    const queryParams = new URLSearchParams();

    if (params?.start) {
      queryParams.append('start', params.start);
    }
    if (params?.end) {
      queryParams.append('end', params.end);
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    if (params?.upcoming) {
      queryParams.append('upcoming', 'true');
    }

    const url = `/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiRequest<CalendarEvent[]>(url, {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      throw new Error('Erreur lors de la récupération des événements');
    }

    // response.data est de type CalendarEvent[] selon le type générique
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Récupère les événements à venir
   * @param days Nombre de jours à venir (défaut: 7)
   * @returns Liste des événements à venir
   */
  static async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getEvents({
      start: now.toISOString(),
      end: endDate.toISOString(),
      upcoming: true,
    });
  }

  /**
   * Récupère les événements d'un cours spécifique
   * @param courseId ID du cours
   * @param start Date de début (optionnel)
   * @param end Date de fin (optionnel)
   * @returns Liste des événements du cours
   */
  static async getCourseEvents(
    courseId: number,
    start?: string,
    end?: string
  ): Promise<CalendarEvent[]> {
    const allEvents = await this.getEvents({ start, end });
    return allEvents.filter((event) => event.course?.id === courseId);
  }

  /**
   * Récupère les événements en retard
   * @returns Liste des événements en retard
   */
  static async getOverdueEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const events = await this.getEvents({
      end: now.toISOString(),
    });

    return events.filter((event) => {
      const endDate = new Date(event.end_date);
      return endDate < now;
    });
  }
}

export const calendarService = CalendarService;
