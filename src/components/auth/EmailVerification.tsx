'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

interface EmailVerificationProps {
  email: string;
  verificationToken?: string | null;
  onResendEmail?: () => Promise<void>;
  onBack?: () => void;
  onVerified?: () => void;
}

export default function EmailVerification({ 
  email,
  verificationToken,
  onResendEmail, 
  onBack, 
  onVerified 
}: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!onResendEmail) return;
    
    setIsResending(true);
    
    try {
      await onResendEmail();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      // Gérer l'erreur silencieusement ou afficher un message
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card-mdsc">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-mdsc-blue" />
          </div>
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Vérifiez votre email
          </h2>
          <p className="text-gray-700 mb-4">
            Nous avons envoyé un email de vérification à
          </p>
          <p className="font-medium text-mdsc-blue mb-6">{email}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Consultez votre boîte email</strong> et cliquez sur le lien de vérification pour activer votre compte.
            </p>
          </div>

          {/* Afficher le lien en mode développement si le token est disponible */}
          {verificationToken && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm font-semibold mb-2">
                🔧 Mode Développement - Email non configuré
              </p>
              <p className="text-yellow-700 text-xs mb-3">
                Cliquez sur le lien ci-dessous pour vérifier votre compte :
              </p>
              <a
                href={`http://localhost:3000/verify-email?token=${verificationToken}`}
                className="block w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-lg text-sm font-medium text-center transition-colors break-all"
              >
                ✅ Vérifier mon compte maintenant
              </a>
            </div>
          )}
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 text-sm">
              Email de vérification renvoyé avec succès !
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Renvoyer l'email */}
          {onResendEmail && (
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-2">
                Vous n'avez pas reçu l'email ?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-mdsc-blue hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Renvoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Renvoyer l'email</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Retour à l'accueil */}
          <div className="text-center">
            <a
              href="/login"
              className="text-mdsc-blue-dark hover:text-mdsc-blue-primary font-medium text-sm flex items-center space-x-2 mx-auto justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Aller à la connexion</span>
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">
                Conseils :
              </p>
              <ul className="text-gray-700 space-y-1">
                <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                <li>• Le lien expire dans 24 heures</li>
                <li>• Après vérification, vous pourrez vous connecter</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
