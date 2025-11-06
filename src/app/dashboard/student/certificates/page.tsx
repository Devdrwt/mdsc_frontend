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
          {/* Header */}
          <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mes Certificats</h1>
                <p className="text-white/90">Gérez vos demandes de certificats et téléchargez vos certificats émis</p>
              </div>
            </div>
          </div>

          {/* Certificate Request Component */}
          <CertificateRequest />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
