'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import FinalEvaluationsManagement from '../../../../components/dashboard/admin/FinalEvaluationsManagement';

export default function AdminEvaluationsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <FinalEvaluationsManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}

