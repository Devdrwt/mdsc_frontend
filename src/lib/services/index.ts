// Export de tous les services
export * from './authService';
import { apiRequest } from './api';
export { CourseService } from './courseService';
export { QuizService, quizService } from './quizService';
export { GamificationService, gamificationService } from './gamificationService';
export { AnalyticsService } from './analyticsService';
export { AIService } from './aiService';
export { NotificationService } from './notificationService';
export { CertificateService, certificateService } from './certificateService';
export { FileService } from './fileService';
export { MessageService } from './messageService';
export { EvaluationService } from './evaluationService';
export { ProfessionalService } from './professionalService';
export { StudentCatalogService, studentCatalogService } from './studentCatalogService';
export * from './chatIAService';

// Nouveaux services selon architecture
export { ModuleService, moduleService } from './moduleService';
export { MediaService, mediaService } from './mediaService';
export { BadgeService, badgeService } from './badgeService';
export { ProgressService, progressService } from './progressService';
export { EnrollmentService } from './enrollmentService';

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
  Course as ServiceCourse,
  Lesson as ServiceLesson, 
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

// Gamification types from gamificationService.ts
export type { 
  UserXP,
  UserStreaks,
  Challenge,
  UserChallenge
} from '../../types';

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
  NotificationEntry,
  NotificationListResponse,
  NotificationFilters,
} from './notificationService';


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
  MessagePayload,
  BroadcastMessagePayload,
  MessageEntry,
  PaginatedMessages,
  ConversationEntry,
  MessageStats,
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
