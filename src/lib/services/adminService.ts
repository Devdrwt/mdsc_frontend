import { apiRequest } from './api';
import { buildMediaUrl } from '../../utils/media';

export interface CourseApproval {
  id: string;
  course_id?: string;
  title?: string;
  course_title?: string; // Pour compatibilité
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_approval';
  instructor_first_name?: string;
  instructor_last_name?: string;
  instructor_name?: string; // Pour compatibilité (sera construit à partir de first_name + last_name)
  instructor_email?: string;
  request_date?: string;
  created_at?: string; // Pour compatibilité
  course_type?: string;
  rejection_reason?: string;
  comments?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CourseApprovalAction {
  courseId: string;
  action: 'approve' | 'reject';
  comments?: string;
  rejectionReason?: string;
}

export interface AdminOverviewResponse {
  totals?: {
    users?: {
      total?: number;
      active?: number;
      students?: number;
      instructors?: number;
      admins?: number;
    };
    courses?: {
      total?: number;
      published?: number;
      pending?: number;
      draft?: number;
    };
    enrollments?: {
      total?: number;
      completed?: number;
      active?: number;
    };
    revenue?: {
      totals?: Array<{
        currency?: string;
        amount?: number;
        total_amount?: number;
        completed_payments?: number;
        last_payment_at?: string | null;
      }>;
    };
  };
  monthly_growth?: {
    users?: Array<{ month?: string; value?: number }>;
    courses?: Array<{ month?: string; value?: number }>;
    revenue?: Array<{
      month?: string;
      total_amount?: number;
      value?: number;
      breakdown?: Array<{
        currency?: string;
        total_amount?: number;
        payments?: number;
      }>;
    }>;
  };
}

export interface AdminSystemMetric {
  metric: string;
  value: number;
  unit?: string;
  context?: Record<string, any>;
  recorded_at: string;
}

export interface AdminSystemMetricsResponse {
  metrics?: AdminSystemMetric[];
  history?: Record<string, Array<{ value?: number; recorded_at?: string }>>;
  uptime_seconds?: number;
  last_backup_at?: string | null;
}

export interface AdminActivityEntry {
  id: number | string;
  type: string;
  description?: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  course?: {
    id?: number | string;
    title?: string;
  };
}

export interface AdminAlertEntry {
  id: number | string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description?: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface AdminServiceStatusCheck {
  id: string;
  name: string;
  status: 'up' | 'degraded' | 'down' | 'disabled';
  message?: string;
  details?: Record<string, any>;
}

export interface AdminServiceStatusResponse {
  summary?: 'up' | 'degraded' | 'down';
  checked_at?: string;
  services?: AdminServiceStatusCheck[];
}

export interface AdminNotificationEntry {
  id: number | string;
  title: string;
  message?: string;
  type?: string;
  metadata?: Record<string, any> | null;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
  trigger_at?: string | null;
}

export interface AdminNotificationPayload {
  title: string;
  message?: string;
  type?: string;
  metadata?: Record<string, any> | null;
  trigger_at?: string | null;
  is_read?: boolean;
}

export interface AdminNotificationListResponse {
  notifications: AdminNotificationEntry[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  } | null;
}

export interface AdminEventEntry {
  id: number | string;
  title: string;
  description?: string;
  type?: string;
  start_at?: string;
  end_at?: string | null;
  location?: string | null;
  course_id?: number | string | null;
  course_title?: string;
  is_public?: boolean;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminEventPayload {
  title: string;
  description?: string;
  type?: string;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  course_id?: number | string | null;
  is_public?: boolean;
  metadata?: Record<string, any> | null;
}

export interface AdminEventListResponse {
  events: AdminEventEntry[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  } | null;
}

export class AdminService {
  // Récupérer les cours en attente de validation
  static async getPendingCourses(): Promise<CourseApproval[]> {
    const response = await apiRequest('/admin/courses/pending', {
      method: 'GET',
    });
    
    // Gérer différents formats de réponse
    let courses: any[] = [];
    
    if (Array.isArray(response.data)) {
      courses = response.data;
    } else if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.courses)) {
        courses = response.data.courses;
      } else if (Array.isArray(response.data.data)) {
        courses = response.data.data;
      }
    } else if (Array.isArray(response)) {
      courses = response;
    }
    
    // Normaliser les données pour s'assurer que tous les champs nécessaires existent
    return courses.map((course: any) => {
      // Normaliser course_id
      if (!course.course_id) {
        course.course_id = course.id || course.courseId || course.course_id;
      }
      // S'assurer que id existe aussi (pour la clé React)
      if (!course.id) {
        course.id = course.course_id || course.id;
      }
      
      // Normaliser le titre
      if (!course.course_title && course.title) {
        course.course_title = course.title;
      }
      if (!course.title && course.course_title) {
        course.title = course.course_title;
      }
      
      // Construire instructor_name à partir de first_name et last_name si nécessaire
      if (!course.instructor_name && (course.instructor_first_name || course.instructor_last_name)) {
        const firstName = course.instructor_first_name || '';
        const lastName = course.instructor_last_name || '';
        course.instructor_name = `${firstName} ${lastName}`.trim();
      }
      
      // Normaliser la date de demande
      if (!course.created_at && course.request_date) {
        course.created_at = course.request_date;
      }
      if (!course.request_date && course.created_at) {
        course.request_date = course.created_at;
      }
      
      return course as CourseApproval;
    });
  }

  // Approuver un cours
  static async approveCourse(courseId: string, comments?: string): Promise<void> {
    await apiRequest(`/admin/courses/${courseId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  // Rejeter un cours
  static async rejectCourse(
    courseId: string,
    rejectionReason: string,
    comments?: string
  ): Promise<void> {
    await apiRequest(`/admin/courses/${courseId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason, comments }),
    });
  }

  // Récupérer les détails d'un cours pour validation
  static async getCourseForApproval(courseId: string): Promise<any> {
    const response = await apiRequest(`/admin/courses/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les cours (pour gestion)
  static async getAllCourses(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ courses: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    try {
      // Utiliser l'endpoint admin spécifique
      const response = await apiRequest(`/admin/courses?${queryParams.toString()}`, {
        method: 'GET',
      });
      
      // Gérer le format de réponse avec pagination
      if (response.data) {
        // Si la réponse contient courses et pagination
        if (response.data.courses && Array.isArray(response.data.courses)) {
          return {
            courses: response.data.courses,
            pagination: response.data.pagination
          };
        }
        // Si c'est directement un tableau
        if (Array.isArray(response.data)) {
          return {
            courses: response.data,
            pagination: undefined
          };
        }
      }
      
      // Format par défaut
      return {
        courses: [],
        pagination: undefined
      };
    } catch (error: any) {
      // Si l'endpoint admin n'existe pas (404), essayer l'endpoint standard
      if (error.status === 404) {
        console.warn('⚠️ [AdminService] Endpoint /admin/courses non trouvé, utilisation de /courses');
        try {
          const response = await apiRequest(`/courses?${queryParams.toString()}`, {
            method: 'GET',
          });
          
          // Normaliser la réponse
          const courses = Array.isArray(response.data) ? response.data : (response.data?.courses || []);
          return {
            courses,
            pagination: response.data?.pagination
          };
        } catch (fallbackError) {
          console.error('❌ [AdminService] Erreur lors de la récupération des cours:', fallbackError);
          // Retourner un tableau vide plutôt que de lancer une erreur
          return { courses: [], pagination: undefined };
        }
      }
      // Pour les autres erreurs, relancer
      throw error;
    }
  }

  // Récupérer l'overview global du dashboard admin
  static async getOverview(): Promise<AdminOverviewResponse> {
    const response = await apiRequest('/admin/overview', {
      method: 'GET',
    });

    // L'API renvoie { success, data }, retourner data ou un objet vide
    if (response.success !== false && response.data) {
      return response.data as AdminOverviewResponse;
    }

    return {};
  }

  // Récupérer les métriques système
  static async getSystemMetrics(params?: {
    rangeMinutes?: number;
    historyLimit?: number;
  }): Promise<AdminSystemMetricsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.rangeMinutes) {
      searchParams.append('rangeMinutes', String(params.rangeMinutes));
    }
    if (params?.historyLimit) {
      searchParams.append('historyLimit', String(params.historyLimit));
    }

    const response = await apiRequest(`/admin/system-metrics?${searchParams.toString()}`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      return response.data as AdminSystemMetricsResponse;
    }

    return {};
  }

  // Récupérer les activités récentes
  static async getRecentActivity(params?: {
    limit?: number;
    eventType?: string;
  }): Promise<AdminActivityEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', String(params.limit));
    }
    if (params?.eventType) {
      searchParams.append('eventType', params.eventType);
    }

    const response = await apiRequest(`/admin/recent-activity?${searchParams.toString()}`, {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data)) {
      return response.data as AdminActivityEntry[];
    }

    return [];
  }

  static async getAlerts(): Promise<AdminAlertEntry[]> {
    const response = await apiRequest('/admin/alerts', {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data)) {
      return response.data as AdminAlertEntry[];
    }

    return [];
  }

  static async getServiceStatus(): Promise<AdminServiceStatusResponse> {
    const response = await apiRequest('/admin/services/status', {
      method: 'GET',
    });
 
    if (response.success !== false && response.data) {
      return response.data as AdminServiceStatusResponse;
    }
 
    return {};
  }

  static async getAdminNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    is_read?: boolean;
    upcoming?: boolean;
  }): Promise<AdminNotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.type) searchParams.append('type', params.type);
    if (typeof params?.is_read === 'boolean') searchParams.append('is_read', String(params.is_read));
    if (typeof params?.upcoming === 'boolean') searchParams.append('upcoming', String(params.upcoming));

    const query = searchParams.toString();
    const response = await apiRequest(`/admin/notifications${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const data = response?.data;
    if (Array.isArray(data)) {
      return { notifications: data, pagination: null };
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).notifications)) {
        return {
          notifications: (data as any).notifications,
          pagination: (data as any).pagination ?? null,
        };
      }
      if (Array.isArray((data as any).data)) {
        return {
          notifications: (data as any).data,
          pagination: (data as any).pagination ?? null,
        };
      }
    }

    return { notifications: [], pagination: null };
  }

  static async createAdminNotification(payload: AdminNotificationPayload): Promise<AdminNotificationEntry> {
    const response = await apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return (response?.data as AdminNotificationEntry) ?? (response as any);
  }

  static async updateAdminNotification(
    id: number | string,
    payload: Partial<AdminNotificationPayload>
  ): Promise<AdminNotificationEntry> {
    const response = await apiRequest(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return (response?.data as AdminNotificationEntry) ?? (response as any);
  }

  static async deleteAdminNotification(id: number | string): Promise<void> {
    await apiRequest(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  static async getAdminEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    upcoming?: boolean;
    start?: string;
    end?: string;
  }): Promise<AdminEventListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.type) searchParams.append('type', params.type);
    if (typeof params?.upcoming === 'boolean') searchParams.append('upcoming', String(params.upcoming));
    if (params?.start) searchParams.append('start', params.start);
    if (params?.end) searchParams.append('end', params.end);

    const query = searchParams.toString();
    const response = await apiRequest(`/admin/events${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const data = response?.data;
    if (Array.isArray(data)) {
      return { events: data, pagination: null };
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).events)) {
        return {
          events: (data as any).events,
          pagination: (data as any).pagination ?? null,
        };
      }
      if (Array.isArray((data as any).data)) {
        return {
          events: (data as any).data,
          pagination: (data as any).pagination ?? null,
        };
      }
    }

    return { events: [], pagination: null };
  }

  static async createAdminEvent(payload: AdminEventPayload): Promise<AdminEventEntry> {
    const response = await apiRequest('/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return (response?.data as AdminEventEntry) ?? (response as any);
  }

  static async updateAdminEvent(
    id: number | string,
    payload: Partial<AdminEventPayload>
  ): Promise<AdminEventEntry> {
    const response = await apiRequest(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return (response?.data as AdminEventEntry) ?? (response as any);
  }

  static async deleteAdminEvent(id: number | string): Promise<void> {
    await apiRequest(`/admin/events/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export par défaut
export default AdminService;

// Export nommé pour compatibilité
export const adminService = AdminService;

