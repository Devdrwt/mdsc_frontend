'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateManagementPanel from '../../../../components/dashboard/admin/CertificateManagementPanel';

export default function AdminCertificatesPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <CertificateManagementPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}
