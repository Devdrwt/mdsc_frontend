export interface LiveSession {
  id: number;
  course_id: number;
  instructor_id: number;
  title: string;
  description?: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  actual_start_at?: string;
  actual_end_at?: string;
  jitsi_room_name: string;
  jitsi_server_url: string;
  jitsi_room_password?: string;
  max_participants: number;
  is_recording_enabled: boolean;
  recording_url?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  created_at: string;
  updated_at: string;
  course?: {
    id: number;
    title: string;
    slug?: string;
  };
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    avatar?: string;
  };
  participants_count?: number;
}

export interface LiveSessionParticipant {
  id: number;
  session_id: number;
  user_id: number;
  enrollment_id?: number;
  joined_at?: string;
  left_at?: string;
  attendance_duration: number;
  is_present: boolean;
  role: "instructor" | "participant" | "moderator";
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
}

export interface LiveSessionChatMessage {
  id: number;
  session_id: number;
  user_id: number;
  message: string;
  message_type: "text" | "question" | "answer";
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface CreateLiveSessionData {
  title: string;
  description?: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  max_participants?: number;
  is_recording_enabled?: boolean;
}

export interface UpdateLiveSessionData {
  title?: string;
  description?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  max_participants?: number;
  is_recording_enabled?: boolean;
}

export interface JitsiTokenResponse {
  jwt: string;
  jitsi_join_url: string;
  expires_at: string;
}

export interface LiveSessionJoinResponse {
  session_id: number;
  user_id: number;
  jitsi_join_url: string;
  jitsi_room_password?: string;
  joined_at: string;
}

export interface LiveSessionStartResponse {
  session_id: number;
  status: string;
  actual_start_at: string;
  jitsi_join_url: string;
}

export interface LiveSessionEndResponse {
  session_id: number;
  status: string;
  actual_end_at: string;
  recording_url?: string;
}

export interface StudentLiveSessions {
  upcoming: LiveSession[];
  live: LiveSession[];
  past: LiveSession[];
}

export interface CalendarLiveSession {
  id: number;
  title: string;
  course_title: string;
  start: string;
  end: string;
  type: "live_session";
  url: string;
}

