'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Download, CheckCircle, X } from 'lucide-react';
import Button from '../ui/Button';

interface NotificationBadgeProps {
  type: 'badge' | 'certificate' | 'xp' | 'level' | 'success';
  title: string;
  message: string;
  icon?: React.ReactNode;
  show?: boolean;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  duration?: number;
}

export default function NotificationBadge({
  type,
  title,
  message,
  icon,
  show = true,
  onClose,
  onAction,
  actionLabel,
  duration = 5000,
}: NotificationBadgeProps) {
  const [visible, setVisible] = useState(show);
  const [animation, setAnimation] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimation('entering');
      
      setTimeout(() => {
        setAnimation('visible');
      }, 100);

      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setAnimation('exiting');
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case 'badge':
        return 'bg-orange-500 border-orange-600';
      case 'certificate':
        return 'bg-green-500 border-green-600';
      case 'xp':
        return 'bg-blue-500 border-blue-600';
      case 'level':
        return 'bg-purple-500 border-purple-600';
      case 'success':
        return 'bg-green-500 border-green-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'badge':
        return <Trophy className="h-6 w-6" />;
      case 'certificate':
        return <Award className="h-6 w-6" />;
      case 'xp':
        return <Trophy className="h-6 w-6" />;
      case 'level':
        return <CheckCircle className="h-6 w-6" />;
      case 'success':
        return <CheckCircle className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const animationClasses = {
    entering: 'translate-x-full opacity-0',
    visible: 'translate-x-0 opacity-100',
    exiting: 'translate-x-full opacity-0',
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div
        className={`
          ${getColors()} 
          text-white 
          rounded-lg 
          shadow-xl 
          p-4 
          transform 
          transition-all 
          duration-300 
          ${animationClasses[animation]}
        `}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4 pr-8">
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-1">{title}</h4>
            <p className="text-sm text-white/90">{message}</p>

            {/* Actions */}
            {onAction && actionLabel && (
              <div className="mt-3">
                <button
                  onClick={onAction}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{actionLabel}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour afficher facilement des notifications
export function useNotificationBadge() {
  const [notification, setNotification] = useState<Partial<NotificationBadgeProps> | null>(null);

  const showBadge = (config: Omit<NotificationBadgeProps, 'show'>) => {
    setNotification(config);
  };

  const hideBadge = () => {
    setNotification(null);
  };

  const NotificationComponent = notification ? (
    <NotificationBadge {...notification} show={!!notification} onClose={hideBadge} />
  ) : null;

  return {
    showBadge,
    hideBadge,
    NotificationComponent,
  };
}

