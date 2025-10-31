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
    return response.data;
  }

  /**
   * Récupérer un module par ID
   */
  static async getModule(moduleId: number): Promise<Module> {
    const response = await apiRequest(`/modules/${moduleId}`, {
      method: 'GET',
    });
    return response.data;
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
