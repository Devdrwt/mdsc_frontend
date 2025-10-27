import { apiRequest } from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'quiz' | 'achievement' | 'badge' | 'certificate' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  metadata?: any;
  createdAt: string;
  timestamp: string;
  readAt?: string;
  archivedAt?: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  courseNotifications: boolean;
  quizNotifications: boolean;
  achievementNotifications: boolean;
  badgeNotifications: boolean;
  certificateNotifications: boolean;
  reminderNotifications: boolean;
  marketingNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  message: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  targetAudience: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  archivedNotifications: number;
  notificationsByType: Array<{
    type: string;
    count: number;
  }>;
  notificationsByPriority: Array<{
    priority: string;
    count: number;
  }>;
  averageReadTime: number;
  engagementRate: number;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  metadata?: any;
}

export interface UpdateNotificationData {
  title?: string;
  message?: string;
  type?: string;
  priority?: string;
  metadata?: any;
}

export interface CreateNotificationTemplateData {
  name: string;
  type: string;
  subject: string;
  message: string;
  variables: string[];
}

export interface UpdateNotificationTemplateData {
  name?: string;
  type?: string;
  subject?: string;
  message?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface CreateNotificationCampaignData {
  name: string;
  description: string;
  templateId: string;
  targetAudience: string;
  scheduledAt: string;
}

export interface UpdateNotificationCampaignData {
  name?: string;
  description?: string;
  templateId?: string;
  targetAudience?: string;
  scheduledAt?: string;
  status?: string;
}

export interface NotificationFilter {
  type?: string;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface NotificationExport {
  format: 'csv' | 'xlsx' | 'pdf';
  data: Notification[];
  filename: string;
  generatedAt: string;
}

// Service principal
export class NotificationService {
  // Récupérer toutes les notifications de l'utilisateur
  static async getNotifications(filter?: NotificationFilter): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.isRead !== undefined) params.append('isRead', filter.isRead.toString());
    if (filter?.isArchived !== undefined) params.append('isArchived', filter.isArchived.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);

    const response = await apiRequest(`/notifications?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer une notification par ID
  static async getNotification(notificationId: string): Promise<Notification> {
    const response = await apiRequest(`/notifications/${notificationId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications non lues
  static async getUnreadNotifications(): Promise<Notification[]> {
    const response = await apiRequest('/notifications/unread', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par type
  static async getNotificationsByType(type: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/type/${type}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par priorité
  static async getNotificationsByPriority(priority: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/priority/${priority}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer une nouvelle notification
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une notification
  static async updateNotification(notificationId: string, data: UpdateNotificationData): Promise<Notification> {
    const response = await apiRequest(`/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(): Promise<void> {
    await apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Archiver une notification
  static async archiveNotification(notificationId: string): Promise<Notification> {
    const response = await apiRequest(`/notifications/${notificationId}/archive`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // Archiver toutes les notifications
  static async archiveAllNotifications(): Promise<void> {
    await apiRequest('/notifications/archive-all', {
      method: 'PATCH',
    });
  }

  // Supprimer une notification
  static async deleteNotification(notificationId: string): Promise<void> {
    await apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Supprimer toutes les notifications archivées
  static async deleteArchivedNotifications(): Promise<void> {
    await apiRequest('/notifications/delete-archived', {
      method: 'DELETE',
    });
  }

  // Récupérer les paramètres de notification
  static async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiRequest('/notifications/settings', {
      method: 'GET',
    });
    return response.data;
  }

  // Mettre à jour les paramètres de notification
  static async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiRequest('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  // Récupérer les statistiques de notification
  static async getNotificationStats(): Promise<NotificationStats> {
    const response = await apiRequest('/notifications/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les modèles de notification
  static async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiRequest('/notifications/templates', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un modèle de notification
  static async getNotificationTemplate(templateId: string): Promise<NotificationTemplate> {
    const response = await apiRequest(`/notifications/templates/${templateId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer un nouveau modèle de notification
  static async createNotificationTemplate(data: CreateNotificationTemplateData): Promise<NotificationTemplate> {
    const response = await apiRequest('/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour un modèle de notification
  static async updateNotificationTemplate(templateId: string, data: UpdateNotificationTemplateData): Promise<NotificationTemplate> {
    const response = await apiRequest(`/notifications/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer un modèle de notification
  static async deleteNotificationTemplate(templateId: string): Promise<void> {
    await apiRequest(`/notifications/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Récupérer toutes les campagnes de notification
  static async getNotificationCampaigns(): Promise<NotificationCampaign[]> {
    const response = await apiRequest('/notifications/campaigns', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer une campagne de notification
  static async getNotificationCampaign(campaignId: string): Promise<NotificationCampaign> {
    const response = await apiRequest(`/notifications/campaigns/${campaignId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Créer une nouvelle campagne de notification
  static async createNotificationCampaign(data: CreateNotificationCampaignData): Promise<NotificationCampaign> {
    const response = await apiRequest('/notifications/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Mettre à jour une campagne de notification
  static async updateNotificationCampaign(campaignId: string, data: UpdateNotificationCampaignData): Promise<NotificationCampaign> {
    const response = await apiRequest(`/notifications/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Supprimer une campagne de notification
  static async deleteNotificationCampaign(campaignId: string): Promise<void> {
    await apiRequest(`/notifications/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  // Envoyer une campagne de notification
  static async sendNotificationCampaign(campaignId: string): Promise<void> {
    await apiRequest(`/notifications/campaigns/${campaignId}/send`, {
      method: 'POST',
    });
  }

  // Planifier une campagne de notification
  static async scheduleNotificationCampaign(campaignId: string, scheduledAt: string): Promise<void> {
    await apiRequest(`/notifications/campaigns/${campaignId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    });
  }

  // Annuler une campagne de notification
  static async cancelNotificationCampaign(campaignId: string): Promise<void> {
    await apiRequest(`/notifications/campaigns/${campaignId}/cancel`, {
      method: 'POST',
    });
  }

  // Exporter les notifications
  static async exportNotifications(filter?: NotificationFilter, format: string = 'csv'): Promise<NotificationExport> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.isRead !== undefined) params.append('isRead', filter.isRead.toString());
    if (filter?.isArchived !== undefined) params.append('isArchived', filter.isArchived.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);
    params.append('format', format);

    const response = await apiRequest(`/notifications/export?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Rechercher des notifications
  static async searchNotifications(query: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par période
  static async getNotificationsByPeriod(period: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/period/${period}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par utilisateur
  static async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/user/${userId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par cours
  static async getNotificationsByCourse(courseId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par quiz
  static async getNotificationsByQuiz(quizId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/quiz/${quizId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par réalisation
  static async getNotificationsByAchievement(achievementId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/achievement/${achievementId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par badge
  static async getNotificationsByBadge(badgeId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/badge/${badgeId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par certificat
  static async getNotificationsByCertificate(certificateId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/certificate/${certificateId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par rappel
  static async getNotificationsByReminder(reminderId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/reminder/${reminderId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par marque
  static async getNotificationsByBrand(brandId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/brand/${brandId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par catégorie
  static async getNotificationsByCategory(categoryId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/category/${categoryId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par niveau
  static async getNotificationsByLevel(levelId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/level/${levelId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par instructeur
  static async getNotificationsByInstructor(instructorId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/instructor/${instructorId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par étudiant
  static async getNotificationsByStudent(studentId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/student/${studentId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les notifications par administrateur
  static async getNotificationsByAdmin(adminId: string): Promise<Notification[]> {
    const response = await apiRequest(`/notifications/admin/${adminId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Gestion des notifications en temps réel
  private static listeners: ((notifications: Notification[]) => void)[] = [];
  private static notifications: Notification[] = [];

  // S'abonner aux notifications
  static subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Ajouter une notification
  static add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
    };
    this.notifications.push(newNotification);
    this.notifyListeners();
    return id;
  }

  // Supprimer une notification
  static remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Vider les notifications
  static clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Notifier les écouteurs
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Méthodes de notification rapides
  static success(title: string, message?: string, duration?: number): string {
    return this.add({
      title,
      message: message || '',
      type: 'success',
      priority: 'medium',
      isRead: false,
      isArchived: false,
      userId: '',
      createdAt: new Date().toISOString(),
    });
  }

  static error(title: string, message?: string, duration?: number): string {
    return this.add({
      title,
      message: message || '',
      type: 'error',
      priority: 'high',
      isRead: false,
      isArchived: false,
      userId: '',
      createdAt: new Date().toISOString(),
    });
  }

  static warning(title: string, message?: string, duration?: number): string {
    return this.add({
      title,
      message: message || '',
      type: 'warning',
      priority: 'medium',
      isRead: false,
      isArchived: false,
      userId: '',
      createdAt: new Date().toISOString(),
    });
  }

  static info(title: string, message?: string, duration?: number): string {
    return this.add({
      title,
      message: message || '',
      type: 'info',
      priority: 'low',
      isRead: false,
      isArchived: false,
      userId: '',
      createdAt: new Date().toISOString(),
    });
  }
}

// Export par défaut
export default NotificationService;