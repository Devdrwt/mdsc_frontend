'use client';

import React, { Suspense } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateRequest from '../../../../components/dashboard/student/CertificateRequest';
import { Loader } from 'lucide-react';

function CertificatesContent() {
  return (
    <div className="space-y-6">
      <CertificateRequest />
    </div>
  );
}

export default function StudentCertificatesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Loader className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        }>
          <CertificatesContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}
