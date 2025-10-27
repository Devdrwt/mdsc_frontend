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
      const selectedRole = sessionStorage.getItem('selectedRole') || 'student';
      
      // Ouvrir la popup Google OAuth
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google?role=${selectedRole}`;
      
      const popup = window.open(
        googleAuthUrl,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Écouter les messages de la popup
      const messageListener = (event: MessageEvent) => {
        // Vérifier l'origine du message pour la sécurité
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { user, token } = event.data;
          
          console.log('Google Auth Success - User data:', user);
          console.log('Google Auth Success - Token:', token);
          
          // Mettre à jour le store d'authentification
          const userData = {
            id: user.id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            organization: user.organization,
            country: user.country,
            isEmailVerified: user.emailVerified || true,
            createdAt: new Date().toISOString()
          };
          
          console.log('Setting user in store:', userData);
          setUser(userData);
          setTokens(token, token); // Utiliser le même token pour refresh token temporairement
          
          console.log('Store updated, redirecting to dashboard...');
          
          // Fermer la popup
          if (popup) {
            popup.close();
          }
          
          // Callback de succès
          if (onSuccess) {
            onSuccess();
          }
          
          // Attendre un peu pour que le store soit mis à jour
          setTimeout(() => {
            // Rediriger vers le dashboard
            router.push('/dashboard');
          }, 100);
          
          // Nettoyer le listener
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          const errorMessage = event.data.error || 'Erreur lors de la connexion avec Google';
          
          // Fermer la popup
          if (popup) {
            popup.close();
          }
          
          // Callback d'erreur
          if (onError) {
            onError(errorMessage);
          }
          
          // Nettoyer le listener
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);
      
      // Vérifier si la popup a été fermée manuellement
      const checkPopupClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Google login error:', error);
      if (onError) {
        onError('Erreur lors de l\'ouverture de la fenêtre de connexion Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mdsc-blue-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FcGoogle className="h-5 w-5 mr-3" />
      {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
    </button>
  );
}

