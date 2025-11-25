'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import GamificationAdmin from '../../../../components/dashboard/admin/GamificationAdmin';

export default function AdminGamificationPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin" pageTitle="Gestion de la Gamification">
        <GamificationAdmin />
      </DashboardLayout>
    </AuthGuard>
  );
}

