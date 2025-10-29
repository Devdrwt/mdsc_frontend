import { apiRequest } from './api';
import { Badge, UserBadge } from '../../types/course';

export class BadgeService {
  /**
   * Récupérer tous les badges disponibles
   */
  static async getAllBadges(): Promise<Badge[]> {
    const response = await apiRequest('/badges', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer les badges de l'utilisateur connecté
   */
  static async getUserBadges(): Promise<UserBadge[]> {
    const response = await apiRequest('/badges/user', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Vérifier l'éligibilité pour un badge
   */
  static async checkEligibility(badgeId: string): Promise<{
    eligible: boolean;
    progress?: number;
    criteria?: any;
  }> {
    const response = await apiRequest(`/badges/check-eligibility`, {
      method: 'POST',
      body: JSON.stringify({ badgeId }),
    });
    return response.data;
  }

  /**
   * Récupérer les badges éligibles (non encore gagnés)
   */
  static async getEligibleBadges(): Promise<Badge[]> {
    const userBadges = await this.getUserBadges();
    const allBadges = await this.getAllBadges();
    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
    return allBadges.filter((badge) => !earnedBadgeIds.has(badge.id));
  }

  /**
   * Obtenir le pourcentage de progression vers un badge
   */
  static async getBadgeProgress(badgeId: string): Promise<number> {
    const eligibility = await this.checkEligibility(badgeId);
    return eligibility.progress || 0;
  }
}

export const badgeService = BadgeService;