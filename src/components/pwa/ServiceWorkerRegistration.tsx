'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker non supporté');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Vérifier si le service worker existe
        const response = await fetch('/sw.js', { method: 'HEAD' });
        if (!response.ok) {
          console.log('[PWA] Service Worker non trouvé (normal en développement)');
          return;
        }

        // Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] ✅ Service Worker enregistré:', registration.scope);

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] 📦 Nouvelle version disponible');
              } else if (newWorker.state === 'installed') {
                console.log('[PWA] ✅ Service Worker installé pour la première fois');
              }
            });
          }
        });
      } catch (error: unknown) {
        // Ne pas afficher d'erreur si le fichier n'existe pas (développement)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('404') || errorMessage?.includes('Failed to fetch')) {
          console.log('[PWA] Service Worker non disponible (normal en développement)');
        } else {
          console.error('[PWA] Erreur lors de l\'enregistrement:', errorMessage || error);
        }
      }
    };

    // Attendre que la page soit chargée
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }
  }, []);

  return null;
}

