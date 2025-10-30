'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import GamificationInstructor from '../../../../components/dashboard/instructor/GamificationInstructor';

export default function InstructorGamificationPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <GamificationInstructor />
      </DashboardLayout>
    </AuthGuard>
  );
}
