'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import EvaluationManagement from '../../../../components/dashboard/instructor/EvaluationManagement';

export default function InstructorEvaluationsPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <EvaluationManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
