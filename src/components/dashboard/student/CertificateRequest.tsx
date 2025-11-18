'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, Clock, AlertCircle, Download, Loader, GraduationCap, User, Calendar } from 'lucide-react';
import { certificateService } from '../../../lib/services/certificateService';
import { Certificate } from '../../../types/course';
import toast from '../../../lib/utils/toast';

interface CertificateRequestProps {
  courseId?: string;
  enrollmentId?: number; // Optionnel, pour récupérer le certificat d'un cours spécifique
}

export default function CertificateRequest({ courseId, enrollmentId }: CertificateRequestProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, [courseId, enrollmentId]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      if (enrollmentId) {
        // Utiliser enrollmentId si disponible (prioritaire)
        const cert = await certificateService.getCourseCertificate(enrollmentId);
        setCertificates(cert ? [cert] : []);
      } else if (courseId) {
        // Fallback vers courseId
        const cert = await certificateService.getCourseCertificateByCourseId(courseId);
        setCertificates(cert ? [cert] : []);
      } else {
        // Charger tous les certificats
        const certs = await certificateService.getMyCertificates();
        setCertificates(certs);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des certificats:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les certificats');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async (courseIdOrEnrollmentId: string | number) => {
    setRequesting(true);
    try {
      // Génération immédiate (logique auto, pas de validation admin)
      const targetCourseId = typeof courseIdOrEnrollmentId === 'string'
        ? courseIdOrEnrollmentId
        : String(courseIdOrEnrollmentId);
      await certificateService.generateForCourse(targetCourseId);
      toast.success('Certificat généré', 'Votre certificat a été généré automatiquement.');
      loadCertificates();
    } catch (error: any) {
      console.error('Erreur lors de la demande de certificat:', error);
      toast.error('Erreur', error.message || 'Impossible d\'envoyer la demande de certificat');
    } finally {
      setRequesting(false);
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      const url = await certificateService.downloadCertificate(certificateId);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur', error.message || 'Impossible de télécharger le certificat');
    }
  };

  const getStatusBadge = (certificate: Certificate) => {
    // Pas d'attente: si valide => Émis, sinon Rejeté
    if (certificate.is_valid) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Émis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Rejeté
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des certificats */}
      {certificates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun certificat</h3>
          <p className="text-gray-500">
            {courseId
              ? 'Vous n\'avez pas encore demandé de certificat pour ce cours.'
              : 'Vous n\'avez pas encore de certificats.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {certificate.course_title || `Certificat du cours`}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        {(certificate.first_name || certificate.last_name) && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{[certificate.first_name, certificate.last_name].filter(Boolean).join(' ')}</span>
                          </div>
                        )}
                        {certificate.issued_at && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Émis le {new Date(certificate.issued_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(certificate)}
                  </div>

                  {certificate.certificate_code && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Code de vérification</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">{certificate.certificate_code.toUpperCase()}</p>
                    </div>
                  )}

                  {!certificate.is_valid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Certificat invalide</p>
                          <p className="text-sm text-red-700 mt-1">Ce certificat n'est plus valide.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plus de statut "En attente": génération automatique */}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {certificate.is_valid && (
                    <>
                      {certificate.certificate_code && (
                        <a
                          href={`/verify-certificate/${encodeURIComponent(certificate.certificate_code.toUpperCase())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Voir
                        </a>
                      )}
                    <button
                      onClick={() => handleDownloadCertificate(String(certificate.id))}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Télécharger</span>
                    </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton pour demander un certificat (si courseId fourni) */}
      {courseId && certificates.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Award className="h-6 w-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Demander un certificat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Si vous avez réussi l'évaluation finale de ce cours, vous pouvez générer automatiquement votre certificat.
              </p>
              <button
                onClick={() => handleRequestCertificate(courseId)}
                disabled={requesting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {requesting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5" />
                    <span>Demander le certificat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

