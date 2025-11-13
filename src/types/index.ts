// Types pour les cours (selon nouvelle architecture)
export interface InstructorInfo {
  id: string;
  name?: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
}

export interface CourseMetrics {
  enrollment_count?: number;
  average_rating?: number;
  review_count?: number;
  total_views?: number;
  total_lessons?: number;
}

export interface Course {
  id: number | string; // Supporté pour compatibilité
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: 'sante' | 'education' | 'gouvernance' | 'environnement' | 'economie' | string;
  level: 'debutant' | 'intermediaire' | 'avance' | string;
  duration: number | string; // en minutes ou string "X semaines"
  language: string;
  thumbnail_url?: string;
  thumbnail?: string; // Alias pour CourseCard
  instructor: string | InstructorInfo;
  students?: number; // Alias pour enrollment_count pour CourseCard
  totalStudents?: number;
  price?: number;
  prerequisite_course_id?: string | number;
  is_published: boolean;
  enrollment_count: number;
  rating: number;
  metrics?: CourseMetrics;
  modules?: Module[];
  createdAt?: string;
  updatedAt?: string;
  priceAmount?: number;
  currency?: string;
  isFree?: boolean;
  isLive?: boolean;
  isExpired?: boolean;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Module selon architecture
export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_unlocked: boolean;
  image_url?: string; // Image d'identification du module
  lessons?: Lesson[];
  createdAt?: string;
  duration?: number; // Pour compatibilité
}

// Leçon selon architecture
export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_type: 'video' | 'text' | 'quiz' | 'h5p' | 'forum' | 'assignment' | 'document' | 'audio' | 'presentation';
  media_file_id?: string;
  content_url?: string; // URL après upload ou URL externe
  content_text?: string; // Pour type text
  duration: number; // en minutes
  order_index: number;
  is_required: boolean;
  is_completed?: boolean;
  progress?: LessonProgress;
  createdAt?: string;
}

// Progression d'une leçon
export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  time_spent: number; // en secondes
  completed_at?: string;
}

// Inscription selon architecture
export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'certified';
  progress_percentage: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
}

// Quiz selon architecture
export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number; // Score minimum en %
  max_attempts: number;
  time_limit?: number; // en minutes
  is_final: boolean;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: Array<{ text: string; correct: boolean }>;
  correct_answer?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string>; // {questionId: answer}
  score: number;
  passed: boolean;
  completed_at: string;
}

// Badge selon architecture - rediriger vers course.ts
export type { Badge, UserBadge } from './course';

// Certificat selon architecture
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_code: string; // Pour QR code
  pdf_url: string;
  qr_code_url: string;
  issued_at: string;
  expires_at?: string;
  verified: boolean;
  course?: Course;
}

// Fichier média selon architecture
export interface MediaFile {
  id: string;
  lesson_id?: string;
  course_id?: string;
  filename: string;
  original_filename: string;
  file_type: string; // MIME type
  file_category: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other';
  file_size: number; // en bytes
  storage_type: 'minio' | 's3' | 'local';
  bucket_name?: string;
  storage_path: string;
  url: string;
  thumbnail_url?: string;
  duration?: number; // Pour vidéos/audio (en secondes)
  metadata?: Record<string, any>;
  uploaded_by: string;
  uploaded_at: string;
}

// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  phone?: string;
  organization?: string;
  country?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour l'authentification
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string;
}

// Types pour les API Moodle
export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  startdate: number;
  enddate: number;
  visible: boolean;
  categoryid: number;
  categoryname: string;
  progress?: number;
  completed?: boolean;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  profileimageurl: string;
  city?: string;
  country?: string;
  timezone?: string;
}

// Types pour les formulaires
export interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization: string;
  phone?: string;
  city?: string;
  country: string;
  acceptTerms: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Types pour la pagination
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Types pour les notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Types pour les langues
export type SupportedLanguage = 'fr' | 'en';

// Types pour les thèmes
export type Theme = 'light' | 'dark' | 'system';

// ============================================
// Types Gamification
// ============================================

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  created_at: string;
  updated_at: string;
}

export interface UserStreaks {
  id: string;
  user_id: string;
  daily_streak: number;
  perfect_quiz_streak: number;
  last_activity_date: string;
  longest_daily_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'seasonal' | 'event';
  criteria: Record<string, any>; // JSON des conditions
  reward_xp: number;
  reward_badge_id?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: Record<string, any>; // JSON de progression
  completed: boolean;
  completed_at?: string;
  created_at: string;
  challenge?: Challenge; // Relation
}
