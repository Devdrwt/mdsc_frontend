'use client';

import React from 'react';
import { Course } from '../../../lib/services/courseService';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Star, 
  DollarSign, 
  CheckCircle,
  Loader,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';

interface CourseAnalyticsModalProps {
  course: Course | null;
  analytics: any;
  loading: boolean;
}

export default function CourseAnalyticsModal({
  course,
  analytics,
  loading,
}: CourseAnalyticsModalProps) {
  if (!course) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary" />
        <p className="ml-3 text-gray-600">Chargement des analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucune donnée d'analytics disponible pour ce cours.</p>
      </div>
    );
  }

  // Normaliser les données pour gérer différentes structures de réponse
  const analyticsData = analytics.data || analytics;
  const metrics = analyticsData.metrics || analyticsData;
  
  const stats = [
    {
      label: 'Vues totales',
      value: metrics.totalViews || metrics.views || analyticsData.totalViews || analyticsData.views || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Inscriptions',
      value: metrics.totalEnrollments || metrics.enrollments || analyticsData.totalEnrollments || analyticsData.enrollments || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Taux de complétion',
      value: `${metrics.completionRate || analyticsData.completionRate || 0}%`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Note moyenne',
      value: (metrics.averageRating || metrics.rating || analyticsData.averageRating || analyticsData.rating || 0).toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Revenus',
      value: `${(metrics.revenue || metrics.totalRevenue || analyticsData.revenue || analyticsData.totalRevenue || 0).toLocaleString('fr-FR')} FCFA`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-6 w-6 ${stat.color}`} />
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progression des étudiants */}
      {(() => {
        const studentProgress = analyticsData.studentProgress || analyticsData.progressDistribution || analytics.studentProgress || [];
        return studentProgress && studentProgress.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-mdsc-blue-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Progression des étudiants</h3>
          </div>
          <div className="space-y-4">
            {studentProgress.slice(0, 10).map((student: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{student.userName || `Étudiant ${index + 1}`}</p>
                  <p className="text-xs text-gray-500">
                    Dernière activité: {new Date(student.lastActivity).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{student.progress || 0}%</div>
                    <div className="text-xs text-gray-500">Progression</div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-mdsc-blue-primary h-2 rounded-full transition-all"
                      style={{ width: `${student.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {studentProgress.length > 10 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                + {studentProgress.length - 10} autres étudiants
              </p>
            )}
          </div>
        </div>
        ) : null;
      })()}

      {/* Informations complémentaires */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Informations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Cours créé le:</span>
            <span className="ml-2 font-medium text-gray-900">
              {course.createdAt ? new Date(course.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Dernière mise à jour:</span>
            <span className="ml-2 font-medium text-gray-900">
              {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total étudiants:</span>
            <span className="ml-2 font-medium text-gray-900">
              {course.totalStudents || metrics.totalEnrollments || metrics.enrollments || analyticsData.totalEnrollments || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Note moyenne:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(metrics.averageRating || metrics.rating || analyticsData.averageRating || course.rating || 0).toFixed(1)} ⭐
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

