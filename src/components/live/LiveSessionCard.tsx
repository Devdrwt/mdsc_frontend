'use client';

import React from 'react';
import { Calendar, Clock, Users, Video, Play, X } from 'lucide-react';
import { LiveSession } from '../../types/liveSession';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveSessionCardProps {
  session: LiveSession;
  onJoin?: (sessionId: number) => void;
  onDelete?: (sessionId: number) => void;
  showActions?: boolean;
  userRole?: 'student' | 'instructor' | 'admin';
}

export default function LiveSessionCard({
  session,
  onJoin,
  onDelete,
  showActions = true,
  userRole = 'student',
}: LiveSessionCardProps) {
  const isUpcoming = new Date(session.scheduled_start_at) > new Date();
  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended' || session.status === 'cancelled';
  const canJoin = (isUpcoming || isLive) && !isEnded;

  const getStatusBadge = () => {
    switch (session.status) {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group">
      {/* En-tête avec statut */}
      <div className="bg-gradient-to-r from-[#F4A53A] via-[#F5B04A] to-[#F4A53A] p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 drop-shadow-sm">{session.title}</h3>
            {session.description && (
              <p className="text-sm text-white/90 line-clamp-2 drop-shadow-sm">{session.description}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        {/* Informations de date */}
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

        {/* Instructeur */}
        {session.instructor && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Formateur :</span>{' '}
            {session.instructor.first_name} {session.instructor.last_name}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            {canJoin && (
              <Link
                href={`/courses/${session.course?.slug || session.course_id}/live-sessions/${session.id}/join`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                <Play className="h-4 w-4" />
                {isLive ? 'Rejoindre' : 'Rejoindre la session'}
              </Link>
            )}
            {userRole === 'instructor' && onDelete && (
              <button
                onClick={() => onDelete(session.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Supprimer la session"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

