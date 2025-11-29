'use client';

import React from 'react';

type RatingStarsSize = 'sm' | 'md' | 'lg';

interface RatingStarsProps {
  value?: number;
  max?: number;
  size?: RatingStarsSize;
  showValue?: boolean;
  className?: string;
  count?: number;
  valueClassName?: string;
}

const STAR_SIZES: Record<RatingStarsSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const StarShape = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-full h-full ${className ?? ''}`}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M12 .587l3.668 7.431 8.207 1.193-5.938 5.787 1.403 8.17L12 18.896l-7.34 3.872 1.403-8.17L.125 9.211l8.207-1.193z"
      fill="currentColor"
    />
  </svg>
);

export default function RatingStars({
  value = 0,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
  count,
  valueClassName = 'text-sm font-semibold text-gray-900',
}: RatingStarsProps) {
  const safeMax = Math.max(1, Math.floor(max));
  const clampedValue = Math.max(0, Math.min(value, safeMax));
  const starSize = STAR_SIZES[size];

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: safeMax }).map((_, index) => {
          const fillPercentage = Math.max(0, Math.min(1, clampedValue - index));
          return (
            <div
              key={`rating-star-${index}`}
              className="relative"
              style={{ width: starSize, height: starSize }}
            >
              <StarShape className="text-gray-300" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <StarShape className="text-yellow-400" />
              </div>
            </div>
          );
        })}
      </div>

      {showValue && (
        <span className={valueClassName}>
          {clampedValue.toFixed(1)} / {safeMax}
        </span>
      )}

      {typeof count === 'number' && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </div>
  );
}


