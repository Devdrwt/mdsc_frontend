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
    const rows = response.data || [];
    // Normaliser les champs en camelCase pour correspondre aux composants
    return Array.isArray(rows)
      ? rows.map((cert: any) => ({
          id: Number(cert.id),
          user_id: Number(cert.user_id || cert.userId),
          course_id: Number(cert.course_id || cert.courseId),
          certificate_code: cert.certificate_code || cert.certificateCode,
          certificate_number: cert.certificate_number || cert.certificateNumber,
          pdf_url: cert.pdf_url || cert.pdfUrl,
          qr_code_url: cert.qr_code_url || cert.qrCodeUrl,
          issued_at: cert.issued_at || cert.issuedAt,
          expires_at: cert.expires_at || cert.expiresAt,
          verified: Boolean(cert.verified),
          is_valid: cert.is_valid === undefined ? true : Boolean(cert.is_valid),
          status: cert.status,
          course_title: cert.course_title || cert.courseTitle,
          first_name: cert.first_name || cert.firstName,
          last_name: cert.last_name || cert.lastName,
          email: cert.email,
          // Compatibilité camelCase attendue par CertificateCard
          userId: Number(cert.user_id || cert.userId),
          courseId: Number(cert.course_id || cert.courseId),
          certificateCode: cert.certificate_code || cert.certificateCode,
          pdfUrl: cert.pdf_url || cert.pdfUrl,
          qrCodeUrl: cert.qr_code_url || cert.qrCodeUrl,
          issuedAt: cert.issued_at || cert.issuedAt,
          expiresAt: cert.expires_at || cert.expiresAt,
          course: cert.course_title
            ? { 
                id: Number(cert.course_id), 
                title: cert.course_title, 
                slug: '', 
                description: '', 
                category_id: 0,
                level: 'debutant' as const,
                difficulty: 'beginner' as const,
                duration_minutes: 0, 
                language: '', 
                price: 0, 
                instructor_id: 0, 
                is_published: true,
                is_featured: false,
                enrollment_count: 0, 
                rating: 0, 
                created_at: '', 
                updated_at: '' 
              }
            : undefined,
        }))
      : [];
  }

  // Générer un certificat pour un cours (évaluation réussie)
  static async generateForCourse(courseId: string | number): Promise<{ certificateId: number }> {
    const response = await apiRequest(`/certificates/generate/${courseId}`, {
      method: 'POST',
    });
    return response.data || {};
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
    // Utiliser la fonction utilitaire qui inclut les bons en-têtes (Bearer) depuis le store
    const { apiDownload } = await import('./api');
    const blob = await apiDownload(`/certificates/${certificateId}/download`);
    return window.URL.createObjectURL(blob);
  }

  // Récupérer un certificat par ID (auth requis)
  static async getById(certificateId: string | number): Promise<Certificate | null> {
    const response = await apiRequest(`/certificates/${certificateId}`, {
      method: 'GET',
    });
    const raw = response?.data;
    if (!raw) return null;
    const cert: Certificate = {
      id: Number(raw.id),
      user_id: Number(raw.user_id || raw.userId),
      course_id: Number(raw.course_id || raw.courseId),
      certificate_code: raw.certificate_code || raw.certificateCode,
      certificate_number: raw.certificate_number || raw.certificateNumber,
      pdf_url: raw.pdf_url || raw.pdfUrl,
      qr_code_url: raw.qr_code_url || raw.qrCodeUrl,
      issued_at: raw.issued_at || raw.issuedAt,
      expires_at: raw.expires_at || raw.expiresAt,
      verified: Boolean(raw.verified),
      is_valid: raw.is_valid === undefined ? true : Boolean(raw.is_valid),
      course_title: raw.course_title || raw.courseTitle,
      first_name: raw.first_name || raw.firstName,
      last_name: raw.last_name || raw.lastName,
      email: raw.email,
      // Compat camelCase
      userId: Number(raw.user_id || raw.userId),
      courseId: Number(raw.course_id || raw.courseId),
      certificateCode: raw.certificate_code || raw.certificateCode,
      pdfUrl: raw.pdf_url || raw.pdfUrl,
      qrCodeUrl: raw.qr_code_url || raw.qrCodeUrl,
      issuedAt: raw.issued_at || raw.issuedAt,
      expiresAt: raw.expires_at || raw.expiresAt,
      course: raw.course_title
        ? { 
            id: Number(raw.course_id), 
            title: raw.course_title, 
            slug: '', 
            description: '', 
            category_id: 0,
            level: 'debutant' as const,
            difficulty: 'beginner' as const,
            duration_minutes: 0, 
            language: '', 
            price: 0, 
            instructor_id: 0, 
            is_published: true,
            is_featured: false,
            enrollment_count: 0, 
            rating: 0, 
            created_at: '', 
            updated_at: '' 
          }
        : undefined,
    } as any;
    return cert;
  }

  // Vérifier un certificat par code (endpoint public, pas d'auth)
  static async verifyCertificate(code: string): Promise<{ valid: boolean; certificate?: Certificate; message?: string; notFound?: boolean }> {
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
          message: response.status === 404 ? 'Certificat non trouvé' : (errorData.message || 'Certificat invalide ou expiré'),
          notFound: response.status === 404,
        };
      }
      
      const data = await response.json();
      // L'API renvoie { success, data: certificate } → normaliser
      const rawCert = data?.data || data?.certificate || (data?.id ? data : null);
      if (rawCert) {
        // Convertir vers le format Certificate de types/course.ts
        const certificate: Certificate = {
          id: rawCert.id || Number(rawCert.id) || 0,
          user_id: rawCert.user_id || rawCert.userId || 0,
          course_id: rawCert.course_id || rawCert.courseId || 0,
          certificate_code: rawCert.certificate_code || rawCert.certificateCode || code,
          certificate_number: rawCert.certificate_number || rawCert.certificateNumber || String(rawCert.id || ''),
          pdf_url: rawCert.pdf_url || rawCert.pdfUrl,
          qr_code_url: rawCert.qr_code_url || rawCert.qrCodeUrl,
          issued_at: rawCert.issued_at || rawCert.issuedAt || new Date().toISOString(),
          expires_at: rawCert.expires_at || rawCert.expiresAt,
          verified: rawCert.verified === true || rawCert.is_verified === true,
          is_valid: rawCert.is_valid !== false && !(rawCert.expires_at && new Date(rawCert.expires_at) <= new Date()) && !rawCert.revoked_at,
          course_title: rawCert.course_title || rawCert.courseTitle,
          first_name: rawCert.first_name || rawCert.firstName,
          last_name: rawCert.last_name || rawCert.lastName,
          email: rawCert.email || rawCert.student_email || rawCert.studentEmail,
        };
        return {
          valid: certificate.is_valid,
          certificate,
          message: data.message,
        };
      }
      
      // Fallback: si pas de donnée exploitable
      return { valid: false, message: data?.message || 'Certificat invalide ou expiré' };
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
