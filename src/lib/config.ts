// Configuration de l'application
export const config = {
  // URLs des services
  api: {
    moodle: process.env.NEXT_PUBLIC_MOODLE_API_URL || 'http://localhost/moodle',
    keycloak: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
    minio: process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000',
  },
  
  // Configuration Keycloak
  keycloak: {
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'mdsc',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'mdsc-frontend',
  },
  
  // Configuration Moodle
  moodle: {
    token: process.env.NEXT_PUBLIC_MOODLE_TOKEN || '',
    wsUrl: '/webservice/rest/server.php',
  },
  
  // Configuration de l'application
  app: {
    name: 'Maison de la Société Civile',
    tagline: 'crédibilité, innovation',
    description: 'Plateforme d\'apprentissage en ligne pour renforcer les capacités des organisations de la société civile',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supportEmail: 'support@mdsc.ci',
    contactEmail: 'contact@mdsc.ci',
  },
  
  // Configuration PWA
  pwa: {
    name: 'Maison de la Société Civile MOOC',
    shortName: 'Maison de la Société Civile',
    description: 'Plateforme d\'apprentissage Maison de la Société Civile',
    themeColor: '#1e3a8a',
    backgroundColor: '#ffffff',
  },
  
  // Configuration des langues
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'] as const,
    fallbackLocale: 'fr',
  },
  
  // Configuration des fonctionnalités
  features: {
    registration: true,
    socialLogin: true,
    offlineMode: true,
    notifications: true,
    analytics: false, // À activer en production
  },
  
  // Configuration des limites
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImageSize: 2 * 1024 * 1024, // 2MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  },
  
  // Configuration des réseaux sociaux
  social: {
    facebook: 'https://facebook.com/mdsc.ci',
    twitter: 'https://twitter.com/mdsc_ci',
    linkedin: 'https://linkedin.com/company/mdsc',
    youtube: 'https://youtube.com/mdsc',
  },
} as const;

// Types dérivés de la configuration
export type Config = typeof config;
export type SupportedLocale = Config['i18n']['locales'][number];
