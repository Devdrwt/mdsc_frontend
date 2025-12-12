'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPassword, ApiError } from '../../lib/services/authService';
import { useNotification } from '../../lib/hooks/useNotification';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { error: showError, success: showSuccess } = useNotification();
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      showError(t('emailRequired'), t('enterEmail'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        showSuccess(t('emailSent'), t('emailSentSuccess'));
        setIsEmailSent(true);
      } else {
        showError(t('sendError'), response.message || t('sendFailed'));
      }
    } catch (err) {
      console.error('Password reset error:', err);
      if (err instanceof ApiError) {
        showError(t('sendError'), err.message || t('tryAgainLater'));
      } else {
        showError(t('connectionError'), t('checkConnection'));
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
            {t('emailSent')}
          </h2>
          <p className="text-gray-700 mb-6">
            {t('resetLinkSent')} <strong>{email}</strong>. {t('checkInbox')}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setIsEmailSent(false)}
              variant="outline"
              className="w-full"
            >
              {t('sendAnotherEmail')}
            </Button>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              {t('backToLogin')}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  {t('tips')}
                </p>
                <ul className="text-blue-700 space-y-1">
                  <li>• {t('checkSpam')}</li>
                  <li>• {t('linkExpires')}</li>
                  <li>• {t('contactSupport')}</li>
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
            {t('title')}
          </h2>
          <p className="text-gray-700">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
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
            {isLoading ? t('submitting') : t('submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-700 hover:text-mdsc-blue font-medium text-sm flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToLogin')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
