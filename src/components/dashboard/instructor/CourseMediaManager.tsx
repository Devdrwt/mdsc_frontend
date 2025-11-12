'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  File,
  Presentation,
  Play,
  Download,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ChevronRight,
  Upload,
  Loader,
  FileVideo,
  FileAudio,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import { mediaService } from '../../../lib/services/mediaService';
import { MediaFile } from '../../../types/course';
import MediaUpload from '../../media/MediaUpload';
import toast from '../../../lib/utils/toast';
import Modal from '../../ui/Modal';
import { resolveMediaUrl } from '../../../lib/utils/media';

interface CourseMediaManagerProps {
  courseId: string | number;
  modules: Array<{
    id: number;
    title: string;
    lessons?: Array<{
      id: number;
      title: string;
      content_type: string;
    }>;
  }>;
  onMediaUpdated?: () => void;
}

interface GroupedMedia {
  moduleId: number;
  moduleTitle: string;
  lessons: Array<{
    lessonId: number;
    lessonTitle: string;
    media: MediaFile[];
  }>;
  courseMedia: MediaFile[]; // Médias au niveau du cours (sans leçon)
}

export default function CourseMediaManager({
  courseId,
  modules,
  onMediaUpdated,
}: CourseMediaManagerProps) {
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [groupedMedia, setGroupedMedia] = useState<GroupedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [uploadingToLesson, setUploadingToLesson] = useState<{ moduleId: number; lessonId: number } | null>(null);

  useEffect(() => {
    loadMedia();
  }, [courseId]);

  useEffect(() => {
    organizeMedia();
  }, [allMedia, modules]);


  const loadMedia = async () => {
    try {
      setLoading(true);
      const media = await mediaService.getCourseMedia(String(courseId));
      setAllMedia(media || []);
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
      toast.error('Erreur', 'Impossible de charger les médias');
      setAllMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const organizeMedia = () => {
    const grouped: GroupedMedia[] = modules.map((module) => {
      const moduleMedia: GroupedMedia = {
        moduleId: module.id,
        moduleTitle: module.title,
        lessons: [],
        courseMedia: [],
      };

      // Organiser les médias par leçon
      if (module.lessons && module.lessons.length > 0) {
        module.lessons.forEach((lesson) => {
          const lessonMedia = allMedia.filter(
            (m) => m.lesson_id === lesson.id || m.lessonId === lesson.id
          );
          if (lessonMedia.length > 0) {
            moduleMedia.lessons.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              media: lessonMedia,
            });
          }
        });
      }

      // Médias au niveau du cours (sans leçon spécifique)
      const courseLevelMedia = allMedia.filter(
        (m) =>
          (m.course_id === Number(courseId) || m.courseId === Number(courseId)) &&
          !m.lesson_id &&
          !m.lessonId
      );
      moduleMedia.courseMedia = courseLevelMedia;

      return moduleMedia;
    });

    // Médias orphelins (sans module/leçon)
    const orphanMedia = allMedia.filter(
      (m) =>
        !modules.some((mod) =>
          mod.lessons?.some((l) => l.id === (m.lesson_id || m.lessonId))
        ) &&
        !modules.some((mod) => mod.id === (m.course_id || m.courseId))
    );

    if (orphanMedia.length > 0) {
      grouped.push({
        moduleId: 0,
        moduleTitle: 'Médias généraux',
        lessons: [],
        courseMedia: orphanMedia,
      });
    }

    setGroupedMedia(grouped);
  };

  const getMediaIcon = (fileCategory: string) => {
    const category = (fileCategory || '').toLowerCase();
    switch (category) {
      case 'video':
        return <FileVideo className="h-6 w-6 text-red-500" />;
      case 'audio':
        return <FileAudio className="h-6 w-6 text-purple-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'document':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'presentation':
        return <Presentation className="h-6 w-6 text-yellow-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getMediaTypeLabel = (fileCategory: string) => {
    const category = fileCategory?.toLowerCase() || '';
    const labels: Record<string, string> = {
      video: 'Vidéo',
      audio: 'Audio',
      image: 'Image',
      document: 'Document',
      presentation: 'Présentation',
      h5p: 'H5P',
      other: 'Autre',
    };
    return labels[category] || 'Fichier';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePreview = (media: MediaFile) => {
    setSelectedMedia(media);
    setShowPreviewModal(true);
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) return;

    try {
      setDeletingMediaId(mediaId);
      await mediaService.deleteMediaFile(mediaId.toString());
      setAllMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success('Média supprimé', 'Le média a été supprimé avec succès');
      onMediaUpdated?.();
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Impossible de supprimer le média');
    } finally {
      setDeletingMediaId(null);
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleLesson = (moduleId: number, lessonId: number) => {
    const key = `${moduleId}-${lessonId}`;
    setExpandedLessons((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderMediaPreview = (media: MediaFile) => {
    const category = (media.file_category || media.fileCategory || '').toLowerCase();
    const rawMediaUrl = media.url || '';
    const rawThumbnailUrl = media.thumbnail_url || media.thumbnailUrl || '';
    // Résoudre les URLs pour pointer vers le bon serveur
    const mediaUrl = resolveMediaUrl(rawMediaUrl) || rawMediaUrl;
    const thumbnailUrl = resolveMediaUrl(rawThumbnailUrl) || rawThumbnailUrl;
    const originalFilename = media.original_filename || media.originalFilename || media.filename || '';

    if (category === 'image' && mediaUrl) {
      return (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden group">
            <img
              src={mediaUrl}
              alt={originalFilename}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>
      );
    }

    if (category === 'video' && mediaUrl) {
      return (
        <div className="relative w-full h-32 bg-gray-900 rounded-lg overflow-hidden group">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={originalFilename}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-12 w-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3 group-hover:bg-black/70 transition-colors cursor-pointer">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Pour les autres types, afficher une icône avec un fond coloré
    return (
      <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group">
        {getMediaIcon(media.file_category || media.fileCategory || 'other')}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
      </div>
    );
  };

  const renderMediaCard = (media: MediaFile, showLessonContext = false, lessonTitle?: string) => {
    const isDeleting = deletingMediaId === media.id;
    const category = (media.file_category || media.fileCategory || '').toLowerCase();
    const originalFilename = media.original_filename || media.originalFilename || media.filename || '';
    const fileSize = media.file_size || media.fileSize || 0;
    // Résoudre l'URL du média pour pointer vers le bon serveur
    const mediaUrl = resolveMediaUrl(media.url) || media.url || '';

    return (
      <div
        key={media.id}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
      >
        {/* Aperçu du média */}
        <div
          className="cursor-pointer"
          onClick={() => handlePreview(media)}
        >
          {renderMediaPreview(media)}
        </div>

        {/* Informations du média */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate" title={originalFilename}>
                {originalFilename}
              </h4>
              {showLessonContext && lessonTitle && (
                <p className="text-xs text-gray-500 mt-1">Leçon: {lessonTitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {getMediaTypeLabel(media.file_category || media.fileCategory || 'other')}
            </span>
            <span>{formatFileSize(fileSize)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => handlePreview(media)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </button>
            {mediaUrl && (
              <a
                href={mediaUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(media.id);
              }}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 text-mdsc-blue-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Gestion des Médias</h2>
            <p className="text-white/80">
              {allMedia.length} média{allMedia.length > 1 ? 'x' : ''} au total
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold">{allMedia.length}</div>
              <div className="text-sm text-white/80">Fichiers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section d'upload rapide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un média au cours</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MediaUpload
            contentType="document"
            courseId={String(courseId)}
            onUploadSuccess={(media) => {
              setAllMedia((prev) => [...prev, media]);
              toast.success('Média ajouté', 'Le document a été uploadé avec succès');
              onMediaUpdated?.();
            }}
          />
          <MediaUpload
            contentType="image"
            courseId={String(courseId)}
            onUploadSuccess={(media) => {
              setAllMedia((prev) => [...prev, media]);
              toast.success('Média ajouté', 'L\'image a été uploadée avec succès');
              onMediaUpdated?.();
            }}
          />
          <MediaUpload
            contentType="video"
            courseId={String(courseId)}
            onUploadSuccess={(media) => {
              setAllMedia((prev) => [...prev, media]);
              toast.success('Média ajouté', 'La vidéo a été uploadée avec succès');
              onMediaUpdated?.();
            }}
          />
        </div>
      </div>

      {/* Liste organisée par module et leçon */}
      <div className="space-y-4">
        {groupedMedia.map((group) => {
          const isExpanded = expandedModules[group.moduleId] ?? true;
          const hasContent = group.lessons.length > 0 || group.courseMedia.length > 0;

          if (!hasContent) return null;

          return (
            <div key={group.moduleId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* En-tête du module */}
              <button
                onClick={() => toggleModule(group.moduleId)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{group.moduleTitle}</h3>
                  <span className="text-sm text-gray-500">
                    ({group.lessons.reduce((sum, l) => sum + l.media.length, 0) + group.courseMedia.length} média
                    {group.lessons.reduce((sum, l) => sum + l.media.length, 0) + group.courseMedia.length > 1 ? 'x' : ''})
                  </span>
                </div>
              </button>

              {/* Contenu du module */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Médias au niveau du cours */}
                  {group.courseMedia.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Médias du cours</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.courseMedia.map((media) => renderMediaCard(media))}
                      </div>
                    </div>
                  )}

                  {/* Médias par leçon */}
                  {group.lessons.map((lesson) => {
                    const lessonKey = `${group.moduleId}-${lesson.lessonId}`;
                    const isLessonExpanded = expandedLessons[lessonKey] ?? true;

                    return (
                      <div key={lesson.lessonId} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleLesson(group.moduleId, lesson.lessonId)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isLessonExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-700">{lesson.lessonTitle}</span>
                            <span className="text-xs text-gray-500">({lesson.media.length} média{lesson.media.length > 1 ? 'x' : ''})</span>
                          </div>
                        </button>

                        {isLessonExpanded && (
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                              {lesson.media.map((media) => renderMediaCard(media, true, lesson.lessonTitle))}
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                              <MediaUpload
                                contentType="video"
                                lessonId={String(lesson.lessonId)}
                                courseId={String(courseId)}
                                onUploadSuccess={(media) => {
                                  setAllMedia((prev) => [...prev, media]);
                                  toast.success('Média ajouté', 'Le média a été ajouté à la leçon');
                                  onMediaUpdated?.();
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal d'aperçu */}
      {showPreviewModal && selectedMedia && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedMedia(null);
          }}
          title={selectedMedia.original_filename || selectedMedia.originalFilename || selectedMedia.filename || 'Média'}
          size="xl"
        >
          <div className="space-y-4">
            {(() => {
              const category = (selectedMedia.file_category || selectedMedia.fileCategory || '').toLowerCase();
              const rawMediaUrl = selectedMedia.url || '';
              // Résoudre l'URL pour pointer vers le bon serveur
              const resolvedMediaUrl = resolveMediaUrl(rawMediaUrl) || rawMediaUrl;
              const originalFilename = selectedMedia.original_filename || selectedMedia.originalFilename || selectedMedia.filename || '';
              
              if (category === 'image' && resolvedMediaUrl) {
                return (
                  <div className="w-full rounded-lg overflow-hidden">
                    <img
                      src={resolvedMediaUrl}
                      alt={originalFilename}
                      className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                      onError={(e) => {
                        console.error('Erreur de chargement de l\'image:', resolvedMediaUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                );
              }

              if (category === 'video' && resolvedMediaUrl) {
                return (
                  <div className="w-full rounded-lg overflow-hidden bg-black">
                    <video
                      src={resolvedMediaUrl}
                      controls
                      className="w-full h-auto max-h-[60vh] mx-auto"
                      onError={(e) => {
                        console.error('Erreur de chargement de la vidéo:', resolvedMediaUrl);
                      }}
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                );
              }

              if (category === 'audio' && resolvedMediaUrl) {
                return (
                  <div className="w-full rounded-lg overflow-hidden bg-gray-100 p-8">
                    <audio 
                      src={resolvedMediaUrl} 
                      controls 
                      className="w-full"
                      onError={(e) => {
                        console.error('Erreur de chargement de l\'audio:', resolvedMediaUrl);
                      }}
                    >
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  </div>
                );
              }

              if ((category === 'document' || category === 'presentation') && resolvedMediaUrl) {
                // Pour les PDF et présentations, utiliser l'URL directe
                // Les navigateurs modernes peuvent afficher les PDF directement
                const isPdf = rawMediaUrl.toLowerCase().endsWith('.pdf') || resolvedMediaUrl.toLowerCase().includes('.pdf');
                
                if (isPdf) {
                  // Pour les PDF, utiliser l'URL directe - les navigateurs modernes peuvent les afficher
                  return (
                    <div className="w-full h-[60vh] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative">
                      <iframe
                        src={resolvedMediaUrl}
                        type="application/pdf"
                        className="w-full h-full"
                        title={originalFilename}
                        onError={() => {
                          console.error('Erreur de chargement du PDF:', resolvedMediaUrl);
                        }}
                      />
                      <div className="absolute bottom-4 right-4 z-10">
                        <a
                          href={resolvedMediaUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-mdsc-blue-primary hover:bg-mdsc-blue-dark rounded-lg transition-colors shadow-lg"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger le PDF
                        </a>
                      </div>
                    </div>
                  );
                }
                
                // Pour les autres documents (Word, Excel, etc.), afficher un message avec lien de téléchargement
                return (
                  <div className="w-full h-[60vh] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <div className="text-center p-8">
                      {getMediaIcon(selectedMedia.file_category || selectedMedia.fileCategory || 'document')}
                      <p className="text-lg font-medium text-gray-900 mt-4 mb-2">Aperçu non disponible</p>
                      <p className="text-sm text-gray-600 mb-6">
                        Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
                      </p>
                      <a
                        href={resolvedMediaUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-mdsc-blue-primary hover:bg-mdsc-blue-dark rounded-lg transition-colors shadow-lg"
                      >
                        <Download className="h-5 w-5" />
                        Télécharger le fichier
                      </a>
                    </div>
                  </div>
                );
              }

              // Fallback pour les autres types
              return (
                <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    {getMediaIcon(selectedMedia.file_category || selectedMedia.fileCategory || 'other')}
                    <p className="text-sm text-gray-600 mt-2">Aperçu non disponible</p>
                    <p className="text-xs text-gray-500 mt-1">Utilisez le bouton de téléchargement pour ouvrir le fichier</p>
                  </div>
                </div>
              );
            })()}

            {/* Informations du média */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className="text-sm text-gray-600">
                  {getMediaTypeLabel(selectedMedia.file_category || selectedMedia.fileCategory || 'other')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Taille:</span>
                <span className="text-sm text-gray-600">
                  {formatFileSize(selectedMedia.file_size || selectedMedia.fileSize || 0)}
                </span>
              </div>
              {(() => {
                const rawMediaUrl = selectedMedia.url || '';
                const resolvedMediaUrl = resolveMediaUrl(rawMediaUrl) || rawMediaUrl;
                return resolvedMediaUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Actions:</span>
                    <a
                      href={resolvedMediaUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-mdsc-blue-primary hover:bg-mdsc-blue-dark rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

