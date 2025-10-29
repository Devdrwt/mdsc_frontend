import { apiRequest } from './api';
import { Quiz, QuizAttempt, QuizQuestion } from '../../types/course';

export class QuizService {
  /**
   * Récupérer le quiz d'une leçon
   */
  static async getQuizByLesson(lessonId: string): Promise<Quiz> {
    const response = await apiRequest(`/quizzes/${lessonId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Soumettre une tentative de quiz
   */
  static async submitAttempt(
    quizId: string,
    answers: Record<string, string | string[]>
  ): Promise<QuizAttempt> {
    const response = await apiRequest(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data;
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
      const userAnswer = answers[question.id];

      if (question.questionType === 'multiple_choice') {
        const correctOptions = question.options?.filter((opt) => opt.correct).map((opt) => opt.text) || [];
        const userOptions = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const isCorrect = correctOptions.length === userOptions.length &&
          correctOptions.every((opt) => userOptions.includes(opt));
        if (isCorrect) earnedPoints += question.points;
      } else if (question.questionType === 'true_false' || question.questionType === 'short_answer') {
        const correctAnswer = question.correctAnswer?.toLowerCase().trim();
        const userAnswerStr = String(userAnswer).toLowerCase().trim();
        if (correctAnswer === userAnswerStr) earnedPoints += question.points;
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