'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('📥 [GOOGLE CALLBACK] Page loaded');
    console.log('📥 [GOOGLE CALLBACK] URL:', window.location.href);
    console.log('📥 [GOOGLE CALLBACK] Has window.opener:', !!window.opener);
    console.log('📥 [GOOGLE CALLBACK] Search params:', {
      token: searchParams.get('token') ? 'present' : 'missing',
      error: searchParams.get('error'),
      user: searchParams.get('user') ? 'present' : 'missing',
    });

    // Vérifier aussi dans le hash (certains backends utilisent le hash)
    const hash = window.location.hash;
    console.log('📥 [GOOGLE CALLBACK] Hash:', hash ? 'present' : 'missing');

    // Fonction pour envoyer un message au parent
    const sendMessageToParent = (type: string, data: any) => {
      if (window.opener && !window.opener.closed) {
        console.log(`📤 [GOOGLE CALLBACK] Sending ${type} to parent`);
        window.opener.postMessage(
          {
            type,
            ...data,
          },
          window.location.origin
        );
        console.log(`✅ [GOOGLE CALLBACK] Message sent to parent`);
      } else {
        console.warn('⚠️ [GOOGLE CALLBACK] No window.opener or opener is closed');
      }
    };

    // Fonction pour fermer la popup
    const closePopup = () => {
      console.log('🔒 [GOOGLE CALLBACK] Closing popup...');
      // Essayer plusieurs fois de fermer (certains navigateurs bloquent)
      try {
        window.close();
        // Si ça ne ferme pas, essayer après un délai
        setTimeout(() => {
          if (!window.closed) {
            console.warn('⚠️ [GOOGLE CALLBACK] Popup did not close, trying again...');
            window.close();
          }
        }, 1000);
      } catch (e) {
        console.error('❌ [GOOGLE CALLBACK] Error closing popup:', e);
      }
    };

    // Vérifier si on a des données dans les query params (si le backend redirige avec des données)
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const userStr = searchParams.get('user');

    // Vérifier si l'URL contient des indicateurs d'erreur (comme "Unauthorized", "401", "403", etc.)
    const currentUrl = window.location.href.toLowerCase();
    const hasUnauthorizedError = currentUrl.includes('unauthorized') || 
                                 currentUrl.includes('401') || 
                                 currentUrl.includes('403') ||
                                 currentUrl.includes('access_denied') ||
                                 currentUrl.includes('error=access_denied');
    
    if (hasUnauthorizedError && !token && !error) {
      // Le backend a probablement redirigé vers une page d'erreur
      console.error('❌ [GOOGLE CALLBACK] Unauthorized error detected in URL');
      console.error('❌ [GOOGLE CALLBACK] Full URL:', window.location.href);
      console.error('❌ [GOOGLE CALLBACK] This might be a backend configuration issue:');
      console.error('   - Check if the callback URL is correctly configured in Google Cloud Console');
      console.error('   - Check if the backend has the correct GOOGLE_CALLBACK_URL environment variable');
      console.error('   - Check if the oauth_role_tokens table exists and is accessible');
      console.error('   - Check if the role token was correctly stored in the database');
      
      sendMessageToParent('GOOGLE_AUTH_ERROR', {
        error: 'Erreur d\'autorisation : le serveur n\'a pas pu traiter votre demande. Vérifiez la configuration du serveur.',
      });
      setTimeout(closePopup, 500);
      return;
    }

    // Gestion des erreurs
    if (error) {
      const decodedError = decodeURIComponent(error);
      console.error('❌ [GOOGLE CALLBACK] Error from query params:', decodedError);
      console.error('❌ [GOOGLE CALLBACK] Full error details:', {
        raw: error,
        decoded: decodedError,
        url: window.location.href,
      });
      
      // Détecter si c'est une erreur de paramètres SQL undefined
      if (decodedError.includes('Bind parameters must not contain undefined')) {
        console.error('❌ [GOOGLE CALLBACK] SQL undefined parameter error detected');
        console.error('❌ [GOOGLE CALLBACK] This is a backend issue - the backend is trying to insert undefined values into the database');
        console.error('❌ [GOOGLE CALLBACK] The backend should convert undefined to null before database insertion');
      }
      
      // Détecter les erreurs liées au rôle
      if (decodedError.toLowerCase().includes('role') || decodedError.toLowerCase().includes('rôle')) {
        console.error('❌ [GOOGLE CALLBACK] Role-related error detected');
        console.error('❌ [GOOGLE CALLBACK] The role might not have been stored correctly in the database');
        console.error('❌ [GOOGLE CALLBACK] Check if the oauth_role_tokens table is working correctly');
      }
      
      sendMessageToParent('GOOGLE_AUTH_ERROR', {
        error: decodedError,
      });
      setTimeout(closePopup, 500);
      return;
    }

    // Gestion du succès avec données dans query params
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('✅ [GOOGLE CALLBACK] Success data from query params');
        console.log('✅ [GOOGLE CALLBACK] User data:', user);
        console.log('✅ [GOOGLE CALLBACK] Token:', token ? 'Token present' : 'Token missing');
        console.log('✅ [GOOGLE CALLBACK] User role from backend:', user.role || user.role_name || 'NOT PROVIDED');
        
        // Récupérer le rôle depuis sessionStorage si le backend ne l'a pas fourni
        const roleFromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null;
        if (!user.role && !user.role_name && roleFromStorage) {
          console.warn('⚠️ [GOOGLE CALLBACK] Backend did not provide a role, using role from sessionStorage:', roleFromStorage);
          user.role = roleFromStorage;
        }
        
        // Vérifier que les données utilisateur ne contiennent pas d'undefined
        const userKeys = Object.keys(user);
        const undefinedKeys = userKeys.filter(key => user[key] === undefined);
        if (undefinedKeys.length > 0) {
          console.warn('⚠️ [GOOGLE CALLBACK] User data contains undefined values:', undefinedKeys);
          console.warn('⚠️ [GOOGLE CALLBACK] This might cause issues. Normalizing data...');
          
          // Normaliser les valeurs undefined en null
          undefinedKeys.forEach(key => {
            user[key] = null;
          });
        }
        
        console.log('✅ [GOOGLE CALLBACK] Final user role to send:', user.role || user.role_name || 'NOT SET');

        sendMessageToParent('GOOGLE_AUTH_SUCCESS', {
          user,
          token,
        });

        setTimeout(closePopup, 500);
        return;
      } catch (parseError) {
        console.error('❌ [GOOGLE CALLBACK] Error parsing user data:', parseError);
        sendMessageToParent('GOOGLE_AUTH_ERROR', {
          error: 'Erreur lors du traitement des données',
        });
        setTimeout(closePopup, 500);
        return;
      }
    }

    // Vérifier aussi dans le hash (format: #token=xxx&user=xxx)
    if (hash && hash.startsWith('#')) {
      console.log('🔍 [GOOGLE CALLBACK] Checking hash for data...');
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashToken = hashParams.get('token');
      const hashError = hashParams.get('error');
      const hashUserStr = hashParams.get('user');

      if (hashError) {
        console.error('❌ [GOOGLE CALLBACK] Error from hash:', hashError);
        sendMessageToParent('GOOGLE_AUTH_ERROR', {
          error: decodeURIComponent(hashError),
        });
        setTimeout(closePopup, 500);
        return;
      }

      if (hashToken && hashUserStr) {
        try {
          const user = JSON.parse(decodeURIComponent(hashUserStr));
          console.log('✅ [GOOGLE CALLBACK] Success data from hash');
          console.log('✅ [GOOGLE CALLBACK] User role from backend:', user.role || user.role_name || 'NOT PROVIDED');
          
          // Récupérer le rôle depuis sessionStorage si le backend ne l'a pas fourni
          const roleFromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null;
          if (!user.role && !user.role_name && roleFromStorage) {
            console.warn('⚠️ [GOOGLE CALLBACK] Backend did not provide a role, using role from sessionStorage:', roleFromStorage);
            user.role = roleFromStorage;
          }
          
          console.log('✅ [GOOGLE CALLBACK] Final user role to send:', user.role || user.role_name || 'NOT SET');
          
          sendMessageToParent('GOOGLE_AUTH_SUCCESS', {
            user,
            token: hashToken,
          });
          setTimeout(closePopup, 500);
          return;
        } catch (parseError) {
          console.error('❌ [GOOGLE CALLBACK] Error parsing user data from hash:', parseError);
        }
      }
    }

    // Si on n'a pas de données dans les query params ni dans le hash, 
    // le backend pourrait envoyer un message directement
    console.log('⏳ [GOOGLE CALLBACK] No data in URL, waiting for message from backend...');
    console.log('⏳ [GOOGLE CALLBACK] Current URL:', window.location.href);
    console.log('⏳ [GOOGLE CALLBACK] This might indicate:');
    console.log('   - The backend is processing the callback');
    console.log('   - The backend will redirect with token/user data');
    console.log('   - Or there might be an issue with the backend callback handler');
    
    // Vérifier si on est sur une page d'erreur du backend
    const pageText = document.body?.innerText || document.body?.textContent || '';
    if (pageText.includes('Unauthorized') || pageText.includes('401') || pageText.includes('403')) {
      console.error('❌ [GOOGLE CALLBACK] Error page detected in body content');
      sendMessageToParent('GOOGLE_AUTH_ERROR', {
        error: 'Erreur d\'autorisation : le serveur n\'a pas pu traiter votre demande.',
      });
      setTimeout(closePopup, 500);
      return;
    }

    // Écouter aussi les changements d'URL dans la popup (si le backend redirige après)
    let lastUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        console.log('🔄 [GOOGLE CALLBACK] URL changed, reloading...');
        lastUrl = window.location.href;
        window.location.reload();
      }
    }, 500);

    const messageListener = (event: MessageEvent) => {
      console.log('📨 [GOOGLE CALLBACK] Message received:', {
        origin: event.origin,
        type: event.data?.type,
        hasData: !!event.data,
      });

      // Accepter les messages depuis n'importe quelle origine pour cette page de callback
      // (le backend pourrait être sur un autre domaine)
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { user, token } = event.data;
        console.log('✅ [GOOGLE CALLBACK] Success message from backend');
        console.log('✅ [GOOGLE CALLBACK] User:', user);
        console.log('✅ [GOOGLE CALLBACK] Token:', token ? 'present' : 'missing');
        console.log('✅ [GOOGLE CALLBACK] User role from backend:', user?.role || user?.role_name || 'NOT PROVIDED');
        
        // Récupérer le rôle depuis sessionStorage si le backend ne l'a pas fourni
        if (user && !user.role && !user.role_name) {
          const roleFromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRole') : null;
          if (roleFromStorage) {
            console.warn('⚠️ [GOOGLE CALLBACK] Backend did not provide a role, using role from sessionStorage:', roleFromStorage);
            user.role = roleFromStorage;
          }
        }
        
        console.log('✅ [GOOGLE CALLBACK] Final user role to send:', user?.role || user?.role_name || 'NOT SET');

        sendMessageToParent('GOOGLE_AUTH_SUCCESS', {
          user,
          token,
        });

        clearInterval(urlCheckInterval);
        window.removeEventListener('message', messageListener);
        setTimeout(closePopup, 500);
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        console.error('❌ [GOOGLE CALLBACK] Error message from backend:', event.data.error);
        sendMessageToParent('GOOGLE_AUTH_ERROR', {
          error: event.data.error || 'Erreur lors de la connexion',
        });

        clearInterval(urlCheckInterval);
        window.removeEventListener('message', messageListener);
        setTimeout(closePopup, 500);
      }
    };

    window.addEventListener('message', messageListener);

    // Timeout après 30 secondes
    const timeout = setTimeout(() => {
      console.warn('⚠️ [GOOGLE CALLBACK] Timeout waiting for message or data');
      clearInterval(urlCheckInterval);
      window.removeEventListener('message', messageListener);
      sendMessageToParent('GOOGLE_AUTH_ERROR', {
        error: 'Timeout : aucune réponse du serveur après 30 secondes',
      });
      setTimeout(closePopup, 500);
    }, 30000);

    return () => {
      clearInterval(urlCheckInterval);
      window.removeEventListener('message', messageListener);
      clearTimeout(timeout);
    };
  }, [searchParams]);

  // Afficher un loader pendant le traitement
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Authentification en cours...</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
        <p className="text-xs text-gray-400 mt-4">Ne fermez pas cette fenêtre</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
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
  );
}
