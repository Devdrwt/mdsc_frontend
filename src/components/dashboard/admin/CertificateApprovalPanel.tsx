'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Eye, Clock, AlertCircle, User, Calendar, GraduationCap, Download } from 'lucide-react';
import { certificateService, Certificate } from '../../../lib/services/certificateService';
import toast from '../../../lib/utils/toast';

export default function CertificateApprovalPanel() {
  const [pendingCertificates, setPendingCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingCertificates();
  }, []);

  const loadPendingCertificates = async () => {
    try {
      setLoading(true);
      const certificates = await certificateService.getPendingCertificates();
      setPendingCertificates(certificates);
    } catch (error: any) {
      console.error('Erreur lors du chargement des certificats:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les certificats en attente');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    // TODO: Ouvrir un modal ou une page pour voir les détails du certificat
  };

  const handleOpenApprovalModal = (certificate: Certificate, action: 'approve' | 'reject') => {
    setSelectedCertificate(certificate);
    setApprovalAction(action);
    setComments('');
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedCertificate) return;

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast.warning('Raison requise', 'Veuillez fournir une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      if (approvalAction === 'approve') {
        await certificateService.approveCertificate(String(selectedCertificate.id), comments);
        toast.success('Certificat approuvé', 'Le certificat a été approuvé et sera émis.');
      } else {
        await certificateService.rejectCertificate(String(selectedCertificate.id), rejectionReason, comments);
        toast.success('Certificat rejeté', 'Le certificat a été rejeté. L\'étudiant a été notifié.');
      }
      setShowApprovalModal(false);
      loadPendingCertificates();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur', error.message || 'Impossible de valider le certificat');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (pendingCertificates.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun certificat en attente</h3>
        <p className="text-gray-500">Tous les certificats ont été validés ou il n'y a pas de demande en attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Validation des Certificats</h2>
            <p className="text-yellow-100">
              {pendingCertificates.length} certificat(s) en attente de validation
            </p>
          </div>
          <Award className="h-12 w-12" />
        </div>
      </div>

      {/* Liste des certificats en attente */}
      <div className="space-y-4">
        {pendingCertificates.map((certificate) => (
          <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {certificate.course_title || `Cours #${certificate.course_id}`}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        {(certificate.first_name || certificate.last_name) && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{[certificate.first_name, certificate.last_name].filter(Boolean).join(' ')}</span>
                          </div>
                        )}
                        {certificate.email && (
                          <div className="flex items-center space-x-1">
                            <span>{certificate.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Émis le {new Date(certificate.issued_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handlePreviewCertificate(certificate)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Vérifier</span>
                    </button>
                    <button
                      onClick={() => handleOpenApprovalModal(certificate, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approuver</span>
                    </button>
                    <button
                      onClick={() => handleOpenApprovalModal(certificate, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'approbation/rejet */}
      {showApprovalModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {approvalAction === 'approve' ? 'Approuver le certificat' : 'Rejeter le certificat'}
                </h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Informations du certificat */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Détails du certificat</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cours:</span>
                    <span className="font-medium text-gray-900">{selectedCertificate.course_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Étudiant:</span>
                    <span className="font-medium text-gray-900">
                      {[selectedCertificate.first_name, selectedCertificate.last_name].filter(Boolean).join(' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{selectedCertificate.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de demande:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedCertificate.issued_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du rejet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Sélectionner une raison</option>
                    <option value="evaluation_not_passed">Évaluation finale non réussie</option>
                    <option value="incomplete_course">Cours non complété</option>
                    <option value="invalid_info">Informations invalides</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaires {approvalAction === 'reject' ? '(optionnel)' : '(optionnel)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder={
                    approvalAction === 'approve'
                      ? 'Commentaires pour l\'étudiant (optionnel)...'
                      : 'Détails supplémentaires sur le rejet (optionnel)...'
                  }
                />
              </div>

              {approvalAction === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Le certificat sera émis et envoyé à l'étudiant
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        L'étudiant recevra une notification avec le certificat PDF
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {approvalAction === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Le certificat sera rejeté
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        L'étudiant recevra une notification avec les raisons du rejet
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitApproval}
                disabled={processing || (approvalAction === 'reject' && !rejectionReason)}
                className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Approuver</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Rejeter</span>
                      </>
                    )}
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

