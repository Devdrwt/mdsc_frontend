'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Video, Play, Loader2 } from 'lucide-react';
import { StudentLiveSessions, LiveSession } from '../../../../types/liveSession';
import { liveSessionService } from '../../../../lib/services/liveSessionService';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentLiveSessionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudentLiveSessions>({
    upcoming: [],
    live: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await liveSessionService.getStudentSessions();
      setSessions(data);
    } catch (err: any) {
      console.error('Erreur chargement sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSessionCard = (session: LiveSession) => {
    const canJoin = session.status === 'live' || (session.status === 'scheduled' && new Date(session.scheduled_start_at) > new Date());
    
    return (
      <div
        key={session.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
          {session.course && (
            <p className="text-sm text-blue-100">{session.course.title}</p>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(session.scheduled_start_at), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(session.scheduled_start_at), 'HH:mm')} -{' '}
              {format(new Date(session.scheduled_end_at), 'HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {session.participants_count || 0} / {session.max_participants} participants
            </span>
          </div>
          {canJoin && session.course?.slug && (
            <Link
              href={`/courses/${session.course.slug}/live-sessions/${session.id}/join`}
              className="block w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Play className="h-4 w-4" />
              {session.status === 'live' ? 'Rejoindre' : 'Rejoindre la session'}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#F4A53A] dark:text-[#F5B04A] mb-6">
        Mes Sessions Live
      </h1>

      {/* Sessions en direct */}
      {sessions.live.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            En direct ({sessions.live.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.live.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Sessions à venir */}
      {sessions.upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            À venir ({sessions.upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.upcoming.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Sessions passées */}
      {sessions.past.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Passées ({sessions.past.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.past.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Aucune session */}
      {sessions.live.length === 0 && sessions.upcoming.length === 0 && sessions.past.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez aucune session live pour le moment
          </p>
        </div>
      )}
    </div>
  );
}

