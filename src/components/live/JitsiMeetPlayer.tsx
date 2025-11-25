'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, X, Users, Loader2, AlertCircle } from 'lucide-react';
import { loadJitsiScript, isJitsiLoaded } from '../../lib/utils/jitsiLoader';
import { useAuthStore } from '../../lib/stores/authStore';
import { LiveSession } from '../../types/liveSession';
import { liveSessionService } from '../../lib/services/liveSessionService';
import toast from '../../lib/utils/toast';

declare global {
  interface Window {
    JitsiMeetJS: any;
  }
}

interface JitsiMeetPlayerProps {
  session: LiveSession;
  role: 'instructor' | 'participant';
  onLeave?: () => void;
  onError?: (error: Error) => void;
  onJoined?: () => void;
}

export default function JitsiMeetPlayer({
  session,
  role,
  onLeave,
  onError,
  onJoined,
}: JitsiMeetPlayerProps) {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [remoteTracks, setRemoteTracks] = useState<Map<string, any>>(new Map());
  const [jitsiToken, setJitsiToken] = useState<string | null>(null);
  
  const connectionRef = useRef<any>(null);
  const conferenceRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialisation de Jitsi
  useEffect(() => {
    let mounted = true;

    const initJitsi = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger le script Jitsi
        await loadJitsiScript();
        
        if (!mounted) return;

        if (!window.JitsiMeetJS) {
          throw new Error('JitsiMeetJS not loaded');
        }

        // Obtenir le token Jitsi depuis le backend
        let token: string | null = null;
        try {
          const tokenResponse = await liveSessionService.getJitsiToken(session.id, role);
          token = tokenResponse.jwt;
          setJitsiToken(token);
        } catch (err: any) {
          console.warn('Impossible d\'obtenir le token Jitsi, connexion sans JWT:', err);
          // Continuer sans JWT (fonctionne pour les serveurs publics)
        }

        // Initialiser JitsiMeetJS
        window.JitsiMeetJS.init({
          enableLayerSuspension: true,
          disableThirdPartyRequests: false,
        });

        // Extraire le domaine du serveur Jitsi
        const jitsiDomain = session.jitsi_server_url
          ? session.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0]
          : 'meet.jit.si';

        // Options de connexion
        const connectionOptions: any = {
          hosts: {
            domain: jitsiDomain,
            muc: `conference.${jitsiDomain}`,
          },
          serviceUrl: `https://${jitsiDomain}/http-bind`,
          clientNode: 'https://jitsi.org/jitsi-meet',
        };

        // Ajouter le JWT si disponible
        if (token) {
          connectionOptions.jwt = token;
        }

        // Créer la connexion
        const connection = new window.JitsiMeetJS.JitsiConnection(
          null,
          null,
          connectionOptions
        );

        // Événements de connexion
        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
          () => {
            if (!mounted) return;
            console.log('✅ Connexion établie');
            setIsConnected(true);
            createConference(connection);
          }
        );

        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
          (error: any) => {
            if (!mounted) return;
            console.error('❌ Échec de connexion:', error);
            const errorMsg = 'Échec de connexion à Jitsi Meet';
            setError(errorMsg);
            onError?.(new Error(errorMsg));
          }
        );

        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
          () => {
            if (!mounted) return;
            console.log('🔌 Connexion fermée');
            setIsConnected(false);
            setIsJoined(false);
          }
        );

        connectionRef.current = connection;
        connection.connect();

      } catch (err: any) {
        if (!mounted) return;
        console.error('Erreur initialisation Jitsi:', err);
        const errorMsg = err.message || 'Erreur lors de l\'initialisation de Jitsi Meet';
        setError(errorMsg);
        onError?.(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initJitsi();

    // Cleanup
    return () => {
      mounted = false;
      if (conferenceRef.current) {
        try {
          conferenceRef.current.leave();
        } catch (e) {
          console.error('Erreur lors de la sortie de conférence:', e);
        }
      }
      if (connectionRef.current) {
        try {
          connectionRef.current.disconnect();
        } catch (e) {
          console.error('Erreur lors de la déconnexion:', e);
        }
      }
      localTracks.forEach(track => {
        try {
          track.dispose();
        } catch (e) {
          console.error('Erreur lors de la suppression de piste:', e);
        }
      });
    };
  }, [session]);

  // Créer la conférence
  const createConference = useCallback((connection: any) => {
    try {
      const conferenceOptions: any = {
        openBridgeChannel: true,
        enableLayerSuspension: true,
      };

      // Créer la conférence
      const conference = connection.initJitsiConference(
        session.jitsi_room_name,
        conferenceOptions
      );

      // Événements de conférence
      conference.on(
        window.JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        () => {
          console.log('✅ Conférence rejointe');
          setIsJoined(true);
          onJoined?.();
          createLocalTracks();
        }
      );

      conference.on(
        window.JitsiMeetJS.events.conference.USER_JOINED,
        (id: string, user: any) => {
          console.log('👤 Utilisateur rejoint:', id, user);
          updateParticipants();
        }
      );

      conference.on(
        window.JitsiMeetJS.events.conference.USER_LEFT,
        (id: string) => {
          console.log('👋 Utilisateur parti:', id);
          removeRemoteTrack(id);
          updateParticipants();
        }
      );

      conference.on(
        window.JitsiMeetJS.events.conference.TRACK_ADDED,
        (track: any) => {
          console.log('📹 Piste ajoutée:', track);
          if (track.isLocal()) {
            addLocalTrack(track);
          } else {
            addRemoteTrack(track);
          }
        }
      );

      conference.on(
        window.JitsiMeetJS.events.conference.TRACK_REMOVED,
        (track: any) => {
          console.log('📹 Piste retirée:', track);
          if (track.isLocal()) {
            removeLocalTrack(track);
          } else {
            removeRemoteTrack(track.getParticipantId());
          }
        }
      );

      conference.on(
        window.JitsiMeetJS.events.conference.VIDEO_CONFERENCE_JOINED,
        () => {
          console.log('🎥 Vidéoconférence rejointe');
        }
      );

      // Configurer les contraintes vidéo (qualité)
      conference.setReceiverConstraints({
        lastN: 20, // Nombre max de vidéos à recevoir
        defaultConstraints: { maxHeight: 360 }, // Qualité par défaut (360p)
      });

      conferenceRef.current = conference;
      conference.join();
    } catch (err: any) {
      console.error('Erreur création conférence:', err);
      const errorMsg = err.message || 'Erreur lors de la création de la conférence';
      setError(errorMsg);
      onError?.(err);
    }
  }, [session, onJoined]);

  // Créer les pistes locales (caméra, micro)
  const createLocalTracks = useCallback(async () => {
    try {
      const options: any = {
        devices: ['audio', 'video'],
        resolution: 720, // 720p par défaut
        cameraDeviceId: undefined,
        micDeviceId: undefined,
      };

      const tracks = await window.JitsiMeetJS.createLocalTracks(options);
      const newTracks: any[] = [];

      tracks.forEach((track: any) => {
        if (track.isVideoTrack()) {
          // Attacher la vidéo locale
          if (localVideoRef.current) {
            track.attach(localVideoRef.current);
          }
          setIsVideoEnabled(true);
        } else if (track.isAudioTrack()) {
          setIsAudioEnabled(true);
        }
        newTracks.push(track);
        conferenceRef.current?.addTrack(track);
      });

      setLocalTracks(newTracks);
    } catch (err: any) {
      console.error('Erreur création pistes locales:', err);
      // Continuer même si la caméra/micro ne fonctionne pas
      toast.warning('Avertissement', 'Impossible d\'accéder à la caméra ou au micro. Vous pouvez continuer sans.');
    }
  }, []);

  // Ajouter une piste locale
  const addLocalTrack = useCallback((track: any) => {
    setLocalTracks(prev => [...prev, track]);
  }, []);

  // Retirer une piste locale
  const removeLocalTrack = useCallback((track: any) => {
    setLocalTracks(prev => prev.filter(t => t !== track));
    try {
      track.dispose();
    } catch (e) {
      console.error('Erreur suppression piste locale:', e);
    }
  }, []);

  // Ajouter une piste distante
  const addRemoteTrack = useCallback((track: any) => {
    const participantId = track.getParticipantId();
    setRemoteTracks(prev => {
      const newMap = new Map(prev);
      newMap.set(participantId, track);
      return newMap;
    });

    // Créer un élément vidéo pour cette piste
    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.id = `remote-video-${participantId}`;
    videoElement.className = 'w-full h-full object-cover rounded-lg';
    track.attach(videoElement);

    if (remoteVideosRef.current) {
      remoteVideosRef.current.appendChild(videoElement);
    }
  }, []);

  // Retirer une piste distante
  const removeRemoteTrack = useCallback((participantId: string) => {
    setRemoteTracks(prev => {
      const newMap = new Map(prev);
      const track = newMap.get(participantId);
      if (track) {
        try {
          track.dispose();
        } catch (e) {
          console.error('Erreur suppression piste distante:', e);
        }
        const videoElement = document.getElementById(`remote-video-${participantId}`);
        if (videoElement) {
          videoElement.remove();
        }
      }
      newMap.delete(participantId);
      return newMap;
    });
  }, []);

  // Mettre à jour la liste des participants
  const updateParticipants = useCallback(() => {
    if (conferenceRef.current) {
      try {
        const participantsList = conferenceRef.current.getParticipants();
        setParticipants(participantsList || []);
      } catch (e) {
        console.error('Erreur récupération participants:', e);
      }
    }
  }, []);

  // Toggle vidéo
  const toggleVideo = useCallback(() => {
    localTracks.forEach(track => {
      if (track.isVideoTrack()) {
        try {
          if (isVideoEnabled) {
            track.mute();
            setIsVideoEnabled(false);
          } else {
            track.unmute();
            setIsVideoEnabled(true);
          }
        } catch (e) {
          console.error('Erreur toggle vidéo:', e);
        }
      }
    });
  }, [localTracks, isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    localTracks.forEach(track => {
      if (track.isAudioTrack()) {
        try {
          if (isAudioEnabled) {
            track.mute();
            setIsAudioEnabled(false);
          } else {
            track.unmute();
            setIsAudioEnabled(true);
          }
        } catch (e) {
          console.error('Erreur toggle audio:', e);
        }
      }
    });
  }, [localTracks, isAudioEnabled]);

  // Partage d'écran
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Arrêter le partage
        localTracks.forEach(track => {
          if (track.isVideoTrack()) {
            const stream = track.getOriginalStream();
            const videoTracks = stream?.getVideoTracks();
            if (videoTracks?.[0]?.label === 'screen' || videoTracks?.[0]?.label?.includes('screen')) {
              conferenceRef.current?.removeTrack(track);
              track.dispose();
              createLocalTracks(); // Recréer la caméra
            }
          }
        });
        setIsScreenSharing(false);
      } else {
        // Démarrer le partage
        const screenTracks = await window.JitsiMeetJS.createLocalTracks({
          devices: ['desktop'],
        });
        if (screenTracks.length > 0) {
          conferenceRef.current?.addTrack(screenTracks[0]);
          setIsScreenSharing(true);
        }
      }
    } catch (err: any) {
      console.error('Erreur partage d\'écran:', err);
      toast.error('Erreur', 'Impossible de partager l\'écran');
    }
  }, [isScreenSharing, localTracks, createLocalTracks]);

  // Quitter la session
  const handleLeave = useCallback(() => {
    try {
      if (conferenceRef.current) {
        conferenceRef.current.leave();
      }
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
      localTracks.forEach(track => {
        try {
          track.dispose();
        } catch (e) {
          console.error('Erreur nettoyage piste:', e);
        }
      });
      onLeave?.();
    } catch (err: any) {
      console.error('Erreur lors de la sortie:', err);
      onLeave?.();
    }
  }, [localTracks, onLeave]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Chargement de Jitsi Meet...</p>
        <p className="text-sm text-gray-400 mt-2">Connexion à la session en cours</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-red-500 mb-4 text-center">
          <p className="font-semibold mb-2">❌ {error}</p>
          <p className="text-sm text-gray-400">Impossible de se connecter à la session</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* En-tête */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div>
          <h3 className="text-white font-semibold text-lg">{session.title}</h3>
          <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
            {isJoined ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connecté
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                Connexion...
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="h-5 w-5" />
            <span className="text-sm">{participants.length + 1}</span>
          </div>
          <button
            onClick={handleLeave}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Quitter la session"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Zone vidéo */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        {/* Vidéo locale (petite fenêtre en bas à droite) */}
        {localVideoRef.current && (
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-[#F4A53A] shadow-2xl z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="h-12 w-12 text-gray-600" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
              {user?.firstName} {user?.lastName} (Vous)
            </div>
          </div>
        )}

        {/* Vidéos distantes */}
        <div
          ref={remoteVideosRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full overflow-y-auto"
        >
          {/* Les vidéos distantes sont ajoutées dynamiquement ici */}
        </div>

        {remoteTracks.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">En attente d'autres participants...</p>
              <p className="text-sm text-gray-500 mt-2">Les vidéos des autres participants apparaîtront ici</p>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={isVideoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-all duration-300 ${
              isScreenSharing
                ? 'bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white hover:from-[#E0942A] hover:to-[#F4A53A] shadow-md'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
          >
            <Monitor className="h-6 w-6" />
          </button>

          <button
            onClick={handleLeave}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="Quitter la session"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

