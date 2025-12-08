'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Play, Square, Loader2 } from 'lucide-react';
import { LiveSession, CreateLiveSessionData, UpdateLiveSessionData } from '../../types/liveSession';
import { liveSessionService } from '../../lib/services/liveSessionService';
import LiveSessionList from './LiveSessionList';
import LiveSessionForm from './LiveSessionForm';
import toast from '../../lib/utils/toast';
import ConfirmModal from '../ui/ConfirmModal';
import { CourseService } from '../../lib/services/courseService';

interface LiveSessionManagerProps {
  courseId: number;
}

export default function LiveSessionManager({ courseId }: LiveSessionManagerProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    loadCourseSlug();
  }, [courseId]);

  const loadCourseSlug = async () => {
    try {
      const course = await CourseService.getCourseById(courseId.toString());
      const courseAny = course as any;
      const slug = courseAny.slug || courseAny.slug_name;
      if (slug) {
        setCourseSlug(slug);
      }
    } catch (err) {
      console.warn('Impossible de charger le slug du cours:', err);
      // On utilisera courseId comme fallback
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await liveSessionService.getCourseSessions(courseId);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Erreur chargement sessions:', err);
      toast.error('Erreur', 'Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateLiveSessionData) => {
    try {
      await liveSessionService.createSession(courseId, data);
      await loadSessions();
      setShowForm(false);
      toast.success('Succès', 'Session créée avec succès');
    } catch (err: any) {
      console.error('Erreur création session:', err);
      throw err;
    }
  };

  const handleUpdate = async (data: UpdateLiveSessionData) => {
    if (!editingSession) return;
    try {
      await liveSessionService.updateSession(editingSession.id, data);
      await loadSessions();
      setEditingSession(null);
      setShowForm(false);
      toast.success('Succès', 'Session mise à jour avec succès');
    } catch (err: any) {
      console.error('Erreur mise à jour session:', err);
      throw err;
    }
  };

  const handleDelete = (sessionId: number) => {
    setSessionToDelete(sessionId);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    try {
      await liveSessionService.deleteSession(sessionToDelete);
      await loadSessions();
      toast.success('Succès', 'Session supprimée avec succès');
      setSessionToDelete(null);
    } catch (err: any) {
      console.error('Erreur suppression session:', err);
      toast.error('Erreur', 'Impossible de supprimer la session');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setSessionToDelete(null);
  };

  const handleStart = async (sessionId: number) => {
    try {
      const response = await liveSessionService.startSession(sessionId);
      await loadSessions();
      toast.success('Succès', 'Session démarrée');
      
      // Rediriger automatiquement le formateur vers Jitsi
      // Utiliser le slug du cours si disponible, sinon utiliser courseId
      const slug = courseSlug || `course-${courseId}`;
      router.push(`/courses/${slug}/live-sessions/${sessionId}/join`);
    } catch (err: any) {
      console.error('Erreur démarrage session:', err);
      toast.error('Erreur', 'Impossible de démarrer la session');
    }
  };

  const handleEnd = async (sessionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session ?')) {
      return;
    }
    try {
      await liveSessionService.endSession(sessionId);
      await loadSessions();
      toast.success('Succès', 'Session terminée');
    } catch (err: any) {
      console.error('Erreur fin session:', err);
      toast.error('Erreur', 'Impossible de terminer la session');
    }
  };

  const handleEdit = (session: LiveSession) => {
    setEditingSession(session);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSession(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#F4A53A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sessions Live
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les sessions en direct pour ce cours
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
          >
            <Plus className="h-5 w-5" />
            Nouvelle session
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <LiveSessionForm
          courseId={courseId}
          session={editingSession || undefined}
          onSubmit={editingSession ? handleUpdate : handleCreate}
          onCancel={handleCancelForm}
        />
      )}

      {/* Liste des sessions avec actions */}
      {!showForm && (
        <div className="space-y-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {session.title}
                  </h3>
                  {session.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {session.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(session.scheduled_start_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>
                      {session.participants_count || 0} / {session.max_participants} participants
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'live'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : session.status === 'scheduled'
                          ? 'bg-[#FFF4E6] text-[#E0942A] dark:bg-[#F4A53A]/20 dark:text-[#F5B04A]'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {session.status === 'live'
                        ? 'En direct'
                        : session.status === 'scheduled'
                        ? 'Programmée'
                        : 'Terminée'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleStart(session.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Démarrer la session"
                    >
                      <Play className="h-5 w-5" />
                    </button>
                  )}
                  {session.status === 'live' && (
                    <button
                      onClick={() => handleEnd(session.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Terminer la session"
                    >
                      <Square className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(session)}
                    className="p-2 text-[#F4A53A] hover:bg-[#FFF4E6] dark:hover:bg-[#F4A53A]/20 rounded-lg transition-colors"
                    title="Modifier la session"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer la session"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune session créée. Cliquez sur "Nouvelle session" pour commencer.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={sessionToDelete !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer la session"
        message="Êtes-vous sûr de vouloir supprimer cette session ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={isDeleting}
      />
    </div>
  );
}

