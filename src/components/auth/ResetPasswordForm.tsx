'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../ui/Button';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { resetPassword } from '../../lib/services/authService';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.password || !formData.confirmPassword) {
      return 'Tous les champs doivent être remplis.';
    }

    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(token!, formData.password);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 3000);
      } else {
        setError(response.message || 'Erreur lors de la réinitialisation. Veuillez réessayer.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation. Veuillez réessayer.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-mdsc text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Lien invalide
          </h2>
          <p className="text-gray-700 mb-6">
            Le lien de réinitialisation est invalide ou a expiré.
          </p>
          <Button onClick={() => router.push('/forgot-password')}>
            Demander un nouveau lien
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-mdsc text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Mot de passe réinitialisé !
          </h2>
          <p className="text-gray-700 mb-6">
            Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <Button onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card-mdsc">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Nouveau mot de passe
          </h2>
          <p className="text-gray-700">
            Définissez votre nouveau mot de passe sécurisé
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600 border border-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-white" />
            <span className="text-white text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-700" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-700" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-700" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Exigences du mot de passe :
              </p>
              <ul className="text-blue-700 space-y-1">
                <li>• Au moins 8 caractères</li>
                <li>• Contient au moins une majuscule</li>
                <li>• Contient au moins une minuscule</li>
                <li>• Contient au moins un chiffre</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto">
        <div className="card-mdsc text-center">
          <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Chargement...
          </h2>
          <p className="text-gray-700">
            Préparation du formulaire de réinitialisation
          </p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
