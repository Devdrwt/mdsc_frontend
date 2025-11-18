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
  pendingEvaluations?: number;
  averageScore: number;
  totalPoints: number;
  earnedPoints: number;
}

export interface InstructorFinalEvaluationEntry {
  id: string;
  title: string;
  type: string;
  course: {
    id: string;
    title: string;
    slug?: string;
    language?: string;
    status: string;
    detailUrl?: string;
  };
  statistics: {
    totalQuestions: number;
    totalSubmissions: number;
    passedCount: number;
    failedCount: number;
    passedStudents?: number;
  };
  passingScore?: number;
  durationMinutes?: number;
  maxAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
  links?: {
    api?: string;
    detail?: string;
    edit?: string;
  };
}

export interface InstructorFinalEvaluationsResponse {
  evaluations: InstructorFinalEvaluationEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  } | null;
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

  // Récupérer l'évaluation finale pour un enrollment (étudiant)
  static async getEnrollmentEvaluation(enrollmentId: number): Promise<{ evaluation: FinalEvaluation | null; previous_attempts: any[]; can_attempt: boolean } | null> {
    try {
      const response = await apiRequest(`/evaluations/enrollments/${enrollmentId}/evaluation`, {
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      // 404 est attendu si l'évaluation n'existe pas
      if (error?.status === 404 || error?.response?.status === 404) {
        return null;
      }
      console.warn('Erreur lors de la récupération de l\'évaluation finale:', error);
      return null;
    }
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

  // Vérifier l'existence d'une tentative (sans en créer une nouvelle)
  // Retourne la dernière tentative non complétée si elle existe
  static async checkEvaluationAttempt(evaluationId: string): Promise<{ exists: boolean; attemptId?: number; startedAt?: string; durationMinutes: number }> {
    try {
      const response = await apiRequest(`/evaluations/${evaluationId}/attempt`, {
        method: 'GET',
      });
      
      const data = response.data;
      
      // Si pas de tentatives, retourner exists: false
      if (!data.attempts || !Array.isArray(data.attempts) || data.attempts.length === 0) {
        return {
          exists: false,
          durationMinutes: 0
        };
      }
      
      // Trouver la dernière tentative non complétée (sans completed_at)
      const incompleteAttempt = data.attempts.find((attempt: any) => 
        !attempt.completed_at && !attempt.completedAt && attempt.started_at
      );
      
      if (incompleteAttempt) {
        // Récupérer la durée de l'évaluation depuis les métadonnées ou la tentative
        // Le backend devrait inclure duration_minutes dans la réponse
        const durationMinutes = incompleteAttempt.duration_minutes || 
                                data.duration_minutes || 
                                (incompleteAttempt.durationMinutes || 0);
        
        return {
          exists: true,
          attemptId: incompleteAttempt.id,
          startedAt: incompleteAttempt.started_at || incompleteAttempt.startedAt,
          durationMinutes: durationMinutes
        };
      }
      
      // Toutes les tentatives sont complétées
      return {
        exists: false,
        durationMinutes: 0
      };
    } catch (error: any) {
      // 404 est attendu si la route n'existe pas encore côté backend
      // Retourner une réponse par défaut sans erreur
      if (error?.status === 404 || error?.response?.status === 404) {
        return {
          exists: false,
          durationMinutes: 0
        };
      }
      // Pour les autres erreurs, relancer
      throw error;
    }
  }

  // Démarrer une tentative d'évaluation
  static async startEvaluationAttempt(evaluationId: string): Promise<{ attemptId: number; startedAt: string; durationMinutes: number }> {
    const response = await apiRequest(`/evaluations/${evaluationId}/start`, {
      method: 'POST',
    });
    return response.data;
  }

  // Soumettre une évaluation
  // Le backend récupère automatiquement l'enrollmentId si non fourni
  static async submitEvaluation(
    evaluationId: string, 
    answers: Record<string, any>,
    enrollmentId?: number
  ): Promise<{
    attempt_id?: number;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    is_passed?: boolean;
    correct_answers?: number;
    total_questions?: number;
    certificate_eligible?: boolean;
  }> {
    const body: any = { answers };
    // Inclure enrollmentId si fourni (le backend peut aussi le récupérer automatiquement)
    if (enrollmentId) {
      body.enrollmentId = enrollmentId;
    }
    
    const response = await apiRequest(`/evaluations/${evaluationId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
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
    const data = response.data || response;
    const overview = data.overview || data;
    
    return {
      totalEvaluations: overview.total_evaluations || overview.totalEvaluations || 0,
      completedEvaluations: overview.evaluations_graded || overview.completedEvaluations || 0,
      pendingEvaluations: overview.evaluations_pending || overview.pendingEvaluations || 0,
      averageScore: overview.average_score || overview.averageScore || 0,
      totalPoints: overview.totalPoints || 0,
      earnedPoints: overview.earnedPoints || 0
    };
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

  static async getInstructorFinalEvaluations(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<InstructorFinalEvaluationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await apiRequest(`/evaluations/instructor/finals${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    const payload = response?.data ?? response ?? {};
    const rawEvaluations = Array.isArray(payload.evaluations)
      ? payload.evaluations
      : Array.isArray(payload.data?.evaluations)
        ? payload.data.evaluations
        : [];

    const normalized = rawEvaluations.map(normalizeInstructorFinalEvaluation);
    const pagination = payload.pagination ?? payload.data?.pagination ?? null;

    return {
      evaluations: normalized,
      pagination,
    };
  }
}

function normalizeInstructorFinalEvaluation(raw: any): InstructorFinalEvaluationEntry {
  const course = raw?.course ?? {};
  const stats = raw?.statistics ?? {};

  const courseStatus = String(course.status ?? raw?.course_status ?? 'draft').toLowerCase();

  return {
    id: String(raw?.id ?? raw?.evaluation_id ?? ''),
    title: String(raw?.evaluation_title ?? raw?.title ?? 'Évaluation finale'),
    type: String(raw?.evaluation_type ?? raw?.type ?? 'final'),
    course: {
      id: String(course?.id ?? raw?.course_id ?? ''),
      title: String(course?.title ?? raw?.course_title ?? 'Cours sans titre'),
      slug: course?.slug ?? raw?.course_slug ?? undefined,
      language: course?.language ?? raw?.course_language ?? undefined,
      status: courseStatus,
      detailUrl:
        course?.detail_url ??
        course?.detailUrl ??
        raw?.course_detail_url ??
        (course?.slug || raw?.course_slug
          ? `/dashboard/instructor/courses/${course?.slug ?? raw?.course_slug}`
          : raw?.course_id
            ? `/dashboard/instructor/courses/${raw.course_id}`
            : undefined),
    },
    statistics: {
      totalQuestions: Number(stats?.total_questions ?? raw?.total_questions ?? 0),
      totalSubmissions: Number(stats?.total_submissions ?? raw?.total_submissions ?? 0),
      passedCount: Number(stats?.passed_count ?? raw?.passed_count ?? 0),
      failedCount: Number(stats?.failed_count ?? raw?.failed_count ?? 0),
      passedStudents: Number(stats?.passed_students ?? raw?.passed_students ?? raw?.passed_count ?? 0),
    },
    passingScore: raw?.passing_score ?? raw?.passingScore ?? undefined,
    durationMinutes: raw?.duration_minutes ?? raw?.durationMinutes ?? undefined,
    maxAttempts: raw?.max_attempts ?? raw?.maxAttempts ?? undefined,
    createdAt: raw?.created_at ?? raw?.createdAt ?? undefined,
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? undefined,
    links: {
      api:
        raw?.links?.api ??
        raw?.api_url ??
        (raw?.id ? `/api/evaluations/${raw.id}` : undefined),
      detail:
        raw?.links?.detail ??
        raw?.detail_url ??
        (raw?.id ? `/dashboard/instructor/evaluations/${raw.id}` : undefined),
      edit:
        raw?.links?.edit ??
        raw?.edit_url ??
        (raw?.id ? `/dashboard/instructor/evaluations/${raw.id}/edit` : undefined),
    },
  };
}

// Export par défaut
export default EvaluationService;

// Export nommé pour compatibilité
export const evaluationService = EvaluationService;
