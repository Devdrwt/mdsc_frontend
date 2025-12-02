import type { NextConfig } from "next";
// @ts-ignore - next-pwa types might not be fully compatible
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // Configuration pour la production
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimisations pour la production
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
    // Turbopack est utilisé en développement, Webpack en production (pour PWA)
    // Cet avertissement est normal et peut être ignoré
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '*',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuration des headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // X-Frame-Options explicitement défini à SAMEORIGIN pour permettre les iframes de la même origine
          // Cela permet les PDFs, vidéos et autres contenus embarqués tout en protégeant contre le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Headers pour les ressources PWA (accessibles publiquement)
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/apple-touch.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icon-192x192.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icon-512x512.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Permissions Policy pour les sessions live Jitsi
        // Permet l'accès aux médias (microphone, caméra, haut-parleur, partage d'écran)
        source: '/courses/:path*/live-sessions/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'speaker-selection=(self), microphone=(self), camera=(self), display-capture=(self), autoplay=(self), fullscreen=(self)',
          },
          {
            key: 'Feature-Policy',
            value: 'microphone *; camera *; speaker *',
          },
        ],
      },
    ];
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Proxy dev: /api -> backend local sur 5000
  // Note: Les routes API Next.js dans src/app/api/* ont automatiquement la priorité sur les rewrites
  async rewrites() {
    // Si NEXT_PUBLIC_API_URL est défini, ne pas utiliser de rewrites
    // (les appels API iront directement vers l'URL configurée)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    
    // Rewrite pour toutes les routes API
    // Les routes API Next.js (comme /api/media/*) seront appelées en premier
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

// Note: Le plugin PWA configure Webpack en interne, ce qui peut causer un avertissement
// avec Turbopack. C'est normal et peut être ignoré car :
// - En développement : PWA est désactivé (disable: true) et Turbopack est utilisé
// - En production : Webpack est utilisé normalement (pas Turbopack)
const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 année
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: "CacheFirst",
        options: {
          rangeRequests: true,
          cacheName: "static-audio-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\.(?:mp4)$/i,
        handler: "CacheFirst",
        options: {
          rangeRequests: true,
          cacheName: "static-video-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-js-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
        },
      },
      {
        urlPattern: /\/api\/.*$/i,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: ({ url }) => {
          const isSameOrigin = self.origin === url.origin;
          if (!isSameOrigin) return false;
          const pathname = url.pathname;
          // Exclure les routes API
          if (pathname.startsWith("/api/")) return false;
          return true;
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 heures
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

export default pwaConfig(nextConfig);
