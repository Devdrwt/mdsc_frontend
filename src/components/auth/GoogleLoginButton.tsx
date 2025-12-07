'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';
import { FcGoogle } from 'react-icons/fc';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const selectedRole: 'student' = 'student';

      // Construire l'URL de l'API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
      const googleAuthUrl = `${apiUrl}/auth/google?role=${selectedRole}&callback=${callbackUrl}`;
      
      console.log('🔐 [GOOGLE AUTH] Rôle appliqué pour l\'inscription OAuth Google: apprenant');
      
      console.log('🔐 [GOOGLE AUTH] Opening popup with URL:', googleAuthUrl);
      console.log('🔐 [GOOGLE AUTH] Callback URL:', callbackUrl);
      console.log('🔐 [GOOGLE AUTH] API URL:', apiUrl);
      
      // Ouvrir la popup Google OAuth
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        googleAuthUrl,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Vérifier si la popup a été bloquée
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsLoading(false);
        const errorMsg = 'La popup a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site.';
        console.error('❌ [GOOGLE AUTH] Popup blocked');
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      console.log('✅ [GOOGLE AUTH] Popup opened successfully');

      // Extraire l'origine de l'API pour vérifier les messages
      const apiOrigin = new URL(apiUrl).origin;
      const frontendOrigin = window.location.origin;
      
      console.log('🔍 [GOOGLE AUTH] Listening for messages from:', { apiOrigin, frontendOrigin });

      // Variable pour suivre si on a déjà reçu une réponse
      let messageReceived = false;

      // Écouter les messages de la popup
      const messageListener = (event: MessageEvent) => {
        console.log('📨 [GOOGLE AUTH] Message received:', {
          origin: event.origin,
          type: event.data?.type,
          hasData: !!event.data,
          messageReceived
        });

        // Accepter les messages seulement depuis le frontend (page de callback)
        // Ignorer les autres origines pour la sécurité
        if (event.origin !== frontendOrigin) {
          console.warn('⚠️ [GOOGLE AUTH] Ignoring message from wrong origin:', event.origin);
          console.warn('⚠️ [GOOGLE AUTH] Expected origin:', frontendOrigin);
          return;
        }

        // Ignorer si on a déjà reçu une réponse
        if (messageReceived) {
          console.log('⚠️ [GOOGLE AUTH] Already received a message, ignoring duplicate');
          return;
        }

        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('✅ [GOOGLE AUTH] ========== MESSAGE RECEIVED IN MAIN WINDOW ==========');
          console.log('✅ [GOOGLE AUTH] Message type:', event.data.type);
          console.log('✅ [GOOGLE AUTH] Message origin:', event.origin);
          console.log('✅ [GOOGLE AUTH] Expected origin:', frontendOrigin);
          
          messageReceived = true;
          const { user, token } = event.data;
          
          console.log('✅ [GOOGLE AUTH] Success - User data:', user);
          console.log('✅ [GOOGLE AUTH] Success - Token:', token ? 'Token present' : 'Token missing');
          
          // Vérifier que les données nécessaires sont présentes
          if (!user || !token) {
            console.error('❌ [GOOGLE AUTH] Missing user or token in response');
            const errorMsg = 'Données d\'authentification incomplètes';
            if (popup) popup.close();
            window.removeEventListener('message', messageListener);
            setIsLoading(false);
            if (onError) {
              onError(errorMsg);
            }
            return;
          }
          
          // Mettre à jour le store d'authentification
          try {
            const backendRole = user.role || user.role_name;
            const finalRole = (backendRole || selectedRole || 'student') as 'student' | 'instructor' | 'admin';
            
            console.log('🔐 [GOOGLE AUTH] Role resolution:', {
              backendRole,
              selectedRoleAtStart: selectedRole,
              finalRole,
            });
            
            if (!backendRole) {
              console.warn('⚠️ [GOOGLE AUTH] Backend did not return a rôle, fallback vers apprenant');
            }
            
            // Normaliser les données utilisateur en remplaçant undefined par null ou des valeurs par défaut
            const userData = {
              id: typeof user.id === 'number' ? user.id : (user.id ? parseInt(String(user.id), 10) : 0),
              email: user.email || '',
              firstName: user.firstName || user.first_name || '',
              lastName: user.lastName || user.last_name || '',
              role: finalRole,
              phone: user.phone || null,
              organization: user.organization || null,
              country: user.country || null,
              isEmailVerified: user.emailVerified ?? user.email_verified ?? true,
              isActive: user.isActive ?? user.is_active ?? true,
              createdAt: user.createdAt || user.created_at || new Date().toISOString(),
              updatedAt: user.updatedAt || user.updated_at || new Date().toISOString()
            };
            
            // Vérifier que les champs requis ne sont pas undefined
            if (userData.id === 0 || !userData.email) {
              throw new Error('Données utilisateur incomplètes: id ou email manquant');
            }
            
            console.log('💾 [GOOGLE AUTH] Setting user in store:', userData);
            console.log('💾 [GOOGLE AUTH] User role in store:', userData.role);
            
            // Stocker le token dans localStorage pour compatibilité avec api.ts
            // Le store Zustand le stockera aussi via persist, mais api.ts cherche aussi 'authToken'
            if (typeof window !== 'undefined') {
              localStorage.setItem('authToken', token);
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('💾 [GOOGLE AUTH] Token stored in localStorage');
            }
            
            setUser(userData);
            setTokens(token, token); // Utiliser le même token pour refresh token temporairement
            
            console.log('✅ [GOOGLE AUTH] Store updated successfully with role:', finalRole);
            
            // Nettoyer le listener et l'interval AVANT de fermer la popup
            window.removeEventListener('message', messageListener);
            if (checkPopupClosed) {
              clearInterval(checkPopupClosed);
            }
            
            // Fermer la popup de manière agressive
            if (popup && !popup.closed) {
              console.log('🔒 [GOOGLE AUTH] Closing popup from main window...');
              try {
                popup.close();
                // Essayer plusieurs fois si nécessaire
                let attempts = 0;
                const closeInterval = setInterval(() => {
                  attempts++;
                  if (popup.closed || attempts > 5) {
                    clearInterval(closeInterval);
                    if (!popup.closed) {
                      console.warn('⚠️ [GOOGLE AUTH] Popup did not close, trying to redirect it to about:blank');
                      try {
                        popup.location.href = 'about:blank';
                      } catch (e) {
                        // Cross-origin, on ne peut pas modifier l'URL
                      }
                    }
                  } else {
                    try {
                      popup.close();
                    } catch (e) {
                      // Ignorer
                    }
                  }
                }, 100);
              } catch (e) {
                console.warn('⚠️ [GOOGLE AUTH] Could not close popup:', e);
              }
            }
            
            // Callback de succès
            if (onSuccess) {
              onSuccess();
            }
            
            setIsLoading(false);
            
            // ⚠️ CRITIQUE : Rediriger immédiatement vers le dashboard dans la fenêtre principale
            // Utiliser window.location.replace pour éviter d'ajouter une entrée dans l'historique
            const userRole = userData.role || 'student';
            const dashboardPath = `/dashboard/${userRole}`;
            console.log(`🔄 [GOOGLE AUTH] Redirecting main window to dashboard: ${dashboardPath}`);
            console.log(`🔄 [GOOGLE AUTH] Current URL: ${window.location.href}`);
            
            // Rediriger immédiatement (pas de setTimeout pour éviter les problèmes)
            window.location.replace(dashboardPath);
            
          } catch (error) {
            console.error('❌ [GOOGLE AUTH] Error updating store:', error);
            const errorMsg = 'Erreur lors de la mise à jour de la session';
            if (popup) popup.close();
            window.removeEventListener('message', messageListener);
            setIsLoading(false);
            if (onError) {
              onError(errorMsg);
            }
          }
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
          messageReceived = true;
          const errorMessage = event.data.error || 'Erreur lors de la connexion avec Google';
          
          console.error('❌ [GOOGLE AUTH] Error from popup:', errorMessage);
          
          // Fermer la popup
          if (popup) {
            popup.close();
          }
          
          // Nettoyer le listener et l'interval
          window.removeEventListener('message', messageListener);
          if (checkPopupClosed) {
            clearInterval(checkPopupClosed);
          }
          
          setIsLoading(false);
          
          // Détecter si l'utilisateur n'existe pas (nouveau compte)
          const lowerError = errorMessage.toLowerCase();
          const isUserNotFound = lowerError.includes('user not found') || 
                                 lowerError.includes('compte n\'existe pas') ||
                                 lowerError.includes('account does not exist') ||
                                 lowerError.includes('utilisateur introuvable') ||
                                 lowerError.includes('no account found');
          
          // Détecter les erreurs d'autorisation (Unauthorized)
          const isUnauthorized = lowerError.includes('unauthorized') ||
                                lowerError.includes('non autorisé') ||
                                lowerError.includes('401') ||
                                lowerError.includes('403') ||
                                lowerError.includes('autorisation') ||
                                lowerError.includes('configuration du serveur');
          
          if (isUnauthorized) {
            console.error('❌ [GOOGLE AUTH] Unauthorized error detected');
            console.error('❌ [GOOGLE AUTH] This is likely a backend configuration issue:');
            console.error('   - Check Google Cloud Console callback URLs');
            console.error('   - Check backend GOOGLE_CALLBACK_URL environment variable');
            console.error('   - Check if oauth_role_tokens table exists');
            console.error('   - Check backend logs for more details');
          }
          
          if (isUserNotFound) {
            console.log('🔄 [GOOGLE AUTH] Utilisateur introuvable, redirection vers la page d\'inscription apprenant');
            router.push('/register?from=google&message=' + encodeURIComponent('Compte Google non associé, créez votre profil apprenant pour continuer.'));
            return;
          }
          
          // Callback d'erreur pour les autres erreurs
          if (onError) {
            onError(errorMessage);
          }
        }
      };

      window.addEventListener('message', messageListener);
      
      // Vérifier si la popup a été fermée manuellement ou si elle a changé d'URL
      let checkPopupClosed: ReturnType<typeof setInterval> | null = setInterval(() => {
        if (!popup) {
          clearInterval(checkPopupClosed!);
          return;
        }

        if (popup.closed) {
          console.log('🔒 [GOOGLE AUTH] Popup closed detected');
          // Ne pas nettoyer immédiatement, attendre un peu pour voir si un message arrive
          // La page de callback peut avoir fermé la popup après avoir envoyé le message
          setTimeout(() => {
            // Si on n'a pas reçu de message après 3 secondes, nettoyer
            if (!messageReceived) {
              console.log('⏱️ [GOOGLE AUTH] Popup closed and no message received after 3 seconds');
              clearInterval(checkPopupClosed!);
              window.removeEventListener('message', messageListener);
              setIsLoading(false);
            }
          }, 3000);
          return;
        }
      }, 500);

      // Timeout après 5 minutes si rien ne se passe
      setTimeout(() => {
        if (popup && !popup.closed) {
          console.warn('⚠️ [GOOGLE AUTH] Timeout - closing popup');
          popup.close();
          window.removeEventListener('message', messageListener);
          if (checkPopupClosed) {
            clearInterval(checkPopupClosed);
          }
          setIsLoading(false);
          if (onError) {
            onError('Timeout : la connexion a pris trop de temps');
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
      
    } catch (error) {
      console.error('❌ [GOOGLE AUTH] Error:', error);
      setIsLoading(false);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Erreur lors de l\'ouverture de la fenêtre de connexion Google');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FcGoogle className="h-5 w-5 mr-3" />
      {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
    </button>
  );
}
