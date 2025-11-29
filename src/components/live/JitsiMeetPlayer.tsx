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
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

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

        // Obtenir le token Jitsi depuis le backend (seulement pour les serveurs auto-hébergés)
        let token: string | null = null;
        let useToken = false; // Par défaut, ne pas utiliser de token
        
        // Extraire le domaine pour déterminer si on a besoin d'un token
        const jitsiDomainForToken = session.jitsi_server_url
          ? (() => {
              try {
                return new URL(session.jitsi_server_url).hostname;
              } catch {
                return session.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0];
              }
            })()
          : 'meet.jit.si';
        
        // Seulement essayer d'obtenir un token si ce n'est pas le serveur public
        if (jitsiDomainForToken !== 'meet.jit.si') {
          try {
            const tokenResponse = await liveSessionService.getJitsiToken(session.id, role);
            token = tokenResponse.jwt;
            setJitsiToken(token);
            useToken = !!token;
            console.log('✅ Token Jitsi obtenu pour serveur auto-hébergé:', { hasToken: !!token, tokenLength: token?.length || 0 });
          } catch (err: any) {
            const errorMessage = err?.message || err?.toString() || '';
            const isParticipationError = errorMessage.includes('Participation non trouvée') || 
                                       errorMessage.includes('participation') ||
                                       err?.status === 404;
            
            if (isParticipationError) {
              console.warn('⚠️ Participation non trouvée, bascule vers l\'iframe Jitsi:', err);
              // Si l'erreur est liée à la participation, utiliser l'iframe directement
              // L'iframe Jitsi peut fonctionner même sans participation enregistrée
              setUseIframeFallback(true);
              setError(null);
              setLoading(false);
              return; // Sortir de la fonction, l'iframe sera affichée
            }
            
            console.warn('⚠️ Impossible d\'obtenir le token Jitsi, connexion sans JWT:', err);
            // Continuer sans token pour les autres erreurs
            useToken = false;
          }
        } else {
          console.log('ℹ️ Serveur public meet.jit.si détecté, pas de token JWT nécessaire');
        }

        // Initialiser JitsiMeetJS avec une configuration plus robuste
        window.JitsiMeetJS.init({
          enableLayerSuspension: true,
          disableThirdPartyRequests: false,
          // Désactiver les logs verbeux en production
          disableLogCollector: process.env.NODE_ENV === 'production',
          // Configuration pour améliorer la stabilité
          enableAnalyticsLogging: false,
          // Options de performance
          enableRemb: true,
          enableTcc: true,
        });

        // Extraire le domaine du serveur Jitsi
        let jitsiDomain = 'meet.jit.si'; // Par défaut, utiliser le serveur public
        if (session.jitsi_server_url) {
          try {
            const url = new URL(session.jitsi_server_url);
            jitsiDomain = url.hostname;
          } catch (e) {
            // Si l'URL n'est pas valide, essayer de l'extraire manuellement
            jitsiDomain = session.jitsi_server_url
              .replace('https://', '')
              .replace('http://', '')
              .split('/')[0]
              .split('?')[0];
          }
        }
        
        console.log('🌐 Configuration serveur Jitsi:', {
          originalUrl: session.jitsi_server_url,
          extractedDomain: jitsiDomain,
          roomName: session.jitsi_room_name
        });

        // Options de connexion - configuration optimisée
        // Pour meet.jit.si (serveur public), la configuration est simplifiée
        const connectionOptions: any = {
          hosts: {
            domain: jitsiDomain,
            muc: `conference.${jitsiDomain}`,
          },
          serviceUrl: `https://${jitsiDomain}/http-bind`,
          clientNode: 'https://jitsi.org/jitsi-meet',
        };

        // Pour les serveurs auto-hébergés, ajouter des options supplémentaires
        if (jitsiDomain !== 'meet.jit.si') {
          connectionOptions.enableLayerSuspension = true;
          connectionOptions.enableRemb = true;
          connectionOptions.enableTcc = true;
        }
        
        // Log de la configuration pour le débogage
        console.log('🔧 Configuration Jitsi:', {
          domain: jitsiDomain,
          roomName: session.jitsi_room_name,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          role: role
        });

        // Créer la connexion avec gestion d'erreur améliorée
        // Pour JitsiConnection, le premier paramètre est l'appId (optionnel), le second est le token (optionnel), le troisième est les options
        let connection: any;
        try {
          // Pour meet.jit.si (serveur public), ne pas utiliser de token JWT
          // Le serveur public ne nécessite généralement pas de token pour les connexions basiques
          // Pour les serveurs auto-hébergés, utiliser le token si disponible
          if (jitsiDomain === 'meet.jit.si') {
            console.log('🔓 Connexion au serveur public meet.jit.si sans token JWT');
            connection = new window.JitsiMeetJS.JitsiConnection(
              null, // appId (optionnel)
              null, // pas de token pour le serveur public
              connectionOptions
            );
          } else if (useToken && token) {
            // Pour les serveurs auto-hébergés, utiliser le token si disponible
            console.log('🔐 Tentative de connexion avec token JWT (serveur auto-hébergé)');
            connection = new window.JitsiMeetJS.JitsiConnection(
              null, // appId (optionnel)
              token, // token JWT
              connectionOptions
            );
          } else {
            console.log('🔓 Connexion sans token JWT (token non disponible)');
            connection = new window.JitsiMeetJS.JitsiConnection(
              null, // appId (optionnel)
              null, // pas de token
              connectionOptions
            );
          }
        } catch (err: any) {
          console.error('❌ Erreur création connexion Jitsi:', err);
          throw new Error(`Impossible de créer la connexion Jitsi: ${err.message || err}`);
        }

        // Événements de connexion
        connection.addEventListener(
          window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
          () => {
            if (!mounted) return;
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
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
            
            // Fonction helper pour détecter si c'est une erreur "passwordRequired"
            const isPasswordRequiredError = (err: any): boolean => {
              if (!err) return false;
              
              // Vérifier si l'erreur est directement la chaîne "connection.passwordRequired"
              if (err === 'connection.passwordRequired' || err === 'passwordRequired') return true;
              
              // Vérifier les propriétés communes
              const errorStr = String(err);
              const errorMsg = err?.msg || err?.message || errorStr;
              const errorCode = err?.code || '';
              
              // Vérifier si "passwordRequired" est présent dans n'importe quelle propriété
              if (errorMsg?.includes('passwordRequired') || errorCode === 'connection.passwordRequired') {
                return true;
              }
              
              // Vérifier toutes les propriétés de l'objet
              if (typeof err === 'object') {
                for (const key in err) {
                  const value = String(err[key] || '');
                  if (value.includes('passwordRequired') || value.includes('connection.passwordRequired')) {
                    return true;
                  }
                }
              }
              
              return false;
            };
            
            // Fonction helper pour détecter si c'est une erreur "otherError"
            const isOtherError = (err: any): boolean => {
              if (!err) return false;
              
              // Vérifier si l'erreur est directement la chaîne "connection.otherError"
              if (err === 'connection.otherError' || err === 'otherError') return true;
              
              // Vérifier les propriétés communes
              const errorStr = String(err);
              const errorMsg = err?.msg || err?.message || errorStr;
              const errorCode = err?.code || '';
              
              // Vérifier si "otherError" est présent dans n'importe quelle propriété
              if (errorMsg?.includes('otherError') || errorCode === 'connection.otherError') {
                return true;
              }
              
              // Vérifier toutes les propriétés de l'objet
              if (typeof err === 'object') {
                for (const key in err) {
                  const value = String(err[key] || '');
                  if (value.includes('otherError') || value.includes('connection.otherError')) {
                    return true;
                  }
                }
              }
              
              return false;
            };
            
            // Fonction helper pour basculer vers l'iframe
            const switchToIframe = (reason: string) => {
              console.log(`🔄 ${reason}, bascule vers l'iframe Jitsi`);
              
              // Nettoyer le timeout de connexion
              if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
              }
              
              // Déconnecter la connexion en cours
              if (connectionRef.current) {
                try {
                  connectionRef.current.disconnect();
                } catch (e) {
                  console.warn('Erreur lors de la déconnexion avant fallback:', e);
                }
              }
              
              setUseIframeFallback(true);
              setError(null);
              setLoading(false);
            };
            
            // Analyser le type d'erreur pour donner un message plus précis
            let errorMsg = 'Échec de connexion à Jitsi Meet';
            let errorDetails = '';
            
            if (error) {
              // Extraire des informations utiles de l'erreur
              const errorType = error.msg || error.message || String(error);
              const errorCode = error.code || '';
              
              console.error('Détails de l\'erreur Jitsi:', {
                type: errorType,
                code: errorCode,
                error: error,
                errorString: String(error),
                jitsiDomain,
                hasToken: !!token,
                useToken: useToken,
                roomName: session.jitsi_room_name,
                isPasswordRequired: isPasswordRequiredError(error),
                isOtherError: isOtherError(error)
              });
              
              // Détecter "connection.passwordRequired" en premier (priorité la plus haute)
              // Cette erreur indique que la salle nécessite un mot de passe
              if (isPasswordRequiredError(error)) {
                console.log('🔐 Erreur passwordRequired détectée, bascule vers l\'iframe Jitsi');
                switchToIframe('Salle protégée par mot de passe (passwordRequired)');
                return;
              }
              
              // Détecter "connection.otherError" ensuite (priorité haute)
              if (isOtherError(error)) {
                // Pour meet.jit.si, basculer immédiatement vers l'iframe
                // Cette erreur est courante avec le serveur public et l'iframe fonctionne mieux
                if (jitsiDomain === 'meet.jit.si') {
                  switchToIframe('Erreur connection.otherError détectée sur serveur public');
                  return;
                }
                
                // Pour les autres serveurs, essayer aussi l'iframe si on n'utilise pas de token
                if (!useToken) {
                  switchToIframe('Erreur connection.otherError sans token, bascule vers iframe');
                  return;
                }
                
                // Si on utilise un token et que c'est un serveur auto-hébergé, c'est peut-être un problème d'authentification
                errorMsg = 'Erreur de connexion';
                errorDetails = `Impossible de se connecter au serveur Jitsi (${jitsiDomain}). Le token peut être invalide ou le serveur peut avoir des problèmes. Tentative avec l'interface web...`;
                
                // Même avec un token, essayer l'iframe comme fallback
                switchToIframe('Erreur connection.otherError avec token, bascule vers iframe');
                return;
              }
              
              // Messages d'erreur spécifiques selon le type
              if (errorType?.includes('timeout') || errorType?.includes('TIMEOUT')) {
                errorMsg = 'Délai d\'attente dépassé';
                errorDetails = 'La connexion au serveur Jitsi a pris trop de temps. Vérifiez votre connexion internet.';
                
                // Pour meet.jit.si, basculer vers l'iframe en cas de timeout
                if (jitsiDomain === 'meet.jit.si') {
                  switchToIframe('Timeout sur serveur public');
                  return;
                }
              } else if (errorType?.includes('network') || errorType?.includes('NETWORK')) {
                errorMsg = 'Erreur réseau';
                errorDetails = 'Impossible de se connecter au serveur Jitsi. Vérifiez votre connexion internet.';
              } else if (errorType?.includes('authentication') || errorType?.includes('AUTH')) {
                errorMsg = 'Erreur d\'authentification';
                errorDetails = 'Problème d\'authentification avec le serveur Jitsi. Le token peut être invalide, expiré ou mal configuré.';
              } else {
                errorDetails = `Type d'erreur: ${errorType || 'Inconnu'}`;
                
                // Pour meet.jit.si, en cas d'erreur inconnue, essayer quand même l'iframe
                if (jitsiDomain === 'meet.jit.si') {
                  switchToIframe('Erreur inconnue sur serveur public');
                  return;
                }
              }
            }
            
            setError(`${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`);
            onError?.(new Error(`${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`));
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
        
        // Ajouter un timeout pour la connexion (30 secondes)
        // Pour meet.jit.si, utiliser un timeout plus court et basculer vers l'iframe
        const timeoutDuration = jitsiDomain === 'meet.jit.si' ? 10000 : 30000; // 10s pour le serveur public, 30s pour les autres
        
        connectionTimeoutRef.current = setTimeout(() => {
          if (!mounted) return;
          
          // Si on utilise meet.jit.si, basculer directement vers l'iframe au lieu d'afficher une erreur
          if (jitsiDomain === 'meet.jit.si') {
            console.log('⏱️ Timeout de connexion pour meet.jit.si, bascule vers l\'iframe');
            if (connectionRef.current) {
              try {
                connectionRef.current.disconnect();
              } catch (e) {
                console.warn('Erreur lors de la déconnexion après timeout:', e);
              }
            }
            setUseIframeFallback(true);
            setError(null);
            setLoading(false);
            return;
          }
          
          // Pour les autres serveurs, afficher l'erreur
          if (connectionRef.current) {
            console.error('⏱️ Timeout de connexion Jitsi');
            try {
              connectionRef.current.disconnect();
            } catch (e) {
              console.error('Erreur lors de la déconnexion après timeout:', e);
            }
            const timeoutError = 'Délai d\'attente dépassé lors de la connexion au serveur Jitsi. Vérifiez votre connexion internet et que le serveur Jitsi est accessible.';
            setError(timeoutError);
            onError?.(new Error(timeoutError));
          }
        }, timeoutDuration);
        
        try {
          connection.connect();
        } catch (err: any) {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          throw new Error(`Erreur lors de la connexion: ${err.message || err}`);
        }

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
      // Nettoyer le timeout de connexion s'il existe
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
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

      // Créer la conférence avec gestion d'erreur
      let conference: any;
      try {
        // Ajouter le mot de passe de la salle si disponible
        const sessionAny = session as any;
        const roomPassword = sessionAny.jitsi_room_password || session.jitsi_room_password;
        
        if (roomPassword) {
          console.log('🔐 Mot de passe de salle détecté, ajout à la conférence');
          conferenceOptions.password = roomPassword;
        }
        
        conference = connection.initJitsiConference(
          session.jitsi_room_name,
          conferenceOptions
        );
      } catch (err: any) {
        console.error('Erreur création conférence:', err);
        throw new Error(`Impossible de créer la conférence: ${err.message || err}`);
      }

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
        timeout: 10000, // 10 secondes au lieu de 5 par défaut (selon le guide de dépannage)
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
      
      // Analyser le type d'erreur pour donner un message plus précis
      const errorMessage = err?.message || err?.toString() || '';
      let userMessage = 'Impossible d\'accéder à la caméra ou au micro.';
      
      if (errorMessage.includes('timeout') || errorMessage.includes('gum.timeout')) {
        userMessage = 'Délai d\'attente dépassé lors de l\'accès aux médias. Vérifiez que le microphone et la caméra ne sont pas utilisés par une autre application et que les permissions sont accordées.';
      } else if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        userMessage = 'Permission refusée. Veuillez autoriser l\'accès au microphone et à la caméra dans les paramètres de votre navigateur.';
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('No device')) {
        userMessage = 'Aucun périphérique audio/vidéo trouvé. Vérifiez que votre microphone et votre caméra sont connectés.';
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('Device in use')) {
        userMessage = 'Le périphérique est déjà utilisé par une autre application. Fermez les autres applications qui utilisent le microphone ou la caméra.';
      }
      
      // Continuer même si la caméra/micro ne fonctionne pas
      toast.warning('Avertissement', `${userMessage} Vous pouvez continuer sans.`);
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

  // Fallback vers l'iframe Jitsi si la connexion API échoue
  if (useIframeFallback) {
    const jitsiDomain = session.jitsi_server_url
      ? (() => {
          try {
            return new URL(session.jitsi_server_url).hostname;
          } catch {
            return session.jitsi_server_url.replace('https://', '').replace('http://', '').split('/')[0];
          }
        })()
      : 'meet.jit.si';
    
    // Construire l'URL Jitsi avec les paramètres nécessaires
    const sessionAny = session as any;
    const roomPassword = sessionAny.jitsi_room_password || session.jitsi_room_password;
    const urlParams = new URLSearchParams();
    
    if (jitsiToken) {
      urlParams.append('jwt', jitsiToken);
    }
    if (roomPassword) {
      urlParams.append('pwd', roomPassword);
    }
    
    // Ajouter le nom d'utilisateur si disponible
    if (user) {
      urlParams.append('userInfo.displayName', `${user.firstName} ${user.lastName}`.trim());
    }
    
    const queryString = urlParams.toString();
    const jitsiUrl = `https://${jitsiDomain}/${session.jitsi_room_name}${queryString ? `?${queryString}` : ''}`;
    
    return (
      <div className="flex flex-col h-full bg-gray-900">
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h3 className="text-white font-semibold text-lg">{session.title}</h3>
            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connecté via interface web
            </p>
          </div>
          {onLeave && (
            <button
              onClick={onLeave}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Quitter la session"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="flex-1 w-full border-0"
          style={{ minHeight: '600px' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-red-500 mb-4 text-center max-w-md">
          <p className="font-semibold mb-2 text-lg">❌ {error}</p>
          <p className="text-sm text-gray-400 mb-4">Impossible de se connecter à la session Jitsi Meet</p>
          
          {/* Suggestions de dépannage */}
          <div className="bg-gray-800 rounded-lg p-4 mt-4 text-left text-sm text-gray-300">
            <p className="font-semibold mb-2 text-white">Suggestions :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vérifiez votre connexion internet</li>
              <li>Assurez-vous que le serveur Jitsi est accessible</li>
              <li>Vérifiez que la session n'a pas été annulée</li>
              <li>Essayez de rafraîchir la page</li>
              {session.jitsi_server_url && (
                <li className="text-xs text-gray-500 mt-2">
                  Serveur: {session.jitsi_server_url}
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              setUseIframeFallback(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
          >
            Utiliser l'interface web
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#F4A53A] to-[#F5B04A] text-white rounded-lg hover:from-[#E0942A] hover:to-[#F4A53A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
          >
            Réessayer
          </button>
          {onLeave && (
            <button
              onClick={onLeave}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Retour
            </button>
          )}
        </div>
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

