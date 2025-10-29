'use client';

import React, { useState, useEffect } from 'react';
import { Award, Download, X, QrCode, CheckCircle, ExternalLink } from 'lucide-react';
import { Certificate } from '../../types/course';
import { certificateService } from '../../lib/services/certificateService';
import Button from '../ui/Button';

interface CertificateViewerProps {
  certificate: Certificate;
  onClose?: () => void;
  className?: string;
}

export default function CertificateViewer({
  certificate,
  onClose,
  className = '',
}: CertificateViewerProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await certificateService.downloadCertificate(certificate.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificat-${certificate.certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du certificat');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const verifyUrl = certificateService.getVerificationUrl(certificate.certificateCode);
    window.open(verifyUrl, '_blank');
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
            {certificate.course && (
              <p className="text-white/90 mt-1">{certificate.course.title}</p>
            )}
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
        {/* Certificate Preview */}
        {certificate.pdfUrl && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="aspect-[4/3] bg-white rounded border border-gray-200 flex items-center justify-center">
              <iframe
                src={certificate.pdfUrl}
                className="w-full h-full rounded"
                title="Aperçu du certificat"
              />
            </div>
          </div>
        )}

        {/* Certificate Details */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Code de vérification</h3>
            <p className="font-mono text-lg font-bold text-gray-900">{certificate.certificateCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'émission</h3>
              <p className="text-gray-900">
                {new Date(certificate.issuedAt).toLocaleDateString('fr-FR', {
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

          {/* QR Code */}
          {certificate.qrCodeUrl && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <QrCode className="h-5 w-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Code QR de vérification</h3>
              </div>
              <img
                src={certificate.qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32 mx-auto"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={loading}
            className="flex-1"
          >
            <Download className="h-5 w-5 mr-2" />
            {loading ? 'Téléchargement...' : 'Télécharger PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={handleVerify}
            className="flex-1"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Vérifier en ligne
          </Button>
        </div>
      </div>
    </div>
  );
}
