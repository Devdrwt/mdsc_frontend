'use client';

import React, { useEffect, useState } from 'react';
import { Video, Calendar, Clock, Users, Play, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { liveSessionService } from '../../../../lib/services/liveSessionService';
import { LiveSession, CreateLiveSessionData } from '../../../../types/liveSession';
import { CourseService } from '../../../../lib/services/courseService';
import InstructorService from '../../../../lib/services/instructorService';
import { Course } from '../../../../types/course';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import LiveSessionForm from '../../../../components/live/LiveSessionForm';
import toast from '../../../../lib/utils/toast';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

export default function InstructorLiveSessionsPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Array<LiveSession & { course?: Course }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'instructor') return;
    loadAllSessions();
  }, [user, filter]);

  const loadAllSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger tous les cours du formateur
      const coursesResponse = await InstructorService.getCourses({ limit: 1000 });
      const allCourses = coursesResponse.courses || [];

      // Charger les sessions pour chaque cours
      const sessionsPromises = allCourses.map(async (course: Course) => {
        try {
          const params: any = {};
          if (filter !== 'all') {
            params.status = filter === 'upcoming' ? 'scheduled' : filter;
          }
          const response = await liveSessionService.getCourseSessions(Number(course.id), params);
          
          // Si le cours n'a pas de slug, charger le cours complet pour l'obtenir
          let courseWithSlug = course;
          if (!course.slug && course.id) {
            try {
              const fullCourse = await CourseService.getCourseById(Number(course.id));
              courseWithSlug = { ...course, slug: fullCourse.slug || `course-${course.id}` };
            } catch (err) {
              console.warn(`Impossible de charger le slug pour le cours ${course.id}:`, err);
              courseWithSlug = { ...course, slug: `course-${course.id}` };
            }
          }
          
          return response.data.map((session: LiveSession) => ({
            ...session,
            course: courseWithSlug,
          }));
        } catch (err) {
          console.warn(`Erreur chargement sessions pour cours ${course.id}:`, err);
          return [];
        }
      });

      const sessionsArrays = await Promise.all(sessionsPromises);
      let allSessions = sessionsArrays.flat();

      // Trier par date (les plus récentes en premier)
      allSessions.sort((a, b) => {
        const dateA = new Date(a.scheduled_start_at).getTime();
        const dateB = new Date(b.scheduled_start_at).getTime();
        return dateB - dateA;
      });

      // Filtrer selon le filtre sélectionné
      let filteredSessions = allSessions;
      if (filter === 'upcoming') {
        filteredSessions = allSessions.filter(
          s => s.status === 'scheduled' && new Date(s.scheduled_start_at) > new Date()
        );
      } else if (filter === 'live') {
        filteredSessions = allSessions.filter(s => s.status === 'live');
      } else if (filter === 'past') {
        filteredSessions = allSessions.filter(
          s => s.status === 'ended' || new Date(s.scheduled_end_at) < new Date()
        );
      }

      setSessions(filteredSessions);
    } catch (err: any) {
      console.error('Erreur chargement sessions:', err);
      setError(err.message || 'Impossible de charger les sessions live');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (data: CreateLiveSessionData, courseData?: any) => {
    try {
      let courseId: number | null = null;
      
      // Si courseData est fourni, créer le cours d'abord
      if (courseData) {
        console.log('📤 [CreateSession] Création du cours avec les données:', JSON.stringify(courseData, null, 2));
        try {
          const course = await CourseService.createCourse(courseData);
          console.log('✅ [CreateSession] Cours créé:', course);
          
          // Le backend peut retourner soit course.id, soit course.course_id
          const courseIdValue = (course as any).id || (course as any).course_id;
          console.log('   Course ID brut:', courseIdValue, '(type:', typeof courseIdValue, ')');
          console.log('   Objet complet:', JSON.stringify(course, null, 2));
          
          if (courseIdValue !== undefined && courseIdValue !== null) {
            courseId = typeof courseIdValue === 'number' ? courseIdValue : parseInt(String(courseIdValue), 10);
            
            // Vérifier que la conversion a réussi
            if (!Number.isFinite(courseId) || courseId <= 0) {
              console.error('❌ [CreateSession] ID de cours invalide:', courseIdValue, '→', courseId);
              throw new Error(`ID de cours invalide après création: ${courseIdValue} (converti en: ${courseId})`);
            }
            
            console.log('✅ [CreateSession] ID du cours converti:', courseId, '(type:', typeof courseId, ')');
          } else {
            console.error('❌ [CreateSession] Aucun ID retourné par le backend');
            console.error('   Objet course:', course);
            throw new Error('Le cours a été créé mais aucun ID n\'a été retourné par le backend');
          }
        } catch (courseError: any) {
          console.error('❌ [CreateSession] Erreur lors de la création du cours:', courseError);
          throw new Error(`Impossible de créer le cours: ${courseError.message || courseError}`);
        }
      }
      
      // Créer la session (toujours avec courseId maintenant car on crée toujours un cours)
      if (courseId) {
        console.log('📤 Création de la session pour le cours:', courseId);
        await liveSessionService.createSession(courseId, data);
        console.log('✅ Session créée avec succès');
      } else {
        // Ce cas ne devrait plus arriver car on crée toujours un cours
        throw new Error('Impossible de créer la session : aucun cours associé');
      }
      
      await loadAllSessions();
      setShowCreateForm(false);
      toast.success('Succès', 'Cours et session live créés avec succès');
    } catch (err: any) {
      console.error('❌ Erreur création session:', err);
      const errorMessage = err.message || 'Impossible de créer la session live';
      toast.error('Erreur', errorMessage);
      throw err;
    }
  };

  const handleUpdateSession = async (data: CreateLiveSessionData, courseData?: any) => {
    if (!editingSession) return;
    try {
      // Pour la mise à jour, on ne crée pas de nouveau cours
      await liveSessionService.updateSession(editingSession.id, data);
      await loadAllSessions();
      setEditingSession(null);
      setShowCreateForm(false);
      toast.success('Succès', 'Session mise à jour avec succès');
    } catch (err: any) {
      console.error('Erreur mise à jour session:', err);
      throw err;
    }
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessionToDelete(sessionId);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    try {
      await liveSessionService.deleteSession(sessionToDelete);
      await loadAllSessions();
      toast.success('Succès', 'Session supprimée avec succès');
      setSessionToDelete(null);
    } catch (err: any) {
      console.error('Erreur suppression session:', err);
      toast.error('Erreur', 'Impossible de supprimer la session');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteSession = () => {
    setSessionToDelete(null);
  };

  const handleEditSession = (session: LiveSession) => {
    setEditingSession(session);
    setShowCreateForm(true);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingSession(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            En direct
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-3 py-1 bg-[#F4A53A] text-white text-xs font-semibold rounded-full shadow-sm">
            Programmée
          </span>
        );
      case 'ended':
        return (
          <span className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
            Terminée
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-gray-400 text-white text-xs font-semibold rounded-full">
            Annulée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor" pageTitle="Sessions Live">
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-[#F4A53A]" />
                <h1 className="text-3xl font-bold text-[#F4A53A] dark:text-[#F5B04A]">
                  Mes Sessions Live
                </h1>
              </div>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Nouvelle session
                </button>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez vos sessions en direct indépendamment ou liées à vos cours
            </p>
          </div>

          {/* Formulaire de création/édition */}
          {showCreateForm && (
            <div className="mb-6">
              <LiveSessionForm
                courseId={null}
                session={editingSession || undefined}
                onSubmit={editingSession ? handleUpdateSession : handleCreateSession}
                onCancel={handleCancelForm}
              />
            </div>
          )}

          {/* Filtres */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                filter === 'upcoming'
                  ? 'bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                filter === 'live'
                  ? 'bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              En direct
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                filter === 'past'
                  ? 'bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Passées
            </button>
          </div>

          {/* Liste des sessions */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F4A53A]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucune session {filter !== 'all' ? filter : ''} trouvée
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Cliquez sur "Nouvelle session" pour créer une session live
              </p>
            </div>
          ) : (
            <>
              {!showCreateForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map(session => (
                <div
                  key={session.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
                >
                  {/* En-tête */}
                  <div className="bg-gradient-to-r from-[#F4A53A] via-[#F5B04A] to-[#F4A53A] p-5 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 drop-shadow-sm">{session.title}</h3>
                        {session.course && (
                          <p className="text-sm text-white/90 drop-shadow-sm">
                            Cours: {session.course.title}
                          </p>
                        )}
                        {!session.course && (
                          <p className="text-sm text-white/90 drop-shadow-sm italic">
                            Session indépendante
                          </p>
                        )}
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <div className="p-2 bg-[#FFF4E6] dark:bg-[#F4A53A]/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-[#F4A53A]" />
                      </div>
                      <span className="text-sm font-medium">
                        {format(new Date(session.scheduled_start_at), 'EEEE d MMMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {/* Horaires */}
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <div className="p-2 bg-[#FFF4E6] dark:bg-[#F4A53A]/10 rounded-lg">
                        <Clock className="h-4 w-4 text-[#F4A53A]" />
                      </div>
                      <span className="text-sm font-medium">
                        {format(new Date(session.scheduled_start_at), 'HH:mm')} -{' '}
                        {format(new Date(session.scheduled_end_at), 'HH:mm')}
                      </span>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                      <div className="p-2 bg-[#FFF4E6] dark:bg-[#F4A53A]/10 rounded-lg">
                        <Users className="h-4 w-4 text-[#F4A53A]" />
                      </div>
                      <span className="text-sm font-medium">
                        {session.participants_count || 0} / {session.max_participants} participants
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <Video className="h-4 w-4" />
                        Modifier
                      </button>
                      {(session.status === 'live' || session.status === 'scheduled') && session.course && (
                        <Link
                          href={`/courses/${session.course.slug || `course-${session.course.id}`}/live-sessions/${session.id}/join`}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <Play className="h-4 w-4" />
                          {session.status === 'live' ? 'Rejoindre' : 'Voir'}
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer la session"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={sessionToDelete !== null}
        onClose={cancelDeleteSession}
        onConfirm={confirmDeleteSession}
        title="Supprimer la session"
        message="Êtes-vous sûr de vouloir supprimer cette session ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={isDeleting}
      />
    </AuthGuard>
  );
}

