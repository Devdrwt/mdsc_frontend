'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import StudentManagement from '../../../../components/dashboard/instructor/StudentManagement';

export default function InstructorStudentsPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <StudentManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
