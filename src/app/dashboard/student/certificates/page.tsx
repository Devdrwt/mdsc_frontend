'use client';

import React, { useMemo } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateCollection from '../../../../components/certificates/CertificateCollection';
import { useAuthStore } from '../../../../lib/stores/authStore';

export default function StudentCertificatesPage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Liste des certificats de l'utilisateur */}
          <CertificateCollection />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
