'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import StudentService, {
  StudentBadgeEntry,
  StudentCertificateEntry,
  StudentActivityEntry,
  StudentStatsResponse,
} from '../../../lib/services/studentService';
import { courseService } from '../../../lib/services/courseService';
import { 
  BookOpen, 
  Trophy, 
  Award, 
  Clock, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Brain,
  Target,
  Play,
  CheckCircle,
  Star,
  Flame,
  ArrowRight,
  Bookmark,
  Bell,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  XCircle,
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

interface NormalizedCourse {
  id: string;
  title: string;
  progress: number;
  instructorName?: string;
  nextLesson?: string;
  certificateUrl?: string | null;
  updatedAt?: string | null;
  enrolledAt?: string | null;
}

const computeCourseStats = (courses: NormalizedCourse[]) => {
  const totalCourses = courses.length;
  const completedCourses = courses.filter((course) => course.progress >= 100).length;
  const inProgressCourses = courses.filter((course) => course.progress > 0 && course.progress < 100).length;
  const averageProgress = totalCourses > 0
    ? Math.round(
        courses.reduce((acc, course) => acc + Math.min(Math.max(course.progress, 0), 100), 0) /
          totalCourses
      )
    : 0;

  return { totalCourses, completedCourses, inProgressCourses, averageProgress };
};

const normalizeCourses = (rawCourses: any[]): NormalizedCourse[] => {
  return rawCourses.map((course) => {
    const courseAny = course as any;
    const progressRaw =
      courseAny.progress_percentage ??
      courseAny.progress ??
      courseAny.enrollment?.progress_percentage ??
      courseAny.progressValue ??
      0;
    const progress = Number.isFinite(Number(progressRaw)) ? Math.max(0, Math.min(100, Number(progressRaw))) : 0;

    const instructorName = (() => {
      if (typeof courseAny.instructor === 'string') return courseAny.instructor;
      if (courseAny.instructor?.name) return courseAny.instructor.name;
      const firstName =
        courseAny.instructor?.firstName ??
        courseAny.instructor?.first_name ??
        courseAny.instructor_first_name ??
        '';
      const lastName =
        courseAny.instructor?.lastName ??
        courseAny.instructor?.last_name ??
        courseAny.instructor_last_name ??
        '';
      const fallback = [firstName, lastName].filter(Boolean).join(' ');
      return fallback || undefined;
    })();

    const nextLessonTitle =
      courseAny.next_lesson?.title ||
      courseAny.nextLesson?.title ||
      courseAny.nextLessonTitle ||
      null;

    const certificateUrl =
      courseAny.certificate?.pdf_url ??
      courseAny.certificate?.url ??
      courseAny.certificate_url ??
      null;

    const updatedAt =
      courseAny.updated_at ??
      courseAny.updatedAt ??
      courseAny.enrollment?.updated_at ??
      courseAny.enrollment?.last_accessed_at ??
      null;

    const enrolledAt =
      courseAny.enrollment?.enrolled_at ??
      courseAny.enrolledAt ??
      courseAny.created_at ??
      courseAny.createdAt ??
      null;

    return {
      id: String(courseAny.id ?? courseAny.course_id ?? courseAny.courseId ?? ''),
      title: courseAny.title ?? courseAny.course_title ?? 'Cours sans titre',
      progress,
      instructorName,
      nextLesson: nextLessonTitle || undefined,
      certificateUrl,
      updatedAt,
      enrolledAt,
    };
  });
};

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const authStore = useAuthStore();
  const user = authStore.user;
  const authLoading = authStore.isLoading ?? false;
  const hasHydrated = authStore.hasHydrated ?? false;

  // Gérer les redirections GobiPay après paiement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    
    // Gérer les URLs malformées comme payment=success/?transaction_slug=...
    // Extraire manuellement les paramètres depuis l'URL
    let payment: string | null = null;
    let transactionSlug: string | null = null;
    let orderSlug: string | null = null;
    let status: string | null = null;

    // Méthode 1: Essayer avec useSearchParams (méthode normale)
    const paymentFromSearch = searchParams.get('payment');
    const transactionSlugFromSearch = searchParams.get('transaction_slug');
    const orderSlugFromSearch = searchParams.get('order_slug');
    const statusFromSearch = searchParams.get('status');

    if (paymentFromSearch && paymentFromSearch !== 'success/?transaction_slug') {
      // URL normale
      payment = paymentFromSearch;
      transactionSlug = transactionSlugFromSearch;
      orderSlug = orderSlugFromSearch;
      status = statusFromSearch;
    } else {
      // URL malformée - parser manuellement
      const urlMatch = currentUrl.match(/[?&]payment=([^&]*)/);
      if (urlMatch) {
        const paymentValue = urlMatch[1];
        // Si payment contient "success" même avec d'autres caractères après
        if (paymentValue.includes('success')) {
          payment = 'success';
        } else {
          payment = paymentValue;
        }
      }

      // Extraire transaction_slug
      const transactionMatch = currentUrl.match(/[?&]transaction_slug=([^&]*)/);
      if (transactionMatch) {
        transactionSlug = decodeURIComponent(transactionMatch[1]);
      }

      // Extraire order_slug
      const orderMatch = currentUrl.match(/[?&]order_slug=([^&]*)/);
      if (orderMatch) {
        orderSlug = decodeURIComponent(orderMatch[1]);
      }

      // Extraire status
      const statusMatch = currentUrl.match(/[?&]status=([^&]*)/);
      if (statusMatch) {
        status = decodeURIComponent(statusMatch[1]);
      }
    }

    console.log('[GobiPay] 🔍 Vérification des paramètres de paiement', {
      payment,
      transactionSlug,
      orderSlug,
      status,
      currentUrl,
      paymentFromSearch,
    });

    // Si GobiPay redirige avec payment=success ET qu'on a transaction_slug ou order_slug (première redirection depuis GobiPay)
    if ((payment === 'success' || (payment && payment.includes('success'))) && (transactionSlug || orderSlug)) {
      // Vérifier si on a déjà traité ce paiement (éviter les boucles)
      const processedKey = `gobipay_processed_${transactionSlug || orderSlug}`;
      if (sessionStorage.getItem(processedKey)) {
        console.log('[GobiPay] ⚠️ Paiement déjà traité, redirection vers /dashboard/student/courses');
        // Rediriger vers la page des cours
        window.location.href = '/dashboard/student/courses?payment=success';
        return;
      }

      // Marquer comme traité
      sessionStorage.setItem(processedKey, 'true');

      const params = new URLSearchParams({
        payment: 'success',
        ...(transactionSlug && { transaction_slug: transactionSlug }),
        ...(orderSlug && { order_slug: orderSlug }),
        ...(status && { status: status }),
      });

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const apiUrl = `${backendUrl}/api/payments/auto-finalize-gobipay?${params.toString()}`;
      
      console.log('[GobiPay] ✅ Détection de payment=success avec transaction_slug/order_slug sur /dashboard/student, redirection vers l\'API...', apiUrl);
      
      // Rediriger vers l'API qui va finaliser le paiement, créer l'enrollment et rediriger vers /dashboard/student/courses
      window.location.href = apiUrl;
    } else if (payment === 'success' && !transactionSlug && !orderSlug) {
      // Si payment=success mais pas de transaction_slug/order_slug, rediriger vers la page des cours
      console.log('[GobiPay] ✅ payment=success sans transaction_slug/order_slug, redirection vers /dashboard/student/courses');
      window.location.href = '/dashboard/student/courses?payment=success';
    } else if (payment === 'failed' || payment === 'cancelled' || (payment && (payment.includes('failed') || payment.includes('cancelled')))) {
      // Nettoyer l'URL pour les échecs/annulations
      const errorStatus = payment?.includes('failed') ? 'failed' : 'cancelled';
      console.log(`[GobiPay] ⚠️ Paiement ${errorStatus}, redirection vers /dashboard/student/courses`);
      // Rediriger vers la page des cours avec le statut
      window.location.href = `/dashboard/student/courses?payment=${errorStatus}`;
    } else if (payment === 'error') {
      // Rediriger vers la page des cours sans paramètres d'erreur
      console.log('[GobiPay] ⚠️ Erreur de paiement, redirection vers /dashboard/student/courses');
      window.location.href = '/dashboard/student/courses';
    }
  }, [searchParams]);
  const [courses, setCourses] = useState<NormalizedCourse[]>([]);
  const courseCards = useMemo<CourseProgressCard[]>(() => {
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      progress: Math.round(course.progress ?? 0),
      instructorName: course.instructorName,
      certificateAvailable: Boolean(course.certificateUrl),
      nextLesson: course.nextLesson,
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [badges, setBadges] = useState<StudentBadgeEntry[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificateEntry[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  const [certificatesError, setCertificatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false);

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
    // Attendre que l'authentification soit hydratée
    if (!hasHydrated || authLoading) {
      return;
    }

    // Si l'utilisateur n'est pas disponible après l'hydratation, arrêter le chargement
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const buildFallbackActivities = (normalizedCourses: NormalizedCourse[]): RecentActivity[] => {
      const activity: RecentActivity[] = [];
      normalizedCourses.forEach((course) => {
        const progress = Math.round(course.progress);
        if (!course.updatedAt && progress === 0) {
          return;
        }

        const baseTimestamp = course.updatedAt || course.enrolledAt || new Date().toISOString();

        if (progress === 100) {
          activity.push({
            id: `completed-${course.id}`,
            type: 'course_completed',
            title: 'Cours terminé',
            description: course.title,
            timestamp: formatDateTime(baseTimestamp),
            icon: CheckCircle,
            color: 'text-green-500',
            points: 50,
          });
        } else if (progress > 0) {
          activity.push({
            id: `in-progress-${course.id}`,
            type: 'course_progress',
            title: 'Progression enregistrée',
            description: `${course.title} — ${progress}%`,
            timestamp: formatDateTime(baseTimestamp),
            icon: Play,
            color: 'text-blue-500',
            points: 10,
          });
        } else {
          activity.push({
            id: `started-${course.id}`,
            type: 'course_started',
            title: 'Cours commencé',
            description: course.title,
            timestamp: formatDateTime(baseTimestamp),
            icon: Play,
            color: 'text-blue-500',
            points: 5,
          });
        }
      });
      return activity.slice(0, 10);
    };

    const loadDashboardData = async () => {
        setLoading(true);
      setCoursesError(null);
      setStatsError(null);
      setActivityError(null);
      setBadgesError(null);
      setCertificatesError(null);

      let normalizedCourses: NormalizedCourse[] = [];
      let fallbackActivitiesCache: RecentActivity[] = [];
      let fallbackPoints = 0;
      let fallbackWeeklyGoal = 0;
      let fallbackWeeklyProgress = 0;
      let fallbackBadgesCount = 0;
      let fallbackCertificatesCount = 0;
      let fallbackNotifications = 0;
      let fallbackUnreadNotifications = 0;
      let fallbackLevel = 'Débutant';
      let fallbackStreak = 1;

      try {
        const [coursesResult, statsResult, activityResult, badgesResult, certificatesResult] = await Promise.allSettled([
          courseService.getMyCourses(),
          StudentService.getStats(),
          StudentService.getActivities({ limit: 20 }),
          StudentService.getBadges(),
          StudentService.getCertificates(),
        ]);

        if (!isMounted) return;

        if (coursesResult.status === 'fulfilled' && Array.isArray(coursesResult.value)) {
          normalizedCourses = normalizeCourses(coursesResult.value);
          setCourses(normalizedCourses);
        } else {
          const reason = coursesResult.status === 'rejected' ? coursesResult.reason as Error : null;
          setCoursesError(reason?.message ?? 'Impossible de récupérer vos cours');
          normalizedCourses = [];
          setCourses([]);
        }

        const { totalCourses, completedCourses, inProgressCourses, averageProgress } = computeCourseStats(normalizedCourses);
        const startedCourses = normalizedCourses.filter((course) => course.progress > 0);
        fallbackPoints = normalizedCourses.reduce((acc, course) => {
          const progressValue = Math.max(0, Math.min(100, course.progress));
          const progressPoints = Math.round(progressValue);
          const completionBonus = progressValue >= 100 ? 50 : 0;
          return acc + progressPoints + completionBonus;
        }, 0);
        fallbackBadgesCount = completedCourses;
        fallbackCertificatesCount = completedCourses;
        fallbackWeeklyGoal = Math.max(1, startedCourses.length || inProgressCourses || totalCourses);
        fallbackWeeklyProgress = Math.min(
          fallbackWeeklyGoal,
          Math.max(0, startedCourses.length)
        );
        fallbackLevel = fallbackPoints >= 400 ? 'Expert' : fallbackPoints >= 200 ? 'Intermédiaire' : 'Débutant';
        fallbackStreak = Math.min(7, Math.max(1, startedCourses.length || completedCourses));
        fallbackActivitiesCache = buildFallbackActivities(normalizedCourses);
        fallbackNotifications = fallbackActivitiesCache.length;
        fallbackUnreadNotifications = Math.min(fallbackNotifications, 3);

        if (statsResult.status === 'fulfilled') {
          const statsData: StudentStatsResponse = statsResult.value ?? {};
          const courseStats = statsData.courses ?? {};
          const gamification = statsData.gamification ?? {};
          const notificationStats = (statsData as any).notifications ?? {};
          const calendarStats = (statsData as any).calendar ?? {};

          const resolvedPoints = toNumber(gamification.points);
          const resolvedWeeklyGoal = toNumber(gamification.weekly_goal);
          const resolvedWeeklyProgress = toNumber(gamification.weekly_progress);
          const resolvedBadges = toNumber((statsData as any).badges);
          const resolvedCertificates = toNumber((statsData as any).certificates);
          const resolvedStreak = toNumber(gamification.streak_days);
          const resolvedNotifications = toNumber(notificationStats.total);
          const resolvedUnread = toNumber(notificationStats.unread);
          const resolvedUpcoming = toNumber(
            (calendarStats as any).upcoming_events ??
              (calendarStats as any).total ??
              (calendarStats as any).count
          );

          const effectiveWeeklyGoal = fallbackWeeklyGoal > 0
            ? fallbackWeeklyGoal
            : resolvedWeeklyGoal > 0
            ? resolvedWeeklyGoal
            : 1;

          const rawWeeklyProgress = fallbackWeeklyProgress > 0
            ? fallbackWeeklyProgress
            : resolvedWeeklyProgress;

          const effectiveWeeklyProgress = Math.min(
            effectiveWeeklyGoal,
            rawWeeklyProgress > 0 ? rawWeeklyProgress : 0
          );

        setStats({
            totalCourses: totalCourses || toNumber((courseStats as any).total || courseStats.active || 0),
            completedCourses: completedCourses || toNumber(courseStats.completed || 0),
            inProgressCourses,
            totalPoints: resolvedPoints > 0 ? resolvedPoints : fallbackPoints,
            currentLevel: gamification.level ?? fallbackLevel,
            streak: resolvedStreak > 0 ? resolvedStreak : fallbackStreak,
            weeklyGoal: effectiveWeeklyGoal,
            weeklyProgress: effectiveWeeklyProgress,
            totalBadges: resolvedBadges > 0 ? resolvedBadges : fallbackBadgesCount,
            totalCertificates: resolvedCertificates > 0 ? resolvedCertificates : fallbackCertificatesCount,
            totalNotifications: resolvedNotifications > 0 ? resolvedNotifications : fallbackNotifications,
            unreadNotifications: resolvedUnread > 0 ? resolvedUnread : fallbackUnreadNotifications,
            upcomingEvents: resolvedUpcoming,
          });
        } else {
          const reason = statsResult.status === 'rejected' ? (statsResult.reason as Error) : undefined;
          setStatsError(reason?.message ?? 'Impossible de récupérer vos statistiques');
          setStats((prev) => ({
            ...prev,
            totalCourses,
            completedCourses,
            inProgressCourses,
            totalPoints: fallbackPoints,
            currentLevel: fallbackLevel,
            streak: fallbackStreak,
            weeklyGoal: fallbackWeeklyGoal,
            weeklyProgress: fallbackWeeklyProgress,
            totalBadges: fallbackBadgesCount,
            totalCertificates: fallbackCertificatesCount,
            totalNotifications: fallbackNotifications,
            unreadNotifications: fallbackUnreadNotifications,
            upcomingEvents: 0,
          }));
        }

        if (activityResult.status === 'fulfilled') {
          const entries = activityResult.value ?? [];
          if (entries.length > 0) {
            setRecentActivity((entries as StudentActivityEntry[]).map((entry) => {
              const iconMap: Record<string, { icon: React.ComponentType<any>; color: string; title: string }> = {
                course_enrolled: { icon: BookOpen, color: 'text-indigo-500', title: 'Inscription réussie' },
                course_started: { icon: Play, color: 'text-blue-500', title: 'Cours commencé' },
                course_completed: { icon: CheckCircle, color: 'text-green-500', title: 'Cours terminé' },
                quiz_passed: { icon: Star, color: 'text-yellow-500', title: 'Quiz réussi' },
                quiz_failed: { icon: XCircle, color: 'text-red-500', title: 'Quiz échoué' },
                badge_earned: { icon: Trophy, color: 'text-orange-500', title: 'Badge obtenu' },
                certificate_issued: { icon: Award, color: 'text-purple-500', title: 'Attestation obtenue' },
                message_received: { icon: MessageSquare, color: 'text-cyan-500', title: 'Message reçu' },
                message_sent: { icon: Send, color: 'text-[#3B7C8A]', title: 'Message envoyé' },
                evaluation_submitted: { icon: FileText, color: 'text-blue-500', title: 'Évaluation soumise' },
                evaluation_passed: { icon: CheckCircle, color: 'text-green-500', title: 'Évaluation réussie' },
                evaluation_failed: { icon: XCircle, color: 'text-red-500', title: 'Évaluation échouée' },
                course_progress: { icon: TrendingUp, color: 'text-blue-500', title: 'Progression enregistrée' },
                payment_failed: { icon: XCircle, color: 'text-red-500', title: 'Paiement échoué' },
                payment_cancelled: { icon: XCircle, color: 'text-orange-500', title: 'Paiement annulé' },
                payment_pending: { icon: Clock, color: 'text-yellow-500', title: 'Paiement en cours' },
              };
              const config = iconMap[entry.type] ?? {
                icon: Play,
                color: 'text-gray-500',
                title: 'Activité',
              };
              // Le backend envoie activity_type, mais on peut aussi avoir type
              const activityType = entry.type || (entry as any).activity_type || 'unknown';
              const description =
                entry.description ||
                entry.metadata?.message ||
                entry.metadata?.description ||
                entry.metadata?.courseTitle ||
                'Activité enregistrée';
              
              // Utiliser le type d'activité pour trouver la bonne configuration
              const activityConfig = iconMap[activityType] ?? {
                icon: Play,
                color: 'text-gray-500',
                title: 'Activité',
              };
              
              return {
                id: entry.id,
                type: activityType,
                title: activityConfig.title,
                description,
                timestamp: formatDateTime(entry.created_at),
                icon: activityConfig.icon,
                color: activityConfig.color,
                points: entry.points,
              };
            }));
          } else {
            setRecentActivity(fallbackActivitiesCache);
          }
        } else {
          const reason = activityResult.status === 'rejected' ? (activityResult.reason as Error) : undefined;
          setActivityError(reason?.message ?? 'Impossible de récupérer votre activité récente');
          setRecentActivity(fallbackActivitiesCache);
        }

        if (badgesResult.status === 'fulfilled') {
          const badgeEntries = badgesResult.value ?? [];
          setBadges(badgeEntries);
          setStats((prev) => ({
            ...prev,
            totalBadges: Array.isArray(badgeEntries) ? badgeEntries.length : prev.totalBadges,
          }));
        } else {
          const reason = badgesResult.status === 'rejected' ? (badgesResult.reason as Error) : undefined;
          setBadgesError(reason?.message ?? 'Impossible de récupérer vos badges');
          setBadges([]);
        }

        if (certificatesResult.status === 'fulfilled') {
          const certificateEntries = certificatesResult.value ?? [];
          setCertificates(certificateEntries);
          setStats((prev) => ({
            ...prev,
            totalCertificates: Array.isArray(certificateEntries) ? certificateEntries.length : prev.totalCertificates,
          }));
        } else {
          const reason = certificatesResult.status === 'rejected' ? (certificatesResult.reason as Error) : undefined;
          setCertificatesError(reason?.message ?? 'Impossible de récupérer vos certificats');
          setCertificates([]);
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
        const fallbackStats = computeCourseStats(normalizedCourses.length ? normalizedCourses : courses);
        setStats((prev) => ({
          ...prev,
          totalCourses: fallbackStats.totalCourses,
          completedCourses: fallbackStats.completedCourses,
          inProgressCourses: fallbackStats.inProgressCourses,
          totalPoints: fallbackPoints,
          currentLevel: fallbackLevel,
          streak: fallbackStreak,
          weeklyGoal: fallbackWeeklyGoal,
          weeklyProgress: fallbackWeeklyProgress,
          totalBadges: fallbackBadgesCount,
          totalCertificates: fallbackCertificatesCount,
          totalNotifications: fallbackNotifications,
          unreadNotifications: fallbackUnreadNotifications,
          upcomingEvents: 0,
        }));
        setRecentActivity(
          fallbackActivitiesCache.length ? fallbackActivitiesCache : buildFallbackActivities(normalizedCourses.length ? normalizedCourses : courses)
        );
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, hasHydrated, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-8">
          {/* En-tête de bienvenue moderne */}
          <div className="relative overflow-hidden bg-mdsc-blue-primary rounded-2xl p-8 text-white">
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
            <div className="absolute top-4 droite-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 right-12 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce"></div>
          </div>

          {/* Statistiques principales avec animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg-grid-cols-4 gap-6">
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

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all durée-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Terminés</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.totalCertificates} attestations obtenues
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all durée-300">
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

            <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all durée-300">
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
                <p className="text-3xl font-bold text-gray-900">{stats.totalNotifications}</p>
                <p className="text-xs text-mdsc-blue-primary mt-1">
                  {stats.unreadNotifications} non lue{stats.unreadNotifications !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Évènements à venir</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
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
                          <span>Attestation disponible</span>
                        </span>
                      )}
                      </div>
                    </div>
                ))}
                {courseCards.length > 3 && (
                  <a 
                    href="/dashboard/student/courses"
                    className="w-full text-center py-2 text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Voir tous les cours ({courseCards.length})</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-mdsc-gold" />
                  Objectif Hebdomadaire
                </h3>
                <span className="text-sm text-gray-500">
                  {stats.weeklyProgress}/{stats.weeklyGoal}
                </span>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Play,
                  title: 'Continuer',
                  description: 'Reprendre mes cours',
                  color: 'bg-blue-500',
                  href: '/dashboard/student/courses',
                },
                {
                  icon: Brain,
                  title: 'Assistant IA',
                  description: 'Poser une question',
                  color: 'bg-purple-500',
                  href: '/dashboard/student/chat-ai',
                },
                {
                  icon: Award,
                  title: 'Évaluations',
                  description: 'Quiz et devoirs',
                  color: 'bg-yellow-500',
                  href: '/dashboard/student/evaluations',
                },
                {
                  icon: Bookmark,
                  title: 'Favoris',
                  description: 'Cours sauvegardés',
                  color: 'bg-green-500',
                  href: '/dashboard/student/favorites',
                },
              ].map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="group flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all durée-300 hover:scale-105"
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Activité Récente
              </h3>
              {recentActivity.length > 5 && (
                <button
                  onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
                  className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark flex items-center space-x-1 transition-colors"
                >
                  <span>{isActivitiesExpanded ? 'Réduire' : `Voir tout (${recentActivity.length})`}</span>
                  {isActivitiesExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {activityError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {activityError}
              </div>
            )}
            {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {(isActivitiesExpanded ? recentActivity : recentActivity.slice(0, 5)).map((activity) => (
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
                      <p className="text-xs text-gray-400 mt-2">
                        Gagné le {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString('fr-FR') : '—'}
                      </p>
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
                    <h3 className="text-lg font-semibold text-gray-900">Mes attestations</h3>
                    <p className="text-sm text-gray-500">
                      {certificates.length} attestation{certificates.length > 1 ? 's' : ''} obtenue{certificates.length > 1 ? 's' : ''}
                    </p>
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
                  <p className="text-gray-500 mb-2">Aucune attestation obtenue</p>
                  <p className="text-sm text-gray-400">Terminez un cours pour générer votre première attestation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function StudentDashboard() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
          </div>
        }>
          <StudentDashboardContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}