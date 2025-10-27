'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import GamificationPanel from '../../../../components/dashboard/student/GamificationPanel';

export default function GamificationPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <GamificationPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}
