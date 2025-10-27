// Configuration des variables d'environnement

export const config = {
  // API URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  
  // API Keys
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  
  // App Configuration
  appName: 'MdSC MOOC Platform',
  appVersion: '1.0.0',
  
  // Features
  features: {
    gamification: process.env.NEXT_PUBLIC_ENABLE_GAMIFICATION === 'true',
    chatIA: process.env.NEXT_PUBLIC_ENABLE_CHAT_IA === 'true',
  },
  
  // Gamification
  gamification: {
    pointsPerCourse: 100,
    pointsPerQuiz: 50,
    pointsPerAssignment: 75,
    pointsPerLogin: 5,
    maxLoginStreak: 30,
  },
  
  // Chat IA
  chatIA: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
  },
} as const;

export default config;
