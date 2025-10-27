import { apiRequest } from './api';

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit?: number; // en minutes
  maxAttempts?: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'text' | 'number';
  points: number;
  order: number;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
}

export interface QuizOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  timeSpent: number; // en secondes
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
}

export interface CreateQuizData {
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore: number;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  instructions?: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  isActive?: boolean;
}

export interface CreateQuestionData {
  quizId: string;
  question: string;
  type: string;
  points: number;
  order: number;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  correctAnswer?: string;
  explanation?: string;
}

export interface UpdateQuestionData {
  question?: string;
  type?: string;
  points?: number;
  order?: number;
  correctAnswer?: string;
  explanation?: string;
}

export interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    averageScore: number;
  }>;
}

export interface QuizAnalytics {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  questionAnalytics: Array<{
    questionId: string;
    question: string;
    correctRate: number;
    commonWrongAnswers: string[];
  }>;
}

// Service principal
export class QuizService {
  // Récupérer tous les quiz d'un cours
  static async getCourseQuizzes(courseId: string): Promise<Quiz[]> {
    const response = await apiRequest(`/courses/${courseId}/quizzes`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un quiz par ID
  static async getQuizById(quizId: string): Promise<Quiz> {
    const response = await apiRequest(`/quizzes/${quizId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer un nouveau quiz
  static async createQuiz(data: CreateQuizData): Promise<Quiz> {
    const response = await apiRequest('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un quiz
  static async updateQuiz(quizId: string, data: UpdateQuizData): Promise<Quiz> {
    const response = await apiRequest(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer un quiz
  static async deleteQuiz(quizId: string): Promise<void> {
    await apiRequest(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  }

  // Activer/Désactiver un quiz
  static async toggleQuizStatus(quizId: string): Promise<Quiz> {
    const response = await apiRequest(`/quizzes/${quizId}/toggle-status`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // Ajouter une question à un quiz
  static async addQuestion(quizId: string, data: CreateQuestionData): Promise<QuizQuestion> {
    const response = await apiRequest(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une question
  static async updateQuestion(questionId: string, data: UpdateQuestionData): Promise<QuizQuestion> {
    const response = await apiRequest(`/quiz-questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer une question
  static async deleteQuestion(questionId: string): Promise<void> {
    await apiRequest(`/quiz-questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  // Commencer un quiz
  static async startQuiz(quizId: string): Promise<QuizAttempt> {
    const response = await apiRequest(`/quizzes/${quizId}/start`, {
      method: 'POST',
    });
    return response.data;
  }

  // Soumettre une réponse
  static async submitAnswer(attemptId: string, questionId: string, answer: string): Promise<QuizAnswer> {
    const response = await apiRequest(`/quiz-attempts/${attemptId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
    return response.data;
  }

  // Terminer un quiz
  static async submitQuiz(attemptId: string): Promise<QuizAttempt> {
    const response = await apiRequest(`/quiz-attempts/${attemptId}/submit`, {
      method: 'POST',
    });
    return response.data;
  }

  // Récupérer les tentatives d'un utilisateur pour un quiz
  static async getUserQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const response = await apiRequest(`/quizzes/${quizId}/attempts`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer une tentative par ID
  static async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    const response = await apiRequest(`/quiz-attempts/${attemptId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer toutes les tentatives d'un utilisateur
  static async getAllUserAttempts(): Promise<QuizAttempt[]> {
    const response = await apiRequest('/quiz-attempts/my', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les statistiques des quiz
  static async getQuizStats(): Promise<QuizStats> {
    const response = await apiRequest('/quizzes/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics d'un quiz
  static async getQuizAnalytics(quizId: string): Promise<QuizAnalytics> {
    const response = await apiRequest(`/quizzes/${quizId}/analytics`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz récents
  static async getRecentQuizzes(limit: number = 10): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/recent?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz populaires
  static async getPopularQuizzes(limit: number = 10): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/popular?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Rechercher des quiz
  static async searchQuizzes(query: string): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par catégorie
  static async getQuizzesByCategory(category: string): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par niveau
  static async getQuizzesByLevel(level: string): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/level/${level}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par instructeur
  static async getQuizzesByInstructor(instructorId: string): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/instructor/${instructorId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz favoris
  static async getFavoriteQuizzes(): Promise<Quiz[]> {
    const response = await apiRequest('/quizzes/favorites', {
      method: 'GET',
    });
    return response.data;
  }

  // Ajouter un quiz aux favoris
  static async addQuizToFavorites(quizId: string): Promise<void> {
    await apiRequest(`/quizzes/${quizId}/favorite`, {
      method: 'POST',
    });
  }

  // Retirer un quiz des favoris
  static async removeQuizFromFavorites(quizId: string): Promise<void> {
    await apiRequest(`/quizzes/${quizId}/favorite`, {
      method: 'DELETE',
    });
  }

  // Récupérer les quiz recommandés
  static async getRecommendedQuizzes(limit: number = 10): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/recommended?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par tags
  static async getQuizzesByTags(tags: string[]): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/tags?tags=${tags.join(',')}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par difficulté
  static async getQuizzesByDifficulty(difficulty: string): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/difficulty/${difficulty}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les quiz par durée
  static async getQuizzesByDuration(minDuration: number, maxDuration: number): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes/duration?min=${minDuration}&max=${maxDuration}`, {
      method: 'GET',
    });
    return response.data;
  }
}

// Export par défaut
export default QuizService;