import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import ClientProviders from "../components/providers/ClientProviders";

const playfairDisplay = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [
    {
      path: "./fonts/PlayfairDisplay-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/PlayfairDisplay-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
});

const openSans = localFont({
  variable: "--font-open-sans",
  display: "swap",
  src: [
    {
      path: "./fonts/OpenSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/OpenSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Maison de la Société Civile - Plateforme MOOC",
  description: "Plateforme d'apprentissage en ligne pour renforcer les capacités des organisations de la société civile. Cours, certifications et accompagnement pour la crédibilité et l'innovation.",
  icons: {
    icon: '/mdsc-logo1.png',
    shortcut: '/mdsc-logo1.png',
    apple: '/mdsc-logo1.png',
  },
  keywords: ["formation", "OSC", "société civile", "apprentissage", "certification", "Côte d'Ivoire"],
  authors: [{ name: "Maison de la Société Civile" }],
  creator: "Équipe Dev Drwintech inc",
  publisher: "Maison de la Société Civile",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "Maison de la Société Civile - Plateforme MOOC",
    description: "Renforcez les capacités de votre organisation avec nos formations spécialisées pour la société civile.",
    url: 'http://localhost:3000',
    siteName: 'Maison de la Société Civile',
    images: [
      {
        url: '/mdsc-logo.png', // Utilisation du logo existant en attendant l'image OG
        width: 1200,
        height: 630,
        alt: 'Maison de la Société Civile - Plateforme MOOC',
      },
    ],
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Maison de la Société Civile - Plateforme MOOC",
    description: "Renforcez les capacités de votre organisation avec nos formations spécialisées.",
    images: ['/mdsc-logo.png'], // Utilisation du logo existant en attendant l'image Twitter
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script Kkiapay SDK */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var script = document.createElement('script');
                script.src = 'https://cdn.kkiapay.me/k.js';
                script.async = true;
                script.onload = function() {
                  console.log('[Kkiapay] ✅ SDK chargé avec succès');
                  if (window.dispatchEvent) {
                    window.dispatchEvent(new Event('kkiapay-sdk-loaded'));
                  }
                };
                script.onerror = function() {
                  console.error('[Kkiapay] ❌ Erreur lors du chargement du SDK');
                };
                document.head.appendChild(script);
              })();
            `,
          }}
        />
        {/* Script Fedapay Checkout.js SDK */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Vérifier si le script est déjà chargé
                if (document.querySelector('script[src*="checkout.js"]')) {
                  console.log('[Fedapay] Script déjà présent, vérification de l\'API...');
                  checkFedaPayAPI();
                  return;
                }
                
                var script = document.createElement('script');
                script.src = 'https://cdn.fedapay.com/checkout.js?v=1.1.7';
                script.async = true;
                script.onload = function() {
                  console.log('[Fedapay] ✅ Script checkout.js chargé');
                  // Vérifier l'API après plusieurs tentatives
                  checkFedaPayAPI();
                };
                script.onerror = function() {
                  console.error('[Fedapay] ❌ Erreur lors du chargement du script checkout.js');
                  if (window.dispatchEvent) {
                    window.dispatchEvent(new Event('fedapay-sdk-error'));
                  }
                };
                document.head.appendChild(script);
                
                // Fonction pour vérifier l'API FedaPay
                function checkFedaPayAPI() {
                  var attempts = 0;
                  var maxAttempts = 50; // 5 secondes max (50 * 100ms)
                  
                  var checkInterval = setInterval(function() {
                    attempts++;
                    
                    // Vérifier plusieurs noms possibles pour l'API
                    var fedapayAPI = window.FedaPay || window.fedapay || window.FedaPayCheckout || window.FedaPayCheckoutJS;
                    
                    if (fedapayAPI) {
                      console.log('[Fedapay] ✅ API détectée:', {
                        hasFedaPay: !!window.FedaPay,
                        hasfedapay: !!window.fedapay,
                        hasFedaPayCheckout: !!window.FedaPayCheckout,
                        hasFedaPayCheckoutJS: !!window.FedaPayCheckoutJS,
                        apiType: typeof fedapayAPI,
                        apiKeys: fedapayAPI ? Object.keys(fedapayAPI) : null,
                        hasInit: typeof fedapayAPI.init === 'function',
                        hasCheckout: typeof fedapayAPI.checkout === 'function',
                      });
                      
                      // Normaliser l'API dans window.FedaPay si elle existe ailleurs
                      if (!window.FedaPay && fedapayAPI) {
                        window.FedaPay = fedapayAPI;
                        console.log('[Fedapay] ✅ API normalisée dans window.FedaPay');
                      }
                      
                      clearInterval(checkInterval);
                      if (window.dispatchEvent) {
                        window.dispatchEvent(new Event('fedapay-sdk-loaded'));
                      }
                    } else if (attempts >= maxAttempts) {
                      console.error('[Fedapay] ❌ API non disponible après ' + maxAttempts + ' tentatives');
                      console.error('[Fedapay] window keys:', Object.keys(window).filter(function(k) {
                        return k.toLowerCase().includes('feda') || k.toLowerCase().includes('pay');
                      }));
                      clearInterval(checkInterval);
                      if (window.dispatchEvent) {
                        window.dispatchEvent(new Event('fedapay-sdk-error'));
                      }
                    }
                  }, 100);
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var storedTheme = localStorage.getItem('mdsc-theme');
                  var storedLanguage = localStorage.getItem('mdsc-language');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme;

                  // Si la préférence est 'system' ou null, utiliser la préférence système
                  if (storedTheme === 'system' || !storedTheme) {
                    theme = prefersDark ? 'dark' : 'light';
                    if (!storedTheme) {
                      localStorage.setItem('mdsc-theme', 'system');
                    }
                  } else if (storedTheme === 'light' || storedTheme === 'dark') {
                    theme = storedTheme;
                  } else {
                    // Valeur invalide, réinitialiser à 'system'
                    theme = prefersDark ? 'dark' : 'light';
                    localStorage.setItem('mdsc-theme', 'system');
                  }

                  root.classList.toggle('dark', theme === 'dark');
                  root.dataset.theme = theme;

                  if (storedLanguage === 'fr' || storedLanguage === 'en') {
                    root.setAttribute('lang', storedLanguage);
                  }
                } catch (error) {
                  console.warn('Préférences d\'affichage indisponibles avant l\'initialisation.', error);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${playfairDisplay.variable} ${openSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
