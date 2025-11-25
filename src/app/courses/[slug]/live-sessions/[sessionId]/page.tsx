'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, Video, Play } from 'lucide-react';
import Link from 'next/link';
import { LiveSession } from '../../../../../types/liveSession';
import { liveSessionService } from '../../../../../lib/services/liveSessionService';
import { useAuthStore } from '../../../../../lib/stores/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function LiveSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const sessionId = parseInt(params.sessionId as string);
  const { user } = useAuthStore();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await liveSessionService.getSession(sessionId);
      setSession(sessionData);
    } catch (err: any) {
      console.error('Erreur chargement session:', err);
    } finally {
      setLoading(false);
    }
  };

  const canJoin = () => {
    if (!session) return false;
    return (
      (session.status === 'live' || session.status === 'scheduled') &&
      session.status !== 'cancelled' &&
      session.status !== 'ended'
    );
  };

  const handleJoin = () => {
    if (session) {
      router.push(`/courses/${slug}/live-sessions/${sessionId}/join`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Session non trouvée</p>
          <Link
            href={`/courses/${slug}/live-sessions`}
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          href={`/courses/${slug}/live-sessions`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour aux sessions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {session.title}
        </h1>
        {session.description && (
          <p className="text-gray-600 dark:text-gray-400">{session.description}</p>
        )}
      </div>

      {/* Informations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {format(new Date(session.scheduled_start_at), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Horaire</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {format(new Date(session.scheduled_start_at), 'HH:mm')} -{' '}
                {format(new Date(session.scheduled_end_at), 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {session.participants_count || 0} / {session.max_participants}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Video className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {session.status === 'live' ? 'En direct' :
                 session.status === 'scheduled' ? 'Programmée' :
                 session.status === 'ended' ? 'Terminée' : 'Annulée'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructeur */}
        {session.instructor && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Formateur</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {session.instructor.first_name} {session.instructor.last_name}
            </p>
          </div>
        )}

        {/* Bouton rejoindre */}
        {canJoin() && (
          <div className="mt-6">
            <button
              onClick={handleJoin}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Play className="h-5 w-5" />
              {session.status === 'live' ? 'Rejoindre la session' : 'Rejoindre quand disponible'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

