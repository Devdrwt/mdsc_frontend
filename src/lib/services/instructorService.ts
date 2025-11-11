import { apiRequest } from './api';
import { resolveMediaUrl } from '../utils/media';

export interface InstructorDashboardStats {
  courses?: {
    total?: number;
    published?: number;
    pending?: number;
    draft?: number;
  };
  students?: {
    total?: number;
    active?: number;
    new_last_30_days?: number;
    avg_completion_rate?: number;
    completion_rate?: number;
  };
  revenue?: Array<{
    currency?: string;
    amount?: number;
  }>;
  rating?: {
    average?: number;
  };
  average_rating?: number;
  views?: {
    total?: number;
  };
}

export interface InstructorTopCourse {
  course_id?: number | string;
  title?: string;
  status?: string;
  published_at?: string | null;
  enrollments?: number;
  views?: number;
  completion_rate?: number;
  rating?: number;
  revenue?: Array<{
    currency?: string;
    amount?: number;
  }>;
}

export interface InstructorRecentEnrollment {
  enrollment_id?: number | string;
  course_id?: number | string;
  course_title?: string;
  student_id?: number | string;
  student_name?: string;
  enrolled_at?: string;
}

export interface InstructorRecentPayment {
  payment_id?: number | string;
  course_id?: number | string;
  course_title?: string;
  student_id?: number | string;
  student_name?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paid_at?: string;
}

export interface InstructorDashboardResponse {
  stats?: InstructorDashboardStats;
  top_courses?: InstructorTopCourse[];
  recent_enrollments?: InstructorRecentEnrollment[];
  recent_payments?: InstructorRecentPayment[];
}

export interface InstructorCourseEntry {
  id: number | string;
  title?: string;
  status?: string;
  published_at?: string | null;
  last_update?: string | null;
  enrollments?: number;
  views?: number;
  average_progress?: number;
  average_rating?: number;
  revenue?: Array<{
    currency?: string;
    amount?: number;
  }>;
}

export interface InstructorCoursesResponse {
  courses: InstructorCourseEntry[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface InstructorEnrollmentsTrendPoint {
  date?: string;
  enrollments?: number;
  revenue?: number;
}

export interface InstructorRecentActivityEntry {
  id: number | string;
  type: string;
  description?: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface InstructorNotificationEntry {
  id: number | string;
  title?: string;
  message?: string;
  type?: string;
  metadata?: Record<string, any> | null;
  is_read?: boolean;
  created_at?: string;
  trigger_at?: string | null;
}

export interface InstructorNotificationListResponse {
  notifications: InstructorNotificationEntry[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  } | null;
}

export interface InstructorAnalyticsResponse {
  enrollment_trend?: InstructorEnrollmentsTrendPoint[];
  revenue_trend?: InstructorEnrollmentsTrendPoint[];
  top_courses?: InstructorTopCourse[];
}

export type InstructorStudentStatus = 'active' | 'completed' | 'inactive';

export interface InstructorStudentEntry {
  enrollment_id?: number | string;
  enrolled_at?: string;
  progress_percentage?: number;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  is_active?: boolean;
  student?: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
    last_login_at?: string | null;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
  };
  course?: {
    id?: number | string;
    title?: string;
    slug?: string;
    language?: string;
    status?: string;
  };
}

export interface InstructorStudentsResponse {
  students: InstructorStudentEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    total_students?: number;
    active_students?: number;
    completed_students?: number;
    avg_progress?: number;
  };
  filters?: {
    courses?: Array<{ id: number | string; title: string }>;
  };
}

export interface InstructorPreferences {
  language?: 'fr' | 'en';
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    course_updates?: boolean;
    student_activity?: boolean;
    platform_news?: boolean;
    weekly_digest?: boolean;
  };
  security?: {
    two_factor_auth?: boolean;
    login_alerts?: boolean;
    device_trust?: boolean;
  };
  policies?: {
    accepted?: boolean;
    accepted_at?: string;
    version?: string;
  };
}

export interface InstructorPreferencesResponse {
  preferences?: InstructorPreferences;
}

export class InstructorService {
  static async getDashboard(): Promise<InstructorDashboardResponse> {
    const response = await apiRequest('/instructor/dashboard', {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      return response.data as InstructorDashboardResponse;
    }

    return {};
  }

  static async getCourses(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InstructorCoursesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/instructor/courses?${searchParams.toString()}`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      const data = response.data as any;
      const courses = Array.isArray(data.courses) ? data.courses : [];
      return {
        courses: courses.map((course: any) => ({
          ...course,
          thumbnail_url: resolveMediaUrl(course.thumbnail_url || course.thumbnail),
        })),
        pagination: data.pagination,
      };
    }

    return { courses: [] };
  }

  static async getCoursePerformance(courseId: string | number): Promise<any> {
    const response = await apiRequest(`/instructor/courses/${courseId}/performance`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      const data = response.data || {};
      if (data.course) {
        data.course.thumbnail_url = resolveMediaUrl(data.course.thumbnail_url || data.course.thumbnail);
      }
      if (Array.isArray(data.trend)) {
        data.trend = data.trend;
      }
      return data;
    }

    return null;
  }

  static async getEnrollmentsTrend(range: '7d' | '30d' | '90d' | '180d' | '365d' = '30d'): Promise<InstructorEnrollmentsTrendPoint[]> {
    const response = await apiRequest(`/instructor/enrollments/trend?range=${range}`, {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data?.trend)) {
      return response.data.trend as InstructorEnrollmentsTrendPoint[];
    }

    return [];
  }

  static async getRecentActivity(limit = 20): Promise<InstructorRecentActivityEntry[]> {
    const response = await apiRequest(`/instructor/recent-activity?limit=${limit}`, {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data)) {
      return response.data as InstructorRecentActivityEntry[];
    }

    return [];
  }

  static async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    is_read?: boolean;
  }): Promise<InstructorNotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.type) searchParams.append('type', params.type);
    if (typeof params?.is_read === 'boolean') searchParams.append('is_read', String(params.is_read));

    const query = searchParams.toString();
    const response = await apiRequest(`/instructor/notifications${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const data = response?.data;
    if (Array.isArray(data)) {
      return { notifications: data as InstructorNotificationEntry[], pagination: null };
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).notifications)) {
        return {
          notifications: (data as any).notifications as InstructorNotificationEntry[],
          pagination: (data as any).pagination ?? null,
        };
      }
      if (Array.isArray((data as any).data)) {
        return {
          notifications: (data as any).data as InstructorNotificationEntry[],
          pagination: (data as any).pagination ?? null,
        };
      }
    }

    return { notifications: [], pagination: null };
  }

  static async getUnreadMessagesCount(): Promise<number> {
    const response = await apiRequest('/instructor/messages/unread-count', {
      method: 'GET',
    });

    if (response.success !== false && typeof response.data?.count === 'number') {
      return response.data.count;
    }

    return 0;
  }

  static async getAnalytics(range: '30d' | '90d' | '180d' | '365d' = '30d'): Promise<InstructorAnalyticsResponse> {
    const response = await apiRequest(`/instructor/analytics?range=${range}`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      return response.data as InstructorAnalyticsResponse;
    }

    return {};
  }

  static async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    course_id?: string | number;
    status?: InstructorStudentStatus;
    sort?: 'enrolled_at' | 'progress' | 'last_activity' | 'last_login';
    order?: 'asc' | 'desc';
  }): Promise<InstructorStudentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.course_id) searchParams.append('course_id', String(params.course_id));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.order) searchParams.append('order', params.order);

    const query = searchParams.toString();
    const response = await apiRequest(`/instructor/students${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      const data = response.data;
      return {
        students: Array.isArray(data?.students) ? (data.students as InstructorStudentEntry[]) : [],
        pagination: {
          page: Number(data?.pagination?.page) || 1,
          limit: Number(data?.pagination?.limit) || (params?.limit ?? 10),
          total: Number(data?.pagination?.total) || 0,
          pages: Number(data?.pagination?.pages) || 1,
        },
        stats: data?.stats ?? {},
        filters: data?.filters ?? {},
      };
    }

    return {
      students: [],
      pagination: { page: 1, limit: params?.limit ?? 10, total: 0, pages: 1 },
      stats: {},
      filters: {},
    };
  }

  /**
   * L'API retourne actuellement un objet { sections: [...] }.
   * Nous le convertissons en préférences minimales exploitables côté front.
   */
  static async getPreferences(): Promise<InstructorPreferences & { sections?: Array<Record<string, any>> }> {
    const response = await apiRequest('/instructor/settings', {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      const sections = (response.data as any).sections ?? [];
      return { sections };
    }

    return { sections: [] };
  }

  static async updatePreferences(payload: InstructorPreferences): Promise<InstructorPreferences> {
    const response = await apiRequest('/instructor/settings', {
      method: 'PUT',
      body: JSON.stringify({ preferences: payload }),
    });

    if (response.success !== false && response.data) {
      return (response.data as InstructorPreferencesResponse).preferences ?? payload;
    }

    return payload;
  }

  static async requestDataExport(): Promise<void> {
    await apiRequest('/instructor/settings/export-request', {
      method: 'POST',
    });
  }

  static async requestAccountDeletion(payload?: { reason?: string; confirm?: boolean }): Promise<void> {
    await apiRequest('/instructor/settings/delete-request', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  }

  static async acknowledgePolicies(version?: string): Promise<InstructorPreferences> {
    const response = await apiRequest('/instructor/settings/policies', {
      method: 'POST',
      body: JSON.stringify({ version }),
    });

    if (response.success !== false && response.data) {
      return (response.data as InstructorPreferencesResponse).preferences ?? (response.data as InstructorPreferences);
    }

    return { policies: { accepted: true, accepted_at: new Date().toISOString(), version } };
  }
}

export default InstructorService;
