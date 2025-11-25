export interface CourseRating {
  id: number;
  course_id: number;
  user_id: number;
  enrollment_id: number;
  rating: number; // 1-5
  comment?: string;
  pros?: string;
  cons?: string;
  would_recommend: boolean;
  is_verified_purchase: boolean;
  is_anonymous: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

export interface CourseRatingStats {
  average_rating: number; // Note moyenne (peut être un nombre décimal)
  rating_count: number;
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  recommendation_rate: number; // Pourcentage de recommandations (0-100)
}

