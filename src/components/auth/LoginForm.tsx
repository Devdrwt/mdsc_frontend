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
  const { login: authLogin } = useAuthStore();
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

      await authLogin(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const errorMessage =
          err.statusCode === 403
            ? err.message + " Voulez-vous renvoyer l'email de vérification ?"
            : err.message;
        showError('Erreur de connexion', errorMessage);
      } else {
        showError(
          'Erreur de connexion',
          'Erreur lors de la connexion. Veuillez réessayer.'
        );
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-teal-600 mb-0">
          Se connecter
        </h2>

        <p className="text-gray-600">
          Accédez à votre espace de formation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champ email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-700" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        {/* Champ mot de passe */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-700" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-700" />
              ) : (
                <Eye className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Se souvenir de moi + Mot de passe oublié */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-mdsc-blue focus:ring-mdsc-blue border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Se souvenir de moi
            </label>
          </div>

          <div className="text-sm">
            <a href="/forgot-password" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        {/* 🟢 Boutons Se connecter + Retour à l'accueil */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="w-1/2 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>

          <a
            href="/"
            className="w-1/2 flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </a>
        </div>
      </form>

      {/* Ligne de séparation + connexion Google */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-700">Ou</span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleLoginButton onError={(err) => showError('Erreur Google', err)} />
        </div>
      </div>

      {/* Lien d'inscription */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-700">
          Vous n'avez pas encore de compte ?{' '}
          <a href="/register" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">
            S'inscrire gratuitement
          </a>
        </p>
      </div>
    </div>
  );
}
