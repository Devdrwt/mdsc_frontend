import { apiRequest } from './api';

export interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  metrics: AnalyticsMetrics;
  charts: AnalyticsChart[];
  insights: AnalyticsInsight[];
}

export interface AnalyticsMetrics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  engagementRate: number;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  options: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position: string;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  recommendation?: string;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActivity: string;
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  totalTime: number;
  averageScore: number;
  certificates: number;
  badges: number;
  achievements: number;
  level: number;
  experience: number;
  points: number;
  streak: number;
  engagement: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  category: string;
  level: string;
  createdAt: string;
  publishedAt: string;
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  totalViews: number;
  totalTime: number;
  averageTime: number;
  studentProgress: StudentProgress[];
  lessonAnalytics: LessonAnalytics[];
  quizAnalytics: QuizAnalytics[];
}

export interface StudentProgress {
  userId: string;
  userName: string;
  enrolledAt: string;
  lastActivity: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  timeSpent: number;
  averageScore: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface LessonAnalytics {
  lessonId: string;
  lessonTitle: string;
  order: number;
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  averageTime: number;
  averageScore: number;
  studentFeedback: number;
}

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  totalAttempts: number;
  totalPasses: number;
  passRate: number;
  averageScore: number;
  averageTime: number;
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  question: string;
  totalAttempts: number;
  correctAnswers: number;
  correctRate: number;
  averageTime: number;
  commonWrongAnswers: string[];
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  revenueByCourse: Array<{
    courseId: string;
    courseTitle: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByInstructor: Array<{
    instructorId: string;
    instructorName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface EngagementAnalytics {
  period: string;
  totalEngagement: number;
  averageEngagement: number;
  engagementByUser: Array<{
    userId: string;
    userName: string;
    engagement: number;
  }>;
  engagementByCourse: Array<{
    courseId: string;
    courseTitle: string;
    engagement: number;
  }>;
  engagementByCategory: Array<{
    category: string;
    engagement: number;
  }>;
  engagementTrend: Array<{
    date: string;
    engagement: number;
  }>;
}

export interface RetentionAnalytics {
  period: string;
  totalRetention: number;
  averageRetention: number;
  retentionByCohort: Array<{
    cohort: string;
    retention: number;
  }>;
  retentionByCourse: Array<{
    courseId: string;
    courseTitle: string;
    retention: number;
  }>;
  retentionByCategory: Array<{
    category: string;
    retention: number;
  }>;
  retentionTrend: Array<{
    date: string;
    retention: number;
  }>;
}

export interface PerformanceAnalytics {
  period: string;
  totalPerformance: number;
  averagePerformance: number;
  performanceByUser: Array<{
    userId: string;
    userName: string;
    performance: number;
  }>;
  performanceByCourse: Array<{
    courseId: string;
    courseTitle: string;
    performance: number;
  }>;
  performanceByCategory: Array<{
    category: string;
    performance: number;
  }>;
  performanceTrend: Array<{
    date: string;
    performance: number;
  }>;
}

export interface AnalyticsFilter {
  period?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  level?: string;
  instructor?: string;
  course?: string;
  user?: string;
  role?: string;
}

export interface AnalyticsExport {
  format: 'csv' | 'xlsx' | 'pdf';
  data: any[];
  filename: string;
  generatedAt: string;
}

// Service principal
export class AnalyticsService {
  // Récupérer les données d'analytics générales
  static async getAnalytics(filter?: AnalyticsFilter): Promise<AnalyticsData> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les métriques d'analytics
  static async getAnalyticsMetrics(filter?: AnalyticsFilter): Promise<AnalyticsMetrics> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/metrics?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les graphiques d'analytics
  static async getAnalyticsCharts(filter?: AnalyticsFilter): Promise<AnalyticsChart[]> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/charts?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les insights d'analytics
  static async getAnalyticsInsights(filter?: AnalyticsFilter): Promise<AnalyticsInsight[]> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/insights?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics des utilisateurs
  static async getUserAnalytics(filter?: AnalyticsFilter): Promise<UserAnalytics[]> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/users?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics des cours
  static async getCourseAnalytics(filter?: AnalyticsFilter): Promise<CourseAnalytics[]> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/courses?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics de revenus
  static async getRevenueAnalytics(filter?: AnalyticsFilter): Promise<RevenueAnalytics> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/revenue?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics d'engagement
  static async getEngagementAnalytics(filter?: AnalyticsFilter): Promise<EngagementAnalytics> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/engagement?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics de rétention
  static async getRetentionAnalytics(filter?: AnalyticsFilter): Promise<RetentionAnalytics> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/retention?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics de performance
  static async getPerformanceAnalytics(filter?: AnalyticsFilter): Promise<PerformanceAnalytics> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);

    const response = await apiRequest(`/analytics/performance?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Exporter les données d'analytics
  static async exportAnalytics(filter?: AnalyticsFilter, format: string = 'csv'): Promise<AnalyticsExport> {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.instructor) params.append('instructor', filter.instructor);
    if (filter?.course) params.append('course', filter.course);
    if (filter?.user) params.append('user', filter.user);
    if (filter?.role) params.append('role', filter.role);
    params.append('format', format);

    const response = await apiRequest(`/analytics/export?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics en temps réel
  static async getRealTimeAnalytics(): Promise<AnalyticsData> {
    const response = await apiRequest('/analytics/real-time', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par période
  static async getAnalyticsByPeriod(period: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/period/${period}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par catégorie
  static async getAnalyticsByCategory(category: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par niveau
  static async getAnalyticsByLevel(level: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/level/${level}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par instructeur
  static async getAnalyticsByInstructor(instructorId: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/instructor/${instructorId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par cours
  static async getAnalyticsByCourse(courseId: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par utilisateur
  static async getAnalyticsByUser(userId: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/user/${userId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les analytics par rôle
  static async getAnalyticsByRole(role: string): Promise<AnalyticsData> {
    const response = await apiRequest(`/analytics/role/${role}`, {
      method: 'GET',
    });
    return response.data;
  }
}

// Export par défaut
export default AnalyticsService;
