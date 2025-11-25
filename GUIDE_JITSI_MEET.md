# Guide d'Intégration Jitsi Meet pour les Cours en Live

## 🎯 Pourquoi Jitsi Meet ?

✅ **Open Source** - Gratuit et sans limites  
✅ **Auto-hébergé** - Contrôle total sur vos données  
✅ **Sans compte** - Les étudiants rejoignent directement  
✅ **API simple** - Intégration facile  
✅ **Enregistrement** - Support natif de l'enregistrement  
✅ **Chat intégré** - Chat en temps réel inclus  

---

## 📦 Installation

### 1. Installer la dépendance React

```bash
npm install @jitsi/react-sdk
# ou
yarn add @jitsi/react-sdk
```

### 2. Configuration Backend

Pour Jitsi Meet, vous avez deux options :

#### Option A : Utiliser Jitsi Meet Cloud (Gratuit, Recommandé pour démarrer)
- Utilisez `meet.jit.si` comme serveur
- Aucune configuration serveur nécessaire
- Limite : 100 participants par session

#### Option B : Auto-héberger Jitsi Meet (Production)
- Plus de contrôle
- Pas de limite de participants
- Nécessite un serveur dédié

Pour ce guide, nous utiliserons l'**Option A** (Cloud) pour simplifier.

---

## 🏗️ Architecture avec Jitsi Meet

### Modèle de données (Backend)

```sql
-- Table: live_sessions (mise à jour pour Jitsi)
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  jitsi_room_name VARCHAR(255) NOT NULL UNIQUE, -- Nom unique de la salle Jitsi
  jitsi_server_url VARCHAR(255) DEFAULT 'https://meet.jit.si', -- URL du serveur Jitsi
  max_participants INTEGER DEFAULT 100,
  recording_enabled BOOLEAN DEFAULT TRUE,
  recording_url TEXT, -- URL de l'enregistrement après la session
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: live_session_participants
CREATE TABLE live_session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  attendance_duration INTEGER, -- en minutes
  UNIQUE(session_id, user_id)
);
```

### Endpoints API Backend

```javascript
// POST /api/courses/:courseId/live-sessions
// Créer une session live avec génération automatique du nom de salle Jitsi
{
  title: "Introduction à React",
  description: "Première session du cours",
  scheduled_start_time: "2024-01-15T10:00:00Z",
  scheduled_end_time: "2024-01-15T11:30:00Z",
  max_participants: 50,
  recording_enabled: true
}

// Réponse :
{
  id: 1,
  course_id: 5,
  jitsi_room_name: "mdsc-course-5-session-1-abc123", // Généré automatiquement
  jitsi_server_url: "https://meet.jit.si",
  // ... autres champs
}

// GET /api/live-sessions/:sessionId/join
// Retourne les informations pour rejoindre la session
{
  jitsi_room_name: "mdsc-course-5-session-1-abc123",
  jitsi_server_url: "https://meet.jit.si",
  user_display_name: "John Doe", // Nom de l'utilisateur
  user_email: "john@example.com"
}
```

---

## 💻 Implémentation Frontend

### 1. Types TypeScript

**Fichier:** `src/types/liveSession.ts`

```typescript
export interface LiveSession {
  id: number;
  course_id: number;
  instructor_id: number;
  title: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  jitsi_room_name: string; // Nom unique de la salle Jitsi
  jitsi_server_url: string; // URL du serveur Jitsi (par défaut: https://meet.jit.si)
  max_participants: number;
  recording_enabled: boolean;
  recording_url?: string;
  created_at: string;
  updated_at: string;
  course?: {
    id: number;
    title: string;
    slug: string;
  };
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  participant_count?: number;
  is_participant?: boolean;
}

export interface JoinSessionData {
  jitsi_room_name: string;
  jitsi_server_url: string;
  user_display_name: string;
  user_email: string;
  is_instructor: boolean;
}
```

### 2. Service API

**Fichier:** `src/lib/services/liveSessionService.ts`

```typescript
import { apiRequest } from './api';
import { LiveSession, JoinSessionData } from '../../types/liveSession';

export class LiveSessionService {
  /**
   * Créer une session live
   */
  static async createSession(
    courseId: number,
    data: {
      title: string;
      description?: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      max_participants?: number;
      recording_enabled?: boolean;
    }
  ): Promise<LiveSession> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Lister les sessions d'un cours
   */
  static async getCourseSessions(courseId: number): Promise<LiveSession[]> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer les détails d'une session
   */
  static async getSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Rejoindre une session (retourne les infos Jitsi)
   */
  static async joinSession(sessionId: number): Promise<JoinSessionData> {
    const response = await apiRequest(`/live-sessions/${sessionId}/join`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Démarrer une session (instructeur uniquement)
   */
  static async startSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/start`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Terminer une session (instructeur uniquement)
   */
  static async endSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/end`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Quitter une session
   */
  static async leaveSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}/leave`, {
      method: 'POST',
    });
  }
}

export const liveSessionService = LiveSessionService;
```

### 3. Composant Jitsi Meet

**Fichier:** `src/components/courses/JitsiMeetPlayer.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Users, MessageSquare, Settings, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { JoinSessionData } from '../../types/liveSession';

interface JitsiMeetPlayerProps {
  joinData: JoinSessionData;
  onLeave?: () => void;
  onError?: (error: Error) => void;
}

export default function JitsiMeetPlayer({ joinData, onLeave, onError }: JitsiMeetPlayerProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!jitsiContainerRef.current) return;

    // Charger dynamiquement le script Jitsi Meet
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://8x8.vc/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Erreur lors du chargement de Jitsi Meet'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();

        if (!window.JitsiMeetExternalAPI) {
          throw new Error('Jitsi Meet API non disponible');
        }

        const domain = new URL(joinData.jitsi_server_url).hostname;
        const options = {
          roomName: joinData.jitsi_room_name,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            enableInsecureRoomNameWarning: false,
            // Désactiver certaines fonctionnalités si nécessaire
            disableInviteFunctions: false,
            disableThirdPartyRequests: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'chat',
              'recording',
              'livestreaming',
              'settings',
              'videoquality',
              'filmstrip',
              'feedback',
              'stats',
              'shortcuts',
              'tileview',
              'videobackgroundblur',
              'download',
              'help',
              'mute-everyone',
              'mute-everyone-entry',
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
            DEFAULT_BACKGROUND: '#1a1a1a',
          },
          userInfo: {
            displayName: joinData.user_display_name,
            email: joinData.user_email,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        setJitsiApi(api);

        // Événements Jitsi
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Rejoint la conférence');
        });

        api.addEventListener('videoConferenceLeft', () => {
          console.log('Quitté la conférence');
          onLeave?.();
        });

        api.addEventListener('participantJoined', (participant: any) => {
          console.log('Participant rejoint:', participant);
          updateParticipantCount();
        });

        api.addEventListener('participantLeft', () => {
          console.log('Participant parti');
          updateParticipantCount();
        });

        api.addEventListener('audioMuteStatusChanged', (event: any) => {
          setIsMuted(event.muted);
        });

        api.addEventListener('videoMuteStatusChanged', (event: any) => {
          setIsVideoOff(event.muted);
        });

        api.addEventListener('errorOccurred', (error: any) => {
          console.error('Erreur Jitsi:', error);
          onError?.(new Error(error.error || 'Erreur inconnue'));
        });

        // Fonction pour mettre à jour le nombre de participants
        const updateParticipantCount = () => {
          if (api) {
            const participants = api.getParticipantsInfo();
            setParticipantCount(participants.length + 1); // +1 pour l'utilisateur actuel
          }
        };

        // Mettre à jour le compteur périodiquement
        const interval = setInterval(updateParticipantCount, 2000);

        // Nettoyage
        return () => {
          clearInterval(interval);
          if (api) {
            api.dispose();
          }
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Jitsi:', error);
        onError?.(error as Error);
      }
    };

    initializeJitsi();

    // Nettoyage au démontage
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [joinData]);

  const toggleMute = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleVideo');
    }
  };

  const toggleChat = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('toggleChat');
    }
    setShowChat(!showChat);
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Conteneur Jitsi */}
      <div ref={jitsiContainerRef} className="w-full h-full" />

      {/* Barre d'outils personnalisée (optionnelle) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${
            isMuted ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isMuted ? 'Activer le micro' : 'Désactiver le micro'}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-lg transition-colors ${
            isVideoOff ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
        <button
          onClick={toggleChat}
          className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
          title="Ouvrir/Fermer le chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-lg">
          <Users className="h-4 w-4 text-white" />
          <span className="text-white text-sm">{participantCount}</span>
        </div>
        {onLeave && (
          <button
            onClick={onLeave}
            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            title="Quitter la session"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Déclaration TypeScript pour l'API Jitsi
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}
```

### 4. Composant de Session Live

**Fichier:** `src/components/courses/LiveSessionPlayer.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, Calendar, AlertCircle, Loader2, Video } from 'lucide-react';
import { LiveSession, JoinSessionData } from '../../types/liveSession';
import { liveSessionService } from '../../lib/services/liveSessionService';
import JitsiMeetPlayer from './JitsiMeetPlayer';
import toast from '../../lib/utils/toast';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveSessionPlayerProps {
  session: LiveSession;
  userDisplayName: string;
  userEmail: string;
  isInstructor?: boolean;
  onLeave?: () => void;
}

export default function LiveSessionPlayer({
  session,
  userDisplayName,
  userEmail,
  isInstructor = false,
  onLeave,
}: LiveSessionPlayerProps) {
  const [joinData, setJoinData] = useState<JoinSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<string>('');

  const scheduledStart = parseISO(session.scheduled_start_time);
  const scheduledEnd = parseISO(session.scheduled_end_time);
  const now = new Date();

  const isScheduled = isBefore(now, scheduledStart);
  const isLive = session.status === 'live' || (isAfter(now, scheduledStart) && isBefore(now, scheduledEnd));
  const isEnded = session.status === 'ended' || isAfter(now, scheduledEnd);

  // Calculer le temps jusqu'au début
  useEffect(() => {
    if (isScheduled) {
      const interval = setInterval(() => {
        const diff = scheduledStart.getTime() - new Date().getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setTimeUntilStart(`${days} jour${days > 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeUntilStart(`${hours} heure${hours > 1 ? 's' : ''}`);
        } else if (minutes > 0) {
          setTimeUntilStart(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        } else {
          setTimeUntilStart('Bientôt');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isScheduled, scheduledStart]);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await liveSessionService.joinSession(session.id);
      setJoinData({
        ...data,
        user_display_name: userDisplayName,
        user_email: userEmail,
        is_instructor: isInstructor,
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de rejoindre la session');
      toast.error('Erreur', err.message || 'Impossible de rejoindre la session');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!isInstructor) return;

    setLoading(true);
    try {
      await liveSessionService.startSession(session.id);
      await handleJoin();
    } catch (err: any) {
      toast.error('Erreur', err.message || 'Impossible de démarrer la session');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      await liveSessionService.leaveSession(session.id);
      setJoinData(null);
      onLeave?.();
    } catch (err: any) {
      console.error('Erreur lors de la sortie:', err);
    }
  };

  // Si l'utilisateur a rejoint, afficher Jitsi
  if (joinData) {
    return (
      <div className="w-full h-screen flex flex-col">
        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{session.title}</h2>
            <p className="text-sm text-gray-400">{session.course?.title}</p>
          </div>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Quitter
          </button>
        </div>
        <div className="flex-1">
          <JitsiMeetPlayer
            joinData={joinData}
            onLeave={handleLeave}
            onError={(error) => {
              setError(error.message);
              toast.error('Erreur Jitsi', error.message);
            }}
          />
        </div>
      </div>
    );
  }

  // Écran d'attente ou d'erreur
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.title}</h1>
          {session.description && (
            <p className="text-gray-600">{session.description}</p>
          )}
        </div>

        {/* Statut */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {format(scheduledStart, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Durée: {Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000)} minutes
                </span>
              </div>
            </div>
            <div className="text-right">
              {isScheduled && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Programmée dans {timeUntilStart}
                </div>
              )}
              {isLive && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                  En direct
                </div>
              )}
              {isEnded && (
                <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  Terminée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Erreur</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{session.participant_count || 0} participant(s)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isInstructor && isScheduled && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Démarrage...</span>
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Démarrer la session</span>
                  </>
                )}
              </button>
            )}
            {(isLive || (isInstructor && isScheduled)) && (
              <button
                onClick={handleJoin}
                disabled={loading || isScheduled}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Rejoindre la session</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Page de Session Live

**Fichier:** `src/app/live/[sessionId]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '../../../lib/middleware/auth';
import { liveSessionService } from '../../../lib/services/liveSessionService';
import { LiveSession } from '../../../types/liveSession';
import LiveSessionPlayer from '../../../components/courses/LiveSessionPlayer';
import { useAuthStore } from '../../../lib/stores/authStore';
import Loader2 from 'lucide-react';

export default function LiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.sessionId as string, 10);
  const { user } = useAuthStore();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await liveSessionService.getSession(sessionId);
      setSession(data);
    } catch (err: any) {
      setError(err.message || 'Session non trouvée');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Session non trouvée'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const userDisplayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'Utilisateur';
  const userEmail = user?.email || '';
  const isInstructor = user?.id === session.instructor_id || user?.role === 'instructor';

  return (
    <AuthGuard requiredRole="student">
      <LiveSessionPlayer
        session={session}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        isInstructor={isInstructor}
        onLeave={() => router.back()}
      />
    </AuthGuard>
  );
}
```

---

## 🎨 Composant de Liste des Sessions Live

**Fichier:** `src/components/courses/LiveSessionCard.tsx`

```typescript
'use client';

import { Clock, Users, Video, Calendar } from 'lucide-react';
import { LiveSession } from '../../types/liveSession';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface LiveSessionCardProps {
  session: LiveSession;
}

export default function LiveSessionCard({ session }: LiveSessionCardProps) {
  const router = useRouter();
  const scheduledStart = parseISO(session.scheduled_start_time);
  const scheduledEnd = parseISO(session.scheduled_end_time);
  const now = new Date();

  const isScheduled = isBefore(now, scheduledStart);
  const isLive = session.status === 'live' || (isAfter(now, scheduledStart) && isBefore(now, scheduledEnd));
  const isEnded = session.status === 'ended' || isAfter(now, scheduledEnd);

  const handleClick = () => {
    router.push(`/live/${session.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.title}</h3>
          {session.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{session.description}</p>
          )}
        </div>
        {isLive && (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
            EN DIRECT
          </div>
        )}
        {isScheduled && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            PROGRAMMÉE
          </div>
        )}
        {isEnded && (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
            TERMINÉE
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>{format(scheduledStart, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Durée: {Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000)} min</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{session.participant_count || 0} participant(s)</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Video className="h-4 w-4" />
          <span>{isLive ? 'Rejoindre' : isScheduled ? 'Voir les détails' : 'Voir l\'enregistrement'}</span>
        </button>
      </div>
    </div>
  );
}
```

---

## 📝 Notes Importantes

### Sécurité
- **Noms de salle uniques** : Utilisez des noms de salle cryptographiquement sécurisés
- **Validation backend** : Vérifiez toujours les permissions côté serveur
- **Limite de participants** : Implémentez une limite côté backend

### Performance
- **Chargement dynamique** : Le script Jitsi est chargé uniquement quand nécessaire
- **Nettoyage** : Toujours appeler `api.dispose()` lors du démontage

### Personnalisation
- **Interface** : Personnalisez `interfaceConfigOverwrite` selon vos besoins
- **Thème** : Modifiez les couleurs dans `configOverwrite`

---

## 🚀 Prochaines Étapes

1. ✅ Installer `@jitsi/react-sdk` (ou utiliser l'API externe comme montré)
2. ✅ Créer les endpoints backend
3. ✅ Implémenter les composants frontend
4. ✅ Tester avec une session réelle
5. 🔄 Optionnel : Auto-héberger Jitsi Meet pour la production

---

## 📚 Ressources

- **Documentation Jitsi Meet** : https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **API Jitsi** : https://github.com/jitsi/jitsi-meet/blob/master/doc/api.md
- **Exemples** : https://github.com/jitsi/jitsi-meet/tree/master/doc/example

Bon développement ! 🎉

