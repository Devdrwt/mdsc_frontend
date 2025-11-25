# Guide de Démarrage Rapide - Implémentation des Nouvelles Fonctionnalités

Ce guide vous aidera à démarrer rapidement l'implémentation des fonctionnalités planifiées.

## 🚀 Démarrage Rapide

### Étape 1 : Synchronisation Calendrier (Commencer ici)

#### Backend - Modifier l'endpoint d'inscription

Dans votre backend (probablement dans `routes/enrollmentRoutes.js` ou similaire), modifiez le handler POST pour générer automatiquement le planning :

```javascript
// Après la création de l'enrollment
const enrollment = await createEnrollment(courseId, userId);

// Générer automatiquement le planning
try {
  await generateCourseSchedule(enrollment.id, courseId);
} catch (error) {
  console.warn("Erreur lors de la génération du planning:", error);
  // Ne pas faire échouer l'inscription
}

return enrollment;
```

#### Frontend - Mettre à jour le service d'inscription

**Fichier:** `src/lib/services/enrollmentService.ts`

Ajoutez cette méthode après l'inscription :

```typescript
static async enrollInCourse(courseId: number, options?: {
  paymentId?: string;
  autoGenerateSchedule?: boolean;
}): Promise<Enrollment> {
  try {
    const payload: Record<string, any> = {
      course_id: courseId
    };

    if (options?.paymentId) {
      payload.payment_id = options.paymentId;
    }

    const response = await apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const enrollment = response.data;

    // Générer automatiquement le planning si activé (par défaut: true)
    if (options?.autoGenerateSchedule !== false) {
      try {
        await scheduleService.generateCourseSchedule(enrollment.id);
      } catch (error) {
        console.warn('Erreur lors de la génération du planning:', error);
      }
    }

    return enrollment;
  } catch (error: any) {
    // ... gestion d'erreur existante
    throw error;
  }
}
```

#### Créer le service de planning

**Fichier:** `src/lib/services/scheduleService.ts` (améliorer le fichier existant)

```typescript
import { apiRequest } from "./api";
import { CourseSchedule } from "../../types/schedule";

export class ScheduleService {
  // ... méthodes existantes ...

  /**
   * Générer automatiquement un planning pour un cours
   */
  static async generateCourseSchedule(
    enrollmentId: number
  ): Promise<CourseSchedule> {
    const response = await apiRequest(
      `/enrollments/${enrollmentId}/generate-schedule`,
      {
        method: "POST",
      }
    );
    return response.data;
  }

  /**
   * Synchroniser avec un calendrier externe
   */
  static async syncWithExternalCalendar(
    enrollmentId: number,
    calendarType: "google" | "outlook" | "ical"
  ): Promise<{ sync_url?: string; calendar_file?: string }> {
    const response = await apiRequest(
      `/enrollments/${enrollmentId}/sync-calendar`,
      {
        method: "POST",
        body: JSON.stringify({ calendar_type: calendarType }),
      }
    );
    return response.data;
  }
}

export const scheduleService = ScheduleService;
```

---

### Étape 2 : Système de Notation

#### Créer les types TypeScript

**Fichier:** `src/types/rating.ts` (nouveau fichier)

```typescript
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
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface CourseRatingStats {
  average_rating: number;
  rating_count: number;
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  recommendation_rate: number;
}
```

#### Créer le service de notation

**Fichier:** `src/lib/services/ratingService.ts` (nouveau fichier)

```typescript
import { apiRequest } from "./api";
import { CourseRating, CourseRatingStats } from "../../types/rating";

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
```

#### Créer un composant de notation simple

**Fichier:** `src/components/courses/RatingForm.tsx` (nouveau fichier)

```typescript
"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { ratingService } from "../../../lib/services/ratingService";
import toast from "../../../lib/utils/toast";

interface RatingFormProps {
  courseId: number;
  enrollmentId: number;
  onSuccess?: () => void;
}

export default function RatingForm({
  courseId,
  enrollmentId,
  onSuccess,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Erreur", "Veuillez sélectionner une note");
      return;
    }

    setLoading(true);
    try {
      await ratingService.createRating(courseId, {
        enrollment_id: enrollmentId,
        rating,
        comment: comment || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        would_recommend: wouldRecommend,
        is_anonymous: isAnonymous,
      });

      toast.success("Succès", "Votre notation a été enregistrée");
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        "Erreur",
        error.message || "Impossible d'enregistrer la notation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Note en étoiles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note globale
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
          )}
        </div>
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Partagez votre expérience avec ce cours..."
        />
      </div>

      {/* Points positifs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points positifs (optionnel)
        </label>
        <textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ce que vous avez aimé..."
        />
      </div>

      {/* Points à améliorer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points à améliorer (optionnel)
        </label>
        <textarea
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ce qui pourrait être amélioré..."
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Je recommande ce cours</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Publier de manière anonyme
          </span>
        </label>
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          "Enregistrement..."
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enregistrer la notation
          </>
        )}
      </button>
    </form>
  );
}
```

---

### Étape 3 : Forum de Discussion

#### Créer les types TypeScript

**Fichier:** `src/types/forum.ts` (nouveau fichier)

```typescript
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
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
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
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  replies?: ForumReply[];
}
```

#### Créer le service du forum

**Fichier:** `src/lib/services/forumService.ts` (nouveau fichier)

```typescript
import { apiRequest } from "./api";
import { CourseForum, ForumTopic, ForumReply } from "../../types/forum";

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
    return response.data;
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
    return response.data;
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

  static async addReaction(
    replyId: number,
    reactionType: "upvote" | "downvote"
  ): Promise<void> {
    await apiRequest(`/replies/${replyId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  }
}

export const forumService = ForumService;
```

---

### Étape 4 : Cours en Live avec Jitsi Meet

> **📚 Guide détaillé :** Pour une implémentation complète avec tous les composants, consultez `GUIDE_JITSI_MEET.md`

#### Créer les types TypeScript

**Fichier:** `src/types/liveSession.ts` (nouveau fichier)

```typescript
export interface LiveSession {
  id: number;
  course_id: number;
  instructor_id: number;
  title: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  jitsi_room_name: string; // Nom unique de la salle Jitsi
  jitsi_server_url: string; // URL du serveur Jitsi (par défaut: https://meet.jit.si)
  max_participants: number;
  recording_enabled: boolean;
  recording_url?: string;
  created_at: string;
  course?: {
    id: number;
    title: string;
    slug: string;
  };
  participant_count?: number;
  is_participant?: boolean;
}

export interface JoinSessionData {
  jitsi_room_name: string;
  jitsi_server_url: string;
  user_display_name: string;
  user_email: string;
  is_instructor: boolean;
}

export interface LiveSessionChatMessage {
  id: number;
  session_id: number;
  user_id: number;
  message: string;
  message_type: "message" | "question" | "answer";
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}
```

#### Créer le service des sessions live

**Fichier:** `src/lib/services/liveSessionService.ts` (nouveau fichier)

```typescript
import { apiRequest } from "./api";
import { LiveSession, LiveSessionChatMessage } from "../../types/liveSession";

export class LiveSessionService {
  static async createSession(
    courseId: number,
    data: {
      title: string;
      description?: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      max_participants?: number;
    }
  ): Promise<LiveSession> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async getCourseSessions(courseId: number): Promise<LiveSession[]> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: "GET",
    });
    return response.data;
  }

  static async joinSession(sessionId: number): Promise<JoinSessionData> {
    const response = await apiRequest(`/live-sessions/${sessionId}/join`, {
      method: "POST",
    });
    return response.data;
  }

  static async startSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/start`, {
      method: "POST",
    });
    return response.data;
  }

  static async endSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/end`, {
      method: "POST",
    });
    return response.data;
  }

  static async leaveSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}/leave`, {
      method: "POST",
    });
  }

  static async sendMessage(
    sessionId: number,
    message: string,
    type: "message" | "question" = "message"
  ): Promise<LiveSessionChatMessage> {
    const response = await apiRequest(`/live-sessions/${sessionId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, message_type: type }),
    });
    return response.data;
  }

  static async getChatMessages(
    sessionId: number
  ): Promise<LiveSessionChatMessage[]> {
    const response = await apiRequest(`/live-sessions/${sessionId}/chat`, {
      method: "GET",
    });
    return response.data;
  }
}

export const liveSessionService = LiveSessionService;
```

---

## 📋 Checklist de Démarrage

### Backend

- [ ] Créer les migrations de base de données pour toutes les nouvelles tables
- [ ] Implémenter les endpoints API pour chaque fonctionnalité
- [ ] Ajouter la validation et la gestion d'erreurs
- [ ] Implémenter la logique métier (génération de planning, validation de notation, etc.)

### Frontend

- [ ] Créer les types TypeScript
- [ ] Créer les services API
- [ ] Créer les composants React
- [ ] Créer les pages nécessaires
- [ ] Intégrer dans les pages existantes
- [ ] Ajouter les styles et animations

### Tests

- [ ] Tester chaque fonctionnalité isolément
- [ ] Tester les intégrations entre fonctionnalités
- [ ] Tester les cas d'erreur
- [ ] Tester la performance

---

## 🔗 Ressources Utiles

- **Documentation complète** : Voir `PLAN_FONCTIONNALITES.md`
- **API Backend** : Vérifier la documentation de votre API backend
- **Next.js** : https://nextjs.org/docs
- **React** : https://react.dev

---

## 💡 Conseils

1. **Commencez petit** : Implémentez une fonctionnalité à la fois
2. **Testez souvent** : Testez après chaque modification importante
3. **Documentez** : Documentez votre code au fur et à mesure
4. **Demandez de l'aide** : N'hésitez pas à consulter la documentation ou à demander de l'aide

## 📚 Guides Complémentaires

- **Plan complet** : `PLAN_FONCTIONNALITES.md` - Architecture détaillée de toutes les fonctionnalités
- **Guide Jitsi Meet** : `GUIDE_JITSI_MEET.md` - Implémentation complète avec composants React prêts à l'emploi

Bon développement ! 🚀
