'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useAuthStore } from '../../../../lib/stores/authStore';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);
  const { setUser, setTokens } = useAuthStore();

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    console.log('📥 [GOOGLE CALLBACK] Page loaded');
    console.log('📥 [GOOGLE CALLBACK] URL:', window.location.href);
    
    // ⚠️ CRITIQUE : Vérifier si c'est une popup AVANT TOUT
    const isPopupFromOpener = !!(window.opener && !window.opener.closed);
    const isPopupFromSession = typeof window !== 'undefined' && sessionStorage.getItem('google_oauth_is_popup') === 'true';
    const isPopup = isPopupFromOpener || isPopupFromSession;
    
    console.log('📥 [GOOGLE CALLBACK] Is popup (opener):', isPopupFromOpener);
    console.log('📥 [GOOGLE CALLBACK] Is popup (session):', isPopupFromSession);
    console.log('📥 [GOOGLE CALLBACK] Is popup (final):', isPopup);

    // Extraire les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    const error = urlParams.get('error');

    // Fonction pour envoyer un message à la fenêtre principale
    const sendMessage = (type: string, data: any): boolean => {
      if (!isPopup) {
        console.warn('⚠️ [GOOGLE CALLBACK] Not a popup, cannot send message');
        return false;
      }

      try {
        console.log(`📤 [GOOGLE CALLBACK] Sending ${type} to parent window`);
        window.opener.postMessage(
          {
            type,
            ...data,
          },
          window.location.origin
        );
        console.log(`✅ [GOOGLE CALLBACK] Message sent successfully`);
        return true;
      } catch (e) {
        console.error('❌ [GOOGLE CALLBACK] Error sending message:', e);
        return false;
      }
    };

    // Fonction pour fermer la popup de manière agressive
    const closePopup = () => {
      if (!isPopup) {
        console.log('⚠️ [GOOGLE CALLBACK] Not a popup, cannot close');
        return;
      }

      console.log('🔒 [GOOGLE CALLBACK] Closing popup aggressively...');
      
      // ⚠️ CRITIQUE : Vider le body et empêcher tout rendu supplémentaire
      try {
        if (document.body) {
          document.body.innerHTML = '';
          document.body.style.display = 'none';
        }
        // Supprimer tous les scripts sauf ceux marqués comme essentiels
        if (document.head) {
          const scripts = document.head.querySelectorAll('script:not([data-keep])');
          scripts.forEach(script => {
            try {
              if (script.parentNode) {
                script.parentNode.removeChild(script);
              }
            } catch (e) {
              // Ignorer
            }
          });
        }
        // Empêcher toute navigation
        window.stop();
      } catch (e) {
        // Ignorer
      }

      // Fermer la popup de manière agressive
      try {
        // Essayer de fermer immédiatement
        window.close();
        
        // Si ça ne fonctionne pas, rediriger vers about:blank
        let attempts = 0;
        const closeInterval = setInterval(() => {
          attempts++;
          if (window.closed || attempts > 5) {
            clearInterval(closeInterval);
            if (!window.closed) {
              console.warn('⚠️ [GOOGLE CALLBACK] Popup did not close, redirecting to about:blank');
              try {
                window.location.replace('about:blank');
              } catch (e) {
                // Ignorer
              }
            }
          } else {
            try {
              window.close();
            } catch (e) {
              // Ignorer
            }
          }
        }, 50);
      } catch (e) {
        console.error('❌ [GOOGLE CALLBACK] Error closing popup:', e);
        try {
          window.location.replace('about:blank');
        } catch (e2) {
          // Ignorer
        }
      }
    };

    // ⚠️ CRITIQUE : Si c'est une popup, NE PAS mettre à jour le store
    // Le store pourrait déclencher des redirections automatiques
    // On envoie juste le message et on ferme
    if (isPopup) {
      console.log('🔒 [GOOGLE CALLBACK] This is a popup - will send message and close, NO STORE UPDATE, NO REDIRECT');
      
      // Gestion des erreurs
      if (error) {
        const decodedError = decodeURIComponent(error);
        console.error('❌ [GOOGLE CALLBACK] Error:', decodedError);
        sendMessage('GOOGLE_AUTH_ERROR', { error: decodedError });
        setTimeout(closePopup, 100);
        return;
      }

      // Gestion du succès
      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Normaliser les données utilisateur
          const normalizedUser = {
            id: typeof user.id === 'number' ? user.id : (user.id ? parseInt(String(user.id), 10) : 0),
            email: user.email || '',
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            role: (user.role || user.role_name || 'student') as 'student' | 'instructor' | 'admin',
            phone: user.phone || null,
            organization: user.organization || null,
            country: user.country || null,
            isEmailVerified: user.emailVerified ?? user.email_verified ?? true,
            isActive: user.isActive ?? user.is_active ?? true,
            createdAt: user.createdAt || user.created_at || new Date().toISOString(),
            updatedAt: user.updatedAt || user.updated_at || new Date().toISOString()
          };

          console.log('✅ [GOOGLE CALLBACK] Success - User:', normalizedUser);
          console.log('✅ [GOOGLE CALLBACK] Success - Token:', token ? 'present' : 'missing');

          // ⚠️ CRITIQUE : NE PAS mettre à jour le store dans la popup
          // Cela pourrait déclencher des redirections automatiques
          // On envoie juste le message à la fenêtre principale

          // Vider le body immédiatement pour éviter tout rendu
          try {
            if (document.body) {
              document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;color:#666;font-size:14px;">Fermeture...</div>';
            }
          } catch (e) {
            // Ignorer
          }

          // Envoyer le message plusieurs fois pour s'assurer qu'il est reçu
          let sentCount = 0;
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              if (window.opener && !window.opener.closed) {
                const sent = sendMessage('GOOGLE_AUTH_SUCCESS', {
                  user: normalizedUser,
                  token,
                });
                if (sent) sentCount++;
              }
            }, i * 50);
          }

          // Fermer la popup IMMÉDIATEMENT après un très court délai
          setTimeout(() => {
            console.log('🔒 [GOOGLE CALLBACK] Closing popup IMMEDIATELY - NO REDIRECT IN POPUP');
            closePopup();
          }, 200); // Délai très court
        } catch (parseError) {
          console.error('❌ [GOOGLE CALLBACK] Error parsing user data:', parseError);
          sendMessage('GOOGLE_AUTH_ERROR', {
            error: 'Erreur lors du traitement des données',
          });
          setTimeout(closePopup, 100);
        }
      } else {
        // Si aucune donnée n'est présente
        console.warn('⚠️ [GOOGLE CALLBACK] No data in URL');
        sendMessage('GOOGLE_AUTH_ERROR', {
          error: 'Aucune donnée reçue du serveur',
        });
        setTimeout(closePopup, 100);
      }
      return; // ⚠️ CRITIQUE : Sortir immédiatement, ne pas continuer
    }

    // Si ce n'est PAS une popup, traitement normal avec mise à jour du store
    console.log('🔄 [GOOGLE CALLBACK] Not a popup, processing normally...');

    // Gestion des erreurs
    if (error) {
      const decodedError = decodeURIComponent(error);
      console.error('❌ [GOOGLE CALLBACK] Error:', decodedError);
      window.location.replace(`/login?error=${encodeURIComponent(decodedError)}`);
      return;
    }

    // Gestion du succès
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Normaliser les données utilisateur
        const normalizedUser = {
          id: typeof user.id === 'number' ? user.id : (user.id ? parseInt(String(user.id), 10) : 0),
          email: user.email || '',
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          role: (user.role || user.role_name || 'student') as 'student' | 'instructor' | 'admin',
          phone: user.phone || null,
          organization: user.organization || null,
          country: user.country || null,
          isEmailVerified: user.emailVerified ?? user.email_verified ?? true,
          isActive: user.isActive ?? user.is_active ?? true,
          createdAt: user.createdAt || user.created_at || new Date().toISOString(),
          updatedAt: user.updatedAt || user.updated_at || new Date().toISOString()
        };

        console.log('✅ [GOOGLE CALLBACK] Success - User:', normalizedUser);

        // Mettre à jour le store
        setUser(normalizedUser);
        setTokens(token, token);

        // Stocker dans localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }

        // Rediriger vers le dashboard
        const userRole = normalizedUser.role || 'student';
        const dashboardPath = `/dashboard/${userRole}`;
        console.log(`🔄 [GOOGLE CALLBACK] Redirecting to: ${dashboardPath}`);
        setTimeout(() => {
          window.location.replace(dashboardPath);
        }, 300);
      } catch (parseError) {
        console.error('❌ [GOOGLE CALLBACK] Error parsing user data:', parseError);
        window.location.replace('/login?error=parse_error');
      }
      return;
    }

    // Si aucune donnée n'est présente
    console.warn('⚠️ [GOOGLE CALLBACK] No data in URL');
    window.location.replace('/login?error=no_data');
  }, [searchParams, setUser, setTokens]);

  // Afficher un loader
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Authentification en cours...</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <>
      {/* Script inline pour envoyer le message immédiatement avant React */}
      {/* ⚠️ CRITIQUE : Ce script doit s'exécuter AVANT React et empêcher tout rendu si c'est une popup */}
      <script
        data-keep
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                const userStr = urlParams.get('user');
                const error = urlParams.get('error');
                const isPopup = window.opener && !window.opener.closed;
                
                console.log('🚀 [GOOGLE CALLBACK INLINE] Script executing...', { isPopup, hasToken: !!token, hasUser: !!userStr, hasError: !!error });
                
                // ⚠️ CRITIQUE : Si c'est une popup, on envoie le message et on NE REDIRIGE JAMAIS
                if (token && userStr && !error && isPopup) {
                  console.log('🚀 [GOOGLE CALLBACK INLINE] This is a popup - sending message, NO REDIRECT, NO STORE UPDATE');
                  try {
                    const user = JSON.parse(decodeURIComponent(userStr));
                    const normalizedUser = {
                      id: typeof user.id === 'number' ? user.id : (user.id ? parseInt(String(user.id), 10) : 0),
                      email: user.email || '',
                      firstName: user.firstName || user.first_name || '',
                      lastName: user.lastName || user.last_name || '',
                      role: (user.role || user.role_name || 'student'),
                      phone: user.phone || null,
                      organization: user.organization || null,
                      country: user.country || null,
                      isEmailVerified: user.emailVerified ?? user.email_verified ?? true,
                      isActive: user.isActive ?? user.is_active ?? true,
                      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
                      updatedAt: user.updatedAt || user.updated_at || new Date().toISOString()
                    };
                    
                    // Envoyer le message plusieurs fois pour s'assurer qu'il est reçu
                    for (let i = 0; i < 5; i++) {
                      setTimeout(() => {
                        if (window.opener && !window.opener.closed) {
                          window.opener.postMessage(
                            {
                              type: 'GOOGLE_AUTH_SUCCESS',
                              user: normalizedUser,
                              token: token
                            },
                            window.location.origin
                          );
                          console.log('✅ [GOOGLE CALLBACK INLINE] Message sent (attempt ' + (i + 1) + ')');
                        }
                      }, i * 50);
                    }
                    
                    // Marquer dans sessionStorage pour éviter le double traitement
                    sessionStorage.setItem('google_oauth_message_sent', 'true');
                    sessionStorage.setItem('google_oauth_is_popup', 'true');
                    
                    // ⚠️ CRITIQUE : NE JAMAIS REDIRIGER ICI - La fenêtre principale le fera
                    // ⚠️ CRITIQUE : NE PAS METTRE À JOUR LE STORE ICI - Cela pourrait déclencher des redirections
                    console.log('✅ [GOOGLE CALLBACK INLINE] Message sent, popup will close - NO REDIRECT, NO STORE UPDATE');
                    
                    // Fermer la popup après un court délai
                    setTimeout(() => {
                      try {
                        window.close();
                      } catch (e) {
                        // Ignorer
                      }
                    }, 300);
                  } catch (e) {
                    console.error('❌ [GOOGLE CALLBACK INLINE] Error:', e);
                  }
                } else if (error && isPopup) {
                  console.log('🚀 [GOOGLE CALLBACK INLINE] Sending error message (popup)...');
                  try {
                    window.opener.postMessage(
                      {
                        type: 'GOOGLE_AUTH_ERROR',
                        error: decodeURIComponent(error)
                      },
                      window.location.origin
                    );
                    sessionStorage.setItem('google_oauth_message_sent', 'true');
                    sessionStorage.setItem('google_oauth_is_popup', 'true');
                    setTimeout(() => {
                      try {
                        window.close();
                      } catch (e) {
                        // Ignorer
                      }
                    }, 300);
                  } catch (e) {
                    console.error('❌ [GOOGLE CALLBACK INLINE] Error sending error:', e);
                  }
                } else if (!isPopup && token && userStr) {
                  // Si ce n'est pas une popup, on peut traiter normalement
                  console.log('🔄 [GOOGLE CALLBACK INLINE] Not a popup, will process normally');
                }
              } catch (e) {
                console.error('❌ [GOOGLE CALLBACK INLINE] Error in inline script:', e);
              }
            })();
          `,
        }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        }
      >
        <GoogleCallbackContent />
      </Suspense>
    </>
  );
}
