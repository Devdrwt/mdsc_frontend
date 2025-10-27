'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Shield,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
  Globe,
  Database,
  Server,
  Mail
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsers: number;
  systemHealth: number;
  averageRating: number;
  monthlyGrowth: number;
  pendingModerations: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: string;
  lastBackup: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'course_created' | 'payment_received' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
  priority: 'low' | 'medium' | 'high';
}

interface UserGrowth {
  month: string;
  users: number;
  courses: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeUsers: 0,
    systemHealth: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    pendingModerations: 0
  });
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    uptime: '',
    lastBackup: ''
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Simuler le chargement des données
        setStats({
          totalUsers: 1247,
          totalCourses: 89,
          totalRevenue: 2450000,
          activeUsers: 892,
          systemHealth: 98,
          averageRating: 4.7,
          monthlyGrowth: 23,
          pendingModerations: 12
        });

        setSystemMetrics({
          cpuUsage: 45,
          memoryUsage: 67,
          diskUsage: 23,
          networkLatency: 12,
          uptime: '15 jours, 4 heures',
          lastBackup: 'Il y a 2 heures'
        });

        // Activités récentes
        setRecentActivity([
          {
            id: '1',
            type: 'user_registered',
            title: 'Nouvel utilisateur inscrit',
            description: 'Jean Kouassi s\'est inscrit en tant qu\'étudiant',
            timestamp: 'Il y a 5 minutes',
            icon: Users,
            color: 'text-blue-500',
            priority: 'low'
          },
          {
            id: '2',
            type: 'course_created',
            title: 'Nouveau cours créé',
            description: 'Dr. Marie Traoré a créé le cours "Gestion de Projet Agile"',
            timestamp: 'Il y a 15 minutes',
            icon: BookOpen,
            color: 'text-green-500',
            priority: 'medium'
          },
          {
            id: '3',
            type: 'system_alert',
            title: 'Alerte système',
            description: 'Utilisation CPU élevée détectée',
            timestamp: 'Il y a 30 minutes',
            icon: AlertTriangle,
            color: 'text-red-500',
            priority: 'high'
          },
          {
            id: '4',
            type: 'payment_received',
            title: 'Paiement reçu',
            description: '1,250,000 FCFA reçus ce mois',
            timestamp: 'Il y a 1 heure',
            icon: DollarSign,
            color: 'text-emerald-500',
            priority: 'low'
          }
        ]);

        // Données de croissance
        setUserGrowth([
          { month: 'Jan', users: 800, courses: 45, revenue: 1800000 },
          { month: 'Fév', users: 920, courses: 52, revenue: 2100000 },
          { month: 'Mar', users: 1050, courses: 61, revenue: 2300000 },
          { month: 'Avr', users: 1180, courses: 73, revenue: 2400000 },
          { month: 'Mai', users: 1247, courses: 89, revenue: 2450000 }
        ]);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-8">
          {/* En-tête de bienvenue moderne */}
          <div className="relative overflow-hidden bg-gradient-to-br from-mdsc-blue-dark via-gray-900 to-mdsc-blue-dark rounded-2xl p-8 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-mdsc-blue-primary/20 to-mdsc-gold/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Tableau de Bord Admin, {user?.firstName} ! 👑
                  </h1>
                  <p className="text-white/90 text-lg">
                    Surveillez et gérez votre plateforme MdSC MOOC.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Effet de particules animées */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 right-12 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce"></div>
          </div>

          {/* Statistiques principales avec animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth} ce mois
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Cours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +12 ce mois
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Revenus</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} FCFA</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +18% ce mois
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full group-hover:bg-emerald-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Santé Système</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.systemHealth}%</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Optimal
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Métriques système et activité */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métriques système */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Métriques Système
                </h3>
                <span className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Tous les systèmes opérationnels
                </span>
              </div>
              
              <div className="space-y-6">
                {/* CPU Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      CPU Usage
                    </span>
                    <span className="text-sm font-bold text-gray-900">{systemMetrics.cpuUsage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemMetrics.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Memory Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <Database className="h-4 w-4 mr-1" />
                      Memory Usage
                    </span>
                    <span className="text-sm font-bold text-gray-900">{systemMetrics.memoryUsage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemMetrics.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Disk Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <Server className="h-4 w-4 mr-1" />
                      Disk Usage
                    </span>
                    <span className="text-sm font-bold text-gray-900">{systemMetrics.diskUsage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mdsc-gold to-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemMetrics.diskUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Network Latency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      Network Latency
                    </span>
                    <span className="text-sm font-bold text-gray-900">{systemMetrics.networkLatency}ms</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mdsc-gold to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(systemMetrics.networkLatency / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Uptime:</span>
                    <span className="ml-2 font-medium text-gray-900">{systemMetrics.uptime}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dernière sauvegarde:</span>
                    <span className="ml-2 font-medium text-gray-900">{systemMetrics.lastBackup}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes et notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Alertes & Notifications
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    type: 'warning',
                    title: 'Modération en attente',
                    description: `${stats.pendingModerations} cours en attente de modération`,
                    icon: Clock,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50'
                  },
                  {
                    type: 'info',
                    title: 'Maintenance programmée',
                    description: 'Maintenance prévue dimanche 2h-4h',
                    icon: Settings,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                  },
                  {
                    type: 'success',
                    title: 'Sauvegarde réussie',
                    description: 'Sauvegarde automatique terminée avec succès',
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50'
                  }
                ].map((alert, index) => (
                  <div key={index} className={`${alert.bgColor} p-4 rounded-xl border border-gray-200`}>
                    <div className="flex items-start space-x-3">
                      <alert.icon className={`h-5 w-5 ${alert.color} mt-0.5`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions rapides modernes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Users,
                  title: 'Gestion Utilisateurs',
                  description: 'Gérer les utilisateurs',
                  color: 'bg-blue-500',
                  href: '/dashboard/admin/users'
                },
                {
                  icon: BookOpen,
                  title: 'Modération Cours',
                  description: 'Modérer les cours',
                  color: 'bg-green-500',
                  href: '/dashboard/admin/courses'
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'Statistiques détaillées',
                  color: 'bg-purple-500',
                  href: '/dashboard/admin/analytics'
                },
                {
                  icon: Settings,
                  title: 'Paramètres',
                  description: 'Configuration système',
                  color: 'bg-gray-500',
                  href: '/dashboard/admin/settings'
                }
              ].map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="group flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <div className={`${action.color} p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
              Activité Récente
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`${activity.color} p-2 rounded-lg`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.priority === 'high' ? 'bg-red-100 text-red-600' :
                        activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {activity.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}