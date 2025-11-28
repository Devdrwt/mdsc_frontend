'use client';

import React from 'react';
import { BadgeCheck, FileDown, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { Certificate } from '../../types/course';
import { certificateService } from '../../lib/services/certificateService';
import Button from '../ui/Button';

interface CertificateCardProps {
  certificate: Certificate;
  className?: string;
  onDownload?: () => void;
}

export default function CertificateCard({
  certificate,
  className = '',
  onDownload,
}: CertificateCardProps) {
  const handleDownload = async () => {
    // Ouvrir la page d'impression dédiée qui lance window.print()
    const printUrl = `/certificates/${certificate.id}/print`;
    window.open(printUrl, '_blank');
    onDownload?.();
  };

  const handleVerify = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const code = (certificate.certificateCode || (certificate as any).certificate_code || '').toUpperCase();
    if (!code) {
      console.error('Code d\'attestation manquant');
      return;
    }
    const verifyUrl = `/verify-certificate/${encodeURIComponent(code)}`;
    window.open(verifyUrl, '_blank');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="p-2 sm:p-3 bg-mdsc-gold/10 rounded-lg flex-shrink-0">
            <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-mdsc-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
              {certificate.course?.title || 'Attestation de formation'}
            </h3>
            {certificate.course && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {certificate.course.category} • {certificate.course.level}
              </p>
            )}
          </div>
        </div>
        
        {certificate.verified && (
          <div className="flex items-center space-x-1 text-green-600 flex-shrink-0">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-medium">Vérifié</span>
          </div>
        )}
      </div>

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="break-words">
            Émis le {new Date(certificate.issuedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        
        {certificate.expiresAt && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">
              Expire le {new Date(certificate.expiresAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Code de vérification</p>
          <p className="font-mono text-xs sm:text-sm font-medium text-gray-900 break-all">
            {certificate.certificateCode}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 sm:pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1 w-full sm:w-auto"
        >
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">Télécharger PDF</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleVerify}
          className="flex-1 w-full sm:w-auto touch-manipulation"
          type="button"
        >
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm">Vérifier</span>
        </Button>
      </div>
    </div>
  );
}
