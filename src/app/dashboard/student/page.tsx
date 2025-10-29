'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import { courseService, Course } from '../../../lib/services/courseService';
import { 
  BookOpen, 
  Trophy, 
  Award, 
  Clock, 
  TrendingUp, 
  Users,
  Calendar,
  MessageSquare,
  Brain,
  Target,
  Play,
  CheckCircle,
  Star,
  Zap,
  Flame,
  ArrowRight,
  Eye,
  Bookmark
} from 'lucide-react';
import BadgesCertificatesPreview from '../../../components/dashboard/shared/BadgesCertificatesPreview';

interface CourseProgress {
  courseId: string;
  progress: number;
  completedLessons: string[];
  lastAccessedAt: string;
}

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalPoints: number;
  currentLevel: string;
  streak: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'course_started' | 'course_completed' | 'quiz_passed' | 'badge_earned';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalPoints: 0,
    currentLevel: 'Débutant',
    streak: 0,
    weeklyGoal: 5,
    weeklyProgress: 3
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Charger les cours de l'utilisateur
        const userCourses = await courseService.getMyCourses();
        setCourses(userCourses);

        // Charger la progression
        const courseProgress = await Promise.all(
          userCourses.map(course => courseService.getCourseProgress(course.id))
        );
        setProgress(courseProgress);

        // Calculer les statistiques
        const completedCourses = userCourses.filter(course => 
          courseProgress.find(p => p.courseId === course.id)?.progress === 100
        ).length;

        const inProgressCourses = userCourses.filter(course => {
          const courseProgress = progress.find(p => p.courseId === course.id);
          return courseProgress && courseProgress.progress > 0 && courseProgress.progress < 100;
        }).length;

        const totalPoints = courseProgress.reduce((sum, p) => sum + (p.progress * 10), 0);

        setStats({
          totalCourses: userCourses.length,
          completedCourses,
          inProgressCourses,
          totalPoints,
          currentLevel: totalPoints > 500 ? 'Expert' : totalPoints > 200 ? 'Intermédiaire' : 'Débutant',
          streak: Math.floor(Math.random() * 15) + 1,
          weeklyGoal: 5,
          weeklyProgress: Math.floor(Math.random() * 6)
        });

        // Simuler des activités récentes
        setRecentActivity([
          {
            id: '1',
            type: 'course_completed',
            title: 'Formation Leadership terminée',
            description: 'Vous avez terminé le cours "Leadership et Management d\'Équipe"',
            timestamp: 'Il y a 2 heures',
            icon: CheckCircle,
            color: 'text-green-500'
          },
          {
            id: '2',
            type: 'badge_earned',
            title: 'Badge "Premier Pas" obtenu',
            description: 'Vous avez obtenu votre premier badge !',
            timestamp: 'Il y a 1 jour',
            icon: Trophy,
            color: 'text-yellow-500'
          },
          {
            id: '3',
            type: 'quiz_passed',
            title: 'Quiz Communication réussi',
            description: 'Score: 85% - Excellent travail !',
            timestamp: 'Il y a 2 jours',
            icon: Star,
            color: 'text-blue-500'
          }
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
      <AuthGuard requiredRole="student">
        <DashboardLayout userRole="student">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-8">
          {/* En-tête de bienvenue moderne */}
          <div className="relative overflow-hidden bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary rounded-2xl p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Bonjour, {user?.firstName} ! 👋
                  </h1>
                  <p className="text-white/90 text-lg">
                    Continuez votre parcours d'apprentissage et atteignez de nouveaux objectifs.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Brain className="h-12 w-12 text-white" />
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Mes Cours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                  <p className="text-xs text-green-600 mt-1">+2 cette semaine</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Terminés</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
                  <p className="text-xs text-green-600 mt-1">+1 cette semaine</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Points</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPoints}</p>
                  <p className="text-xs text-orange-600 mt-1">+50 cette semaine</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
                  <Trophy className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Série</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.streak}</p>
                  <p className="text-xs text-red-600 mt-1">jours consécutifs</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full group-hover:bg-red-200 transition-colors">
                  <Flame className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Progression et objectifs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progression des cours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Progression des Cours
                </h3>
                <span className="text-sm text-gray-500">{stats.inProgressCourses} en cours</span>
              </div>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course, index) => {
                  const courseProgress = progress.find(p => p.courseId === course.id);
                  const progressPercentage = courseProgress?.progress || 0;
                  
                  return (
                    <div key={course.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                          {course.title}
                        </h4>
                        <span className="text-sm font-medium text-gray-600">{progressPercentage}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {courses.length > 3 && (
                  <button className="w-full text-center py-2 text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors">
                    Voir tous les cours ({courses.length})
                  </button>
                )}
              </div>
            </div>

            {/* Objectif hebdomadaire */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-mdsc-gold" />
                  Objectif Hebdomadaire
                </h3>
                <span className="text-sm text-gray-500">{stats.weeklyProgress}/{stats.weeklyGoal}</span>
              </div>
              
              {/* Barre de progression circulaire */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-mdsc-gold"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(stats.weeklyProgress / stats.weeklyGoal) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
                  </span>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-600">
                {stats.weeklyGoal - stats.weeklyProgress} cours restants cette semaine
              </p>
            </div>
          </div>

          {/* Actions rapides modernes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Play,
                  title: 'Continuer',
                  description: 'Reprendre mes cours',
                  color: 'bg-blue-500',
                  href: '/dashboard/student/courses'
                },
                {
                  icon: Brain,
                  title: 'Assistant IA',
                  description: 'Poser une question',
                  color: 'bg-purple-500',
                  href: '/dashboard/student/chat-ai'
                },
                {
                  icon: Award,
                  title: 'Évaluations',
                  description: 'Quiz et devoirs',
                  color: 'bg-yellow-500',
                  href: '/dashboard/student/evaluations'
                },
                {
                  icon: Bookmark,
                  title: 'Favoris',
                  description: 'Cours sauvegardés',
                  color: 'bg-green-500',
                  href: '/dashboard/student/favorites'
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
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
              Activité Récente
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`${activity.color} p-2 rounded-lg`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges et Certificats Preview */}
          <BadgesCertificatesPreview />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}