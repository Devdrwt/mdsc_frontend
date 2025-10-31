import { apiRequest } from './api';

export interface Message {
  id: string;
  senderId: number;
  senderName: string;
  receiverId?: number;
  receiverName?: string;
  courseId?: string;
  subject: string;
  content: string;
  type: 'direct' | 'announcement' | 'system' | 'broadcast';
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
    const data = response.data || [];
    return Array.isArray(data) ? data : [];
  }

  // Récupérer les messages envoyés
  static async getSentMessages(limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await apiRequest(`/messages/sent?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    const data = response.data || [];
    return Array.isArray(data) ? data : [];
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
    const response = await apiRequest('/messages/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les messages d'un cours (broadcast)
  static async getCourseMessages(courseId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await apiRequest(`/messages?courseId=${courseId}&limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    const data = response.data || [];
    return Array.isArray(data) ? data : [];
  }

  // Envoyer un message de broadcast à tous les participants d'un cours
  static async sendBroadcastMessage(data: {
    courseId: string;
    subject: string;
    content: string;
    type?: 'announcement' | 'broadcast';
  }): Promise<Message> {
    const response = await apiRequest(`/messages?courseId=${data.courseId}`, {
      method: 'POST',
      body: JSON.stringify({
        subject: data.subject,
        content: data.content,
        type: data.type || 'broadcast',
      }),
    });
    return response.data;
  }
}

// Export par défaut
export default MessageService;

// Export nommé pour compatibilité
export const messageService = MessageService;
