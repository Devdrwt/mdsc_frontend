'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token, initialize } = useAuthStore();

  useEffect(() => {
    // Initialiser le store au montage
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    // Vérifier d'abord si on a un token
    if (!token) {
      router.push('/login');
      return;
    }

    // Si on a un token mais pas de user ou d'isAuthenticated, attendre un peu
    if (token && !user) {
      // Ne pas rediriger immédiatement, attendre que le store se mette à jour
      return;
    }

    // Rediriger vers le dashboard approprié selon le rôle
    if (user) {
      const dashboardPath = `/dashboard/${user.role}`;
      router.push(dashboardPath);
    }
  }, [user, token, isLoading, router]);

  // Affichage de chargement pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection vers votre tableau de bord...</p>
      </div>
    </div>
  );
}