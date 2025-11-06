'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { adminLogin, verify2FA, ApiError } from '../../lib/services/authService';
import { useAuthStore } from '../../lib/stores/authStore';
import { useNotification } from '../../lib/hooks/useNotification';

export default function AdminLoginForm() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { error: showError } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>(''); // Stocker l'email pour la vérification 2FA

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const emailValue = formData.get('email') as string;
      const passwordValue = formData.get('password') as string;

      setEmail(emailValue);
      setPassword(passwordValue);

      // Appeler l'API de connexion admin
      const response = await adminLogin(emailValue, passwordValue);
      
      console.log('🔐 [AdminLogin] Réponse API complète:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        requires2FA: response.data?.requires2FA,
        requires2fa: response.data?.requires2fa,
        hasSessionId: !!(response.data?.sessionId || response.data?.session_id),
        sessionId: response.data?.sessionId || response.data?.session_id,
        hasToken: !!response.data?.token,
        tokenType: typeof response.data?.token,
        tokenValue: response.data?.token ? response.data.token.substring(0, 20) + '...' : 'N/A',
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullData: JSON.stringify(response.data, null, 2), // Pour debug complet - format JSON
      });

      if (response.success && response.data) {
        // Pour les admins, 2FA est toujours requis si la connexion réussit
        // Détecter si 2FA est requis : soit explicitement, soit par la présence d'un sessionId, soit par l'absence de token
        const has2FA = response.data.requires2FA || response.data.requires2fa;
        const sessionId = response.data.sessionId || response.data.session_id || response.data.session;
        // Le backend attend probablement un adminId (ID numérique) plutôt qu'un email
        const adminId = response.data.adminId || response.data.admin_id || response.data.id || response.data.user?.id;
        const hasToken = !!(response.data.token || response.data.accessToken || response.data.access_token);
        const message = response.message || response.data.message || '';
        const codeSent = message.toLowerCase().includes('code') || message.toLowerCase().includes('2fa') || message.toLowerCase().includes('envoyé');
        
        // Pour les admins : si pas de token, on considère que 2FA est requis (comportement par défaut)
        // OU si explicitement indiqué, OU si le message indique qu'un code a été envoyé
        if (has2FA || (sessionId && !hasToken) || (!hasToken && codeSent) || !hasToken) {
          // Prioriser adminId, puis sessionId, puis email comme identifiant
          const finalSessionId = adminId ? String(adminId) : (sessionId || emailValue);
          setSessionId(finalSessionId);
          setAdminEmail(emailValue); // Stocker l'email pour la vérification 2FA
          setStep('2fa');
          // Afficher un message informatif
          console.log('✅ [AdminLogin] 2FA requis, code envoyé par email', { 
            sessionId: finalSessionId,
            adminId,
            hasExplicitSessionId: !!sessionId,
            email: emailValue
          });
          
          // Afficher un toast informatif (si disponible)
          // Le message sera affiché dans le formulaire 2FA
        } else {
          // Si pas de 2FA (non recommandé), connecter directement
          const user = response.data.user;
          const token = response.data.token || response.data.accessToken || response.data.access_token;
          const refreshToken = response.data.refreshToken || response.data.refresh_token;
          
          // Vérifier que le token existe et n'est pas "undefined"
          if (!token || token === 'undefined' || token === 'null') {
            console.error('❌ [AdminLogin] Token invalide:', { 
              token, 
              responseData: response.data,
              availableKeys: Object.keys(response.data || {})
            });
            showError('Erreur de connexion', 'Token manquant ou invalide dans la réponse du serveur. Vérifiez que 2FA est configuré.');
            return;
          }
          
          // Vérifier que l'utilisateur existe
          if (!user) {
            console.error('❌ [AdminLogin] User manquant:', { responseData: response.data });
            showError('Erreur de connexion', 'Données utilisateur manquantes dans la réponse du serveur');
            return;
          }
          
          // Stocker dans localStorage pour compatibilité avec api.ts
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
          }
          
          setUser({
            ...user,
            role: 'admin' as const,
            isEmailVerified: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setTokens(token, refreshToken || '');
          router.push('/dashboard/admin');
        }
      } else {
        showError('Erreur de connexion', response.message || 'Échec de la connexion. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      if (err instanceof ApiError) {
        // Détecter les erreurs spécifiques
        if (err.statusCode === 403 && (err.message.includes('Accès admin uniquement') || err.message.includes('admin uniquement'))) {
          showError(
            'Erreur de configuration backend', 
            'L\'endpoint de connexion admin est protégé par un middleware. Le backend doit permettre l\'accès à /admin/auth/login sans authentification préalable pour le login. Contactez l\'administrateur système.'
          );
        } else if (err.statusCode === 404) {
          showError(
            'Endpoint non trouvé', 
            'L\'endpoint de connexion admin n\'a pas été trouvé. Vérifiez la configuration du backend.'
          );
        } else if (err.statusCode === 403) {
          showError('Accès refusé', err.message || 'Vous n\'avez pas les permissions nécessaires.');
        } else {
          showError('Erreur de connexion', err.message);
        }
      } else {
        showError('Erreur de connexion', 'Erreur lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!sessionId) {
        showError('Erreur de session', 'Session invalide. Veuillez recommencer.');
        setStep('login');
        return;
      }

      // Utiliser le sessionId (qui peut être l'email si aucun sessionId explicite n'a été fourni)
      // Passer aussi l'email au cas où le backend le requiert
      const response = await verify2FA(sessionId, twoFactorCode, adminEmail);
      
      console.log('🔐 [AdminLogin 2FA] Réponse API:', {
        success: response.success,
        hasData: !!response.data,
        hasToken: !!response.data?.token,
        tokenType: typeof response.data?.token,
        tokenValue: response.data?.token ? response.data.token.substring(0, 20) + '...' : 'N/A',
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Vérifier que le token existe et n'est pas "undefined"
        if (!token || token === 'undefined' || token === 'null') {
          console.error('❌ [AdminLogin 2FA] Token invalide:', { token, responseData: response.data });
          showError('Erreur 2FA', 'Token manquant ou invalide dans la réponse du serveur');
          return;
        }
        
        // Stocker dans localStorage pour compatibilité avec api.ts
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
        
        setUser({
          ...user,
          role: 'admin' as const,
          isEmailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setTokens(token, refreshToken || '');
        router.push('/dashboard/admin');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showError('Erreur 2FA', err.message);
      } else {
        showError('Erreur 2FA', 'Code 2FA invalide. Veuillez réessayer.');
      }
      console.error('2FA verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === '2fa') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentification à deux facteurs
          </h2>
          <p className="text-gray-600 mb-2">
            Entrez le code à 6 chiffres envoyé à votre email
          </p>
          {adminEmail && (
            <p className="text-sm text-gray-500 font-medium">
              📧 {adminEmail}
            </p>
          )}
        </div>

        <form onSubmit={handle2FA} className="space-y-6">
          <div>
            <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
              Code de vérification
            </label>
            <input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              placeholder="000000"
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              Vérifiez votre boîte de réception (et les spams) pour le code de vérification
            </p>
            {adminEmail && (
              <p className="mt-1 text-xs text-gray-400">
                Code envoyé à : {adminEmail}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setStep('login');
                setTwoFactorCode('');
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={isLoading || twoFactorCode.length !== 6}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connexion Administrateur
        </h2>
        <p className="text-gray-600">
          Accès sécurisé à l'administration de la plateforme
        </p>
        <p className="mt-2 text-xs text-gray-500">
          ⚠️ Authentification à deux facteurs requise
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email administrateur
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={12}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Minimum 12 caractères requis
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          🔒 Connexion sécurisée • Session timeout 30 minutes
        </p>
      </div>
    </div>
  );
}

