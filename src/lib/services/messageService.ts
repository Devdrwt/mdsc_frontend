import { apiRequest } from './api';

export interface Message {
  id: string;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  subject: string;
  content: string;
  type: 'direct' | 'announcement' | 'system';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface MessageStats {
  unreadCount: number;
  totalReceived: number;
  totalSent: number;
}

export class MessageService {
  // Envoyer un message
  static async sendMessage(data: {
    receiverId: number;
    subject: string;
    content: string;
    type?: 'direct' | 'announcement' | 'system';
  }): Promise<Message> {
    const response = await apiRequest('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Récupérer les messages reçus
  static async getReceivedMessages(limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await apiRequest(`/messages/received?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Récupérer les messages envoyés
  static async getSentMessages(limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await apiRequest(`/messages/sent?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Récupérer un message spécifique
  static async getMessage(messageId: string): Promise<Message> {
    const response = await apiRequest(`/messages/${messageId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Marquer un message comme lu
  static async markAsRead(messageId: string): Promise<void> {
    await apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Supprimer un message
  static async deleteMessage(messageId: string): Promise<void> {
    await apiRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Récupérer les statistiques de messages
  static async getStats(): Promise<MessageStats> {
    try {
      const response = await apiRequest('/messages/stats', {
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      // Si la route n'existe pas (404), retourner des stats vides
      if (error.statusCode === 404) {
        console.warn('Route /messages/stats not implemented yet, returning default stats');
        return {
          unreadCount: 0,
          totalReceived: 0,
          totalSent: 0,
        };
      }
      throw error;
    }
  }
}

// Export par défaut
export default MessageService;

// Export nommé pour compatibilité
export const messageService = MessageService;
