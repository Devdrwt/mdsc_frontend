import { apiRequest } from './api';

export interface Testimonial {
  id: string | number;
  quote: string;
  author: string;
  title?: string;
  avatar?: string;
  rating?: number;
  is_active?: boolean;
  display_order?: number;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  user_id?: string | number;
  course_id?: string | number;
  course_title?: string; // Pour l'affichage dans l'admin
  created_at?: string;
  updated_at?: string;
}

export interface TestimonialsResponse {
  testimonials: Testimonial[];
  total?: number;
}

class TestimonialService {
  private baseEndpoint = '/testimonials';

  /**
   * Récupère les témoignages de l'utilisateur connecté
   */
  async getMyTestimonials(): Promise<Testimonial[]> {
    try {
      console.log('🔄 Récupération des témoignages de l\'utilisateur...');
      const response = await apiRequest<any>(`${this.baseEndpoint}/my`, {
        method: 'GET',
      });

      console.log('📦 Réponse API getMyTestimonials:', response);

      // Gérer différentes structures de réponse
      if (Array.isArray(response)) {
        console.log(`✅ ${response.length} témoignage(s) récupéré(s) (format array)`);
        return response;
      }
      
      const responseData = (response as any).data || response;
      
      if (Array.isArray(responseData)) {
        console.log(`✅ ${responseData.length} témoignage(s) récupéré(s) (format data array)`);
        return responseData;
      } else if (responseData.testimonials && Array.isArray(responseData.testimonials)) {
        console.log(`✅ ${responseData.testimonials.length} témoignage(s) récupéré(s) (format testimonials)`);
        return responseData.testimonials;
      } else if ((response as any).testimonials && Array.isArray((response as any).testimonials)) {
        console.log(`✅ ${(response as any).testimonials.length} témoignage(s) récupéré(s) (format response.testimonials)`);
        return (response as any).testimonials;
      }

      console.warn('⚠️ Format de réponse non reconnu, retour d\'un tableau vide');
      return [];
    } catch (error: any) {
      // Si c'est une erreur 404, l'utilisateur n'a probablement pas encore de témoignages
      // Retourner un tableau vide dans ce cas
      if (error?.status === 404) {
        console.log('ℹ️ Aucun témoignage trouvé pour cet utilisateur (404)');
        return [];
      }
      
      console.error('❌ Erreur lors de la récupération de mes témoignages:', {
        error,
        message: error?.message,
        status: error?.status,
        details: error?.details,
      });
      // Pour les autres erreurs, laisser l'erreur remonter
      // pour que l'interface utilisateur puisse afficher un message d'erreur approprié
      throw error;
    }
  }

  /**
   * Récupère tous les témoignages actifs
   * @param params - Paramètres optionnels (limit, order, etc.)
   */
  async getTestimonials(params?: {
    limit?: number;
    order?: 'asc' | 'desc';
    orderBy?: 'display_order' | 'created_at';
    status?: 'pending' | 'approved' | 'rejected' | 'all'; // Filtre par statut
    includePending?: boolean; // Déprécié: utiliser status='all' à la place
  }): Promise<Testimonial[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.order) {
        queryParams.append('order', params.order);
      }
      if (params?.orderBy) {
        queryParams.append('order_by', params.orderBy);
      }
      
      // Utiliser le paramètre status si fourni
      // Pour compatibilité avec les anciennes versions du backend, on envoie aussi includePending
      if (params?.status) {
        queryParams.append('status', params.status);
        // Si on demande 'all' ou 'pending', on envoie aussi includePending=true pour compatibilité
        if (params.status === 'all' || params.status === 'pending') {
          queryParams.append('includePending', 'true');
        }
      } else if (params?.includePending) {
        // Pour compatibilité avec l'ancien code, si includePending=true, on demande 'all'
        queryParams.append('status', 'all');
        queryParams.append('includePending', 'true');
      }
      
      const endpoint = `${this.baseEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 Appel API getTestimonials:', endpoint);
      
      const response = await apiRequest<any>(endpoint, {
        method: 'GET',
      });
      
      console.log('📦 Réponse API getTestimonials:', response);

      // Gérer différentes structures de réponse
      if (Array.isArray(response)) {
        return response;
      }
      
      const responseData = (response as any).data || response;
      
      if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData.testimonials && Array.isArray(responseData.testimonials)) {
        return responseData.testimonials;
      } else if ((response as any).testimonials && Array.isArray((response as any).testimonials)) {
        return (response as any).testimonials;
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des témoignages:', error);
      // Retourner un tableau vide en cas d'erreur pour ne pas casser l'affichage
      return [];
    }
  }

  /**
   * Récupère un témoignage par son ID
   */
  async getTestimonialById(id: string | number): Promise<Testimonial | null> {
    try {
      const response = await apiRequest<any>(`${this.baseEndpoint}/${id}`, {
        method: 'GET',
      });

      const responseData = (response as any).data || response;
      return responseData as unknown as Testimonial;
    } catch (error) {
      console.error(`Erreur lors de la récupération du témoignage ${id}:`, error);
      return null;
    }
  }

  /**
   * Crée un nouveau témoignage (étudiant ou admin)
   */
  async createTestimonial(data: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>): Promise<Testimonial> {
    try {
      const response = await apiRequest<any>(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const responseData = (response as any).data || response;
      return responseData as unknown as Testimonial;
    } catch (error: any) {
      console.error('Erreur lors de la création du témoignage:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Impossible de créer le témoignage';
      throw new Error(errorMessage);
    }
  }

  /**
   * Met à jour un témoignage (admin seulement)
   */
  async updateTestimonial(id: string | number, data: Partial<Testimonial>): Promise<Testimonial> {
    const response = await apiRequest<any>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const responseData = (response as any).data || response;
    return responseData as unknown as Testimonial;
  }

  /**
   * Supprime un témoignage (admin seulement)
   */
  async deleteTestimonial(id: string | number): Promise<void> {
    await apiRequest(`${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Active/désactive un témoignage (admin seulement)
   */
  async toggleTestimonialStatus(id: string | number, isActive: boolean): Promise<Testimonial> {
    return this.updateTestimonial(id, { is_active: isActive });
  }

  /**
   * Approuve un témoignage (admin seulement)
   */
  async approveTestimonial(id: string | number): Promise<Testimonial> {
    const response = await apiRequest<any>(`${this.baseEndpoint}/${id}/approve`, {
      method: 'POST',
    });

    const responseData = (response as any).data || response;
    return responseData as unknown as Testimonial;
  }

  /**
   * Rejette un témoignage (admin seulement)
   */
  async rejectTestimonial(id: string | number, reason?: string): Promise<Testimonial> {
    const response = await apiRequest<any>(`${this.baseEndpoint}/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    const responseData = (response as any).data || response;
    return responseData as unknown as Testimonial;
  }
}

export const testimonialService = new TestimonialService();
