import { apiRequest } from './api';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info' | string;
  timestamp: number;
  duration?: number;
}

export interface NotificationEntry {
  id: number | string;
  type: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  action_url?: string | null; // URL d'action pour la notification
  read_at?: string | null; // Date de lecture (ISO 8601)
  expires_at?: string | null; // Date d'expiration (ISO 8601)
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
    pages: number; // Nombre total de pages (selon le guide API)
    total_pages?: number; // Alias pour compatibilité
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
  private static notifications: Notification[] = [];
  private static listeners = new Set<(notifications: Notification[]) => void>();

  private static emit() {
    const snapshot = [...NotificationService.notifications];
    NotificationService.listeners.forEach((listener) => listener(snapshot));
  }

  static subscribe(listener: (notifications: Notification[]) => void) {
    NotificationService.listeners.add(listener);
    listener([...NotificationService.notifications]);
    return () => {
      NotificationService.listeners.delete(listener);
    };
  }

  static add(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      ...notification,
    };
    NotificationService.notifications = [newNotification, ...NotificationService.notifications];
    NotificationService.emit();
    return newNotification.id;
  }

  static remove(id: string) {
    NotificationService.notifications = NotificationService.notifications.filter((n) => n.id !== id);
    NotificationService.emit();
  }

  static clear() {
    NotificationService.notifications = [];
    NotificationService.emit();
  }

  static success(title: string, message?: string, duration?: number) {
    return NotificationService.add({ type: 'success', title, message, duration });
  }

  static error(title: string, message?: string, duration?: number) {
    return NotificationService.add({ type: 'error', title, message, duration });
  }

  static warning(title: string, message?: string, duration?: number) {
    return NotificationService.add({ type: 'warning', title, message, duration });
  }

  static info(title: string, message?: string, duration?: number) {
    return NotificationService.add({ type: 'info', title, message, duration });
  }

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

    // Gérer la structure de réponse selon le guide API
    // Format attendu: { success: true, data: { notifications: [...], pagination: {...} } }
    const responseData = response.data;
    
    if (responseData && typeof responseData === 'object') {
      // Si la structure est déjà correcte (notifications et pagination au même niveau)
      if (Array.isArray(responseData.notifications)) {
        return {
          notifications: responseData.notifications,
          pagination: responseData.pagination || null,
        };
      }
      // Si les données sont directement dans data.data
      if (responseData.data && typeof responseData.data === 'object') {
        return {
          notifications: responseData.data.notifications || [],
          pagination: responseData.data.pagination || null,
        };
      }
    }
    
    return { notifications: [], pagination: null };
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