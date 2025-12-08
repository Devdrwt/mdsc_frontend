'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  User,
  Calendar,
  GraduationCap,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileText,
  TrendingUp,
  Users,
  FileDown,
  Trash2,
  Edit3,
  Shield,
  CheckCircle2,
  X,
  BarChart3,
} from 'lucide-react';
import { certificateService, Certificate } from '../../../lib/services/certificateService';
import { apiRequest } from '../../../lib/services/api';
import toast from '../../../lib/utils/toast';
import Modal from '../../ui/Modal';

interface CertificateStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  issued: number;
  expired: number;
}

export default function CertificateManagementPanel() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'issued'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      // Charger les certificats en attente
      const pending = await certificateService.getPendingCertificates();
      const pendingArray = Array.isArray(pending) ? pending : [];
      
      // Essayer de charger tous les certificats (si l'endpoint existe)
      try {
        const response = await apiRequest('/admin/certificates', {
          method: 'GET',
        });
        const allCerts = response.data || pendingArray;
        setCertificates(Array.isArray(allCerts) ? allCerts : pendingArray);
      } catch {
        // Fallback vers les certificats en attente seulement
        setCertificates(pendingArray);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des certificats:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les certificats');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const stats: CertificateStats = useMemo(() => {
    // S'assurer que certificates est toujours un tableau
    const certsArray = Array.isArray(certificates) ? certificates : [];
    
    const total = certsArray.length;
    const pending = certsArray.filter(c => (c.status || '').toLowerCase() === 'pending').length;
    const approved = certsArray.filter(c => (c.status || '').toLowerCase() === 'approved').length;
    const rejected = certsArray.filter(c => (c.status || '').toLowerCase() === 'rejected').length;
    const issued = certsArray.filter(c => {
      const status = (c.status || '').toLowerCase();
      return status === 'approved' || status === 'issued';
    }).length;
    
    const now = new Date();
    const expired = certsArray.filter(c => {
      if (!c.expires_at && !c.expiresAt) return false;
      const expiryDate = new Date(c.expires_at || c.expiresAt || '');
      return expiryDate <= now;
    }).length;

    return { total, pending, approved, rejected, issued, expired };
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    // S'assurer que certificates est toujours un tableau
    const certsArray = Array.isArray(certificates) ? certificates : [];
    let filtered = certsArray;

    // Filtrage par onglet
    if (activeTab !== 'all') {
      filtered = filtered.filter(cert => {
        const status = (cert.status || 'pending').toLowerCase();
        return status === activeTab;
      });
    }

    // Filtrage par statut supplémentaire
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => {
        const status = (cert.status || '').toLowerCase();
        return status === filterStatus;
      });
    }

    // Filtrage par date
    if (filterDateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      const rangeStart = ranges[filterDateRange];
      
      filtered = filtered.filter(cert => {
        const issuedDate = new Date(cert.issued_at || cert.issuedAt || '');
        return issuedDate >= rangeStart;
      });
    }

    // Filtrage par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.course_title?.toLowerCase().includes(term) ||
        cert.first_name?.toLowerCase().includes(term) ||
        cert.last_name?.toLowerCase().includes(term) ||
        cert.email?.toLowerCase().includes(term) ||
        cert.certificate_code?.toLowerCase().includes(term) ||
        cert.certificate_number?.toLowerCase().includes(term) ||
        String(cert.course_id || '').includes(term) ||
        String(cert.user_id || '').includes(term)
      );
    }

    return filtered;
  }, [certificates, activeTab, filterStatus, filterDateRange, searchTerm]);

  const handlePreviewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowDetailsModal(true);
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
        toast.success('Certificat rejeté', 'Le certificat a été rejeté. L\'utilisateur a été notifié.');
      }
      setShowApprovalModal(false);
      loadCertificates();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur', error.message || 'Impossible de valider le certificat');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const downloadUrl = await certificateService.downloadCertificate(String(certificate.id));
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur', error.message || 'Impossible de télécharger le certificat');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'issued':
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && certificates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold"></div>
      </div>
    );
  }

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
              Gérez tous les certificats de votre plateforme d'apprentissage. Validez, approuvez et suivez les demandes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadCertificates}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <CheckCircle2 className="h-6 w-6 text-white" />
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

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Onglets */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4 lg:pb-0 lg:border-b-0">
            {[
              { id: 'all', label: 'Tous', count: stats.total },
              { id: 'pending', label: 'En attente', count: stats.pending },
              { id: 'approved', label: 'Approuvés', count: stats.approved },
              { id: 'rejected', label: 'Rejetés', count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, cours, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Filtres supplémentaires */}
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
              <option value="issued">Émis</option>
            </select>

            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des certificats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucun certificat trouvé</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'all' || filterDateRange !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Aucun certificat disponible pour le moment'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Cours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Code certificat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Date d'émission
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Expiration
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCertificates.map((certificate) => (
                  <tr
                    key={certificate.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-mdsc-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {((certificate.first_name || certificate.email || '?').charAt(0) || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {[certificate.first_name, certificate.last_name].filter(Boolean).join(' ') || 'Nom non disponible'}
                          </div>
                          <div className="text-xs text-gray-500">{certificate.email || 'Email non disponible'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.course_title || `Cours #${certificate.course_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-600">
                        {certificate.certificate_code || certificate.certificate_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(certificate.status || 'pending')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(certificate.issued_at || certificate.issuedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {certificate.expires_at || certificate.expiresAt
                          ? formatDate(certificate.expires_at || certificate.expiresAt)
                          : 'Sans expiration'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreviewCertificate(certificate)}
                          className="p-2 text-gray-400 hover:text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-all duration-200"
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
                        {((certificate.status || '').toLowerCase() === 'approved' || 
                          (certificate.status || '').toLowerCase() === 'issued') && (
                          <button
                            onClick={() => handleDownloadCertificate(certificate)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails du certificat"
        size="lg"
      >
        {selectedCertificate && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Utilisateur</label>
                <p className="text-sm text-gray-900">
                  {[selectedCertificate.first_name, selectedCertificate.last_name].filter(Boolean).join(' ') || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedCertificate.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cours</label>
                <p className="text-sm text-gray-900">
                  {selectedCertificate.course_title || `Cours #${selectedCertificate.course_id}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Code certificat</label>
                <p className="text-sm font-mono text-gray-900">
                  {selectedCertificate.certificate_code || selectedCertificate.certificate_number || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
                <div className="mt-1">
                  {getStatusBadge(selectedCertificate.status || 'pending')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'émission</label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedCertificate.issued_at || selectedCertificate.issuedAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'expiration</label>
                <p className="text-sm text-gray-900">
                  {selectedCertificate.expires_at || selectedCertificate.expiresAt
                    ? formatDate(selectedCertificate.expires_at || selectedCertificate.expiresAt)
                    : 'Sans expiration'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              {((selectedCertificate.status || '').toLowerCase() === 'approved' || 
                (selectedCertificate.status || '').toLowerCase() === 'issued') && (
                <button
                  onClick={() => {
                    handleDownloadCertificate(selectedCertificate);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'approbation/rejet */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={approvalAction === 'approve' ? 'Approuver le certificat' : 'Rejeter le certificat'}
        size="md"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Utilisateur</p>
              <p className="text-sm text-gray-600">
                {[selectedCertificate.first_name, selectedCertificate.last_name].filter(Boolean).join(' ') || 'N/A'}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-3 mb-1">Cours</p>
              <p className="text-sm text-gray-600">
                {selectedCertificate.course_title || `Cours #${selectedCertificate.course_id}`}
              </p>
            </div>

            {approvalAction === 'reject' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Raison du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 resize-none"
                  placeholder="Expliquez pourquoi ce certificat est rejeté..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Commentaires (optionnel)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 resize-none"
                placeholder="Ajoutez des commentaires supplémentaires..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitApproval}
                disabled={processing || (approvalAction === 'reject' && !rejectionReason.trim())}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  approvalAction === 'approve'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:scale-105'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:scale-105'
                } disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approuver
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

