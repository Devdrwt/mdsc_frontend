'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import StudentService, {
  StudentBadgeEntry,
  StudentCertificateEntry,
  StudentCourseEntry,
  StudentActivityEntry,
  StudentStatsResponse,
} from '../../../lib/services/studentService';
import MessageService from '../../../lib/services/messageService';
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
  Bookmark,
  Bell,
  AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalPoints: number;
  currentLevel: string;
  streak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  totalBadges: number;
  totalCertificates: number;
  totalNotifications: number;
  unreadNotifications: number;
  upcomingEvents: number;
}

interface CourseProgressCard {
  id: string;
  title: string;
  progress: number;
  instructorName?: string;
  certificateAvailable: boolean;
  nextLesson?: string;
}

interface RecentActivity {
  id: string | number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
  points?: number;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<StudentCourseEntry[]>([]);
  const courseCards = useMemo<CourseProgressCard[]>(() => {
    return courses.map((course) => ({
      id: String(course.course_id),
      title: course.course_title,
      progress: Math.round(course.progress_percentage ?? 0),
      instructorName: course.instructor?.name,
      certificateAvailable: Boolean(course.certificate?.pdf_url),
      nextLesson: course.next_lesson?.title,
    }));
  }, [courses]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalPoints: 0,
    currentLevel: 'Débutant',
    streak: 0,
    weeklyGoal: 5,
    weeklyProgress: 0,
    totalBadges: 0,
    totalCertificates: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    upcomingEvents: 0,
  });
  const [recentCertificates, setRecentCertificates] = useState<StudentCertificateEntry[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [policiesAccepted, setPoliciesAccepted] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [badges, setBadges] = useState<StudentBadgeEntry[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificateEntry[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  const [certificatesError, setCertificatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'Non disponible';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Non disponible';
    return date.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const toNumber = (value: any): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === 'object') {
      if ('total' in value) {
        return toNumber((value as any).total);
      }
      if ('count' in value) {
        return toNumber((value as any).count);
      }
      if ('value' in value) {
        return toNumber((value as any).value);
      }
    }
    return 0;
  };

  useEffect(() => {
      if (!user) return;

    let isMounted = true;

    const loadDashboardData = async () => {
        setLoading(true);
      setCoursesError(null);
      setStatsError(null);
      setActivityError(null);
      setBadgesError(null);
      setCertificatesError(null);

      try {
        const [coursesResult, statsResult, activityResult, badgesResult, certificatesResult, messageStatsResult, preferencesResult] = await Promise.allSettled([
          StudentService.getCourses(),
          StudentService.getStats(),
          StudentService.getRecentActivity(20),
          StudentService.getBadges(),
          StudentService.getCertificates(),
          MessageService.getStats(),
          StudentService.getPreferences(),
        ]);

        const unreadMessagesValue = messageStatsResult.status === 'fulfilled'
          ? messageStatsResult.value?.unread_count ?? 0
          : 0;
        setUnreadMessages(unreadMessagesValue);

        if (!isMounted) return;

        if (coursesResult.status === 'fulfilled') {
          setCourses(coursesResult.value ?? []);
        } else {
          const reason = coursesResult.reason as Error | undefined;
          setCoursesError(reason?.message ?? 'Impossible de récupérer vos cours');
          setCourses([]);
        }

        if (statsResult.status === 'fulfilled') {
           const statsData: StudentStatsResponse = statsResult.value ?? {};
           const courseStats = statsData.courses ?? {};
           const gamification = statsData.gamification ?? {};
           const notificationStats = (statsData as any).notifications ?? {};
           const calendarStats = (statsData as any).calendar ?? {};
 
          const activeCourses = toNumber(courseStats.active);
          const completedCourses = toNumber(courseStats.completed);
          const totalCourses = activeCourses + completedCourses;
          const inProgress = Math.max(activeCourses - completedCourses, 0);
 
           setStats({
            totalCourses,
            completedCourses,
            inProgressCourses: inProgress,
            totalPoints: toNumber(gamification.points),
            currentLevel: gamification.level ?? 'Débutant',
            streak: toNumber(gamification.streak_days),
            weeklyGoal: toNumber(gamification.weekly_goal) || 5,
            weeklyProgress: toNumber(gamification.weekly_progress),
            totalBadges: toNumber((statsData as any).badges),
            totalCertificates: toNumber((statsData as any).certificates),
            totalNotifications: toNumber(notificationStats.total),
            unreadNotifications: Math.max(toNumber(notificationStats.unread), unreadMessagesValue),
            upcomingEvents: toNumber((calendarStats as any).upcoming_events ?? (calendarStats as any).total ?? (calendarStats as any).count),
          });
        } else {
          const reason = statsResult.reason as Error | undefined;
          setStatsError(reason?.message ?? 'Impossible de récupérer vos statistiques');
          setStats((prev) => ({
            ...prev,
            totalCourses: 0,
            completedCourses: 0,
            inProgressCourses: 0,
            totalPoints: 0,
            weeklyProgress: 0,
            totalBadges: 0,
            totalCertificates: 0,
            totalNotifications: 0,
            unreadNotifications: 0,
            upcomingEvents: 0,
          }));
          if (messageStatsResult.status === 'rejected') {
            setUnreadMessages(0);
          }
        }

        if (activityResult.status === 'fulfilled') {
          const entries = activityResult.value ?? [];
          setRecentActivity((entries as StudentActivityEntry[]).map((entry) => {
            const iconMap: Record<string, { icon: React.ComponentType<any>; color: string; title: string }> = {
              course_started: { icon: Play, color: 'text-blue-500', title: 'Cours commencé' },
              course_completed: { icon: CheckCircle, color: 'text-green-500', title: 'Cours terminé' },
              quiz_passed: { icon: Star, color: 'text-yellow-500', title: 'Quiz réussi' },
              badge_earned: { icon: Trophy, color: 'text-orange-500', title: 'Badge obtenu' },
              certificate_issued: { icon: Award, color: 'text-purple-500', title: 'Certificat obtenu' },
              message_received: { icon: MessageSquare, color: 'text-cyan-500', title: 'Nouveau message' },
            };
            const config = iconMap[entry.type] ?? {
              icon: Play, // Default icon if type not found
              color: 'text-gray-500',
              title: 'Activité',
            };
            const description = entry.description || entry.metadata?.message || entry.metadata?.description || 'Activité enregistrée';
            return {
              id: entry.id,
              type: entry.type,
              title: config.title,
              description,
              timestamp: formatDateTime(entry.created_at),
              icon: config.icon,
              color: config.color,
              points: entry.points,
            };
          }));
        } else {
          const reason = activityResult.reason as Error | undefined;
          setActivityError(reason?.message ?? 'Impossible de récupérer votre activité récente');
          setRecentActivity([]);
        }

        if (badgesResult.status === 'fulfilled') {
          setBadges(badgesResult.value ?? []);
        } else {
          const reason = badgesResult.reason as Error | undefined;
          setBadgesError(reason?.message ?? 'Impossible de récupérer vos badges');
          setBadges([]);
        }

        if (certificatesResult.status === 'fulfilled') {
          setCertificates(certificatesResult.value ?? []);
        } else {
          const reason = certificatesResult.reason as Error | undefined;
          setCertificatesError(reason?.message ?? 'Impossible de récupérer vos certificats');
          setCertificates([]);
        }

        if (preferencesResult.status === 'fulfilled') {
          const prefs = preferencesResult.value ?? {};
          // Vérifier d'abord les préférences API, puis le localStorage comme fallback
          const apiAccepted = Boolean(prefs?.policies?.accepted);
          const localStorageAccepted = localStorage.getItem('student_policies_accepted') === 'true';
          setPoliciesAccepted(apiAccepted || localStorageAccepted);
        } else if (preferencesResult.status === 'rejected') {
          // En cas d'erreur API, vérifier le localStorage
          const localStorageAccepted = localStorage.getItem('student_policies_accepted') === 'true';
          setPoliciesAccepted(localStorageAccepted);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Erreur lors du chargement du dashboard étudiant:', error);
        const message =
          error instanceof Error ? error.message : 'Impossible de charger le tableau de bord';
        setStatsError((prev) => prev ?? message);
        setCoursesError((prev) => prev ?? message);
        setActivityError((prev) => prev ?? message);
        setBadgesError((prev) => prev ?? message);
        setCertificatesError((prev) => prev ?? message);
        setStats((prev) => ({
          ...prev,
          totalNotifications: 0,
          unreadNotifications: 0,
          upcomingEvents: 0,
        }));
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    loadDashboardData();

    // Écouter l'événement de changement de statut des politiques
    const handlePoliciesAccepted = (event: CustomEvent) => {
      setPoliciesAccepted(true);
    };

    window.addEventListener('studentPoliciesAccepted', handlePoliciesAccepted as EventListener);

    // Vérifier aussi le localStorage au cas où l'événement n'a pas été capturé
    const localStorageAccepted = localStorage.getItem('student_policies_accepted') === 'true';
    if (localStorageAccepted) {
      setPoliciesAccepted(true);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('studentPoliciesAccepted', handlePoliciesAccepted as EventListener);
    };
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
          {!policiesAccepted && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Merci d’accepter les règles & confidentialité étudiants pour continuer votre parcours.
                </span>
              </div>
              <Link
                href="/dashboard/student/policies"
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900"
              >
                Lire et accepter
              </Link>
            </div>
          )}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Cours actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.inProgressCourses} en cours
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
                  <p className="text-xs text-green-600 mt-1">
                    {stats.totalCertificates} certificats obtenus
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
                  <p className="text-xs text-orange-600 mt-1">Niveau : {stats.currentLevel}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
                  <Trophy className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Badges</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBadges}</p>
                  <p className="text-xs text-red-600 mt-1">Série : {stats.streak} jours</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full group-hover:bg-red-200 transition-colors">
                  <Flame className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notifications</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalNotifications}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.unreadNotifications} notification{stats.unreadNotifications !== 1 ? 's' : ''} non lu{stats.unreadNotifications !== 1 ? 'es' : 'e'} • {unreadMessages} message{unreadMessages !== 1 ? 's' : ''} non lu{unreadMessages !== 1 ? 's' : ''}
                </p>
                {unreadMessages > 0 && (
                  <Link
                    href="/dashboard/student/messages"
                    className="mt-2 inline-flex items-center text-xs font-medium text-mdsc-blue-primary hover:text-mdsc-blue-dark"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" /> Consulter mes messages
                  </Link>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Événements à venir</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.upcomingEvents}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Pensez à consulter votre calendrier
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
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
                <span className="text-sm text-gray-500">{courseCards.length} cours suivis</span>
              </div>
              {coursesError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {coursesError}
              </div>
              )}
              <div className="space-y-4">
                {courseCards.slice(0, 3).map((course) => (
                    <div key={course.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                          {course.title}
                        </h4>
                        {course.instructorName && (
                          <p className="text-xs text-gray-500">Avec {course.instructorName}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-600">{course.progress}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{course.nextLesson ? `Prochaine leçon : ${course.nextLesson}` : 'À jour'}</span>
                      {course.certificateAvailable && (
                        <span className="text-green-600 font-medium flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Certificat disponible</span>
                        </span>
                      )}
                      </div>
                    </div>
                ))}
                {courseCards.length > 3 && (
                  <button className="w-full text-center py-2 text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors">
                    Voir tous les cours ({courseCards.length})
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
                    strokeDasharray={`${stats.weeklyGoal ? Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100) : 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.weeklyGoal ? Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100) : 0}%
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600">
                {stats.weeklyGoal - stats.weeklyProgress > 0
                  ? `${stats.weeklyGoal - stats.weeklyProgress} cours restants cette semaine`
                  : 'Objectif atteint pour cette semaine 🎉'}
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
            {activityError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {activityError}
              </div>
            )}
            {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`${activity.color} p-2 rounded-lg`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {typeof activity.points === 'number' && (
                      <p className="text-xs text-green-600 mt-1">+{activity.points} points</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            ) : !activityError ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">Aucune activité récente</p>
                <p className="text-sm text-gray-400">Reprenez un cours pour voir votre progression ici.</p>
              </div>
            ) : null}
          </div>

          {/* Badges et Certificats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-mdsc-gold" />
                  <h3 className="text-lg font-semibold text-gray-900">Badges récents</h3>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard/student/gamification'}
                  className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark flex items-center space-x-1 transition-colors"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {badgesError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {badgesError}
                </div>
              )}
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {badges.slice(0, 4).map((badge) => (
                    <div key={badge.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="font-medium text-gray-900 mb-1">{badge.name}</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Gagné le {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                  ))}
                </div>
              ) : !badgesError ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Aucun badge obtenu pour le moment</p>
                  <p className="text-sm text-gray-400">Complétez des cours pour débloquer votre premier badge.</p>
                </div>
              ) : null}
          </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-6 w-6 text-mdsc-blue-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mes certificats</h3>
                    <p className="text-sm text-gray-500">{certificates.length} certificat{certificates.length > 1 ? 's' : ''} obtenu{certificates.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard/student/certificates'}
                  className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark flex items-center space-x-1 transition-colors"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {certificatesError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {certificatesError}
                </div>
              )}
              {!certificatesError && certificates.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Aucun certificat obtenu</p>
                  <p className="text-sm text-gray-400">Terminez un cours pour générer votre premier certificat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}