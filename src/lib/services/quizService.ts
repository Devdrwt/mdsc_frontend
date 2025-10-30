import { apiRequest } from './api';
import { Quiz, QuizAttempt, QuizQuestion } from '../../types/course';

export class QuizService {
  /**
   * Lister les quizzes par cours
   */
  static async getQuizzesByCourse(courseId: string | number): Promise<Quiz[]> {
    const response = await apiRequest(`/quizzes?courseId=${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }
  /**
   * Récupérer le quiz d'une leçon
   */
  static async getQuizByLesson(lessonId: string): Promise<Quiz> {
    const response = await apiRequest(`/quizzes/${lessonId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Alias de compatibilité
  static async getQuizByLessonId(lessonId: string): Promise<Quiz> {
    return this.getQuizByLesson(lessonId);
  }

  /**
   * Soumettre une tentative de quiz
   */
  static async submitAttempt(
    quizId: string | number,
    answers: Record<string | number, string | string[]>
  ): Promise<QuizAttempt> {
    // 1) Créer une tentative -> obtain attemptId
    const createRes = await apiRequest(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
    });
    const attempt = createRes.data as QuizAttempt;
    const attemptId = (attempt as any).id;

    // 2) Normaliser les réponses et PUT sur /quizzes/attempts/{attemptId}
    const normalized: Record<string, any> = {};
    Object.keys(answers).forEach((k) => {
      normalized[String(k)] = answers[k as any];
    });

    const updateRes = await apiRequest(`/quizzes/attempts/${attemptId}`, {
      method: 'PUT',
      body: JSON.stringify({ answers: normalized }),
    });
    return updateRes.data;
  }

  /**
   * Récupérer l'historique des tentatives d'un quiz
   */
  static async getAttemptHistory(quizId: string): Promise<QuizAttempt[]> {
    const response = await apiRequest(`/quizzes/${quizId}/attempts`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Mettre à jour une tentative (correction/notation)
   */
  static async updateAttempt(
    attemptId: string | number,
    data: Partial<QuizAttempt> & { score?: number; feedback?: string; status?: string; answers?: any }
  ): Promise<QuizAttempt> {
    const response = await apiRequest(`/quizzes/attempts/${attemptId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Récupérer les résultats d'une tentative spécifique
   */
  static async getAttemptResults(attemptId: string): Promise<QuizAttempt & {
    correctAnswers: Record<string, string | string[]>;
    feedback?: Record<string, string>;
  }> {
    const response = await apiRequest(`/quizzes/${attemptId}/results`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Calculer le score d'une tentative
   */
  static calculateScore(
    quiz: Quiz,
    answers: Record<string, string | string[]>
  ): { score: number; passed: boolean; totalPoints: number; earnedPoints: number } {
    let earnedPoints = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = answers[String(question.id)];

      const qType = (question as any).question_type || (question as any).questionType;
      const correctAnswer: any = (question as any).correct_answer ?? (question as any).correctAnswer;

      if (qType === 'multiple_choice') {
        // single choice; correctAnswer is a string
        const ua = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
        if (
          typeof correctAnswer === 'string' &&
          String(ua).trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        ) {
          earnedPoints += question.points;
        }
      } else if (qType === 'multiple_select') {
        // multiple select; correctAnswer is string[]
        const uaArr = Array.isArray(userAnswer) ? userAnswer : [String(userAnswer)];
        const correctArr: string[] = Array.isArray(correctAnswer) ? correctAnswer : [];
        const norm = (arr: string[]) => arr.map((s) => String(s).trim().toLowerCase()).sort();
        const isEqual = JSON.stringify(norm(uaArr)) === JSON.stringify(norm(correctArr));
        if (isEqual) earnedPoints += question.points;
      } else if (qType === 'true_false' || qType === 'short_answer') {
        const ua = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
        if (
          typeof correctAnswer === 'string' &&
          String(ua).trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        ) {
          earnedPoints += question.points;
        }
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    return { score, passed, totalPoints, earnedPoints };
  }

  /**
   * Vérifier si l'utilisateur peut refaire le quiz
   */
  static canRetakeQuiz(quiz: Quiz, attempts: QuizAttempt[]): boolean {
    if (quiz.maxAttempts === 0) return true; // Tentatives illimitées
    return attempts.length < quiz.maxAttempts;
  }

  /**
   * Obtenir le meilleur score
   */
  static getBestScore(attempts: QuizAttempt[]): number {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map((a) => a.score || 0));
  }
}

export const quizService = QuizService;