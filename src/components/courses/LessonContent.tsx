'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, PlayCircle, FileText, Video, Headphones, File } from 'lucide-react';
import { Lesson, MediaFile } from '../../types/course';
import QuizComponent from './QuizComponent';
import Button from '../ui/Button';
import { progressService } from '../../lib/services/progressService';

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
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted || lesson.progress?.status === 'completed' || false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    // Charger les médias de la leçon si disponibles
    if (lesson.mediaFile) {
      setMediaFile(lesson.mediaFile);
    } else if (lesson.contentUrl && lesson.contentType === 'video') {
      // Fallback: utiliser contentUrl si disponible
      setMediaFile({
        id: lesson.id,
        url: lesson.contentUrl,
        fileCategory: 'video',
      } as MediaFile);
    }
  }, [lesson]);

  const handleMarkComplete = async () => {
    if (!enrollmentId) {
      console.error('enrollmentId est requis pour marquer une leçon comme complétée');
      return;
    }

    setIsMarkingComplete(true);
    try {
      await progressService.markLessonCompleted(
        enrollmentId,
        typeof lesson.id === 'number' ? lesson.id : parseInt(lesson.id as string),
        undefined // timeSpent optionnel
      );
      setIsCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error('Erreur lors du marquage de la leçon:', error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const renderMediaContent = () => {
    if (!mediaFile) {
      return null;
    }

    const mediaType = mediaFile.fileCategory;

    switch (mediaType) {
      case 'video':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={mediaFile.url}
              controls
              className="w-full h-full"
              onEnded={() => {
                // Auto-mark as complete when video ends
                if (!isCompleted && lesson.contentType === 'video') {
                  handleMarkComplete();
                }
              }}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <Headphones className="h-16 w-16 text-mdsc-blue-primary" />
            </div>
            <audio src={mediaFile.url} controls className="w-full">
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        );

      case 'document':
      case 'presentation':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <File className="h-6 w-6 text-mdsc-blue-primary" />
              <div>
                <p className="font-medium text-gray-900">{mediaFile.originalFilename}</p>
                <p className="text-sm text-gray-500">
                  {(mediaFile.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <a
              href={mediaFile.url}
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
              src={mediaFile.url}
              className="w-full h-full rounded-lg border border-gray-200"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">Type de média non supporté</p>
          </div>
        );
    }
  };

  const getContentIcon = () => {
    switch (lesson.contentType) {
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
    <div className={`space-y-6 ${className}`}>
      {/* Lesson Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-3 bg-mdsc-blue-primary/10 rounded-lg">
              {getContentIcon()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
              {lesson.description && (
                <p className="text-gray-600">{lesson.description}</p>
              )}
              {lesson.duration && (
                <p className="text-sm text-gray-500 mt-2">
                  Durée estimée: {lesson.duration} min
                </p>
              )}
            </div>
          </div>
          
          {isCompleted && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Terminée</span>
            </div>
          )}
        </div>

      </div>

      {/* Media Content */}
      {lesson.contentType !== 'quiz' && renderMediaContent()}

      {/* Text Content */}
      {lesson.contentText && lesson.contentType === 'text' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.contentText }}
          />
        </div>
      )}

      {/* Quiz */}
      {lesson.contentType === 'quiz' && (
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 mb-4">Commencez le quiz pour cette leçon</p>
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

      {/* External Content */}
      {lesson.contentUrl && lesson.contentType !== 'video' && lesson.contentType !== 'document' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">Contenu externe:</p>
          <a
            href={lesson.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-white/20 hover:text-white transition-colors"
          >
            Ouvrir le contenu externe
          </a>
        </div>
      )}

      {/* Completion Button */}
      {lesson.contentType !== 'quiz' && !isCompleted && (
        <div className="flex justify-end">
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
        </div>
      )}
    </div>
  );
}
