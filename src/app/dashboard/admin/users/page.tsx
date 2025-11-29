'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import UserManagement from '../../../../components/dashboard/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin" pageTitle="Utilisateurs">
        <UserManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
