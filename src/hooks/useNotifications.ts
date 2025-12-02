'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationService, NotificationEntry, NotificationFilters, NotificationListResponse } from '../lib/services/notificationService';

/**
 * Hook React pour gérer les notifications depuis l'API
 * @param filters Filtres pour les notifications (page, limit, type, is_read)
 * @returns Objet contenant les notifications, la pagination, le chargement, les erreurs et les fonctions de gestion
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [pagination, setPagination] = useState<NotificationListResponse['pagination']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(filters);
      setNotifications(response.notifications || []);
      setPagination(response.pagination || null);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération des notifications');
      setNotifications([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.type, filters.is_read, filters.upcoming]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number | string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (err: any) {
      console.error('Erreur lors du marquage de la notification:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch (err: any) {
      console.error('Erreur lors du marquage de toutes les notifications:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number | string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la notification:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    pagination,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}

