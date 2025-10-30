import { apiRequest } from './api';
import { Certificate } from '../../types/course';

export class CertificateService {
  /**
   * Récupérer les certificats de l'utilisateur connecté
   */
  static async getUserCertificates(): Promise<Certificate[]> {
    const response = await apiRequest('/certificates', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Générer un certificat pour un cours complété
   */
  static async generateCertificate(courseId: string): Promise<Certificate> {
    const response = await apiRequest('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
    return response.data;
  }

  /**
   * Vérifier un certificat via code QR (PUBLIQUE - pas besoin d'auth)
   */
  static async verifyCertificate(code: string): Promise<{
    valid: boolean;
    certificate?: Certificate;
    message?: string;
  }> {
    // Route publique, donc pas d'auth header
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/certificates/verify/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        message: 'Certificat invalide ou non trouvé',
      };
    }

    const data = await response.json();
    return data;
  }

  /**
   * Télécharger le PDF d'un certificat
   */
  static async downloadCertificate(certificateId: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/certificates/${certificateId}/download`,
      {
      method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    return response.blob();
  }

  /**
   * Obtenir l'URL de vérification publique (pour QR code)
   */
  static getVerificationUrl(code: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-certificate/${code}`;
  }
}

export const certificateService = CertificateService;