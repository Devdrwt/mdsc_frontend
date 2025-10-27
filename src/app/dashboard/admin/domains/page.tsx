'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import DomainManagement from '../../../../components/dashboard/admin/DomainManagement';

export default function AdminDomainsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <DomainManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
