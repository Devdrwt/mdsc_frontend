'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import ModuleManagement from '../../../../components/dashboard/instructor/ModuleManagement';

export default function InstructorModulesPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <ModuleManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
