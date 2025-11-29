# Guide d'implémentation - Jitsi Meet API (lib-jitsi-meet)

## 📚 Vue d'ensemble

Ce guide détaille l'implémentation de Jitsi Meet en utilisant l'API de bas niveau `lib-jitsi-meet` pour un contrôle total sur l'interface et les fonctionnalités.

---

## 🔧 Installation et Configuration

### 1. Chargement de la bibliothèque

#### Option A : CDN (Recommandé pour début)
```typescript
// src/lib/utils/jitsiLoader.ts
export const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetJS) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/libs/lib-jitsi-meet.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi Meet library'));
    document.head.appendChild(script);
  });
};
```

#### Option B : Self-hosted (Production)
```typescript
// Utiliser votre propre serveur Jitsi
script.src = 'https://votre-domaine.com/libs/lib-jitsi-meet.min.js';
```

### 2. Types TypeScript

```typescript
// src/types/jitsi.ts
declare global {
  interface Window {
    JitsiMeetJS: any;
  }
}

export interface JitsiConnectionOptions {
  hosts?: {
    domain?: string;
    muc?: string;
  };
  serviceUrl?: string;
  clientNode?: string;
  enableLayerSuspension?: boolean;
  enableRemb?: boolean;
  enableTcc?: boolean;
  useStunTurn?: boolean;
  iceServers?: RTCIceServer[];
  p2p?: {
    enabled?: boolean;
    stunServers?: RTCIceServer[];
  };
}

export interface JitsiConferenceOptions {
  openBridgeChannel?: boolean;
  enableLayerSuspension?: boolean;
  enableRemb?: boolean;
  enableTcc?: boolean;
  useStunTurn?: boolean;
  p2p?: {
    enabled?: boolean;
  };
}

export interface JitsiTrack {
  type: 'video' | 'audio';
  isLocal: () => boolean;
  isVideoTrack: () => boolean;
  isAudioTrack: () => boolean;
  mute: () => void;
  unmute: () => void;
  dispose: () => void;
  getOriginalStream: () => MediaStream;
  setEffect: (effect: any) => void;
}

export interface JitsiLocalTrack extends JitsiTrack {
  setDeviceId: (deviceId: string) => void;
  switchCamera: () => void;
}

export interface VideoConstraints {
  lastN?: number;
  selectedSources?: string[];
  onStageSources?: string[];
  defaultConstraints?: {
    maxHeight?: number;
    maxWidth?: number;
    maxFrameRate?: number;
  };
  constraints?: {
    [sourceId: string]: {
      maxHeight?: number;
      maxWidth?: number;
      maxFrameRate?: number;
    };
  };
}
```

---

## 🎬 Composant JitsiMeetPlayer

### Structure complète

```typescript
// src/components/live/JitsiMeetPlayer.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, X, Settings, Users } from 'lucide-react';
import { loadJitsiScript } from '../../../lib/utils/jitsiLoader';
import { useAuthStore } from '../../../lib/stores/authStore';
import { LiveSession } from '../../../types/liveSession';

interface JitsiMeetPlayerProps {
  session: LiveSession;
  role: 'instructor' | 'participant';
  onLeave?: () => void;
  onError?: (error: Error) => void;
}

export default function JitsiMeetPlayer({
  session,
  role,
  onLeave,
  onError,
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
  
  const connectionRef = useRef<any>(null);
  const conferenceRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialisation de Jitsi
  useEffect(() => {
    const initJitsi = async () => {
      try {
        setLoading(true);
        await loadJitsiScript();
        
        if (!window.JitsiMeetJS) {
          throw new Error('JitsiMeetJS not loaded');
        }

        // Initialiser JitsiMeetJS
        window.JitsiMeetJS.init({
          enableLayerSuspension: true,
          disableThirdPartyRequests: false,
        });

        // Options de connexion
        const connectionOptions: any = {
          hosts: {
            domain: 'meet.jit.si',
            muc: 'conference.meet.jit.si',
          },
          serviceUrl: 'https://meet.jit.si/http-bind',
          clientNode: 'https://jitsi.org/jitsi-meet',
        };

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
            console.log('✅ Connexion établie');
            setIsConnected(true);
            createConference(connection);
          }
        );

        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
          (error: any) => {
            console.error('❌ Échec de connexion:', error);
            setError('Échec de connexion à Jitsi');
            onError?.(new Error('Connection failed'));
          }
        );

        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
          () => {
            console.log('🔌 Connexion fermée');
            setIsConnected(false);
            setIsJoined(false);
          }
        );

        connectionRef.current = connection;
        connection.connect();

      } catch (err: any) {
        console.error('Erreur initialisation Jitsi:', err);
        setError(err.message || 'Erreur lors de l\'initialisation');
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    initJitsi();

    // Cleanup
    return () => {
      if (conferenceRef.current) {
        conferenceRef.current.leave();
      }
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
      localTracks.forEach(track => track.dispose());
    };
  }, []);

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
      setError(err.message);
      onError?.(err);
    }
  }, [session]);

  // Créer les pistes locales (caméra, micro)
  const createLocalTracks = useCallback(async () => {
    try {
      const options: any = {
        devices: ['audio', 'video'],
        resolution: 720, // 720p par défaut
        cameraDeviceId: undefined, // Utiliser la caméra par défaut
        micDeviceId: undefined, // Utiliser le micro par défaut
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
    }
  }, []);

  // Ajouter une piste locale
  const addLocalTrack = useCallback((track: any) => {
    setLocalTracks(prev => [...prev, track]);
  }, []);

  // Retirer une piste locale
  const removeLocalTrack = useCallback((track: any) => {
    setLocalTracks(prev => prev.filter(t => t !== track));
    track.dispose();
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
        track.dispose();
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
      const participantsList = conferenceRef.current.getParticipants();
      setParticipants(participantsList);
    }
  }, []);

  // Toggle vidéo
  const toggleVideo = useCallback(() => {
    localTracks.forEach(track => {
      if (track.isVideoTrack()) {
        if (isVideoEnabled) {
          track.mute();
          setIsVideoEnabled(false);
        } else {
          track.unmute();
          setIsVideoEnabled(true);
        }
      }
    });
  }, [localTracks, isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    localTracks.forEach(track => {
      if (track.isAudioTrack()) {
        if (isAudioEnabled) {
          track.mute();
          setIsAudioEnabled(false);
        } else {
          track.unmute();
          setIsAudioEnabled(true);
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
          if (track.isVideoTrack() && track.getOriginalStream().getVideoTracks()[0]?.label === 'screen') {
            conferenceRef.current?.removeTrack(track);
            track.dispose();
            createLocalTracks(); // Recréer la caméra
          }
        });
        setIsScreenSharing(false);
      } else {
        // Démarrer le partage
        const screenTrack = await window.JitsiMeetJS.createLocalTracks({
          devices: ['desktop'],
        });
        if (screenTrack.length > 0) {
          conferenceRef.current?.addTrack(screenTrack[0]);
          setIsScreenSharing(true);
        }
      }
    } catch (err: any) {
      console.error('Erreur partage d\'écran:', err);
    }
  }, [isScreenSharing, localTracks, createLocalTracks]);

  // Quitter la session
  const handleLeave = useCallback(() => {
    if (conferenceRef.current) {
      conferenceRef.current.leave();
    }
    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }
    localTracks.forEach(track => track.dispose());
    onLeave?.();
  }, [localTracks, onLeave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4">Chargement de Jitsi Meet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* En-tête */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{session.title}</h3>
          <p className="text-gray-400 text-sm">
            {isJoined ? '✅ Connecté' : '⏳ Connexion...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            <Users className="h-4 w-4 inline mr-1" />
            {participants.length + 1}
          </span>
          <button
            onClick={handleLeave}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Zone vidéo */}
      <div className="flex-1 relative overflow-hidden">
        {/* Vidéo locale */}
        <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-blue-500">
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
        </div>

        {/* Vidéos distantes */}
        <div
          ref={remoteVideosRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full"
        >
          {/* Les vidéos distantes sont ajoutées dynamiquement ici */}
        </div>

        {remoteTracks.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4" />
              <p>En attente d'autres participants...</p>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="bg-gray-800 p-4">
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
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
          >
            <Monitor className="h-6 w-6" />
          </button>

          <button
            onClick={handleLeave}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="Quitter"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🛠️ Utilitaires

### `src/lib/utils/jitsiLoader.ts`
```typescript
export const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetJS) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/libs/lib-jitsi-meet.min.js';
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetJS) {
        resolve();
      } else {
        reject(new Error('JitsiMeetJS not available after script load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Jitsi Meet library'));
    document.head.appendChild(script);
  });
};
```

---

## 🎨 Configuration avancée

### Qualité vidéo personnalisée
```typescript
// Configurer la qualité pour tous les participants
conference.setReceiverConstraints({
  lastN: 20,
  defaultConstraints: { maxHeight: 360 }, // 360p par défaut
});

// Configurer la qualité pour un participant spécifique
conference.setReceiverConstraints({
  constraints: {
    'participant-id-v0': { maxHeight: 720 }, // HD pour un participant
  },
});
```

### Effets vidéo (flou d'arrière-plan)
```typescript
const blurEffect = {
  isEnabled: (track: any) => track.isVideoTrack(),
  startEffect: (stream: MediaStream) => {
    // Appliquer le flou (nécessite une bibliothèque de traitement vidéo)
    return processedStream;
  },
  stopEffect: () => {
    // Libérer les ressources
  },
};

localVideoTrack.setEffect(blurEffect);
```

---

## 📝 Notes importantes

1. **Permissions navigateur** : Demander l'accès caméra/micro au démarrage
2. **Gestion d'erreurs** : Gérer les cas où la caméra/micro ne sont pas disponibles
3. **Nettoyage** : Toujours disposer des pistes et déconnecter à la fin
4. **Performance** : Limiter le nombre de vidéos reçues avec `lastN`
5. **Mobile** : Tester sur mobile, certaines fonctionnalités peuvent différer

---

## ✅ Checklist d'implémentation

- [ ] Charger la bibliothèque Jitsi
- [ ] Initialiser JitsiMeetJS
- [ ] Créer la connexion
- [ ] Créer la conférence
- [ ] Gérer les pistes locales
- [ ] Gérer les pistes distantes
- [ ] Implémenter les contrôles (vidéo, audio, partage)
- [ ] Gérer les événements
- [ ] Nettoyer les ressources
- [ ] Tester sur différents navigateurs
- [ ] Tester sur mobile

---

**Version** : 1.0
**Date** : 2024

