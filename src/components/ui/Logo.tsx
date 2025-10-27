import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showTagline = false, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <a href="/">
             <img
               src="/mdsc-logo1.png"
               alt="Maison de la Société Civile"
               className={`${sizeClasses[size]} w-auto object-contain`}
             />
      </a>
    </div>
  );
}
