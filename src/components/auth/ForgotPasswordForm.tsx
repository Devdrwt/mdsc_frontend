'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPassword, ApiError } from '../../lib/services/authService';
import { useNotification } from '../../lib/hooks/useNotification';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { error: showError, success: showSuccess } = useNotification();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Email requis', 'Veuillez saisir votre adresse email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        showSuccess('Email envoyé', 'Un lien de réinitialisation a été envoyé à votre adresse email');
        setIsEmailSent(true);
      } else {
        showError('Erreur d\'envoi', response.message || 'Erreur lors de l\'envoi de l\'email.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      if (err instanceof ApiError) {
        showError('Erreur d\'envoi', err.message || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
      } else {
        showError('Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez votre connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-mdsc text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Email envoyé !
          </h2>
          <p className="text-gray-700 mb-6">
            Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. 
            Vérifiez votre boîte de réception et suivez les instructions.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setIsEmailSent(false)}
              variant="outline"
              className="w-full"
            >
              Envoyer un autre email
            </Button>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Conseils :
                </p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                  <li>• Le lien expire dans 1 heure</li>
                  <li>• Contactez le support si vous ne recevez pas l'email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card-mdsc">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-mdsc-orange" />
          </div>
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-700">
            Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-700 hover:text-mdsc-blue font-medium text-sm flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la connexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
