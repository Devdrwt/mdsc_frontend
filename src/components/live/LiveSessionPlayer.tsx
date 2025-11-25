'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LiveSession } from '../../types/liveSession';
import { liveSessionService } from '../../lib/services/liveSessionService';
import { useAuthStore } from '../../lib/stores/authStore';
import JitsiMeetPlayer from './JitsiMeetPlayer';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from '../../lib/utils/toast';

interface LiveSessionPlayerProps {
  sessionId: number;
  courseSlug?: string;
  courseId?: number;
}

export default function LiveSessionPlayer({
  sessionId,
  courseSlug,
  courseId,
}: LiveSessionPlayerProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionData = await liveSessionService.getSession(sessionId);
      setSession(sessionData);

      // Vérifier les permissions
      if (sessionData.status === 'cancelled') {
        setError('Cette session a été annulée');
        return;
      }

      if (sessionData.status === 'ended') {
        setError('Cette session est terminée');
        return;
      }

      // Joindre automatiquement si la session est live ou à venir
      if (sessionData.status === 'live' || sessionData.status === 'scheduled') {
        await joinSession();
      }
    } catch (err: any) {
      console.error('Erreur chargement session:', err);
      setError(err.message || 'Impossible de charger la session');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    try {
      // Rejoindre la session via l'API
      await liveSessionService.joinSession(sessionId);
      setJoined(true);
    } catch (err: any) {
      console.error('Erreur rejoindre session:', err);
      toast.error('Erreur', 'Impossible de rejoindre la session');
      setError('Impossible de rejoindre la session');
    }
  };

  const handleLeave = async () => {
    try {
      if (session) {
        await liveSessionService.leaveSession(session.id);
      }
      // Rediriger vers la page du cours ou la liste des sessions
      if (courseSlug) {
        router.push(`/courses/${courseSlug}/live-sessions`);
      } else if (courseId) {
        router.push(`/courses/${courseId}/live-sessions`);
      } else {
        router.push('/dashboard/student/live-sessions');
      }
    } catch (err: any) {
      console.error('Erreur quitter session:', err);
      // Rediriger quand même
      if (courseSlug) {
        router.push(`/courses/${courseSlug}/live-sessions`);
      } else {
        router.push('/dashboard/student/live-sessions');
      }
    }
  };

  const handleError = (error: Error) => {
    console.error('Erreur Jitsi:', error);
    toast.error('Erreur', error.message || 'Erreur lors de la connexion à Jitsi Meet');
  };

  const handleJoined = () => {
    console.log('Session rejointe avec succès');
  };

  // Déterminer le rôle
  const getUserRole = (): 'instructor' | 'participant' => {
    if (!session || !user) return 'participant';
    return session.instructor_id === user.id ? 'instructor' : 'participant';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Chargement de la session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-center mb-6">
          <p className="text-red-500 font-semibold mb-2 text-lg">
            {error || 'Session non trouvée'}
          </p>
          <p className="text-gray-400">
            Impossible d'accéder à cette session live
          </p>
        </div>
        <div className="flex gap-4">
          {courseSlug && (
            <Link
              href={`/courses/${courseSlug}/live-sessions`}
              className="px-6 py-3 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour aux sessions
            </Link>
          )}
          <Link
            href="/dashboard/student/live-sessions"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Mes sessions
          </Link>
        </div>
      </div>
    );
  }

  // Si la session n'est pas encore rejointe, afficher un écran d'attente
  if (!joined && (session.status === 'scheduled' || session.status === 'live')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">{session.title}</h2>
          <p className="text-gray-400 mb-6">{session.description}</p>
          <div className="space-y-2 mb-8">
            <p className="text-sm text-gray-500">
              Date: {new Date(session.scheduled_start_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {session.status === 'scheduled' && (
              <p className="text-yellow-400 text-sm">
                ⏰ La session commencera bientôt
              </p>
            )}
          </div>
          <button
            onClick={joinSession}
            className="px-6 py-3 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
          >
            Rejoindre la session
          </button>
        </div>
      </div>
    );
  }

  // Afficher le player Jitsi
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <JitsiMeetPlayer
        session={session}
        role={getUserRole()}
        onLeave={handleLeave}
        onError={handleError}
        onJoined={handleJoined}
      />
    </div>
  );
}

