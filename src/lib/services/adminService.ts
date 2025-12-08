import { apiRequest } from './api';
import { resolveMediaUrl } from '../utils/media';

const normalizeNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace?.(/\s/g, '') ?? value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object') {
    if ('total' in value) return normalizeNumber((value as any).total);
    if ('value' in value) return normalizeNumber((value as any).value);
    if ('count' in value) return normalizeNumber((value as any).count);
    if ('amount' in value) return normalizeNumber((value as any).amount);
  }
  return 0;
};

const extractArray = (payload: any, keys: string[] = []): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

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

export interface AdminTopCourseEntry {
  id: number | string;
  course_id?: number | string;
  title: string;
  category?: string | null;
  enrollments: number;
  completions: number;
  completion_rate: number;
  average_rating: number;
  revenue: number;
  currency?: string;
  trend?: number | null;
}

export interface AdminTopInstructorEntry {
  id: number | string;
  instructor_id?: number | string;
  name: string;
  email?: string | null;
  courses_count: number;
  total_enrollments: number;
  average_rating: number;
  revenue: number;
  currency?: string;
  trend?: number | null;
}

export interface AdminPaymentEntry {
  id: number | string;
  reference?: string;
  amount: number;
  currency?: string;
  status?: string;
  processed_at?: string | null;
  user?: {
    id?: number | string;
    name?: string;
    email?: string;
  } | null;
  course?: {
    id?: number | string;
    title?: string;
  } | null;
  method?: string | null;
}

export interface AdminFeatureSummary {
  message: string;
  status?: string;
  updated_at?: string | null;
  details?: Record<string, any> | null;
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

export interface AdminUserEntry {
  id?: number | string;
  user_id?: number | string;
  uuid?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role?: string;
  role_name?: string;
  status?: string;
  account_status?: string;
  is_email_verified?: boolean;
  email_verified?: boolean;
  created_at?: string;
  createdAt?: string;
  last_login?: string;
  lastLogin?: string;
  organization?: string;
  country?: string;
  courses_enrolled?: number;
  coursesEnrolled?: number;
  total_points?: number;
  totalPoints?: number;
  suspension_reason?: string | null;
  suspended_at?: string | null;
}

export interface AdminUserListResponse {
  users: AdminUserEntry[];
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

  static async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminUserListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await apiRequest(`/admin/users${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const payload = response?.data ?? response ?? {};
    let users: AdminUserEntry[] = [];
    let pagination: AdminUserListResponse['pagination'] = null;

    const candidates = [
      payload,
      (payload as any)?.data,
      (payload as any)?.data?.data,
      (payload as any)?.data?.users,
      (payload as any)?.results,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (Array.isArray(candidate)) {
        users = candidate as AdminUserEntry[];
        break;
      }

      if (typeof candidate === 'object') {
        if (Array.isArray((candidate as any).users)) {
          users = (candidate as any).users;
          pagination = (candidate as any).pagination ?? (candidate as any).meta ?? pagination;
          break;
        }
        if (Array.isArray((candidate as any).data)) {
          users = (candidate as any).data;
          pagination = (candidate as any).pagination ?? (candidate as any).meta ?? pagination;
          break;
        }
      }
    }

    if (!users.length && Array.isArray(response)) {
      users = response as AdminUserEntry[];
    }

    return {
      users,
      pagination,
    };
  }

  static async getTopCourses(params?: { limit?: number }): Promise<AdminTopCourseEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await apiRequest(`/admin/courses/top${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const list = extractArray(response?.data ?? response ?? {}, ['courses', 'data', 'results']);
    return list.map((item: any, index: number) => {
      const revenue = normalizeNumber(item?.revenue ?? item?.total_revenue ?? item?.amount);
      return {
        id: item?.id ?? item?.course_id ?? index,
        course_id: item?.course_id ?? item?.id ?? index,
        title: String(item?.title ?? item?.course_title ?? `Cours ${index + 1}`),
        category: item?.category ?? item?.primary_category ?? null,
        enrollments: normalizeNumber(item?.enrollments ?? item?.total_enrollments ?? item?.count),
        completions: normalizeNumber(item?.completions ?? item?.completed_enrollments),
        completion_rate: normalizeNumber(
          item?.completion_rate ?? item?.completionRatio ?? item?.completion_percentage ?? item?.completionRate,
        ),
        average_rating: Number.isFinite(Number(item?.average_rating ?? item?.rating))
          ? Number(item?.average_rating ?? item?.rating)
          : 0,
        revenue,
        currency: item?.currency ?? item?.currency_code ?? 'XOF',
        trend:
          typeof item?.trend === 'number'
            ? item.trend
            : normalizeNumber(item?.trend_percentage ?? item?.trend_rate ?? item?.delta),
      };
    });
  }

  static async getTopInstructors(params?: { limit?: number }): Promise<AdminTopInstructorEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await apiRequest(`/admin/instructors/top${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const list = extractArray(response?.data ?? response ?? {}, ['instructors', 'data', 'results']);
    return list.map((item: any, index: number) => {
      const firstName = item?.first_name ?? item?.firstName;
      const lastName = item?.last_name ?? item?.lastName;
      const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();
      const displayName = item?.name ?? (fallbackName || item?.email || `Formateur ${index + 1}`);
      return {
        id: item?.id ?? item?.instructor_id ?? index,
        instructor_id: item?.instructor_id ?? item?.id ?? index,
        name: displayName,
        email: item?.email ?? item?.contact_email ?? null,
        courses_count: normalizeNumber(item?.courses_count ?? item?.course_count ?? item?.courses),
        total_enrollments: normalizeNumber(item?.total_enrollments ?? item?.enrollments),
        average_rating: Number.isFinite(Number(item?.average_rating ?? item?.rating))
          ? Number(item?.average_rating ?? item?.rating)
          : 0,
        revenue: normalizeNumber(item?.revenue ?? item?.total_revenue ?? item?.amount),
        currency: item?.currency ?? item?.currency_code ?? 'XOF',
        trend:
          typeof item?.trend === 'number'
            ? item.trend
            : normalizeNumber(item?.trend_percentage ?? item?.trend_rate ?? item?.delta),
      };
    });
  }

  static async getRecentPayments(params?: { limit?: number }): Promise<AdminPaymentEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await apiRequest(`/admin/payments/recent${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const list = extractArray(response?.data ?? response ?? {}, ['payments', 'data', 'results']);
    return list.map((item: any, index: number) => ({
      id: item?.id ?? item?.payment_id ?? item?.reference ?? index,
      reference: item?.reference ?? item?.transaction_reference ?? item?.payment_reference,
      amount: normalizeNumber(item?.amount ?? item?.total ?? item?.value),
      currency: item?.currency ?? item?.currency_code ?? 'XOF',
      status: item?.status ?? item?.payment_status ?? 'pending',
      processed_at: item?.processed_at ?? item?.paid_at ?? item?.created_at ?? null,
      method: item?.method ?? item?.payment_method ?? null,
      user: item?.user
        ? {
            id: item?.user?.id ?? item?.user_id,
            name: (() => {
              const fallback =
                [item?.user?.first_name, item?.user?.last_name].filter(Boolean).join(' ').trim() || undefined;
              return item?.user?.name ?? fallback ?? item?.user?.email ?? undefined;
            })(),
            email: item?.user?.email ?? null,
          }
        : item?.student
        ? {
            id: item?.student?.id,
            name:
              item?.student?.name ??
              [item?.student?.first_name, item?.student?.last_name].filter(Boolean).join(' ').trim(),
            email: item?.student?.email,
          }
        : null,
      course:
        item?.course || item?.course_id || item?.course_title
          ? {
              id: item?.course?.id ?? item?.course_id ?? null,
              title: item?.course?.title ?? item?.course_title ?? null,
            }
          : null,
    }));
  }

  static async getSupportSummary(): Promise<AdminFeatureSummary> {
    const response = await apiRequest('/admin/support/tickets', {
      method: 'GET',
    });
    const data = response?.data ?? {};
    return {
      message: data?.message ?? response?.message ?? 'Support en développement',
      status: data?.status ?? data?.state ?? 'pending',
      updated_at: data?.updated_at ?? null,
      details: data?.details ?? null,
    };
  }

  static async getModerationSummary(): Promise<AdminFeatureSummary> {
    const response = await apiRequest('/admin/moderation/pending', {
      method: 'GET',
    });
    const data = response?.data ?? {};
    return {
      message: data?.message ?? response?.message ?? 'Modération en développement',
      status: data?.status ?? data?.state ?? 'pending',
      updated_at: data?.updated_at ?? null,
      details: data?.details ?? null,
    };
  }

  static async getAiUsageSummary(): Promise<AdminFeatureSummary> {
    const response = await apiRequest('/admin/ai/usage', {
      method: 'GET',
    });
    const data = response?.data ?? {};
    return {
      message: data?.message ?? response?.message ?? 'Statistiques IA en développement',
      status: data?.status ?? data?.state ?? 'pending',
      updated_at: data?.updated_at ?? null,
      details: data?.details ?? null,
    };
  }

  static async updateUserRole(
    userId: string | number,
    role: 'student' | 'instructor'
  ): Promise<AdminUserEntry> {
    const response = await apiRequest(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });

    return (response?.data as AdminUserEntry) ?? (response as any);
  }

  static async suspendUser(
    userId: string | number,
    reason?: string
  ): Promise<AdminUserEntry> {
    // La route /suspend fait un toggle: suspend si actif, réactive si suspendu
    const payload = reason ? { reason } : undefined;
    const response = await apiRequest(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    });

    return (response?.data as AdminUserEntry) ?? (response as any);
  }

  static async reactivateUser(userId: string | number): Promise<AdminUserEntry> {
    // La route /suspend fait un toggle, donc on l'utilise aussi pour réactiver
    const response = await apiRequest(`/admin/users/${userId}/suspend`, {
      method: 'POST',
    });

    return (response?.data as AdminUserEntry) ?? (response as any);
  }

  static async deleteUser(userId: string | number): Promise<void> {
    await apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  static async inviteUsers(payload: {
    emails: string[];
    role?: 'student' | 'instructor' | 'admin';
    sendEmail?: boolean;
  }): Promise<{ invited: string[] }> {
    const body = {
      emails: payload.emails,
      role: payload.role ?? 'student',
      send_email: payload.sendEmail ?? true,
    };

    const response = await apiRequest('/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (response?.data) {
      return {
        invited: Array.isArray(response.data?.invited)
          ? response.data.invited
          : payload.emails,
      };
    }

    return {
      invited: payload.emails,
    };
  }
}

// Export par défaut
export default AdminService;

// Export nommé pour compatibilité
export const adminService = AdminService;

