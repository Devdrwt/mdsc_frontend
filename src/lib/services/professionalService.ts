import { apiRequest } from './api';

// ============= TYPES & INTERFACES =============

export interface Domain {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  domain_id: number;
  instructor_id: number;
  title: string;
  description: string;
  short_description: string;
  duration_hours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  thumbnail_url?: string;
  certification_required: boolean;
  is_published: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
  domain?: Domain;
}

export interface Sequence {
  id: number;
  course_id: number;
  title: string;
  description: string;
  sequence_order: number;
  has_mini_control: boolean;
  mini_control_points: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceContent {
  id: number;
  sequence_id: number;
  title: string;
  description: string;
  content_type: 'pdf' | 'video' | 'live' | 'quiz' | 'exercise';
  content_url: string;
  content_order: number;
  is_required: boolean;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface MiniControl {
  id: number;
  sequence_id: number;
  title: string;
  questions: any[]; // TODO: Define Question interface
  passing_score: number;
  badge_id?: number;
  created_at: string;
  updated_at: string;
}

// ============= SERVICE CLASS =============

export class ProfessionalService {
  // ============= DOMAINES =============
  
  static async getDomains(): Promise<Domain[]> {
    const response = await apiRequest('/professional/domains', {
      method: 'GET',
    });
    return response.data || [];
  }

  static async getDomainById(id: number): Promise<Domain> {
    const response = await apiRequest(`/professional/domains/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  static async createDomain(data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    is_active?: boolean;
  }): Promise<Domain> {
    const response = await apiRequest('/professional/domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateDomain(id: number, data: Partial<Domain>): Promise<Domain> {
    const response = await apiRequest(`/professional/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteDomain(id: number): Promise<void> {
    await apiRequest(`/professional/domains/${id}`, {
      method: 'DELETE',
    });
  }

  // ============= MODULES =============

  static async getModulesByDomain(domainId: number): Promise<Module[]> {
    const response = await apiRequest(`/professional/domains/${domainId}/modules`, {
      method: 'GET',
    });
    return response.data || [];
  }

  static async getAllModules(): Promise<Module[]> {
    const response = await apiRequest('/professional/modules', {
      method: 'GET',
    });
    return response.data || [];
  }

  static async getModuleById(id: number): Promise<Module> {
    const response = await apiRequest(`/professional/modules/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  static async createModule(data: {
    domain_id: number;
    title: string;
    description: string;
    short_description: string;
    duration_hours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    currency?: string;
    thumbnail_url?: string;
    certification_required?: boolean;
  }): Promise<Module> {
    const response = await apiRequest('/professional/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateModule(id: number, data: Partial<Module>): Promise<Module> {
    const response = await apiRequest(`/professional/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteModule(id: number): Promise<void> {
    await apiRequest(`/professional/modules/${id}`, {
      method: 'DELETE',
    });
  }

  static async publishModule(id: number): Promise<Module> {
    const response = await apiRequest(`/professional/modules/${id}/publish`, {
      method: 'PUT',
    });
    return response.data;
  }

  // ============= SÉQUENCES =============

  static async getSequencesByCourse(courseId: number): Promise<Sequence[]> {
    const response = await apiRequest(`/professional/courses/${courseId}/sequences`, {
      method: 'GET',
    });
    return response.data || [];
  }

  static async getSequenceById(id: number): Promise<Sequence> {
    const response = await apiRequest(`/professional/sequences/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  static async createSequence(data: {
    course_id: number;
    title: string;
    description: string;
    sequence_order: number;
    has_mini_control?: boolean;
    mini_control_points?: number;
  }): Promise<Sequence> {
    const response = await apiRequest('/professional/sequences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateSequence(id: number, data: Partial<Sequence>): Promise<Sequence> {
    const response = await apiRequest(`/professional/sequences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteSequence(id: number): Promise<void> {
    await apiRequest(`/professional/sequences/${id}`, {
      method: 'DELETE',
    });
  }

  static async reorderSequences(
    courseId: number,
    sequenceOrders: Array<{ id: number; order: number }>
  ): Promise<void> {
    await apiRequest(`/professional/courses/${courseId}/sequences/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ sequenceOrders }),
    });
  }

  // ============= MODULES REORDER PAR COURS (DnD) =============
  static async reorderModulesByCourse(courseId: number | string, modules: Array<{ id: number; order_index: number }>): Promise<void> {
    await apiRequest(`/modules/courses/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
  }

  // ============= CONTENUS DE SÉQUENCE =============

  static async getSequenceContents(sequenceId: number): Promise<SequenceContent[]> {
    const response = await apiRequest(`/professional/sequences/${sequenceId}/contents`, {
      method: 'GET',
    });
    return response.data || [];
  }

  static async getContentById(id: number): Promise<SequenceContent> {
    const response = await apiRequest(`/professional/contents/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  static async createContent(data: {
    sequence_id: number;
    title: string;
    description: string;
    content_type: 'pdf' | 'video' | 'live' | 'quiz' | 'exercise';
    content_url: string;
    content_order: number;
    is_required?: boolean;
    duration_minutes?: number;
  }): Promise<SequenceContent> {
    const response = await apiRequest('/professional/contents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateContent(id: number, data: Partial<SequenceContent>): Promise<SequenceContent> {
    const response = await apiRequest(`/professional/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteContent(id: number): Promise<void> {
    await apiRequest(`/professional/contents/${id}`, {
      method: 'DELETE',
    });
  }

  // ============= INSCRIPTIONS AUX MODULES =============

  static async enrollInModule(moduleId: number): Promise<any> {
    const response = await apiRequest(`/professional/modules/${moduleId}/enroll`, {
      method: 'POST',
    });
    return response.data;
  }

  static async unenrollFromModule(moduleId: number): Promise<void> {
    await apiRequest(`/professional/modules/${moduleId}/unenroll`, {
      method: 'DELETE',
    });
  }

  static async getMyModuleEnrollments(): Promise<any[]> {
    const response = await apiRequest('/professional/modules/my-enrollments', {
      method: 'GET',
    });
    return response.data || [];
  }

  // ============= PROGRESSION =============

  static async getModuleProgress(moduleId: number): Promise<any> {
    const response = await apiRequest(`/professional/modules/${moduleId}/progress`, {
      method: 'GET',
    });
    return response.data;
  }

  static async completeSequence(sequenceId: number): Promise<void> {
    await apiRequest(`/professional/sequences/${sequenceId}/complete`, {
      method: 'POST',
    });
  }

  static async submitMiniControl(sequenceId: number, answers: any): Promise<any> {
    const response = await apiRequest(`/professional/sequences/${sequenceId}/mini-control/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data;
  }
}

export default ProfessionalService;
export const professionalService = ProfessionalService;
