'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModernCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function ModernCard({
  title,
  children,
  className = '',
  hover = true,
  gradient = false,
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBg = 'bg-gray-100'
}: ModernCardProps) {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-100 p-6
      ${hover ? 'hover:shadow-lg hover:scale-105' : ''}
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
      transition-all duration-300
      ${className}
    `}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {Icon && (
            <div className={`${iconBg} p-2 rounded-lg`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
