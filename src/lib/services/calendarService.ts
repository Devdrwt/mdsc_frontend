import { apiRequest } from './api';

export interface CalendarEvent {
  id: number | string;
  title: string;
  description?: string;
  type?: string;
  start_at: string;
  end_at?: string;
  location?: string;
  course_id?: number | string;
  course_title?: string;
  is_public?: boolean;
  metadata?: Record<string, any> | null;
}

export interface CalendarFilters {
  start?: string;
  end?: string;
  type?: string;
  upcoming?: boolean;
}

export class CalendarService {
  static async getEvents(filters: CalendarFilters = {}): Promise<CalendarEvent[]> {
    const search = new URLSearchParams();
    if (filters.start) search.append('start', filters.start);
    if (filters.end) search.append('end', filters.end);
    if (filters.type) search.append('type', filters.type);
    if (typeof filters.upcoming === 'boolean') search.append('upcoming', String(filters.upcoming));

    const response = await apiRequest(`/calendar?${search.toString()}`, {
      method: 'GET',
    });

    return response.data?.events ?? [];
  }

  static async getEventById(id: number | string): Promise<CalendarEvent | null> {
    const response = await apiRequest(`/calendar/${id}`, {
      method: 'GET',
    });

    return response.data ?? null;
  }
}

export default CalendarService;
