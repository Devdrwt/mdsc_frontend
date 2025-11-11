'use client';

import React from 'react';
import { useNotification } from '../../lib/hooks/useNotification';
import Notification from './Notification';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

const INFO_TYPE_ALIASES = new Set(['course', 'quiz', 'achievement', 'badge', 'certificate', 'reminder']);
const NATIVE_TYPES = new Set<NotificationType>(['success', 'error', 'warning', 'info']);

const normalizeNotificationType = (type?: string): NotificationType => {
  if (!type) {
    return 'info';
  }

  if (INFO_TYPE_ALIASES.has(type)) {
    return 'info';
  }

  if (NATIVE_TYPES.has(type as NotificationType)) {
    return type as NotificationType;
  }

  if (type === 'danger') {
    return 'error';
  }

  return 'info';
};

export default function NotificationContainer({ 
  position = 'top-right' 
}: NotificationContainerProps) {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          type={normalizeNotificationType(notification.type)}
          title={notification.title}
          message={notification.message}
          duration={5000}
          position={position}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}
