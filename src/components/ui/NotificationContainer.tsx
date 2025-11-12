'use client';

import React, { useMemo } from 'react';
import { useNotification } from '../../lib/hooks/useNotification';
import Notification from './Notification';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
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
  position = 'top-right',
  maxNotifications = 5
}: NotificationContainerProps) {
  const { notifications, removeNotification } = useNotification();

  // Limiter le nombre de notifications affichées et les trier par timestamp
  const displayedNotifications = useMemo(() => {
    return notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxNotifications);
  }, [notifications, maxNotifications]);

  // Calculer l'offset vertical pour chaque notification (empilement)
  const getNotificationOffset = (index: number) => {
    return index * 80; // 80px d'espacement entre chaque notification
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" suppressHydrationWarning>
      {displayedNotifications.map((notification, index) => {
        const offset = getNotificationOffset(index);
        const isTop = position.includes('top');
        const isRight = position.includes('right');
        
        const style: React.CSSProperties = {
          position: 'fixed',
          zIndex: 9999 + index,
        };
        
        if (isTop) {
          style.top = `${16 + offset}px`;
        } else {
          style.bottom = `${16 + offset}px`;
        }
        
        if (isRight) {
          style.right = '16px';
        } else {
          style.left = '16px';
        }

        return (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={style}
          >
            <Notification
              id={notification.id}
              type={normalizeNotificationType(notification.type)}
              title={notification.title}
              message={notification.message}
              duration={notification.duration || 5000}
              position={position}
              onClose={removeNotification}
            />
          </div>
        );
      })}
    </div>
  );
}
