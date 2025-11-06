'use client';

import React from 'react';
import AdminLoginForm from '../../../components/auth/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AdminLoginForm />
      </div>
    </div>
  );
}

