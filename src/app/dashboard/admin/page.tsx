'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
} from '../../../lib/services/adminService';
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
  Mail,
  Bell,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  XCircle,
  MapPin,
} from 'lucide-react';

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
      const { notifications } = await AdminService.getAdminNotifications({ page: 1, limit: 20 });
      setAdminNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de charger les notifications administrateur';
      setNotificationsError(message);
      setAdminNotifications([]);
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

    try {
      const [overviewResult, metricsResult, activityResult, alertsResult, servicesResult] = await Promise.allSettled([
        AdminService.getOverview(),
        AdminService.getSystemMetrics({ rangeMinutes: 60, historyLimit: 12 }),
        AdminService.getRecentActivity({ limit: 20 }),
        AdminService.getAlerts(),
        AdminService.getServiceStatus(),
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
          return Number(
            last?.value ??
            (last as { total_amount?: number })?.total_amount ??
            0
          );
        };

        const totalRevenueAmount = revenueTotals.reduce((sum, item) => {
          const base = item?.amount ?? item?.total_amount ?? 0;
          return sum + Number(base || 0);
        }, 0);

        const systemHealth = (() => {
          if (usersTotals.total && usersTotals.total > 0) {
            const active = usersTotals.active ?? 0;
            return Math.min(100, Math.max(0, Math.round((active / usersTotals.total) * 100)));
          }
          return 100;
        })();

        setStats({
          totalUsers: usersTotals.total ?? 0,
          totalCourses: coursesTotals.total ?? 0,
          totalRevenue: totalRevenueAmount,
          activeUsers: usersTotals.active ?? 0,
          systemHealth,
          averageRating: 0,
          monthlyUserGrowth: getLatestValue(monthlyUsers),
          monthlyCourseGrowth: getLatestValue(monthlyCourses),
          monthlyRevenueGrowth: getLatestValue(monthlyRevenue),
          pendingModerations: coursesTotals.pending ?? 0
        });

        const coursesMap = new Map<string, number>();
        monthlyCourses.forEach((item) => {
          if (item?.month) {
            coursesMap.set(item.month, Number(item.value ?? 0));
          }
        });
        const revenueMap = new Map<string, number>();
        monthlyRevenue.forEach((item) => {
          if (item?.month) {
            const val = item.total_amount ?? item.value ?? 0;
            revenueMap.set(item.month, Number(val ?? 0));
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
            users: Number(
              monthlyUsers.find((item) => (item.month ?? '') === month)?.value ?? 0
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
        setServiceStatus(servicesData.services ?? []);
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
                    +{stats.monthlyUserGrowth.toLocaleString()} ce mois
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
                    +{stats.monthlyCourseGrowth.toLocaleString()} ce mois
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
                    +{stats.monthlyRevenueGrowth.toLocaleString()} FCFA ce mois
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Alertes & Notifications
              </h3>
              {alertsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {alertsError}
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  Aucune alerte récente.
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border ${
                        alert.severity === 'danger'
                          ? 'border-red-200 bg-red-50'
                          : alert.severity === 'warning'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-0.5 rounded-full p-2 ${
                            alert.severity === 'danger'
                              ? 'bg-red-100 text-red-600'
                              : alert.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(alert.created_at)}
                            </span>
                          </div>
                          {alert.description && (
                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          )}
                          {alert.metadata && (
                            <pre className="mt-2 rounded bg-white/70 p-2 text-xs text-gray-600">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    id="event-title"
                    value={eventForm.title}
                    onChange={(e) => updateEventForm('title', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="event-description"
                    value={eventForm.description}
                    onChange={(e) => updateEventForm('description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="event-type"
                    value={eventForm.type}
                    onChange={(e) => updateEventForm('type', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                  >
                    <option value="general">Général</option>
                    <option value="course_related">Relatif au cours</option>
                    <option value="system">Système</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="event-start-at" className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    id="event-start-at"
                    value={eventForm.start_at}
                    onChange={(e) => updateEventForm('start_at', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-end-at" className="block text-sm font-medium text-gray-700">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    id="event-end-at"
                    value={eventForm.end_at}
                    onChange={(e) => updateEventForm('end_at', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">
                    Lieu (optionnel)
                  </label>
                  <input
                    type="text"
                    id="event-location"
                    value={eventForm.location}
                    onChange={(e) => updateEventForm('location', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="event-course-id" className="block text-sm font-medium text-gray-700">
                    ID du cours (optionnel)
                  </label>
                  <input
                    type="text"
                    id="event-course-id"
                    value={eventForm.course_id}
                    onChange={(e) => updateEventForm('course_id', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
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
                  <label htmlFor="event-is-public" className="ml-2 text-sm text-gray-700">
                    Public
                  </label>
                </div>
                <div>
                  <label htmlFor="event-metadata" className="block text-sm font-medium text-gray-700">
                    Métadonnées (optionnel)
                  </label>
                  <textarea
                    id="event-metadata"
                    value={eventForm.metadata}
                    onChange={(e) => updateEventForm('metadata', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  {eventEditingId ? (
                    <button
                      type="submit"
                      disabled={eventProcessing}
                      className="px-4 py-2 text-sm font-medium text-white bg-mdsc-blue-primary rounded-md hover:bg-mdsc-blue-dark focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:ring-offset-2"
                    >
                      {eventProcessing ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={eventProcessing}
                      className="px-4 py-2 text-sm font-medium text-white bg-mdsc-blue-primary rounded-md hover:bg-mdsc-blue-dark focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:ring-offset-2"
                    >
                      {eventProcessing ? 'Création...' : 'Créer'}
                    </button>
                  )}
                  {eventEditingId && (
                    <button
                      type="button"
                      onClick={() => handleEventDelete(eventEditingId)}
                      disabled={eventProcessing}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
                          {event.metadata && (
                            <pre className="mt-2 rounded bg-white/70 p-2 text-xs text-gray-600">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          )}
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

          {/* Gestion notifications & événements */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                  Notifications administrateur
                </h3>
                <button
                  type="button"
                  onClick={() => loadAdminNotifications()}
                  className="inline-flex items-center text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  disabled={notificationsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${notificationsLoading ? 'animate-spin' : ''}`} />
                  Rafraîchir
                </button>
              </div>

              <form onSubmit={handleNotificationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => updateNotificationForm('title', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                      placeholder="Ex. Maintenance programmée"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) => updateNotificationForm('type', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    >
                      <option value="system">Système</option>
                      <option value="reminder">Rappel</option>
                      <option value="alert">Alerte</option>
                      <option value="info">Information</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => updateNotificationForm('message', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    placeholder="Décrivez le contenu de la notification"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Déclenchement (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={notificationForm.trigger_at}
                      onChange={(e) => updateNotificationForm('trigger_at', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Métadonnées (JSON) - optionnel</label>
                    <textarea
                      value={notificationForm.metadata}
                      onChange={(e) => updateNotificationForm('metadata', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
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
                    className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition disabled:opacity-70"
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

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Notifications récentes</h4>
                {notificationsLoading ? (
                  <div className="py-6 text-center text-gray-500 text-sm">Chargement...</div>
                ) : notificationsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {notificationsError}
                  </div>
                ) : adminNotifications.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600 text-center">
                    Aucune notification enregistrée.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {adminNotifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={`rounded-xl border px-4 py-3 transition ${
                          notification.is_read
                            ? 'border-gray-200 bg-white'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{notification.title}</span>
                              {notification.type && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                                  {notification.type}
                                </span>
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                {notification.message}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span>Créée : {formatDateTime(notification.created_at)}</span>
                              {notification.trigger_at && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-3 w-3" /> {formatDateTime(notification.trigger_at)}
                                </span>
                              )}
                            </div>
                            {notification.metadata && (
                              <pre className="mt-2 text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-32">
                                {JSON.stringify(notification.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => handleNotificationToggleRead(notification)}
                              className="inline-flex items-center text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark"
                            >
                              {notification.is_read ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" /> Marquer non lu
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Marquer lu
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNotificationEdit(notification)}
                              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                            >
                              <Edit3 className="h-4 w-4 mr-1" /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNotificationDelete(notification.id)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => updateEventForm('title', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                      placeholder="Ex. Webinaire en direct"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={eventForm.type}
                      onChange={(e) => updateEventForm('type', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                      placeholder="general, deadline, live..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => updateEventForm('description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    placeholder="Détails sur l'événement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                    <input
                      type="datetime-local"
                      value={eventForm.start_at}
                      onChange={(e) => updateEventForm('start_at', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={eventForm.end_at}
                      onChange={(e) => updateEventForm('end_at', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Lien</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => updateEventForm('location', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                      placeholder="Zoom, Salle 301…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cours lié (ID)</label>
                    <input
                      type="text"
                      value={eventForm.course_id}
                      onChange={(e) => updateEventForm('course_id', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
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
                    <label htmlFor="event-public" className="text-sm text-gray-700">Événement public</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Métadonnées (JSON) - optionnel</label>
                  <textarea
                    value={eventForm.metadata}
                    onChange={(e) => updateEventForm('metadata', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-mdsc-blue-primary focus:ring-mdsc-blue-primary"
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
                    className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition disabled:opacity-70"
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
                            {eventItem.metadata && (
                              <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-auto max-h-32">
                                {JSON.stringify(eventItem.metadata, null, 2)}
                              </pre>
                            )}
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
                  title: 'Statistiques',
                  description: 'Statistiques détaillées',
                  color: 'bg-purple-500',
                  href: '/dashboard/admin/statistics'
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
                  {serviceStatus.map((service) => (
                    <div key={service.id} className="flex items-start justify-between px-4 py-3">
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