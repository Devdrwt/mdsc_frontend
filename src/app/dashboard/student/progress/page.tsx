'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import ProgressPanel from '../../../../components/dashboard/student/ProgressPanel';
import {TrendingUp } from 'lucide-react'
export default function StudentProgressPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-4">
          {/* Header */}
         <div className="bg-mdsc-blue-primary  text-white rounded-lg p-6 shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <TrendingUp className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Ma Progression</h1>
      </div>
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
