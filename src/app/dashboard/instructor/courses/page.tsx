'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CourseManagement from '../../../../components/dashboard/instructor/CourseManagement';

export default function InstructorCoursesPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <CourseManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
