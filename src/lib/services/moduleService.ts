import { apiRequest } from './api';
import { Module } from '../../types/course';

export class ModuleService {
  /**
   * Récupérer tous les modules d'un cours
   */
  static async getCourseModules(courseId: number): Promise<Module[]> {
    const response = await apiRequest(`/modules/courses/${courseId}/modules`, {
      method: 'GET',
    });
    
    // Le backend retourne maintenant image_url formatée, on normalise juste pour compatibilité
    const modules = Array.isArray(response.data) ? response.data : [];
    return modules.map((module: any) => ({
      ...module,
      image_url: module.image_url || module.imageUrl || null,
      imageUrl: module.image_url || module.imageUrl || null, // Pour compatibilité
    }));
  }

  /**
   * Récupérer un module par ID
   */
  static async getModule(moduleId: number): Promise<Module> {
    const response = await apiRequest(`/modules/${moduleId}`, {
      method: 'GET',
    });
    console.log('📦 getModule response:', response);
    return response.data;
  }

  /**
   * Récupérer les leçons d'un module (pour instructeurs)
   * Note: Le backend doit inclure les leçons dans la réponse de getModule ou getCourseModules
   * pour que cela fonctionne. Sinon, il faut créer un endpoint spécifique.
   */
  static async getModuleLessons(moduleId: number): Promise<any[]> {
    try {
      // Essayer d'abord de récupérer le module complet qui pourrait inclure les leçons
      const module = await this.getModule(moduleId);
      console.log('📚 getModuleLessons - module:', module);
      
      // Vérifier si le module a des leçons dans sa réponse
      if ((module as any).lessons && Array.isArray((module as any).lessons)) {
        return (module as any).lessons;
      }
      
      // Si pas de leçons dans le module, retourner un tableau vide
      // Le backend doit être modifié pour inclure les leçons dans la réponse
      console.warn('⚠️ Le module ne contient pas de leçons dans sa réponse. Le backend doit être modifié pour inclure les leçons pour les instructeurs.');
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération du module:', error);
      return [];
    }
  }

  /**
   * Créer un module
   */
  static async createModule(
    courseId: number,
    data: {
      title: string;
      description?: string;
      order_index: number;
      image_url?: string;
    }
  ): Promise<Module> {
    const response = await apiRequest(`/modules/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Mettre à jour un module
   */
  static async updateModule(
    moduleId: number,
    data: {
      title?: string;
      description?: string;
      order_index?: number;
      is_unlocked?: boolean;
      image_url?: string;
    }
  ): Promise<Module> {
    const response = await apiRequest(`/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Supprimer un module
   */
  static async deleteModule(moduleId: number): Promise<void> {
    await apiRequest(`/modules/${moduleId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Déverrouiller un module (Admin)
   */
  static async unlockModule(moduleId: number): Promise<Module> {
    const response = await apiRequest(`/modules/${moduleId}/unlock`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Obtenir le statut de déverrouillage des modules d'un cours
   */
  static async getModulesUnlockStatus(courseId: number): Promise<Record<number, boolean>> {
    const response = await apiRequest(`/modules/courses/${courseId}/unlock-status`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Réordonner les modules d'un cours (Drag & Drop)
   */
  static async reorderCourseModules(
    courseId: number,
    modules: Array<{ id: number; order_index: number }>
  ): Promise<void> {
    await apiRequest(`/modules/courses/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
  }
}

export const moduleService = ModuleService;
