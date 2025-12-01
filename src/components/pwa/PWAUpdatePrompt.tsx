'use client';

import { useState, useEffect } from 'react';

export default function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Vérifier les mises à jour du service worker
    if ('serviceWorker' in navigator) {
      let refreshing = false;

      // Écouter les mises à jour du service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // Vérifier régulièrement les mises à jour
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            // Vérifier les mises à jour toutes les heures
            setInterval(async () => {
              await registration.update();
            }, 60 * 60 * 1000);

            // Écouter l'installation d'un nouveau service worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Un nouveau service worker est installé et prêt
                    setUpdateAvailable(true);
                  }
                });
              }
            });

            // Vérifier immédiatement s'il y a une mise à jour en attente
            if (registration.waiting) {
              setUpdateAvailable(true);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des mises à jour:', error);
        }
      };

      checkForUpdates();
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        // Envoyer un message au service worker en attente pour qu'il s'active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Forcer le rechargement si pas de service worker en attente
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-top-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Mise à jour disponible
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Une nouvelle version de l&apos;application est disponible. Mettez à jour pour bénéficier des dernières fonctionnalités.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
              >
                {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

