import { apiRequest } from './api';

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'mobile_money';
  payment_provider?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  provider_transaction_id?: string;
  created_at: string;
}

export interface PaymentInitiation {
  courseId: string;
  paymentMethod: 'card' | 'mobile_money';
  paymentProvider?: string; // Pour mobile money: 'orange', 'mtn', 'moov'
}

export interface PaymentVerification {
  paymentId: string;
  transactionId?: string;
}

export class PaymentService {
  // Mode démo (simulation)
  private static readonly DEMO_MODE = process.env.NEXT_PUBLIC_PAYMENT_DEMO_MODE === 'true' || true; // Par défaut activé

  // Vérifier si le mode démo est activé
  static isDemoMode(): boolean {
    return this.DEMO_MODE;
  }

  // Initier un paiement
  static async initiatePayment(data: PaymentInitiation): Promise<Payment> {
    // Mode démo : simuler le paiement
    if (this.DEMO_MODE) {
      return this.simulatePayment(data);
    }

    // Mode réel : appeler l'API
    const response = await apiRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Simuler un paiement en mode démo
  private static async simulatePayment(data: PaymentInitiation): Promise<Payment> {
    // Simuler un délai de traitement (1-2 secondes)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Générer un ID de paiement simulé
    const paymentId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const transactionId = data.paymentMethod === 'card' 
      ? `card_${Math.random().toString(36).slice(2, 14).toUpperCase()}`
      : `mm_${data.paymentProvider}_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

    // Simuler un paiement réussi
    const payment: Payment = {
      id: paymentId,
      user_id: 'current_user', // Sera remplacé par le vrai user_id côté backend
      course_id: data.courseId,
      amount: 0, // Sera récupéré depuis le cours
      currency: 'XOF',
      payment_method: data.paymentMethod,
      payment_provider: data.paymentProvider,
      status: 'completed', // En démo, toujours réussi
      provider_transaction_id: transactionId,
      created_at: new Date().toISOString(),
    };

    return payment;
  }

  // Vérifier le statut d'un paiement
  static async verifyPayment(paymentId: string): Promise<Payment> {
    // Mode démo : retourner le paiement simulé
    if (this.DEMO_MODE && paymentId.startsWith('demo_')) {
      // Simuler un délai de vérification
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retourner un paiement simulé avec statut "completed"
      return {
        id: paymentId,
        user_id: 'current_user',
        course_id: '',
        amount: 0,
        currency: 'XOF',
        payment_method: 'card',
        status: 'completed',
        provider_transaction_id: `demo_tx_${paymentId}`,
        created_at: new Date().toISOString(),
      };
    }

    // Mode réel : appeler l'API
    const response = await apiRequest(`/payments/${paymentId}/status`, {
      method: 'GET',
    });
    return response.data;
  }

  // Obtenir l'historique des paiements de l'utilisateur
  static async getMyPayments(): Promise<Payment[]> {
    const response = await apiRequest('/payments/my-payments', {
      method: 'GET',
    });
    return response.data || [];
  }

  // Obtenir les détails d'un paiement
  static async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiRequest(`/payments/${paymentId}`, {
      method: 'GET',
    });
    return response.data;
  }
}

// Export de la fonction pour vérifier le mode démo
export const isDemoMode = (): boolean => {
  return PaymentService.isDemoMode();
};

// Export par défaut
export default PaymentService;

// Export nommé pour compatibilité
export const paymentService = PaymentService;

