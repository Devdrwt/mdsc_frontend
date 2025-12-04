import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none';
  
  const variantClasses = {
    primary: 'bg-mdsc-blue-primary text-white hover:bg-mdsc-blue-dark hover:shadow-md hover:scale-105 active:scale-100 focus:ring-blue-200',
    secondary: 'bg-mdsc-orange text-white hover:bg-orange-600 hover:shadow-md hover:scale-105 active:scale-100 focus:ring-orange-500',
    outline: 'border-2 border-mdsc-blue-primary text-mdsc-blue-primary bg-transparent hover:bg-mdsc-blue-primary hover:text-white hover:shadow-md hover:scale-105 active:scale-100 focus:ring-blue-200',
    ghost: 'text-mdsc-blue-primary bg-transparent hover:bg-mdsc-blue-primary/10 hover:shadow-md hover:scale-105 active:scale-100 focus:ring-blue-200',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
