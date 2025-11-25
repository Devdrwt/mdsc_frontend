'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CalendarPanel from '../../../../components/dashboard/student/CalendarPanel';
import { Calendar } from 'lucide-react';

export default function StudentCalendarPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-mdsc-blue-primary dark:from-mdsc-blue-dark dark:via-mdsc-blue-primary dark:to-mdsc-blue-dark text-white rounded-lg p-6 shadow-lg">
  <div className="flex items-center space-x-2 mb-2">
    <Calendar className="h-8 w-8" />
    <h1 className="text-3xl font-bold">Calendrier</h1>
  </div>
  <p className="text-white/90">
    Consultez votre calendrier de cours et événements
  </p>
</div>

          {/* Calendar Panel */}
          <CalendarPanel />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
