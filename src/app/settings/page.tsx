'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Rediriger vers le dashboard selon le rôle
      switch (user.role) {
        case 'admin':
          router.push('/dashboard/admin/settings');
          break;
        case 'instructor':
          router.push('/dashboard/instructor/settings');
          break;
        case 'student':
          router.push('/dashboard/student/settings');
          break;
        default:
          router.push('/dashboard');
      }
    } else {
      // Si non connecté, rediriger vers login
      router.push('/login');
    }
  }, [user, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
    </div>
  );
}

