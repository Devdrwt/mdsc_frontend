'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import NotificationService, {
  NotificationEntry,
  NotificationListResponse,
} from '../../../../lib/services/notificationService';
import {
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Calendar as CalendarIcon,
  RefreshCw,
  Filter,
  Award,
} from 'lucide-react';

const filtersConfig = [
  { label: 'Toutes', value: undefined },
  { label: 'Non lues', value: false },
  { label: 'Lues', value: true },
];

const isCourseModerationNotification = (notification: NotificationEntry) => {
  const type = notification.type?.toLowerCase() ?? '';
  if (type.includes('course_approval') || type.includes('course_rejection') || type.includes('course_moderation')) {
    return true;
  }
  const metadata = notification.metadata ?? {};
  return Boolean(metadata.rejection_reason || metadata.moderation_status || metadata.moderation_comment);
};

const isCertificateNotification = (notification: NotificationEntry) => {
  const type = notification.type?.toLowerCase() ?? '';
  if (type.includes('certificate')) {
    return true;
  }
  const metadata = notification.metadata ?? {};
  return Boolean(
    metadata?.certificate_id ||
      metadata?.certificate_url ||
      metadata?.certificate_title ||
      metadata?.certificate_code
  );
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function StudentNotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [pagination, setPagination] = useState<NotificationListResponse['pagination']>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(undefined);
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications({
        page,
        limit: 20,
        is_read: isReadFilter,
        upcoming: upcomingOnly,
      });
      const rawNotifications = data.notifications ?? [];
      const filteredNotifications = rawNotifications.filter(
        (notif) => !isCourseModerationNotification(notif)
      );
      setNotifications(filteredNotifications);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Erreur notifications:', err);
      setError(err?.message ?? 'Impossible de récupérer les notifications');
      setNotifications([]);
      setPagination(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user, isReadFilter, upcomingOnly]);

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      loadNotifications();
    } catch (err: any) {
      alert(err?.message ?? 'Impossible de marquer les notifications comme lues');
    }
  };

  const handleMarkRead = async (id: number | string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif)));
    } catch (err: any) {
      alert(err?.message ?? 'Impossible de marquer la notification comme lue');
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Supprimer cette notification ?')) return;
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (err: any) {
      alert(err?.message ?? 'Impossible de supprimer la notification');
    }
  };

  const handleNotificationRedirect = (notif: NotificationEntry) => {
    if (notif.metadata?.action_url) {
      window.location.href = notif.metadata.action_url;
    }
  };

  const handleCertificateAccess = (notif: NotificationEntry) => {
    const certificateUrl =
      notif.metadata?.certificate_url ||
      notif.metadata?.download_url ||
      notif.metadata?.action_url;

    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
    } else {
      window.location.href = '/dashboard/student/certificates';
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600">Suivez les annonces, rappels et activités importantes.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadNotifications(pagination?.page ?? 1)}
                  className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Rafraîchir
                </button>
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center px-3 py-2 text-sm bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <div className="flex space-x-2">
                  {filtersConfig.map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => setIsReadFilter(filter.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        isReadFilter === filter.value
                          ? 'bg-mdsc-blue-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="inline-flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={upcomingOnly}
                  onChange={(e) => setUpcomingOnly(e.target.checked)}
                  className="rounded border-gray-300 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                />
                <span>Événements à venir uniquement</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-mdsc-blue-primary mx-auto mb-2" />
                Chargement...
              </div>
            ) : error ? (
              <div className="py-8 px-4 text-red-700 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Erreur</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                Aucune notification pour le moment
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notif) => {
                  const certificateNotification = isCertificateNotification(notif);
                  return (
                    <li 
                      key={notif.id} 
                      className={`px-6 py-4 flex items-start justify-between ${notif.is_read ? 'bg-white' : 'bg-blue-50'} ${notif.metadata?.action_url ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleNotificationRedirect(notif)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-blue-500/10 text-blue-600'}`}>
                          {certificateNotification ? <Award className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {notif.title || `Notification ${notif.type}`}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                            {notif.message}
                          </p>
                          {certificateNotification && (
                            <div className="mt-2 space-y-1">
                              {notif.metadata?.certificate_title && (
                                <p className="text-xs text-gray-600">
                                  Certificat : {notif.metadata.certificate_title}
                                </p>
                              )}
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCertificateAccess(notif);
                                }}
                                className="inline-flex items-center text-xs font-semibold text-white bg-purple-600 px-3 py-1.5 rounded-md hover:bg-purple-700 transition-colors"
                              >
                                Voir mon certificat
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                            <span>{formatDateTime(notif.created_at)}</span>
                            {notif.trigger_at && (
                              <span className="flex items-center space-x-1 text-purple-500">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatDateTime(notif.trigger_at)}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {!notif.is_read && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMarkRead(notif.id);
                            }}
                            className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark"
                          >
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
