'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, BookOpen, Award, Star, Download } from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/authStore';
import {
  InstructorCourseEntry,
  InstructorEnrollmentsTrendPoint,
  InstructorService,
  InstructorTopCourse,
} from '../../../lib/services/instructorService';

interface KeyMetrics {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  averageRating: number;
}

interface MonthlyStat {
  label: string;
  enrollments: number;
  completions: number;
}

interface WeeklyEngagementPoint {
  label: string;
  value: number;
}

const formatMonthLabel = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
  }
  return value;
};

const formatDayLabel = (value?: string, fallbackIndex = 0) => {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  if (!value) {
    return days[fallbackIndex % days.length];
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  }

  return value;
};

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AnalyticsPanel() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<KeyMetrics | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [weeklyEngagement, setWeeklyEngagement] = useState<WeeklyEngagementPoint[]>([]);
  const [topCourses, setTopCourses] = useState<InstructorTopCourse[]>([]);
  const [courseDetails, setCourseDetails] = useState<InstructorCourseEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const [dashboard, analytics, courses] = await Promise.all([
          InstructorService.getDashboard(),
          InstructorService.getAnalytics('365d'),
          InstructorService.getCourses({ limit: 100 }),
        ]);

        if (!isMounted) return;

        const stats = dashboard?.stats ?? {};
        const studentStats = stats.students ?? {};

        setMetrics({
          totalStudents: safeNumber(studentStats.total),
          totalCourses: safeNumber(stats.courses?.total),
          completionRate: safeNumber(studentStats.avg_completion_rate ?? studentStats.completion_rate),
          averageRating: safeNumber(stats.average_rating ?? stats.rating?.average),
        });

        const trend = Array.isArray(analytics?.enrollment_trend)
          ? (analytics.enrollment_trend as InstructorEnrollmentsTrendPoint[])
          : [];

        const sortedTrend = [...trend].sort((a, b) => {
          const da = new Date(a.date ?? '').getTime();
          const db = new Date(b.date ?? '').getTime();
          if (Number.isNaN(da) || Number.isNaN(db)) return 0;
          return da - db;
        });

        const lastSixMonths = sortedTrend.slice(-6).map((point) => ({
          label: formatMonthLabel(point.date),
          enrollments: safeNumber(
            (point as any).enrollments ?? (point as any).new_enrollments ?? (point as any).value
          ),
          completions: safeNumber((point as any).completions ?? (point as any).completed),
        }));
        setMonthlyStats(lastSixMonths);

        const lastSevenDaysSource = sortedTrend.slice(-7);
        const lastSevenDays =
          lastSevenDaysSource.length > 0
            ? lastSevenDaysSource
            : Array.from({ length: 7 }).map((_, index) => ({
                date: '',
                enrollments: 0,
                index,
              }));

        setWeeklyEngagement(
          lastSevenDays.map((point, index) => ({
            label: formatDayLabel(point.date, index),
            value: safeNumber(
              (point as any).enrollments ?? (point as any).new_enrollments ?? (point as any).value
            ),
          }))
        );

        const coursesFromAnalytics = Array.isArray(analytics?.top_courses)
          ? analytics.top_courses
          : Array.isArray(dashboard?.top_courses)
          ? dashboard.top_courses
          : [];

        setTopCourses(coursesFromAnalytics.slice(0, 5));
        setCourseDetails(courses?.courses ?? []);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics instructeur :', error);
        setMetrics(null);
        setMonthlyStats([]);
        setWeeklyEngagement([]);
        setTopCourses([]);
        setCourseDetails([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const monthlyMax = useMemo(
    () => Math.max(...monthlyStats.map((stat) => stat.enrollments || stat.completions || 0), 0),
    [monthlyStats]
  );

  const weeklyMax = useMemo(
    () => Math.max(...weeklyEngagement.map((day) => day.value), 0),
    [weeklyEngagement]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune donnée d'analytics disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-mdsc-gold rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>

<h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
  <BarChart3 className="w-6 h-6" />
  Analytics & Rapports
</h1>

            <p className="text-yellow-100">
              Analysez les performances de vos cours et le comportement de vos étudiants.
            </p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Étudiants</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cours Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Complétion</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.completionRate ? `${metrics.completionRate.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageRating ? `${metrics.averageRating.toFixed(1)}/5` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution Mensuelle</h3>

          {!monthlyStats.length ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-500">
              Aucune donnée disponible pour l&apos;histogramme.
            </div>
          ) : (
            <div className="h-64 flex items-end space-x-3">
              {monthlyStats.map((stat, index) => {
                const barHeight = monthlyMax ? (stat.enrollments / monthlyMax) * 200 : 0;
                return (
                  <div key={`${stat.label}-${index}`} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-mdsc-gold/80 rounded-t"
                      style={{ height: `${barHeight}px` }}
                    />
                    <div className="text-xs text-gray-500 mt-2 uppercase">{stat.label}</div>
                    <div className="text-xs font-medium text-gray-900">{stat.enrollments}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des Cours</h3>

          {!topCourses.length ? (
            <div className="text-sm text-gray-500">Aucun cours à afficher pour le moment.</div>
          ) : (
            <div className="space-y-4">
              {topCourses.map((course, index) => {
                const completion = safeNumber(course.completion_rate);
                return (
                  <div
                    key={String(course.course_id ?? course.title ?? `course-${index}`)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{course.title}</p>
                      <div className="flex items-center flex-wrap gap-4 mt-1 text-xs text-gray-500">
                        <span>{safeNumber(course.enrollments)} inscriptions</span>
                        <span>{completion.toFixed(0)}% complétion</span>
                        <span>{safeNumber(course.rating).toFixed(1)}/5 ⭐</span>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 ml-4">
                      <div
                        className="bg-mdsc-gold h-2 rounded-full"
                        style={{ width: `${Math.min(completion, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Hebdomadaire</h3>

        {!weeklyEngagement.length ? (
          <div className="text-sm text-gray-500">Aucune donnée d’engagement disponible.</div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {weeklyEngagement.map((day, index) => {
              const intensity = weeklyMax ? Math.max(0.1, day.value / weeklyMax) : 0;
              return (
                <div key={`${day.label}-${index}`} className="text-center">
                  <div className="text-sm font-medium text-gray-900 mb-2">{day.label}</div>
                  <div
                    className="h-20 rounded-lg transition-colors"
                    style={{
                      backgroundColor: `rgba(245, 158, 11, ${intensity || 0.1})`,
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-2">{day.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails des Cours</h3>

        {!courseDetails.length ? (
          <div className="text-sm text-gray-500">Aucun cours trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscriptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complétion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseDetails.map((course) => {
                  const completion = safeNumber(course.average_progress);
                  return (
                    <tr key={String(course.id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.title ?? '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {safeNumber(course.enrollments)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-mdsc-gold h-2 rounded-full"
                              style={{ width: `${Math.min(completion, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">{completion.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {safeNumber(course.average_rating).toFixed(1)}/5
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
