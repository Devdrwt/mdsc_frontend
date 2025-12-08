import { apiRequest } from './api';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies?: Array<{
    name: string;
    purpose: string;
    duration: string;
  }>;
}

export interface CookieInfo {
  categories: CookieCategory[];
}

class CookiePreferencesService {
  /**
   * Récupère les informations sur les cookies utilisés
   */
  static async getCookieInfo(): Promise<CookieInfo> {
    const response = await apiRequest('/cookies/info', {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupère les préférences de l'utilisateur (connecté ou non)
   */
  static async getPreferences(): Promise<CookiePreferences> {
    try {
      const response = await apiRequest('/cookies/preferences', {
        method: 'GET',
      });
      return response.data?.preferences || {
        essential: true,
        analytics: false,
        marketing: false,
      };
    } catch (error: any) {
      // Si l'utilisateur n'a pas encore de préférences, retourner les valeurs par défaut
      if (error?.status === 404) {
        return {
          essential: true,
          analytics: false,
          marketing: false,
        };
      }
      throw error;
    }
  }

  /**
   * Enregistre les préférences de l'utilisateur
   */
  static async savePreferences(preferences: CookiePreferences): Promise<void> {
    // S'assurer que essential est toujours true
    const prefs = {
      ...preferences,
      essential: true,
    };

    await apiRequest('/cookies/preferences', {
      method: 'POST',
      body: JSON.stringify({ preferences: prefs }),
    });
  }
}

export default CookiePreferencesService;

