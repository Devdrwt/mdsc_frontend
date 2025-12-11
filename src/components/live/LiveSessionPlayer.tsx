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
  const [shouldRedirect, setShouldRedirect] = useState<{ type: 'waiting-room' | null; courseId?: number }>({ type: null });

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Gérer les redirections dans un useEffect séparé pour éviter l'erreur React
  useEffect(() => {
    if (shouldRedirect.type === 'waiting-room' && shouldRedirect.courseId) {
      router.push(`/learn/${shouldRedirect.courseId}/waiting-room`);
    }
  }, [shouldRedirect, router]);

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

      // Si la session est programmée et n'a pas encore démarré, rediriger vers la salle d'attente
      if (sessionData.status === 'scheduled') {
        const scheduledStart = new Date(sessionData.scheduled_start_at);
        const now = new Date();
        
        if (now < scheduledStart) {
          // Définir la redirection (sera gérée par useEffect)
          const courseId = sessionData.course_id || sessionData.course?.id;
          if (courseId) {
            setShouldRedirect({ type: 'waiting-room', courseId });
            return;
          }
        }
      }

      // Joindre automatiquement si la session est live
      if (sessionData.status === 'live') {
        // Vérifier le rôle avant de joindre (formateur = moderator pour avoir les droits de modération)
        const role = sessionData.instructor_id === user?.id ? 'moderator' : 'participant';
        
        // Pour les utilisateurs, rediriger directement vers Jitsi (pas besoin de joinSession)
        if (role === 'participant') {
          // Les utilisateurs sont redirigés directement vers Jitsi dans joinSession
          await joinSession();
        } else {
          // Pour le formateur (moderator), utiliser le composant React (appeler joinSession mais ne pas rediriger)
          await joinSession();
        }
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
      const joinResponse = await liveSessionService.joinSession(sessionId);
      setJoined(true);
      
      // Si c'est un utilisateur (participant) et que la session est live, rediriger directement vers Jitsi
      // Utiliser session ou sessionData pour déterminer le rôle
      const currentSession = session || (await liveSessionService.getSession(sessionId));
      const role = currentSession.instructor_id === user?.id ? 'moderator' : 'participant';
      
      // IMPORTANT : Seulement pour les utilisateurs (participants), rediriger directement vers Jitsi
      // Les formateurs (moderators) utilisent le composant React JitsiMeetPlayer
      if (role === 'participant' && currentSession.status === 'live') {
        // Construire l'URL Jitsi à partir de la réponse ou des données de session
        let jitsiUrl = joinResponse?.jitsi_join_url;
        
        // Si l'URL n'est pas dans la réponse, la construire à partir des données de session
        if (!jitsiUrl && currentSession) {
          const jitsiDomain = currentSession.jitsi_server_url
            ? (() => {
                try {
                  return new URL(currentSession.jitsi_server_url).hostname;
                } catch {
                  return currentSession.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0];
                }
              })()
            : 'meet.jit.si';
          
          const urlParams = new URLSearchParams();
          
          // Ajouter le mot de passe si disponible
          if (joinResponse?.jitsi_room_password || currentSession.jitsi_room_password) {
            urlParams.append('pwd', joinResponse?.jitsi_room_password || currentSession.jitsi_room_password || '');
          }
          
          // Ajouter le nom d'utilisateur si disponible
          if (user) {
            urlParams.append('userInfo.displayName', `${user.firstName} ${user.lastName}`.trim());
          }
          
          const queryString = urlParams.toString();
          jitsiUrl = `https://${jitsiDomain}/${currentSession.jitsi_room_name}${queryString ? `?${queryString}` : ''}`;
        }
        
        // Rediriger directement vers l'URL Jitsi (ÉTUDIANTS UNIQUEMENT)
        if (jitsiUrl) {
          console.log('🔗 [ÉTUDIANT] Redirection directe vers Jitsi Meet:', jitsiUrl);
          toast.success('Redirection', 'Redirection vers la session Jitsi Meet...');
          // Utiliser window.location.href pour une redirection complète (nouvelle page)
          window.location.href = jitsiUrl;
          return;
        }
      }
      
      // Pour les formateurs, ne pas rediriger - ils utilisent le composant React
      if (role === 'moderator') {
        console.log('👨‍🏫 [INSTRUCTEUR] Utilisation du composant React JitsiMeetPlayer');
      }
    } catch (err: any) {
      console.error('Erreur rejoindre session:', err);
      
      const errorMessage = err?.message || err?.toString() || '';
      const isParticipationError = errorMessage.includes('Participation non trouvée') || 
                                   errorMessage.includes('participation') ||
                                   err?.status === 404;
      
      if (isParticipationError) {
        // Si l'erreur est liée à la participation, essayer quand même de construire l'URL Jitsi
        // et rediriger directement
        console.warn('⚠️ Participation non trouvée, mais redirection vers Jitsi autorisée');
        
        if (session && session.status === 'live') {
          const role = session.instructor_id === user?.id ? 'moderator' : 'participant';
          if (role === 'participant') {
            // Construire l'URL Jitsi directement
            const jitsiDomain = session.jitsi_server_url
              ? (() => {
                  try {
                    return new URL(session.jitsi_server_url).hostname;
                  } catch {
                    return session.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0];
                  }
                })()
              : 'meet.jit.si';
            
            const urlParams = new URLSearchParams();
            
            // Ajouter le mot de passe si disponible
            if (session.jitsi_room_password) {
              urlParams.append('pwd', session.jitsi_room_password);
            }
            
            // Ajouter le nom d'utilisateur si disponible
            if (user) {
              urlParams.append('userInfo.displayName', `${user.firstName} ${user.lastName}`.trim());
            }
            
            const queryString = urlParams.toString();
            const jitsiUrl = `https://${jitsiDomain}/${session.jitsi_room_name}${queryString ? `?${queryString}` : ''}`;
            
            console.log('🔗 Redirection vers Jitsi Meet (sans participation):', jitsiUrl);
            toast.warning('Avertissement', 'Redirection vers Jitsi Meet...');
            window.location.href = jitsiUrl;
            return;
          }
        }
        
        toast.warning('Avertissement', 'Participation non enregistrée, mais vous pouvez rejoindre la session');
        setJoined(true); // Permettre l'accès quand même
      } else {
        // Pour les autres erreurs, afficher un message d'erreur
        toast.error('Erreur', 'Impossible de rejoindre la session');
        setError('Impossible de rejoindre la session');
      }
    }
  };

  const handleLeave = async () => {
    try {
      if (session) {
        await liveSessionService.leaveSession(session.id);
      }
    } catch (err: any) {
      console.error('Erreur quitter session:', err);
      
      // Si l'erreur est "Participation non trouvée", c'est non-bloquant
      // L'utilisateur peut quitter même sans participation enregistrée
      const errorMessage = err?.message || err?.toString() || '';
      const isParticipationError = errorMessage.includes('Participation non trouvée') || 
                                   errorMessage.includes('participation') ||
                                   err?.status === 404;
      
      if (!isParticipationError) {
        // Pour les autres erreurs, afficher un avertissement mais continuer
        console.warn('Erreur lors de la sortie de session, mais redirection effectuée:', err);
      }
      // Dans tous les cas, rediriger l'utilisateur
    } finally {
      // Rediriger vers la page du cours ou la liste des sessions (toujours, même en cas d'erreur)
      if (courseSlug) {
        router.push(`/courses/${courseSlug}/live-sessions`);
      } else if (courseId) {
        router.push(`/courses/${courseId}/live-sessions`);
      } else {
        // Déterminer si c'est un formateur ou un utilisateur pour la redirection
        const role = session?.instructor_id === user?.id ? 'instructor' : 'student';
        if (role === 'instructor') {
          router.push('/dashboard/instructor/live-sessions');
        } else {
          router.push('/dashboard/student/live-sessions');
        }
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

  // Déterminer le rôle (instructor devient moderator pour avoir les droits de modération dans Jitsi)
  const getUserRole = (): 'instructor' | 'participant' | 'moderator' => {
    if (!session || !user) return 'participant';
    // Le formateur est automatiquement modérateur pour encadrer la session
    return session.instructor_id === user.id ? 'moderator' : 'participant';
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

  // Si la session est programmée et n'a pas encore démarré, rediriger vers la salle d'attente
  // Cette redirection est gérée dans useEffect pour éviter l'erreur React
  if (session.status === 'scheduled') {
    const scheduledStart = new Date(session.scheduled_start_at);
    const now = new Date();
    
    if (now < scheduledStart) {
      const courseId = session.course_id || session.course?.id;
      if (courseId && shouldRedirect.type !== 'waiting-room') {
        setShouldRedirect({ type: 'waiting-room', courseId });
      }
      // Afficher un loader pendant la redirection
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p className="text-lg">Redirection vers la salle d'attente...</p>
        </div>
      );
    }
  }

  // Si la session n'est pas encore rejointe mais est live, afficher un écran d'attente
  if (!joined && session.status === 'live') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">{session.title}</h2>
          <p className="text-gray-400 mb-6">{session.description}</p>
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

