'use client';

import React, { useState, useEffect } from 'react';
import { Quote, Star, Save, X, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { testimonialService, Testimonial } from '../../../lib/services/testimonialService';
import { useAuthStore } from '../../../lib/stores/authStore';
import toast from '../../../lib/utils/toast';

export default function TestimonialForm() {
  const { user } = useAuthStore();
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    quote: '',
    rating: 5,
  });

  useEffect(() => {
    loadMyTestimonials();
  }, []);

  const loadMyTestimonials = async () => {
    try {
      setLoading(true);
      // Récupérer les témoignages de l'étudiant connecté
      const data = await testimonialService.getMyTestimonials();
      setMyTestimonials(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement de mes témoignages:', error);
      toast.error('Erreur', error?.message || 'Impossible de charger vos témoignages');
      setMyTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setFormData({
      quote: '',
      rating: 5,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      quote: '',
      rating: 5,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Soumission du témoignage (TestimonialForm)...', {
      quoteLength: formData.quote.trim().length,
      user: user?.id,
    });
    
    if (!formData.quote.trim()) {
      toast.error('Erreur', 'Veuillez entrer votre témoignage');
      return;
    }

    if (formData.quote.trim().length < 20) {
      toast.error('Erreur', 'Le témoignage doit contenir au moins 20 caractères');
      return;
    }

    if (!user) {
      toast.error('Erreur', 'Vous devez être connecté pour soumettre un témoignage');
      return;
    }

    try {
      setSubmitting(true);
      
      // Créer le témoignage avec les informations de l'utilisateur
      await testimonialService.createTestimonial({
        quote: formData.quote.trim(),
        author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Étudiant',
        title: user?.role === 'student' ? 'Apprenant' : '',
        avatar: user?.firstName?.[0] && user?.lastName?.[0] 
          ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
          : '',
        rating: formData.rating,
        is_active: false, // En attente de modération par défaut
        display_order: 0,
        status: 'pending',
        user_id: user?.id,
      });

      toast.success('Succès', 'Votre témoignage a été soumis et est en attente de modération');
      handleCloseForm();
      loadMyTestimonials();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Une erreur est survenue lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (testimonial: Testimonial) => {
    if (testimonial.is_active === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
          <CheckCircle className="h-3 w-3" />
          Publié
        </span>
      );
    } else if (testimonial.is_active === false && testimonial.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
          <Clock className="h-3 w-3" />
          En attente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          <X className="h-3 w-3" />
          Rejeté
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mon Témoignage</h2>
          <p className="text-gray-600 mt-1">
            Partagez votre expérience avec la plateforme MdSC
          </p>
        </div>
        {myTestimonials.length === 0 && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
          >
            <Quote className="h-5 w-5" />
            Créer un témoignage
          </button>
        )}
      </div>

      {/* Mes témoignages */}
      {myTestimonials.length > 0 ? (
        <div className="space-y-4">
          {myTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-mdsc-blue rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar || 
                      `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()}
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
                </div>
                {getStatusBadge(testimonial)}
              </div>

              <blockquote className="text-gray-700 italic mb-4 pl-4 border-l-4 border-mdsc-orange">
                "{testimonial.quote}"
              </blockquote>

              {testimonial.rating && testimonial.rating > 0 && (
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(testimonial.rating, 5))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-mdsc-orange fill-current" />
                  ))}
                </div>
              )}

              {testimonial.status === 'rejected' && testimonial.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Raison du rejet:</strong> {testimonial.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Quote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun témoignage pour le moment
          </h3>
          <p className="text-gray-600 mb-6">
            Partagez votre expérience avec la plateforme MdSC et aidez d'autres apprenants à découvrir nos formations.
          </p>
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
          >
            <Quote className="h-5 w-5" />
            Créer mon témoignage
          </button>
        </div>
      )}

      {/* Modal de formulaire */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Créer un témoignage</h3>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre témoignage <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  required
                  rows={6}
                  minLength={20}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  placeholder="Partagez votre expérience avec la plateforme MdSC. Décrivez comment nos formations vous ont aidé, ce que vous avez appris, ou ce que vous recommanderiez à d'autres apprenants..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 20 caractères. {formData.quote.length} caractères saisis.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (étoiles)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className={`p-2 rounded-lg transition-colors ${
                        formData.rating >= rating
                          ? 'text-mdsc-orange'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          formData.rating >= rating ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating} {formData.rating > 1 ? 'étoiles' : 'étoile'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Votre témoignage sera soumis pour modération. 
                  Il sera publié sur la page d'accueil une fois approuvé par un administrateur.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.quote.trim().length < 20}
                  className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Soumettre
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

