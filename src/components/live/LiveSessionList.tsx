'use client';

import React, { useState, useEffect } from 'react';
import { LiveSession } from '../../types/liveSession';
import LiveSessionCard from './LiveSessionCard';
import { Loader2, Filter, Calendar } from 'lucide-react';
import { liveSessionService } from '../../lib/services/liveSessionService';

interface LiveSessionListProps {
  courseId: number;
  userRole?: 'student' | 'instructor' | 'admin';
  onSessionClick?: (session: LiveSession) => void;
  onDelete?: (sessionId: number) => void;
}

export default function LiveSessionList({
  courseId,
  userRole = 'student',
  onSessionClick,
  onDelete,
}: LiveSessionListProps) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');

  useEffect(() => {
    loadSessions();
  }, [courseId, filter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter === 'upcoming' ? 'scheduled' : filter;
      }
      const response = await liveSessionService.getCourseSessions(courseId, params);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Erreur chargement sessions:', err);
      setError(err.message || 'Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return session.status === 'scheduled' && new Date(session.scheduled_start_at) > new Date();
    }
    if (filter === 'live') return session.status === 'live';
    if (filter === 'past') {
      return session.status === 'ended' || new Date(session.scheduled_end_at) < new Date();
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#F4A53A] mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Chargement des sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-5 w-5 text-gray-500" />
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
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune session {filter !== 'all' ? filter : ''} trouvée
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map(session => (
            <LiveSessionCard
              key={session.id}
              session={session}
              userRole={userRole}
              onJoin={onSessionClick ? () => onSessionClick(session) : undefined}
              onDelete={onDelete}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

