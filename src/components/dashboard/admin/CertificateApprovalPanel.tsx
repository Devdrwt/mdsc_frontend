'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Award, CheckCircle, XCircle, Eye, Clock, AlertCircle, User, Calendar, GraduationCap, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { certificateService, Certificate } from '../../../lib/services/certificateService';
import toast from '../../../lib/utils/toast';
import DataTable from '../shared/DataTable';
import Modal from '../../ui/Modal';

export default function CertificateApprovalPanel() {
  const [pendingCertificates, setPendingCertificates] = useState<Certificate[]>([]);
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadPendingCertificates();
  }, []);

  const loadPendingCertificates = async () => {
    try {
      setLoading(true);
      const certificates = await certificateService.getPendingCertificates();
      setPendingCertificates(certificates);
      setAllCertificates(certificates); // Pour l'instant, on utilise les mêmes données
    } catch (error: any) {
      console.error('Erreur lors du chargement des certificats:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les certificats en attente');
      setPendingCertificates([]);
      setAllCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = useMemo(() => {
    const certificates = activeTab === 'pending' ? pendingCertificates : allCertificates;
    let filtered = certificates;

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => {
        const status = (cert.status || 'pending').toLowerCase();
        return status === filterStatus;
      });
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [pendingCertificates, allCertificates, searchTerm, filterStatus, activeTab]);

  const handlePreviewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Rejeté
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            En attente
          </span>
        );
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = allCertificates.length;
    const pending = pendingCertificates.length;
    const approved = allCertificates.filter(c => (c.status || '').toLowerCase() === 'approved').length;
    const rejected = allCertificates.filter(c => (c.status || '').toLowerCase() === 'rejected').length;

    return { total, pending, approved, rejected };
  }, [allCertificates, pendingCertificates]);

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
        toast.success('Certificat rejeté', 'Le certificat a été rejeté. L\'utilisateur a été notifié.');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

  const columns = [
    {
      key: 'student',
      label: 'Utilisateur',
      sortable: true,
      render: (_value: any, certificate: Certificate) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-mdsc-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
            {((certificate.first_name || certificate.email || '?').charAt(0) || '?').toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {[certificate.first_name, certificate.last_name].filter(Boolean).join(' ') || 'Nom non disponible'}
            </div>
            <div className="text-xs text-gray-500">{certificate.email || 'Email non disponible'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'course',
      label: 'Cours',
      sortable: true,
      render: (_value: any, certificate: Certificate) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{certificate.course_title || `Cours #${certificate.course_id}`}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (_value: any, certificate: Certificate) => getStatusBadge(certificate.status || 'pending')
    },
    {
      key: 'date',
      label: 'Date de demande',
      sortable: true,
      render: (_value: any, certificate: Certificate) => (
        <div className="text-sm text-gray-600">
          {new Date(certificate.issued_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, certificate: Certificate) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePreviewCertificate(certificate)}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(certificate.status || 'pending').toLowerCase() === 'pending' && (
            <>
              <button
                onClick={() => handleOpenApprovalModal(certificate, 'approve')}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="Approuver"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleOpenApprovalModal(certificate, 'reject')}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Rejeter"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* En-tête moderne */}
      <div className="relative bg-gradient-to-br from-mdsc-gold via-yellow-500 to-orange-500 rounded-xl p-8 text-white shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Certificats</h1>
            </div>
            <p className="text-gray-100 text-base max-w-2xl">
              Validez et gérez tous les certificats de votre plateforme d'apprentissage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPendingCertificates}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-mdsc-gold to-yellow-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total certificats</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approuvés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejetés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 bg-white rounded-t-xl px-6 pt-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-mdsc-gold text-mdsc-gold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>En attente ({stats.pending})</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'all'
              ? 'border-mdsc-gold text-mdsc-gold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Tous les certificats ({stats.total})</span>
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-mdsc-gold transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur, cours, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold transition-all w-full bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des certificats */}
      {filteredCertificates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-dashed border-gray-300 p-12 text-center">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun certificat trouvé</h3>
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? 'Aucun certificat en attente de validation.' 
              : 'Aucun certificat ne correspond aux critères sélectionnés.'}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCertificates}
          searchable={false}
          filterable={false}
          pagination={true}
          pageSize={10}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedCertificate && (
        <Modal
          isOpen
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCertificate(null);
          }}
          title="Détails du certificat"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Informations</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cours:</span>
                  <p className="font-medium text-gray-900">{selectedCertificate.course_title || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Utilisateur:</span>
                  <p className="font-medium text-gray-900">
                    {[selectedCertificate.first_name, selectedCertificate.last_name].filter(Boolean).join(' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{selectedCertificate.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date de demande:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedCertificate.issued_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Statut:</span>
                  <div className="mt-1">{getStatusBadge(selectedCertificate.status || 'pending')}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {(selectedCertificate.status || 'pending').toLowerCase() === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenApprovalModal(selectedCertificate, 'approve');
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenApprovalModal(selectedCertificate, 'reject');
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeter
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'approbation/rejet */}
      {showApprovalModal && selectedCertificate && (
        <Modal
          isOpen
          onClose={() => setShowApprovalModal(false)}
          title={approvalAction === 'approve' ? 'Approuver le certificat' : 'Rejeter le certificat'}
          size="lg"
        >
          <div className="space-y-4">
            {/* Informations du certificat */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Détails du certificat</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cours:</span>
                  <span className="font-medium text-gray-900">{selectedCertificate.course_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilisateur:</span>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-gold focus:border-mdsc-gold"
                placeholder={
                  approvalAction === 'approve'
                    ? 'Commentaires pour l\'utilisateur (optionnel)...'
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
                      Le certificat sera émis et envoyé à l'utilisateur
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      L'utilisateur recevra une notification avec le certificat PDF
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
                      L'utilisateur recevra une notification avec les raisons du rejet
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
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
        </Modal>
      )}
    </div>
  );
}

