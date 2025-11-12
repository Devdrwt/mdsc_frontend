'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Target, Star, TrendingUp, Users, Clock, BookOpen, Zap } from 'lucide-react';
import { gamificationService, UserProgress, LeaderboardEntry } from '../../../lib/services/gamificationService';
import { Badge } from '../../../types';
import { useAuthStore } from '../../../lib/stores/authStore';
import { BadgeCollection } from '../../../components/gamification';

export default function GamificationPanel() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'badges' | 'leaderboard'>('progress');

  useEffect(() => {
    const loadGamificationData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Charger la progression de l'utilisateur
        // user.id est déjà vérifié dans la condition ci-dessus
        const userId = String(user.id);
        const userProgress = await gamificationService.getUserProgress(userId);
        setProgress(userProgress);

        // Charger tous les badges disponibles
        const availableBadges = await gamificationService.getAvailableBadges();
        setBadges(availableBadges);

        // Charger le classement
        const leaderboardData = await gamificationService.getLeaderboard({ limit: 10 });
        setLeaderboard(leaderboardData);

      } catch (error) {
        console.error('Erreur lors du chargement des données de gamification:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGamificationData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

  // Utiliser les données de progress directement
  const userPoints = progress?.total_xp || 0;
  const level = progress?.current_level || 1;
  const levelNames = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert', 'Maître'];
  const currentLevel = {
    level: level,
    levelName: levelNames[Math.min(level - 1, levelNames.length - 1)],
    pointsToNext: progress?.xp_for_next_level || 100
  };
  const userRank = Array.isArray(leaderboard) ? leaderboard.findIndex(entry => entry.userId === user?.id?.toString()) + 1 : 0;

  return (
    <div className="space-y-6">
      {/* En-tête avec niveau actuel */}
      <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Gamification 🏆</h2>
            <p className="text-yellow-100">Votre parcours d'apprentissage gamifié</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentLevel.levelName}</div>
            <div className="text-sm text-yellow-100">Niveau {currentLevel.level}</div>
          </div>
        </div>
        
        {/* Barre de progression du niveau */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{userPoints} points</span>
            <span>{currentLevel.pointsToNext} points vers le prochain niveau</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (userPoints % 100) / 100 * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Trophy className="h-8 w-8 text-mdsc-gold mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userPoints}</div>
          <div className="text-sm text-gray-500">Points totaux</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Award className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{progress?.badges_earned || badges?.length || 0}</div>
          <div className="text-sm text-gray-500">Badges obtenus</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{currentLevel.level}</div>
          <div className="text-sm text-gray-500">Niveau actuel</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">#{userRank || 'N/A'}</div>
          <div className="text-sm text-gray-500">Classement</div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'progress', label: 'Progression', icon: TrendingUp },
              { id: 'badges', label: 'Badges', icon: Award },
              { id: 'leaderboard', label: 'Classement', icon: Users },
            ].map((tab, index) => (
              <button
                key={tab.id || `tab-${index}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-mdsc-gold text-mdsc-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Onglet Progression */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Vos Statistiques</h3>
              {progress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center space-x-3">
                         <BookOpen className="h-5 w-5 text-blue-500" />
                         <span className="text-sm font-medium">Cours terminés</span>
                       </div>
                       <span className="font-bold text-gray-900">{progress?.courses_completed || 0}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center space-x-3">
                         <Target className="h-5 w-5 text-green-500" />
                         <span className="text-sm font-medium">Quiz réussis</span>
                       </div>
                       <span className="font-bold text-gray-900">{progress?.quizzes_passed || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium">Devoirs soumis</span>
                      </div>
                      <span className="font-bold text-gray-900">0</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium">Temps d'étude</span>
                      </div>
                      <span className="font-bold text-gray-900">0h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium">Série de connexion</span>
                      </div>
                      <span className="font-bold text-gray-900">0 jours</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-5 w-5 text-mdsc-gold" />
                        <span className="text-sm font-medium">Points totaux</span>
                      </div>
                      <span className="font-bold text-gray-900">{userPoints}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée de progression disponible</p>
              )}
            </div>
          )}

          {/* Onglet Badges */}
          {activeTab === 'badges' && (
            <BadgeCollection showProgress={true} />
          )}

          {/* Onglet Classement */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Classement des Apprenants</h3>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId || `leaderboard-${index}`}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.userId === user?.id?.toString()
                          ? 'bg-mdsc-gold/10 border-2 border-mdsc-gold'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${
                            entry.userId === user?.id?.toString() ? 'text-mdsc-gold' : 'text-gray-900'
                          }`}>
                            Utilisateur {entry.userId}
                            {entry.userId === user?.id?.toString() && ' (Vous)'}
                          </p>
                          <p className="text-sm text-gray-500">Niveau {entry.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{entry.total_xp || 0} pts</p>
                        <p className="text-sm text-gray-500">Niveau {entry.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun classement disponible</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
