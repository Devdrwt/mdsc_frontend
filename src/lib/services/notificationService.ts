import { apiRequest } from './api';

export interface NotificationEntry {
  id: number | string;
  type: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  trigger_at?: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  is_read?: boolean;
  upcoming?: boolean;
}

export class NotificationService {
  static async getNotifications(filters: NotificationFilters = {}): Promise<NotificationListResponse> {
    const search = new URLSearchParams();
    if (filters.page) search.append('page', String(filters.page));
    if (filters.limit) search.append('limit', String(filters.limit));
    if (filters.type) search.append('type', filters.type);
    if (typeof filters.is_read === 'boolean') search.append('is_read', String(filters.is_read));
    if (typeof filters.upcoming === 'boolean') search.append('upcoming', String(filters.upcoming));

    const response = await apiRequest(`/notifications?${search.toString()}`, {
      method: 'GET',
    });

    return response.data ?? { notifications: [] };
  }

  static async markAsRead(id: number | string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  static async markAllAsRead(): Promise<void> {
    await apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  }

  static async deleteNotification(id: number | string): Promise<void> {
    await apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export default NotificationService;