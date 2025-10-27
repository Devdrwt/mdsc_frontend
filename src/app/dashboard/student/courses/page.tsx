'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import MyCourses from '../../../../components/dashboard/student/MyCourses';

export default function CoursesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <MyCourses />
      </DashboardLayout>
    </AuthGuard>
  );
}
