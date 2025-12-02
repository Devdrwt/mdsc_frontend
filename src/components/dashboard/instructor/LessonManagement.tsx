'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, X, PlayCircle, Clock, FileText, Video, Upload, Loader, Eye, EyeOff } from 'lucide-react';
import { courseService, Course, Lesson, CreateLessonData, UpdateLessonData } from '../../../lib/services/courseService';
import { moduleService } from '../../../lib/services/moduleService';
import { Module } from '../../../types/course';
import { MediaService } from '../../../lib/services/mediaService';
import toast from '../../../lib/utils/toast';
import ConfirmModal from '../../ui/ConfirmModal';

interface LessonManagementProps {
  courseId: string;
  moduleId?: string | number;
  onLessonCreated?: () => void;
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'text', label: 'Texte/HTML', icon: FileText },
  { value: 'document', label: 'Document PDF', icon: FileText },
  { value: 'audio', label: 'Audio', icon: PlayCircle },
  { value: 'presentation', label: 'Présentation', icon: FileText },
  { value: 'h5p', label: 'Contenu H5P', icon: FileText },
] as const;

export default function LessonManagement({ courseId, moduleId, onLessonCreated }: LessonManagementProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    content_type: string;
    content_url: string;
    content_text: string;
    module_id: number | '';
    duration: number;
    order: number;
    is_required: boolean;
  }>({
    title: '',
    description: '',
    content_type: 'text',
    content_url: '',
    content_text: '',
    module_id: moduleId ? Number(moduleId) : '',
    duration: 0,
    order: 1,
    is_required: true,
  });

  // États pour l'upload de fichier média
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadData();
  }, [courseId]);

  // Si un moduleId est fourni, ouvrir automatiquement le modal de création
  useEffect(() => {
    if (moduleId && modules.length > 0) {
      const moduleIdNum = typeof moduleId === 'string' ? Number(moduleId) : moduleId;
      const moduleExists = modules.some(m => m.id === moduleIdNum);
      if (moduleExists && !showModal) {
        setFormData(prev => ({
          ...prev,
          module_id: moduleIdNum,
        }));
        setShowModal(true);
      }
    }
  }, [moduleId, modules]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les modules et les leçons en parallèle
      const [courseData, modulesData, lessonsData] = await Promise.all([
        courseService.getCourseById(courseId),
        moduleService.getCourseModules(Number(courseId)),
        courseService.getCourseLessons(courseId.toString()),
      ]);
      
      console.log('📦 courseData:', courseData);
      console.log('📦 modulesData:', modulesData);
      console.log('📦 lessonsData:', lessonsData);
      
      // Les leçons sont maintenant récupérées directement via getCourseLessons
      const allLessons = Array.isArray(lessonsData) ? lessonsData : [];
      
      console.log('✅ allLessons:', allLessons);
      
      setLessons(allLessons);
      setModules(modulesData);
      setFormData(prev => ({ ...prev, order: allLessons.length + 1 }));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // En cas d'erreur, charger au moins les modules
      try {
        const modulesData = await moduleService.getCourseModules(Number(courseId));
        setModules(modulesData);
        setLessons([]);
      } catch (err) {
        console.error('Erreur lors du chargement des modules:', err);
        setLessons([]);
        setModules([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      content_type: 'text',
      content_url: '',
      content_text: '',
      module_id: moduleId ? Number(moduleId) : '',
      duration: 0,
      order: lessons.length + 1,
      is_required: true,
    });
    setMediaFile(null);
    setMediaPreview('');
    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const lessonAny = lesson as any;
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type || 'text',
      content_url: lesson.content_url || '',
      content_text: lesson.content_text || lesson.content || '',
      module_id: lessonAny.module_id ? Number(lessonAny.module_id) : (lesson.moduleId ? Number(lesson.moduleId) : ''),
      duration: lessonAny.duration_minutes || lesson.duration || 0,
      order: lessonAny.order_index || lesson.order || 1,
      is_required: lessonAny.is_required ?? lesson.isRequired ?? true,
    });
    setMediaPreview(lesson.content_url || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    
    // Créer une preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires (trim pour éviter les espaces)
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      toast.error('Champ requis', 'Le titre de la leçon est obligatoire');
      return;
    }
    
    try {
      let finalContentUrl = formData.content_url;
      let finalMediaFileId = undefined;

      // Si un fichier média est sélectionné, l'uploader
      if (mediaFile) {
        setUploadingMedia(true);
        try {
          const uploadResult = await MediaService.uploadFile(
            {
              file: mediaFile,
              contentType: formData.content_type as any,
              lessonId: editingLesson?.id?.toString(),
              courseId: courseId,
            },
            (progress) => console.log('Upload progress:', progress)
          );
          
          finalContentUrl = uploadResult.url;
          finalMediaFileId = uploadResult.id;
        } catch (uploadError: any) {
          console.error('Erreur lors de l\'upload:', uploadError);
          toast.error('Erreur upload', uploadError.message || 'Impossible d\'uploader le fichier');
          return;
        } finally {
          setUploadingMedia(false);
        }
      }

      // Validation : le module est requis pour créer une leçon
      const moduleIdValue = formData.module_id;
      if (!moduleIdValue || (typeof moduleIdValue === 'string')) {
        toast.error('Module requis', 'Veuillez sélectionner un module pour cette leçon');
        return;
      }

      // Convertir en nombre si nécessaire
      const moduleId = typeof moduleIdValue === 'number' ? moduleIdValue : Number(moduleIdValue);
      if (isNaN(moduleId) || moduleId <= 0) {
        toast.error('Module invalide', 'Veuillez sélectionner un module valide');
        return;
      }

      const payload: CreateLessonData | UpdateLessonData = {
        title: trimmedTitle,
        description: formData.description.trim(),
        content_type: formData.content_type as any,
        content_url: formData.content_type !== 'text' ? finalContentUrl : undefined,
        content_text: formData.content_type === 'text' ? formData.content_text.trim() : undefined,
        module_id: moduleId,
        media_file_id: finalMediaFileId,
        duration: formData.duration,
        duration_minutes: formData.duration,
        order: formData.order,
        order_index: formData.order,
        is_required: formData.is_required,
        // Les leçons sont automatiquement publiées lors de leur création
        is_published: true,
      };

      if (editingLesson) {
        await courseService.updateLesson(courseId, editingLesson.id, payload);
        toast.success('Leçon mise à jour', 'Les modifications ont été enregistrées');
      } else {
        await courseService.createLesson(courseId, payload as CreateLessonData);
        toast.success('Leçon créée', 'La leçon a été créée avec succès');
      }
      
      await loadData();
      closeModal();
      onLessonCreated?.();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de la leçon:', error);
      toast.error('Erreur', error.message || 'Impossible de sauvegarder la leçon');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteClick = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;

    setDeletingLesson(lessonToDelete);
    try {
      await courseService.deleteLesson(courseId, lessonToDelete);
      toast.success('Leçon supprimée', 'La leçon a été supprimée avec succès');
      await loadData();
      setShowDeleteModal(false);
      setLessonToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la leçon:', error);
      toast.error('Erreur', error.message || 'Impossible de supprimer la leçon');
    } finally {
      setDeletingLesson(null);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const contentType = CONTENT_TYPES.find(ct => ct.value === type);
    const Icon = contentType?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-gold mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des leçons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Leçons ({lessons.length})</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-mdsc-gold text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une leçon</span>
        </button>
      </div>

      {/* Liste des leçons */}
      {lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getContentTypeIcon(lesson.content_type || 'text')}
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Leçon {(lesson as any).order_index || lesson.order}
                      </span>
                      {((lesson as any).is_required ?? lesson.isRequired) && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{(lesson as any).duration_minutes || lesson.duration} min</span>
                      </div>
                      {(lesson as any).module_title && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{(lesson as any).module_title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(lesson.id.toString())}
                    disabled={deletingLesson === lesson.id.toString()}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune leçon</h3>
          <p className="text-gray-500 mb-4">Commencez par ajouter votre première leçon à ce cours.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-mdsc-gold text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une leçon</span>
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-mdsc-gold/10 rounded-lg">
                  <FileText className="h-5 w-5 text-mdsc-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
                  </h3>
                  <p className="text-sm text-gray-600">Remplissez les informations de la leçon</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <form id="lesson-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Titre et Description */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titre de la leçon *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                    placeholder="Ex: Introduction aux bases de données"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors resize-none"
                    placeholder="Description courte de la leçon..."
                  />
                </div>
              </div>

              {/* Configuration de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de contenu *
                  </label>
                  <select
                    required
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                  >
                    {CONTENT_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Module * <span className="text-gray-500 text-xs font-normal">(requis pour organiser le cours)</span>
                  </label>
                  <select
                    value={formData.module_id}
                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                    required
                  >
                    <option value="">-- Sélectionner un module --</option>
                    {modules.length === 0 ? (
                      <option value="" disabled>Aucun module disponible. Créez d'abord un module.</option>
                    ) : (
                      modules.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.title} {m.order_index ? `(Module ${m.order_index})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {modules.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      ⚠️ Vous devez créer au moins un module avant de pouvoir créer des leçons.
                    </p>
                  )}
                </div>
              </div>

              {/* Contenu selon le type */}
              {formData.content_type === 'text' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contenu HTML *
                  </label>
                  <textarea
                    required
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors font-mono text-sm resize-none"
                    placeholder="<div>Contenu HTML de la leçon...</div>"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <Upload className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Contenu média</h4>
                      <p className="text-sm text-gray-600">Téléchargez un fichier ou utilisez une URL</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Upload de fichier */}
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingMedia ? (
                            <>
                              <Loader className="h-12 w-12 text-blue-500 animate-spin" />
                              <p className="mt-4 text-sm font-medium text-gray-700">Upload en cours...</p>
                              <p className="mt-1 text-xs text-gray-500">Veuillez patienter</p>
                            </>
                          ) : mediaFile ? (
                            <>
                              {/* Aperçu visuel selon le type */}
                              {mediaPreview ? (
                                <div className="w-full h-48 overflow-hidden rounded-lg mb-3">
                                  {formData.content_type === 'video' ? (
                                    <video 
                                      src={mediaPreview} 
                                      className="w-full h-full object-cover"
                                      controls={false}
                                    />
                                  ) : formData.content_type === 'audio' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                                      <PlayCircle className="h-20 w-20 text-purple-600" />
                                    </div>
                                  ) : mediaFile.type.startsWith('image/') ? (
                                    <img 
                                      src={mediaPreview} 
                                      alt={mediaFile.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                                      <FileText className="h-20 w-20 text-blue-600" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 bg-blue-100 rounded-full mb-3">
                                  <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                              )}
                              
                              {/* Info fichier */}
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900 truncate px-2">
                                  {mediaFile.name}
                                </p>
                                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                                  <span>📏 {(mediaFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {formData.content_type}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMediaFile(null);
                                    setMediaPreview('');
                                  }}
                                  className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 mx-auto"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Retirer ce fichier</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-3 bg-blue-100 rounded-full">
                                <Upload className="h-10 w-10 text-blue-600" />
                              </div>
                              <p className="mt-4 text-sm font-medium text-gray-900">
                                Cliquez pour télécharger
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                ou glissez-déposez votre fichier ici
                              </p>
                              <p className="mt-2 text-xs text-gray-400 font-medium">
                                {formData.content_type === 'video' && 'Formats: MP4, MOV, AVI'}
                                {formData.content_type === 'audio' && 'Formats: MP3, WAV, OGG'}
                                {formData.content_type === 'document' && 'Formats: PDF, DOC, DOCX'}
                                {formData.content_type === 'presentation' && 'Formats: PPT, PPTX'}
                                {formData.content_type === 'h5p' && 'Formats: H5P'}
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleMediaFileSelect}
                          accept={
                            formData.content_type === 'video' ? 'video/*' :
                            formData.content_type === 'audio' ? 'audio/*' :
                            formData.content_type === 'document' ? '.pdf,.doc,.docx' :
                            formData.content_type === 'presentation' ? '.ppt,.pptx' :
                            formData.content_type === 'h5p' ? '.h5p' :
                            '*/*'
                          }
                        />
                      </label>
                    </div>

                    {/* OU URL */}
                    {!mediaFile && (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-blue-50 text-gray-700 font-medium">
                              OU
                            </span>
                          </div>
                        </div>
                        
                        {/* URL du contenu */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL du contenu
                          </label>
                          <input
                            type="url"
                            value={formData.content_url}
                            onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                            placeholder="https://..."
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            Saisissez l'URL si le fichier est hébergé ailleurs (YouTube, Vimeo, Dropbox, etc.)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Aperçu du contenu */}
              {(formData.title || formData.description || formData.content_text || mediaPreview || formData.content_url) && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-200/50 rounded-lg">
                      <Eye className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Aperçu de la leçon</h4>
                      <p className="text-sm text-gray-600">Voir comment la leçon apparaîtra aux étudiants</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-sm">
                    {formData.title && (
                      <div>
                        <h5 className="font-bold text-xl text-gray-900 mb-2">{formData.title}</h5>
                      </div>
                    )}
                    {formData.description && (
                      <div>
                        <p className="text-gray-700 leading-relaxed">{formData.description}</p>
                      </div>
                    )}
                    {formData.content_type === 'text' && formData.content_text && (
                      <div className="prose max-w-none">
                        <div 
                          className="text-gray-700 border border-gray-200 rounded-lg p-4 bg-gray-50"
                          dangerouslySetInnerHTML={{ __html: formData.content_text }}
                        />
                      </div>
                    )}
                    {(mediaPreview || formData.content_url) && formData.content_type !== 'text' && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {formData.content_type === 'video' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-900">
                              <Video className="h-6 w-6 text-blue-600" />
                              <span className="font-medium">Contenu vidéo</span>
                            </div>
                            {mediaFile && (
                              <p className="text-sm text-gray-600">
                                📁 {mediaFile.name} • {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            {formData.content_url && (
                              <p className="text-sm text-blue-600 truncate">
                                🔗 {formData.content_url}
                              </p>
                            )}
                          </div>
                        )}
                        {formData.content_type === 'document' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-900">
                              <FileText className="h-6 w-6 text-red-600" />
                              <span className="font-medium">Document PDF</span>
                            </div>
                            {mediaFile && (
                              <p className="text-sm text-gray-600">
                                📁 {mediaFile.name} • {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            {formData.content_url && (
                              <p className="text-sm text-blue-600 truncate">
                                🔗 {formData.content_url}
                              </p>
                            )}
                          </div>
                        )}
                        {formData.content_type === 'audio' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-900">
                              <PlayCircle className="h-6 w-6 text-purple-600" />
                              <span className="font-medium">Contenu audio</span>
                            </div>
                            {mediaFile && (
                              <p className="text-sm text-gray-600">
                                📁 {mediaFile.name} • {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            {formData.content_url && (
                              <p className="text-sm text-blue-600 truncate">
                                🔗 {formData.content_url}
                              </p>
                            )}
                          </div>
                        )}
                        {['presentation', 'h5p'].includes(formData.content_type) && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-900">
                              <FileText className="h-6 w-6 text-orange-600" />
                              <span className="font-medium capitalize">{formData.content_type}</span>
                            </div>
                            {mediaFile && (
                              <p className="text-sm text-gray-600">
                                📁 {mediaFile.name} • {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                            {formData.content_url && (
                              <p className="text-sm text-blue-600 truncate">
                                🔗 {formData.content_url}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{formData.duration || 0} min</span>
                      </div>
                      {formData.is_required && (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Obligatoire
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Durée et ordre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ordre dans le cours *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="bg-amber-50/50 rounded-xl p-6 border border-amber-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Options d'affichage</h4>
                    <p className="text-sm text-gray-600">Contrôlez l'accès et la visibilité</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex items-center space-x-3 p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-mdsc-gold transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_required}
                      onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                      className="rounded border-gray-300 text-mdsc-gold focus:ring-mdsc-gold h-5 w-5"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Leçon obligatoire</div>
                      <div className="text-sm text-gray-500">Les étudiants doivent la compléter</div>
                    </div>
                  </label>
                </div>
              </div>
            </form>

            {/* Footer avec boutons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="lesson-form"
                disabled={uploadingMedia}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-mdsc-gold to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
              >
                {uploadingMedia ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>{uploadingMedia ? 'Upload...' : editingLesson ? 'Enregistrer' : 'Créer la leçon'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLessonToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible."
        confirmText="Supprimer"
        isLoading={deletingLesson !== null}
      />
    </div>
  );
}