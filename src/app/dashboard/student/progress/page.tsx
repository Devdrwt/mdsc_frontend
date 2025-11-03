'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import ProgressPanel from '../../../../components/dashboard/student/ProgressPanel';

export default function StudentProgressPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary dark:from-mdsc-blue-dark dark:via-mdsc-blue-primary dark:to-mdsc-blue-dark text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Ma Progression 📈</h1>
                <p className="text-white/90">Suivez votre progression dans tous vos cours</p>
              </div>
            </div>
          </div>

          {/* Progress Panel */}
          <ProgressPanel />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
