'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import CertificateCollection from '../../../../components/certificates/CertificateCollection';
import { Loader } from 'lucide-react';
import { certificateService } from '../../../../lib/services/certificateService';
import toast from '../../../../lib/utils/toast';

function CertificatesContent() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const requestCertificate = searchParams.get('requestCertificate');
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    // Si requestCertificate=true et courseId est présent, générer automatiquement le certificat
    if (requestCertificate === 'true' && courseId) {
      generateCertificate();
    }
  }, [requestCertificate, courseId]);

  const generateCertificate = async () => {
    if (!courseId || isGenerating) return;

    setIsGenerating(true);
    try {
      console.log('[CertificatesPage] 🎓 Génération automatique de l\'attestation pour le cours:', courseId);
      const result = await certificateService.generateForCourse(courseId);
      console.log('[CertificatesPage] ✅ Attestation générée avec succès:', result);
      
      toast.success(
        'Attestation générée',
        'Votre attestation a été générée avec succès avec les données mises à jour de votre profil.'
      );
      
      // Retirer les paramètres de l'URL pour éviter de régénérer
      const url = new URL(window.location.href);
      url.searchParams.delete('requestCertificate');
      url.searchParams.delete('courseId');
      window.history.replaceState({}, '', url.toString());
      
      // Recharger la page après un court délai pour afficher la nouvelle attestation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('[CertificatesPage] ❌ Erreur lors de la génération automatique de l\'attestation:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Impossible de générer l\'attestation. Veuillez réessayer.';
      toast.error('Erreur', errorMessage);
      
      // Retirer les paramètres même en cas d'erreur pour éviter de réessayer indéfiniment
      const url = new URL(window.location.href);
      url.searchParams.delete('requestCertificate');
      url.searchParams.delete('courseId');
      window.history.replaceState({}, '', url.toString());
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-900">
              Génération de votre attestation en cours...
            </p>
          </div>
        </div>
      )}
      {/* Liste des attestations de l'utilisateur */}
      <CertificateCollection />
    </div>
  );
}

export default function StudentCertificatesPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Loader className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        }>
          <CertificatesContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}
