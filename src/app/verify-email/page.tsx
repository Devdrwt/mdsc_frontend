'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '../../lib/services/authService';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    const verifyEmailToken = async () => {
      try {
        const response = await verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          setMessage('Votre email a été vérifié avec succès ! Votre compte est maintenant actif.');
          
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Erreur lors de la vérification de l\'email.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Erreur lors de la vérification de l\'email.');
      }
    };

    verifyEmailToken();
  }, [token, router]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Vérification en cours...';
      case 'success':
        return 'Email vérifié !';
      case 'error':
        return 'Erreur de vérification';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50';
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className={`${getBgColor()} rounded-lg p-8 text-center`}>
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getTitle()}
          </h1>
          
          <p className="text-gray-700 mb-6">
            {message}
          </p>

          {status === 'success' && (
            <div className="text-sm text-gray-600 mb-4">
              <p>Vous allez être redirigé vers la page de connexion...</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full btn-mdsc-primary"
            >
              Aller à la page de connexion
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full btn-mdsc-outline"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
