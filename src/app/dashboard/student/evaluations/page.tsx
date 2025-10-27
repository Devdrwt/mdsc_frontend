'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import EvaluationPanel from '../../../../components/dashboard/student/EvaluationPanel';

export default function StudentEvaluationsPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <EvaluationPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}
