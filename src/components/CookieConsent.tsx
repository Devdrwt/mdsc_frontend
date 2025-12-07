'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../lib/context/ThemeContext';
import CookiePreferencesService, { CookiePreferences } from '../lib/services/cookiePreferencesService';
import toast from '../lib/utils/toast';

export default function CookieConsent() {
  const { theme } = useTheme();
  const [showConsent, setShowConsent] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

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

    const observer = new MutationObserver(checkTheme);
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleChange);

    window.addEventListener('mdsc-theme-changed', handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('mdsc-theme-changed', handleChange);
    };
  }, [theme]);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const checkPreferences = async () => {
      // 1. Vérifier d'abord localStorage pour éviter les appels API inutiles
      const consentShown = localStorage.getItem('mdsc-cookie-consent-shown');
      if (consentShown === 'true') {
        console.log('✅ [COOKIE CONSENT] Consentement déjà donné (localStorage)');
        return;
      }

      // 2. Vérifier via l'API si des préférences existent déjà
      try {
        const preferences = await CookiePreferencesService.getPreferences();
        // Si les préférences existent (même si refusées), l'utilisateur a déjà fait un choix
        // On vérifie si les préférences ont été explicitement définies
        // Si l'API retourne des préférences, c'est que l'utilisateur a déjà interagi
        const hasMadeChoice = preferences !== null && 
                              (preferences.analytics !== undefined || preferences.marketing !== undefined);
        
        if (hasMadeChoice) {
          // L'utilisateur a déjà fait un choix, marquer comme vu dans localStorage
          localStorage.setItem('mdsc-cookie-consent-shown', 'true');
          console.log('✅ [COOKIE CONSENT] Consentement déjà donné (API)');
          return;
        }

        // 3. Si aucune préférence n'existe, afficher le modal une seule fois
        console.log('📢 [COOKIE CONSENT] Affichage du modal de consentement');
        const timer = setTimeout(() => {
          setShowConsent(true);
        }, 2000);
        return () => clearTimeout(timer);
      } catch (error) {
        // En cas d'erreur API, vérifier localStorage avant d'afficher
        if (consentShown !== 'true') {
          console.warn('⚠️ [COOKIE CONSENT] Erreur API, vérification localStorage:', error);
          const timer = setTimeout(() => {
            setShowConsent(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    };
    
    checkPreferences();
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await CookiePreferencesService.savePreferences({
        essential: true,
        analytics: true,
        marketing: true,
      });
      // Marquer comme vu dans localStorage pour ne plus afficher
      localStorage.setItem('mdsc-cookie-consent-shown', 'true');
      setShowConsent(false);
      toast.success('Préférences enregistrées', 'Vos préférences de cookies ont été enregistrées');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement des préférences:', error);
      toast.error('Erreur', 'Impossible d\'enregistrer vos préférences. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await CookiePreferencesService.savePreferences({
        essential: true,
        analytics: false,
        marketing: false,
      });
      // Marquer comme vu dans localStorage pour ne plus afficher
      localStorage.setItem('mdsc-cookie-consent-shown', 'true');
      setShowConsent(false);
      toast.success('Préférences enregistrées', 'Vos préférences de cookies ont été enregistrées');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement des préférences:', error);
      toast.error('Erreur', 'Impossible d\'enregistrer vos préférences. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomize = () => {
    setShowDetails(true);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[70] p-4 animate-in slide-in-from-bottom-4 fade-in duration-300 ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
      <div className={`max-w-4xl mx-auto rounded-xl shadow-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {!showDetails ? (
          <>
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestion des cookies et données personnelles
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser l'utilisation de notre plateforme et personnaliser le contenu. En continuant à utiliser notre site, vous acceptez notre utilisation des cookies conformément à notre{' '}
                  <a href="/policies" className={`underline hover:no-underline ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    politique de confidentialité
                  </a>
                  .
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className={`flex-1 font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-blue-400 focus:ring-offset-gray-800' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 focus:ring-offset-white'
                }`}
              >
                {loading ? 'Enregistrement...' : 'Tout accepter'}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50 focus:ring-gray-400 focus:ring-offset-gray-800' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 focus:ring-offset-white'
                }`}
              >
                {loading ? 'Enregistrement...' : 'Tout refuser'}
              </button>
              <button
                onClick={handleCustomize}
                className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark 
                    ? 'text-gray-300 border-gray-600 hover:text-white hover:bg-gray-700/50 hover:border-gray-500 focus:ring-gray-400 focus:ring-offset-gray-800' 
                    : 'text-gray-700 border-gray-300 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 focus:ring-offset-white'
                }`}
              >
                Personnaliser
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Personnaliser vos préférences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Cookies nécessaires */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cookies nécessaires
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Ces cookies sont essentiels au fonctionnement de la plateforme et ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                      Toujours actif
                    </span>
                  </div>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cookies analytiques
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nous permettent d'analyser l'utilisation de la plateforme pour améliorer nos services.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`relative inline-flex items-center ml-4 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full ${
                      isDark ? 'focus:ring-blue-400 focus:ring-offset-gray-800' : 'focus:ring-blue-500 focus:ring-offset-white'
                    }`}
                    aria-label="Activer/désactiver les cookies analytiques"
                    aria-pressed={analyticsEnabled}
                  >
                    <span className={`relative inline-block w-11 h-6 rounded-full transition-colors duration-200 ${
                      analyticsEnabled
                        ? (isDark ? 'bg-blue-500' : 'bg-blue-600')
                        : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                    }`}>
                      <span className={`absolute top-[2px] left-[2px] block w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cookies marketing
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Utilisés pour vous proposer des contenus et publicités personnalisés.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarketingEnabled(!marketingEnabled)}
                    className={`relative inline-flex items-center ml-4 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full ${
                      isDark ? 'focus:ring-blue-400 focus:ring-offset-gray-800' : 'focus:ring-blue-500 focus:ring-offset-white'
                    }`}
                    aria-label="Activer/désactiver les cookies marketing"
                    aria-pressed={marketingEnabled}
                  >
                    <span className={`relative inline-block w-11 h-6 rounded-full transition-colors duration-200 ${
                      marketingEnabled
                        ? (isDark ? 'bg-blue-500' : 'bg-blue-600')
                        : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                    }`}>
                      <span className={`absolute top-[2px] left-[2px] block w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        marketingEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}></span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await CookiePreferencesService.savePreferences({
                      essential: true,
                      analytics: analyticsEnabled,
                      marketing: marketingEnabled,
                    });
                    // Marquer comme vu dans localStorage pour ne plus afficher
                    localStorage.setItem('mdsc-cookie-consent-shown', 'true');
                    setShowConsent(false);
                    toast.success('Préférences enregistrées', 'Vos préférences de cookies ont été enregistrées');
                  } catch (error: any) {
                    console.error('Erreur lors de l\'enregistrement des préférences:', error);
                    toast.error('Erreur', 'Impossible d\'enregistrer vos préférences. Veuillez réessayer.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={`flex-1 font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-blue-400 focus:ring-offset-gray-800' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 focus:ring-offset-white'
                }`}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50 focus:ring-gray-400 focus:ring-offset-gray-800' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 focus:ring-offset-white'
                }`}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

