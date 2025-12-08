'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Users, RefreshCw } from 'lucide-react';
import { GamificationService } from '../../../lib/services/gamificationService';
import { BadgeService } from '../../../lib/services/badgeService';
import { Badge, UserBadge } from '../../../types';
import toast from '../../../lib/utils/toast';

export default function GamificationInstructor() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [allBadges, mine] = await Promise.all([
        BadgeService.getAllBadges(),
        BadgeService.getUserBadges(),
      ]);
      setBadges(allBadges || []);
      setMyBadges(mine || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
      setMyBadges([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-mdsc-gold rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
<h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
  <Trophy className="w-6 h-6" />
  Gamification (Formateur)
</h1>
            <p className="text-yellow-100">Gérez les badges et suivez l'obtention par vos utilisateurs.</p>
          </div>
          <button onClick={load} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Badges disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{badges.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Mes badges</p>
              <p className="text-2xl font-bold text-gray-900">{myBadges.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taux d'obtention</p>
              <p className="text-2xl font-bold text-gray-900">{badges.length ? Math.round((myBadges.length / badges.length) * 100) : 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Badges</h3>
          <button onClick={checkAndAward} disabled={checking} className="px-4 py-2 text-sm rounded-md bg-mdsc-gold text-white hover:bg-yellow-600 disabled:opacity-50">
            {checking ? 'Vérification...' : 'Vérifier et attribuer'}
          </button>
        </div>

        {badges.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div key={b.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-yellow-100">
                    {b.icon_url ? (
                      <img src={b.icon_url} alt={b.name} className="h-8 w-8" />
                    ) : (
                      <span className="text-sm">🏅</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.category || 'Général'}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2 line-clamp-2">{b.description || 'Aucune description'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-12">Aucun badge disponible</div>
        )}
      </div>
    </div>
  );
}


