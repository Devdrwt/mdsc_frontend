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

// Interface pour l'évaluation finale
export interface FinalEvaluation {
  id?: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  max_attempts: number;
  questions: EvaluationQuestion[];
}

export interface EvaluationQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

export class EvaluationService {
  // Créer une évaluation finale pour un cours (OBLIGATOIRE)
  static async createEvaluation(data: FinalEvaluation): Promise<FinalEvaluation> {
    const response = await apiRequest(`/instructor/courses/${data.course_id}/evaluation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Récupérer l'évaluation finale d'un cours (pour instructeur)
  static async getCourseEvaluation(courseId: string): Promise<FinalEvaluation | null> {
    try {
      // Essayer d'abord l'endpoint /evaluations/courses/{courseId} qui retourne une liste
      try {
        const response = await apiRequest(`/evaluations/courses/${courseId}`, {
          method: 'GET',
        });
        // Si la réponse est un tableau, prendre la première évaluation finale
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Chercher une évaluation de type "exam" ou "final" ou la première
          const finalEval = response.data.find((e: any) => 
            e.type === 'exam' || e.type === 'final' || e.is_final
          ) || response.data[0];
          
          // Convertir au format FinalEvaluation si nécessaire
          if (finalEval) {
            return {
              id: String(finalEval.id),
              course_id: String(finalEval.courseId || finalEval.course_id || courseId),
              title: finalEval.title,
              description: finalEval.description || '',
              passing_score: finalEval.passing_score || finalEval.passingScore || 70,
              duration_minutes: finalEval.duration_minutes || finalEval.durationMinutes,
              max_attempts: finalEval.max_attempts || finalEval.maxAttempts || 1,
              questions: finalEval.questions || [],
            };
          }
        }
        // Si c'est un objet unique, le retourner directement
        if (response.data && !Array.isArray(response.data)) {
          return response.data;
        }
      } catch (evaluationsError: any) {
        // Si cet endpoint ne fonctionne pas (404, 500, etc.), essayer les endpoints spécifiques
        // Ne pas logger les erreurs pour cet endpoint optionnel - c'est normal s'il n'existe pas ou s'il y a un problème serveur
        // Les erreurs seront gérées silencieusement et on essaiera les autres endpoints
      }
      
      // Essayer l'endpoint spécifique instructeur (peut ne pas exister)
      try {
        const response = await apiRequest(`/instructor/courses/${courseId}/evaluation`, {
          method: 'GET',
        });
        return response.data;
      } catch (instructorError: any) {
        // 404 est attendu si l'endpoint n'existe pas ou s'il n'y a pas d'évaluation
        if (instructorError?.status !== 404 && instructorError?.response?.status !== 404) {
          console.warn(`Erreur lors de la récupération de l'évaluation (instructor) pour le cours ${courseId}:`, instructorError);
        }
      }
      
      // Essayer l'endpoint général (peut ne pas exister)
      try {
        const response = await apiRequest(`/courses/${courseId}/evaluation`, {
          method: 'GET',
        });
        return response.data;
      } catch (generalError: any) {
        // 404 est attendu si l'endpoint n'existe pas ou s'il n'y a pas d'évaluation
        if (generalError?.status !== 404 && generalError?.response?.status !== 404) {
          console.warn(`Erreur lors de la récupération de l'évaluation (general) pour le cours ${courseId}:`, generalError);
        }
      }
      
      // Aucune évaluation trouvée, retourner null silencieusement
      return null;
    } catch (error) {
      // Erreur inattendue, retourner null silencieusement
      return null;
    }
  }

  // Mettre à jour une évaluation finale
  static async updateEvaluation(evaluationId: string, data: Partial<FinalEvaluation>): Promise<FinalEvaluation> {
    const response = await apiRequest(`/instructor/evaluations/${evaluationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

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
  // Créer une évaluation générique
  static async createGenericEvaluation(courseId: string, data: {
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

  // Mettre à jour une évaluation générique
  static async updateGenericEvaluation(evaluationId: string, data: {
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
