'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { CertificateCollection } from '../../../../components/certificates';

export default function StudentCertificatesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <CertificateCollection />
      </DashboardLayout>
    </AuthGuard>
  );
}
