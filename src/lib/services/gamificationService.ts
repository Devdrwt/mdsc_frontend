import { apiRequest } from './api';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface BadgeRequirement {
  id: string;
  badgeId: string;
  type: string;
  value: number;
  description: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  level: number;
  experience: number;
  points: number;
  streak: number;
  lastActivity: string;
  achievements: Achievement[];
  badges: Badge[];
  stats?: UserStats;
  statistics?: UserStats;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserStats {
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  certificatesEarned: number;
  hoursStudied: number;
  daysActive: number;
  perfectScores: number;
  firstPlaceFinishes: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  level: number;
  experience: number;
  points: number;
  position: number;
  badge: string;
}

export interface GamificationSettings {
  id: string;
  userId: string;
  notificationsEnabled: boolean;
  publicProfile: boolean;
  showProgress: boolean;
  showAchievements: boolean;
  showBadges: boolean;
}

export interface CreateBadgeData {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  points: number;
  rarity: string;
  requirements: Array<{
    type: string;
    value: number;
    description: string;
  }>;
}

export interface UpdateBadgeData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  points?: number;
  rarity?: string;
}

export interface CreateAchievementData {
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  maxProgress: number;
}

export interface UpdateAchievementData {
  name?: string;
  description?: string;
  icon?: string;
  points?: number;
  category?: string;
  maxProgress?: number;
}

export interface GamificationStats {
  totalUsers: number;
  totalBadges: number;
  totalAchievements: number;
  averageLevel: number;
  averageExperience: number;
  totalPoints: number;
  topPerformers: LeaderboardEntry[];
}

// Service principal
export class GamificationService {
  // Récupérer le profil de l'utilisateur
  static async getUserProfile(): Promise<UserProgress> {
    const response = await apiRequest('/gamification/profile', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer le profil d'un utilisateur
  static async getUserProfileById(userId: string): Promise<UserProgress> {
    const response = await apiRequest(`/gamification/profile/${userId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les badges
  static async getAllBadges(): Promise<Badge[]> {
    const response = await apiRequest('/gamification/badges', {
      method: 'GET',
    });
    // L'API retourne { success: true, data: [...] }
    return response.data?.data || response.data || [];
  }

  // Récupérer les badges de l'utilisateur
  static async getUserBadges(): Promise<Badge[]> {
    const response = await apiRequest('/gamification/badges/my', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les badges par catégorie
  static async getBadgesByCategory(category: string): Promise<Badge[]> {
    const response = await apiRequest(`/gamification/badges/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les badges par rareté
  static async getBadgesByRarity(rarity: string): Promise<Badge[]> {
    const response = await apiRequest(`/gamification/badges/rarity/${rarity}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer un nouveau badge
  static async createBadge(data: CreateBadgeData): Promise<Badge> {
    const response = await apiRequest('/gamification/badges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un badge
  static async updateBadge(badgeId: string, data: UpdateBadgeData): Promise<Badge> {
    const response = await apiRequest(`/gamification/badges/${badgeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer un badge
  static async deleteBadge(badgeId: string): Promise<void> {
    await apiRequest(`/gamification/badges/${badgeId}`, {
      method: 'DELETE',
    });
  }

  // Récupérer toutes les réalisations
  static async getAllAchievements(): Promise<Achievement[]> {
    const response = await apiRequest('/gamification/achievements', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les réalisations de l'utilisateur
  static async getUserAchievements(): Promise<Achievement[]> {
    const response = await apiRequest('/gamification/achievements/my', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les réalisations par catégorie
  static async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const response = await apiRequest(`/gamification/achievements/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer une nouvelle réalisation
  static async createAchievement(data: CreateAchievementData): Promise<Achievement> {
    const response = await apiRequest('/gamification/achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une réalisation
  static async updateAchievement(achievementId: string, data: UpdateAchievementData): Promise<Achievement> {
    const response = await apiRequest(`/gamification/achievements/${achievementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer une réalisation
  static async deleteAchievement(achievementId: string): Promise<void> {
    await apiRequest(`/gamification/achievements/${achievementId}`, {
      method: 'DELETE',
    });
  }

  // Récupérer le classement
  static async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const response = await apiRequest(`/gamification/leaderboard?limit=${limit}`, {
      method: 'GET',
    });
    // L'API retourne { success: true, data: { leaderboard: [...] } }
    return response.data?.leaderboard || response.data || [];
  }

  // Récupérer le classement par catégorie
  static async getLeaderboardByCategory(category: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const response = await apiRequest(`/gamification/leaderboard/category/${category}?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer le classement par période
  static async getLeaderboardByPeriod(period: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const response = await apiRequest(`/gamification/leaderboard/period/${period}?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les paramètres de gamification
  static async getGamificationSettings(): Promise<GamificationSettings> {
    const response = await apiRequest('/gamification/settings', {
      method: 'GET',
    });
    return response.data;
  }

  // Mettre à jour les paramètres de gamification
  static async updateGamificationSettings(settings: Partial<GamificationSettings>): Promise<GamificationSettings> {
    const response = await apiRequest('/gamification/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  // Ajouter des points à l'utilisateur
  static async addPoints(points: number, reason: string): Promise<UserProgress> {
    const response = await apiRequest('/gamification/points', {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    });
    return response.data;
  }

  // Ajouter de l'expérience à l'utilisateur
  static async addExperience(experience: number, reason: string): Promise<UserProgress> {
    const response = await apiRequest('/gamification/experience', {
      method: 'POST',
      body: JSON.stringify({ experience, reason }),
    });
    return response.data;
  }

  // Débloquer un badge
  static async unlockBadge(badgeId: string): Promise<Badge> {
    const response = await apiRequest(`/gamification/badges/${badgeId}/unlock`, {
      method: 'POST',
    });
    return response.data;
  }

  // Débloquer une réalisation
  static async unlockAchievement(achievementId: string): Promise<Achievement> {
    const response = await apiRequest(`/gamification/achievements/${achievementId}/unlock`, {
      method: 'POST',
    });
    return response.data;
  }

  // Récupérer les statistiques de gamification
  static async getGamificationStats(): Promise<GamificationStats> {
    const response = await apiRequest('/gamification/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par niveau
  static async getUsersByLevel(level: number): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/level/${level}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par points
  static async getUsersByPoints(minPoints: number, maxPoints: number): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/points?min=${minPoints}&max=${maxPoints}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par expérience
  static async getUsersByExperience(minExperience: number, maxExperience: number): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/experience?min=${minExperience}&max=${maxExperience}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par streak
  static async getUsersByStreak(minStreak: number, maxStreak: number): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/streak?min=${minStreak}&max=${maxStreak}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par activité
  static async getUsersByActivity(days: number): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/activity?days=${days}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par réalisation
  static async getUsersByAchievement(achievementId: string): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/achievement/${achievementId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par badge
  static async getUsersByBadge(badgeId: string): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/badge/${badgeId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par catégorie
  static async getUsersByCategory(category: string): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par période
  static async getUsersByPeriod(period: string): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/period/${period}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les utilisateurs par recherche
  static async searchUsers(query: string): Promise<UserProgress[]> {
    const response = await apiRequest(`/gamification/users/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer la progression d'un utilisateur
  static async getUserProgress(userId: string): Promise<UserProgress> {
    const response = await apiRequest(`/gamification/users/${userId}/progress`, {
      method: 'GET',
    });
    // L'API retourne { success: true, data: { ... } }
    return response.data?.data || response.data || null;
  }

  // Récupérer tous les badges disponibles
  static async getAvailableBadges(): Promise<Badge[]> {
    const response = await apiRequest('/gamification/badges', {
      method: 'GET',
    });
    // L'API retourne { success: true, data: [...] }
    return response.data?.data || response.data || [];
  }

  // Calculer le niveau d'un utilisateur basé sur ses points
  static calculateLevel(totalPoints: number): { level: number; levelName: string; pointsToNext: number } {
    const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
    const levelNames = ['Débutant', 'Apprenti', 'Intermédiaire', 'Avancé', 'Expert', 'Maître', 'Légende', 'Champion', 'Héros', 'Légende'];
    
    let level = 1;
    for (let i = 0; i < levelThresholds.length - 1; i++) {
      if (totalPoints >= levelThresholds[i] && totalPoints < levelThresholds[i + 1]) {
        level = i + 1;
        break;
      }
    }
    
    const pointsToNext = levelThresholds[level] - totalPoints;
    const levelName = levelNames[level - 1] || 'Légende';
    
    return { level, levelName, pointsToNext };
  }
}

// Export par défaut
export default GamificationService;

// Export nommé pour compatibilité
export const gamificationService = GamificationService;