'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';

export default function StudentCertificatesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mes Certificats</h1>
                <p className="text-white/90">Consultez et téléchargez vos certificats</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Page de certificats en développement</h3>
            <p className="text-gray-600">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
