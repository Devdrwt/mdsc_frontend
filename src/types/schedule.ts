// Types pour la synchronisation calendrier/progression

export interface ScheduleItem {
  id: number;
  type: 'lesson' | 'quiz' | 'deadline' | 'reminder' | 'milestone';
  title: string;
  scheduled_date: string; // ISO 8601
  duration_minutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
  completed_at: string | null; // ISO 8601
  event_id: number | null;
  lesson_id: number | null;
  quiz_id: number | null;
  module_id: number | null;
  metadata: {
    module_order?: number;
    lesson_order?: number;
    passing_score?: number;
    milestone_type?: string;
    module_title?: string;
    auto_created?: boolean;
  } | null;
}

export interface CourseSchedule {
  enrollment_id: number;
  course_id: number;
  schedule: ScheduleItem[];
}

export interface CalendarEvent {
  id: number | string; // Peut être numérique ou "event-1", "live-session-2"
  title: string;
  description: string;
  event_type: 'workshop' | 'course_start' | 'quiz_scheduled' | 'announcement' | 'deadline' | 'milestone' | 'live_session' | string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  is_all_day: boolean;
  location: string | null;
  is_public: boolean;
  type?: 'event' | 'live_session'; // Type principal de l'événement
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'; // Pour les live sessions
  course: {
    id: number;
    title: string;
    slug: string;
  } | null;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  instructor?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  url?: string; // URL pour les live sessions
  created_at: string;
  updated_at: string;
}

export interface CalendarQueryParams {
  start?: string; // ISO 8601
  end?: string; // ISO 8601
  type?: string;
  upcoming?: boolean;
}

