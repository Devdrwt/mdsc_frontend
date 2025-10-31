'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import GamificationPanel from '../../../../components/dashboard/student/GamificationPanel';

export default function AdminGamificationPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <GamificationPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}

