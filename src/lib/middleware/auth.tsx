'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'instructor' | 'admin';
  redirectTo?: string;
}

export function useAuthGuard(requiredRole?: 'student' | 'instructor' | 'admin') {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token, hasHydrated } = useAuthStore();

  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔒 [AUTH GUARD] Checking authentication...', {
        isLoading,
        isAuthenticated,
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role,
        requiredRole,
        hasHydrated
      });

      // Attendre que le store soit hydraté depuis le localStorage
      if (!hasHydrated || isLoading) {
        console.log('⏳ [AUTH GUARD] Waiting for hydration or loading...');
        return;
      }

      // Vérifier d'abord si on a un token avant de rediriger
      if (!token && !isAuthenticated) {
        console.log('❌ [AUTH GUARD] No token and not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Rediriger vers le dashboard approprié selon le rôle
        const dashboardPath = `/dashboard/${user?.role}`;
        console.log(`🔄 [AUTH GUARD] Wrong role (${user?.role} != ${requiredRole}), redirecting to ${dashboardPath}`);
        router.push(dashboardPath);
        return;
      }

      console.log('✅ [AUTH GUARD] Authentication OK');
    };

    checkAuthentication();
  }, [isAuthenticated, user, requiredRole, router, isLoading, token, hasHydrated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRequiredRole: !requiredRole || user?.role === requiredRole,
  };
}

export function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthGuard(requiredRole);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // La redirection est gérée par useAuthGuard
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null; // La redirection est gérée par useAuthGuard
  }

  return <>{children}</>;
}

// Hook pour vérifier les permissions
export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (role: 'student' | 'instructor' | 'admin') => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: ('student' | 'instructor' | 'admin')[]) => {
    return user?.role && roles.includes(user.role);
  };

  const canAccess = (resource: string, action: string) => {
    if (!user) return false;

    switch (user.role) {
      case 'admin':
        return true; // Admin a accès à tout
      
      case 'instructor':
        return ['courses', 'students', 'evaluations', 'analytics'].includes(resource);
      
      case 'student':
        return ['courses', 'progress', 'certificates', 'evaluations'].includes(resource);
      
      default:
        return false;
    }
  };

  return {
    hasRole,
    hasAnyRole,
    canAccess,
    user,
  };
}
