'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseService } from '../../../../lib/services/courseService';
import { mediaService } from '../../../../lib/services/mediaService';
import { LiveSessionService } from '../../../../lib/services/liveSessionService';
import { Course } from '../../../../types/course';
import { MediaFile } from '../../../../types/course';
import { LiveSession } from '../../../../types/liveSession';
import { Loader2, FileText, Download, Clock, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from '../../../../lib/utils/toast';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useAuthStore } from '../../../../lib/stores/authStore';
import Link from 'next/link';

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params?.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [supportFiles, setSupportFiles] = useState<MediaFile[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData = await CourseService.getCourseById(courseId);
      setCourse(courseData as unknown as Course);
      
      // Charger les fichiers de support du cours (documents uniquement)
      try {
        const mediaFiles = await mediaService.getCourseMedia(courseId);
        // Filtrer pour ne garder que les documents
        const documents = mediaFiles.filter(
          (file: MediaFile) => {
            const fileAny = file as any;
            return fileAny.file_category === 'document' ||
              fileAny.fileCategory === 'document' ||
              (fileAny.content_type && ['document', 'presentation'].includes(fileAny.content_type));
          }
        );
        setSupportFiles(documents);
      } catch (mediaError) {
        console.warn('Impossible de charger les fichiers de support:', mediaError);
        setSupportFiles([]);
      }
      
      // Charger les sessions live du cours après avoir chargé le cours
      const courseAny = courseData as any;
      const courseIdNum = courseAny.id || courseAny.course_id || parseInt(courseId, 10);
      if (courseIdNum) {
        try {
          const sessionsResponse = await LiveSessionService.getCourseSessions(courseIdNum);
          setLiveSessions(sessionsResponse.data || []);
        } catch (sessionError) {
          console.warn('Impossible de charger les sessions live:', sessionError);
          setLiveSessions([]);
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
      setError(err.message || 'Impossible de charger le cours');
      toast.error('Erreur', 'Impossible de charger le cours');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSessionStarted = () => {
    if (!course) return false;
    const courseAny = course as any;
    const courseStartDate = courseAny.course_start_date || courseAny.courseStartDate;
    if (!courseStartDate) return false;
    
    const startDate = new Date(courseStartDate);
    const now = new Date();
    return now >= startDate;
  };

  const checkIfLiveSessionStarted = async (): Promise<LiveSession | null> => {
    try {
      if (!course) return null;
      
      const courseAny = course as any;
      const courseIdNum = courseAny.id || courseAny.course_id || parseInt(courseId, 10);
      if (!courseIdNum) return null;
      
      // Récupérer les sessions live du cours (recharger pour avoir les dernières données)
      const sessionsResponse = await LiveSessionService.getCourseSessions(courseIdNum);
      const sessions = sessionsResponse.data || [];
      
      // Mettre à jour le state avec les dernières sessions
      setLiveSessions(sessions);
      
      // Chercher une session avec le statut "live"
      const liveSession = sessions.find(
        (session: LiveSession) => 
          session.status === 'live' || 
          (session as any).session_status === 'live'
      );
      
      return liveSession || null;
    } catch (error) {
      console.warn('Erreur lors de la vérification des sessions live:', error);
      return null;
    }
  };

  useEffect(() => {
    // Vérifier périodiquement si le cours a démarré ou si une session live a démarré
    if (course) {
      const interval = setInterval(async () => {
        // Vérifier d'abord si une session live a démarré (priorité)
        const liveSession = await checkIfLiveSessionStarted();
        if (liveSession) {
          // Afficher un message avant la redirection
          toast.success('Session live démarrée', 'Redirection vers la session en cours...');
          
          // Rediriger vers la session live
          const courseAny = course as any;
          const courseSlug = courseAny.slug || `course-${courseAny.id || courseAny.course_id || courseId}`;
          
          // Utiliser replace pour éviter de revenir à la salle d'attente avec le bouton retour
          router.replace(`/courses/${courseSlug}/live-sessions/${liveSession.id}/join`);
          return;
        }
        
        // Sinon, vérifier si le cours a démarré (date de début)
        if (checkIfSessionStarted()) {
          // Rediriger vers la page du cours
          router.push(`/learn/${courseId}`);
        }
      }, 5000); // Vérifier toutes les 5 secondes pour une meilleure réactivité
      
      return () => clearInterval(interval);
    }
  }, [course, courseId, router]);

  const getDownloadUrl = (file: MediaFile) => {
    if (file.url) return file.url;
    if (file.id) return mediaService.getDownloadUrl(file.id.toString());
    return '#';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de la salle d'attente...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Cours non trouvé'}</p>
            <Link
              href="/dashboard/student/courses"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à mes cours
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const courseAny = course as any;
  const courseStartDate = courseAny.course_start_date || courseAny.courseStartDate;
  const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
  const startDate = courseStartDate ? new Date(courseStartDate) : null;
  const now = new Date();
  const timeUntilStart = startDate ? Math.max(0, startDate.getTime() - now.getTime()) : 0;
  const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));
  const minutesUntilStart = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <DashboardLayout userRole="student">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gold-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                {course.description && (
                  <p className="text-gray-600 mb-4">{course.description}</p>
                )}
              </div>
              <Link
                href={`/learn/${courseId}`}
                className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au cours
              </Link>
            </div>

            {/* Compte à rebours */}
            {startDate && now < startDate && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Le cours commencera dans :</p>
                    <div className="flex items-center space-x-4">
                      {hoursUntilStart > 0 && (
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{hoursUntilStart}</div>
                          <div className="text-xs text-gray-600">Heures</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{minutesUntilStart}</div>
                        <div className="text-xs text-gray-600">Minutes</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(startDate, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                    </div>
                    {courseEndDate && (
                      <div className="text-xs text-gray-500">
                        Jusqu'à {format(new Date(courseEndDate), "HH:mm", { locale: fr })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {startDate && now >= startDate && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-medium">
                  ✅ Le cours a démarré ! Vous pouvez maintenant y accéder.
                </p>
                <Link
                  href={`/learn/${courseId}`}
                  className="inline-flex items-center mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accéder au cours
                </Link>
              </div>
            )}
          </div>

          {/* Support du cours */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Support du cours</h2>
            </div>

            {supportFiles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun support de cours disponible pour le moment</p>
                <p className="text-sm text-gray-500">
                  L'instructeur peut ajouter des documents de support avant le début du cours
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {supportFiles.map((file) => {
                  const downloadUrl = getDownloadUrl(file);
                  const fileName = file.original_filename || file.originalFilename || file.filename || 'Document';
                  const fileSize = file.file_size || file.fileSize;
                  
                  const fileAny = file as any;
                  return (
                    <div
                      key={file.id || fileAny.file_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate mb-1" title={fileName}>
                            {fileName}
                          </h3>
                          {fileSize && (
                            <p className="text-xs text-gray-500 mb-2">{formatFileSize(fileSize)}</p>
                          )}
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

