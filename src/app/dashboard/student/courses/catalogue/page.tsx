'use client';

import React from 'react';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../../lib/middleware/auth';
import ModuleCatalog from '../../../../../components/dashboard/student/ModuleCatalog';

export default function StudentCatalogPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <ModuleCatalog />
      </DashboardLayout>
    </AuthGuard>
  );
}

