'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import TestimonialsManagement from '../../../../components/dashboard/admin/TestimonialsManagement';

export default function AdminTestimonialsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin" pageTitle="Gestion des Témoignages">
        <TestimonialsManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}

