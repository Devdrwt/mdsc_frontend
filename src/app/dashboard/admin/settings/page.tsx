'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import SystemSettings from '../../../../components/dashboard/admin/SystemSettings';

export default function AdminSettingsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <SystemSettings />
      </DashboardLayout>
    </AuthGuard>
  );
}
