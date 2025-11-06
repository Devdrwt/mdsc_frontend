'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateApprovalPanel from '../../../../components/dashboard/admin/CertificateApprovalPanel';

export default function AdminCertificatesPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <CertificateApprovalPanel />
      </DashboardLayout>
    </AuthGuard>
  );
}

