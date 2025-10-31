import { apiRequest } from './api';

export interface Evaluation {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'project' | 'exam';
  status: 'not-started' | 'in-progress' | 'completed' | 'graded';
  dueDate?: string;
  score?: number;
  maxScore?: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationSubmission {
  id: string;
  evaluationId: string;
  studentId: string;
  answers: Record<string, any>;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
}

export interface EvaluationStats {
  totalEvaluations: number;
  completedEvaluations: number;
  averageScore: number;
  totalPoints: number;
  earnedPoints: number;
}

export class EvaluationService {
  // Récupérer toutes les évaluations d'un cours
  static async getCourseEvaluations(courseId: string): Promise<Evaluation[]> {
    const response = await apiRequest(`/courses/${courseId}/evaluations`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les évaluations de l'utilisateur connecté
  static async getMyEvaluations(): Promise<Evaluation[]> {
    const response = await apiRequest('/evaluations/my', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer une évaluation par ID
  static async getEvaluationById(evaluationId: string): Promise<Evaluation> {
    const response = await apiRequest(`/evaluations/${evaluationId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Soumettre une évaluation
  static async submitEvaluation(
    evaluationId: string, 
    answers: Record<string, any>
  ): Promise<EvaluationSubmission> {
    const response = await apiRequest(`/evaluations/${evaluationId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data;
  }

  // Récupérer les soumissions d'une évaluation
  static async getEvaluationSubmissions(evaluationId: string): Promise<EvaluationSubmission[]> {
    const response = await apiRequest(`/evaluations/${evaluationId}/submissions`, {
      method: 'GET',
    });
    return response.data;
  }

  // Sauvegarder un brouillon d'évaluation
  static async saveDraft(
    evaluationId: string, 
    answers: Record<string, any>
  ): Promise<void> {
    await apiRequest(`/evaluations/${evaluationId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    });
  }

  // Récupérer les évaluations d'un utilisateur
  static async getUserEvaluations(userId: number): Promise<Evaluation[]> {
    const response = await apiRequest(`/evaluations/user/${userId}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Récupérer les statistiques d'évaluation d'un utilisateur
  static async getUserEvaluationStats(userId: number): Promise<EvaluationStats> {
    const response = await apiRequest(`/evaluations/user/${userId}/stats`, {
      method: 'GET',
    });
    return response.data;
  }

  // CRUD pour instructeurs
  // Créer une évaluation
  static async createEvaluation(courseId: string, data: {
    title: string;
    description: string;
    type: 'quiz' | 'assignment' | 'project' | 'exam';
    dueDate?: string;
    maxScore?: number;
    instructions?: string;
  }): Promise<Evaluation> {
    const response = await apiRequest(`/evaluations/courses/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une évaluation
  static async updateEvaluation(evaluationId: string, data: {
    title?: string;
    description?: string;
    dueDate?: string;
    maxScore?: number;
    instructions?: string;
  }): Promise<Evaluation> {
    const response = await apiRequest(`/evaluations/${evaluationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer une évaluation
  static async deleteEvaluation(evaluationId: string): Promise<void> {
    await apiRequest(`/evaluations/${evaluationId}`, {
      method: 'DELETE',
    });
  }

  // Noter une soumission
  static async gradeSubmission(
    submissionId: string,
    data: { score: number; feedback?: string }
  ): Promise<EvaluationSubmission> {
    const response = await apiRequest(`/evaluations/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}

// Export par défaut
export default EvaluationService;

// Export nommé pour compatibilité
export const evaluationService = EvaluationService;
