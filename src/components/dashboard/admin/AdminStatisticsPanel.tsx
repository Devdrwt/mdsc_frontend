'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUp,
  Award,
  BookOpen,
  CreditCard,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  adminService,
  AdminOverviewResponse,
  AdminTopCourseEntry,
  AdminTopInstructorEntry,
  AdminPaymentEntry,
} from '../../../lib/services/adminService';

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (amount?: number, currency: string = 'XOF') => {
  const safeAmount = safeNumber(amount);
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

const formatMonth = (month?: string) => {
  if (!month) return '—';
  const date = new Date(month);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const getTotalRevenue = (overview?: AdminOverviewResponse) => {
  const totals = overview?.totals?.revenue?.totals ?? [];
  if (!totals.length) {
    return { amount: 0, currency: 'XOF' };
  }
  return totals.reduce(
    (acc, item) => {
      const amount = safeNumber(item?.total_amount ?? item?.amount);
      const currency =
        (item as any)?.currency ??
        (item as any)?.currency_code ??
        acc.currency;
      return {
        amount: acc.amount + amount,
        currency,
      };
    },
    { amount: 0, currency: totals[0]?.currency ?? 'XOF' }
  );
};

const normalizeGrowth = (entries?: Array<{ month?: string; value?: number }>, limit = 6) => {
  if (!entries || !entries.length) return [];
  return entries
    .slice(-limit)
    .map((entry) => ({
      label: formatMonth(entry.month),
      value: safeNumber(entry.value),
    }));
};

export default function AdminStatisticsPanel() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [topCourses, setTopCourses] = useState<AdminTopCourseEntry[]>([]);
  const [topInstructors, setTopInstructors] = useState<AdminTopInstructorEntry[]>([]);
  const [recentPayments, setRecentPayments] = useState<AdminPaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [overviewData, courses, instructors, payments] = await Promise.all([
          adminService.getOverview(),
          adminService.getTopCourses({ limit: 5 }),
          adminService.getTopInstructors({ limit: 5 }),
          adminService.getRecentPayments({ limit: 6 }),
        ]);
        if (!isMounted) return;

        setOverview(overviewData ?? null);
        setTopCourses(courses ?? []);
        setTopInstructors(instructors ?? []);
        setRecentPayments(payments ?? []);
        setError(null);
      } catch (err: any) {
        console.error('[AdminStatisticsPanel] Erreur chargement statistiques:', err);
        if (isMounted) {
          setError(
            err?.message ??
              "Impossible de récupérer les statistiques. Merci de réessayer plus tard."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const userTotals = overview?.totals?.users;
  const courseTotals = overview?.totals?.courses;
  const enrollmentTotals = overview?.totals?.enrollments;
  const revenueTotals = getTotalRevenue(overview ?? undefined);

  const monthlyUserGrowth = normalizeGrowth(overview?.monthly_growth?.users);
  const monthlyCourseGrowth = normalizeGrowth(overview?.monthly_growth?.courses);
  const monthlyRevenueGrowth = normalizeGrowth(
    overview?.monthly_growth?.revenue?.map((entry) => ({
      month: entry.month,
      value: entry.total_amount ?? entry.value,
    }))
  );

  const maxUserGrowth = useMemo(
    () => Math.max(...monthlyUserGrowth.map((entry) => entry.value), 0),
    [monthlyUserGrowth]
  );
  const maxCourseGrowth = useMemo(
    () => Math.max(...monthlyCourseGrowth.map((entry) => entry.value), 0),
    [monthlyCourseGrowth]
  );
  const maxRevenueGrowth = useMemo(
    () => Math.max(...monthlyRevenueGrowth.map((entry) => entry.value), 0),
    [monthlyRevenueGrowth]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-mdsc-gold rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Statistiques globales 📈</h1>
            <p className="text-white/80 mt-1">
              Suivez la santé de la plateforme et les performances clés en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Activity className="h-5 w-5" />
            <span>Dernière synchronisation en direct</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Utilisateurs totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeNumber(userTotals?.total).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {safeNumber(userTotals?.students).toLocaleString()} étudiants •{' '}
                {safeNumber(userTotals?.instructors).toLocaleString()} instructeurs
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cours publiés</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeNumber(courseTotals?.published ?? courseTotals?.total).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {safeNumber(courseTotals?.pending).toLocaleString()} en attente
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeNumber(enrollmentTotals?.total).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {safeNumber(enrollmentTotals?.completed).toLocaleString()} complétées
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenus cumulés</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(revenueTotals.amount, revenueTotals.currency)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Croissance mensuelle</h3>
          {monthlyUserGrowth.length === 0 &&
          monthlyCourseGrowth.length === 0 &&
          monthlyRevenueGrowth.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              Aucune donnée de croissance disponible.
            </div>
          ) : (
            <div className="space-y-6">
              {[
                {
                  title: 'Utilisateurs',
                  data: monthlyUserGrowth,
                  max: maxUserGrowth,
                  color: 'bg-blue-500',
                },
                {
                  title: 'Cours',
                  data: monthlyCourseGrowth,
                  max: maxCourseGrowth,
                  color: 'bg-green-500',
                },
                {
                  title: 'Revenus',
                  data: monthlyRevenueGrowth,
                  max: maxRevenueGrowth,
                  color: 'bg-amber-500',
                },
              ].map(({ title, data, max, color }) => (
                <div key={title}>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{title}</span>
                    <span>
                      {data.length
                        ? `${data[data.length - 1].value.toLocaleString()}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2 h-24 items-end">
                    {data.length === 0 ? (
                      <div className="text-xs text-gray-400">Aucune donnée</div>
                    ) : (
                      data.map((entry) => {
                        const height = max ? (entry.value / max) * 96 : 0;
                        return (
                          <div
                            key={`${title}-${entry.label}`}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div
                              className={`${color} rounded-t-md w-full transition-all`}
                              style={{ height: `${height}px` }}
                            ></div>
                            <span className="text-[10px] uppercase mt-1 text-gray-500">
                              {entry.label}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions récentes</h3>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun paiement récent enregistré.</p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={String(payment.id)} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.user?.name ?? payment.user?.email ?? 'Utilisateur inconnu'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(
                          payment.processed_at ??
                            (payment as any)?.created_at ??
                            (payment as any)?.timestamp
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency ?? 'XOF')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top cours</h3>
            <span className="text-xs text-gray-500">
              Basé sur les inscriptions, complétions et revenus
            </span>
          </div>
          {topCourses.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun cours à afficher.</p>
          ) : (
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div key={String(course.id)} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-gray-400 w-6">{index + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.title}</p>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>{course.enrollments.toLocaleString()} inscrits</span>
                        <span>{course.completion_rate.toFixed(0)}% compl.</span>
                        <span>{course.average_rating.toFixed(1)}/5 ⭐</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(course.revenue, course.currency ?? 'XOF')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top instructeurs</h3>
            <span className="text-xs text-gray-500">Classement par revenus et activité</span>
          </div>
          {topInstructors.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun instructeur à afficher.</p>
          ) : (
            <div className="space-y-4">
              {topInstructors.map((instructor, index) => (
                <div key={String(instructor.id)} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-gray-400 w-6">{index + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{instructor.name}</p>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>{instructor.courses_count} cours</span>
                        <span>{instructor.total_enrollments.toLocaleString()} inscrits</span>
                        <span>{instructor.average_rating.toFixed(1)}/5 ⭐</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(instructor.revenue, instructor.currency ?? 'XOF')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d’ensemble</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Utilisateurs actifs</p>
            <p className="text-2xl font-bold text-gray-900">
              {safeNumber(overview?.totals?.users?.active).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">sur les 30 derniers jours</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Cours en brouillon</p>
            <p className="text-2xl font-bold text-gray-900">
              {safeNumber(overview?.totals?.courses?.draft).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">en attente de publication</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Inscriptions actives</p>
            <p className="text-2xl font-bold text-gray-900">
              {safeNumber(overview?.totals?.enrollments?.active).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">apprenants en cours de formation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

