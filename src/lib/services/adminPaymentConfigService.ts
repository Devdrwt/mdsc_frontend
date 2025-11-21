import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './api';

export interface PaymentProvider {
  id?: number;
  provider_name: 'kkiapay' | 'fedapay';
  public_key: string; // Masquée dans la réponse
  secret_key: string; // Masquée dans la réponse
  private_key?: string | null; // Masquée dans la réponse
  is_active: boolean;
  is_sandbox: boolean;
  base_url?: string | null;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentProviderFormData {
  provider_name: 'kkiapay' | 'fedapay';
  public_key: string;
  secret_key: string;
  private_key?: string;
  is_active: boolean;
  is_sandbox: boolean;
  base_url?: string;
  metadata?: any;
}

/**
 * Récupérer tous les providers de paiement
 */
export async function getPaymentProviders(): Promise<PaymentProvider[]> {
  try {
    // apiGet retourne ApiResponse<T> où T est le type des données retournées par handleResponse
    // Le backend retourne { success: true, data: PaymentProvider[] }
    // handleResponse extrait data.data || data, donc response.data sera PaymentProvider[]
    const response = await apiGet<PaymentProvider[]>('/admin/payment-providers');
    
    if (response.success && response.data) {
      // response.data devrait être directement PaymentProvider[] après extraction par handleResponse
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    return [];
  } catch (error: any) {
    console.error('[getPaymentProviders] Error:', error);
    // Si c'est une erreur 404, la route n'existe peut-être pas encore
    if (error.status === 404) {
      console.warn('[getPaymentProviders] Route not found (404). Backend may need to be restarted.');
    }
    throw error;
  }
}

/**
 * Récupérer un provider par ID
 * @param id - ID du provider
 * @param forEdit - Si true, récupère les clés complètes (non masquées) pour l'édition
 */
export async function getPaymentProvider(id: number, forEdit: boolean = false): Promise<PaymentProvider> {
  const url = forEdit 
    ? `/admin/payment-providers/${id}?forEdit=true`
    : `/admin/payment-providers/${id}`;
  const response = await apiGet<PaymentProvider>(url);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Provider non trouvé');
}

/**
 * Créer un nouveau provider
 */
export async function createPaymentProvider(data: PaymentProviderFormData): Promise<PaymentProvider> {
  const response = await apiPost<PaymentProvider>('/admin/payment-providers', data);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Erreur lors de la création du provider');
}

/**
 * Mettre à jour un provider existant
 */
export async function updatePaymentProvider(
  id: number,
  data: Partial<PaymentProviderFormData>
): Promise<PaymentProvider> {
  const response = await apiPut<PaymentProvider>(`/admin/payment-providers/${id}`, data);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Erreur lors de la mise à jour du provider');
}

/**
 * Supprimer un provider
 */
export async function deletePaymentProvider(id: number): Promise<void> {
  const response = await apiDelete(`/admin/payment-providers/${id}`);
  if (!response.success) {
    throw new Error(response.message || 'Erreur lors de la suppression du provider');
  }
}

/**
 * Activer/désactiver un provider
 */
export async function togglePaymentProviderStatus(id: number): Promise<{ is_active: boolean }> {
  const response = await apiPatch<{ is_active: boolean }>(
    `/admin/payment-providers/${id}/toggle`
  );
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Erreur lors du changement de statut');
}

