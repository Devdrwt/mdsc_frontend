'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import SequenceManagement from '../../../../components/dashboard/instructor/SequenceManagement';

export default function InstructorSequencesPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <SequenceManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
