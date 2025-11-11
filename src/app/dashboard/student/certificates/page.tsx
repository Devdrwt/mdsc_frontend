'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateRequest from '../../../../components/dashboard/student/CertificateRequest';

export default function StudentCertificatesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <CertificateRequest />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
