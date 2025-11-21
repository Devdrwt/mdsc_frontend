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
    const response = await apiRequest<{ success: boolean; data: PaymentProvider[] }>('/payments/providers', {
      method: 'GET',
    });
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des providers actifs:', error);
    return [];
  }
}

export default {
  getActivePaymentProviders,
};

