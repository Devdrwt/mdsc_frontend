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
      // Récupérer le rôle sélectionné (si disponible)
      const selectedRole = (typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null) || 'student';
      
      // Construire l'URL de l'API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
      const googleAuthUrl = `${apiUrl}/auth/google?role=${selectedRole}&callback=${callbackUrl}`;
      
      console.log('🔐 [GOOGLE AUTH] Selected role:', selectedRole);
      console.log('🔐 [GOOGLE AUTH] Role source:', {
        fromSessionStorage: typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null,
        finalRole: selectedRole,
        defaultUsed: !sessionStorage.getItem('selectedRole'),
      });
      
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
            // Récupérer le rôle depuis sessionStorage au moment du callback (plus fiable)
            const roleFromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null;
            
            // Priorité: rôle retourné par le backend > rôle dans sessionStorage > rôle sélectionné au démarrage > 'student'
            const backendRole = user.role || user.role_name;
            const storageRole = roleFromStorage as 'student' | 'instructor' | 'admin' | null;
            const finalRole = (backendRole || storageRole || selectedRole || 'student') as 'student' | 'instructor' | 'admin';
            
            console.log('🔐 [GOOGLE AUTH] Role resolution:', {
              backendRole,
              storageRole,
              selectedRoleAtStart: selectedRole,
              finalRole,
            });
            
            // Si le backend n'a pas retourné de rôle, utiliser celui de sessionStorage
            if (!backendRole && storageRole) {
              console.warn('⚠️ [GOOGLE AUTH] Backend did not return a role, using role from sessionStorage:', storageRole);
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
            setUser(userData);
            setTokens(token, token); // Utiliser le même token pour refresh token temporairement
            
            // Stocker le rôle dans sessionStorage pour les prochaines fois
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('selectedRole', finalRole);
              console.log('💾 [GOOGLE AUTH] Role stored in sessionStorage:', finalRole);
            }
            
            console.log('✅ [GOOGLE AUTH] Store updated successfully with role:', finalRole);
            
            // Fermer la popup
            if (popup) {
              popup.close();
            }
            
            // Nettoyer le listener et l'interval
            window.removeEventListener('message', messageListener);
            if (checkPopupClosed) {
              clearInterval(checkPopupClosed);
            }
            
            // Callback de succès
            if (onSuccess) {
              onSuccess();
            }
            
            setIsLoading(false);
            
            // Attendre un peu pour que le store soit mis à jour
            setTimeout(() => {
              console.log('🔄 [GOOGLE AUTH] Redirecting to dashboard...');
              router.push('/dashboard');
            }, 100);
            
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
            // Rediriger vers la page de sélection de rôle avec un message
            console.log('🔄 [GOOGLE AUTH] User not found, redirecting to select-role page');
            router.push('/select-role?from=google&message=' + encodeURIComponent('Veuillez choisir votre rôle pour continuer votre inscription avec Google'));
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
      let checkPopupClosed: NodeJS.Timeout | null = setInterval(() => {
        if (!popup) {
          clearInterval(checkPopupClosed!);
          return;
        }

        if (popup.closed) {
          console.log('🔒 [GOOGLE AUTH] Popup closed');
          clearInterval(checkPopupClosed!);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
          
          // Ne pas afficher d'erreur immédiatement, la page de callback peut avoir fermé la popup
          // Attendre un peu pour voir si un message arrive
          setTimeout(() => {
            // Si on n'a pas reçu de message après 2 secondes, c'est que l'utilisateur a fermé manuellement
            console.log('⏱️ [GOOGLE AUTH] Popup closed and no message received');
          }, 2000);
          return;
        }

        // Vérifier si l'URL de la popup contient notre callback
        try {
          if (popup.location && popup.location.href) {
            const popupUrl = popup.location.href;
            console.log('🔍 [GOOGLE AUTH] Popup URL:', popupUrl);
            
            if (popupUrl.includes('/auth/google/callback')) {
              console.log('✅ [GOOGLE AUTH] Popup navigated to callback page:', popupUrl);
              // La popup est sur la page de callback, elle va envoyer un message
            }
            
            // Vérifier si l'URL contient des données de succès (backend pourrait rediriger directement)
            if (popupUrl.includes('token=') || popupUrl.includes('success=true')) {
              console.log('✅ [GOOGLE AUTH] Popup URL contains success data');
              // Extraire les données de l'URL si possible
              try {
                const url = new URL(popupUrl);
                const token = url.searchParams.get('token');
                const userStr = url.searchParams.get('user');
                
                if (token && userStr && !messageReceived) {
                  console.log('✅ [GOOGLE AUTH] Found data in popup URL');
                  const user = JSON.parse(decodeURIComponent(userStr));
                  
                  // Traiter les données comme un message de succès
                  const syntheticEvent = {
                    origin: window.location.origin,
                    data: {
                      type: 'GOOGLE_AUTH_SUCCESS',
                      user,
                      token
                    }
                  };
                  messageListener(syntheticEvent as MessageEvent);
                }
              } catch (parseError) {
                console.warn('⚠️ [GOOGLE AUTH] Could not parse data from URL:', parseError);
              }
            }
            
            // Détecter si le backend affiche un message de succès
            try {
              // Essayer de lire le contenu de la page (peut échouer si cross-origin)
              const popupDoc = popup.document;
              if (popupDoc && popupDoc.body) {
                const bodyText = popupDoc.body.innerText || popupDoc.body.textContent || '';
                if (bodyText.includes('Authentification réussie') || bodyText.includes('success')) {
                  console.log('✅ [GOOGLE AUTH] Detected success message in popup content');
                  
                  // Si on n'a pas encore reçu de message, attendre un peu et vérifier l'URL
                  if (!messageReceived) {
                    setTimeout(() => {
                      try {
                        const currentUrl = popup.location.href;
                        const url = new URL(currentUrl);
                        const token = url.searchParams.get('token');
                        const userStr = url.searchParams.get('user');
                        
                        if (token && userStr) {
                          const user = JSON.parse(decodeURIComponent(userStr));
                          const syntheticEvent = {
                            origin: window.location.origin,
                            data: {
                              type: 'GOOGLE_AUTH_SUCCESS',
                              user,
                              token
                            }
                          };
                          messageListener(syntheticEvent as MessageEvent);
                        } else {
                          // Essayer de récupérer les données depuis le backend via une API
                          console.log('🔍 [GOOGLE AUTH] Trying to fetch user data from backend...');
                          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                            credentials: 'include'
                          })
                          .then(res => res.json())
                          .then(data => {
                            if (data.success && data.data && data.token) {
                              console.log('✅ [GOOGLE AUTH] Retrieved user data from backend API');
                              const syntheticEvent = {
                                origin: window.location.origin,
                                data: {
                                  type: 'GOOGLE_AUTH_SUCCESS',
                                  user: data.data,
                                  token: data.token
                                }
                              };
                              messageListener(syntheticEvent as MessageEvent);
                            }
                          })
                          .catch(err => {
                            console.error('❌ [GOOGLE AUTH] Failed to fetch user data:', err);
                          });
                        }
                      } catch (e) {
                        console.error('❌ [GOOGLE AUTH] Error processing success message:', e);
                      }
                    }, 1000);
                  }
                }
              }
            } catch (e) {
              // Cross-origin error, c'est normal
              // Le backend doit rediriger vers notre page de callback
            }
          }
        } catch (e) {
          // Cross-origin error, c'est normal quand la popup est sur Google ou le backend
          // Ignorer cette erreur
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

