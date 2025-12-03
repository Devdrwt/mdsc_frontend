import { apiRequest } from './api';

export interface ModuleQuiz {
  id?: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: Record<string, string>;
}

export interface QuizResult {
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  badge_earned?: boolean;
  badge_name?: string;
}

export class QuizService {
  // Créer un quiz pour un module
  static async createModuleQuiz(data: ModuleQuiz): Promise<ModuleQuiz> {
    // Utiliser l'endpoint /modules/{moduleId}/quiz pour créer un quiz de module
    // Convertir les IDs en nombres si nécessaire
    const moduleId = typeof data.module_id === 'string' ? parseInt(data.module_id, 10) : data.module_id;
    const courseId = typeof data.course_id === 'string' ? parseInt(data.course_id, 10) : data.course_id;
    
    const response = await apiRequest(`/modules/${moduleId}/quiz`, {
      method: 'POST',
      body: JSON.stringify({
        module_id: moduleId,
        course_id: courseId,
        title: data.title,
        description: data.description,
        passing_score: data.passing_score,
        duration_minutes: data.duration_minutes,
        is_published: true, // Publier automatiquement le quiz
        questions: data.questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index || idx + 1,
        })),
      }),
    });
    return response.data;
  }

  // Créer un quiz générique (pour compatibilité avec EvaluationManagement)
  static async createQuiz(data: any): Promise<ModuleQuiz> {
    const response = await apiRequest(`/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Récupérer le quiz d'un module
  static async getModuleQuiz(moduleId: string): Promise<ModuleQuiz | null> {
    try {
      // Utiliser l'endpoint /modules/{moduleId}/quiz
      const id = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
      const response = await apiRequest(`/modules/${id}/quiz`, {
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      // Si l'erreur est 404, c'est normal (pas de quiz pour ce module)
      // Si l'erreur est 403, l'accès est restreint (peut être normal selon les permissions)
      if (error.status === 404 || error.status === 403) {
        return null;
      }
      // Pour les autres erreurs, logger seulement en développement et retourner null
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [QuizService] Erreur lors de la récupération du quiz du module', moduleId, ':', error);
      }
      return null;
    }
  }

  // Mettre à jour un quiz de module
  static async updateModuleQuiz(quizId: string, data: Partial<ModuleQuiz>): Promise<ModuleQuiz> {
    // Utiliser l'endpoint /modules/{moduleId}/quiz en PUT (même endpoint que création)
    const moduleId = typeof data.module_id === 'string' ? parseInt(data.module_id, 10) : data.module_id;
    const courseId = typeof data.course_id === 'string' ? parseInt(data.course_id, 10) : data.course_id;
    
    const response = await apiRequest(`/modules/${moduleId}/quiz`, {
      method: 'PUT',
      body: JSON.stringify({
        module_id: moduleId,
        course_id: courseId,
        title: data.title,
        description: data.description,
        passing_score: data.passing_score,
        duration_minutes: data.duration_minutes,
        is_published: true, // Maintenir le quiz publié lors de la mise à jour
        questions: data.questions?.map((q, idx) => ({
          id: q.id, // Inclure l'ID si la question existe déjà
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index || idx + 1,
        })) || [],
      }),
    });
    return response.data;
  }

  // Supprimer un quiz de module
  static async deleteModuleQuiz(moduleId: string | number): Promise<void> {
    const id = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
    await apiRequest(`/modules/${id}/quiz`, {
      method: 'DELETE',
    });
  }

  // Soumettre un quiz (étudiant)
  static async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    const response = await apiRequest(`/quizzes/${submission.quiz_id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers: submission.answers }),
    });
    return response.data;
  }

  // Récupérer un quiz pour un étudiant (sans les réponses)
  static async getQuizForStudent(quizId: string): Promise<ModuleQuiz> {
    const response = await apiRequest(`/quizzes/${quizId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer le quiz d'un module pour un étudiant (via enrollmentId et moduleId)
  static async getModuleQuizForStudent(enrollmentId: number, moduleId: string): Promise<ModuleQuiz | null> {
    try {
      const response = await apiRequest(`/enrollments/${enrollmentId}/modules/${moduleId}/quiz`, {
        method: 'GET',
      });
      // L'API retourne { quiz, previous_attempts, can_attempt }
      // On doit extraire le quiz et s'assurer qu'il a les questions
      const quizData = response.data?.quiz || response.data;
      if (!quizData) {
        return null;
      }
      // Si le quiz n'a pas de questions, elles sont peut-être dans response.data.questions
      if (!quizData.questions && response.data?.questions) {
        quizData.questions = response.data.questions;
      }
      // Ajouter les informations sur les tentatives au quiz
      if (response.data) {
        quizData.previous_attempts = response.data.previous_attempts || [];
        quizData.can_attempt = response.data.can_attempt !== false;
        quizData.remaining_attempts = Math.max(0, (quizData.max_attempts || 0) - (response.data.previous_attempts?.length || 0));
      }
      return quizData;
    } catch (error) {
      return null;
    }
  }

  // Soumettre une tentative de quiz de module (étudiant)
  static async submitModuleQuizAttempt(
    enrollmentId: number,
    moduleId: string,
    answers: Record<string, string>
  ): Promise<QuizResult> {
    const response = await apiRequest(`/enrollments/${enrollmentId}/modules/${moduleId}/quiz/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data;
  }
}

// Export par défaut
export default QuizService;

// Export nommé pour compatibilité
export const quizService = QuizService;
