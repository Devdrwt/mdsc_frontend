import { apiRequest } from './api';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class ContactService {
  /**
   * Envoie un message de contact via le formulaire
   * @param data Les données du formulaire de contact
   * @returns La réponse de l'API
   */
  static async sendContactMessage(data: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await apiRequest('/contact/send', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || undefined,
          subject: data.subject.trim(),
          message: data.message.trim(),
          recipient_email: 'info@mdscbenin.org', // Email de destination
        }),
      });

      return {
        success: true,
        message: response.message || 'Votre message a été envoyé avec succès',
        data: response.data || response,
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message de contact:', error);
      throw error;
    }
  }
}

