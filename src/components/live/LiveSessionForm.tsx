'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Save, X, Loader2, BookOpen, Video, Image as ImageIcon, Upload } from 'lucide-react';
import { LiveSession, CreateLiveSessionData, UpdateLiveSessionData } from '../../types/liveSession';
import toast from '../../lib/utils/toast';
import { CourseService } from '../../lib/services/courseService';
import { useAuthStore } from '../../lib/stores/authStore';
import { FileService } from '../../lib/services/fileService';

interface LiveSessionFormProps {
  courseId?: number | null;
  session?: LiveSession;
  onSubmit: (data: CreateLiveSessionData | UpdateLiveSessionData, courseData?: any) => Promise<void>;
  onCancel: () => void;
}

export default function LiveSessionForm({
  courseId,
  session,
  onSubmit,
  onCancel,
}: LiveSessionFormProps) {
  const { user } = useAuthStore();
  // Si courseId est null, on doit créer un cours aussi
  const needsCourseCreation = !courseId && !session;
  
  const [formData, setFormData] = useState({
    // Champs de session
    title: session?.title || '',
    description: session?.description || '',
    scheduled_start_at: session
      ? new Date(session.scheduled_start_at).toISOString().slice(0, 16)
      : '',
    scheduled_end_at: session
      ? new Date(session.scheduled_end_at).toISOString().slice(0, 16)
      : '',
    max_participants: session?.max_participants || 50,
    is_recording_enabled: session?.is_recording_enabled || false,
    // Champs de cours (si création)
    course_title: session?.course?.title || '',
    course_description: session?.course?.title ? '' : '',
    course_short_description: '',
    category_id: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'fr',
    duration_minutes: 60,
    price: 0,
    currency: 'XOF',
    enrollment_deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Charger les catégories disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const catsResponse = await CourseService.getCategories();
        const categoriesData = Array.isArray(catsResponse)
          ? catsResponse
          : (catsResponse as any)?.data?.categories || (catsResponse as any)?.categories || [];
        setCategories(categoriesData);
        
        // Sélectionner la première catégorie par défaut si aucune n'est sélectionnée
        setFormData(prev => {
          if (!prev.category_id && categoriesData.length > 0) {
            return {
              ...prev,
              category_id: String(categoriesData[0].id),
            };
          }
          return prev;
        });
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (needsCourseCreation) {
      loadCategories();
    }
  }, [needsCourseCreation]);

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'L\'image ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const uploaded = await FileService.uploadFile(file, { category: 'course_thumbnail' });
      const photoUrl = uploaded.url || (uploaded as any).storage_path;
      if (photoUrl) {
        setThumbnailFile(file);
        setThumbnailPreview(photoUrl);
        toast.success('Image uploadée', 'Votre image de couverture a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  useEffect(() => {
    if (session) {
      setFormData(prev => ({
        ...prev,
        title: session.title,
        description: session.description || '',
        scheduled_start_at: new Date(session.scheduled_start_at).toISOString().slice(0, 16),
        scheduled_end_at: new Date(session.scheduled_end_at).toISOString().slice(0, 16),
        max_participants: session.max_participants,
        is_recording_enabled: session.is_recording_enabled,
      }));
    }
  }, [session]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation session
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre de la session est obligatoire';
    }

    if (!formData.scheduled_start_at) {
      newErrors.scheduled_start_at = 'La date de début est obligatoire';
    }

    if (!formData.scheduled_end_at) {
      newErrors.scheduled_end_at = 'La date de fin est obligatoire';
    }

    if (formData.scheduled_start_at && formData.scheduled_end_at) {
      const start = new Date(formData.scheduled_start_at);
      const end = new Date(formData.scheduled_end_at);

      if (end <= start) {
        newErrors.scheduled_end_at = 'La date de fin doit être après la date de début';
      }

      if (start < new Date()) {
        newErrors.scheduled_start_at = 'La date de début doit être dans le futur';
      }
    }

    if (formData.max_participants < 1) {
      newErrors.max_participants = 'Le nombre de participants doit être au moins 1';
    }

    // Validation cours (si création)
    if (needsCourseCreation) {
      if (!formData.course_title.trim()) {
        newErrors.course_title = 'Le titre du cours est obligatoire';
      }
      if (!formData.course_description.trim()) {
        newErrors.course_description = 'La description du cours est obligatoire';
      }
      if (!formData.course_short_description.trim()) {
        newErrors.course_short_description = 'La description courte est obligatoire';
      }
      if (!formData.category_id) {
        newErrors.category_id = 'La catégorie est obligatoire';
      }
      if (!formData.enrollment_deadline) {
        newErrors.enrollment_deadline = 'La date limite d\'inscription est obligatoire';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      setLoading(true);
      let courseData = null;
      
      // Si on doit créer un cours, le créer d'abord
      if (needsCourseCreation) {
        const startDate = new Date(formData.scheduled_start_at);
        const endDate = new Date(formData.scheduled_end_at);
        const enrollmentDeadline = formData.enrollment_deadline ? new Date(formData.enrollment_deadline) : null;
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        
        // Vérifier que les dates sont valides
        if (isNaN(startDate.getTime())) {
          throw new Error('La date de début de session est invalide');
        }
        if (isNaN(endDate.getTime())) {
          throw new Error('La date de fin de session est invalide');
        }
        if (enrollmentDeadline && isNaN(enrollmentDeadline.getTime())) {
          throw new Error('La date limite d\'inscription est invalide');
        }
        
        // Calculer duration_minutes (doit être un entier positif)
        const finalDurationMinutes = durationMinutes > 0 
          ? Math.floor(durationMinutes) 
          : (formData.duration_minutes > 0 ? Math.floor(formData.duration_minutes) : 60);
        
        courseData = {
          title: formData.course_title.trim(),
          description: formData.course_description.trim(),
          short_description: formData.course_short_description.trim(),
          category_id: Number(formData.category_id),
          difficulty: formData.difficulty,
          language: formData.language || 'fr',
          duration_minutes: finalDurationMinutes,
          price: formData.price || 0,
          currency: formData.currency || 'XOF',
          course_type: 'live',
          // Convertir les dates au format ISO complet (avec timezone)
          enrollment_deadline: enrollmentDeadline ? enrollmentDeadline.toISOString() : undefined,
          course_start_date: startDate.toISOString(),
          course_end_date: endDate.toISOString(),
          max_students: formData.max_participants || 50,
          thumbnail_url: thumbnailPreview || undefined,
        };
        
        console.log('📤 [LiveSessionForm] Données du cours préparées:', JSON.stringify(courseData, null, 2));
      }
      
      const submitData: CreateLiveSessionData | UpdateLiveSessionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        scheduled_start_at: new Date(formData.scheduled_start_at).toISOString(),
        scheduled_end_at: new Date(formData.scheduled_end_at).toISOString(),
        max_participants: formData.max_participants,
        is_recording_enabled: formData.is_recording_enabled,
      };
      
      await onSubmit(submitData, courseData);
      toast.success('Succès', session ? 'Session mise à jour' : 'Session et cours créés');
    } catch (err: any) {
      console.error('Erreur soumission formulaire:', err);
      toast.error('Erreur', err.message || 'Impossible de sauvegarder la session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      {needsCourseCreation && (
        <>
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-[#F4A53A]" />
              <h3 className="text-lg font-semibold text-gray-900">Informations du cours</h3>
            </div>
            <p className="text-sm text-gray-600">
              Un cours de type "Live" sera créé automatiquement pour cette session
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du cours *
            </label>
            <input
              type="text"
              value={formData.course_title}
              onChange={e => setFormData({ ...formData, course_title: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
                errors.course_title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Formation en gouvernance"
            />
            {errors.course_title && <p className="mt-1 text-sm text-red-600">{errors.course_title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description courte *
            </label>
            <input
              type="text"
              value={formData.course_short_description}
              onChange={e => setFormData({ ...formData, course_short_description: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
                errors.course_short_description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Description courte du cours"
            />
            {errors.course_short_description && <p className="mt-1 text-sm text-red-600">{errors.course_short_description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture
            </label>
            <div className="space-y-3">
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Aperçu de l'image de couverture"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailPreview('');
                      setThumbnailFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Supprimer l'image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F4A53A] transition-colors">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Aucune image sélectionnée</p>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-700">
                <Upload className="h-4 w-4" />
                {uploadingThumbnail ? 'Upload en cours...' : thumbnailPreview ? 'Remplacer l\'image' : 'Choisir une image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploadingThumbnail}
                  className="hidden"
                />
              </label>
              {uploadingThumbnail && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Upload en cours...</span>
                </div>
              )}
              <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, GIF. Taille max: 5 MB</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description complète *
            </label>
            <textarea
              value={formData.course_description}
              onChange={e => setFormData({ ...formData, course_description: e.target.value })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
                errors.course_description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Description détaillée du cours..."
            />
            {errors.course_description && <p className="mt-1 text-sm text-red-600">{errors.course_description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                disabled={loadingCategories}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                } ${loadingCategories ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingCategories ? (
                  <option value="">Chargement des catégories...</option>
                ) : (
                  <>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name || `Catégorie ${category.id}`}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de difficulté
              </label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white transition-all"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <input
                type="text"
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white transition-all"
                placeholder="fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date limite d'inscription *
              </label>
              <input
                type="datetime-local"
                value={formData.enrollment_deadline}
                onChange={e => setFormData({ ...formData, enrollment_deadline: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
                  errors.enrollment_deadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.enrollment_deadline && <p className="mt-1 text-sm text-red-600">{errors.enrollment_deadline}</p>}
            </div>
          </div>

          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-5 w-5 text-[#F4A53A]" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de la session</h3>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre de la session *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Introduction à la gouvernance"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white transition-all"
          placeholder="Description de la session..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date et heure de début *
          </label>
          <input
            type="datetime-local"
            value={formData.scheduled_start_at}
            onChange={e => setFormData({ ...formData, scheduled_start_at: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
              errors.scheduled_start_at ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduled_start_at && (
            <p className="mt-1 text-sm text-red-600">{errors.scheduled_start_at}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Date et heure de fin *
          </label>
          <input
            type="datetime-local"
            value={formData.scheduled_end_at}
            onChange={e => setFormData({ ...formData, scheduled_end_at: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
              errors.scheduled_end_at ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduled_end_at && (
            <p className="mt-1 text-sm text-red-600">{errors.scheduled_end_at}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Nombre maximum de participants *
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_participants}
            onChange={e => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A53A] focus:border-transparent text-gray-900 bg-white border-gray-300 transition-all ${
              errors.max_participants ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.max_participants && (
            <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
          )}
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_recording_enabled}
              onChange={e => setFormData({ ...formData, is_recording_enabled: e.target.checked })}
              className="w-4 h-4 text-[#F4A53A] border-gray-300 rounded focus:ring-[#F4A53A]"
            />
            <span className="ml-2 text-sm text-gray-700">
              Activer l'enregistrement
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {session ? 'Mettre à jour' : 'Créer la session'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

