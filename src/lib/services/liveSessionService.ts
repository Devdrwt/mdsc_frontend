import { apiRequest } from "./api";
import {
  LiveSession,
  LiveSessionParticipant,
  CreateLiveSessionData,
  UpdateLiveSessionData,
  JitsiTokenResponse,
  LiveSessionJoinResponse,
  LiveSessionStartResponse,
  LiveSessionEndResponse,
  StudentLiveSessions,
  CalendarLiveSession,
} from "../../types/liveSession";
import { useAuthStore } from "../stores/authStore";

export class LiveSessionService {
  /**
   * Créer une session live pour un cours
   */
  static async createSession(
    courseId: number | string,
    data: CreateLiveSessionData
  ): Promise<LiveSession> {
    // S'assurer que courseId est un nombre valide
    const courseIdNum = typeof courseId === 'number' ? courseId : parseInt(String(courseId), 10);
    
    if (!Number.isFinite(courseIdNum) || courseIdNum <= 0) {
      throw new Error(`ID de cours invalide: ${courseId} (converti en: ${courseIdNum})`);
    }
    
    const url = `/courses/${courseIdNum}/live-sessions`;
    console.log('📤 [LiveSession] Création session live');
    console.log('   URL:', url);
    console.log('   Course ID:', courseIdNum, '(type:', typeof courseIdNum, ')');
    console.log('   Data:', JSON.stringify(data, null, 2));
    
    try {
      const response = await apiRequest(url, {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      console.log('✅ [LiveSession] Session créée avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [LiveSession] Erreur lors de la création:', error);
      console.error('   URL appelée:', url);
      console.error('   Status:', error.status);
      console.error('   Message:', error.message);
      throw error;
    }
  }

  /**
   * Créer une session live indépendante (sans cours)
   */
  static async createIndependentSession(
    data: CreateLiveSessionData
  ): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Récupérer toutes les sessions live du formateur (avec ou sans cours)
   */
  static async getInstructorSessions(
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<{ data: LiveSession[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const response = await apiRequest(
      `/instructor/live-sessions?${queryParams.toString()}`,
      { method: "GET" }
    );
    return {
      data: Array.isArray(response.data)
        ? response.data
        : response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  }

  /**
   * Récupérer toutes les sessions d'un cours
   */
  static async getCourseSessions(
    courseId: number,
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<{ data: LiveSession[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const response = await apiRequest(
      `/courses/${courseId}/live-sessions?${queryParams.toString()}`,
      { method: "GET" }
    );
    return {
      data: Array.isArray(response.data)
        ? response.data
        : response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  }

  /**
   * Récupérer une session spécifique
   */
  static async getSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}`, {
      method: "GET",
    });
    return response.data;
  }

  /**
   * Mettre à jour une session
   */
  static async updateSession(
    sessionId: number,
    data: UpdateLiveSessionData
  ): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Supprimer une session
   */
  static async deleteSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  /**
   * Démarrer une session (formateur)
   */
  static async startSession(
    sessionId: number
  ): Promise<LiveSessionStartResponse> {
    const response = await apiRequest(`/live-sessions/${sessionId}/start`, {
      method: "POST",
    });
    return response.data;
  }

  /**
   * Terminer une session (formateur)
   */
  static async endSession(
    sessionId: number
  ): Promise<LiveSessionEndResponse> {
    const response = await apiRequest(`/live-sessions/${sessionId}/end`, {
      method: "POST",
    });
    return response.data;
  }

  /**
   * Rejoindre une session (utilisateur)
   */
  static async joinSession(
    sessionId: number,
    enrollmentId?: number
  ): Promise<LiveSessionJoinResponse> {
    const response = await apiRequest(`/live-sessions/${sessionId}/join`, {
      method: "POST",
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    });
    return response.data;
  }

  /**
   * Quitter une session
   */
  static async leaveSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}/leave`, {
      method: "POST",
    });
  }

  /**
   * Récupérer les participants d'une session
   */
  static async getParticipants(
    sessionId: number
  ): Promise<LiveSessionParticipant[]> {
    const response = await apiRequest(
      `/live-sessions/${sessionId}/participants`,
      {
        method: "GET",
      }
    );
    return response.data || [];
  }

  /**
   * Récupérer les sessions live de l'utilisateur connecté
   */
  static async getStudentSessions(): Promise<StudentLiveSessions> {
    const response = await apiRequest("/student/live-sessions", {
      method: "GET",
    });
    return response.data || { upcoming: [], live: [], past: [] };
  }

  /**
   * Générer un JWT pour Jitsi
   */
  static async getJitsiToken(
    sessionId: number,
    role: "instructor" | "participant" | "moderator" = "participant"
  ): Promise<JitsiTokenResponse> {
    const { user } = useAuthStore.getState();
    const response = await apiRequest(
      `/live-sessions/${sessionId}/jitsi-token`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: user?.id,
          role,
        }),
      }
    );
    return response.data;
  }

  /**
   * Récupérer les sessions pour le calendrier
   */
  static async getCalendarSessions(
    startDate: string,
    endDate: string
  ): Promise<CalendarLiveSession[]> {
    const response = await apiRequest(
      `/student/calendar/live-sessions?start_date=${startDate}&end_date=${endDate}`,
      { method: "GET" }
    );
    return response.data || [];
  }
}

export const liveSessionService = LiveSessionService;

