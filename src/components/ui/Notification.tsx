'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const typeClasses = {
  success: {
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700'
  },
  error: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700'
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700'
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700'
  }
};

export default function Notification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right'
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const typeConfig = typeClasses[type];
  const Icon = typeConfig.icon;

  // Animation d'entrée
  useEffect(() => {
    // Petit délai pour déclencher l'animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Auto-fermeture
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Durée de l'animation de sortie
  };

  // Classes d'animation selon la position
  const getAnimationClasses = () => {
    const baseClasses = 'transform transition-all duration-300 ease-out';
    
    if (isExiting) {
      if (position === 'top-right' || position === 'bottom-right') {
        return `${baseClasses} translate-x-full opacity-0`;
      } else {
        return `${baseClasses} -translate-x-full opacity-0`;
      }
    }
    
    if (isVisible) {
      return `${baseClasses} translate-x-0 translate-y-0 opacity-100`;
    }
    
    // État initial (avant l'animation)
    if (position === 'top-right' || position === 'bottom-right') {
      return `${baseClasses} translate-x-full opacity-0`;
    } else {
      return `${baseClasses} -translate-x-full opacity-0`;
    }
  };

  return (
    <div className={`max-w-sm w-full ${getAnimationClasses()}`}>
      <div className={`
        ${typeConfig.bg} ${typeConfig.border} border-2 rounded-xl shadow-2xl
        backdrop-blur-sm
      `}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 p-2 ${typeConfig.iconBg} rounded-lg`}>
              <Icon className={`h-5 w-5 ${typeConfig.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${typeConfig.titleColor}`}>
                {title}
              </p>
              {message && (
                <p className={`mt-1 text-sm ${typeConfig.messageColor}`}>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
