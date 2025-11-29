import type { NextConfig } from "next";

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

export default nextConfig;
