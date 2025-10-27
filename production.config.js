// Configuration pour la production
module.exports = {
  // Configuration de l'environnement
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_ENV: 'production',
  },
  
  // Configuration des variables d'environnement
  env: {
    // Ces valeurs seront remplacées par Vercel
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://votre-api-vercel.vercel.app/api',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'votre_google_client_id',
  },
};
