'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../lib/context/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Détecter le thème actuel
  useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const htmlElement = document.documentElement;
        const hasDarkClass = htmlElement.classList.contains('dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedTheme = localStorage.getItem('mdsc-theme');
        
        let currentTheme = 'light';
        if (hasDarkClass) {
          currentTheme = 'dark';
        } else if (storedTheme === 'dark') {
          currentTheme = 'dark';
        } else if (storedTheme === 'system' && prefersDark) {
          currentTheme = 'dark';
        }
        
        setIsDark(currentTheme === 'dark');
      }
    };

    checkTheme();

    // Écouter les changements de thème
    const observer = new MutationObserver(checkTheme);
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleChange);

    // Écouter les changements dans le localStorage
    const handleStorageChange = () => checkTheme();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mdsc-theme-changed', handleStorageChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mdsc-theme-changed', handleStorageChange);
    };
  }, [theme]);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Vérifier que le manifest est accessible (nécessaire pour l'installation PWA)
    const checkManifest = async () => {
      try {
        const response = await fetch('/manifest.json');
        if (!response.ok) {
          console.error('[PWA] ❌ Manifest non accessible:', response.status);
          return false;
        }
        const manifest = await response.json();
        console.log('[PWA] ✅ Manifest accessible:', manifest.name);
        
        // Vérifier que le manifest a les champs requis
        if (!manifest.name || !manifest.icons || manifest.icons.length === 0) {
          console.error('[PWA] ❌ Manifest invalide: champs requis manquants');
          return false;
        }
        return true;
      } catch (error) {
        console.error('[PWA] ❌ Erreur lors de la vérification du manifest:', error);
        return false;
      }
    };

    // Vérifier le service worker
    const checkServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('[PWA] ⚠️ Service Worker non supporté');
        return false;
      }
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          console.log('[PWA] ✅ Service Worker actif:', registration.scope);
          return true;
        } else {
          console.log('[PWA] ⚠️ Service Worker non enregistré ou inactif');
          return false;
        }
      } catch (error) {
        console.error('[PWA] ❌ Erreur lors de la vérification du service worker:', error);
        return false;
      }
    };

    // Vérifier si l'app peut être installée (fonctionne en ligne, hors ligne, avec ou sans compte)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('[PWA] ✅ beforeinstallprompt capturé - installation disponible');
      // Afficher immédiatement si beforeinstallprompt est disponible
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Vérifier les prérequis PWA et afficher le prompt
    const checkPWARequirements = async () => {
      const manifestOk = await checkManifest();
      const swOk = await checkServiceWorker();
      
      console.log('[PWA] État des prérequis:', {
        manifest: manifestOk,
        serviceWorker: swOk,
        isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        userAgent: navigator.userAgent,
      });

      // Vérifier si le prompt a été rejeté récemment (seulement 24h)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      let shouldShow = true;
      
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          console.log('[PWA] ⏸️ Prompt masqué (rejeté il y a', Math.round(hoursSinceDismissed), 'heures)');
          shouldShow = false;
        }
      }
      
      if (shouldShow && manifestOk) {
        // Afficher le prompt après un délai, même si beforeinstallprompt n'est pas disponible
        // Cela permet d'afficher les instructions d'installation manuelle
        const timer = setTimeout(() => {
          console.log('[PWA] 📱 Affichage du prompt d\'installation');
          setShowPrompt(true);
        }, 3000); // Attendre 3 secondes avant d'afficher
        
        return () => clearTimeout(timer);
      } else if (!manifestOk) {
        console.error('[PWA] ❌ Impossible d\'afficher le prompt: manifest non accessible');
      }
    };

    checkPWARequirements();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Installation automatique pour les navigateurs qui supportent beforeinstallprompt
      try {
        console.log('[PWA] 🚀 Déclenchement de l\'installation...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Résultat:', outcome);

        if (outcome === 'accepted') {
          console.log('[PWA] ✅ Application installée avec succès');
          setShowPrompt(false);
          setDeferredPrompt(null);
          setIsInstalled(true);
          // Supprimer le flag de rejet pour permettre une réinstallation si nécessaire
          localStorage.removeItem('pwa-install-dismissed');
        } else {
          console.log('[PWA] ❌ Installation annulée par l\'utilisateur');
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('[PWA] ❌ Erreur lors de l\'installation:', error);
        setShowPrompt(false);
      }
    } else {
      // Pour les navigateurs qui ne supportent pas beforeinstallprompt,
      // afficher un modal avec les instructions
      console.log('[PWA] ⚠️ beforeinstallprompt non disponible');
      setShowManualInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Ne pas réafficher pendant 24 heures seulement (au lieu de 7 jours)
    // Cela permet au prompt de réapparaître plus rapidement pour les tests
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  useEffect(() => {
    // Ne pas vérifier le localStorage ici car cela empêche l'affichage
    // Le prompt doit pouvoir réapparaître après actualisation
    // On vérifiera seulement lors du clic sur "Plus tard"
  }, []);

  if (isInstalled || (!showPrompt && !showManualInstructions)) {
    return null;
  }

  return (
    <>
      {/* Modal pour les instructions d'installation manuelle */}
      {showManualInstructions && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isDark ? 'bg-black/70' : 'bg-black/50'}`}>
          <div className={`rounded-xl shadow-2xl border max-w-md w-full p-6 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <svg
                    className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 00-4.5 0M8.625 8.25a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Installer l'application
                </h3>
              </div>
              <button
                onClick={() => setShowManualInstructions(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Pour installer l'application, utilisez le menu de votre navigateur :
            </p>
            
            <div className="space-y-3 mb-6">
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center mt-0.5 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}>
                  1
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Chrome / Edge
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cliquez sur le menu <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>⋮</span> en haut à droite, puis sélectionnez <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>"Installer l'application"</strong> ou cherchez l'icône <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>+</span> dans la barre d'adresse.
                  </p>
                </div>
              </div>
              
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center mt-0.5 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}>
                  2
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Firefox
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cliquez sur le menu <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>☰</span> en haut à droite, puis sélectionnez <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>"Installer"</strong> ou <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>"Ajouter à l'écran d'accueil"</strong>.
                  </p>
                </div>
              </div>
              
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center mt-0.5 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}>
                  3
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Safari
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cliquez sur <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>"Partager"</strong> dans la barre d'outils, puis sélectionnez <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>"Sur l'écran d'accueil"</strong>.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowManualInstructions(false)}
              className={`w-full text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark 
                  ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-md hover:shadow-lg focus:ring-blue-400 focus:ring-offset-gray-800' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 focus:ring-offset-white'
              }`}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Prompt d'installation normal */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-4">
      <div className={`rounded-lg shadow-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 00-4.5 0M8.625 8.25a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Installer l&apos;application
            </h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Installez l&apos;application pour un accès rapide et une meilleure expérience.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className={`flex-1 text-white text-xs font-medium px-4 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDark 
                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-md hover:shadow-lg focus:ring-blue-400 focus:ring-offset-gray-800' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 focus:ring-offset-white'
                }`}
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 focus:ring-gray-400 focus:ring-offset-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 focus:ring-offset-white'
                }`}
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      </div>
      )}
    </>
  );
}

