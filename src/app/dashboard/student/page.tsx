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
  courseId: number;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: string;
  completedAt?: string | null;
  enrolledAt?: string | null;
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
  coursesStartedThisWeek: number;
  coursesCompletedThisWeek: number;
}

interface RecentActivity {
  id: string;
  type: 'course_started' | 'course_completed' | 'course_progress';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
}

const RELATIVE_TIME_RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRelativeTimeLabel = (timestamp: string): string => {
  const date = toDate(timestamp);
  if (!date) return 'Date inconnue';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return RELATIVE_TIME_RTF.format(Math.round(diffSeconds), 'second');
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_TIME_RTF.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME_RTF.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_TIME_RTF.format(diffDays, 'day');
  }
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 5) {
    return RELATIVE_TIME_RTF.format(diffWeeks, 'week');
  }
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return RELATIVE_TIME_RTF.format(diffMonths, 'month');
  }
  const diffYears = Math.round(diffDays / 365);
  return RELATIVE_TIME_RTF.format(diffYears, 'year');
};

const calculateStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;

  const sorted = dates
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  let streak = 0;
  let currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const activityDate of sorted) {
    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    const diffDays = Math.round((currentDay.getTime() - activityDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      streak += 1;
      currentDay = new Date(activityDay.getTime() - 24 * 60 * 60 * 1000);
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
};

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
    weeklyProgress: 0,
    coursesStartedThisWeek: 0,
    coursesCompletedThisWeek: 0,
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

        const courseProgress = userCourses.map((course: any) => {
          const courseId = Number(course.id ?? course.course_id ?? 0);
          const enrollment = course.enrollment || {};

          const progressValue = Number(
            course.progress ??
              course.progress_percentage ??
              enrollment.progress_percentage ??
              0
          );

          const completedLessonsCount = Number(course.completed_lessons ?? 0);
          const totalLessonsCount = Number(
            course.total_lessons ??
              (course.modules
                ? course.modules.reduce(
                    (count: number, module: any) => count + (module.lessons?.length || 0),
                    0
                  )
                : 0)
          );

          const lastAccessedAt =
            course.last_accessed_at ||
            enrollment.last_accessed_at ||
            course.updated_at ||
            course.created_at ||
            new Date().toISOString();

          return {
            courseId,
            progress: Number.isFinite(progressValue) ? Math.max(0, Math.min(100, progressValue)) : 0,
            completedLessons: Number.isFinite(completedLessonsCount) ? completedLessonsCount : 0,
            totalLessons: Number.isFinite(totalLessonsCount) ? totalLessonsCount : 0,
            lastAccessedAt,
            completedAt: enrollment.completed_at ?? course.completed_at ?? null,
            enrolledAt: enrollment.enrolled_at ?? course.enrolled_at ?? course.created_at ?? null,
          } as CourseProgress;
        });
        setProgress(courseProgress);

        const completedCourses = courseProgress.filter((p) => p.progress === 100).length;
        const inProgressCourses = courseProgress.filter((p) => p.progress > 0 && p.progress < 100).length;

        const totalPoints = courseProgress.reduce((sum, p) => sum + p.progress * 10, 0);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const coursesStartedThisWeek = courseProgress.filter((p) => {
          const enrolledDate = toDate(p.enrolledAt ?? null);
          return enrolledDate ? enrolledDate >= oneWeekAgo : false;
        }).length;

        const coursesCompletedThisWeek = courseProgress.filter((p) => {
          const completedDate = toDate(p.completedAt ?? null);
          return completedDate ? completedDate >= oneWeekAgo : false;
        }).length;

        const activitiesDates = courseProgress
          .map((p) => toDate(p.lastAccessedAt))
          .filter((date): date is Date => Boolean(date));

        const weeklyProgress = courseProgress.filter((p) => {
          const lastAccessed = toDate(p.lastAccessedAt);
          return lastAccessed ? lastAccessed >= oneWeekAgo : false;
        }).length;

        setStats({
          totalCourses: userCourses.length || 0,
          completedCourses,
          inProgressCourses,
          totalPoints,
          currentLevel: totalPoints > 500 ? 'Expert' : totalPoints > 200 ? 'Intermédiaire' : 'Débutant',
          streak: calculateStreak(activitiesDates),
          weeklyGoal: Math.max(weeklyProgress, 5),
          weeklyProgress,
          coursesStartedThisWeek,
          coursesCompletedThisWeek,
        });

        const activities: RecentActivity[] = [];

        courseProgress.forEach((p) => {
          const courseData = userCourses.find((course: any) => Number(course.id ?? course.course_id) === p.courseId);
          if (!courseData) return;

          const courseTitle = courseData.title ?? courseData.name ?? `Cours ${p.courseId}`;

          if (p.enrolledAt) {
            activities.push({
              id: `${p.courseId}-start`,
              type: 'course_started',
              title: `Début de « ${courseTitle} »`,
              description: 'Vous êtes inscrit à ce cours.',
              timestamp: p.enrolledAt,
              icon: BookOpen,
              color: 'text-blue-500',
            });
          }

          if (p.progress > 0 && p.progress < 100) {
            activities.push({
              id: `${p.courseId}-progress`,
              type: 'course_progress',
              title: `Progression sur « ${courseTitle} »`,
              description: `Votre progression est désormais de ${Math.round(p.progress)} %.`,
              timestamp: p.lastAccessedAt,
              icon: TrendingUp,
              color: 'text-indigo-500',
            });
          }

          if (p.progress === 100 && p.completedAt) {
            activities.push({
              id: `${p.courseId}-completed`,
              type: 'course_completed',
              title: `Cours terminé : « ${courseTitle} »`,
              description: 'Félicitations pour cette réussite !',
              timestamp: p.completedAt,
              icon: CheckCircle,
              color: 'text-green-500',
            });
          }
        });

        const sortedActivities = activities
          .sort((a, b) => {
            const dateA = toDate(a.timestamp)?.getTime() ?? 0;
            const dateB = toDate(b.timestamp)?.getTime() ?? 0;
            return dateB - dateA;
          })
          .slice(0, 6);

        setRecentActivity(sortedActivities);

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
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.coursesStartedThisWeek > 0
                      ? `${stats.coursesStartedThisWeek} nouveau${stats.coursesStartedThisWeek > 1 ? 'x' : ''} cette semaine`
                      : 'Aucune nouvelle inscription cette semaine'}
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.coursesCompletedThisWeek > 0
                      ? `${stats.coursesCompletedThisWeek} terminé${stats.coursesCompletedThisWeek > 1 ? 's' : ''} cette semaine`
                      : 'Aucun cours terminé cette semaine'}
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">Basé sur votre progression globale</p>
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
                  <p className="text-xs text-gray-500 mt-1">jours consécutifs actifs</p>
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
                {courses.slice(0, 3).map((course) => {
                  const courseId = Number(course.id ?? course.course_id ?? 0);
                  const courseProgress = progress.find((p) => p.courseId === courseId);
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
            {recentActivity.length === 0 ? (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-600">
                Aucune activité enregistrée pour le moment. Commencez un cours pour voir vos progrès ici.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className={`${activity.color} p-2 rounded-lg`}> 
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{getRelativeTimeLabel(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges et Certificats Preview */}
          <BadgesCertificatesPreview />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}