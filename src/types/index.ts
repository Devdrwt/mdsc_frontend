// Types pour les cours
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  organization?: string;
  createdAt?: string;
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
