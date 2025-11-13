'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import InstructorService, {
  InstructorCourseEntry,
  InstructorDashboardResponse,
  InstructorEnrollmentsTrendPoint,
  InstructorRecentActivityEntry,
  InstructorRecentEnrollment,
  InstructorRecentPayment,
  InstructorTopCourse,
  InstructorNotificationEntry,
} from '../../../lib/services/instructorService';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Plus,
  BarChart3,
  Clock,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Zap,
  Star,
  Calendar,
  Settings,
  FileText,
  PlayCircle,
  Eye,
  Bell,
  AlertTriangle,
} from 'lucide-react';

interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  draftCourses: number;
  totalStudents: number;
  activeStudents: number;
  totalRevenue: number;
  revenueByCurrency: Array<{ currency: string; amount: number }>;
  averageRating: number;
  totalViews: number;
}

interface CoursePerformance {
  id: string;
  title: string;
  status?: string;
  students: number;
  completionRate: number;
  rating: number;
  revenue: number;
  views: number;
}

interface RecentActivity {
  id: string | number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
  priority: 'low' | 'medium' | 'high';
}

interface RecentEnrollmentItem {
  id: string | number;
  courseTitle: string;
  studentName: string;
  enrolledAt: string;
}

interface RecentPaymentItem {
  id: string | number;
  courseTitle: string;
  studentName: string;
  amount: number;
  currency: string;
  paidAt: string;
}

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<InstructorCourseEntry[]>([]);
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    revenueByCurrency: [],
    averageRating: 0,
    totalViews: 0,
  });
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollmentItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [weeklyEnrollments, setWeeklyEnrollments] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<InstructorNotificationEntry[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(true);

  const formatCurrency = (amount?: number, currency = 'XOF') => {
    if (amount === undefined || amount === null) return '0';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `${amount.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'Non disponible';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Non disponible';
    return date.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const mapActivityEntry = (entry: InstructorRecentActivityEntry): RecentActivity => {
    const configMap: Record<string, { icon: React.ComponentType<any>; color: string; title: string; priority: 'low' | 'medium' | 'high' }> = {
      student_enrolled: {
        icon: Users,
        color: 'text-blue-500',
        title: 'Nouvelle inscription',
        priority: 'low',
      },
      course_created: {
        icon: BookOpen,
        color: 'text-green-500',
        title: 'Cours publié',
        priority: 'medium',
      },
      course_updated: {
        icon: FileText,
        color: 'text-indigo-500',
        title: 'Cours mis à jour',
        priority: 'low',
      },
      review_received: {
        icon: Star,
        color: 'text-yellow-500',
        title: 'Nouvel avis reçu',
        priority: 'medium',
      },
      payment_received: {
        icon: DollarSign,
        color: 'text-emerald-500',
        title: 'Paiement reçu',
        priority: 'low',
      },
    };

    const config = configMap[entry.type] ?? {
      icon: Activity,
      color: 'text-gray-500',
      title: 'Événement',
      priority: 'low' as const,
    };

    let description = entry.description;
    if (!description && entry.metadata && typeof entry.metadata === 'object') {
      description = entry.metadata.message || entry.metadata.description || '';
    }

    return {
      id: entry.id,
      type: entry.type,
      title: config.title,
      description: description || 'Activité enregistrée',
      timestamp: formatDateTime(entry.created_at),
      icon: config.icon,
      color: config.color,
      priority: config.priority,
    };
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
      if ('total' in value) return toNumber((value as any).total);
      if ('count' in value) return toNumber((value as any).count);
      if ('value' in value) return toNumber((value as any).value);
      if ('amount' in value) return toNumber((value as any).amount);
    }
    return 0;
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const notificationsWithMessages = useMemo(() => {
    if (unreadMessages > 0) {
      const messageEntry: InstructorNotificationEntry = {
        id: 'unread-messages',
        title: 'Messages non lus',
        message: `Vous avez ${unreadMessages} message${unreadMessages > 1 ? 's' : ''} non lu${
          unreadMessages > 1 ? 's' : ''
        }.`,
        type: 'message',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: { link: '/dashboard/instructor/messages' },
      };
      return [messageEntry, ...notifications];
    }
    return notifications;
  }, [notifications, unreadMessages]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setDashboardError(null);
      setCoursesError(null);
      setNotificationsError(null);
      setNotificationsLoading(true);

      try {
        const [dashboardResult, coursesResult, trendResult, activityResult, unreadResult, notificationsResult] = await Promise.allSettled([
          InstructorService.getDashboard(),
          InstructorService.getCourses({ limit: 12 }),
          InstructorService.getEnrollmentsTrend('90d'),
          InstructorService.getRecentActivity(20),
          InstructorService.getUnreadMessagesCount(),
          InstructorService.getNotifications({ limit: 20 }),
        ]);

        if (!isMounted) return;

        if (dashboardResult.status === 'fulfilled') {
          const dashboardData: InstructorDashboardResponse = dashboardResult.value ?? {};
          const statsData = dashboardData.stats ?? {};
          const coursesStats = statsData.courses ?? {};
          const studentsStats = statsData.students ?? {};
          const revenueStats = statsData.revenue ?? [];
          const ratingStats = statsData.rating ?? {};
          const viewsStats = statsData.views ?? {};

          const revenueByCurrency = revenueStats
            .filter((item): item is { currency?: string; amount?: number } => Boolean(item?.currency))
            .map((item) => ({
              currency: item.currency ?? 'XOF',
              amount: toNumber(item.amount ?? (item as any).total ?? (item as any).value),
            }));

          setStats({
            totalCourses: toNumber(coursesStats.total),
            publishedCourses: toNumber(coursesStats.published),
            pendingCourses: toNumber(coursesStats.pending),
            draftCourses: toNumber(coursesStats.draft),
            totalStudents: toNumber(studentsStats.total),
            activeStudents: toNumber(studentsStats.active),
            totalRevenue: revenueStats.reduce((sum, item) => sum + toNumber(item?.amount ?? (item as any).total ?? (item as any).value), 0),
            revenueByCurrency,
            averageRating: toNumber(ratingStats.average),
            totalViews: toNumber(viewsStats.total),
          });

          setCoursePerformance((dashboardData.top_courses ?? []).map((course: InstructorTopCourse, index) => ({
            id: String(course.course_id ?? index),
            title: course.title ?? 'Cours',
            status: course.status,
            students: toNumber(course.enrollments),
            completionRate: toNumber(course.completion_rate),
            rating: toNumber(course.rating),
            revenue: (course.revenue ?? []).reduce((sum, item) => sum + toNumber(item?.amount ?? (item as any).total ?? (item as any).value), 0),
            views: toNumber(course.views),
          })));

          setRecentEnrollments((dashboardData.recent_enrollments ?? []).map((item: InstructorRecentEnrollment, index) => ({
            id: item.enrollment_id ?? index,
            courseTitle: item.course_title ?? 'Cours',
            studentName: item.student_name ?? 'Étudiant',
            enrolledAt: formatDateTime(item.enrolled_at),
          })));

          setRecentPayments((dashboardData.recent_payments ?? []).map((item: InstructorRecentPayment, index) => ({
            id: item.payment_id ?? index,
            courseTitle: item.course_title ?? 'Cours',
            studentName: item.student_name ?? 'Étudiant',
            amount: toNumber(item.amount),
            currency: item.currency ?? 'XOF',
            paidAt: formatDateTime(item.paid_at),
          })));
        } else {
          const reason = dashboardResult.reason as Error | undefined;
          setDashboardError(reason?.message ?? 'Impossible de charger le tableau de bord instructeur');
          setStats((prev) => ({
            ...prev,
            totalCourses: 0,
            publishedCourses: 0,
            pendingCourses: 0,
            draftCourses: 0,
            totalStudents: 0,
            activeStudents: 0,
            totalRevenue: 0,
            revenueByCurrency: [],
            averageRating: 0,
            totalViews: 0,
          }));
          setCoursePerformance([]);
          setRecentEnrollments([]);
          setRecentPayments([]);
        }

        if (coursesResult.status === 'fulfilled') {
          const data = coursesResult.value;
          setCourses(data?.courses ?? []);
        } else {
          const reason = coursesResult.reason as Error | undefined;
          setCoursesError(reason?.message ?? 'Impossible de récupérer vos cours');
          setCourses([]);
        }

        if (trendResult.status === 'fulfilled') {
          const trend = trendResult.value ?? [];
          const limitedTrend = trend.slice(-8);
          setWeeklyEnrollments(limitedTrend.map((point) => toNumber(point.enrollments ?? (point as any).total ?? (point as any).value)));
        } else {
          setWeeklyEnrollments([]);
        }

        if (activityResult.status === 'fulfilled') {
          const entries = activityResult.value ?? [];
          setRecentActivity(entries.map(mapActivityEntry));
        } else {
          setRecentActivity([]);
        }

        if (unreadResult.status === 'fulfilled') {
          setUnreadMessages(unreadResult.value ?? 0);
        } else {
          setUnreadMessages(0);
        }

        if (notificationsResult.status === 'fulfilled') {
          const data = notificationsResult.value;
          const list = Array.isArray((data as any)?.notifications)
            ? (data as any).notifications as InstructorNotificationEntry[]
            : Array.isArray(data)
            ? (data as InstructorNotificationEntry[])
            : Array.isArray((data as any)?.data)
            ? (data as any).data as InstructorNotificationEntry[]
            : [];
          setNotifications(list);
          setNotificationsError(null);
        } else {
          const reason = notificationsResult.reason as Error | undefined;
          setNotificationsError(reason?.message ?? 'Impossible de récupérer vos notifications');
          setNotifications([]);
        }

        // Vérifier localStorage pour les politiques acceptées
        if (typeof window !== 'undefined') {
          const localStorageAccepted = localStorage.getItem('instructor_policies_accepted') === 'true';
          setPoliciesAccepted(localStorageAccepted);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Erreur lors du chargement des données instructeur:', error);
        const message =
          error instanceof Error ? error.message : 'Impossible de charger le tableau de bord instructeur';
        setDashboardError(message);
        setNotificationsError((prev) => prev ?? message);
      } finally {
        if (isMounted) {
        setLoading(false);
        setNotificationsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Écouter l'événement personnalisé pour mettre à jour le statut des politiques en temps réel
  useEffect(() => {
    const handlePoliciesAccepted = (event: CustomEvent) => {
      setPoliciesAccepted(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('policiesAccepted', handlePoliciesAccepted as EventListener);
      
      // Vérifier localStorage au montage au cas où les politiques ont été acceptées dans un autre onglet
      const localStorageAccepted = localStorage.getItem('instructor_policies_accepted') === 'true';
      if (localStorageAccepted) {
        setPoliciesAccepted(true);
      }

      return () => {
        window.removeEventListener('policiesAccepted', handlePoliciesAccepted as EventListener);
      };
    }
  }, []);

  if (loading) {
    return (
      <AuthGuard requiredRole="instructor">
        <DashboardLayout userRole="instructor">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="space-y-8">
          {!policiesAccepted && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Merci de lire et d’accepter nos règles & confidentialité pour bénéficier de toutes les fonctionnalités.
                </span>
              </div>
              <Link
                href="/dashboard/instructor/policies"
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900"
              >
                Consulter et accepter
                <ArrowUp className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* En-tête de bienvenue moderne */}
          <div className="relative overflow-hidden bg-gradient-to-br from-mdsc-gold via-orange-500 to-mdsc-gold rounded-2xl p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Bienvenue, {user?.firstName} ! 🎓
                  </h1>
                  <p className="text-white/90 text-lg">
                    Gérez vos cours et accompagnez vos étudiants vers la réussite.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Award className="h-12 w-12 text-white" />
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Étudiants</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Actifs : {stats.activeStudents.toLocaleString()}
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
                  <p className="text-xs text-green-600 mt-1">
                    Publiés : {stats.publishedCourses} • En attente : {stats.pendingCourses}
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
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.revenueByCurrency.length
                      ? formatCurrency(stats.revenueByCurrency[0].amount ?? 0, stats.revenueByCurrency[0].currency ?? 'XOF')
                      : `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`}
                  </p>
                  {stats.revenueByCurrency.length > 1 && (
                    <p className="text-xs text-green-600 mt-1">
                      {stats.revenueByCurrency.slice(1).map((entry) => `${formatCurrency(entry.amount ?? 0, entry.currency ?? 'XOF')}`).join(' • ')}
                    </p>
                  )}
                </div>
                <div className="bg-emerald-100 p-3 rounded-full group-hover:bg-emerald-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Note Moyenne</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-yellow-600 mt-1 flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {stats.totalViews.toLocaleString()} vues
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full group-hover:bg-yellow-200 transition-colors">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance des cours et statistiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance des cours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Performance des Cours
                </h3>
                <button className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors">
                  Voir tout
                </button>
              </div>
              {coursePerformance.length > 0 ? (
              <div className="space-y-4">
                {coursePerformance.slice(0, 3).map((course) => (
                  <div key={course.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                        {course.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                          {course.revenue > 0 && (
                            <span className="text-xs text-emerald-600 font-semibold">
                              {course.revenue.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{course.students} étudiants</span>
                        <span>{course.rating.toFixed(1)} ⭐</span>
                      <span>{course.views} vues</span>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-10">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Pas encore assez de données pour les performances.</p>
                </div>
              )}
            </div>

            {/* Métriques clés */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2 text-mdsc-gold" />
                Métriques Clés
              </h3>
              
              <div className="space-y-6">
                {/* Note moyenne */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Note moyenne</span>
                    <span className="text-sm font-bold text-gray-900">{stats.averageRating.toFixed(1)} / 5</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mdsc-gold to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.averageRating / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Étudiants actifs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Étudiants Actifs</span>
                    <span className="text-sm font-bold text-gray-900">{stats.activeStudents}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalStudents ? Math.min((stats.activeStudents / stats.totalStudents) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Inscriptions par semaine (graphe simple) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Inscriptions/semaine</span>
                    <span className="text-xs text-gray-500">{weeklyEnrollments.reduce((a, b) => a + b, 0)} au total</span>
                  </div>
                  <div className="w-full h-28">
                    {weeklyEnrollments.length > 1 ? (
                      <svg viewBox="0 0 160 60" className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke="rgb(234 179 8)"
                          strokeWidth="2"
                          points={weeklyEnrollments.map((v, i) => {
                            const x = (i / Math.max(1, weeklyEnrollments.length - 1)) * 160;
                            const max = Math.max(...weeklyEnrollments, 1);
                            const y = 60 - (v / max) * 55 - 2;
                            return `${x.toFixed(1)},${y.toFixed(1)}`;
                          }).join(' ')}
                        />
                      </svg>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        Pas encore de tendance disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides modernes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Plus,
                  title: 'Nouveau Cours',
                  description: 'Créer un cours',
                  color: 'bg-blue-500',
                  href: '/dashboard/instructor/courses'
                },
                {
                  icon: BookOpen,
                  title: 'Mes Modules',
                  description: 'Gérer les modules',
                  color: 'bg-indigo-500',
                  href: '/dashboard/instructor/modules'
                },
                {
                  icon: Users,
                  title: 'Mes Étudiants',
                  description: 'Gérer les étudiants',
                  color: 'bg-green-500',
                  href: '/dashboard/instructor/students'
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'Voir les statistiques',
                  color: 'bg-purple-500',
                  href: '/dashboard/instructor/analytics'
                },
                {
                  icon: FileText,
                  title: 'Évaluations',
                  description: 'Gérer les évaluations',
                  color: 'bg-teal-500',
                  href: '/dashboard/instructor/evaluations'
                },
                {
                  icon: MessageSquare,
                  title: 'Messages',
                  description: 'Voir les messages',
                  color: 'bg-cyan-500',
                  href: '/dashboard/instructor/messages'
                },
                {
                  icon: Award,
                  title: 'Gamification',
                  description: 'Gérer les badges',
                  color: 'bg-yellow-500',
                  href: '/dashboard/instructor/gamification'
                },
                {
                  icon: Settings,
                  title: 'Mon Profil',
                  description: 'Paramètres',
                  color: 'bg-gray-500',
                  href: '/dashboard/instructor/profile'
                }
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div className={`${action.color} p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications personnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  {notificationsWithMessages.length} notification{notificationsWithMessages.length > 1 ? 's' : ''} • {unreadNotificationsCount} non lue{unreadNotificationsCount > 1 ? 's' : ''}
                  {unreadMessages > 0 ? ` • ${unreadMessages} message${unreadMessages > 1 ? 's' : ''} non lu${unreadMessages > 1 ? 's' : ''}` : ''}
                </p>
              </div>
            </div>
            {notificationsLoading ? (
              <div className="py-6 text-center text-gray-500 text-sm">Chargement des notifications...</div>
            ) : notificationsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {notificationsError}
              </div>
            ) : notificationsWithMessages.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-6 text-center text-gray-500 text-sm">
                Aucune notification pour le moment.
              </div>
            ) : (
              <ul className="space-y-3">
                {notificationsWithMessages.slice(0, 6).map((notification) => (
                  <li key={notification.id} className={`rounded-xl border px-4 py-3 ${notification.is_read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{notification.title || 'Notification'}</span>
                          {notification.type && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                              {notification.type}
                            </span>
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{notification.message}</p>
                        )}
                        {/* Afficher le commentaire de manière lisible pour les notifications de cours */}
                        {notification.metadata?.comment && (
                          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-1">Commentaire :</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{notification.metadata.comment}</p>
                          </div>
                        )}
                        {/* Afficher la raison du rejet si présente */}
                        {notification.metadata?.rejection_reason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-700 mb-1">Raison du rejet :</p>
                            <p className="text-sm text-red-800">{notification.metadata.rejection_reason}</p>
                          </div>
                        )}
                        {/* Lien vers le cours si présent */}
                        {notification.metadata?.course_id && (
                          <Link
                            href={`/dashboard/instructor/courses/${notification.metadata.course_id}`}
                            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-mdsc-blue-primary hover:text-mdsc-blue-dark hover:underline"
                          >
                            <Eye className="w-4 h-4" />
                            Voir le cours
                          </Link>
                        )}
                        {/* Lien générique si présent */}
                        {notification.metadata?.link && typeof notification.metadata.link === 'string' && !notification.metadata?.course_id && (
                          <Link
                            href={notification.metadata.link}
                            className="mt-2 inline-flex text-sm font-medium text-mdsc-blue-primary hover:underline"
                          >
                            Consulter
                          </Link>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{formatDateTime(notification.created_at)}</span>
                          {notification.trigger_at && (
                            <span className="text-blue-600">Déclenchée le {formatDateTime(notification.trigger_at)}</span>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <span className="text-xs font-semibold text-mdsc-blue-primary">Non lu</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
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