'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Filter } from 'lucide-react';
import { Badge, UserBadge } from '../../types/course';
import { badgeService } from '../../lib/services/badgeService';
import BadgeCard from './BadgeCard';

interface BadgeCollectionProps {
  userId?: string;
  showProgress?: boolean;
  className?: string;
}

export default function BadgeCollection({
  userId,
  showProgress = true,
  className = '',
}: BadgeCollectionProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'available'>('all');
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBadges();
  }, [userId]);

  useEffect(() => {
    if (showProgress && filter === 'available') {
      loadBadgeProgress();
    }
  }, [filter, allBadges]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const [earned, available] = await Promise.all([
        badgeService.getUserBadges(),
        badgeService.getEligibleBadges(),
      ]);
      
      setUserBadges(earned || []);
      
      // Combiner tous les badges
      const allBadgesData = await badgeService.getAllBadges();
      setAllBadges(allBadgesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
      setUserBadges([]);
      setAllBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeProgress = async () => {
    const progressMap: Record<string, number> = {};
    
    for (const badge of allBadges) {
      const earnedIds = new Set(userBadges.map(ub => ub.badgeId));
      if (!earnedIds.has(badge.id)) {
        try {
          const progress = await badgeService.getBadgeProgress(badge.id);
          progressMap[badge.id] = progress;
        } catch (error) {
          progressMap[badge.id] = 0;
        }
      }
    }
    
    setBadgeProgress(progressMap);
  };

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const totalBadges = allBadges.length;
  const earnedCount = userBadges.length;
  const completionRate = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

  const filteredBadges = () => {
    switch (filter) {
      case 'earned':
        return userBadges.map(ub => ({ badge: ub, earned: true }));
      case 'available':
        return allBadges
          .filter(b => !earnedBadgeIds.has(b.id))
          .map(badge => ({ badge, earned: false, progress: badgeProgress[badge.id] || 0 }));
      default:
        const earnedMap = new Map(userBadges.map(ub => [ub.badgeId, ub]));
        return allBadges.map(badge => {
          const userBadge = earnedMap.get(badge.id);
          return {
            badge: userBadge || badge,
            earned: !!userBadge,
            progress: userBadge ? undefined : (badgeProgress[badge.id] || 0),
          };
        });
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des badges...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stats Header */}
      <div className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Trophy className="h-6 w-6" />
            <span>Mes Badges</span>
          </h2>
          <div className="text-right">
            <p className="text-3xl font-bold">{earnedCount}</p>
            <p className="text-white/80 text-sm">sur {totalBadges}</p>
          </div>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div
            className="bg-mdsc-orange h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-sm text-white/90">{Math.round(completionRate)}% complété</p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="h-5 w-5 text-gray-500" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-mdsc-blue-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({totalBadges})
        </button>
        <button
          onClick={() => setFilter('earned')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'earned'
              ? 'bg-mdsc-blue-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trophy className="h-4 w-4 inline mr-1" />
          Obtenus ({earnedCount})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'available'
              ? 'bg-mdsc-blue-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Target className="h-4 w-4 inline mr-1" />
          Disponibles ({totalBadges - earnedCount})
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBadges().map((item) => (
          <BadgeCard
            key={item.badge.id}
            badge={item.badge}
            earned={item.earned}
            progress={item.progress}
          />
        ))}
      </div>

      {filteredBadges().length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {filter === 'earned' 
              ? 'Aucun badge obtenu pour le moment'
              : filter === 'available'
              ? 'Aucun badge disponible'
              : 'Aucun badge disponible'
            }
          </p>
        </div>
      )}
    </div>
  );
}
