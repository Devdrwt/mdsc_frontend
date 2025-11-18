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

  const handleVerify = () => {
    const verifyUrl = `/verify-certificate/${certificate.certificateCode}`;
    window.open(verifyUrl, '_blank');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-mdsc-gold/10 rounded-lg">
            <BadgeCheck className="h-6 w-6 text-mdsc-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {certificate.course?.title || 'Certificat de formation'}
            </h3>
            {certificate.course && (
              <p className="text-sm text-gray-500 mt-1">
                {certificate.course.category} • {certificate.course.level}
              </p>
            )}
          </div>
        </div>
        
        {certificate.verified && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Vérifié</span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            Émis le {new Date(certificate.issuedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        
        {certificate.expiresAt && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Expire le {new Date(certificate.expiresAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Code de vérification</p>
          <p className="font-mono text-sm font-medium text-gray-900">
            {certificate.certificateCode}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Télécharger PDF
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleVerify}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Vérifier
        </Button>
      </div>
    </div>
  );
}
