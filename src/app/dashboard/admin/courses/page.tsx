'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CourseModeration from '../../../../components/dashboard/admin/CourseModeration';
import CourseApprovalPanel from '../../../../components/dashboard/admin/CourseApprovalPanel';
import { BookOpen, CheckCircle } from 'lucide-react';

export default function AdminCoursesPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>En attente de validation</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Tous les cours</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === 'pending' ? <CourseApprovalPanel /> : <CourseModeration />}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
