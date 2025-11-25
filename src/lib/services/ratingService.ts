import { apiRequest } from "./api";
import type { CourseRating, CourseRatingStats } from "../../types/rating";

export class RatingService {
  static async createRating(
    courseId: number,
    data: {
      enrollment_id: number;
      rating: number;
      comment?: string;
      pros?: string;
      cons?: string;
      would_recommend?: boolean;
      is_anonymous?: boolean;
    }
  ): Promise<CourseRating> {
    const response = await apiRequest(`/courses/${courseId}/ratings`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async canRate(enrollmentId: number): Promise<{
    can_rate: boolean;
    reason?: string;
    has_rated?: boolean;
    progress?: number;
  }> {
    const response = await apiRequest(`/enrollments/${enrollmentId}/can-rate`, {
      method: "GET",
    });
    return response.data;
  }

  static async getRatingStats(courseId: number): Promise<CourseRatingStats> {
    const response = await apiRequest(`/courses/${courseId}/ratings/stats`, {
      method: "GET",
    });
    return response.data;
  }

  static async getCourseRatings(
    courseId: number,
    params?: {
      page?: number;
      limit?: number;
      sort?: "recent" | "helpful" | "rating";
    }
  ): Promise<{ data: CourseRating[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.sort) query.append("sort", params.sort);

    const response = await apiRequest(
      `/courses/${courseId}/ratings?${query.toString()}`,
      {
        method: "GET",
      }
    );
    return response.data;
  }
}

export const ratingService = RatingService;

