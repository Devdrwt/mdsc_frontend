'use client';

import React from 'react';

interface InstructorCourseTableProps {
  courses: any[];
  loading?: boolean;
  error?: string | null;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}

export default function InstructorCourseTable({
  courses,
  loading,
  error,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: InstructorCourseTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">Chargement...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-red-700">{error}</div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leçons</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{c.title}</td>
                <td className="px-4 py-3 text-sm">
                  {(c.is_published || c.isPublished) ? (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Publié</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">Brouillon</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.enrollment_count ?? c.enrollmentCount ?? 0}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) ?? 0}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.created_at || c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <a href={`/instructor/courses/${c.id}`} className="text-mdsc-blue-primary hover:text-mdsc-blue-dark text-sm font-medium">Modifier</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <span>Par page</span>
          <select value={limit} onChange={(e) => onLimitChange(parseInt(e.target.value))} className="border rounded px-2 py-1">
            {[10, 20, 50].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Précédent</button>
          <span className="text-sm">Page {page}</span>
          <button onClick={() => onPageChange(page + 1)} className="px-3 py-1 border rounded">Suivant</button>
        </div>
      </div>
    </div>
  );
}


