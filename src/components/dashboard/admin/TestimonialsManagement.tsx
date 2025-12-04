'use client';

import React, { useState, useEffect } from 'react';
import {
  Quote,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Star,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { testimonialService, Testimonial } from '../../../lib/services/testimonialService';
import toast from '../../../lib/utils/toast';

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [testimonialToReject, setTestimonialToReject] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    quote: '',
    author: '',
    title: '',
    avatar: '',
    rating: 5,
    is_active: true,
    display_order: 0,
  });

  // Charger les témoignages
  useEffect(() => {
    loadTestimonials();
  }, [activeTab]); // Recharger quand l'onglet change

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      // Récupérer les témoignages selon l'onglet actif
      const statusParam = activeTab === 'all' ? 'all' : activeTab;
      console.log('🔄 Chargement des témoignages avec status:', statusParam, 'onglet:', activeTab);
      
      // Charger tous les témoignages avec includePending, puis filtrer côté client
      // Cela garantit que tous les témoignages sont disponibles, même si le backend
      // ne supporte pas encore le paramètre status
      const requestParams: any = {
        order: 'asc',
        orderBy: 'display_order',
        includePending: true, // Toujours charger tous les témoignages pour les admins
      };
      
      // Si le backend supporte le paramètre status, on l'ajoute aussi
      if (activeTab !== 'all') {
        requestParams.status = statusParam as 'pending' | 'approved' | 'rejected';
      }
      
      let data = await testimonialService.getTestimonials(requestParams);
      
      // Filtrer côté client pour garantir l'affichage correct
      if (activeTab !== 'all') {
        data = data.filter((t: Testimonial) => {
          if (activeTab === 'pending') {
            return t.status === 'pending' || (t.is_active === false && !t.status);
          } else if (activeTab === 'approved') {
            return t.is_active === true && (t.status === 'approved' || !t.status);
          } else if (activeTab === 'rejected') {
            return t.status === 'rejected';
          }
          return true;
        });
      }
      
      console.log(`✅ ${data.length} témoignage(s) récupéré(s) pour l'onglet "${activeTab}"`, data);
      setTestimonials(data);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des témoignages:', {
        error,
        message: error?.message,
        status: error?.status,
      });
      toast.error('Erreur', error?.message || 'Impossible de charger les témoignages');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  // Le backend filtre déjà selon le statut, donc on utilise directement testimonials
  const filteredTestimonials = testimonials;

  // Pour les compteurs, on doit charger tous les témoignages une fois
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  
  useEffect(() => {
    const loadAllForCounts = async () => {
      try {
        const data = await testimonialService.getTestimonials({
          status: 'all',
        });
        setAllTestimonials(data);
      } catch (error) {
        console.error('Erreur lors du chargement des compteurs:', error);
      }
    };
    loadAllForCounts();
  }, []);

  const pendingCount = allTestimonials.filter(t => t.status === 'pending' || (t.is_active === false && !t.status)).length;
  const approvedCount = allTestimonials.filter(t => t.is_active === true && (t.status === 'approved' || !t.status)).length;
  const rejectedCount = allTestimonials.filter(t => t.status === 'rejected').length;

  const handleOpenForm = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        quote: testimonial.quote || '',
        author: testimonial.author || '',
        title: testimonial.title || '',
        avatar: testimonial.avatar || '',
        rating: testimonial.rating || 5,
        is_active: testimonial.is_active !== false,
        display_order: testimonial.display_order || 0,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        quote: '',
        author: '',
        title: '',
        avatar: '',
        rating: 5,
        is_active: true,
        display_order: testimonials.length,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTestimonial(null);
    setFormData({
      quote: '',
      author: '',
      title: '',
      avatar: '',
      rating: 5,
      is_active: true,
      display_order: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await testimonialService.updateTestimonial(editingTestimonial.id, formData);
        toast.success('Succès', 'Témoignage mis à jour avec succès');
      } else {
        await testimonialService.createTestimonial(formData);
        toast.success('Succès', 'Témoignage créé avec succès');
      }
      handleCloseForm();
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return;
    }

    try {
      await testimonialService.deleteTestimonial(id);
      toast.success('Succès', 'Témoignage supprimé avec succès');
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleApprove = async (id: string | number) => {
    try {
      await testimonialService.approveTestimonial(id);
      toast.success('Succès', 'Témoignage approuvé et publié');
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleReject = async () => {
    if (!testimonialToReject) return;

    try {
      await testimonialService.rejectTestimonial(testimonialToReject.id, rejectReason);
      toast.success('Succès', 'Témoignage rejeté');
      setShowRejectModal(false);
      setTestimonialToReject(null);
      setRejectReason('');
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleToggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      await testimonialService.toggleTestimonialStatus(id, !currentStatus);
      toast.success('Succès', `Témoignage ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleMoveOrder = async (id: string | number, direction: 'up' | 'down') => {
    const testimonial = testimonials.find(t => t.id === id);
    if (!testimonial) return;

    const currentOrder = testimonial.display_order || 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    // Trouver le témoignage à échanger
    const swapTestimonial = testimonials.find(
      t => t.id !== id && (t.display_order || 0) === newOrder
    );

    try {
      if (swapTestimonial) {
        // Échanger les ordres
        await testimonialService.updateTestimonial(id, { display_order: newOrder });
        await testimonialService.updateTestimonial(swapTestimonial.id, {
          display_order: currentOrder,
        });
      } else {
        await testimonialService.updateTestimonial(id, { display_order: newOrder });
      }
      loadTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement des témoignages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Témoignages</h2>
          <p className="text-gray-600 mt-1">Modérez et gérez les témoignages des étudiants</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
        >
          <Plus className="h-5 w-5" />
          Ajouter un témoignage
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          En attente
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Approuvés
          {approvedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
              {approvedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <XCircle className="h-4 w-4" />
          Rejetés
          {rejectedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
              {rejectedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tous
        </button>
      </div>

      {/* Liste des témoignages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {activeTab === 'pending' && 'Aucun témoignage en attente de modération.'}
            {activeTab === 'approved' && 'Aucun témoignage approuvé.'}
            {activeTab === 'rejected' && 'Aucun témoignage rejeté.'}
            {activeTab === 'all' && 'Aucun témoignage pour le moment.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  testimonial.is_active === false ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-mdsc-blue rounded-full flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar || getInitials(testimonial.author)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{testimonial.author}</h3>
                        {testimonial.title && (
                          <p className="text-sm text-gray-600">{testimonial.title}</p>
                        )}
                        {testimonial.course_title && (
                          <p className="text-sm text-mdsc-blue-primary mt-1 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {testimonial.course_title}
                          </p>
                        )}
                      </div>
                      {testimonial.is_active === false && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                          Inactif
                        </span>
                      )}
                    </div>
                    <blockquote className="text-gray-700 italic mb-3 line-clamp-2">
                      "{testimonial.quote}"
                    </blockquote>
                    {testimonial.rating && testimonial.rating > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(Math.min(testimonial.rating, 5))].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-mdsc-orange fill-current" />
                        ))}
                      </div>
                    )}
                    {testimonial.status === 'rejected' && testimonial.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Raison du rejet:</strong> {testimonial.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Actions de modération pour les témoignages en attente */}
                    {(testimonial.status === 'pending' || (testimonial.is_active === false && !testimonial.status)) && (
                      <>
                        <button
                          onClick={() => handleApprove(testimonial.id)}
                          className="p-2 text-green-600 hover:text-green-700"
                          title="Approuver"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTestimonialToReject(testimonial);
                            setShowRejectModal(true);
                          }}
                          className="p-2 text-red-600 hover:text-red-700"
                          title="Rejeter"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Boutons d'ordre (seulement pour les témoignages approuvés) */}
                    {testimonial.is_active === true && testimonial.status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleMoveOrder(testimonial.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Déplacer vers le haut"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(testimonial.id, 'down')}
                          disabled={index === filteredTestimonials.length - 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Déplacer vers le bas"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Toggle status (pour les témoignages approuvés) */}
                    {testimonial.status === 'approved' || (testimonial.is_active === true && !testimonial.status) ? (
                      <button
                        onClick={() => handleToggleStatus(testimonial.id, testimonial.is_active !== false)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Désactiver"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    ) : null}

                    {/* Éditer */}
                    <button
                      onClick={() => handleOpenForm(testimonial)}
                      className="p-2 text-blue-600 hover:text-blue-700"
                      title="Éditer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTestimonial ? 'Modifier le témoignage' : 'Nouveau témoignage'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Citation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  placeholder="Entrez le texte du témoignage..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auteur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Nom de l'auteur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre/Fonction
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Ex: Formatrice certifiée"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initiales Avatar
                  </label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="CC (optionnel, généré automatiquement)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour générer automatiquement depuis le nom
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (étoiles)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} {rating > 1 ? 'étoiles' : 'étoile'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-mdsc-blue-primary border-gray-300 rounded focus:ring-mdsc-blue-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Témoignage actif</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingTestimonial ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && testimonialToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Rejeter le témoignage</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setTestimonialToReject(null);
                  setRejectReason('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      Témoignage de {testimonialToReject.author}
                    </p>
                    <blockquote className="text-sm text-yellow-700 italic">
                      "{testimonialToReject.quote}"
                    </blockquote>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rejet (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Expliquez pourquoi ce témoignage est rejeté..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cette raison sera visible par l'étudiant
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setTestimonialToReject(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

