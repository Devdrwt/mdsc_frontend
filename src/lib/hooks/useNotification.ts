'use client';

import { useEffect, useState } from 'react';
import { NotificationService, Notification } from '../services/notificationService';

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = NotificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    return NotificationService.add(notification);
  };

  const removeNotification = (id: string) => {
    NotificationService.remove(id);
  };

  const clearNotifications = () => {
    NotificationService.clear();
  };

  const success = (title: string, message?: string, duration?: number) => {
    return NotificationService.success(title, message, duration);
  };

  const error = (title: string, message?: string, duration?: number) => {
    return NotificationService.error(title, message, duration);
  };

  const warning = (title: string, message?: string, duration?: number) => {
    return NotificationService.warning(title, message, duration);
  };

  const info = (title: string, message?: string, duration?: number) => {
    return NotificationService.info(title, message, duration);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info
  };
}
