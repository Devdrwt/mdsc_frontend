import { apiRequest } from './api';

export interface PaymentProvider {
  id: number;
  provider_name: 'kkiapay' | 'fedapay';
  is_sandbox: boolean;
  public_key?: string | null; // Clé publique pour initialiser le widget
}

/**
 * Récupérer les providers de paiement actifs
 */
export async function getActivePaymentProviders(): Promise<PaymentProvider[]> {
  try {
    console.log('[PaymentProviders] 🔍 Récupération des providers actifs...');
    
    const response = await apiRequest<{ success: boolean; data: PaymentProvider[] }>('/payments/providers', {
      method: 'GET',
    });
    
    console.log('[PaymentProviders] ✅ Réponse reçue:', {
      success: response.success,
      dataLength: response.data?.length || 0,
    });
    
    if (response.success && response.data) {
      const providers = Array.isArray(response.data) ? response.data : [];
      console.log('[PaymentProviders] ✅ Providers actifs:', providers.length);
      return providers;
    }
    
    console.warn('[PaymentProviders] ⚠️ Réponse invalide ou vide');
    return [];
  } catch (error: any) {
    console.error('[PaymentProviders] ❌ Erreur lors de la récupération des providers actifs:', error);
    console.error('[PaymentProviders] ❌ Détails:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    
    // Si c'est une erreur réseau ou serveur, lancer l'erreur pour que le composant puisse l'afficher
    if (error?.response?.status >= 500 || !error?.response) {
      throw new Error('Impossible de charger les providers de paiement. Veuillez réessayer plus tard.');
    }
    
    return [];
  }
}

export default {
  getActivePaymentProviders,
};

