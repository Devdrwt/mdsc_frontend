'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../lib/middleware/auth';
import { useNotification } from '../../../lib/hooks/useNotification';
import { useAuthStore } from '../../../lib/stores/authStore';
import { courseService } from '../../../lib/services/courseService';
import InstructorCourseTable from '../../../components/instructor/InstructorCourseTable';

type StatusFilter = 'all' | 'published' | 'draft';

export default function InstructorCoursesPage() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const { error: notifyError } = useNotification() as any;

  const instructorId = useMemo(() => (user?.id ? String(user.id) : ''), [user]);

  useEffect(() => {
    if (!instructorId) return;
    const load = async () => {
      try {
        setLoading(true);
        const list = await courseService.getInstructorCourses(instructorId, { status, page, limit });
        // Filtrage simple côté client en attendant les params backend
        const filtered = list.filter((c: any) =>
          status === 'all' ? true : status === 'published' ? c.is_published || c.isPublished : !(c.is_published || c.isPublished)
        );
        setCourses(filtered);
      } catch (e: any) {
        const msg = e.message || 'Erreur de chargement des cours';
        setError(msg);
        try { notifyError?.('Erreur', msg); } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [instructorId, status, page, limit]);

  const content = (
    <DashboardLayout userRole="instructor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tous</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
        </div>

        <InstructorCourseTable
          courses={courses}
          loading={loading}
          error={error}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </DashboardLayout>
  );

  return (
    <AuthGuard requiredRole="instructor">
      {content}
    </AuthGuard>
  );
}


