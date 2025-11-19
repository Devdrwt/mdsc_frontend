'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import AdminStatisticsPanel from '../../../../components/dashboard/admin/AdminStatisticsPanel';

export default function AdminStatisticsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <AdminStatisticsPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}

