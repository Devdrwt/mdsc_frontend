'use client';

import React from 'react';
import { Trophy, Award, Star, Zap, Target, Flame } from 'lucide-react';
import { Badge, UserBadge } from '../../types/course';

interface BadgeCardProps {
  badge: Badge | UserBadge;
  earned?: boolean;
  progress?: number;
  className?: string;
  onClick?: () => void;
}

export default function BadgeCard({
  badge,
  earned = false,
  progress,
  className = '',
  onClick,
}: BadgeCardProps) {
  // Utiliser badge.badge si c'est un UserBadge
  const badgeData = 'badge' in badge && badge.badge ? badge.badge : badge as Badge;

  const getBadgeIcon = () => {
    const category = badgeData.category?.toLowerCase() || '';
    
    if (badgeData.icon_url || badgeData.iconUrl) {
      return (
        <img
          src={badgeData.icon_url || badgeData.iconUrl}
          alt={badgeData.name || 'Badge'}
          className="w-16 h-16 object-contain"
        />
      );
    }

    // Icônes par défaut selon la catégorie
    const iconClass = `w-16 h-16 ${earned ? 'text-mdsc-gold' : 'text-gray-400'}`;
    
    switch (category) {
      case 'achievement':
      case 'accomplissement':
        return <Trophy className={iconClass} />;
      case 'completion':
      case 'completion':
        return <Award className={iconClass} />;
      case 'expertise':
      case 'expertise':
        return <Star className={iconClass} />;
      case 'speed':
      case 'vitesse':
        return <Zap className={iconClass} />;
      case 'mastery':
      case 'maitrise':
        return <Target className={iconClass} />;
      default:
        return <Flame className={iconClass} />;
    }
  };

  return (
    <div
      className={`
        relative bg-white border-2 rounded-lg p-6 text-center transition-all
        ${earned 
          ? 'border-mdsc-gold shadow-lg hover:shadow-xl' 
          : 'border-gray-200 opacity-75 hover:border-gray-300'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Badge Earned Indicator */}
      {earned && (
        <div className="absolute -top-2 -right-2 bg-mdsc-gold text-white rounded-full p-1">
          <Award className="h-4 w-4" />
        </div>
      )}

      {/* Badge Icon */}
      <div className="flex justify-center mb-4">
        {getBadgeIcon()}
      </div>

      {/* Badge Name */}
      <h3 className={`text-lg font-bold mb-2 ${earned ? 'text-gray-900' : 'text-gray-600'}`}>
        {badgeData.name || 'Badge'}
      </h3>

      {/* Badge Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {badgeData.description || ''}
      </p>

      {/* Progress Bar (si pas encore gagné) */}
      {!earned && progress !== undefined && progress < 100 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progression</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Earned Date */}
      {'earnedAt' in badge && badge.earnedAt && (
        <p className="text-xs text-gray-500 mt-2">
          Obtenu le {new Date(badge.earnedAt).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  );
}
