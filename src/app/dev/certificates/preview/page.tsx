'use client';

import React, { useMemo } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificatePreview from '../../../../components/certificates/CertificatePreview';
import { useAuthStore } from '../../../../lib/stores/authStore';

export default function DevCertificatePreviewPage() {
  const { user } = useAuthStore();

  const fullName = useMemo(() => {
    if (!user) return 'Étudiant(e)';
    const u: any = user;
    const candidates = [
      { first: u.first_name, last: u.last_name },
      { first: u.firstName, last: u.lastName },
      { full: u.fullName },
      { full: u.name },
      { full: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() },
      { full: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() },
      { first: u.profile?.first_name, last: u.profile?.last_name },
      { first: u.profile?.firstName, last: u.profile?.lastName },
      { full: u.profile?.fullName },
      { full: u.profile?.name },
      { first: u.user?.first_name, last: u.user?.last_name },
      { first: u.user?.firstName, last: u.user?.lastName },
      { full: u.user?.fullName },
      { full: u.user?.name },
    ];
    for (const c of candidates) {
      if (c && typeof c.first === 'string' && typeof c.last === 'string' && c.first && c.last) {
        return `${c.first} ${c.last}`;
      }
      if (c && typeof c.full === 'string' && c.full && !c.full.includes('@')) {
        return c.full;
      }
    }
    return u.username || 'Étudiant(e)';
  }, [user]);

  // Optionnel: restreindre à l'environnement de dev
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Aperçu du certificat (exemple)
            </h2>
            <CertificatePreview
              fullName={fullName}
              courseTitle="Développement Web Full-Stack"
              location="Cotonou, Bénin"
              issuedAt={new Date()}
              code="Mdsc-23974999-Bj"
            />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


