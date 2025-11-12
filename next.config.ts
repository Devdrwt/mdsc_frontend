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
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
