import { apiRequest } from './api';

export interface Payment {
  id: string;
  temp_payment_id?: string; // Pour Kkiapay et Fedapay, ID temporaire avant création dans le webhook
  user_id?: string;
  course_id: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'mobile_money' | 'kkiapay' | 'fedapay';
  payment_provider?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  provider_transaction_id?: string | null;
  created_at: string;
  redirect_url?: string | null;
  instructions?: any;
  metadata?: {
    public_key?: string;
    sandbox?: boolean | string;
    [key: string]: any;
  };
  raw?: any;
}

export interface PaymentInitiation {
  courseId: string;
  paymentMethod: 'card' | 'mobile_money' | 'kkiapay' | 'fedapay';
  paymentProvider?: string;
  customerFullname?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentVerification {
  paymentId: string;
  transactionId?: string;
}

export class PaymentService {
  private static readonly DEMO_MODE = process.env.NEXT_PUBLIC_PAYMENT_DEMO_MODE === 'true';

  static isDemoMode(): boolean {
    return this.DEMO_MODE;
  }

  static async initiatePayment(data: PaymentInitiation): Promise<Payment> {
    if (this.DEMO_MODE) {
      return this.simulatePayment(data);
    }

    const response = await apiRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const payload = response.data || {};
    
    // Pour Kkiapay et Fedapay, extraire public_key et environment depuis metadata
    let metadata = {};
    let publicKey = null;
    let sandbox = false;
    let environment = 'sandbox';
    
    if (data.paymentMethod === 'kkiapay') {
      const rawPaymentData =
        typeof payload.payment_data === 'string'
          ? (() => {
              try {
                return JSON.parse(payload.payment_data);
              } catch {
                return payload.payment_data;
              }
            })()
          : payload.payment_data;
      
      // Extraire public_key et sandbox depuis metadata
      const rawMetadata = rawPaymentData?.raw || rawPaymentData || {};
      publicKey = rawMetadata.public_key || null;
      sandbox = rawMetadata.sandbox === true || rawMetadata.sandbox === 'true';
      
      metadata = {
        public_key: publicKey,
        sandbox: sandbox,
        ...rawMetadata,
      };
    } else if (data.paymentMethod === 'fedapay') {
      const rawPaymentData =
        typeof payload.payment_data === 'string'
          ? (() => {
              try {
                return JSON.parse(payload.payment_data);
              } catch {
                return payload.payment_data;
              }
            })()
          : payload.payment_data;
      
      // Extraire public_key et environment depuis metadata (comme Kkiapay, pas de transaction_id)
      const rawMetadata = rawPaymentData?.raw || rawPaymentData || {};
      publicKey = rawMetadata.public_key || rawPaymentData?.public_key || null;
      environment = rawMetadata.environment || rawPaymentData?.environment || 'sandbox';
      
      metadata = {
        public_key: publicKey,
        environment: environment,
        ...rawMetadata,
      };
    } else {
      // Pour les autres providers (Kkiapay, etc.)
      const rawPaymentData =
        typeof payload.payment_data === 'string'
          ? (() => {
              try {
                return JSON.parse(payload.payment_data);
              } catch {
                return payload.payment_data;
              }
            })()
          : payload.payment_data;

      const instructions =
        rawPaymentData?.pay?.data?.payload ||
        rawPaymentData?.pay?.payload ||
        rawPaymentData?.pay?.data ||
        rawPaymentData?.pay ||
        rawPaymentData?.transaction?.data?.payload;

      metadata = {
        instructions,
        ...rawPaymentData,
      };
    }

    const redirectCandidate =
      payload.redirect_url ||
      payload.payment_url ||
      null;

    const amount = Number(
      payload.payment_data?.total ??
      payload.total ??
      payload.amount ??
      0
    );

    // Pour Kkiapay et Fedapay, utiliser temp_payment_id au lieu de payment_id
    const paymentId = (data.paymentMethod === 'kkiapay' || data.paymentMethod === 'fedapay')
      ? (payload.temp_payment_id || payload.data?.temp_payment_id || '')
      : (payload.payment_id ?? payload.temp_payment_id ?? '');

    return {
      id: String(paymentId),
      temp_payment_id: (data.paymentMethod === 'kkiapay' || data.paymentMethod === 'fedapay') ? String(paymentId) : undefined,
      user_id: String(payload.user_id ?? ''),
      course_id: data.courseId,
      amount,
      currency:
        payload.payment_data?.currency ||
        payload.currency ||
        'XOF',
      payment_method: data.paymentMethod,
      payment_provider: data.paymentProvider,
      status: (data.paymentMethod === 'kkiapay' || data.paymentMethod === 'fedapay') ? 'pending' : 'processing',
      provider_transaction_id:
        payload.provider_transaction_id ||
        null,
      redirect_url: redirectCandidate,
      metadata,
      created_at: new Date().toISOString(),
      raw: payload,
    };
  }

  private static async simulatePayment(data: PaymentInitiation): Promise<Payment> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const paymentId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const transactionId =
      data.paymentMethod === 'card'
        ? `card_${Math.random().toString(36).slice(2, 14).toUpperCase()}`
        : data.paymentMethod === 'mobile_money'
        ? `mm_${data.paymentProvider}_${Math.random().toString(36).slice(2, 12).toUpperCase()}`
        : `kkiapay_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

    const payment: Payment = {
      id: paymentId,
      user_id: 'current_user',
      course_id: data.courseId,
      amount: 0,
      currency: 'XOF',
      payment_method: data.paymentMethod,
      payment_provider: data.paymentProvider,
      status: 'completed',
      provider_transaction_id: transactionId,
      created_at: new Date().toISOString(),
      redirect_url: null,
    };

    return payment;
  }

  static async verifyPayment(paymentId: string): Promise<Payment> {
    if (this.DEMO_MODE && paymentId.startsWith('demo_')) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id: paymentId,
        user_id: 'current_user',
        course_id: '',
        amount: 0,
        currency: 'XOF',
        payment_method: 'kkiapay',
        payment_provider: 'kkiapay',
        status: 'completed',
        provider_transaction_id: `demo_tx_${paymentId}`,
        created_at: new Date().toISOString(),
        redirect_url: null,
      };
    }

    const response = await apiRequest(`/payments/${paymentId}/status`, {
      method: 'GET',
    });

    const payload = response.data || {};

    return {
      id: String(payload.id ?? paymentId),
      user_id: String(payload.user_id ?? ''),
      course_id: String(payload.course_id ?? ''),
      amount: Number(payload.amount ?? 0),
      currency: payload.currency || 'XOF',
        payment_method: (payload.payment_method || 'kkiapay') as Payment['payment_method'],
      payment_provider: payload.payment_provider,
      status: payload.status || 'processing',
      provider_transaction_id: payload.provider_transaction_id || null,
      created_at: payload.created_at || new Date().toISOString(),
      redirect_url: payload.redirect_url || null,
      raw: payload,
    };
  }

  static async getMyPayments(): Promise<Payment[]> {
    const response = await apiRequest('/payments/my-payments', {
      method: 'GET',
    });
    const payload = response.data?.payments || response.data || [];
    return Array.isArray(payload) ? payload : [];
  }

  static async getPayment(paymentId: string): Promise<Payment> {
    return this.verifyPayment(paymentId);
  }
}

export const isDemoMode = (): boolean => {
  return PaymentService.isDemoMode();
};

export default PaymentService;

export const paymentService = PaymentService;

