import { apiRequest } from './api';

export interface ChatMessage {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  message: string;
  response: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'code';
  isFromUser: boolean;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  model: string;
  tokens: number;
  cost: number;
  processingTime: number;
  confidence: number;
  suggestions?: string[];
  relatedTopics?: string[];
  sources?: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
  isActive: boolean;
  messages: ChatMessage[];
}

export interface AISuggestion {
  id: string;
  type: 'course' | 'lesson' | 'quiz' | 'topic' | 'resource';
  title: string;
  description: string;
  relevance: number;
  confidence: number;
  metadata: any;
}

export interface AIAnalysis {
  id: string;
  type: 'performance' | 'engagement' | 'comprehension' | 'progress';
  userId: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  data: any;
  insights: string[];
  recommendations: string[];
  confidence: number;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'course' | 'lesson' | 'quiz' | 'resource' | 'study_plan';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relevance: number;
  confidence: number;
  metadata: any;
  createdAt: string;
  isRead: boolean;
  isAccepted: boolean;
}

export interface AIContentGeneration {
  id: string;
  type: 'course' | 'lesson' | 'quiz' | 'summary' | 'explanation';
  prompt: string;
  content: string;
  metadata: any;
  quality: number;
  createdAt: string;
}

export interface AITranslation {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  confidence: number;
  createdAt: string;
}

export interface AISpeechToText {
  id: string;
  audioUrl: string;
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  createdAt: string;
}

export interface AITextToSpeech {
  id: string;
  text: string;
  audioUrl: string;
  voice: string;
  language: string;
  speed: number;
  pitch: number;
  createdAt: string;
}

export interface AIImageGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  metadata: any;
  quality: number;
  createdAt: string;
}

export interface AIImageAnalysis {
  id: string;
  imageUrl: string;
  analysis: string;
  objects: string[];
  tags: string[];
  confidence: number;
  createdAt: string;
}

export interface AICodeGeneration {
  id: string;
  prompt: string;
  code: string;
  language: string;
  explanation: string;
  quality: number;
  createdAt: string;
}

export interface AICodeAnalysis {
  id: string;
  code: string;
  language: string;
  analysis: string;
  issues: string[];
  suggestions: string[];
  quality: number;
  createdAt: string;
}

export interface AISentimentAnalysis {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
  createdAt: string;
}

export interface AITopicModeling {
  id: string;
  text: string;
  topics: Array<{
    topic: string;
    weight: number;
    keywords: string[];
  }>;
  createdAt: string;
}

export interface AISummarization {
  id: string;
  text: string;
  summary: string;
  keyPoints: string[];
  length: number;
  compressionRatio: number;
  createdAt: string;
}

export interface AIQuestionGeneration {
  id: string;
  text: string;
  questions: Array<{
    question: string;
    answer: string;
    type: 'multiple-choice' | 'true-false' | 'open-ended';
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  createdAt: string;
}

export interface AIAnswerGeneration {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  confidence: number;
  sources: string[];
  createdAt: string;
}

export interface AIStudyPlan {
  id: string;
  userId: string;
  courseId: string;
  plan: Array<{
    day: number;
    topics: string[];
    activities: string[];
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  totalDays: number;
  estimatedHours: number;
  createdAt: string;
}

export interface AIProgressAnalysis {
  id: string;
  userId: string;
  courseId: string;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
  confidence: number;
  createdAt: string;
}

export interface AIPerformancePrediction {
  id: string;
  userId: string;
  courseId: string;
  prediction: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AIEngagementAnalysis {
  id: string;
  userId: string;
  courseId: string;
  engagement: number;
  factors: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AIComprehensionAnalysis {
  id: string;
  userId: string;
  courseId: string;
  comprehension: number;
  topics: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AIAdaptiveLearning {
  id: string;
  userId: string;
  courseId: string;
  adaptations: Array<{
    type: string;
    description: string;
    implementation: string;
    expectedOutcome: string;
  }>;
  createdAt: string;
}

export interface AIPersonalization {
  id: string;
  userId: string;
  preferences: any;
  recommendations: string[];
  adaptations: string[];
  createdAt: string;
}

export interface AIContentModeration {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  moderation: {
    isApproved: boolean;
    issues: string[];
    suggestions: string[];
    confidence: number;
  };
  createdAt: string;
}

export interface AIQualityAssessment {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  assessment: {
    quality: number;
    issues: string[];
    suggestions: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface AIAccessibilityAnalysis {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  analysis: {
    accessibility: number;
    issues: string[];
    suggestions: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface AIPlagiarismDetection {
  id: string;
  content: string;
  detection: {
    isPlagiarized: boolean;
    similarity: number;
    sources: string[];
    suggestions: string[];
  };
  createdAt: string;
}

export interface AIContentOptimization {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  optimization: {
    readability: number;
    engagement: number;
    clarity: number;
    suggestions: string[];
  };
  createdAt: string;
}

export interface AISEOOptimization {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  seo: {
    score: number;
    keywords: string[];
    suggestions: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface AIContentLocalization {
  id: string;
  content: string;
  sourceLanguage: string;
  targetLanguage: string;
  localization: {
    translatedContent: string;
    culturalAdaptations: string[];
    suggestions: string[];
  };
  createdAt: string;
}

export interface AIContentValidation {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  validation: {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface AIContentEnhancement {
  id: string;
  content: string;
  type: 'course' | 'lesson' | 'quiz' | 'assignment';
  enhancement: {
    enhancedContent: string;
    improvements: string[];
    suggestions: string[];
  };
  createdAt: string;
}

export interface AIContentGenerationRequest {
  type: 'course' | 'lesson' | 'quiz' | 'summary' | 'explanation';
  prompt: string;
  context?: any;
  parameters?: any;
}

export interface AIContentGenerationResponse {
  id: string;
  content: string;
  metadata: any;
  quality: number;
  suggestions: string[];
}

// Service principal
export class AIService {
  // Chat avec l'IA
  static async chat(message: string, context?: any): Promise<ChatMessage> {
    const response = await apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    return response.data;
  }

  // Créer une nouvelle session de chat
  static async createChatSession(title: string, courseId?: string, lessonId?: string, quizId?: string): Promise<ChatSession> {
    const response = await apiRequest('/ai/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, courseId, lessonId, quizId }),
    });
    return response.data;
  }

  // Récupérer les sessions de chat
  static async getChatSessions(): Promise<ChatSession[]> {
    const response = await apiRequest('/ai/chat/sessions', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer une session de chat
  static async getChatSession(sessionId: string): Promise<ChatSession> {
    const response = await apiRequest(`/ai/chat/sessions/${sessionId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Supprimer une session de chat
  static async deleteChatSession(sessionId: string): Promise<void> {
    await apiRequest(`/ai/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Récupérer les suggestions de l'IA
  static async getAISuggestions(context?: any): Promise<AISuggestion[]> {
    const response = await apiRequest('/ai/suggestions', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analyses de l'IA
  static async getAIAnalyses(filter?: any): Promise<AIAnalysis[]> {
    const response = await apiRequest('/ai/analyses', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les recommandations de l'IA
  static async getAIRecommendations(): Promise<AIRecommendation[]> {
    const response = await apiRequest('/ai/recommendations', {
      method: 'GET',
    });
    return response.data;
  }

  // Marquer une recommandation comme lue
  static async markRecommendationAsRead(recommendationId: string): Promise<void> {
    await apiRequest(`/ai/recommendations/${recommendationId}/read`, {
      method: 'PATCH',
    });
  }

  // Accepter une recommandation
  static async acceptRecommendation(recommendationId: string): Promise<void> {
    await apiRequest(`/ai/recommendations/${recommendationId}/accept`, {
      method: 'PATCH',
    });
  }

  // Générer du contenu avec l'IA
  static async generateContent(request: AIContentGenerationRequest): Promise<AIContentGenerationResponse> {
    const response = await apiRequest('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  // Traduire du texte
  static async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<AITranslation> {
    const response = await apiRequest('/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
    });
    return response.data;
  }

  // Convertir la parole en texte
  static async speechToText(audioUrl: string, language?: string): Promise<AISpeechToText> {
    const response = await apiRequest('/ai/speech-to-text', {
      method: 'POST',
      body: JSON.stringify({ audioUrl, language }),
    });
    return response.data;
  }

  // Convertir le texte en parole
  static async textToSpeech(text: string, voice?: string, language?: string, speed?: number, pitch?: number): Promise<AITextToSpeech> {
    const response = await apiRequest('/ai/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text, voice, language, speed, pitch }),
    });
    return response.data;
  }

  // Générer une image
  static async generateImage(prompt: string, parameters?: any): Promise<AIImageGeneration> {
    const response = await apiRequest('/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, parameters }),
    });
    return response.data;
  }

  // Analyser une image
  static async analyzeImage(imageUrl: string): Promise<AIImageAnalysis> {
    const response = await apiRequest('/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
    return response.data;
  }

  // Générer du code
  static async generateCode(prompt: string, language?: string): Promise<AICodeGeneration> {
    const response = await apiRequest('/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify({ prompt, language }),
    });
    return response.data;
  }

  // Analyser du code
  static async analyzeCode(code: string, language: string): Promise<AICodeAnalysis> {
    const response = await apiRequest('/ai/analyze-code', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
    return response.data;
  }

  // Analyser le sentiment
  static async analyzeSentiment(text: string): Promise<AISentimentAnalysis> {
    const response = await apiRequest('/ai/analyze-sentiment', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return response.data;
  }

  // Modéliser les sujets
  static async modelTopics(text: string): Promise<AITopicModeling> {
    const response = await apiRequest('/ai/model-topics', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return response.data;
  }

  // Résumer du texte
  static async summarizeText(text: string, length?: number): Promise<AISummarization> {
    const response = await apiRequest('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, length }),
    });
    return response.data;
  }

  // Générer des questions
  static async generateQuestions(text: string): Promise<AIQuestionGeneration> {
    const response = await apiRequest('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return response.data;
  }

  // Générer des réponses
  static async generateAnswer(question: string, context?: string): Promise<AIAnswerGeneration> {
    const response = await apiRequest('/ai/generate-answer', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
    return response.data;
  }

  // Créer un plan d'étude
  static async createStudyPlan(userId: string, courseId: string): Promise<AIStudyPlan> {
    const response = await apiRequest('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Analyser les progrès
  static async analyzeProgress(userId: string, courseId: string): Promise<AIProgressAnalysis> {
    const response = await apiRequest('/ai/analyze-progress', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Prédire les performances
  static async predictPerformance(userId: string, courseId: string): Promise<AIPerformancePrediction> {
    const response = await apiRequest('/ai/predict-performance', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Analyser l'engagement
  static async analyzeEngagement(userId: string, courseId: string): Promise<AIEngagementAnalysis> {
    const response = await apiRequest('/ai/analyze-engagement', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Analyser la compréhension
  static async analyzeComprehension(userId: string, courseId: string): Promise<AIComprehensionAnalysis> {
    const response = await apiRequest('/ai/analyze-comprehension', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Apprentissage adaptatif
  static async adaptiveLearning(userId: string, courseId: string): Promise<AIAdaptiveLearning> {
    const response = await apiRequest('/ai/adaptive-learning', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  }

  // Personnalisation
  static async personalize(userId: string): Promise<AIPersonalization> {
    const response = await apiRequest('/ai/personalize', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response.data;
  }

  // Modération de contenu
  static async moderateContent(content: string, type: string): Promise<AIContentModeration> {
    const response = await apiRequest('/ai/moderate-content', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Évaluation de la qualité
  static async assessQuality(content: string, type: string): Promise<AIQualityAssessment> {
    const response = await apiRequest('/ai/assess-quality', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Analyse d'accessibilité
  static async analyzeAccessibility(content: string, type: string): Promise<AIAccessibilityAnalysis> {
    const response = await apiRequest('/ai/analyze-accessibility', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Détection de plagiat
  static async detectPlagiarism(content: string): Promise<AIPlagiarismDetection> {
    const response = await apiRequest('/ai/detect-plagiarism', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  // Optimisation de contenu
  static async optimizeContent(content: string, type: string): Promise<AIContentOptimization> {
    const response = await apiRequest('/ai/optimize-content', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Optimisation SEO
  static async optimizeSEO(content: string, type: string): Promise<AISEOOptimization> {
    const response = await apiRequest('/ai/optimize-seo', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Localisation de contenu
  static async localizeContent(content: string, targetLanguage: string, sourceLanguage?: string): Promise<AIContentLocalization> {
    const response = await apiRequest('/ai/localize-content', {
      method: 'POST',
      body: JSON.stringify({ content, targetLanguage, sourceLanguage }),
    });
    return response.data;
  }

  // Validation de contenu
  static async validateContent(content: string, type: string): Promise<AIContentValidation> {
    const response = await apiRequest('/ai/validate-content', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }

  // Amélioration de contenu
  static async enhanceContent(content: string, type: string): Promise<AIContentEnhancement> {
    const response = await apiRequest('/ai/enhance-content', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    return response.data;
  }
}

// Export par défaut
export default AIService;
