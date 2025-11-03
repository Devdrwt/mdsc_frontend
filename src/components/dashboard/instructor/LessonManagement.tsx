'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, X, PlayCircle, Clock, FileText, Video, Upload, Loader, Eye, EyeOff } from 'lucide-react';
import { courseService, Course, Lesson, CreateLessonData, UpdateLessonData } from '../../../lib/services/courseService';
import { moduleService } from '../../../lib/services/moduleService';
import { Module } from '../../../types/course';
import { MediaService } from '../../../lib/services/mediaService';
import toast from '../../../lib/utils/toast';

interface LessonManagementProps {
  courseId: string;
  moduleId?: string | number;
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'text', label: 'Texte/HTML', icon: FileText },
  { value: 'document', label: 'Document PDF', icon: FileText },
  { value: 'audio', label: 'Audio', icon: PlayCircle },
  { value: 'presentation', label: 'Présentation', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: FileText },
  { value: 'h5p', label: 'Contenu H5P', icon: FileText },
  { value: 'assignment', label: 'Devoir', icon: FileText },
] as const;

export default function LessonManagement({ courseId, moduleId }: LessonManagementProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
  
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
    is_published: boolean;
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
    is_published: false,
  });

  // États pour l'upload de fichier média
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsData, modulesData] = await Promise.all([
        courseService.getCourseLessons(courseId),
        moduleService.getCourseModules(Number(courseId)),
      ]);
      setLessons(lessonsData);
      setModules(modulesData);
      setFormData(prev => ({ ...prev, order: lessonsData.length + 1 }));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
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
      is_published: false,
    });
    setMediaFile(null);
    setMediaPreview('');
    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type || 'text',
      content_url: lesson.content_url || '',
      content_text: lesson.content_text || lesson.content || '',
      module_id: lesson.module_id ? Number(lesson.module_id) : '',
      duration: lesson.duration_minutes || lesson.duration || 0,
      order: lesson.order_index || lesson.order || 1,
      is_required: lesson.is_required ?? true,
      is_published: lesson.is_published ?? false,
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

      const payload: CreateLessonData | UpdateLessonData = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type as any,
        content_url: formData.content_type !== 'text' ? finalContentUrl : undefined,
        content_text: formData.content_type === 'text' ? formData.content_text : undefined,
        module_id: formData.module_id || undefined,
        media_file_id: finalMediaFileId,
        duration: formData.duration,
        duration_minutes: formData.duration,
        order: formData.order,
        order_index: formData.order,
        is_required: formData.is_required,
        is_published: formData.is_published,
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
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de la leçon:', error);
      toast.error('Erreur', error.message || 'Impossible de sauvegarder la leçon');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) return;

    setDeletingLesson(lessonId);
    try {
      await courseService.deleteLesson(lessonId);
      toast.success('Leçon supprimée', 'La leçon a été supprimée avec succès');
      await loadData();
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
                        Leçon {lesson.order_index || lesson.order}
                      </span>
                      {lesson.is_published ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          Publié
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Brouillon
                        </span>
                      )}
                      {lesson.is_required && (
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
                        <span>{lesson.duration_minutes || lesson.duration} min</span>
                      </div>
                      {lesson.module_title && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{lesson.module_title}</span>
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
                    onClick={() => handleDelete(lesson.id.toString())}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  placeholder="Titre de la leçon"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  placeholder="Description courte de la leçon"
                />
              </div>

              {/* Type de contenu et Module */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de contenu *
                  </label>
                  <select
                    required
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  >
                    {CONTENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module (optionnel)
                  </label>
                  <select
                    value={formData.module_id}
                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  >
                    <option value="">Aucun module (leçon directe)</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contenu selon le type */}
              {formData.content_type === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu HTML *
                  </label>
                  <textarea
                    required
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                    placeholder="Contenu HTML de la leçon"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* URL ou Upload de fichier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fichier média
                    </label>
                    <div className="space-y-3">
                      {/* Upload de fichier */}
                      <div>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingMedia ? (
                              <Loader className="h-8 w-8 text-gray-400 animate-spin" />
                            ) : mediaFile ? (
                              <FileText className="h-8 w-8 text-gray-400" />
                            ) : (
                              <Upload className="h-8 w-8 text-gray-400" />
                            )}
                            {uploadingMedia ? (
                              <p className="mt-2 text-sm text-gray-500">Upload en cours...</p>
                            ) : mediaFile ? (
                              <p className="mt-2 text-sm text-gray-500">{mediaFile.name}</p>
                            ) : (
                              <p className="mt-2 text-sm text-gray-500">
                                <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                              </p>
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
                              '*/*'
                            }
                          />
                        </label>
                      </div>

                      {/* OU URL */}
                      <div className="text-center text-sm text-gray-500">OU</div>
                      
                      {/* URL du contenu */}
                      <div>
                        <input
                          type="url"
                          value={formData.content_url}
                          onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                          placeholder="https://..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Saisissez l'URL si le fichier est hébergé ailleurs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aperçu du contenu */}
              {(formData.title || formData.description || formData.content_text || mediaPreview || formData.content_url) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    {formData.title && (
                      <div>
                        <h5 className="font-semibold text-lg text-gray-900">{formData.title}</h5>
                      </div>
                    )}
                    {formData.description && (
                      <div>
                        <p className="text-sm text-gray-600">{formData.description}</p>
                      </div>
                    )}
                    {formData.content_type === 'text' && formData.content_text && (
                      <div className="prose max-w-none">
                        <div 
                          className="text-sm text-gray-700 border border-gray-200 rounded p-3 bg-white"
                          dangerouslySetInnerHTML={{ __html: formData.content_text }}
                        />
                      </div>
                    )}
                    {(mediaPreview || formData.content_url) && formData.content_type !== 'text' && (
                      <div className="border border-gray-200 rounded p-3 bg-white">
                        {formData.content_type === 'video' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Video className="h-5 w-5 text-blue-600" />
                              <span>Contenu vidéo</span>
                            </div>
                            {mediaFile && (
                              <p className="text-xs text-gray-500">Fichier: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            )}
                            {formData.content_url && (
                              <p className="text-xs text-blue-600 truncate">{formData.content_url}</p>
                            )}
                          </div>
                        )}
                        {formData.content_type === 'document' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FileText className="h-5 w-5 text-red-600" />
                              <span>Document PDF</span>
                            </div>
                            {mediaFile && (
                              <p className="text-xs text-gray-500">Fichier: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            )}
                            {formData.content_url && (
                              <p className="text-xs text-blue-600 truncate">{formData.content_url}</p>
                            )}
                          </div>
                        )}
                        {formData.content_type === 'audio' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <PlayCircle className="h-5 w-5 text-purple-600" />
                              <span>Contenu audio</span>
                            </div>
                            {mediaFile && (
                              <p className="text-xs text-gray-500">Fichier: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            )}
                            {formData.content_url && (
                              <p className="text-xs text-blue-600 truncate">{formData.content_url}</p>
                            )}
                          </div>
                        )}
                        {['presentation', 'quiz', 'h5p', 'assignment'].includes(formData.content_type) && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <span className="capitalize">{formData.content_type}</span>
                            </div>
                            {mediaFile && (
                              <p className="text-xs text-gray-500">Fichier: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            )}
                            {formData.content_url && (
                              <p className="text-xs text-blue-600 truncate">{formData.content_url}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formData.duration} min</span>
                      </div>
                      {formData.is_required && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Obligatoire</span>
                      )}
                      {formData.is_published && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Publié</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Durée, Ordre et Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_required}
                        onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                        className="rounded border-gray-300 text-mdsc-gold focus:ring-mdsc-gold"
                      />
                      <span className="text-sm text-gray-700">Obligatoire</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="rounded border-gray-300 text-mdsc-gold focus:ring-mdsc-gold"
                      />
                      <span className="text-sm text-gray-700">Publié</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadingMedia}
                  className="flex items-center space-x-2 px-4 py-2 bg-mdsc-gold text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {uploadingMedia ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{editingLesson ? 'Enregistrer' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}