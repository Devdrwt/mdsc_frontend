export interface CourseForum {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  topic_count?: number;
  reply_count?: number;
}

export interface ForumTopic {
  id: number;
  forum_id: number;
  user_id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  last_reply_by?: number;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  last_reply_first_name?: string;
  last_reply_last_name?: string;
}

export interface ForumReply {
  id: number;
  topic_id: number;
  user_id: number;
  parent_reply_id?: number;
  content: string;
  is_solution: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  has_upvoted?: boolean;
  has_downvoted?: boolean;
  replies?: ForumReply[];
}

