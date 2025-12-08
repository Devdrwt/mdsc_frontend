'use client';

import React, { useState, useEffect } from 'react';
import { Award, Download, X, QrCode, CheckCircle, ExternalLink } from 'lucide-react';
import { Certificate } from '../../types/course';
import { certificateService } from '../../lib/services/certificateService';
import Button from '../ui/Button';
import CertificatePreview from './CertificatePreview';

interface CertificateViewerProps {
  certificate: Certificate;
  onClose?: () => void;
  className?: string;
  showDownload?: boolean; // permettre de masquer le téléchargement (ex: page de vérification publique)
  showVerifyOnline?: boolean; // permettre de masquer le bouton "Vérifier en ligne"
  showPrint?: boolean; // afficher le bouton Imprimer
}

export default function CertificateViewer({
  certificate,
  onClose,
  className = '',
  showDownload = true,
  showVerifyOnline = true,
  showPrint = true,
}: CertificateViewerProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      const downloadUrl = await certificateService.downloadCertificate(certificate.id.toString());
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attestation-${certificate.certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de l\'attestation');
    }
  };

  const handleVerify = () => {
    // Utiliser certificate_number (format MDSC-XXXXXX-BJ) pour la vérification
    const code = ((certificate as any).certificate_number || (certificate as any).certificateNumber || certificate.certificateCode || (certificate as any).certificate_code || '').toUpperCase();
    const verifyUrl = `/verify-certificate/${encodeURIComponent(code)}`;
    window.open(verifyUrl, '_blank');
  };

  const handlePrint = () => {
    const printUrl = `/certificates/${certificate.id}/print`;
    window.open(printUrl, '_blank');
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark text-white p-4 sm:p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-3 sm:mb-4 pr-8 sm:pr-0">
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
            <Award className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold break-words">Attestation de Formation</h2>
            <p className="text-sm sm:text-base text-white/90 mt-1 break-words">
              {certificate.course?.title || (certificate as any).course_title || '—'}
            </p>
          </div>
        </div>

        {certificate.verified && (
          <div className="flex items-center space-x-2 text-mdsc-gold text-sm sm:text-base">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">Attestation vérifiée</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6">
        {/* Certificate Preview plein largeur (forme réelle, non compressée) */}
        <div className="mb-3 sm:mb-4 md:mb-6 w-full overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
          <div className="w-full min-w-[280px] max-w-full">
            <CertificatePreview
              fullName={`${(certificate as any).first_name || (certificate as any).firstName || ''} ${(certificate as any).last_name || (certificate as any).lastName || ''}`.trim() || 'Utilisateur(trice)'}
              courseTitle={certificate.course?.title || (certificate as any).course_title || '—'}
              location="Cotonou, Bénin"
              issuedAt={new Date(certificate.issuedAt || (certificate as any).issued_at || Date.now())}
              code={((certificate as any).certificate_number || (certificate as any).certificateNumber || (certificate as any).certificate_code || certificate.certificateCode || '').toUpperCase()}
            />
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Code de vérification</h3>
            <p className="font-mono text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 break-all px-1">
              {((certificate as any).certificate_number || (certificate as any).certificateNumber || certificate.certificateCode || (certificate as any).certificate_code || '—').toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Date d'émission</h3>
              <p className="text-sm sm:text-base text-gray-900">
                {new Date(certificate.issuedAt || (certificate as any).issued_at || Date.now()).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            
            {certificate.expiresAt && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Date d'expiration</h3>
                <p className="text-sm sm:text-base text-gray-900">
                  {new Date(certificate.expiresAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Pas d'affichage de QR ici, seulement le certificat lui-même */}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-200">
          {showDownload && (
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="text-sm sm:text-base">{loading ? 'Téléchargement...' : 'Télécharger PDF'}</span>
          </Button>
          )}
          {showPrint && (
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 w-full sm:w-auto"
            >
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Imprimer</span>
            </Button>
          )}
          {showVerifyOnline && (
            <Button
              variant="outline"
              onClick={handleVerify}
              className="flex-1 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Vérifier en ligne</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
