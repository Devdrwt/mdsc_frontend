import { apiRequest } from './api';
import { Enrollment } from '../../types/course';

export class EnrollmentService {
  /**
   * S'inscrire à un cours (vérifie automatiquement les prérequis)
   */
  static async enrollInCourse(courseId: number, options?: { paymentId?: string }): Promise<Enrollment> {
    try {
      const payload: Record<string, any> = {
        course_id: courseId
      };

      if (options?.paymentId) {
        payload.payment_id = options.paymentId;
      }

      const response = await apiRequest('/enrollments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response.data;
    } catch (error: any) {
      // Si erreur 400 avec prerequisite_course_id, re-lancer avec plus d'infos
      if (error.response?.status === 400 && error.response?.data?.prerequisite_course_id) {
        const enhancedError = {
          ...error,
          prerequisite_course_id: error.response.data.prerequisite_course_id,
          prerequisite_title: error.response.data.prerequisite_title,
          message: error.response.data.message || 'Prérequis non complété',
        };
        throw enhancedError;
      }
      throw error;
    }
  }

  /**
   * Vérifier si l'utilisateur est inscrit à un cours
   */
  static async checkEnrollment(courseId: number): Promise<{
    is_enrolled: boolean;
    enrollment?: Enrollment;
  }> {
    const response = await apiRequest(`/courses/${courseId}/check-enrollment`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Se désinscrire d'un cours
   */
  static async unenrollFromCourse(courseId: number): Promise<void> {
    await apiRequest(`/enrollments/${courseId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Récupérer toutes les inscriptions de l'utilisateur
   */
  static async getUserEnrollments(): Promise<Enrollment[]> {
    const response = await apiRequest('/enrollments', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer une inscription spécifique
   */
  static async getEnrollment(enrollmentId: number): Promise<Enrollment> {
    const response = await apiRequest(`/enrollments/${enrollmentId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Liste des inscriptions d'un cours (pagination serveur)
   */
  static async getCourseEnrollments(
    courseId: number | string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sort?: 'enrolled_at' | 'progress' | 'last_accessed_at' | 'completed_at' | 'first_name' | 'last_name';
      order?: 'ASC' | 'DESC';
    }
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.order) query.append('order', params.order);
    const qs = query.toString();
    const response = await apiRequest(`/courses/${courseId}/enrollments${qs ? `?${qs}` : ''}`, { method: 'GET' });
    return { data: response.data?.data || response.data || [], pagination: response.data?.pagination || { page: params?.page || 1, limit: params?.limit || 10, total: 0, pages: 1 } };
  }
}

export const enrollmentService = EnrollmentService;
