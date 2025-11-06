import { apiRequest } from './api';

export interface Certificate {
  id: string;
  course_id: string;
  course_title?: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  issued_at?: string;
  certificate_code?: string;
  rejection_reason?: string;
  created_at: string;
}

export class CertificateService {
  // Demander un certificat pour un cours (via enrollmentId)
  static async requestCertificate(enrollmentId: number): Promise<Certificate> {
    const response = await apiRequest(`/enrollments/${enrollmentId}/certificate/request`, {
      method: 'POST',
    });
    return response.data;
  }

  // Demander un certificat via courseId (fallback)
  static async requestCertificateByCourseId(courseId: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/request`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
    return response.data;
  }

  // Récupérer mes certificats
  static async getMyCertificates(): Promise<Certificate[]> {
    const response = await apiRequest('/certificates/my-certificates', {
      method: 'GET',
    });
    return response.data || [];
  }

  // Alias pour compatibilité
  static async getUserCertificates(): Promise<Certificate[]> {
    return this.getMyCertificates();
  }

  // Récupérer le certificat d'un cours spécifique (via enrollmentId)
  static async getCourseCertificate(enrollmentId: number): Promise<Certificate | null> {
    try {
      const response = await apiRequest(`/enrollments/${enrollmentId}/certificate/request`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      // Si l'endpoint n'existe pas, essayer l'ancien endpoint
      try {
        const response = await apiRequest(`/certificates/course/${enrollmentId}`, {
          method: 'GET',
        });
        return response.data;
      } catch {
        return null;
      }
    }
  }

  // Récupérer le certificat d'un cours via courseId (fallback)
  static async getCourseCertificateByCourseId(courseId: string): Promise<Certificate | null> {
    try {
      const response = await apiRequest(`/certificates/course/${courseId}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Télécharger un certificat
  static async downloadCertificate(certificateId: string): Promise<string> {
    const response = await apiRequest(`/certificates/${certificateId}/download`, {
      method: 'GET',
    });
    return response.data.download_url || response.data.url;
  }

  // Vérifier un certificat par code
  static async verifyCertificate(code: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/verify/${code}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats en attente (admin)
  static async getPendingCertificates(): Promise<Certificate[]> {
    const response = await apiRequest('/admin/certificates/requests', {
      method: 'GET',
    });
    return response.data || [];
  }

  // Approuver un certificat (admin)
  static async approveCertificate(requestId: string, comments?: string): Promise<void> {
    await apiRequest(`/admin/certificates/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  // Rejeter un certificat (admin)
  static async rejectCertificate(
    requestId: string,
    rejectionReason: string,
    comments?: string
  ): Promise<void> {
    await apiRequest(`/admin/certificates/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason, comments }),
    });
  }
}

// Export par défaut
export default CertificateService;

// Export nommé pour compatibilité
export const certificateService = CertificateService;
