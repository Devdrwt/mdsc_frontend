import { apiRequest } from './api';

export interface MessagePayload {
  subject: string;
  content: string;
  type?: 'direct' | 'announcement' | string;
  recipient_id?: number | string;
  recipient_email?: string;
}

export interface MessageEntry {
  id: number | string;
  subject: string;
  content: string;
  type: string;
  sender_id: number | string;
  sender_email?: string;
  sender_name?: string;
  recipient_id: number | string;
  recipient_email?: string;
  recipient_name?: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedMessages {
  messages: MessageEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ConversationEntry {
  email: string;
  name?: string;
  last_message?: MessageEntry;
  unread_count?: number;
}

export interface MessageStats {
  received_unread?: number;
  sent_count?: number;
  conversations_count?: number;
  last_received_at?: string;
}

export class MessageService {
  static async sendMessage(data: MessagePayload): Promise<MessageEntry> {
    const response = await apiRequest('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async getReceivedMessages(params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/messages/received?${searchParams.toString()}`, {
      method: 'GET',
    });

    return response.data ?? { messages: [] };
  }

  static async getSentMessages(params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/messages/sent?${searchParams.toString()}`, {
      method: 'GET',
    });

    return response.data ?? { messages: [] };
  }

  static async getConversations(): Promise<ConversationEntry[]> {
    const response = await apiRequest('/messages/conversations', {
      method: 'GET',
    });

    return response.data ?? [];
  }

  static async getConversationByEmail(email: string, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/messages/conversations/${encodeURIComponent(email)}?${searchParams.toString()}`, {
      method: 'GET',
    });

    return response.data ?? { messages: [] };
  }

  static async getMessageById(id: string | number): Promise<MessageEntry> {
    const response = await apiRequest(`/messages/${id}`, {
      method: 'GET',
    });

    return response.data;
  }

  static async markAsRead(id: string | number): Promise<void> {
    await apiRequest(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  static async deleteMessage(id: string | number): Promise<void> {
    await apiRequest(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  static async getStats(): Promise<MessageStats> {
    const response = await apiRequest('/messages/stats', {
      method: 'GET',
    });

    return response.data ?? {};
  }

  static async search(query: string, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/messages/search?${searchParams.toString()}`, {
      method: 'GET',
    });

    return response.data ?? { messages: [] };
  }
}

export default MessageService;
