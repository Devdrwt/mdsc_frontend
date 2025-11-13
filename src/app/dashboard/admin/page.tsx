'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useAuthStore } from '../../../lib/stores/authStore';
import AdminService, {
  AdminAlertEntry,
  AdminOverviewResponse,
  AdminServiceStatusResponse,
  AdminSystemMetricsResponse,
  AdminNotificationEntry,
  AdminEventEntry,
  AdminTopCourseEntry,
  AdminTopInstructorEntry,
  AdminPaymentEntry,
  AdminFeatureSummary,
} from '../../../lib/services/adminService';
import { 
  Users,
  User,
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
  Mail,
  Bell,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  XCircle,
  MapPin,
  Award,
  CreditCard,
  Headset,
  Brain,
  Star,
} from 'lucide-react';
import MessageService from '../../../lib/services/messageService';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsers: number;
  systemHealth: number;
  averageRating: number;
  monthlyUserGrowth: number;
  monthlyCourseGrowth: number;
  monthlyRevenueGrowth: number;
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
  id: string | number;
  type: string;
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

interface NotificationFormState {
  title: string;
  message: string;
  type: string;
  trigger_at: string;
  metadata: string;
}

interface EventFormState {
  title: string;
  description: string;
  type: string;
  start_at: string;
  end_at: string;
  location: string;
  course_id: string;
  is_public: boolean;
  metadata: string;
}

interface ServiceStatusCheck {
  id: string;
  name: string;
  status: 'up' | 'degraded' | 'down' | 'disabled';
  message?: string;
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
    monthlyUserGrowth: 0,
    monthlyCourseGrowth: 0,
    monthlyRevenueGrowth: 0,
    pendingModerations: 0
  });
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    uptime: '',
    lastBackup: ''
  });
  const [systemMetricsError, setSystemMetricsError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentActivityError, setRecentActivityError] = useState<string | null>(null);
  const [recentActivityNotice, setRecentActivityNotice] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertEntry[]>([]);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatusCheck[]>([]);
  const [serviceStatusSummary, setServiceStatusSummary] = useState<'up' | 'degraded' | 'down' | null>(null);
  const [serviceStatusCheckedAt, setServiceStatusCheckedAt] = useState<string | null>(null);
  const [serviceStatusError, setServiceStatusError] = useState<string | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationEntry[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState<NotificationFormState>({
    title: '',
    message: '',
    type: 'system',
    trigger_at: '',
    metadata: '',
  });
  const [notificationEditingId, setNotificationEditingId] = useState<number | string | null>(null);
  const [notificationFormError, setNotificationFormError] = useState<string | null>(null);
  const [notificationSuccessMessage, setNotificationSuccessMessage] = useState<string | null>(null);
  const [notificationsProcessing, setNotificationsProcessing] = useState(false);
  const [adminEvents, setAdminEvents] = useState<AdminEventEntry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>({
    title: '',
    description: '',
    type: 'general',
    start_at: '',
    end_at: '',
    location: '',
    course_id: '',
    is_public: true,
    metadata: '',
  });
  const [eventEditingId, setEventEditingId] = useState<number | string | null>(null);
  const [eventFormError, setEventFormError] = useState<string | null>(null);
  const [eventSuccessMessage, setEventSuccessMessage] = useState<string | null>(null);
  const [eventProcessing, setEventProcessing] = useState(false);
  const [topCourses, setTopCourses] = useState<AdminTopCourseEntry[]>([]);
  const [topCoursesError, setTopCoursesError] = useState<string | null>(null);
  const [topInstructors, setTopInstructors] = useState<AdminTopInstructorEntry[]>([]);
  const [topInstructorsError, setTopInstructorsError] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<AdminPaymentEntry[]>([]);
  const [recentPaymentsError, setRecentPaymentsError] = useState<string | null>(null);
  const [supportSummary, setSupportSummary] = useState<AdminFeatureSummary | null>(null);
  const [moderationSummary, setModerationSummary] = useState<AdminFeatureSummary | null>(null);
  const [aiUsageSummary, setAiUsageSummary] = useState<AdminFeatureSummary | null>(null);

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) {
      return 'Non disponible';
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${days}j`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (!parts.length) parts.push(`${Math.floor(seconds)}s`);
    return parts.join(' ');
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) {
      return 'Non disponible';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return 'Non disponible';
    }
    return date.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatCurrency = (amount?: number, currency: string = 'XOF') => {
    const safeAmount = Number.isFinite(amount) ? Number(amount) : 0;
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(safeAmount);
    } catch {
      return `${safeAmount.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  const formatPercent = (value?: number, digits = 1) => {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
    const scaled = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
    return `${scaled.toFixed(digits)}%`;
  };

  const formatDateForInput = (iso?: string | null) => {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const updateNotificationForm = <K extends keyof NotificationFormState>(field: K, value: NotificationFormState[K]) => {
    setNotificationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateEventForm = <K extends keyof EventFormState>(field: K, value: EventFormState[K]) => {
    setEventForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toNumber = (value: any): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === 'object') {
      if ('total' in value) return toNumber((value as any).total);
      if ('value' in value) return toNumber((value as any).value);
      if ('count' in value) return toNumber((value as any).count);
      if ('amount' in value) return toNumber((value as any).amount);
    }
    return 0;
  };

  const mapActivityEntry = (entry: any): RecentActivity => {
    const type = entry.type || 'system_event';

    const typeConfig: Record<
      string,
      {
        icon: React.ComponentType<any>;
        color: string;
        priority: 'low' | 'medium' | 'high';
        title: string;
      }
    > = {
      user_registered: {
            icon: Users,
            color: 'text-blue-500',
        priority: 'low',
        title: 'Nouvel utilisateur inscrit',
      },
      course_created: {
            icon: BookOpen,
            color: 'text-green-500',
        priority: 'medium',
        title: 'Nouveau cours créé',
      },
      payment_received: {
        icon: DollarSign,
        color: 'text-emerald-500',
        priority: 'low',
        title: 'Paiement reçu',
      },
      system_alert: {
            icon: AlertTriangle,
            color: 'text-red-500',
        priority: 'high',
        title: 'Alerte système',
      },
      default: {
        icon: Activity,
        color: 'text-gray-500',
        priority: 'low',
        title: 'Événement système',
      },
    };

    const config = typeConfig[type] ?? typeConfig.default;

    const userName = entry.user
      ? `${entry.user.first_name ?? ''} ${entry.user.last_name ?? ''}`.trim()
      : '';
    const courseTitle = entry.course?.title;

    let description = entry.description;
    if (!description) {
      if (courseTitle) {
        description = courseTitle;
      } else if (userName) {
        description = userName;
      } else if (entry.metadata && typeof entry.metadata === 'object') {
        description = entry.metadata.message || entry.metadata.description;
      }
    }

    return {
      id: entry.id,
      type,
      title: config.title,
      description: description || 'Événement enregistré',
      timestamp: formatDateTime(entry.created_at),
      icon: config.icon,
      color: config.color,
      priority: config.priority,
    };
  };

  const loadAdminNotifications = useCallback(async () => {
    if (!user) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const [notificationsResponse, messageStats] = await Promise.all([
        AdminService.getAdminNotifications({ page: 1, limit: 20 }),
        MessageService.getStats().catch(() => null),
      ]);
      setUnreadMessages(messageStats?.received_unread ?? 0);
      const notifications = notificationsResponse?.notifications ?? [];
      setAdminNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de charger les notifications administrateur';
      setNotificationsError(message);
      setAdminNotifications([]);
      setUnreadMessages(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  const loadAdminEvents = useCallback(async () => {
    if (!user) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const { events } = await AdminService.getAdminEvents({ page: 1, limit: 20 });
      setAdminEvents(Array.isArray(events) ? events : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de charger les événements administrateur';
      setEventsError(message);
      setAdminEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [user]);

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'system',
      trigger_at: '',
      metadata: '',
    });
    setNotificationEditingId(null);
  };

  const handleNotificationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotificationFormError(null);
    setNotificationSuccessMessage(null);

    const title = notificationForm.title.trim();
    if (!title) {
      setNotificationFormError('Le titre est requis.');
      return;
    }

    let metadata: Record<string, any> | null = null;
    if (notificationForm.metadata.trim()) {
      try {
        metadata = JSON.parse(notificationForm.metadata);
      } catch (err) {
        setNotificationFormError('Le champ métadonnées doit contenir un JSON valide.');
        return;
      }
    }

    const triggerIso = notificationForm.trigger_at
      ? new Date(notificationForm.trigger_at).toISOString()
      : undefined;

    const payload = {
      title,
      message: notificationForm.message.trim() || undefined,
      type: notificationForm.type.trim() || undefined,
      trigger_at: triggerIso,
      metadata,
    };

    try {
      setNotificationsProcessing(true);
      if (notificationEditingId) {
        await AdminService.updateAdminNotification(notificationEditingId, payload);
        setNotificationSuccessMessage('Notification mise à jour avec succès.');
      } else {
        await AdminService.createAdminNotification(payload);
        setNotificationSuccessMessage('Notification créée avec succès.');
      }
      resetNotificationForm();
      await loadAdminNotifications();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la notification.";
      setNotificationFormError(message);
    } finally {
      setNotificationsProcessing(false);
    }
  };

  const handleNotificationEdit = (notification: AdminNotificationEntry) => {
    setNotificationEditingId(notification.id);
    setNotificationForm({
      title: notification.title ?? '',
      message: notification.message ?? '',
      type: notification.type ?? 'system',
      trigger_at: formatDateForInput(notification.trigger_at ?? notification.created_at ?? null),
      metadata: notification.metadata ? JSON.stringify(notification.metadata, null, 2) : '',
    });
    setNotificationFormError(null);
    setNotificationSuccessMessage(null);
  };

  const handleNotificationDelete = async (id: number | string) => {
    if (!window.confirm('Supprimer cette notification ?')) {
      return;
    }
    try {
      await AdminService.deleteAdminNotification(id);
      setNotificationSuccessMessage('Notification supprimée.');
      await loadAdminNotifications();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de supprimer la notification.';
      setNotificationsError(message);
    }
  };

  const handleNotificationToggleRead = async (notification: AdminNotificationEntry) => {
    try {
      await AdminService.updateAdminNotification(notification.id, {
        is_read: !notification.is_read,
      });
      setAdminNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: !notification.is_read } : item
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour le statut de lecture.';
      setNotificationsError(message);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      type: 'general',
      start_at: '',
      end_at: '',
      location: '',
      course_id: '',
      is_public: true,
      metadata: '',
    });
    setEventEditingId(null);
  };

  const handleEventSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventFormError(null);
    setEventSuccessMessage(null);

    const title = eventForm.title.trim();
    if (!title) {
      setEventFormError('Le titre est requis.');
      return;
    }

    if (!eventForm.start_at) {
      setEventFormError('La date de début est requise.');
      return;
    }

    let metadata: Record<string, any> | null = null;
    if (eventForm.metadata.trim()) {
      try {
        metadata = JSON.parse(eventForm.metadata);
      } catch (err) {
        setEventFormError('Le champ métadonnées doit contenir un JSON valide.');
        return;
      }
    }

    const startDate = new Date(eventForm.start_at);
    if (Number.isNaN(startDate.getTime())) {
      setEventFormError('La date de début est invalide.');
      return;
    }

    const endDate = eventForm.end_at ? new Date(eventForm.end_at) : null;
    if (endDate && Number.isNaN(endDate.getTime())) {
      setEventFormError('La date de fin est invalide.');
      return;
    }

    const courseValueRaw = eventForm.course_id.trim();
    let courseValue: number | string | undefined;
    if (courseValueRaw) {
      const parsed = Number(courseValueRaw);
      courseValue = Number.isNaN(parsed) ? courseValueRaw : parsed;
    }

    const payload = {
      title,
      description: eventForm.description.trim() || undefined,
      type: eventForm.type.trim() || undefined,
      start_at: startDate.toISOString(),
      end_at: endDate ? endDate.toISOString() : undefined,
      location: eventForm.location.trim() || undefined,
      course_id: courseValue,
      is_public: eventForm.is_public,
      metadata,
    };

    try {
      setEventProcessing(true);
      if (eventEditingId) {
        await AdminService.updateAdminEvent(eventEditingId, payload);
        setEventSuccessMessage('Événement mis à jour avec succès.');
      } else {
        await AdminService.createAdminEvent(payload);
        setEventSuccessMessage('Événement créé avec succès.');
      }
      resetEventForm();
      await loadAdminEvents();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer l'événement.";
      setEventFormError(message);
    } finally {
      setEventProcessing(false);
    }
  };

  const handleEventEdit = (adminEvent: AdminEventEntry) => {
    setEventEditingId(adminEvent.id);
    setEventForm({
      title: adminEvent.title ?? '',
      description: adminEvent.description ?? '',
      type: adminEvent.type ?? 'general',
      start_at: formatDateForInput(adminEvent.start_at) ?? '',
      end_at: formatDateForInput(adminEvent.end_at ?? null),
      location: adminEvent.location ?? '',
      course_id: adminEvent.course_id ? String(adminEvent.course_id) : '',
      is_public: adminEvent.is_public ?? true,
      metadata: adminEvent.metadata ? JSON.stringify(adminEvent.metadata, null, 2) : '',
    });
    setEventFormError(null);
    setEventSuccessMessage(null);
  };

  const handleEventDelete = async (id: number | string) => {
    if (!window.confirm('Supprimer cet événement ?')) {
      return;
    }
    try {
      await AdminService.deleteAdminEvent(id);
      setEventSuccessMessage('Événement supprimé.');
      await loadAdminEvents();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'événement.";
      setEventsError(message);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setOverviewError(null);
    setSystemMetricsError(null);
    setRecentActivityError(null);
    setRecentActivityNotice(null);
    setAlertsError(null);
    setServiceStatusError(null);
    setTopCoursesError(null);
    setTopInstructorsError(null);
    setRecentPaymentsError(null);

    try {
      const [
        overviewResult,
        metricsResult,
        activityResult,
        alertsResult,
        servicesResult,
        topCoursesResult,
        topInstructorsResult,
        paymentsResult,
        supportResult,
        moderationResult,
        aiResult,
      ] = await Promise.allSettled([
        AdminService.getOverview(),
        AdminService.getSystemMetrics({ rangeMinutes: 60, historyLimit: 12 }),
        AdminService.getRecentActivity({ limit: 20 }),
        AdminService.getAlerts(),
        AdminService.getServiceStatus(),
        AdminService.getTopCourses({ limit: 6 }),
        AdminService.getTopInstructors({ limit: 6 }),
        AdminService.getRecentPayments({ limit: 8 }),
        AdminService.getSupportSummary(),
        AdminService.getModerationSummary(),
        AdminService.getAiUsageSummary(),
      ]);

      if (overviewResult.status === 'fulfilled') {
        const overview: AdminOverviewResponse = overviewResult.value ?? {};
        const totals = overview?.totals ?? {};
        const usersTotals = totals.users ?? {};
        const coursesTotals = totals.courses ?? {};
        const revenueTotals = totals.revenue?.totals ?? [];

        const monthlyUsers = overview?.monthly_growth?.users ?? [];
        const monthlyCourses = overview?.monthly_growth?.courses ?? [];
        const monthlyRevenue = overview?.monthly_growth?.revenue ?? [];

        const getLatestValue = (series: Array<{ value?: number; total_amount?: number }>) => {
          if (!series.length) return 0;
          const last = series[series.length - 1];
          return toNumber(
            (last as any)?.value ??
            (last as any)?.total_amount ??
            (last as any)?.amount ??
            0
          );
        };

        const totalRevenueAmount = revenueTotals.reduce((sum, item) => {
          const base = toNumber(item?.amount ?? item?.total_amount ?? (item as any)?.value);
          return sum + base;
        }, 0);

        const systemHealth = (() => {
          const totalUsersCount = toNumber(usersTotals.total);
          if (totalUsersCount > 0) {
            const active = toNumber(usersTotals.active);
            return Math.min(100, Math.max(0, Math.round((active / totalUsersCount) * 100)));
          }
          return 100;
        })();

        setStats({
          totalUsers: toNumber(usersTotals.total),
          totalCourses: toNumber(coursesTotals.total),
          totalRevenue: totalRevenueAmount,
          activeUsers: toNumber(usersTotals.active),
          systemHealth,
          averageRating: 0,
          monthlyUserGrowth: getLatestValue(monthlyUsers),
          monthlyCourseGrowth: getLatestValue(monthlyCourses),
          monthlyRevenueGrowth: getLatestValue(monthlyRevenue),
          pendingModerations: toNumber(coursesTotals.pending)
        });

        const coursesMap = new Map<string, number>();
        monthlyCourses.forEach((item) => {
          if (item?.month) {
            coursesMap.set(item.month, toNumber(item.value ?? (item as any).total ?? (item as any).count));
          }
        });
        const revenueMap = new Map<string, number>();
        monthlyRevenue.forEach((item) => {
          if (item?.month) {
            const val = item.total_amount ?? item.value ?? (item as any).amount ?? 0;
            revenueMap.set(item.month, toNumber(val));
          }
        });

        let months: string[] = [];
        if (monthlyUsers.length) {
          months = monthlyUsers.map((item) => item.month ?? '').filter(Boolean);
        } else {
          const keys = new Set<string>();
          monthlyCourses.forEach((item) => item?.month && keys.add(item.month));
          monthlyRevenue.forEach((item) => item?.month && keys.add(item.month));
          months = Array.from(keys);
        }

        setUserGrowth(
          months.map((month) => ({
            month,
            users: toNumber(
              monthlyUsers.find((item) => (item.month ?? '') === month)?.value ??
              (monthlyUsers.find((item) => (item.month ?? '') === month) as any)?.total ??
              (monthlyUsers.find((item) => (item.month ?? '') === month) as any)?.count ??
              0
            ),
            courses: coursesMap.get(month) ?? 0,
            revenue: revenueMap.get(month) ?? 0,
          }))
        );
      } else {
        const reason = overviewResult.reason as Error | undefined;
        const message =
          reason?.message ??
          'Impossible de récupérer les métriques administrateur';
        setOverviewError(message);
        setStats({
          totalUsers: 0,
          totalCourses: 0,
          totalRevenue: 0,
          activeUsers: 0,
          systemHealth: 0,
          averageRating: 0,
          monthlyUserGrowth: 0,
          monthlyCourseGrowth: 0,
          monthlyRevenueGrowth: 0,
          pendingModerations: 0
        });
        setUserGrowth([]);
      }

      if (metricsResult.status === 'fulfilled') {
        const metricsResponse: AdminSystemMetricsResponse = metricsResult.value ?? {};
        const metricsArray = metricsResponse.metrics ?? [];
        const metricMap = new Map<string, number>();
        metricsArray.forEach((metric) => {
          metricMap.set(metric.metric, Number(metric.value ?? 0));
        });

        const getMetricValue = (...keys: string[]) => {
          for (const key of keys) {
            if (metricMap.has(key)) {
              return metricMap.get(key) ?? 0;
            }
          }
          return 0;
        };

        setSystemMetrics({
          cpuUsage: getMetricValue('cpu_usage', 'cpu'),
          memoryUsage: getMetricValue('memory_usage', 'memory'),
          diskUsage: getMetricValue('disk_usage', 'disk'),
          networkLatency: getMetricValue('network_latency', 'network_latency_ms'),
          uptime: formatUptime(metricsResponse.uptime_seconds),
          lastBackup: formatDateTime(metricsResponse.last_backup_at || null),
        });
        setSystemMetricsError(null);
      } else {
        const reason = metricsResult.reason as Error | undefined;
        const message =
          reason?.message ??
          'Impossible de récupérer les métriques système';
        setSystemMetricsError(message);
        setSystemMetrics({
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          networkLatency: 0,
          uptime: '',
          lastBackup: ''
        });
      }

      if (activityResult.status === 'fulfilled') {
        const activities = (activityResult.value ?? []).map(mapActivityEntry);
        setRecentActivity(activities);
        setRecentActivityError(null);
        setRecentActivityNotice(
          activities.length ? null : 'Aucune activité récente pour le moment.'
        );
      } else {
        const reason = activityResult.reason as Error | undefined;
        const message =
          reason?.message ??
          'Impossible de récupérer les activités récentes';
        setRecentActivityError(message);
        setRecentActivityNotice(null);
        setRecentActivity([]);
      }

      if (alertsResult.status === 'fulfilled') {
        const alertsData = alertsResult.value ?? [];
        setAlerts(alertsData);
        setAlertsError(alertsData.length ? null : 'Aucune alerte récente.');
      } else {
        const reason = alertsResult.reason as Error | undefined;
        const message =
          reason?.message ??
          'Impossible de récupérer les alertes';
        setAlertsError(message);
        setAlerts([]);
      }

      if (servicesResult.status === 'fulfilled') {
        const servicesData: AdminServiceStatusResponse = servicesResult.value ?? {};
        setServiceStatus((servicesData.services ?? []).map((service) => ({
          ...service,
          details: service.details,
        })));
        setServiceStatusSummary(servicesData.summary ?? null);
        setServiceStatusCheckedAt(servicesData.checked_at ?? null);
        setServiceStatusError(null);
      } else {
        const reason = servicesResult.reason as Error | undefined;
        const message =
          reason?.message ??
          "Impossible de vérifier l'état des services";
        setServiceStatusError(message);
        setServiceStatus([]);
        setServiceStatusSummary(null);
        setServiceStatusCheckedAt(null);
      }

        if (topCoursesResult.status === 'fulfilled') {
          setTopCourses(topCoursesResult.value ?? []);
        } else {
          const reason = topCoursesResult.reason as Error | undefined;
          setTopCoursesError(reason?.message ?? 'Impossible de récupérer les cours les plus performants.');
          setTopCourses([]);
        }

        if (topInstructorsResult.status === 'fulfilled') {
          setTopInstructors(topInstructorsResult.value ?? []);
        } else {
          const reason = topInstructorsResult.reason as Error | undefined;
          setTopInstructorsError(reason?.message ?? 'Impossible de récupérer les meilleures performances instructeurs.');
          setTopInstructors([]);
        }

        if (paymentsResult.status === 'fulfilled') {
          setRecentPayments(paymentsResult.value ?? []);
        } else {
          const reason = paymentsResult.reason as Error | undefined;
          setRecentPaymentsError(reason?.message ?? 'Impossible de récupérer les transactions récentes.');
          setRecentPayments([]);
        }

        if (supportResult.status === 'fulfilled') {
          setSupportSummary(supportResult.value ?? null);
        } else {
          setSupportSummary({ message: 'Fonctionnalité support en développement.' });
        }

        if (moderationResult.status === 'fulfilled') {
          setModerationSummary(moderationResult.value ?? null);
        } else {
          setModerationSummary({ message: 'Fonctionnalité modération en développement.' });
        }

        if (aiResult.status === 'fulfilled') {
          setAiUsageSummary(aiResult.value ?? null);
        } else {
          setAiUsageSummary({ message: 'Statistiques IA en développement.' });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors du chargement du dashboard";
      setOverviewError((prev) => prev ?? message);
      setSystemMetricsError((prev) => prev ?? message);
      setRecentActivityError((prev) => prev ?? message);
        setAlertsError((prev) => prev ?? message);
        setServiceStatusError((prev) => prev ?? message);
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        activeUsers: 0,
        systemHealth: 0,
        averageRating: 0,
        monthlyUserGrowth: 0,
        monthlyCourseGrowth: 0,
        monthlyRevenueGrowth: 0,
        pendingModerations: 0
      });
      setSystemMetrics({
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        uptime: '',
        lastBackup: ''
      });
      setRecentActivity([]);
      setRecentActivityNotice(null);
      setAlerts([]);
      setServiceStatus([]);
      setUserGrowth([]);
      setTopCourses([]);
      setTopCoursesError((prev) => prev ?? message);
      setTopInstructors([]);
      setTopInstructorsError((prev) => prev ?? message);
      setRecentPayments([]);
      setRecentPaymentsError((prev) => prev ?? message);
      setSupportSummary({ message });
      setModerationSummary({ message });
      setAiUsageSummary({ message });
      } finally {
        setLoading(false);
      }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user, fetchDashboardData]);

  useEffect(() => {
    if (!user) return;
    loadAdminNotifications();
    loadAdminEvents();
  }, [user, loadAdminNotifications, loadAdminEvents]);

  const adminNotificationsWithMessages = useMemo(() => {
    if (unreadMessages > 0) {
      const messageEntry: AdminNotificationEntry = {
        id: 'admin-unread-messages',
        title: 'Messages non lus',
        message: `Vous avez ${unreadMessages} message${unreadMessages > 1 ? 's' : ''} non lu${
          unreadMessages > 1 ? 's' : ''
        }.`,
        type: 'message',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: { link: '/dashboard/instructor/messages' },
      };
      return [messageEntry, ...adminNotifications];
    }
    return adminNotifications;
  }, [adminNotifications, unreadMessages]);

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
          {overviewError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  Impossible de charger les métriques administrateur
                </p>
                <p className="text-sm text-red-700 mt-1">{overviewError}</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="ml-4 px-3 py-1 text-sm font-medium text-red-700 hover:text-red-900"
              >
                Réessayer
              </button>
            </div>
          )}
          {/* En-tête de bienvenue moderne avec effet shimmer */}
          <div className="relative overflow-hidden bg-gradient-to-br from-mdsc-blue-dark via-[#0C3C5C] to-[#1a4d6b] rounded-xl p-8 text-white shadow-2xl">
            {/* Effet shimmer animé */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-1">
                        Tableau de Bord Admin
                      </h1>
                      <p className="text-white/80 text-sm md:text-base">
                        Bienvenue, <span className="font-semibold">{user?.firstName || 'Administrateur'}</span> 👑
                      </p>
                    </div>
                  </div>
                  <p className="text-white/90 text-base md:text-lg ml-16">
                    Surveillez et gérez votre plateforme MdSC MOOC en temps réel
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
                    <div className="flex flex-col items-center">
                      <Activity className="h-10 w-10 text-white mb-2" />
                      <span className="text-xs text-white/80">Système</span>
                      <span className="text-lg font-bold text-white">{stats.systemHealth}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Effet de particules animées améliorées */}
            <div className="absolute top-6 right-6 w-3 h-3 bg-white/40 rounded-full animate-ping"></div>
            <div className="absolute top-10 right-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-16 w-2.5 h-2.5 bg-white/20 rounded-full animate-bounce"></div>
          </div>

          {/* Statistiques principales avec animations modernes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Carte Utilisateurs */}
            <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{stats.monthlyUserGrowth.toLocaleString()}
                    </div>
                    <span className="text-xs text-gray-500">ce mois</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            {/* Carte Cours */}
            <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Cours</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalCourses}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{stats.monthlyCourseGrowth.toLocaleString()}
                    </div>
                    <span className="text-xs text-gray-500">ce mois</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            {/* Carte Revenus */}
            <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Revenus Totaux</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mb-2">FCFA</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{stats.monthlyRevenueGrowth.toLocaleString()}
                    </div>
                    <span className="text-xs text-gray-500">ce mois</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            {/* Carte Santé Système */}
            <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Santé Système</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stats.systemHealth}%</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Optimal
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Server className="h-7 w-7 text-white" />
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
              {systemMetricsError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {systemMetricsError}
                </div>
              )}
              
              <div className="space-y-6">
                {/* CPU Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      CPU Usage
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {systemMetricsError ? 'N/A' : `${Math.round(systemMetrics.cpuUsage)}%`}
                    </span>
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
                    <span className="text-sm font-bold text-gray-900">
                      {systemMetricsError ? 'N/A' : `${Math.round(systemMetrics.memoryUsage)}%`}
                    </span>
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
                    <span className="text-sm font-bold text-gray-900">
                      {systemMetricsError ? 'N/A' : `${Math.round(systemMetrics.diskUsage)}%`}
                    </span>
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
                    <span className="text-sm font-bold text-gray-900">
                      {systemMetricsError ? 'N/A' : `${Math.round(systemMetrics.networkLatency)} ms`}
                    </span>
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
                    <span className="ml-2 font-medium text-gray-900">
                      {systemMetrics.uptime || 'Non disponible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dernière sauvegarde:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {systemMetrics.lastBackup || 'Non disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes et notifications */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Alertes & Notifications</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Surveillance système en temps réel</p>
                  </div>
                </div>
                {alerts.length > 0 && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
                    <span className="text-sm font-semibold text-orange-700">{alerts.length} alerte{alerts.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {alertsError ? (
                <div className="rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-sm text-red-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{alertsError}</span>
                  </div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Aucune alerte récente</p>
                  <p className="text-xs text-gray-500 mt-1">Tous les systèmes fonctionnent normalement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const severityConfig = {
                      danger: {
                        gradient: 'from-red-500 to-rose-600',
                        bg: 'bg-gradient-to-br from-red-50 to-rose-50',
                        border: 'border-red-200',
                        iconBg: 'bg-red-100',
                        iconColor: 'text-red-600',
                        badge: 'bg-red-500',
                        text: 'text-red-800',
                      },
                      warning: {
                        gradient: 'from-yellow-500 to-orange-500',
                        bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
                        border: 'border-yellow-200',
                        iconBg: 'bg-yellow-100',
                        iconColor: 'text-yellow-600',
                        badge: 'bg-yellow-500',
                        text: 'text-yellow-800',
                      },
                      info: {
                        gradient: 'from-blue-500 to-indigo-500',
                        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
                        border: 'border-blue-200',
                        iconBg: 'bg-blue-100',
                        iconColor: 'text-blue-600',
                        badge: 'bg-blue-500',
                        text: 'text-blue-800',
                      },
                    };
                    const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
                    
                    return (
                      <div
                        key={alert.id}
                        className={`group p-4 rounded-xl border-2 ${config.border} ${config.bg} hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 ${config.iconBg} rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                            <AlertTriangle className={`h-5 w-5 ${config.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{alert.title}</h4>
                                  <span className={`px-2 py-0.5 ${config.badge} text-white text-xs font-semibold rounded-full`}>
                                    {alert.severity === 'danger' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Info'}
                                  </span>
                                </div>
                                {alert.description && (
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{alert.description}</p>
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(alert.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Événements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Événements
              </h3>
              {eventsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {eventsError}
                </div>
              )}
              {eventSuccessMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {eventSuccessMessage}
                </div>
              )}
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div>
                  <label htmlFor="event-title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Titre
                  </label>
                  <input
                    type="text"
                    id="event-title"
                    value={eventForm.title}
                    onChange={(e) => updateEventForm('title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="event-description"
                    value={eventForm.description}
                    onChange={(e) => updateEventForm('description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="event-type" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Type
                  </label>
                  <select
                    id="event-type"
                    value={eventForm.type}
                    onChange={(e) => updateEventForm('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                  >
                    <option value="general">Général</option>
                    <option value="course_related">Relatif au cours</option>
                    <option value="system">Système</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="event-start-at" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    id="event-start-at"
                    value={eventForm.start_at}
                    onChange={(e) => updateEventForm('start_at', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-end-at" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    id="event-end-at"
                    value={eventForm.end_at}
                    onChange={(e) => updateEventForm('end_at', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="event-location" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lieu (optionnel)
                  </label>
                  <input
                    type="text"
                    id="event-location"
                    value={eventForm.location}
                    onChange={(e) => updateEventForm('location', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="event-course-id" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ID du cours (optionnel)
                  </label>
                  <input
                    type="text"
                    id="event-course-id"
                    value={eventForm.course_id}
                    onChange={(e) => updateEventForm('course_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="event-is-public"
                    checked={eventForm.is_public}
                    onChange={(e) => updateEventForm('is_public', e.target.checked)}
                    className="h-4 w-4 text-mdsc-blue-primary focus:ring-mdsc-blue-primary border-gray-300 rounded"
                  />
                  <label htmlFor="event-is-public" className="ml-2 text-sm font-medium text-gray-700">
                    Public
                  </label>
                </div>
                <div>
                  <label htmlFor="event-metadata" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Métadonnées (optionnel)
                  </label>
                  <textarea
                    id="event-metadata"
                    value={eventForm.metadata}
                    onChange={(e) => updateEventForm('metadata', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  {eventEditingId ? (
                    <button
                      type="submit"
                      disabled={eventProcessing}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    >
                      {eventProcessing ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={eventProcessing}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    >
                      {eventProcessing ? 'Création...' : 'Créer'}
                    </button>
                  )}
                  {eventEditingId && (
                    <button
                      type="button"
                      onClick={() => handleEventDelete(eventEditingId)}
                      disabled={eventProcessing}
                      className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 hover:shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {eventProcessing ? 'Suppression...' : 'Supprimer'}
                    </button>
                  )}
                </div>
              </form>
              {eventsLoading ? (
                <div className="text-center py-4">Chargement des événements...</div>
              ) : adminEvents.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  Aucun événement pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {adminEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border ${
                        event.is_public ? 'border-gray-200 bg-gray-50' : 'border-mdsc-blue-primary bg-mdsc-blue-light'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(event.start_at)}
                              {event.end_at && ` - ${formatDateTime(event.end_at)}`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.location ? `Lieu: ${event.location}` : 'Lieu: Non spécifié'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.course_id ? `Cours: #${event.course_id}` : 'Cours: Non spécifié'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEventEdit(event)}
                            className="p-2 rounded-full text-mdsc-blue-primary hover:bg-mdsc-blue-light focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:ring-offset-2"
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEventDelete(event.id)}
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance des cours et instructeurs */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-mdsc-blue-primary" />
                  Top Cours
                </h3>
                <span className="text-xs text-gray-400">Source : agrégations globales</span>
              </div>
              {topCoursesError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {topCoursesError}
                </div>
              ) : topCourses.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-600">
                  Aucun cours à afficher pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3.5 text-left font-semibold">Cours</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Inscriptions</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Complétion</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Note</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Revenu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {topCourses.slice(0, 6).map((course, index) => (
                        <tr 
                          key={course.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 group-hover:text-mdsc-blue-primary transition-colors">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                                  {course.title}
                                </p>
                                {course.category && (
                                  <p className="text-xs text-gray-500 mt-0.5">{course.category}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-medium text-gray-700">{course.enrollments.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {formatPercent(course.completion_rate, 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium text-gray-700">{course.average_rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(course.revenue, course.currency ?? 'XOF')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-mdsc-blue-primary" />
                  Instructeurs Performants
                </h3>
                <span className="text-xs text-gray-400">Source : agrégations instructeurs</span>
              </div>
              {topInstructorsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {topInstructorsError}
                </div>
              ) : topInstructors.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-600">
                  Aucun instructeur à mettre en avant pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {topInstructors.slice(0, 6).map((instructor, index) => (
                    <div
                      key={instructor.id}
                      className="group relative flex items-start justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 hover:border-mdsc-blue-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-transparent group-hover:from-blue-50/50 transition-all duration-200"></div>
                      <div className="relative z-10 flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                            {instructor.name}
                          </p>
                          {instructor.email && (
                            <p className="text-xs text-gray-500 mt-0.5">{instructor.email}</p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                              <BookOpen className="h-3 w-3" />
                              {instructor.courses_count} cours
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                              <Users className="h-3 w-3" />
                              {instructor.total_enrollments.toLocaleString()} inscrits
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {instructor.average_rating.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 text-right">
                        <p className="text-base font-bold text-emerald-600">
                          {formatCurrency(instructor.revenue, instructor.currency ?? 'XOF')}
                        </p>
                        {Number.isFinite(instructor.trend ?? null) && (
                          <p
                            className={`text-xs flex items-center justify-end gap-1 mt-1 font-semibold ${
                              (instructor.trend ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {(instructor.trend ?? 0) >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {formatPercent(Math.abs(instructor.trend ?? 0), 1)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions et centres opérationnels */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-mdsc-blue-primary" />
                  Transactions récentes
                </h3>
                <Link href="/dashboard/admin/payments" className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark">
                  Voir tout
                </Link>
              </div>
              {recentPaymentsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {recentPaymentsError}
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-600">
                  Aucune transaction récente.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3.5 text-left font-semibold">Référence</th>
                        <th className="px-4 py-3.5 text-left font-semibold">Utilisateur</th>
                        <th className="px-4 py-3.5 text-left font-semibold">Cours</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Montant</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Statut</th>
                        <th className="px-4 py-3.5 text-right font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {recentPayments.map((payment) => (
                        <tr 
                          key={payment.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                              {payment.reference ?? `#${payment.id}`}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div>
                              <p className="font-medium text-gray-900">{payment.user?.name ?? 'N/A'}</p>
                              {payment.user?.email && (
                                <p className="text-xs text-gray-500 mt-0.5">{payment.user.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-gray-700">{payment.course?.title ?? 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-bold text-emerald-600">
                              {formatCurrency(payment.amount, payment.currency ?? 'XOF')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                payment.status === 'completed' || payment.status === 'paid'
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : payment.status === 'failed' || payment.status === 'refunded'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              }`}
                            >
                              {(payment.status ?? 'pending').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-xs text-gray-500">{formatDateTime(payment.processed_at)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-mdsc-blue-primary" />
                Centres opérationnels
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: 'Support & tickets',
                    summary: supportSummary,
                    icon: Headset,
                    accent: 'text-blue-600',
                    bgAccent: 'bg-blue-100',
                    gradient: 'from-blue-50 to-blue-100/50',
                  },
                  {
                    title: 'Modération & conformité',
                    summary: moderationSummary,
                    icon: Shield,
                    accent: 'text-orange-600',
                    bgAccent: 'bg-orange-100',
                    gradient: 'from-orange-50 to-orange-100/50',
                  },
                  {
                    title: 'Usage IA & automatisations',
                    summary: aiUsageSummary,
                    icon: Brain,
                    accent: 'text-purple-600',
                    bgAccent: 'bg-purple-100',
                    gradient: 'from-purple-50 to-purple-100/50',
                  },
                ].map(({ title, summary, icon: Icon, accent, bgAccent, gradient }, index) => (
                  <div 
                    key={`${title}-${index}`} 
                    className="group relative p-4 rounded-xl border border-gray-200 bg-gradient-to-r hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
                    <div className="relative z-10 flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${bgAccent} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`h-5 w-5 ${accent}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 group-hover:text-gray-900 transition-colors">{title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {summary?.message ?? 'Statistiques en cours de synchronisation.'}
                        </p>
                        {summary?.updated_at && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière mise à jour : {formatDateTime(summary.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gestion notifications & événements */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Notifications administrateur</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Gestion des notifications système</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadAdminNotifications()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                  disabled={notificationsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} />
                  <span>Rafraîchir</span>
                </button>
              </div>

              {unreadMessages > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">
                      Vous avez <span className="font-bold">{unreadMessages}</span> message{unreadMessages > 1 ? 's' : ''} non lu{unreadMessages > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleNotificationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre</label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => updateNotificationForm('title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="Ex. Maintenance programmée"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) => updateNotificationForm('type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="system">Système</option>
                      <option value="reminder">Rappel</option>
                      <option value="alert">Alerte</option>
                      <option value="info">Information</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => updateNotificationForm('message', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                    placeholder="Décrivez le contenu de la notification"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Déclenchement (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={notificationForm.trigger_at}
                      onChange={(e) => updateNotificationForm('trigger_at', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Métadonnées (JSON) - optionnel</label>
                    <textarea
                      value={notificationForm.metadata}
                      onChange={(e) => updateNotificationForm('metadata', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                      placeholder='{"courseId": 42}'
                    />
                  </div>
                </div>

                {notificationFormError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {notificationFormError}
                  </div>
                )}
                {notificationSuccessMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {notificationSuccessMessage}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    disabled={notificationsProcessing}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {notificationEditingId ? 'Mettre à jour' : 'Créer'}
                  </button>
                  {notificationEditingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetNotificationForm();
                        setNotificationFormError(null);
                        setNotificationSuccessMessage(null);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Annuler la modification
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 border-t-2 border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    Notifications récentes
                  </h4>
                  {adminNotificationsWithMessages.length > 0 && (
                    <span className="text-xs font-medium text-gray-500">
                      {adminNotificationsWithMessages.length} notification{adminNotificationsWithMessages.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {notificationsLoading ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-medium text-gray-600">Chargement des notifications...</p>
                  </div>
                ) : notificationsError ? (
                  <div className="rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-red-800 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{notificationsError}</span>
                    </div>
                  </div>
                ) : adminNotificationsWithMessages.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Aucune notification enregistrée</p>
                    <p className="text-xs text-gray-500 mt-1">Les notifications apparaîtront ici</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {adminNotificationsWithMessages.map((notification) => {
                      const isMessagePlaceholder = String(notification.id) === 'admin-unread-messages';
                      return (
                        <li
                          key={notification.id}
                          className={`group rounded-xl border-2 px-4 py-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                            notification.is_read
                              ? 'border-gray-200 bg-white hover:border-gray-300'
                              : 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm font-bold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </span>
                                {!notification.is_read && (
                                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                                )}
                                {notification.type && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 uppercase font-semibold border border-gray-300">
                                    {notification.type}
                                  </span>
                                )}
                              </div>
                              {notification.message && (
                                <p className={`text-sm mt-2 leading-relaxed whitespace-pre-line ${
                                  notification.is_read ? 'text-gray-600' : 'text-gray-700 font-medium'
                                }`}>
                                  {notification.message}
                                </p>
                              )}
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDateTime(notification.created_at)}
                                </span>
                                {notification.trigger_at && (
                                  <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDateTime(notification.trigger_at)}
                                  </span>
                                )}
                              </div>
                              {!isMessagePlaceholder && notification.metadata && (
                                <div className="mt-3 space-y-2">
                                  {/* Affichage formaté pour les notifications de cours */}
                                  {notification.metadata.course_id && (
                                    <div className="bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-200 rounded-xl p-4 space-y-3 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                                          <BookOpen className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Informations du cours</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        {notification.metadata.course_id && (
                                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                            <span className="text-gray-500 font-medium">ID:</span>
                                            <span className="font-bold text-gray-900">#{notification.metadata.course_id}</span>
                                          </div>
                                        )}
                                        {notification.metadata.instructor_id && (
                                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                            <span className="text-gray-500 font-medium">Instructeur ID:</span>
                                            <span className="font-bold text-gray-900">#{notification.metadata.instructor_id}</span>
                                          </div>
                                        )}
                                        {notification.metadata.instructor_name && (
                                          <div className="col-span-2 flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-gray-500 font-medium">Instructeur:</span>
                                            <span className="font-bold text-gray-900">{notification.metadata.instructor_name}</span>
                                          </div>
                                        )}
                                        {notification.metadata.instructor_email && (
                                          <div className="col-span-2 flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-gray-500 font-medium">Email:</span>
                                            <span className="font-medium text-gray-700">{notification.metadata.instructor_email}</span>
                                          </div>
                                        )}
                                        {notification.metadata.course_title && (
                                          <div className="col-span-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <span className="text-gray-500 font-medium text-xs block mb-1">Titre du cours:</span>
                                            <span className="font-bold text-gray-900 text-sm">{notification.metadata.course_title}</span>
                                          </div>
                                        )}
                                      </div>
                                      {notification.metadata.course_id && (
                                        <div className="pt-3 border-t-2 border-blue-200">
                                          <Link
                                            href={`/dashboard/admin/courses?courseId=${notification.metadata.course_id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            Voir le cours
                                          </Link>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {notification.metadata?.link && typeof notification.metadata.link === 'string' && !notification.metadata.course_id && (
                                <Link
                                  href={notification.metadata.link}
                                  className="mt-2 inline-flex text-xs font-medium text-mdsc-blue-primary hover:underline"
                                >
                                  Consulter la messagerie
                                </Link>
                              )}
                            </div>
                            {isMessagePlaceholder ? (
                              <Link
                                href="/dashboard/instructor/messages"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-xs"
                              >
                                <Mail className="h-4 w-4" />
                                <span>Ouvrir la messagerie</span>
                              </Link>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleNotificationToggleRead(notification)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    notification.is_read
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {notification.is_read ? (
                                    <>
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span>Marquer non lu</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      <span>Marquer lu</span>
                                    </>
                                  )}
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationEdit(notification)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-xs font-medium"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    <span>Modifier</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationDelete(notification.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 text-xs font-medium"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Supprimer</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Événements & calendrier
                </h3>
                <button
                  type="button"
                  onClick={() => loadAdminEvents()}
                  className="inline-flex items-center text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  disabled={eventsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${eventsLoading ? 'animate-spin' : ''}`} />
                  Rafraîchir
                </button>
              </div>

              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => updateEventForm('title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="Ex. Webinaire en direct"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                    <input
                      type="text"
                      value={eventForm.type}
                      onChange={(e) => updateEventForm('type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="general, deadline, live..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => updateEventForm('description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                    placeholder="Détails sur l'événement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Début</label>
                    <input
                      type="datetime-local"
                      value={eventForm.start_at}
                      onChange={(e) => updateEventForm('start_at', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={eventForm.end_at}
                      onChange={(e) => updateEventForm('end_at', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lieu / Lien</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => updateEventForm('location', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="Zoom, Salle 301…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cours lié (ID)</label>
                    <input
                      type="text"
                      value={eventForm.course_id}
                      onChange={(e) => updateEventForm('course_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="Optionnel"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      id="event-public"
                      type="checkbox"
                      checked={eventForm.is_public}
                      onChange={(e) => updateEventForm('is_public', e.target.checked)}
                      className="rounded border-gray-300 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    />
                    <label htmlFor="event-public" className="text-sm font-medium text-gray-700">Événement public</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Métadonnées (JSON) - optionnel</label>
                  <textarea
                    value={eventForm.metadata}
                    onChange={(e) => updateEventForm('metadata', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                    placeholder='{"speaker": "Dr. Doe"}'
                  />
                </div>

                {eventFormError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {eventFormError}
                  </div>
                )}
                {eventSuccessMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {eventSuccessMessage}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    disabled={eventProcessing}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {eventEditingId ? 'Mettre à jour' : 'Programmer'}
                  </button>
                  {eventEditingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetEventForm();
                        setEventFormError(null);
                        setEventSuccessMessage(null);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Annuler la modification
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Événements à venir</h4>
                {eventsLoading ? (
                  <div className="py-6 text-center text-gray-500 text-sm">Chargement...</div>
                ) : eventsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {eventsError}
                  </div>
                ) : adminEvents.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600 text-center">
                    Aucun événement planifié.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {adminEvents.map((eventItem) => (
                      <li key={eventItem.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{eventItem.title}</span>
                              {eventItem.type && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase">
                                  {eventItem.type}
                                </span>
                              )}
                              {!eventItem.is_public && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  Privé
                                </span>
                              )}
                            </div>
                            {eventItem.description && (
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{eventItem.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1 text-blue-600">
                                <Clock className="h-3 w-3" /> {formatDateTime(eventItem.start_at)}
                              </span>
                              {eventItem.end_at && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <Clock className="h-3 w-3" /> {formatDateTime(eventItem.end_at)}
                                </span>
                              )}
                              {eventItem.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {eventItem.location}
                                </span>
                              )}
                              {eventItem.course_title && (
                                <span className="flex items-center gap-1 text-mdsc-blue-primary">
                                  <BookOpen className="h-3 w-3" /> {eventItem.course_title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => handleEventEdit(eventItem)}
                              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                            >
                              <Edit3 className="h-4 w-4 mr-1" /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEventDelete(eventItem.id)}
                              className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
                  color: 'from-blue-500 to-blue-600',
                  hoverColor: 'hover:from-blue-600 hover:to-blue-700',
                  href: '/dashboard/admin/users'
                },
                {
                  icon: BookOpen,
                  title: 'Modération Cours',
                  description: 'Modérer les cours',
                  color: 'from-green-500 to-emerald-600',
                  hoverColor: 'hover:from-green-600 hover:to-emerald-700',
                  href: '/dashboard/admin/courses'
                },
                {
                  icon: BarChart3,
                  title: 'Statistiques',
                  description: 'Statistiques détaillées',
                  color: 'from-purple-500 to-indigo-600',
                  hoverColor: 'hover:from-purple-600 hover:to-indigo-700',
                  href: '/dashboard/admin/statistics'
                },
                {
                  icon: Settings,
                  title: 'Paramètres',
                  description: 'Configuration système',
                  color: 'from-gray-500 to-gray-600',
                  hoverColor: 'hover:from-gray-600 hover:to-gray-700',
                  href: '/dashboard/admin/settings'
                }
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group relative flex items-center p-5 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className={`relative z-10 bg-gradient-to-br ${action.color} ${action.hoverColor} p-3.5 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="relative z-10 flex-1">
                    <p className="font-bold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUp className="h-4 w-4 text-mdsc-blue-primary transform rotate-45" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
              Activité Récente
            </h3>
            {recentActivityError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {recentActivityError}
              </div>
            )}
            {recentActivityNotice && !recentActivityError && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {recentActivityNotice}
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
            ) : null}
          </div>

          {/* Statut des services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Server className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                État des services
              </h3>
              <span className="text-sm text-gray-500">
                {serviceStatusCheckedAt
                  ? `Dernière vérification : ${formatDateTime(serviceStatusCheckedAt)}`
                  : 'Vérification en cours'}
              </span>
            </div>
            {serviceStatusError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serviceStatusError}
              </div>
            ) : serviceStatus.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Aucun service vérifié pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {serviceStatusSummary && (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      serviceStatusSummary === 'up'
                        ? 'border border-green-200 bg-green-50 text-green-700'
                        : serviceStatusSummary === 'degraded'
                        ? 'border border-yellow-200 bg-yellow-50 text-yellow-700'
                        : 'border border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {serviceStatusSummary === 'up'
                      ? 'Tous les services sont opérationnels.'
                      : serviceStatusSummary === 'degraded'
                      ? 'Certains services présentent des dégradations.'
                      : 'Un ou plusieurs services sont indisponibles.'}
                  </div>
                )}

                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                  {serviceStatus.map((service, index) => (
                    <div key={`${service.id ?? index}-${service.name ?? 'service'}`} className="flex items-start justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        {service.message && (
                          <p className="text-sm text-gray-600 mt-1">{service.message}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          service.status === 'up'
                            ? 'bg-green-100 text-green-700'
                            : service.status === 'degraded'
                            ? 'bg-yellow-100 text-yellow-700'
                            : service.status === 'down'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {service.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}