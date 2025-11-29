'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Users, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { BadgeService } from '../../../lib/services/badgeService';
import { Badge, UserBadge } from '../../../types';
import toast from '../../../lib/utils/toast';

export default function GamificationAdmin() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [allUserBadges, setAllUserBadges] = useState<UserBadge[]>([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const allBadges = await BadgeService.getAllBadges();
      setBadges(allBadges || []);
      
      // Pour l'admin, on pourrait récupérer toutes les attributions de badges
      // Pour l'instant, on simule avec les badges de l'admin
      try {
        const userBadges = await BadgeService.getUserBadges();
        setAllUserBadges(userBadges || []);
      } catch (error) {
        console.error('Error loading user badges:', error);
        setAllUserBadges([]);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
      setAllUserBadges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkAndAward = async () => {
    try {
      setChecking(true);
      const result = await BadgeService.checkAndAward();
      if (result?.success) {
        toast.success('Badges mis à jour', result.message || 'Vérification effectuée avec succès.');
      } else {
        toast.info('Vérification terminée', result?.message || 'Aucun nouveau badge détecté.');
      }
      await load();
    } catch (error) {
      console.error('Erreur vérification badges:', error);
      toast.error('Impossible de vérifier les badges', (error as Error)?.message || 'Veuillez réessayer.');
    } finally {
      setChecking(false);
    }
  };

  // Calculer les statistiques
  const totalBadges = badges.length;
  const totalAttributions = allUserBadges.length;
  const badgesWithAttributions = new Set(allUserBadges.map(ub => ub.badgeId)).size;
  const averageAttributions = totalBadges > 0 ? (totalAttributions / totalBadges).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-mdsc-blue-dark to-mdsc-blue-primary rounded-lg p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
              Gestion de la Gamification
            </h1>
            <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
              Gérez les badges de la plateforme et surveillez leur attribution aux utilisateurs.
            </p>
          </div>
          <button 
            onClick={load} 
            className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-4">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Badges disponibles</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalBadges}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
              <Award className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total attributions</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalAttributions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
              <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Badges actifs</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{badgesWithAttributions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Moyenne attributions</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{averageAttributions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gestion des badges */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Gestion des Badges</h3>
          <button 
            onClick={checkAndAward} 
            disabled={checking} 
            className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-md bg-mdsc-blue-primary text-white hover:bg-mdsc-blue-dark dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {checking ? 'Vérification...' : 'Vérifier et attribuer'}
          </button>
        </div>

        {badges.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const attributionCount = allUserBadges.filter(ub => ub.badgeId === badge.id).length;
              return (
                <div 
                  key={badge.id} 
                  className="p-3 md:p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="h-8 w-8 rounded-full" />
                      ) : (
                        <span className="text-lg">🏅</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base truncate">{badge.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{badge.category || 'Général'}</div>
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {badge.description || 'Aucune description'}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Attributions:</span>
                    <span className="text-xs font-semibold text-mdsc-blue-primary dark:text-blue-400">{attributionCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400 py-12">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-sm md:text-base">Aucun badge disponible</p>
            <p className="text-xs md:text-sm mt-2">Créez des badges pour commencer à gamifier votre plateforme</p>
          </div>
        )}
      </div>
    </div>
  );
}

