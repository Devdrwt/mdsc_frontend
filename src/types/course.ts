// Types étendus pour la gestion des cours selon l'architecture

export interface ModuleQuizQuestion {
  id: number | string;
  quiz_id?: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  order_index: number;
  points: number;
  // Options peuvent être un tableau de strings (format backend) ou un tableau d'objets
  options?: string[] | Array<{
    id: number;
    option_text: string;
    is_correct?: boolean;
  }>;
  correct_answer?: string;
}

export interface ModuleQuiz {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  questions: ModuleQuizQuestion[];
  previous_attempts?: Array<{
    id: number;
    score: number;
    percentage: number;
    is_passed: boolean;
    completed_at: string;
  }>;
  can_attempt?: boolean;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_unlocked: boolean;
  image_url?: string; // Image d'identification du module
  created_at: string;
  updated_at: string;
  lessons_count?: number;
  lessons?: Lesson[];
  quiz?: ModuleQuiz; // Quiz du module avec questions (depuis getCourseProgress)
  // Compatibilité avec l'ancien format
  courseId?: string | number;
  orderIndex?: number;
  isUnlocked?: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  module_id?: number;
  title: string;
  content_type: 'video' | 'text' | 'quiz' | 'h5p' | 'forum' | 'assignment' | 'document' | 'audio' | 'presentation';
  media_file_id?: number;
  content_url?: string;
  content_text?: string;
  description?: string;
  content?: string; // Pour type 'text' (ancien format)
  video_url?: string; // Déprécié, utiliser content_url
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  module_title?: string;
  module_order?: number;
  media_url?: string;
  thumbnail_url?: string;
  file_category?: string;
  quiz_id?: number;
  // Relations
  mediaFile?: MediaFile;
  // Compatibilité avec l'ancien format
  moduleId?: string | number;
  courseId?: string | number;
  contentType?: 'video' | 'text' | 'quiz' | 'h5p' | 'forum' | 'assignment' | 'document' | 'audio' | 'presentation';
  mediaFileId?: string | number;
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  orderIndex?: number;
  isRequired?: boolean;
  isCompleted?: boolean;
  progress?: LessonProgress;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaFile {
  id: number;
  lesson_id?: number;
  course_id?: number;
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
  uploaded_by: number;
  uploaded_at: string;
  // Compatibilité avec l'ancien format
  lessonId?: string | number;
  courseId?: string | number;
  originalFilename?: string;
  fileType?: string;
  fileCategory?: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other';
  fileSize?: number;
  storageType?: 'minio' | 's3' | 'local';
  bucketName?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  uploadedBy?: string | number;
  uploadedAt?: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'certified';
  progress_percentage: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  course_title?: string;
  course?: Course;
  progress?: Progress[];
  // Compatibilité avec l'ancien format
  userId?: string | number;
  courseId?: string | number;
  progressPercentage?: number;
  enrolledAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Progress {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  time_spent: number; // en secondes
  completed_at?: string;
  lesson?: Lesson;
  // Compatibilité avec l'ancien format
  enrollmentId?: string | number;
  lessonId?: string | number;
  completionPercentage?: number;
  timeSpent?: number;
  completedAt?: string;
}

export interface CourseProgressStats {
  progress_percentage: number;
  enrollment_status: string;
  total_lessons: number;
  completed_lessons: number;
}

export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercentage: number;
  timeSpent: number;
  completedAt?: string;
}

export interface Quiz {
  id: number;
  course_id?: number;
  lesson_id?: number;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_final: boolean;
  is_published: boolean;
  created_at: string;
  question_count?: number;
  invalid_questions_count?: number; // Nombre de questions invalides (selon recommandations backend)
  best_score?: number;
  is_passed?: boolean;
  questions?: QuizQuestion[];
  // Compatibilité avec l'ancien format
  lessonId?: string | number;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  isFinal?: boolean;
  createdAt?: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  options?: string[]; // Pour multiple_choice et multiple_select
  correct_answer?: string | string[]; // Pour true_false et short_answer
  points: number;
  order_index: number;
  // Propriétés de validation (ajoutées selon recommandations backend)
  is_valid?: boolean; // Indique si la question est valide
  has_options?: boolean; // Indique si la question a des options
  // Compatibilité avec l'ancien format
  quizId?: string | number;
  questionType?: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  correctAnswer?: string | string[];
  orderIndex?: number;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  answers: Record<string, any>; // Format JSON {questionId: answer}
  score?: number;
  total_points?: number;
  percentage?: number;
  is_passed: boolean;
  completed_at?: string;
  time_spent_minutes?: number;
  quiz?: Quiz;
  // Compatibilité avec l'ancien format
  userId?: string | number;
  quizId?: string | number;
  passed?: boolean;
  completedAt?: string;
  timeSpent?: number; // Pour compatibilité
  badgesEarned?: Badge[]; // Badges obtenus
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  category?: string;
  criteria: {
    type: string;
    [key: string]: any;
  };
  pdf_url?: string; // URL du PDF du badge
  created_at: string;
  // Compatibilité avec l'ancien format
  iconUrl?: string;
  pdfUrl?: string;
  createdAt?: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  badge?: Badge;
  // Compatibilité avec l'ancien format
  userId?: string | number;
  badgeId?: string | number;
  earnedAt?: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  certificate_code: string; // Pour QR code
  certificate_number: string;
  pdf_url?: string;
  qr_code_url?: string;
  issued_at: string;
  expires_at?: string;
  verified?: boolean;
  is_valid: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'issued' | 'expired'; // Statut de validation/admin
  course_title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  course?: Course;
  // Compatibilité avec l'ancien format
  userId?: string | number;
  courseId?: string | number;
  certificateCode?: string;
  pdfUrl?: string;
  qrCodeUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  category_id: number;
  category_name?: string;
  category_color?: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  language: string;
  thumbnail_url?: string;
  video_url?: string;
  price: number;
  currency?: string;
  instructor_id: number;
  instructor_first_name?: string;
  instructor_last_name?: string;
  prerequisite_course_id?: number;
  prerequisite_title?: string;
  is_published: boolean;
  is_featured: boolean;
  enrollment_deadline?: string;
  course_start_date?: string;
  course_end_date?: string;
  enrollment_count: number;
  rating: number;
  average_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
  modules?: Module[];
  enrollment?: Enrollment;
  progress?: number;
  // Compatibilité avec l'ancien format
  category?: string;
  duration?: number;
  thumbnailUrl?: string;
  instructorId?: string | number;
  instructor?: {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  isPublished?: boolean;
  enrollmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  category: 'sante' | 'education' | 'gouvernance' | 'environnement' | 'economie';
  level: 'debutant' | 'intermediaire' | 'avance';
  duration: number;
  language?: string;
  thumbnailUrl?: string;
  prerequisiteCourseId?: string;
}

export interface CreateModuleData {
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface CreateLessonData {
  moduleId: string;
  title: string;
  contentType: 'video' | 'text' | 'quiz' | 'h5p' | 'forum' | 'assignment' | 'document' | 'audio' | 'presentation';
  contentText?: string;
  duration: number;
  orderIndex: number;
  isRequired?: boolean;
}

export interface UploadFileData {
  file: File;
  contentType: string;
  lessonId?: string;
  courseId?: string;
}

export interface CourseFilter {
  category?: string;
  level?: string;
  search?: string;
  language?: string;
  sortBy?: 'popular' | 'recent' | 'rating' | 'duration';
}
