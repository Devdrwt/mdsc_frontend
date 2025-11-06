import { apiRequest } from './api';

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
}

// Export par défaut
export default AdminService;

// Export nommé pour compatibilité
export const adminService = AdminService;

