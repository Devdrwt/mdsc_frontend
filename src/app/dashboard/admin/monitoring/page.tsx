'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import SystemMonitoring from '../../../../components/dashboard/admin/SystemMonitoring';

export default function AdminMonitoringPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <SystemMonitoring />
      </DashboardLayout>
    </AuthGuard>
  );
}
