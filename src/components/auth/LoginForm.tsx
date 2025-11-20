'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';
import { ApiError } from '../../lib/services/authService';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';
import { useNotification } from '../../lib/hooks/useNotification';

export default function LoginForm() {
  const router = useRouter();
  const { login: authLogin, isLoading: authLoading } = useAuthStore();
  const { error: showError } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      // Utiliser le login du store (qui appelle déjà l'API)
      await authLogin(email, password);
      
      // Redirection vers le dashboard
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const errorMessage = err.statusCode === 403 
          ? err.message + ' Voulez-vous renvoyer l\'email de vérification ?'
          : err.message;
        showError('Erreur de connexion', errorMessage);
      } else {
        showError('Erreur de connexion', 'Erreur lors de la connexion. Veuillez réessayer.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Se connecter
        </h2>
        <p className="text-gray-600 text-base">
          Accédez à votre espace de formation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Adresse email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="block w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-teal-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-teal-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-teal-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              Se souvenir de moi
            </label>
          </div>

          <div className="text-sm">
            <a href="/forgot-password" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3.5 px-4 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connexion en cours...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">Ou continuer avec</span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleLoginButton 
            onError={(err) => showError('Erreur Google', err)}
          />
        </div>
      </div>

      <div className="mt-8 text-center pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Vous n'avez pas encore de compte ?{' '}
          <a href="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors inline-flex items-center gap-1">
            S'inscrire gratuitement
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </p>
      </div>
    </div>
  );
}
