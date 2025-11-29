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

export default function InstructorNotificationsPage() {
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
      // Pour l'instructeur, on affiche toutes les notifications (y compris les notifications de modération de cours)
      setNotifications(data.notifications ?? []);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      console.error('Erreur marquer comme lu:', err);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err?.message ?? 'Impossible de supprimer la notification');
    }
  };

  const handleCertificateAccess = async (notification: NotificationEntry) => {
    const metadata = notification.metadata ?? {};
    const certificateId = metadata?.certificate_id || metadata?.certificateId;
    if (certificateId) {
      window.open(`/certificates/${certificateId}/print`, '_blank');
    }
  };

  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
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
              {filtersConfig.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setIsReadFilter(filter.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                    isReadFilter === filter.value
                      ? 'bg-mdsc-blue-primary text-white border-mdsc-blue-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-mdsc-blue-primary" />
              <span className="ml-3 text-gray-600">Chargement des notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune notification</h3>
              <p className="text-gray-600">Vous n'avez aucune notification pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const isCertificate = isCertificateNotification(notification);
                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-sm border ${
                      notification.is_read
                        ? 'border-gray-200'
                        : 'border-mdsc-blue-primary border-l-4'
                    } p-6 transition hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {!notification.is_read && (
                            <span className="h-2 w-2 bg-mdsc-blue-primary rounded-full"></span>
                          )}
                          {notification.type && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 uppercase font-semibold border border-gray-300">
                              {notification.type}
                            </span>
                          )}
                        </div>
                        {notification.message && (
                          <p
                            className={`text-sm mt-2 leading-relaxed whitespace-pre-line ${
                              notification.is_read ? 'text-gray-600' : 'text-gray-700 font-medium'
                            }`}
                          >
                            {notification.message}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatDateTime(notification.created_at)}
                          </span>
                          {notification.trigger_at && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {formatDateTime(notification.trigger_at)}
                            </span>
                          )}
                        </div>
                        {isCertificate && notification.metadata && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleCertificateAccess(notification)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg hover:shadow-md transition"
                            >
                              <Award className="h-3.5 w-3.5 mr-1.5" />
                              Voir le certificat
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-mdsc-blue-primary transition"
                            title="Marquer comme lu"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => loadNotifications((pagination.page ?? 1) - 1)}
                disabled={(pagination.page ?? 1) <= 1 || loading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page ?? 1} sur {pagination.total_pages}
              </span>
              <button
                onClick={() => loadNotifications((pagination.page ?? 1) + 1)}
                disabled={(pagination.page ?? 1) >= (pagination.total_pages ?? 1) || loading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

