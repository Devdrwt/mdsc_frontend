'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CourseModeration from '../../../../components/dashboard/admin/CourseModeration';

export default function AdminCoursesPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <CourseModeration />
      </DashboardLayout>
    </AuthGuard>
  );
}
