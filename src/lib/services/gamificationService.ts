import { apiRequest } from './api';
import { UserXP, UserStreaks, Challenge, UserChallenge, Badge, UserBadge } from '../../types';

// Types additionnels pour la gamification
export interface UserProgress {
  total_xp: number;
  current_level: number;
  xp_in_current_level: number;
  xp_for_next_level: number;
  badges_earned: number;
  courses_completed: number;
  quizzes_passed: number;
}

export interface LeaderboardEntry {
  userId: string;
  username?: string;
  level: number;
  total_xp: number;
  rank: number;
}

export class GamificationService {
  /**
   * Récupérer la progression de l'utilisateur
   */
  static async getUserProgress(userId?: string): Promise<UserProgress> {
    try {
      const userXP = await this.getUserXP(userId);
      // UserXP a current_level et xp_to_next_level, pas xp_in_current_level/xp_for_next_level
      const xpInLevel = userXP.total_xp % 100; // Calcul approximatif
      return {
        total_xp: userXP.total_xp || 0,
        current_level: userXP.current_level || 1,
        xp_in_current_level: xpInLevel,
        xp_for_next_level: userXP.xp_to_next_level || 100,
        badges_earned: 0, // TODO: Récupérer depuis l'API
        courses_completed: 0, // TODO: Récupérer depuis l'API
        quizzes_passed: 0, // TODO: Récupérer depuis l'API
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        total_xp: 0,
        current_level: 1,
        xp_in_current_level: 0,
        xp_for_next_level: 100,
        badges_earned: 0,
        courses_completed: 0,
        quizzes_passed: 0,
      };
    }
  }

  /**
   * Récupérer les XP et niveau de l'utilisateur
   */
  static async getUserXP(userId?: string): Promise<UserXP> {
    const endpoint = userId ? `/gamification/xp/users/${userId}` : '/gamification/xp';
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Ajouter des points XP à un utilisateur
   */
  static async addXP(amount: number, reason: string): Promise<UserXP> {
    const response = await apiRequest('/gamification/xp/add', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
    return response.data;
  }

  /**
   * Récupérer les streaks de l'utilisateur
   */
  static async getUserStreaks(userId?: string): Promise<UserStreaks> {
    const endpoint = userId ? `/gamification/streaks/users/${userId}` : '/gamification/streaks';
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Mettre à jour le streak quotidien
   */
  static async updateDailyStreak(): Promise<UserStreaks> {
    const response = await apiRequest('/gamification/streaks/daily', {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Récupérer tous les défis actifs
   */
  static async getActiveChallenges(): Promise<Challenge[]> {
    const response = await apiRequest('/gamification/challenges/active', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer tous les défis
   */
  static async getAllChallenges(): Promise<Challenge[]> {
    const response = await apiRequest('/gamification/challenges', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer les défis de l'utilisateur
   */
  static async getUserChallenges(userId?: string): Promise<UserChallenge[]> {
    const endpoint = userId ? `/gamification/challenges/users/${userId}` : '/gamification/challenges/my';
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Rejoindre un défi
   */
  static async joinChallenge(challengeId: string): Promise<UserChallenge> {
    const response = await apiRequest(`/gamification/challenges/${challengeId}/join`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Mettre à jour la progression d'un défi
   */
  static async updateChallengeProgress(challengeId: string, progress: Record<string, any>): Promise<UserChallenge> {
    const response = await apiRequest(`/gamification/challenges/${challengeId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
    return response.data;
  }

  /**
   * Récupérer le classement global
   */
  static async getLeaderboard(params?: { limit?: number; type?: 'xp' | 'streak' }): Promise<LeaderboardEntry[]> {
    try {
      const search = new URLSearchParams();
      if (params?.limit) search.append('limit', String(params.limit));
      if (params?.type) search.append('type', params.type);
      const qs = search.toString();
      const response = await apiRequest(`/gamification/leaderboard${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
      
      // Transformer UserXP[] en LeaderboardEntry[]
      const entries: LeaderboardEntry[] = (response.data || []).map((user: any, index: number) => ({
        userId: user.user_id?.toString() || index.toString(),
        username: user.username || `User ${user.user_id}`,
        level: user.current_level || 1,
        total_xp: user.total_xp || 0,
        rank: index + 1,
      }));
      
      return entries;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
  
  /**
   * Récupérer tous les badges disponibles
   */
  static async getAvailableBadges(): Promise<Badge[]> {
    try {
      const response = await apiRequest('/badges', {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching available badges:', error);
      return [];
    }
  }

  /**
   * Calculer le niveau à partir des XP
   */
  static calculateLevel(totalXp: number): { level: number; xpToNextLevel: number; xpInCurrentLevel: number } {
    // Formula: level = sqrt(xp / 100) + 1
    // XP pour atteindre un niveau: (level - 1)^2 * 100
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const xpForThisLevel = (level - 1) ** 2 * 100;
    const xpForNextLevel = level ** 2 * 100;
    const xpInCurrentLevel = totalXp - xpForThisLevel;
    const xpToNextLevel = xpForNextLevel - totalXp;
    
    return { level, xpToNextLevel, xpInCurrentLevel };
  }

  /**
   * Vérifier si un utilisateur peut gagner un niveau
   */
  static canLevelUp(userXP: UserXP): boolean {
    return userXP.total_xp >= (userXP.current_level ** 2 * 100);
  }
}

export const gamificationService = GamificationService;
