import { apiRequest } from './api';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
  instructorName: string;
  completedAt: string;
  issuedAt: string;
  expiresAt?: string;
  certificateNumber: string;
  verificationCode: string;
  status: 'issued' | 'expired' | 'revoked';
  pdfUrl: string;
  metadata: CertificateMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateMetadata {
  score: number;
  completionTime: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  totalTime: number;
  averageScore: number;
  achievements: string[];
  badges: string[];
  skills: string[];
  competencies: string[];
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateVerification {
  id: string;
  certificateId: string;
  verificationCode: string;
  verifiedAt: string;
  verifiedBy: string;
  isValid: boolean;
  metadata: any;
}

export interface CertificateStats {
  totalCertificates: number;
  issuedCertificates: number;
  expiredCertificates: number;
  revokedCertificates: number;
  certificatesByCourse: Array<{
    courseId: string;
    courseTitle: string;
    count: number;
  }>;
  certificatesByMonth: Array<{
    month: string;
    count: number;
  }>;
  averageCompletionTime: number;
  averageScore: number;
}

export interface CreateCertificateData {
  userId: string;
  courseId: string;
  metadata: CertificateMetadata;
}

export interface UpdateCertificateData {
  status?: string;
  expiresAt?: string;
  metadata?: CertificateMetadata;
}

export interface CreateCertificateTemplateData {
  name: string;
  description: string;
  template: string;
}

export interface UpdateCertificateTemplateData {
  name?: string;
  description?: string;
  template?: string;
  isActive?: boolean;
}

export interface CertificateFilter {
  userId?: string;
  courseId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CertificateExport {
  format: 'csv' | 'xlsx' | 'pdf';
  data: Certificate[];
  filename: string;
  generatedAt: string;
}

// Service principal
export class CertificateService {
  // Récupérer tous les certificats de l'utilisateur
  static async getMyCertificates(): Promise<Certificate[]> {
    const response = await apiRequest('/certificates/my', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les certificats
  static async getAllCertificates(filter?: CertificateFilter): Promise<Certificate[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.courseId) params.append('courseId', filter.courseId);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);

    const response = await apiRequest(`/certificates?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un certificat par ID
  static async getCertificate(certificateId: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/${certificateId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un certificat par code de vérification
  static async getCertificateByVerificationCode(verificationCode: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/verify/${verificationCode}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer un nouveau certificat
  static async createCertificate(data: CreateCertificateData): Promise<Certificate> {
    const response = await apiRequest('/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un certificat
  static async updateCertificate(certificateId: string, data: UpdateCertificateData): Promise<Certificate> {
    const response = await apiRequest(`/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Révoquer un certificat
  static async revokeCertificate(certificateId: string, reason: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/${certificateId}/revoke`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    return response.data;
  }

  // Renouveler un certificat
  static async renewCertificate(certificateId: string, newExpiryDate: string): Promise<Certificate> {
    const response = await apiRequest(`/certificates/${certificateId}/renew`, {
      method: 'PATCH',
      body: JSON.stringify({ newExpiryDate }),
    });
    return response.data;
  }

  // Télécharger un certificat PDF
  static async downloadCertificate(certificateId: string): Promise<Blob> {
    const response = await apiRequest(`/certificates/${certificateId}/download`, {
      method: 'GET',
    });
    return new Blob([response.data], { type: 'application/pdf' });
  }

  // Télécharger plusieurs certificats PDF
  static async downloadCertificates(certificateIds: string[]): Promise<Blob> {
    const response = await apiRequest('/certificates/download-multiple', {
      method: 'POST',
      body: JSON.stringify({ certificateIds }),
    });
    return new Blob([response.data], { type: 'application/pdf' });
  }

  // Vérifier un certificat
  static async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
    const response = await apiRequest(`/certificates/verify/${verificationCode}`, {
      method: 'POST',
    });
    return response.data;
  }

  // Récupérer les certificats par cours
  static async getCertificatesByCourse(courseId: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par utilisateur
  static async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/user/${userId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par instructeur
  static async getCertificatesByInstructor(instructorId: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/instructor/${instructorId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par statut
  static async getCertificatesByStatus(status: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/status/${status}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par période
  static async getCertificatesByPeriod(startDate: string, endDate: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/period?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les statistiques des certificats
  static async getCertificateStats(): Promise<CertificateStats> {
    const response = await apiRequest('/certificates/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les modèles de certificats
  static async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const response = await apiRequest('/certificates/templates', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un modèle de certificat
  static async getCertificateTemplate(templateId: string): Promise<CertificateTemplate> {
    const response = await apiRequest(`/certificates/templates/${templateId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer un nouveau modèle de certificat
  static async createCertificateTemplate(data: CreateCertificateTemplateData): Promise<CertificateTemplate> {
    const response = await apiRequest('/certificates/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un modèle de certificat
  static async updateCertificateTemplate(templateId: string, data: UpdateCertificateTemplateData): Promise<CertificateTemplate> {
    const response = await apiRequest(`/certificates/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer un modèle de certificat
  static async deleteCertificateTemplate(templateId: string): Promise<void> {
    await apiRequest(`/certificates/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Exporter les certificats
  static async exportCertificates(filter?: CertificateFilter, format: string = 'csv'): Promise<CertificateExport> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.courseId) params.append('courseId', filter.courseId);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);
    params.append('format', format);

    const response = await apiRequest(`/certificates/export?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Rechercher des certificats
  static async searchCertificates(query: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats expirés
  static async getExpiredCertificates(): Promise<Certificate[]> {
    const response = await apiRequest('/certificates/expired', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats expirant bientôt
  static async getExpiringCertificates(days: number = 30): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/expiring?days=${days}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats récents
  static async getRecentCertificates(limit: number = 10): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/recent?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats populaires
  static async getPopularCertificates(limit: number = 10): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/popular?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par catégorie
  static async getCertificatesByCategory(category: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par niveau
  static async getCertificatesByLevel(level: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/level/${level}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par compétence
  static async getCertificatesBySkill(skill: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/skill/${skill}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par réalisation
  static async getCertificatesByAchievement(achievement: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/achievement/${achievement}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par badge
  static async getCertificatesByBadge(badge: string): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/badge/${badge}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par score
  static async getCertificatesByScore(minScore: number, maxScore: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/score?min=${minScore}&max=${maxScore}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par temps de completion
  static async getCertificatesByCompletionTime(minTime: number, maxTime: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/completion-time?min=${minTime}&max=${maxTime}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de leçons
  static async getCertificatesByLessonCount(minLessons: number, maxLessons: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/lesson-count?min=${minLessons}&max=${maxLessons}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de quiz
  static async getCertificatesByQuizCount(minQuizzes: number, maxQuizzes: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/quiz-count?min=${minQuizzes}&max=${maxQuizzes}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de réalisations
  static async getCertificatesByAchievementCount(minAchievements: number, maxAchievements: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/achievement-count?min=${minAchievements}&max=${maxAchievements}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de badges
  static async getCertificatesByBadgeCount(minBadges: number, maxBadges: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/badge-count?min=${minBadges}&max=${maxBadges}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de compétences
  static async getCertificatesBySkillCount(minSkills: number, maxSkills: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/skill-count?min=${minSkills}&max=${maxSkills}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les certificats par nombre de compétences
  static async getCertificatesByCompetencyCount(minCompetencies: number, maxCompetencies: number): Promise<Certificate[]> {
    const response = await apiRequest(`/certificates/competency-count?min=${minCompetencies}&max=${maxCompetencies}`, {
      method: 'GET',
    });
    return response.data;
  }
}

// Export par défaut
export default CertificateService;
