'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award, 
  Clock, 
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/authStore';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  completionRate: number;
  averageRating: number;
  totalHours: number;
  monthlyStats: {
    month: string;
    students: number;
    completions: number;
    revenue: number;
  }[];
  courseStats: {
    id: string;
    name: string;
    students: number;
    completionRate: number;
    rating: number;
  }[];
  studentEngagement: {
    day: string;
    activeUsers: number;
    newRegistrations: number;
  }[];
}

export default function AnalyticsPanel() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'students' | 'courses' | 'engagement'>('students');

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Simulation des données d'analytics - dans un vrai projet, on récupérerait depuis l'API
        const mockAnalytics: AnalyticsData = {
          totalStudents: 156,
          activeStudents: 89,
          totalCourses: 8,
          completionRate: 73.5,
          averageRating: 4.3,
          totalHours: 1240,
          monthlyStats: [
            { month: 'Jan', students: 45, completions: 12, revenue: 2400 },
            { month: 'Fév', students: 52, completions: 18, revenue: 3600 },
            { month: 'Mar', students: 38, completions: 15, revenue: 3000 },
            { month: 'Avr', students: 61, completions: 22, revenue: 4400 },
            { month: 'Mai', students: 48, completions: 19, revenue: 3800 },
            { month: 'Juin', students: 55, completions: 21, revenue: 4200 },
          ],
          courseStats: [
            { id: '1', name: 'Leadership et Management', students: 45, completionRate: 78, rating: 4.5 },
            { id: '2', name: 'Communication Efficace', students: 38, completionRate: 82, rating: 4.3 },
            { id: '3', name: 'Gestion de Projet Agile', students: 32, completionRate: 71, rating: 4.2 },
            { id: '4', name: 'Mobilisation communautaire', students: 28, completionRate: 85, rating: 4.6 },
            { id: '5', name: 'Gestion participative', students: 25, completionRate: 69, rating: 4.1 },
          ],
          studentEngagement: [
            { day: 'Lun', activeUsers: 45, newRegistrations: 3 },
            { day: 'Mar', activeUsers: 52, newRegistrations: 5 },
            { day: 'Mer', activeUsers: 38, newRegistrations: 2 },
            { day: 'Jeu', activeUsers: 61, newRegistrations: 7 },
            { day: 'Ven', activeUsers: 48, newRegistrations: 4 },
            { day: 'Sam', activeUsers: 35, newRegistrations: 1 },
            { day: 'Dim', activeUsers: 28, newRegistrations: 2 },
          ],
        };

        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, timeRange]);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case '90d': return '3 derniers mois';
      case '1y': return '12 derniers mois';
      default: return '30 derniers jours';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune donnée d'analytics disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Analytics & Rapports 📊</h1>
            <p className="text-yellow-100">
              Analysez les performances de vos cours et le comportement de vos étudiants.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
              <option value="1y">12 derniers mois</option>
            </select>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Étudiants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
              <p className="text-xs text-green-600">+12% vs mois dernier</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cours Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalCourses}</p>
              <p className="text-xs text-green-600">+2 nouveaux</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Complétion</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
              <p className="text-xs text-green-600">+5% vs mois dernier</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}/5</p>
              <p className="text-xs text-green-600">+0.2 vs mois dernier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('students')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedMetric === 'students'
                    ? 'bg-mdsc-gold text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Étudiants
              </button>
              <button
                onClick={() => setSelectedMetric('courses')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedMetric === 'courses'
                    ? 'bg-mdsc-gold text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cours
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-end space-x-2">
            {analytics.monthlyStats.map((stat, index) => (
              <div key={stat.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-mdsc-gold rounded-t"
                  style={{
                    height: `${(selectedMetric === 'students' ? stat.students : stat.completions) / 70 * 200}px`
                  }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{stat.month}</div>
                <div className="text-xs font-medium text-gray-900">
                  {selectedMetric === 'students' ? stat.students : stat.completions}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance des cours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des Cours</h3>
          <div className="space-y-4">
            {analytics.courseStats.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">{course.students} étudiants</span>
                    <span className="text-xs text-gray-500">{course.completionRate}% complétion</span>
                    <span className="text-xs text-gray-500">{course.rating}/5 ⭐</span>
                  </div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-mdsc-gold h-2 rounded-full"
                    style={{ width: `${course.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement des étudiants */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Hebdomadaire</h3>
        <div className="grid grid-cols-7 gap-4">
          {analytics.studentEngagement.map((day) => (
            <div key={day.day} className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">{day.day}</div>
              <div className="bg-gray-200 rounded-lg h-32 flex flex-col justify-end p-2">
                <div
                  className="bg-mdsc-gold rounded-t"
                  style={{ height: `${(day.activeUsers / 70) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{day.activeUsers}</div>
              <div className="text-xs text-green-600">+{day.newRegistrations}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau de bord des cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Détails des Cours</h3>
          <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Étudiants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complétion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.courseStats.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.students}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-mdsc-gold h-2 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{course.rating}/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-mdsc-gold hover:text-yellow-600">
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
