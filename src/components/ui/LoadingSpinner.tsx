'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const colorClasses = {
  blue: 'border-blue-600',
  green: 'border-green-600',
  yellow: 'border-yellow-600',
  red: 'border-red-600',
  purple: 'border-purple-600',
  orange: 'border-orange-600',
  gray: 'border-gray-600'
};

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`
        ${sizeClass} ${colorClass}
        border-2 border-t-transparent rounded-full animate-spin
      `}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}
