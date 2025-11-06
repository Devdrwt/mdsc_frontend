import { apiRequest } from './api';
import { Certificate } from '../../types/course';

// Alias pour compatibilité avec l'ancien code
export type { Certificate };

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

  // Vérifier un certificat par code (endpoint public, pas d'auth)
  static async verifyCertificate(code: string): Promise<{ valid: boolean; certificate?: Certificate; message?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api'}/certificates/verify/${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          message: errorData.message || 'Certificat invalide ou expiré',
        };
      }
      
      const data = await response.json();
      // Si l'API retourne directement un certificat, on le wrap
      if (data.certificate || data.id) {
        const cert = data.certificate || data;
        // Convertir vers le format Certificate de types/course.ts
        const certificate: Certificate = {
          id: cert.id || Number(cert.id) || 0,
          user_id: cert.user_id || cert.userId || 0,
          course_id: cert.course_id || cert.courseId || 0,
          certificate_code: cert.certificate_code || cert.certificateCode || code,
          certificate_number: cert.certificate_number || cert.certificateNumber || String(cert.id || ''),
          pdf_url: cert.pdf_url || cert.pdfUrl,
          qr_code_url: cert.qr_code_url || cert.qrCodeUrl,
          issued_at: cert.issued_at || cert.issuedAt || new Date().toISOString(),
          expires_at: cert.expires_at || cert.expiresAt,
          verified: cert.verified !== false,
          is_valid: data.valid !== false && (cert.is_valid !== false),
          course_title: cert.course_title || cert.courseTitle,
          first_name: cert.first_name || cert.firstName,
          last_name: cert.last_name || cert.lastName,
          email: cert.email || cert.student_email || cert.studentEmail,
        };
        return {
          valid: certificate.is_valid,
          certificate,
          message: data.message,
        };
      }
      
      return data;
    } catch (error: any) {
      return {
        valid: false,
        message: error.message || 'Erreur lors de la vérification',
      };
    }
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
