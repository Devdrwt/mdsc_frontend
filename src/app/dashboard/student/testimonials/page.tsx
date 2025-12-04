'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import TestimonialForm from '../../../../components/dashboard/student/TestimonialForm';

export default function StudentTestimonialsPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student" pageTitle="Mon Témoignage">
        <TestimonialForm />
      </DashboardLayout>
    </AuthGuard>
  );
}

