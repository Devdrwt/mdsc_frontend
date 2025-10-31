'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CalendarPanel from '../../../../components/dashboard/student/CalendarPanel';

export default function StudentCalendarPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Calendrier 📅</h1>
                <p className="text-white/90">Consultez votre calendrier de cours et événements</p>
              </div>
            </div>
          </div>

          {/* Calendar Panel */}
          <CalendarPanel />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
