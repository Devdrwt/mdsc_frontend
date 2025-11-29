import { apiRequest } from "./api";
import type { CourseForum, ForumTopic, ForumReply } from "../../types/forum";

export class ForumService {
  static async getCourseForum(courseId: number): Promise<CourseForum> {
    const response = await apiRequest(`/courses/${courseId}/forum`, {
      method: "GET",
    });
    return response.data;
  }

  static async getForumTopics(
    forumId: number,
    params?: {
      page?: number;
      limit?: number;
      sort?: "recent" | "popular" | "pinned";
      search?: string;
    }
  ): Promise<{ data: ForumTopic[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.sort) query.append("sort", params.sort);
    if (params?.search) query.append("search", params.search);

    const response = await apiRequest(
      `/forums/${forumId}/topics?${query.toString()}`,
      {
        method: "GET",
      }
    );
    
    // S'assurer que la réponse a la structure attendue
    const result = response.data || response;
    return {
      data: Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []),
      pagination: result.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: 0,
        pages: 1,
      },
    };
  }

  static async createTopic(
    forumId: number,
    data: { title: string; content: string }
  ): Promise<ForumTopic> {
    const response = await apiRequest(`/forums/${forumId}/topics`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async getTopicReplies(
    topicId: number,
    params?: {
      page?: number;
      limit?: number;
      sort?: "recent" | "oldest" | "votes";
    }
  ): Promise<{ data: ForumReply[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.sort) query.append("sort", params.sort);

    const response = await apiRequest(
      `/topics/${topicId}/replies?${query.toString()}`,
      {
        method: "GET",
      }
    );
    
    // S'assurer que la réponse a la structure attendue
    const result = response.data || response;
    return {
      data: Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []),
      pagination: result.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: 0,
        pages: 1,
      },
    };
  }

  static async createReply(
    topicId: number,
    data: { content: string; parent_reply_id?: number }
  ): Promise<ForumReply> {
    const response = await apiRequest(`/topics/${topicId}/replies`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async getTopicById(topicId: number): Promise<ForumTopic> {
    const response = await apiRequest(`/topics/${topicId}`, {
      method: "GET",
    });
    return response.data;
  }

  static async addReaction(
    replyId: number,
    reactionType: "upvote" | "downvote"
  ): Promise<void> {
    await apiRequest(`/replies/${replyId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  }

  static async markAsSolution(replyId: number): Promise<void> {
    await apiRequest(`/replies/${replyId}/mark-solution`, {
      method: "POST",
    });
  }

  static async pinTopic(topicId: number): Promise<ForumTopic> {
    const response = await apiRequest(`/topics/${topicId}/pin`, {
      method: "POST",
    });
    return response.data;
  }

  static async unpinTopic(topicId: number): Promise<ForumTopic> {
    const response = await apiRequest(`/topics/${topicId}/unpin`, {
      method: "POST",
    });
    return response.data;
  }

  static async lockTopic(topicId: number): Promise<ForumTopic> {
    const response = await apiRequest(`/topics/${topicId}/lock`, {
      method: "POST",
    });
    return response.data;
  }

  static async unlockTopic(topicId: number): Promise<ForumTopic> {
    const response = await apiRequest(`/topics/${topicId}/unlock`, {
      method: "POST",
    });
    return response.data;
  }
}

export const forumService = ForumService;

