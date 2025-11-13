import { apiRequest } from './api';

// ──────────────────────────────────────────────────────────────
// 1. Types alignés avec le BACKEND
// ──────────────────────────────────────────────────────────────

export interface UserInfo {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  profile_picture?: string | null;
}

export interface MessageEntry {
  id: number | string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;

  // Objets imbriqués (comme le backend)
  sender: UserInfo;
  recipient: UserInfo;
}

export interface PaginatedMessages {
  messages: MessageEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConversationEntry {
  conversation_email: string;
  conversation_name: string;
  message_count: number;
  unread_count: number;
  last_message_at: string;
  last_subject: string;
}

export interface MessageStats {
  unread_count: number;
  received_count: number;
  sent_count: number;
}

// ──────────────────────────────────────────────────────────────
// 2. Payloads
// ──────────────────────────────────────────────────────────────

export interface MessagePayload {
  recipient_id?: number | string;
  recipient_email?: string;
  receiverEmail?: string;
  subject: string;
  content: string;
  message_type?: string;
}

export interface BroadcastMessagePayload {
  courseId: string | number;
  subject: string;
  content: string;
  type?: string;
}

// ──────────────────────────────────────────────────────────────
// 3. Service
// ──────────────────────────────────────────────────────────────

export class MessageService {
  static async sendMessage(data: MessagePayload): Promise<MessageEntry> {
    const { receiverEmail, ...rest } = data;
    const payload = receiverEmail ? { ...rest, recipient_email: receiverEmail } : rest;

    const response = await apiRequest('/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  static async getReceivedMessages(params?: { page?: number; limit?: number; unread_only?: boolean }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.unread_only) searchParams.append('unread_only', 'true');

    const response = await apiRequest(`/messages/received?${searchParams.toString()}`, { method: 'GET' });
    return response.data ?? { messages: [] };
  }

  static async getSentMessages(params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await apiRequest(`/messages/sent?${searchParams.toString()}`, { method: 'GET' });
    return response.data ?? { messages: [] };
  }

  static async getCourseMessages(courseId: string | number, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await apiRequest(`/messages/course/${courseId}${query ? `?${query}` : ''}`, { method: 'GET' });
    return response.data ?? { messages: [] };
  }

  static async sendBroadcastMessage(data: BroadcastMessagePayload): Promise<void> {
    await apiRequest('/messages/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        course_id: data.courseId,
        subject: data.subject,
        content: data.content,
        message_type: data.type ?? 'broadcast',
      }),
    });
  }

  static async getMyConversations(): Promise<ConversationEntry[]> {
    const response = await apiRequest('/messages/conversations', { method: 'GET' });
    return response.data ?? [];
  }

  static async getConversationByEmail(email: string): Promise<MessageEntry[]> {
    const response = await apiRequest(`/messages/conversations/${encodeURIComponent(email)}`, { method: 'GET' });
    return response.data.messages ?? [];
  }

  static async getMessage(id: string | number): Promise<MessageEntry> {
    const response = await apiRequest(`/messages/${id}`, { method: 'GET' });
    return response.data;
  }

  static async markAsRead(id: string | number): Promise<void> {
    try {
      await apiRequest(`/messages/${id}/read`, { method: 'PUT' });
    } catch (error: any) {
      // Ignorer silencieusement les erreurs 404 (message non trouvé) - peut arriver si le message a été supprimé
      if (error?.status === 404) {
        console.debug('Message non trouvé lors du marquage comme lu (peut être supprimé):', id);
        return;
      }
      // Relancer les autres erreurs
      throw error;
    }
  }

  static async deleteMessage(id: string | number): Promise<void> {
    await apiRequest(`/messages/${id}`, { method: 'DELETE' });
  }

  static async getMessageStats(): Promise<MessageStats> {
    const response = await apiRequest('/messages/stats', { method: 'GET' });
    return response.data ?? { unread_count: 0, received_count: 0, sent_count: 0 };
  }

  // Alias pour compatibilité avec le code existant
  static async getStats(): Promise<MessageStats> {
    return this.getMessageStats();
  }

  static async searchUsersByEmail(email: string): Promise<UserInfo[]> {
    const response = await apiRequest(`/messages/search-users?email=${encodeURIComponent(email)}`, { method: 'GET' });
    return response.data ?? [];
  }
}

export default MessageService;

// import { apiRequest } from './api';

// export interface MessagePayload {
//   subject: string;
//   content: string;
//   type?: 'direct' | 'announcement' | string;
//   recipient_id?: number | string;
//   recipient_email?: string;
//   courseId?: string;
// }

// export interface BroadcastMessagePayload {
//   courseId: string | number;
//   subject: string;
//   content: string;
//   type?: 'broadcast' | string;
// }

// export interface MessageEntry {
//   id: number | string;
//   subject: string;
//   content: string;
//   type: string;
//   sender_id: number | string;
//   sender_email?: string;
//   sender_name?: string;
//   recipient_id: number | string;
//   recipient_email?: string;
//   recipient_name?: string;
//   is_read: boolean;
//   created_at: string;
//   updated_at?: string;
// }

// export interface PaginatedMessages {
//   messages: MessageEntry[];
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     total_pages: number;
//   };
// }

// export interface ConversationEntry {
//   email: string;
//   name?: string;
//   last_message?: MessageEntry;
//   unread_count?: number;
// }

// export interface MessageStats {
//   received_unread?: number;
//   sent_count?: number;
//   conversations_count?: number;
//   last_received_at?: string;
// }

// export class MessageService {
//   static async sendMessage(data: MessagePayload): Promise<MessageEntry> {
//     const response = await apiRequest('/messages/send', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//     return response.data;
//   }

//   static async getReceivedMessages(params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
//     const searchParams = new URLSearchParams();
//     if (params?.page) searchParams.append('page', String(params.page));
//     if (params?.limit) searchParams.append('limit', String(params.limit));

//     const response = await apiRequest(`/messages/received?${searchParams.toString()}`, {
//       method: 'GET',
//     });

//     return response.data ?? { messages: [] };
//   }

//   static async getSentMessages(params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
//     const searchParams = new URLSearchParams();
//     if (params?.page) searchParams.append('page', String(params.page));
//     if (params?.limit) searchParams.append('limit', String(params.limit));

//     const response = await apiRequest(`/messages/sent?${searchParams.toString()}`, {
//       method: 'GET',
//     });

//     return response.data ?? { messages: [] };
//   }

//   static async getCourseMessages(courseId: string | number, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
//     const searchParams = new URLSearchParams();
//     if (params?.page) searchParams.append('page', String(params.page));
//     if (params?.limit) searchParams.append('limit', String(params.limit));

//     const query = searchParams.toString();
//     const response = await apiRequest(`/messages/course/${encodeURIComponent(String(courseId))}${query ? `?${query}` : ''}`, {
//       method: 'GET',
//     });

//     return response.data ?? { messages: [] };
//   }

//   static async sendBroadcastMessage(data: BroadcastMessagePayload): Promise<void> {
//     await apiRequest('/messages/broadcast', {
//       method: 'POST',
//       body: JSON.stringify({
//         course_id: data.courseId,
//         subject: data.subject,
//         content: data.content,
//         type: data.type ?? 'broadcast',
//       }),
//     });
//   }

//   static async getConversations(): Promise<ConversationEntry[]> {
//     const response = await apiRequest('/messages/conversations', {
//       method: 'GET',
//     });

//     return response.data ?? [];
//   }

//   static async getConversationByEmail(email: string, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
//     const searchParams = new URLSearchParams();
//     if (params?.page) searchParams.append('page', String(params.page));
//     if (params?.limit) searchParams.append('limit', String(params.limit));

//     const response = await apiRequest(`/messages/conversations/${encodeURIComponent(email)}?${searchParams.toString()}`, {
//       method: 'GET',
//     });

//     return response.data ?? { messages: [] };
//   }

//   static async getMessageById(id: string | number): Promise<MessageEntry> {
//     const response = await apiRequest(`/messages/${id}`, {
//       method: 'GET',
//     });

//     return response.data;
//   }

//   static async markAsRead(id: string | number): Promise<void> {
//     await apiRequest(`/messages/${id}/read`, {
//       method: 'PUT',
//     });
//   }

//   static async deleteMessage(id: string | number): Promise<void> {
//     await apiRequest(`/messages/${id}`, {
//       method: 'DELETE',
//     });
//   }

//   static async getStats(): Promise<MessageStats> {
//     const response = await apiRequest('/messages/stats', {
//       method: 'GET',
//     });

//     return response.data ?? {};
//   }

//   static async search(query: string, params?: { page?: number; limit?: number }): Promise<PaginatedMessages> {
//     const searchParams = new URLSearchParams();
//     searchParams.append('q', query);
//     if (params?.page) searchParams.append('page', String(params.page));
//     if (params?.limit) searchParams.append('limit', String(params.limit));

//     const response = await apiRequest(`/messages/search?${searchParams.toString()}`, {
//       method: 'GET',
//     });

//     return response.data ?? { messages: [] };
//   }
// }

// export default MessageService;
