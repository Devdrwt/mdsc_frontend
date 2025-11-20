'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, PlayCircle, FileText, Video, Headphones, File, ExternalLink } from 'lucide-react';
import { Lesson, MediaFile } from '../../types/course';
import QuizComponent from './QuizComponent';
import Button from '../ui/Button';
import { progressService } from '../../lib/services/progressService';
import { init } from 'pptx-preview';
import { resolveMediaUrl } from '../../lib/utils/media';

interface LessonContentProps {
  lesson: Lesson;
  courseId: string;
  enrollmentId?: number;
  onComplete?: () => void;
  className?: string;
}

export default function LessonContent({
  lesson,
  courseId,
  enrollmentId,
  onComplete,
  className = '',
}: LessonContentProps) {
  const deriveCompletedStatus = (currentLesson: Lesson): boolean => {
    return Boolean(
      currentLesson.isCompleted ||
        (currentLesson as any)?.is_completed ||
        currentLesson.progress?.status === 'completed' ||
        (currentLesson as any)?.status === 'completed'
    );
  };

  const [isCompleted, setIsCompleted] = useState<boolean>(deriveCompletedStatus(lesson));
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [pptxError, setPptxError] = useState(false);
  const [pptxData, setPptxData] = useState<ArrayBuffer | null>(null);
  const [isLoadingPptx, setIsLoadingPptx] = useState(false);

  // Normalisation des champs provenant du backend (snake_case vs camelCase)
  const lessonAny = lesson as any;
  const contentType = (lesson.contentType ||
    lessonAny.content_type ||
    lessonAny.type ||
    (lessonAny.is_quiz ? 'quiz' : undefined) ||
    'text') as Lesson['content_type'];

  const contentUrl =
    lesson.contentUrl ||
    lessonAny.content_url ||
    lessonAny.media_url ||
    lessonAny.video_url ||
    lessonAny.document_url ||
    '';

  const contentText = lesson.contentText || lessonAny.content_text || lessonAny.content || '';
  const lessonDescription = lesson.description || lessonAny.description || '';
  const lessonDuration = lesson.duration || lessonAny.duration_minutes || lessonAny.duration;

  useEffect(() => {
    setIsCompleted(deriveCompletedStatus(lesson));
    setPdfLoadError(false); // Réinitialiser l'erreur PDF quand la leçon change
    setPptxError(false); // Réinitialiser l'erreur PPTX quand la leçon change
    setMediaFile(null); // Réinitialiser le mediaFile pour forcer la mise à jour
    setPptxData(null); // Réinitialiser les données PPTX
    setIsLoadingPptx(false);

    // Protection globale contre le clic droit et autres interactions non désirées
    const handleContextMenu = (e: MouseEvent) => {
      // IMPORTANT: Ne jamais bloquer les événements sur les vidéos ou leurs contrôles
      const target = e.target as HTMLElement;
      
      // Exclure explicitement les vidéos et leurs contrôles
      if (target.tagName === 'VIDEO' || target.closest('video')) {
        return; // Laisser passer pour les vidéos
      }
      
      // Si on est dans la zone du PDF, empêcher le menu contextuel
      const pdfContainer = document.querySelector('.pdf-viewer-container');
      if (pdfContainer && (pdfContainer.contains(target) || target.closest('iframe') || target === pdfContainer)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Empêcher F12 et autres raccourcis de développement
      if (e.key === 'F12' || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Empêcher le clic droit globalement sur les PDF
      // IMPORTANT: Ne jamais bloquer les événements sur les vidéos ou leurs contrôles
      if (e.button === 2 || e.which === 3) {
        const target = e.target as HTMLElement;
        
        // Exclure explicitement les vidéos et leurs contrôles
        if (target.tagName === 'VIDEO' || target.closest('video')) {
          return; // Laisser passer pour les vidéos
        }
        
        const pdfContainer = document.querySelector('.pdf-viewer-container');
        if (pdfContainer && (pdfContainer.contains(target) || target.closest('iframe') || target === pdfContainer)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Empêcher aussi au relâchement du clic droit
      // IMPORTANT: Ne jamais bloquer les événements sur les vidéos ou leurs contrôles
      if (e.button === 2 || e.which === 3) {
        const target = e.target as HTMLElement;
        
        // Exclure explicitement les vidéos et leurs contrôles
        if (target.tagName === 'VIDEO' || target.closest('video')) {
          return; // Laisser passer pour les vidéos
        }
        
        const pdfContainer = document.querySelector('.pdf-viewer-container');
        if (pdfContainer && (pdfContainer.contains(target) || target.closest('iframe') || target === pdfContainer)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    const handleAuxClick = (e: MouseEvent) => {
      // Empêcher UNIQUEMENT les clics droits (bouton 2), pas le bouton du milieu
      // IMPORTANT: Ne jamais bloquer les événements sur les vidéos ou leurs contrôles
      if (e.button === 2 || e.which === 3) {
        const target = e.target as HTMLElement;
        
        // Exclure explicitement les vidéos et leurs contrôles
        if (target.tagName === 'VIDEO' || target.closest('video')) {
          return; // Laisser passer pour les vidéos
        }
        
        const pdfContainer = document.querySelector('.pdf-viewer-container');
        if (pdfContainer && (pdfContainer.contains(target) || target.closest('iframe') || target === pdfContainer)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
      // Laisser passer les clics du bouton du milieu (button === 1) pour le scroll
    };

    // Charger les médias de la leçon si disponibles
    // Priorité 1: lesson.media (nouvelle structure du backend - peut être un objet ou un tableau)
    const lessonAny = lesson as any;
    let resolvedMedia: MediaFile | null = null;
    
    if (lessonAny.media) {
      // Si c'est un tableau, prendre le premier média
      if (Array.isArray(lessonAny.media) && lessonAny.media.length > 0) {
        resolvedMedia = lessonAny.media[0] as MediaFile;
      } 
      // Si c'est un objet
      else if (typeof lessonAny.media === 'object' && lessonAny.media !== null) {
        resolvedMedia = lessonAny.media as MediaFile;
      }
    }
    // Priorité 2: lesson.mediaFile (ancienne structure)
    else if (lesson.mediaFile) {
      resolvedMedia = lesson.mediaFile;
    } 
    // Priorité 3: Construire mediaFile à partir des champs individuels (fallback)
    else if (lessonAny.media_url || contentUrl || lessonAny.media_file_id || lessonAny.media_file_id_from_join) {
      const fileCategory: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other' = 
        (lessonAny.file_category as 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other') || 
        (contentType === 'video' ? 'video' : 
         contentType === 'audio' ? 'audio' :
         contentType === 'document' ? 'document' :
         contentType === 'presentation' ? 'presentation' :
         contentType === 'h5p' ? 'h5p' : 'other');
      
      const mediaFileId = lessonAny.media_file_id || lessonAny.media_file_id_from_join;
      const mediaUrl = lessonAny.media_url || contentUrl || lessonAny.content_url || '';
      
      // Si on a un media_file_id ou media_url, créer l'objet mediaFile
      if (mediaFileId || mediaUrl) {
        resolvedMedia = {
          id: mediaFileId || lesson.id,
          url: mediaUrl,
          thumbnail_url: lessonAny.thumbnail_url,
          thumbnailUrl: lessonAny.thumbnail_url,
          file_category: fileCategory,
          fileCategory: fileCategory,
          original_filename: lessonAny.original_filename || lessonAny.filename || lesson.title || '',
          originalFilename: lessonAny.original_filename || lessonAny.filename || lesson.title || '',
          file_size: lessonAny.file_size || 0,
          fileSize: lessonAny.file_size || 0,
          file_type: lessonAny.file_type || '',
          fileType: lessonAny.file_type || '',
          lesson_id: lesson.id,
          lessonId: lesson.id,
        } as MediaFile;
      }
    }
    
    // Normaliser le mediaFile résolu pour s'assurer qu'il a toutes les propriétés nécessaires
    if (resolvedMedia) {
      // S'assurer que les propriétés camelCase et snake_case sont présentes
      const normalizedMedia: MediaFile = {
        ...resolvedMedia,
        id: resolvedMedia.id || lesson.id,
        url: resolvedMedia.url || '',
        thumbnail_url: resolvedMedia.thumbnail_url || resolvedMedia.thumbnailUrl || lessonAny.thumbnail_url || '',
        thumbnailUrl: resolvedMedia.thumbnailUrl || resolvedMedia.thumbnail_url || lessonAny.thumbnail_url || '',
        file_category: (resolvedMedia.file_category || resolvedMedia.fileCategory || 'other') as 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other',
        fileCategory: (resolvedMedia.fileCategory || resolvedMedia.file_category || 'other') as 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other',
        original_filename: resolvedMedia.original_filename || resolvedMedia.originalFilename || lesson.title || '',
        originalFilename: resolvedMedia.originalFilename || resolvedMedia.original_filename || lesson.title || '',
        file_size: resolvedMedia.file_size || resolvedMedia.fileSize || 0,
        fileSize: resolvedMedia.fileSize || resolvedMedia.file_size || 0,
        file_type: resolvedMedia.file_type || resolvedMedia.fileType || '',
        fileType: resolvedMedia.fileType || resolvedMedia.file_type || '',
        lesson_id: (typeof resolvedMedia.lesson_id === 'number' ? resolvedMedia.lesson_id : typeof resolvedMedia.lessonId === 'number' ? resolvedMedia.lessonId : lesson.id),
        lessonId: (typeof resolvedMedia.lessonId === 'number' ? resolvedMedia.lessonId : typeof resolvedMedia.lesson_id === 'number' ? resolvedMedia.lesson_id : lesson.id),
      };
      
      setMediaFile(normalizedMedia);
      
      // Activer la protection globale si c'est un document PDF
      const mediaUrl = normalizedMedia.url || '';
      const fileCategory = normalizedMedia.fileCategory || normalizedMedia.file_category || '';
      if (fileCategory === 'document' && (mediaUrl.toLowerCase().endsWith('.pdf') || normalizedMedia.fileType === 'application/pdf' || normalizedMedia.file_type === 'application/pdf')) {
        // Utiliser capture phase pour intercepter avant que l'événement n'atteigne l'iframe
        document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
        document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
        document.addEventListener('mousedown', handleMouseDown, { capture: true, passive: false });
        document.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false });
        document.addEventListener('auxclick', handleAuxClick, { capture: true, passive: false });
        // Ajouter aussi au niveau window pour plus de sécurité
        window.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
        window.addEventListener('mousedown', handleMouseDown, { capture: true, passive: false });
        window.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false });
      }
    } else {
      setMediaFile(null);
    }

    // Cleanup: retirer les event listeners quand le composant se démonte ou change de leçon
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
      document.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      document.removeEventListener('mousedown', handleMouseDown, { capture: true } as any);
      document.removeEventListener('mouseup', handleMouseUp, { capture: true } as any);
      document.removeEventListener('auxclick', handleAuxClick, { capture: true } as any);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
      window.removeEventListener('mousedown', handleMouseDown, { capture: true } as any);
      window.removeEventListener('mouseup', handleMouseUp, { capture: true } as any);
    };
  }, [lesson]);

  // Charger et afficher le fichier PPTX avec pptx-preview
  useEffect(() => {
    const loadAndRenderPptx = async () => {
      if (!mediaFile?.url) {
        setPptxData(null);
        setIsLoadingPptx(false);
        return;
      }
      
      // Vérifier si c'est un fichier PPTX
      const filename = mediaFile.originalFilename?.toLowerCase() || mediaFile.url?.toLowerCase() || '';
      const isPPTX = mediaFile.fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                    mediaFile.fileType === 'application/vnd.ms-powerpoint' ||
                    filename.endsWith('.pptx') ||
                    filename.endsWith('.ppt');
      
      if (!isPPTX) {
        setPptxData(null);
        setIsLoadingPptx(false);
        return;
      }
      
      setIsLoadingPptx(true);
      setPptxError(false);
      
      try {
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const fileUrlRaw = mediaFile.url || '';
        const fileUrl = resolveMediaUrl(fileUrlRaw) || fileUrlRaw;
        
        // Télécharger le fichier PPTX
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du fichier');
        }
        
        // Convertir en ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        setPptxData(arrayBuffer);
        
        // Attendre que le DOM soit prêt et que le conteneur soit disponible
        let container = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!container && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const containerId = `pptx-preview-${lesson.id}`;
          container = document.getElementById(containerId);
          attempts++;
        }
        
        if (container) {
          // Nettoyer le contenu précédent
          container.innerHTML = '';
          
          // Obtenir les dimensions du conteneur
          const width = container.offsetWidth || container.clientWidth || 960;
          const height = Math.max(container.offsetHeight || container.clientHeight || 540, 540);
          
          console.log('Initialisation pptx-preview avec:', { width, height, containerId: `pptx-preview-${lesson.id}` });
          
          // Initialiser le preview avec pptx-preview
          const pptxPreviewer = init(container, {
            width: width,
            height: height
          });
          
          // Afficher le fichier
          pptxPreviewer.preview(arrayBuffer);
          
          console.log('PPTX preview initialisé avec succès');
        } else {
          console.error('Conteneur PPTX non trouvé après', maxAttempts, 'tentatives');
          throw new Error('Conteneur PPTX non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du fichier PPTX:', error);
        setPptxError(true);
      } finally {
        setIsLoadingPptx(false);
      }
    };
    
    // Délai pour laisser le temps au mediaFile d'être mis à jour
    const timer = setTimeout(() => {
      loadAndRenderPptx();
    }, 200);
    
    return () => {
      clearTimeout(timer);
      // Nettoyer le preview si nécessaire
      const containerId = `pptx-preview-${lesson.id}`;
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [mediaFile?.url, mediaFile?.id, lesson.id]);

  const handleMarkComplete = async () => {
    if (!enrollmentId && !onComplete) {
      console.error('enrollmentId est requis pour marquer une leçon comme complétée');
      return;
    }

    setIsMarkingComplete(true);
    try {
      if (onComplete) {
        setIsCompleted(true);
        await Promise.resolve(onComplete());
        return;
      }

      const result = await progressService.markLessonCompleted(
        enrollmentId!,
        typeof lesson.id === 'number' ? lesson.id : parseInt(lesson.id as string),
        undefined
      );

      if (result?.success === false) {
        setIsCompleted(true);
        onComplete?.();
        return;
      }

      setIsCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error('Erreur lors du marquage de la leçon:', error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const renderMediaContent = () => {
    // Si mediaFile n'existe pas mais contentUrl existe, construire un mediaFile minimal
    let effectiveMediaFile = mediaFile;
    if (!effectiveMediaFile && contentUrl) {
      // Déterminer le type de média basé sur contentType et contentUrl
      const fileCategory = contentType === 'video' ? 'video' :
                          contentType === 'audio' ? 'audio' :
                          contentType === 'document' ? 'document' :
                          contentType === 'presentation' ? 'presentation' :
                          contentType === 'h5p' ? 'h5p' : 'other';
      
      effectiveMediaFile = {
        id: lesson.id,
        url: contentUrl,
        thumbnail_url: lesson.thumbnail_url,
        thumbnailUrl: lesson.thumbnail_url,
        file_category: fileCategory,
        fileCategory: fileCategory,
        original_filename: lesson.title || '',
        originalFilename: lesson.title || '',
        file_size: 0,
        fileSize: 0,
        file_type: '',
        fileType: '',
        lesson_id: lesson.id,
        lessonId: lesson.id,
      } as MediaFile;
    }
    
    if (!effectiveMediaFile) {
      return null;
    }

    const mediaType = effectiveMediaFile.fileCategory;

    switch (mediaType) {
      case 'video':
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const videoUrlRaw = effectiveMediaFile.url || '';
        const videoUrl = resolveMediaUrl(videoUrlRaw) || videoUrlRaw;
        
        return (
          <div className="bg-white">
            {/* En-tête de la vidéo */}
            <div className="p-4 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {effectiveMediaFile.originalFilename || lesson.title}
                    </p>
                    {lessonDuration && (
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-white/80">
                          {lessonDuration} min
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {isCompleted && (
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Complétée</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lecteur vidéo stylé avec protection */}
            <div className="relative w-full aspect-video bg-black group">
              <video
                key={`video-${lesson.id}-${effectiveMediaFile.id || effectiveMediaFile.url}`}
                src={videoUrl}
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture={false}
                className="w-full h-full object-contain"
                preload="metadata"
                playsInline
                onEnded={() => {
                  // Auto-mark as complete when video ends
                  if (!isCompleted && contentType === 'video') {
                    handleMarkComplete();
                  }
                }}
                onTimeUpdate={(e) => {
                  // Suivre la progression de la vidéo
                  const video = e.currentTarget;
                  if (video.duration && video.duration > 0) {
                    const progress = (video.currentTime / video.duration) * 100;
                    // Optionnel: sauvegarder la progression
                    if (progress > 80 && !isCompleted && enrollmentId) {
                      // Marquer comme complété si 80% de la vidéo est regardée
                      // (onEnded sera appelé à 100%)
                    }
                  }
                }}
                onLoadedMetadata={(e) => {
                  // Restaurer la position de lecture si disponible
                  const video = e.currentTarget;
                  const savedPosition = (lesson as any)?.progress?.last_position_seconds;
                  if (savedPosition && savedPosition > 0 && video.duration > savedPosition) {
                    video.currentTime = savedPosition;
                  }
                  
                  // IMPORTANT: Ne pas ajouter de gestionnaires d'événements qui pourraient interférer
                  // avec les contrôles vidéo natifs (barre de progression, boutons, etc.)
                  // Les contrôles sont dans une shadow DOM et doivent fonctionner sans aucune interférence
                  // Le menu contextuel est déjà géré par l'attribut onContextMenu sur l'élément video
                }}
                onError={(e) => {
                  const videoElement = e.currentTarget;
                  const error = videoElement.error;
                  console.error('Erreur lors du chargement de la vidéo:', {
                    url: videoUrl,
                    errorCode: error?.code,
                    errorMessage: error?.message,
                    networkState: videoElement.networkState,
                    readyState: videoElement.readyState,
                    src: videoElement.src,
                  });
                  
                  // Afficher un message d'erreur plus détaillé dans la console
                  if (error) {
                    switch (error.code) {
                      case MediaError.MEDIA_ERR_ABORTED:
                        console.error('Le chargement de la vidéo a été interrompu');
                        break;
                      case MediaError.MEDIA_ERR_NETWORK:
                        console.error('Une erreur réseau a empêché le chargement de la vidéo');
                        break;
                      case MediaError.MEDIA_ERR_DECODE:
                        console.error('Le décodage de la vidéo a échoué');
                        break;
                      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        console.error('Le format de la vidéo n\'est pas supporté ou l\'URL est invalide');
                        break;
                      default:
                        console.error('Erreur inconnue lors du chargement de la vidéo');
                    }
                  }
                }}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
            
            {/* Barre d'information en bas */}
            <div className="p-3 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Lecture protégée - Téléchargement et enregistrement désactivés
              </p>
            </div>
          </div>
        );

      case 'audio':
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const audioUrlRaw = effectiveMediaFile.url || '';
        const audioUrl = resolveMediaUrl(audioUrlRaw) || audioUrlRaw;
        
        return (
          <div className="bg-white">
            {/* En-tête de l'audio */}
            <div className="p-4 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {effectiveMediaFile.originalFilename || lesson.title}
                    </p>
                    {lessonDuration && (
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-white/80">
                          {lessonDuration} min
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {isCompleted && (
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Complétée</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lecteur audio stylé avec protection */}
            <div 
              className="p-6 bg-gray-50"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onMouseDown={(e) => {
                if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && (
                  e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S' ||
                  e.key === 'u' || e.key === 'U' || e.key === 'i' || e.key === 'I' ||
                  e.key === 'j' || e.key === 'J' || e.key === 'k' || e.key === 'K'
                )) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  return false;
                }
                if (e.key === 'F12') {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  return false;
                }
              }}
            >
              <audio
                key={`audio-${lesson.id}-${effectiveMediaFile.id || effectiveMediaFile.url}`}
                src={audioUrl}
                controls
                controlsList="nodownload noplaybackrate"
                className="w-full"
                preload="metadata"
                style={{
                  pointerEvents: 'auto'
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onEnded={() => {
                  // Auto-mark as complete when audio ends
                  if (!isCompleted && contentType === 'audio') {
                    handleMarkComplete();
                  }
                }}
                onLoadedMetadata={(e) => {
                  const audio = e.currentTarget;
                  const savedPosition = (lesson as any)?.progress?.last_position_seconds;
                  if (savedPosition && savedPosition > 0 && audio.duration > savedPosition) {
                    audio.currentTime = savedPosition;
                  }
                  
                  // Désactiver le menu contextuel sur l'audio
                  try {
                    const audioElement = e.currentTarget;
                    audioElement.addEventListener('contextmenu', (ev) => {
                      ev.preventDefault();
                      return false;
                    }, true);
                    
                    // Empêcher les raccourcis clavier
                    audioElement.addEventListener('keydown', (ev: KeyboardEvent) => {
                      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) {
                        ev.preventDefault();
                        return false;
                      }
                    }, true);
                  } catch (err) {
                    console.warn('Impossible de désactiver le menu contextuel sur l\'audio');
                  }
                }}
                onError={(e) => {
                  const audioElement = e.currentTarget;
                  const error = audioElement.error;
                  console.error('Erreur lors du chargement de l\'audio:', {
                    url: audioUrl,
                    errorCode: error?.code,
                    errorMessage: error?.message,
                    networkState: audioElement.networkState,
                    readyState: audioElement.readyState,
                    src: audioElement.src,
                  });
                  
                  // Afficher un message d'erreur plus détaillé dans la console
                  if (error) {
                    switch (error.code) {
                      case MediaError.MEDIA_ERR_ABORTED:
                        console.error('Le chargement de l\'audio a été interrompu');
                        break;
                      case MediaError.MEDIA_ERR_NETWORK:
                        console.error('Une erreur réseau a empêché le chargement de l\'audio');
                        break;
                      case MediaError.MEDIA_ERR_DECODE:
                        console.error('Le décodage de l\'audio a échoué');
                        break;
                      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        console.error('Le format de l\'audio n\'est pas supporté ou l\'URL est invalide');
                        break;
                      default:
                        console.error('Erreur inconnue lors du chargement de l\'audio');
                    }
                  }
                }}
              >
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
            
            {/* Barre d'information en bas */}
            <div className="p-3 bg-gray-50">
              <p className="text-xs text-gray-500">
                Lecture protégée - Téléchargement et enregistrement désactivés
              </p>
            </div>
          </div>
        );

      case 'document':
      case 'presentation':
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const documentUrlRaw = effectiveMediaFile.url || '';
        const documentUrl = resolveMediaUrl(documentUrlRaw) || documentUrlRaw;
        
        // Vérifier le type de fichier
        const filename = effectiveMediaFile.originalFilename?.toLowerCase() || effectiveMediaFile.url.toLowerCase();
        const isPDF = effectiveMediaFile.fileType === 'application/pdf' || 
                     filename.endsWith('.pdf');
        const isPPTX = effectiveMediaFile.fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                      effectiveMediaFile.fileType === 'application/vnd.ms-powerpoint' ||
                      filename.endsWith('.pptx') ||
                      filename.endsWith('.ppt');
        
        // Pour les PDFs, afficher intégré
        if (isPDF) {
          // Afficher le PDF intégré dans un iframe
          return (
            <div className="bg-white">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-mdsc-blue-primary" />
                  <div>
                    <p className="font-medium text-gray-900">{effectiveMediaFile.originalFilename}</p>
                  </div>
                </div>
                {/* Supprimé le bouton "Ouvrir dans un nouvel onglet" pour empêcher le téléchargement */}
              </div>
              <div 
                className="w-full relative select-none pdf-viewer-container" 
                style={{ 
                  height: '800px', 
                  minHeight: '600px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  KhtmlUserSelect: 'none',
                  // @ts-ignore - Propriétés webkit non standard
                  WebkitUserDrag: 'none'
                }}
                onContextMenu={(e) => {
                  // Empêcher le menu contextuel sur le conteneur
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                    (e.nativeEvent as any).stopImmediatePropagation();
                  }
                  return false;
                }}
                onMouseDown={(e) => {
                  // Empêcher le clic droit (bouton 2 = clic droit)
                  if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                      (e.nativeEvent as any).stopImmediatePropagation();
                    }
                    return false;
                  }
                }}
                onMouseUp={(e) => {
                  // Empêcher aussi au relâchement du clic droit
                  if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                      (e.nativeEvent as any).stopImmediatePropagation();
                    }
                    return false;
                  }
                }}
                onAuxClick={(e) => {
                  // Empêcher UNIQUEMENT les clics droits (bouton 2)
                  // Laisser passer le bouton du milieu (button === 1) pour le scroll
                  if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                      (e.nativeEvent as any).stopImmediatePropagation();
                    }
                    return false;
                  }
                  // Laisser passer les autres clics (bouton du milieu, etc.)
                }}
                onKeyDown={(e) => {
                  // Empêcher les raccourcis clavier d'impression, sauvegarde, et autres
                  if ((e.ctrlKey || e.metaKey) && (
                    e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S' ||
                    e.key === 'u' || e.key === 'U' || // Ctrl+U (code source)
                    e.key === 'i' || e.key === 'I' || // Ctrl+I (inspecter)
                    e.key === 'j' || e.key === 'J' || // Ctrl+J (console)
                    e.key === 'k' || e.key === 'K'    // Ctrl+K (recherche)
                  )) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    return false;
                  }
                  // Empêcher F12 (outils développeur)
                  if (e.key === 'F12') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    return false;
                  }
                }}
                // onDragStart et onSelectStart supprimés - laisser fonctionner normalement
                // onClick supprimé - laisser tous les clics gauches fonctionner normalement
              >
                {pdfLoadError ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                    <File className="h-16 w-16 text-gray-400" />
                    <p className="text-gray-600">
                      Impossible d'afficher le PDF dans cette page
                    </p>
                  </div>
                ) : (
                  <>
                    <iframe
                      key={`pdf-${lesson.id}-${effectiveMediaFile.id || effectiveMediaFile.url}`}
                      src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0 relative z-10"
                      title={effectiveMediaFile.originalFilename || 'Document'}
                      allow="fullscreen"
                      style={{ 
                        border: 'none',
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                      onContextMenu={(e) => {
                        // Empêcher le menu contextuel sur l'iframe
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                          (e.nativeEvent as any).stopImmediatePropagation();
                        }
                        return false;
                      }}
                      onMouseDown={(e) => {
                        // Empêcher le clic droit sur l'iframe
                        if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                            (e.nativeEvent as any).stopImmediatePropagation();
                          }
                          return false;
                        }
                      }}
                      onMouseUp={(e) => {
                        // Empêcher aussi au relâchement
                        if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
                            (e.nativeEvent as any).stopImmediatePropagation();
                          }
                          return false;
                        }
                      }}
                      onLoad={() => {
                        setPdfLoadError(false);
                        // Désactiver le menu contextuel et autres interactions dans l'iframe après chargement
                        try {
                          const iframe = document.querySelector(`iframe[title="${effectiveMediaFile.originalFilename || 'Document'}"]`) as HTMLIFrameElement;
                          if (iframe?.contentDocument) {
                            const doc = iframe.contentDocument;
                            const win = iframe.contentWindow;
                            
                            // Empêcher le menu contextuel avec capture
                            const preventContextMenu = (e: Event) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.stopImmediatePropagation();
                              return false;
                            };
                            
                            doc.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
                            doc.addEventListener('contextmenu', preventContextMenu, true);
                            
                            // Empêcher les clics droits
                            const preventRightClick = (e: MouseEvent) => {
                              if (e.button === 2 || e.which === 3) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                return false;
                              }
                            };
                            
                            doc.addEventListener('mousedown', preventRightClick, { capture: true, passive: false });
                            doc.addEventListener('mouseup', preventRightClick, { capture: true, passive: false });
                            
                            // Empêcher les raccourcis clavier
                            doc.addEventListener('keydown', (e) => {
                              if ((e.ctrlKey || e.metaKey) && (
                                e.key === 'p' || e.key === 's' || 
                                e.key === 'u' || e.key === 'i' || 
                                e.key === 'j' || e.key === 'k'
                              )) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                return false;
                              }
                              if (e.key === 'F12') {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                              }
                            }, { capture: true, passive: false });
                            
                            // Empêcher la sélection de texte
                            doc.addEventListener('selectstart', (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }, { capture: true, passive: false });
                            
                            // Empêcher le glisser-déposer
                            doc.addEventListener('dragstart', (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }, { capture: true, passive: false });
                            
                            // Désactiver la sélection via CSS
                            if (doc.body) {
                              doc.body.style.userSelect = 'none';
                              doc.body.style.webkitUserSelect = 'none';
                              // @ts-ignore - Propriétés non standard
                              doc.body.style.mozUserSelect = 'none';
                              // @ts-ignore - Propriétés non standard
                              doc.body.style.msUserSelect = 'none';
                              // @ts-ignore - Propriétés webkit non standard
                              doc.body.style.webkitTouchCallout = 'none';
                              // @ts-ignore - Propriétés webkit non standard
                              doc.body.style.webkitUserDrag = 'none';
                              // Empêcher le menu contextuel via CSS
                              doc.body.setAttribute('oncontextmenu', 'return false;');
                            }
                            
                            // Empêcher les clics droits via window
                            if (win) {
                              win.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
                              win.addEventListener('contextmenu', preventContextMenu, true);
                              win.addEventListener('mousedown', preventRightClick, { capture: true, passive: false });
                              win.addEventListener('mouseup', preventRightClick, { capture: true, passive: false });
                            }
                          }
                        } catch (err) {
                          // Ignorer les erreurs CORS (normal si le PDF vient d'un autre domaine)
                          console.warn('Impossible d\'accéder au contenu de l\'iframe (CORS) - Protection limitée');
                        }
                      }}
                      onError={() => {
                        console.error('Erreur lors du chargement du PDF dans l\'iframe');
                        setPdfLoadError(true);
                      }}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        Document en lecture seule - Impression, téléchargement et enregistrement désactivés
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        }
        
        // Pour les PowerPoint (PPTX/PPT), utiliser la bibliothèque PPTXRenderer
        if (isPPTX) {
          return (
            <div className="bg-white">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-mdsc-blue-primary" />
                  <div>
                    <p className="font-medium text-gray-900">{effectiveMediaFile.originalFilename}</p>
                  </div>
                </div>
              </div>
              
              {pptxError ? (
                <div className="p-8 text-center">
                  <File className="h-16 w-16 text-gray-400" />
                  <p className="text-gray-600">
                    Impossible de charger la présentation
                  </p>
                  <p className="text-sm text-gray-500">
                    Veuillez réessayer plus tard ou contacter le support.
                  </p>
                </div>
              ) : (
                <div 
                  className="w-full relative select-none pdf-viewer-container" 
                  style={{ 
                    minHeight: '600px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    KhtmlUserSelect: 'none',
                    // @ts-ignore - Propriétés webkit non standard
                    WebkitUserDrag: 'none'
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 2 || (e.nativeEvent && (e.nativeEvent as any).which === 3)) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && (
                      e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S' ||
                      e.key === 'u' || e.key === 'U' || e.key === 'i' || e.key === 'I' ||
                      e.key === 'j' || e.key === 'J' || e.key === 'k' || e.key === 'K'
                    )) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      return false;
                    }
                  }}
                >
                  {isLoadingPptx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">
                          Chargement de la présentation...
                        </p>
                      </div>
                    </div>
                  )}
                  <div 
                    id={`pptx-preview-${lesson.id}`}
                    style={{ 
                      width: '100%', 
                      height: '600px',
                      minHeight: '600px',
                      backgroundColor: '#f5f5f5',
                      position: 'relative'
                    }}
                  />
                </div>
              )}
              
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Présentation en lecture seule - Téléchargement et enregistrement désactivés
                </p>
              </div>
            </div>
          );
        }
        
        // Pour les autres types de documents, afficher un lien de téléchargement
        return (
          <div className="bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <File className="h-6 w-6 text-mdsc-blue-primary" />
              <div>
                <p className="font-medium text-gray-900">{effectiveMediaFile.originalFilename}</p>
              </div>
            </div>
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-white/20 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Télécharger/Ouvrir
            </a>
          </div>
        );

      case 'h5p':
        return (
          <div className="w-full aspect-video">
            <iframe
              src={effectiveMediaFile.url}
              className="w-full h-full rounded-lg border border-gray-200"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        );

      default:
        return (
          <div className="bg-gray-50">
            <p className="text-gray-500">Type de média non supporté</p>
          </div>
        );
    }
  };

  const getContentIcon = () => {
    switch (contentType) {
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'text':
        return <FileText className="h-6 w-6" />;
      case 'quiz':
        return <FileText className="h-6 w-6" />;
      case 'document':
        return <File className="h-6 w-6" />;
      case 'audio':
        return <Headphones className="h-6 w-6" />;
      case 'presentation':
        return <FileText className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Lesson Header */}
      <div className="bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-mdsc-blue-primary/10 rounded-lg flex-shrink-0">
              {getContentIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{lesson.title}</h2>
              {lessonDescription && (
                <p className="text-gray-600">{lessonDescription}</p>
              )}
              {lessonDuration && (
                <p className="text-sm text-gray-500">
                  Durée estimée: {lessonDuration} min
                </p>
              )}
            </div>
          </div>

          {isCompleted && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 mr-2" />
              Terminée
            </span>
          )}
        </div>

      </div>

      {/* Media Content */}
      {contentType !== 'quiz' && renderMediaContent()}

      {/* Text Content - Afficher pour tous les types si contentText existe */}
      {contentText && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: contentText }}
          />
        </div>
      )}

      {/* Quiz */}
      {contentType === 'quiz' && (
        <div>
          {showQuiz ? (
            <QuizComponent
              quizId={lesson.quiz_id?.toString() || (typeof lesson.id === 'number' ? lesson.id.toString() : lesson.id)}
              lessonId={typeof lesson.id === 'number' ? lesson.id.toString() : lesson.id}
              onComplete={(attempt) => {
                if (attempt.passed) {
                  setIsCompleted(true);
                  onComplete?.();
                }
                setShowQuiz(false);
              }}
            />
          ) : (
            <div className="bg-white">
              <p className="text-gray-700">Commencez le quiz pour cette leçon</p>
              <Button
                variant="primary"
                onClick={() => setShowQuiz(true)}
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Commencer le quiz
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Forum Content */}
      {contentType === 'forum' && (
        <div className="bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-mdsc-blue-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Forum de Discussion</h3>
          </div>
          {contentText && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: contentText }}
            />
          )}
          {contentUrl ? (
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-white/20 hover:text-white transition-colors"
            >
              Accéder au forum
            </a>
          ) : (
            <p className="text-gray-500">Le forum sera bientôt disponible</p>
          )}
        </div>
      )}

      {/* Assignment Content */}
      {contentType === 'assignment' && (
        <div className="bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-mdsc-blue-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Devoir</h3>
          </div>
          {contentText && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: contentText }}
            />
          )}
          {lesson.content && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          )}
          {contentUrl && (
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-white/20 hover:text-white transition-colors"
            >
              Voir les instructions du devoir
            </a>
          )}
        </div>
      )}


      {/* Completion Button */}
      {contentType !== 'quiz' && (
        <div className="flex justify-end">
          {!isCompleted ? (
            <Button
              variant="primary"
              onClick={handleMarkComplete}
              disabled={isMarkingComplete}
            >
              {isMarkingComplete ? (
                'Marquage...'
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Marquer comme terminée
                </>
              )}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
