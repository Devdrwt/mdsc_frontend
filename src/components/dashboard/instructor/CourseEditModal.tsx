'use client';

import React, { useState, useEffect } from 'react';
import { Course } from '../../../lib/services/courseService';
import { FileService } from '../../../lib/services/fileService';
import { Save, X, Upload, Image as ImageIcon, Video, Loader } from 'lucide-react';
import toast from '../../../lib/utils/toast';

interface CourseEditModalProps {
  course: Course | null;
  categories: Array<{ id: number; name: string; color: string; icon: string }>;
  availableCourses: Array<{ id: number; title: string }>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  updating: boolean;
}

export default function CourseEditModal({
  course,
  categories,
  availableCourses,
  onSave,
  onCancel,
  updating,
}: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category_id: '',
    difficulty: 'beginner',
    duration_minutes: 0,
    price: 0,
    currency: 'XOF',
    language: 'fr',
    course_type: 'on_demand' as 'live' | 'on_demand',
    max_students: 0,
    prerequisite_course_id: '',
    enrollment_deadline: '',
    course_start_date: '',
    course_end_date: '',
    thumbnail_url: '',
    video_url: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (course) {
      const courseAny = course as any;
      
      // Formater les dates pour les inputs datetime-local
      const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          // Convertir en format YYYY-MM-DDTHH:mm pour datetime-local
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      };

      setFormData({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || courseAny.short_description || '',
        category_id: typeof course.category === 'object' && course.category
          ? (course.category as any)?.id?.toString() || ''
          : '',
        difficulty: course.level || courseAny.difficulty || 'beginner',
        duration_minutes: courseAny.duration_minutes || course.duration || 0,
        price: courseAny.price || course.price || 0,
        currency: courseAny.currency || 'XOF',
        language: courseAny.language || 'fr',
        course_type: courseAny.course_type || courseAny.courseType || 'on_demand',
        max_students: courseAny.max_students || courseAny.maxStudents || 0,
        prerequisite_course_id: courseAny.prerequisite_course_id?.toString() || courseAny.prerequisiteCourseId?.toString() || '',
        enrollment_deadline: formatDateForInput(courseAny.enrollment_deadline || courseAny.enrollmentDeadline),
        course_start_date: formatDateForInput(courseAny.course_start_date || courseAny.courseStartDate),
        course_end_date: formatDateForInput(courseAny.course_end_date || courseAny.courseEndDate),
        thumbnail_url: courseAny.thumbnail_url || course.thumbnail || courseAny.thumbnailUrl || '',
        video_url: courseAny.video_url || courseAny.videoUrl || '',
      });

      // Prévisualiser l'image si elle existe
      const thumbnailUrl = courseAny.thumbnail_url || course.thumbnail || courseAny.thumbnailUrl || '';
      if (thumbnailUrl) {
        setThumbnailPreview(thumbnailUrl);
      }
    }
  }, [course]);

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
        setFormData({ ...formData, thumbnail_url: photoUrl });
        toast.success('Image uploadée', 'Votre image de couverture a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une vidéo');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'La vidéo ne doit pas dépasser 100 MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const uploaded = await FileService.uploadFile(file, { category: 'course_intro_video' });
      const videoUrl = uploaded.url || (uploaded as any).storage_path;
      if (videoUrl) {
        setVideoFile(file);
        setFormData({ ...formData, video_url: videoUrl });
        toast.success('Vidéo uploadée', 'Votre vidéo a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de la vidéo');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    // Validation des champs obligatoires (trim pour éviter les espaces)
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      toast.error('Champ requis', 'Le titre du cours est obligatoire');
      return;
    }

    // Nettoyer les champs vides optionnels avant l'envoi
    const updateData: any = {
      title: trimmedTitle,
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim(),
      difficulty: formData.difficulty,
      duration_minutes: formData.duration_minutes || undefined,
      price: formData.price || 0,
      currency: formData.currency,
      language: formData.language,
      course_type: formData.course_type,
      prerequisite_course_id: formData.prerequisite_course_id || undefined,
      enrollment_deadline: formData.enrollment_deadline || undefined,
      course_start_date: formData.course_start_date || undefined,
      course_end_date: formData.course_end_date || undefined,
      max_students: formData.course_type === 'live' ? (formData.max_students || undefined) : undefined,
    };

    // Ajouter la catégorie si elle est sélectionnée
    if (formData.category_id) {
      updateData.category_id = parseInt(formData.category_id);
    }

    // Ajouter l'image si elle a été uploadée
    if (formData.thumbnail_url) {
      updateData.thumbnail_url = formData.thumbnail_url;
    }

    // Ajouter la vidéo si elle a été uploadée
    if (formData.video_url) {
      updateData.video_url = formData.video_url;
    }

    await onSave(updateData);
  };

  if (!course) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du cours <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
          required
        />
      </div>

      {/* Description courte */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description courte
        </label>
        <textarea
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary resize-none"
        />
      </div>

      {/* Description complète */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description complète
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary resize-none"
        />
      </div>

      {/* Catégorie et Niveau */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau de difficulté
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
          >
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
        </div>
      </div>

      {/* Configuration du cours */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration du cours</h3>
        
        {/* Durée et Prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée (en minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (FCFA)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              min="0"
            />
          </div>
        </div>

        {/* Image de couverture */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image de couverture
          </label>
          {thumbnailPreview ? (
            <div className="relative mb-2">
              <img
                src={thumbnailPreview}
                alt="Aperçu"
                className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
              />
              {uploadingThumbnail && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <Loader className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune image sélectionnée</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="hidden"
            id="thumbnail-upload-edit"
          />
          <label
            htmlFor="thumbnail-upload-edit"
            className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors cursor-pointer mt-2"
          >
            <Upload className="h-5 w-5 mr-2" />
            {thumbnailPreview ? 'Changer l\'image' : 'Uploader une image'}
          </label>
          <p className="text-xs text-gray-500 mt-1">Formats acceptés : JPG, PNG (Max 5 MB)</p>
        </div>

        {/* Vidéo introductive */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vidéo introductive (optionnel)
          </label>
          {videoFile ? (
            <div className="border border-gray-300 rounded-lg p-4 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="h-8 w-8 text-mdsc-blue-primary" />
                  <div>
                    <p className="font-medium text-gray-900">{videoFile.name}</p>
                    <p className="text-xs text-gray-600">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {uploadingVideo && (
                  <Loader className="h-6 w-6 text-mdsc-blue-primary animate-spin" />
                )}
              </div>
            </div>
          ) : formData.video_url ? (
            <div className="border border-gray-300 rounded-lg p-4 mb-2">
              <div className="flex items-center space-x-3">
                <Video className="h-8 w-8 text-mdsc-blue-primary" />
                <div>
                  <p className="font-medium text-gray-900">Vidéo existante</p>
                  <p className="text-xs text-gray-600">Vidéo déjà uploadée</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune vidéo sélectionnée</p>
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
            id="video-upload-edit"
          />
          <label
            htmlFor="video-upload-edit"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer mt-2"
          >
            <Upload className="h-5 w-5 mr-2" />
            {videoFile || formData.video_url ? 'Changer la vidéo' : 'Uploader une vidéo'}
          </label>
          <p className="text-xs text-gray-500 mt-1">Formats acceptés : MP4, AVI, MOV (Max 100 MB)</p>
        </div>

        {/* Langue */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Langue du cours
          </label>
          <input
            type="text"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
            placeholder="fr"
          />
        </div>

        {/* Type de cours */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de cours <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.course_type}
            onChange={(e) => setFormData({ ...formData, course_type: e.target.value as 'live' | 'on_demand' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
          >
            <option value="on_demand">Cours à la demande (On-demand)</option>
            <option value="live">Cours en Live (en direct)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {formData.course_type === 'live' 
              ? '⚠️ Les dates et le nombre maximum d\'étudiants sont obligatoires pour les cours en Live'
              : 'Les dates sont optionnelles pour les cours à la demande'
            }
          </p>
        </div>

        {/* Nombre maximum d'étudiants (conditionnel pour Live) */}
        {formData.course_type === 'live' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre maximum d'étudiants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              placeholder="Ex: 50"
              required={formData.course_type === 'live'}
            />
          </div>
        )}
      </div>

      {/* Dates et prérequis */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dates et prérequis
          {formData.course_type === 'live' && <span className="text-red-500 ml-1">*</span>}
        </h3>

        {/* Cours prérequis */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cours prérequis
          </label>
          <select
            value={formData.prerequisite_course_id}
            onChange={(e) => setFormData({ ...formData, prerequisite_course_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
          >
            <option value="">Aucun cours prérequis</option>
            {availableCourses.filter(c => c.id.toString() !== course?.id?.toString()).map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date limite d'inscription
              {formData.course_type === 'live' && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="datetime-local"
              value={formData.enrollment_deadline}
              onChange={(e) => setFormData({ ...formData, enrollment_deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              required={formData.course_type === 'live'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début du cours
              {formData.course_type === 'live' && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="datetime-local"
              value={formData.course_start_date}
              onChange={(e) => setFormData({ ...formData, course_start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              required={formData.course_type === 'live'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin du cours
              {formData.course_type === 'live' && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="datetime-local"
              value={formData.course_end_date}
              onChange={(e) => setFormData({ ...formData, course_end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-mdsc-blue-primary"
              required={formData.course_type === 'live'}
            />
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={updating}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={updating}
          className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Enregistrer</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

