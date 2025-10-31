'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import AnalyticsPanel from '../../../../components/dashboard/instructor/AnalyticsPanel';

export default function AdminAnalyticsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <AnalyticsPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}

