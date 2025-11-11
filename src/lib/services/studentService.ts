import { apiRequest } from './api';
import { resolveMediaUrl } from '../utils/media';

export interface StudentCourseEntry {
  enrollment_id: number | string;
  course_id: number | string;
  course_title: string;
  course_slug?: string;
  progress_percentage?: number;
  last_accessed_at?: string;
  instructor?: {
    id?: number | string;
    name?: string;
    avatar_url?: string | null;
  };
  certificate?: {
    id?: number | string;
    code?: string;
    issued_at?: string;
    pdf_url?: string | null;
  } | null;
  next_lesson?: {
    id?: number | string;
    title?: string;
    module?: string;
  } | null;
}

export interface StudentCoursesResponse {
  courses: StudentCourseEntry[];
}

export interface StudentProgressLesson {
  id: number | string;
  title: string;
  module_title?: string;
  order_index?: number;
  duration_minutes?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string | null;
  content_type?: string;
}

export interface StudentProgressQuiz {
  id: number | string;
  title: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  best_score?: number;
  attempts?: number;
  last_attempt_at?: string | null;
}

export interface StudentProgressResponse {
  course?: {
    id?: number | string;
    title?: string;
    description?: string;
    thumbnail_url?: string | null;
  };
  stats?: {
    progress_percentage?: number;
    total_lessons?: number;
    completed_lessons?: number;
    total_quizzes?: number;
    completed_quizzes?: number;
    time_spent_minutes?: number;
  };
  lessons?: StudentProgressLesson[];
  quizzes?: StudentProgressQuiz[];
}

export interface StudentStatsResponse {
  courses?: {
    active?: number;
    completed?: number;
  };
  gamification?: {
    points?: number;
    level?: string;
    streak_days?: number;
    weekly_goal?: number;
    weekly_progress?: number;
  };
  badges?: number;
  certificates?: number;
}

export interface StudentActivityEntry {
  id: number | string;
  type: string;
  description?: string;
  metadata?: Record<string, any> | null;
  points?: number;
  created_at: string;
}

export interface StudentBadgeEntry {
  id: number | string;
  name: string;
  description?: string;
  icon_url?: string | null;
  earned_at?: string;
  category?: string;
  criteria?: Record<string, any>;
}

export interface StudentCertificateEntry {
  id: number | string;
  course_id?: number | string;
  course_title?: string;
  issued_at?: string;
  pdf_url?: string | null;
  certificate_code?: string;
}

export interface StudentPreferences {
  language?: 'fr' | 'en';
  theme?: 'light' | 'dark' | 'system';
  policies?: {
    accepted?: boolean;
    accepted_at?: string;
    version?: string;
  };
}

type StudentPreferencesResponse = {
  preferences?: StudentPreferences;
};

export class StudentService {
  static async getCourses(): Promise<StudentCourseEntry[]> {
    const response = await apiRequest('/student/courses', {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data?.courses)) {
      return (response.data.courses as StudentCourseEntry[]).map((course) => ({
        ...course,
        instructor: course.instructor ? {
          ...course.instructor,
          avatar_url: resolveMediaUrl(course.instructor.avatar_url),
        } : course.instructor,
        certificate: course.certificate ? {
          ...course.certificate,
          pdf_url: resolveMediaUrl(course.certificate.pdf_url),
        } : course.certificate,
      }));
    }

    return [];
  }

  static async getCourseProgress(courseId: string | number): Promise<StudentProgressResponse | null> {
    const response = await apiRequest(`/student/progress/${courseId}`, {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      return response.data as StudentProgressResponse;
    }

    return null;
  }

  static async getStats(): Promise<StudentStatsResponse> {
    const response = await apiRequest('/student/stats', {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      return response.data as StudentStatsResponse;
    }

    return {};
  }

  static async getPreferences(): Promise<StudentPreferences & { sections?: Array<Record<string, any>> }> {
    const response = await apiRequest('/student/settings', {
      method: 'GET',
    });

    if (response.success !== false && response.data) {
      const data = response.data as any;
      const sections = Array.isArray(data?.sections) ? data.sections : [];
      const preferences = (data?.preferences && typeof data.preferences === 'object')
        ? (data.preferences as StudentPreferences)
        : (Object.keys(data || {}).some((key) => key !== 'sections') ? (data as StudentPreferences) : {});
      return {
        ...preferences,
        sections,
      };
    }

    return { sections: [] };
  }

  static async updatePreferences(payload: StudentPreferences): Promise<StudentPreferences> {
    const response = await apiRequest('/student/settings', {
      method: 'PUT',
      body: JSON.stringify({ preferences: payload }),
    });

    if (response.success !== false && response.data) {
      const data = response.data as any;
      if (data?.preferences && typeof data.preferences === 'object') {
        return data.preferences as StudentPreferences;
      }
      return (data as StudentPreferences) ?? payload;
    }

    return payload;
  }

  static async acknowledgePolicies(version?: string): Promise<StudentPreferences> {
    const response = await apiRequest('/student/settings/policies', {
      method: 'POST',
      body: JSON.stringify({ version }),
    });

    if (response.success !== false && response.data) {
      return (response.data as StudentPreferencesResponse).preferences ?? (response.data as StudentPreferences);
    }

    return { policies: { accepted: true, accepted_at: new Date().toISOString(), version } };
  }

  static async getActivities(params?: { limit?: number; page?: number; type?: string }): Promise<StudentActivityEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.type) searchParams.append('type', params.type);

    const query = searchParams.toString();
    const response = await apiRequest(`/student/activities${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const data = response?.data;
    if (Array.isArray(data)) {
      return data as StudentActivityEntry[];
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).activities)) {
        return (data as any).activities as StudentActivityEntry[];
      }
      if (Array.isArray((data as any).data)) {
        return (data as any).data as StudentActivityEntry[];
      }
    }

    return [];
  }

  static async getRecentActivity(limit = 20): Promise<StudentActivityEntry[]> {
    return StudentService.getActivities({ limit });
  }

  static async getBadges(): Promise<StudentBadgeEntry[]> {
    const response = await apiRequest('/student/badges', {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data)) {
      return response.data as StudentBadgeEntry[];
    }

    return [];
  }

  static async getCertificates(): Promise<StudentCertificateEntry[]> {
    const response = await apiRequest('/student/certificates', {
      method: 'GET',
    });

    if (response.success !== false && Array.isArray(response.data)) {
      return response.data as StudentCertificateEntry[];
    }

    return [];
  }
}

export default StudentService;
