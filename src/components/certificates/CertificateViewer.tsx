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
      a.download = `certificat-${certificate.certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du certificat');
    }
  };

  const handleVerify = () => {
    const verifyUrl = `/verify-certificate/${certificate.certificateCode}`;
    window.open(verifyUrl, '_blank');
  };

  const handlePrint = () => {
    const printUrl = `/certificates/${certificate.id}/print`;
    window.open(printUrl, '_blank');
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark text-white p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Certificat de Formation</h2>
            <p className="text-white/90 mt-1">
              {certificate.course?.title || (certificate as any).course_title || '—'}
            </p>
          </div>
        </div>

        {certificate.verified && (
          <div className="flex items-center space-x-2 text-mdsc-gold">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Certificat vérifié</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Certificate Preview plein largeur (forme réelle, non compressée) */}
        <div className="mb-6 w-full">
          <div className="w-full">
            <CertificatePreview
              fullName={`${(certificate as any).first_name || (certificate as any).firstName || ''} ${(certificate as any).last_name || (certificate as any).lastName || ''}`.trim() || 'Étudiant(e)'}
              courseTitle={certificate.course?.title || (certificate as any).course_title || '—'}
              location="Cotonou, Bénin"
              issuedAt={new Date(certificate.issuedAt || (certificate as any).issued_at || Date.now())}
              code={(certificate as any).certificate_code || certificate.certificateCode}
            />
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Code de vérification</h3>
            <p className="font-mono text-lg font-bold text-gray-900">
              {certificate.certificateCode || (certificate as any).certificate_code || '—'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'émission</h3>
              <p className="text-gray-900">
                {new Date(certificate.issuedAt || (certificate as any).issued_at || Date.now()).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            
            {certificate.expiresAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'expiration</h3>
                <p className="text-gray-900">
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
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          {showDownload && (
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={loading}
            className="flex-1"
          >
            <Download className="h-5 w-5 mr-2" />
            {loading ? 'Téléchargement...' : 'Télécharger PDF'}
          </Button>
          )}
          {showPrint && (
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Imprimer
            </Button>
          )}
          {showVerifyOnline && (
            <Button
              variant="outline"
              onClick={handleVerify}
              className="flex-1"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Vérifier en ligne
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
