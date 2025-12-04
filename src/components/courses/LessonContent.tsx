'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CheckCircle, PlayCircle, FileText, Video, Headphones, File, ExternalLink, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Lesson, MediaFile } from '../../types/course';
import QuizComponent from './QuizComponent';
import Button from '../ui/Button';
import { progressService } from '../../lib/services/progressService';
import { resolveMediaUrl } from '../../lib/utils/media';
import { courseService } from '../../lib/services/courseService';
import dynamic from 'next/dynamic';

// Import dynamique du composant FileViewer (solution optimisée par format)
// Le spinner de chargement est géré par FileViewer lui-même, pas besoin d'en ajouter un ici
const FileViewer = dynamic(() => import('../viewers/FileViewer'), {
  ssr: false,
});

interface LessonContentProps {
  lesson: Lesson;
  courseId: string;
  enrollmentId?: number;
  onComplete?: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
  className?: string;
}

export default function LessonContent({
  lesson,
  courseId,
  enrollmentId,
  onComplete,
  onNextLesson,
  hasNextLesson = false,
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
  const [scrollCompletionTarget, setScrollCompletionTarget] = useState<HTMLDivElement | null>(null);
  const [isLoadingFullLesson, setIsLoadingFullLesson] = useState(false);
  const [fullLessonData, setFullLessonData] = useState<Lesson | null>(null);

  const autoCompletionInFlightRef = useRef(false);
  const lastTrustedPlaybackPositionRef = useRef(0);

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

  const normalizedFileIdentifier = useMemo(() => {
    const source =
      mediaFile?.originalFilename ||
      mediaFile?.original_filename ||
      mediaFile?.url ||
      contentUrl ||
      '';
    return source.toLowerCase();
  }, [mediaFile?.originalFilename, mediaFile?.original_filename, mediaFile?.url, contentUrl]);

  const isPdfContent = useMemo(() => {
    return normalizedFileIdentifier.endsWith('.pdf');
  }, [normalizedFileIdentifier]);

  const isPresentationContent = useMemo(() => {
    if (contentType === 'presentation') {
      return true;
    }
    return (
      normalizedFileIdentifier.endsWith('.pptx') ||
      normalizedFileIdentifier.endsWith('.ppt') ||
      normalizedFileIdentifier.includes('powerpoint')
    );
  }, [contentType, normalizedFileIdentifier]);

  const shouldWatchScrollCompletion = useMemo(() => {
    if (contentType === 'text' && contentText) {
      return true;
    }
    if (isPdfContent || isPresentationContent) {
      return true;
    }
    return false;
  }, [contentText, contentType, isPdfContent, isPresentationContent]);

  useEffect(() => {
    setIsCompleted(deriveCompletedStatus(lesson));
    setMediaFile(null); // Réinitialiser le mediaFile pour forcer la mise à jour

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
    
    console.log('[LessonContent] 🔍 Chargement des médias pour la leçon:', {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      contentType,
      hasMedia: !!lessonAny.media,
      hasMediaFiles: !!lessonAny.media_files,
      hasMediaFile: !!lessonAny.media_file,
      hasMediaFileProp: !!lesson.mediaFile,
      hasMediaUrl: !!lessonAny.media_url,
      hasContentUrl: !!contentUrl,
      hasVideoUrl: !!lessonAny.video_url,
      mediaData: lessonAny.media ? (Array.isArray(lessonAny.media) ? `Array[${lessonAny.media.length}]` : 'Object') : null,
      mediaFilesData: lessonAny.media_files ? (Array.isArray(lessonAny.media_files) ? `Array[${lessonAny.media_files.length}]` : 'Object') : null,
      mediaFileData: lessonAny.media_file ? 'Object' : null,
      mediaFilePropData: lesson.mediaFile ? 'Object' : null,
      mediaUrl: lessonAny.media_url,
      contentUrl: contentUrl,
      videoUrl: lessonAny.video_url,
      content_url: lessonAny.content_url,
      media_file_id: lessonAny.media_file_id,
      // Afficher les premières propriétés pour débogage
      lessonKeys: Object.keys(lessonAny).slice(0, 20),
    });
    
    // Priorité 1: lesson.media (nouvelle structure du backend - peut être un objet ou un tableau)
    if (lessonAny.media) {
      // Si c'est un tableau, prendre le premier média
      if (Array.isArray(lessonAny.media) && lessonAny.media.length > 0) {
        resolvedMedia = lessonAny.media[0] as MediaFile;
        console.log('[LessonContent] ✅ Média trouvé dans lesson.media (tableau):', resolvedMedia);
      } 
      // Si c'est un objet
      else if (typeof lessonAny.media === 'object' && lessonAny.media !== null) {
        resolvedMedia = lessonAny.media as MediaFile;
        console.log('[LessonContent] ✅ Média trouvé dans lesson.media (objet):', resolvedMedia);
      }
    }
    // Priorité 2: lesson.media_files (nouveau format backend - tableau de médias, inclut les médias associés automatiquement)
    else if (lessonAny.media_files && Array.isArray(lessonAny.media_files) && lessonAny.media_files.length > 0) {
      // Filtrer les médias valides (avec URL)
      const validMedia = lessonAny.media_files.filter((m: any) => m && m.url);
      if (validMedia.length > 0) {
        resolvedMedia = validMedia[0] as MediaFile;
        console.log('[LessonContent] ✅ Média trouvé dans lesson.media_files (tableau):', {
          total: lessonAny.media_files.length,
          valid: validMedia.length,
          selected: resolvedMedia,
        });
      }
    }
    // Priorité 3: lesson.media_file (nouveau format backend - objet unique)
    else if (lessonAny.media_file && typeof lessonAny.media_file === 'object' && lessonAny.media_file !== null && lessonAny.media_file.url) {
      resolvedMedia = lessonAny.media_file as MediaFile;
      console.log('[LessonContent] ✅ Média trouvé dans lesson.media_file (objet):', resolvedMedia);
    }
    // Priorité 4: lesson.mediaFile (ancienne structure)
    else if (lesson.mediaFile && lesson.mediaFile.url) {
      resolvedMedia = lesson.mediaFile;
      console.log('[LessonContent] ✅ Média trouvé dans lesson.mediaFile:', resolvedMedia);
    } 
    // Priorité 5: Construire mediaFile à partir des champs individuels (fallback)
    else if (lessonAny.media_url || contentUrl || lessonAny.media_file_id || lessonAny.media_file_id_from_join || lessonAny.video_url || lessonAny.document_url || lessonAny.audio_url) {
      const fileCategory: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other' = 
        (lessonAny.file_category as 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other') || 
        (contentType === 'video' ? 'video' : 
         contentType === 'audio' ? 'audio' :
         contentType === 'document' ? 'document' :
         contentType === 'presentation' ? 'presentation' :
         contentType === 'h5p' ? 'h5p' : 'other');
      
      const mediaFileId = lessonAny.media_file_id || lessonAny.media_file_id_from_join;
      // Essayer plusieurs sources pour l'URL du média
      const mediaUrl = lessonAny.media_url || 
                       lessonAny.video_url || 
                       contentUrl || 
                       lessonAny.content_url || 
                       lessonAny.document_url || 
                       '';
      
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
        console.log('[LessonContent] ✅ Média construit à partir des champs individuels:', resolvedMedia);
      } else {
        console.warn('[LessonContent] ⚠️ Aucune URL de média trouvée pour la leçon:', lesson.id);
      }
    } else {
      console.warn('[LessonContent] ⚠️ Aucune donnée de média trouvée pour la leçon:', {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        contentType,
        lessonAnyKeys: Object.keys(lessonAny),
      });
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
      
      console.log('[LessonContent] ✅ Média normalisé et défini:', {
        id: normalizedMedia.id,
        url: normalizedMedia.url,
        fileCategory: normalizedMedia.fileCategory,
        originalFilename: normalizedMedia.originalFilename,
      });
      
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
      console.warn('[LessonContent] ⚠️ Aucun média résolu, mediaFile sera null');
      setMediaFile(null);
      
      // Si aucun média n'est trouvé et qu'on a un enrollmentId, essayer de charger la leçon complète depuis le backend
      if (enrollmentId && !isLoadingFullLesson && !fullLessonData) {
        console.log('[LessonContent] 🔄 Tentative de chargement de la leçon complète depuis le backend...');
        setIsLoadingFullLesson(true);
        
        courseService.getLessonForStudent(courseId, lesson.id)
          .then((fullLesson) => {
            console.log('[LessonContent] ✅ Leçon complète chargée:', fullLesson);
            setFullLessonData(fullLesson as any);
            
            // Essayer de résoudre le média depuis la leçon complète (médias distribués automatiquement)
            const fullLessonAny = fullLesson as any;
            let resolvedFromFull: MediaFile | null = null;
            
            // Priorité 1: media_files (médias distribués automatiquement par le backend selon order_index)
            if (fullLessonAny.media_files && Array.isArray(fullLessonAny.media_files) && fullLessonAny.media_files.length > 0) {
              const validMedia = fullLessonAny.media_files.filter((m: any) => m && m.url);
              if (validMedia.length > 0) {
                resolvedFromFull = validMedia[0] as MediaFile;
                console.log('[LessonContent] ✅ Média distribué automatiquement trouvé dans media_files:', {
                  total: fullLessonAny.media_files.length,
                  valid: validMedia.length,
                  selected: resolvedFromFull,
                });
              }
            }
            // Priorité 2: media_file (objet unique)
            else if (fullLessonAny.media_file && typeof fullLessonAny.media_file === 'object' && fullLessonAny.media_file !== null && fullLessonAny.media_file.url) {
              resolvedFromFull = fullLessonAny.media_file as MediaFile;
            }
            // Priorité 3: media (ancienne structure)
            else if (fullLessonAny.media) {
              if (Array.isArray(fullLessonAny.media) && fullLessonAny.media.length > 0) {
                const validMedia = fullLessonAny.media.filter((m: any) => m && m.url);
                if (validMedia.length > 0) {
                  resolvedFromFull = validMedia[0] as MediaFile;
                }
              } else if (typeof fullLessonAny.media === 'object' && fullLessonAny.media !== null && fullLessonAny.media.url) {
                resolvedFromFull = fullLessonAny.media as MediaFile;
              }
            }
            // Priorité 4: mediaFile (propriété directe)
            else if (fullLessonAny.mediaFile && fullLessonAny.mediaFile.url) {
              resolvedFromFull = fullLessonAny.mediaFile;
            }
            
            if (resolvedFromFull) {
              console.log('[LessonContent] ✅ Média trouvé dans la leçon complète:', resolvedFromFull);
              setMediaFile(resolvedFromFull);
            }
          })
          .catch((error) => {
            console.error('[LessonContent] ❌ Erreur lors du chargement de la leçon complète:', error);
          })
          .finally(() => {
            setIsLoadingFullLesson(false);
          });
      }
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
  }, [lesson, courseId, enrollmentId]);

  // Note: Le chargement des documents (PDF, PowerPoint, Word, Excel) est maintenant géré par le composant FileViewer
  // qui utilise des viewers optimisés par format (react-pdf, pptx-preview, mammoth, xlsx)

  const handleMarkComplete = useCallback(async () => {
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
  }, [enrollmentId, lesson.id, onComplete]);

  const requestAutoCompletion = useCallback(
    (reason: string) => {
      if (isCompleted || isMarkingComplete || autoCompletionInFlightRef.current) {
        return;
      }

      autoCompletionInFlightRef.current = true;
      console.log('[LessonContent] ⚡ Auto-complétion déclenchée', {
        lessonId: lesson.id,
        reason,
      });

      handleMarkComplete()
        .catch((error) => {
          console.error('[LessonContent] ❌ Échec de l’auto-complétion', error);
        })
        .finally(() => {
          autoCompletionInFlightRef.current = false;
        });
    },
    [handleMarkComplete, isCompleted, isMarkingComplete, lesson.id]
  );

  const registerMediaProgress = useCallback((timeInSeconds: number, mediaElement?: HTMLMediaElement) => {
    const toleranceSeconds = 0.3; // Même tolérance que preventForwardSeeking
    
    // Permettre seulement une progression normale (lecture linéaire)
    // Si on dépasse la position maximale autorisée, c'est qu'il y a eu un saut
    if (timeInSeconds > lastTrustedPlaybackPositionRef.current + toleranceSeconds) {
      // Saut détecté, revenir à la position autorisée
      if (mediaElement) {
        console.warn('[LessonContent] ⛔ Saut détecté dans onTimeUpdate – correction', {
          attempted: timeInSeconds,
          allowed: lastTrustedPlaybackPositionRef.current,
          jump: timeInSeconds - lastTrustedPlaybackPositionRef.current
        });
        const targetTime = Math.max(lastTrustedPlaybackPositionRef.current, 0);
        mediaElement.currentTime = targetTime;
      }
    } else if (timeInSeconds > lastTrustedPlaybackPositionRef.current) {
      // Progression normale, mettre à jour la position
      lastTrustedPlaybackPositionRef.current = timeInSeconds;
    }
  }, []);

  const preventForwardSeeking = useCallback((mediaElement: HTMLMediaElement) => {
    const toleranceSeconds = 0.3; // Tolérance très stricte : 0.3 seconde maximum
    const forwardJump = mediaElement.currentTime - lastTrustedPlaybackPositionRef.current;

    if (forwardJump > toleranceSeconds) {
      console.warn('[LessonContent] ⛔ Avance rapide détectée – retour à la dernière position valide', {
        attempted: mediaElement.currentTime,
        allowed: lastTrustedPlaybackPositionRef.current,
        jump: forwardJump
      });
      // Forcer le retour à la position autorisée
      const targetTime = Math.max(lastTrustedPlaybackPositionRef.current, 0);
      mediaElement.currentTime = targetTime;
      
      // Vérifier à nouveau après un court délai pour s'assurer que le changement a pris effet
      setTimeout(() => {
        if (mediaElement.currentTime > lastTrustedPlaybackPositionRef.current + toleranceSeconds) {
          mediaElement.currentTime = targetTime;
        }
      }, 50);
    }
  }, []);

  useEffect(() => {
    autoCompletionInFlightRef.current = false;
    lastTrustedPlaybackPositionRef.current = 0;
  }, [lesson.id]);

  useEffect(() => {
    if (!shouldWatchScrollCompletion || !scrollCompletionTarget || isCompleted) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAutoCompletion('scroll-depth');
          }
        });
      },
      { threshold: 0.95 }
    );

    observer.observe(scrollCompletionTarget);

    return () => {
      observer.disconnect();
    };
  }, [isCompleted, requestAutoCompletion, scrollCompletionTarget, shouldWatchScrollCompletion]);

  const renderMediaContent = () => {
    // Pour les leçons de type "text", on n'a pas besoin de média si on a du contenu texte
    // Si c'est une leçon texte sans contenu texte ni URL, c'est probablement une leçon vide ou en cours de création
    if (contentType === 'text') {
      if (contentText && !contentUrl) {
        // Si c'est une leçon texte avec du contenu mais sans URL de média, retourner null
        // Le contenu texte sera affiché dans la section dédiée plus bas
        return null;
      }
      // Si c'est une leçon texte sans contenu texte ni URL, ne pas afficher d'erreur
      // Le contenu texte (même vide) sera affiché dans la section dédiée plus bas
      if (!contentText && !contentUrl) {
        console.log('[LessonContent] ℹ️ Leçon de type "text" sans contenu texte ni URL - affichage de la section texte vide');
        return null;
      }
    }
    
    // Utiliser les données de la leçon complète si disponibles
    const lessonToUse = fullLessonData || lesson;
    const lessonToUseAny = lessonToUse as any;
    
    // Si mediaFile n'existe pas mais contentUrl existe, construire un mediaFile minimal
    let effectiveMediaFile = mediaFile;
    const lessonAny = lessonToUseAny;
    
    if (!effectiveMediaFile) {
      // Essayer de construire un mediaFile à partir de toutes les sources possibles
      // Vérifier d'abord si lesson a directement un mediaFile ou media
      if (lessonAny.media) {
        if (Array.isArray(lessonAny.media) && lessonAny.media.length > 0) {
          effectiveMediaFile = lessonAny.media[0] as MediaFile;
          console.log('[LessonContent] 🔧 MediaFile trouvé dans lesson.media (tableau):', effectiveMediaFile);
        } else if (typeof lessonAny.media === 'object' && lessonAny.media !== null) {
          effectiveMediaFile = lessonAny.media as MediaFile;
          console.log('[LessonContent] 🔧 MediaFile trouvé dans lesson.media (objet):', effectiveMediaFile);
        }
      } else if (lessonAny.media_files && Array.isArray(lessonAny.media_files) && lessonAny.media_files.length > 0) {
        effectiveMediaFile = lessonAny.media_files[0] as MediaFile;
        console.log('[LessonContent] 🔧 MediaFile trouvé dans lesson.media_files (tableau):', effectiveMediaFile);
      } else if (lessonAny.media_file && typeof lessonAny.media_file === 'object' && lessonAny.media_file !== null) {
        effectiveMediaFile = lessonAny.media_file as MediaFile;
        console.log('[LessonContent] 🔧 MediaFile trouvé dans lesson.media_file (objet):', effectiveMediaFile);
      } else if (lesson.mediaFile) {
        effectiveMediaFile = lesson.mediaFile;
        console.log('[LessonContent] 🔧 MediaFile trouvé dans lesson.mediaFile:', effectiveMediaFile);
      }
    }
    
    // Si toujours pas de mediaFile, essayer de le construire depuis les URLs
    if (!effectiveMediaFile) {
      // Essayer toutes les sources possibles pour l'URL
      const fallbackUrl = contentUrl || 
                         lessonAny.content_url ||
                         lessonAny.media_url || 
                         lessonAny.video_url || 
                         lessonAny.document_url || 
                         lessonAny.audio_url ||
                         lesson.contentUrl ||
                         lessonAny.url ||
                         '';
      
      console.log('[LessonContent] 🔍 Tentative de construction depuis fallbackUrl:', {
        fallbackUrl,
        contentUrl,
        hasContentUrl: !!contentUrl,
        lessonContentUrl: lessonAny.content_url,
        lessonMediaUrl: lessonAny.media_url,
        lessonVideoUrl: lessonAny.video_url,
        lessonDocumentUrl: lessonAny.document_url,
        lessonAudioUrl: lessonAny.audio_url,
        contentType,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        hasContentText: !!contentText,
        contentTextLength: contentText?.length || 0,
        media_file_id: lessonAny.media_file_id,
        hasMediaFiles: !!lessonAny.media_files,
        hasMediaFile: !!lessonAny.media_file,
        hasMedia: !!lessonAny.media,
        lessonKeys: Object.keys(lessonAny),
        // Afficher un résumé des données disponibles
        availableUrls: {
          content_url: lessonAny.content_url,
          media_url: lessonAny.media_url,
          video_url: lessonAny.video_url,
          document_url: lessonAny.document_url,
          audio_url: lessonAny.audio_url,
        },
      });
      
      if (fallbackUrl) {
        // Déterminer le type de média basé sur contentType et l'extension de l'URL
        let fileCategory: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other' = 'other';
        
        // D'abord essayer depuis contentType
        if (contentType === 'video') fileCategory = 'video';
        else if (contentType === 'audio') fileCategory = 'audio';
        else if (contentType === 'document') fileCategory = 'document';
        else if (contentType === 'presentation') fileCategory = 'presentation';
        else if (contentType === 'h5p') fileCategory = 'h5p';
        // Sinon, essayer de détecter depuis l'extension de l'URL
        else {
          const urlLower = fallbackUrl.toLowerCase();
          if (urlLower.includes('.pdf')) fileCategory = 'document';
          else if (urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('.mov')) fileCategory = 'video';
          else if (urlLower.includes('.mp3') || urlLower.includes('.wav') || urlLower.includes('.ogg')) fileCategory = 'audio';
          else if (urlLower.includes('.pptx') || urlLower.includes('.ppt')) fileCategory = 'presentation';
          else if (urlLower.includes('.docx') || urlLower.includes('.doc')) fileCategory = 'document';
          else if (urlLower.includes('.xlsx') || urlLower.includes('.xls')) fileCategory = 'document';
        }
        
        // Extraire le nom de fichier depuis l'URL
        let originalFilename = lessonAny.original_filename || lessonAny.originalFilename || lessonAny.filename || '';
        if (!originalFilename && fallbackUrl) {
          try {
            const urlParts = fallbackUrl.split('/');
            originalFilename = urlParts[urlParts.length - 1].split('?')[0]; // Enlever les query params
            if (!originalFilename || originalFilename === '') {
              originalFilename = lesson.title || `fichier-${lesson.id}`;
            }
          } catch (e) {
            originalFilename = lesson.title || `fichier-${lesson.id}`;
          }
        }
        
        effectiveMediaFile = {
          id: lessonAny.media_file_id || lessonAny.mediaFileId || lesson.id,
          url: fallbackUrl,
          thumbnail_url: lessonAny.thumbnail_url || lesson.thumbnail_url || '',
          thumbnailUrl: lessonAny.thumbnail_url || lesson.thumbnail_url || '',
          file_category: fileCategory,
          fileCategory: fileCategory,
          original_filename: originalFilename,
          originalFilename: originalFilename,
          file_size: lessonAny.file_size || lessonAny.fileSize || 0,
          fileSize: lessonAny.file_size || lessonAny.fileSize || 0,
          file_type: lessonAny.file_type || lessonAny.fileType || '',
          fileType: lessonAny.file_type || lessonAny.fileType || '',
          lesson_id: lesson.id,
          lessonId: lesson.id,
        } as MediaFile;
        
        console.log('[LessonContent] ✅ MediaFile construit depuis fallbackUrl:', {
          id: effectiveMediaFile.id,
          url: effectiveMediaFile.url,
          fileCategory: effectiveMediaFile.fileCategory,
          originalFilename: effectiveMediaFile.originalFilename,
          lessonId: lesson.id,
        });
      }
    }
    
    if (!effectiveMediaFile) {
      // Pour les leçons de type "text", si on a du contenu texte, ne pas afficher d'erreur
      if (contentType === 'text' && contentText) {
        console.log('[LessonContent] ℹ️ Leçon de type "text" avec contenu texte, pas de média nécessaire');
        return null;
      }
      
      console.error('[LessonContent] ❌ Aucun média disponible pour affichage:', {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        contentType,
        hasMediaFile: !!mediaFile,
        hasContentUrl: !!contentUrl,
        contentUrl: contentUrl,
        hasContentText: !!contentText,
        contentTextLength: contentText?.length || 0,
        lessonContentUrl: lessonAny.content_url,
        lessonMediaUrl: lessonAny.media_url,
        lessonVideoUrl: lessonAny.video_url,
        lessonKeys: Object.keys(lessonAny),
        lessonMediaFile: lesson.mediaFile,
        lessonMedia: lessonAny.media,
        lessonMediaFiles: lessonAny.media_files,
        lessonMediaFileObj: lessonAny.media_file,
        fullLessonData: JSON.stringify(lessonAny, null, 2).substring(0, 1000), // Premiers 1000 caractères
      });
      
      // Afficher un message d'erreur informatif au lieu de retourner null
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-yellow-800 font-medium mb-2">
            Contenu non disponible
          </p>
          <p className="text-yellow-700 text-sm mb-4">
            Le contenu de cette leçon n'a pas pu être chargé. Veuillez contacter le support si le problème persiste.
          </p>
          <details className="text-left text-xs text-gray-600 mt-4">
            <summary className="cursor-pointer font-medium">Détails techniques</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <p>Leçon ID: {lesson.id}</p>
              <p>Type de contenu: {contentType}</p>
              <p>Content URL: {contentUrl || 'non défini'}</p>
              <p>Content Text: {contentText ? `${contentText.length} caractères` : 'absent'}</p>
              <p>Media File: {mediaFile ? 'présent' : 'absent'}</p>
              <p>Media Files: {lessonAny.media_files ? 'présent' : 'absent'}</p>
              <p>Media File (obj): {lessonAny.media_file ? 'présent' : 'absent'}</p>
            </div>
          </details>
        </div>
      );
    }

    const mediaType = effectiveMediaFile.fileCategory;

    switch (mediaType) {
      case 'video': {
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const videoUrlRaw = effectiveMediaFile.url || '';
        const videoUrl = resolveMediaUrl(videoUrlRaw) || videoUrlRaw;
        
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête de la vidéo */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate text-base sm:text-lg">
                      {lesson.title}
                    </p>
                    {lessonDuration && (
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs sm:text-sm text-white/80">
                          {lessonDuration} min
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lecteur vidéo stylé avec protection - Centré avec bordures arrondies */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="max-w-5xl mx-auto">
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group" style={{ maxHeight: '600px' }}>
                  <video
                    key={`video-${lesson.id}-${effectiveMediaFile.id || effectiveMediaFile.url}`}
                    src={videoUrl}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture={false}
                    className="w-full h-full object-contain rounded-xl"
                    preload="metadata"
                    playsInline
                onEnded={() => {
                  if (!isCompleted && contentType === 'video') {
                    requestAutoCompletion('video-ended');
                  }
                }}
                onTimeUpdate={(e) => {
                  registerMediaProgress(e.currentTarget.currentTime, e.currentTarget);
                }}
                onSeeking={(e) => {
                  preventForwardSeeking(e.currentTarget);
                }}
                onSeeked={(e) => {
                  // Vérifier aussi après que le saut soit terminé
                  preventForwardSeeking(e.currentTarget);
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
                  let errorMessage = 'Erreur lors du chargement de la vidéo';
                  
                  console.error('Erreur lors du chargement de la vidéo:', {
                    url: videoUrl,
                    errorCode: error?.code,
                    errorMessage: error?.message,
                    networkState: videoElement.networkState,
                    readyState: videoElement.readyState,
                    src: videoElement.src,
                  });
                  
                  // Afficher un message d'erreur plus détaillé dans la console et dans l'UI
                  if (error) {
                    switch (error.code) {
                      case MediaError.MEDIA_ERR_ABORTED:
                        errorMessage = 'Le chargement de la vidéo a été interrompu. Veuillez réessayer.';
                        console.error('Le chargement de la vidéo a été interrompu');
                        break;
                      case MediaError.MEDIA_ERR_NETWORK:
                        errorMessage = 'Une erreur réseau a empêché le chargement de la vidéo. Vérifiez votre connexion internet.';
                        console.error('Une erreur réseau a empêché le chargement de la vidéo');
                        break;
                      case MediaError.MEDIA_ERR_DECODE:
                        errorMessage = 'Le format de la vidéo n\'est pas supporté par votre navigateur.';
                        console.error('Le décodage de la vidéo a échoué');
                        break;
                      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'Le format de la vidéo n\'est pas supporté ou l\'URL est invalide.';
                        console.error('Le format de la vidéo n\'est pas supporté ou l\'URL est invalide');
                        break;
                      default:
                        errorMessage = 'Erreur inconnue lors du chargement de la vidéo.';
                        console.error('Erreur inconnue lors du chargement de la vidéo');
                    }
                  } else {
                    errorMessage = 'Impossible de charger la vidéo. Vérifiez que l\'URL est correcte et que le fichier existe.';
                  }
                }}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
                </div>
              </div>
            </div>
            
            {/* Bouton "Marquer comme terminé" */}
            {enrollmentId && !isCompleted && (
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 bg-gray-50">
                <div className="flex justify-center">
                  <button
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                    className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMarkingComplete ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        <span>Marquage en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Marquer comme terminé</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'audio': {
        // Utiliser resolveMediaUrl pour construire l'URL via le proxy Next.js (évite CORS)
        const audioUrlRaw = effectiveMediaFile.url || '';
        const audioUrl = resolveMediaUrl(audioUrlRaw) || audioUrlRaw;
        
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête de l'audio */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {lesson.title}
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
              </div>
            </div>
            
            {/* Lecteur audio stylé avec protection */}
            <div 
              className="p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100"
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
                  if (!isCompleted && contentType === 'audio') {
                    requestAutoCompletion('audio-ended');
                  }
                }}
                onTimeUpdate={(e) => {
                  registerMediaProgress(e.currentTarget.currentTime, e.currentTarget);
                }}
                onSeeking={(e) => {
                  preventForwardSeeking(e.currentTarget);
                }}
                onSeeked={(e) => {
                  // Vérifier aussi après que le saut soit terminé
                  preventForwardSeeking(e.currentTarget);
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
          </div>
        );
      }

      case 'document':
      case 'presentation': {
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
        
        // Pour les PDFs, PowerPoint, Word et Excel, utiliser FileViewer (solution optimisée par format)
        if (isPDF || isPPTX) {
          return (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <File className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate text-base sm:text-lg">
                      {lesson.title}
                    </p>
                    <p className="text-xs sm:text-sm text-white/80 mt-1">
                      {isPDF ? 'Document PDF' : 'Présentation PowerPoint'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 bg-gray-50">
                <FileViewer 
                  fileUrl={documentUrl}
                  filename={lesson.title}
                  fileType={effectiveMediaFile.fileType}
                />
              </div>
            </div>
          );
        }
        
        // Pour les autres types de documents, afficher un lien de téléchargement
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg">
                  <File className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
                  <p className="text-sm text-gray-600 mt-1">Document à télécharger</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Télécharger/Ouvrir le document
              </a>
            </div>
          </div>
        );
      }

      case 'h5p':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary/5 to-mdsc-blue-primary/10 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contenu interactif H5P</h3>
                  <p className="text-sm text-gray-600">{lesson.title}</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-md">
                <iframe
                  src={effectiveMediaFile.url}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            </div>
          </div>
        );

      default:
        // Pour le type 'text', ne rien afficher ici car le contenu texte est affiché séparément
        if (contentType === 'text') {
          return null;
        }
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">Type de média non supporté</p>
              <p className="text-sm text-gray-500">
                Ce type de contenu n'est pas encore pris en charge
              </p>
            </div>
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="p-3 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-xl flex-shrink-0 shadow-md">
                <div className="text-white">
                  {getContentIcon()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-2">{lesson.title}</h2>
                {lessonDescription && (
                  <p className="text-gray-600 text-base leading-relaxed mb-3">{lessonDescription}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {lessonDuration && (
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Durée: {lessonDuration} min</span>
                    </div>
                  )}
                  {lesson.is_required && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      Obligatoire
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Media Content */}
      {contentType !== 'quiz' && renderMediaContent()}

      {/* Text Content - Afficher s'il y a du contenu texte (pour les leçons de type "text" ou si le contenu texte existe) */}
      {contentText && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary/5 to-mdsc-blue-primary/10 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-mdsc-blue-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contenu de la leçon</h3>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            {contentText ? (
              <div
                id="lesson-content-text"
                className="prose prose-md sm:prose-lg max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                  prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
                  prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-mdsc-blue-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:text-gray-700 prose-ul:my-4 prose-ul:pl-6
                  prose-ol:text-gray-700 prose-ol:my-4 prose-ol:pl-6
                  prose-li:text-gray-700 prose-li:my-2 prose-li:leading-relaxed
                  prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6 prose-img:max-w-full prose-img:h-auto
                  prose-blockquote:border-l-4 prose-blockquote:border-mdsc-blue-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-4
                  prose-code:text-mdsc-blue-primary prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                  prose-table:w-full prose-table:my-4 prose-table:border-collapse
                  prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                  prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2"
                dangerouslySetInnerHTML={{ __html: contentText }}
              />
            ) : null}
          </div>
        </div>
      )}

      {shouldWatchScrollCompletion && (
        <div
          ref={setScrollCompletionTarget}
          className="h-2 w-full"
          aria-hidden="true"
        />
      )}

      {/* Quiz - Afficher uniquement après complétion de la leçon (pour les leçons de type quiz) */}
      {contentType === 'quiz' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {!isCompleted ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz verrouillé</h3>
                <p className="text-gray-600 mb-6">Vous devez compléter la leçon avant de pouvoir accéder au quiz.</p>
              </div>
            </div>
          ) : showQuiz ? (
            <div className="p-4 sm:p-6">
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
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-mdsc-blue-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-mdsc-blue-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz de la leçon</h3>
                <p className="text-gray-600 mb-6">Testez vos connaissances avec ce quiz</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowQuiz(true)}
                  className="w-full sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Commencer le quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forum Content */}
      {contentType === 'forum' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-mdsc-blue-primary/5 to-mdsc-blue-primary/10 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-mdsc-blue-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Forum de Discussion</h3>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            {contentText && (
              <div
                className="prose prose-md max-w-none mb-6 prose-p:text-gray-700 prose-a:text-mdsc-blue-primary"
                dangerouslySetInnerHTML={{ __html: contentText }}
              />
            )}
            {contentUrl ? (
              <a
                href={contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Accéder au forum
              </a>
            ) : (
              <p className="text-gray-500">Le forum sera bientôt disponible</p>
            )}
          </div>
        </div>
      )}

      {/* Bouton "Leçon suivante" en bas à droite */}
      {isCompleted && hasNextLesson && onNextLesson && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onNextLesson}
            className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <span>Leçon suivante</span>
            <span className="ml-2">→</span>
          </button>
        </div>
      )}
    </div>
  );
}