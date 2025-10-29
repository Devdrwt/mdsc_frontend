// Export de tous les services
export * from './authService';
import { apiRequest } from './api';
export { default as CourseService } from './courseService';
export { default as QuizService } from './quizService';
export { default as GamificationService } from './gamificationService';
export { default as AnalyticsService } from './analyticsService';
export { default as AIService } from './aiService';
export { default as NotificationService } from './notificationService';
export { default as CertificateService } from './certificateService';
export { default as FileService } from './fileService';
export { default as MessageService } from './messageService';
export { default as EvaluationService } from './evaluationService';
export { default as ProfessionalService } from './professionalService';
export * from './chatIAService';

// Nouveaux services selon architecture
export { MediaService, mediaService } from './mediaService';
export { BadgeService, badgeService } from './badgeService';
export { CertificateService as NewCertificateService, certificateService } from './certificateService';
export { ProgressService, progressService } from './progressService';
export { QuizService as NewQuizService, quizService } from './quizService';

// Export de l'API de base
export { default as api } from './api';
export { 
  apiRequest, 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete, 
  apiPatch, 
  apiUpload, 
  apiUploadMultiple, 
  apiDownload,
  ApiError 
} from './api';

// Export des types et interfaces
export type { 
  RegisterData, 
  LoginData 
} from './authService';

export type { 
  Course, 
  Lesson, 
  Enrollment, 
  Attachment, 
  CourseFilter, 
  CreateCourseData, 
  UpdateCourseData, 
  CreateLessonData, 
  UpdateLessonData, 
  CourseAnalytics, 
  CourseReview, 
  CourseStats 
} from './courseService';

export type { 
  Quiz, 
  QuizQuestion, 
  QuizOption, 
  QuizAttempt, 
  QuizAnswer, 
  CreateQuizData, 
  UpdateQuizData, 
  CreateQuestionData, 
  UpdateQuestionData, 
  QuizStats, 
  QuizAnalytics 
} from './quizService';

export type { 
  Badge, 
  BadgeRequirement, 
  UserProgress, 
  Achievement, 
  UserStats, 
  LeaderboardEntry, 
  GamificationSettings, 
  CreateBadgeData, 
  UpdateBadgeData, 
  CreateAchievementData, 
  UpdateAchievementData, 
  GamificationStats 
} from './gamificationService';

export type { 
  AnalyticsData, 
  AnalyticsMetrics, 
  AnalyticsChart, 
  ChartData, 
  ChartDataset, 
  ChartOptions, 
  AnalyticsInsight, 
  UserAnalytics, 
  StudentProgress, 
  LessonAnalytics, 
  QuestionAnalytics, 
  RevenueAnalytics, 
  EngagementAnalytics, 
  RetentionAnalytics, 
  PerformanceAnalytics, 
  AnalyticsFilter, 
  AnalyticsExport 
} from './analyticsService';

export type { 
  ChatMessage, 
  ChatMetadata, 
  ChatSession, 
  AISuggestion, 
  AIAnalysis, 
  AIRecommendation, 
  AIContentGeneration, 
  AITranslation, 
  AISpeechToText, 
  AITextToSpeech, 
  AIImageGeneration, 
  AIImageAnalysis, 
  AICodeGeneration, 
  AICodeAnalysis, 
  AISentimentAnalysis, 
  AITopicModeling, 
  AISummarization, 
  AIQuestionGeneration, 
  AIAnswerGeneration, 
  AIStudyPlan, 
  AIProgressAnalysis, 
  AIPerformancePrediction, 
  AIEngagementAnalysis, 
  AIComprehensionAnalysis, 
  AIAdaptiveLearning, 
  AIPersonalization, 
  AIContentModeration, 
  AIQualityAssessment, 
  AIAccessibilityAnalysis, 
  AIPlagiarismDetection, 
  AIContentOptimization, 
  AISEOOptimization, 
  AIContentLocalization, 
  AIContentValidation, 
  AIContentEnhancement, 
  AIContentGenerationRequest, 
  AIContentGenerationResponse 
} from './aiService';

export type { 
  Notification, 
  NotificationSettings, 
  NotificationTemplate, 
  NotificationCampaign, 
  NotificationStats, 
  CreateNotificationData, 
  UpdateNotificationData, 
  CreateNotificationTemplateData, 
  UpdateNotificationTemplateData, 
  CreateNotificationCampaignData, 
  UpdateNotificationCampaignData, 
  NotificationFilter, 
  NotificationExport 
} from './notificationService';

export type { 
  Certificate, 
  CertificateMetadata, 
  CertificateTemplate, 
  CertificateVerification, 
  CertificateStats, 
  CreateCertificateData, 
  UpdateCertificateData, 
  CreateCertificateTemplateData, 
  UpdateCertificateTemplateData, 
  CertificateFilter, 
  CertificateExport 
} from './certificateService';

export type { 
  FileUpload, 
  FileMetadata, 
  FileUploadProgress, 
  FileUploadOptions, 
  FileFilter, 
  FileStats, 
  FileExport 
} from './fileService';

export type { 
  Message, 
  MessageStats 
} from './messageService';

export type { 
  Evaluation, 
  EvaluationSubmission, 
  EvaluationStats 
} from './evaluationService';

export type { 
  Domain, 
  Module, 
  Sequence, 
  SequenceContent, 
  MiniControl 
} from './professionalService';

// Export des services par catégorie
export const AuthServices = {};

export const CourseServices = {};

export const UserServices = {};

export const AIServices = {};

export const IntegrationServices = {
  // Services d'intégration futurs
};

// Export de tous les services dans un objet
export const Services = {
  // Services d'authentification
  auth: AuthServices,
  
  // Services de cours
  courses: CourseServices,
  
  // Services utilisateur
  users: UserServices,
  
  // Services d'IA
  ai: AIServices,
  
  // Services d'intégration
  integration: IntegrationServices,
  
  // API de base
  api: apiRequest,
};

// Export par défaut
export default Services;
