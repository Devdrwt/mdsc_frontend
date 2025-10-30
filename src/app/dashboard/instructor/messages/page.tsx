'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import Messages from '../../../../components/dashboard/shared/Messages';

export default function InstructorMessagesPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-mdsc-gold via-yellow-600 to-mdsc-gold text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Messages</h1>
                <p className="text-white/90">Communiquez avec vos étudiants</p>
              </div>
            </div>
          </div>

          {/* Messages Component */}
          <Messages />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
