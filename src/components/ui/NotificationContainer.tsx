'use client';

import React from 'react';
import { useNotification } from '../../lib/hooks/useNotification';
import Notification from './Notification';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

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
          type={notification.type === 'course' || notification.type === 'quiz' || notification.type === 'achievement' || notification.type === 'badge' || notification.type === 'certificate' || notification.type === 'reminder' ? 'info' : notification.type}
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
