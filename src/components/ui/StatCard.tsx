'use client';

import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    hover: 'group-hover:bg-blue-200',
    icon: 'text-blue-600',
    change: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    hover: 'group-hover:bg-green-200',
    icon: 'text-green-600',
    change: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    hover: 'group-hover:bg-yellow-200',
    icon: 'text-yellow-600',
    change: 'text-yellow-600'
  },
  red: {
    bg: 'bg-red-100',
    hover: 'group-hover:bg-red-200',
    icon: 'text-red-600',
    change: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-100',
    hover: 'group-hover:bg-purple-200',
    icon: 'text-purple-600',
    change: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-100',
    hover: 'group-hover:bg-orange-200',
    icon: 'text-orange-600',
    change: 'text-orange-600'
  },
  gray: {
    bg: 'bg-gray-100',
    hover: 'group-hover:bg-gray-200',
    icon: 'text-gray-600',
    change: 'text-gray-600'
  }
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  color = 'blue',
  className = ''
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`
      group bg-white rounded-xl shadow-sm border border-gray-100 p-6 
      hover:shadow-lg hover:scale-105 transition-all duration-300
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className={`flex items-center text-xs ${colors.change}`}>
              {change.type === 'increase' ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              <span>
                {change.value}% {change.period && change.period}
              </span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-3 rounded-full ${colors.hover} transition-colors`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
