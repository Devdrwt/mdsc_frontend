# Guide d'Implémentation Rapide - Notation & Forum

## 🎯 Objectif

Guide pratique pour implémenter rapidement :
1. **Système de notation** des cours (priorité haute)
2. **Forum de discussion** pour les cours (priorité haute)

---

## 📋 PARTIE 1 : SYSTÈME DE NOTATION

### Backend - Base de données

#### 1.1 Créer les tables

```sql
-- Table: course_ratings
CREATE TABLE course_ratings (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  pros TEXT,
  cons TEXT,
  would_recommend BOOLEAN DEFAULT TRUE,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, user_id, enrollment_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX idx_course_ratings_user_id ON course_ratings(user_id);
CREATE INDEX idx_course_ratings_enrollment_id ON course_ratings(enrollment_id);
CREATE INDEX idx_course_ratings_status ON course_ratings(status);

-- Mise à jour de la table courses pour les statistiques
ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb;
```

#### 1.2 Endpoints API Backend

**Fichier:** `routes/ratingRoutes.js` (ou équivalent selon votre structure)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

/**
 * POST /api/courses/:courseId/ratings
 * Créer une notation
 */
router.post('/courses/:courseId/ratings', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { enrollment_id, rating, comment, pros, cons, would_recommend, is_anonymous } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }

    // Vérifier que l'utilisateur peut noter (a complété le cours)
    const enrollment = await db.query(
      'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2 AND course_id = $3',
      [enrollment_id, userId, courseId]
    );

    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    // Vérifier que le cours est complété (progress = 100%)
    if (enrollment.rows[0].progress_percentage < 100) {
      return res.status(400).json({ 
        error: 'Vous devez compléter le cours avant de le noter',
        can_rate: false,
        reason: 'course_not_completed'
      });
    }

    // Vérifier si l'utilisateur a déjà noté
    const existingRating = await db.query(
      'SELECT id FROM course_ratings WHERE course_id = $1 AND user_id = $2 AND enrollment_id = $3',
      [courseId, userId, enrollment_id]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Vous avez déjà noté ce cours',
        can_rate: false,
        has_rated: true
      });
    }

    // Créer la notation
    const result = await db.query(
      `INSERT INTO course_ratings 
       (course_id, user_id, enrollment_id, rating, comment, pros, cons, would_recommend, is_anonymous, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')
       RETURNING *`,
      [courseId, userId, enrollment_id, rating, comment || null, pros || null, cons || null, would_recommend !== false, is_anonymous || false]
    );

    const newRating = result.rows[0];

    // Mettre à jour les statistiques du cours
    await updateCourseRatingStats(courseId);

    res.status(201).json(newRating);
  } catch (error) {
    console.error('Erreur lors de la création de la notation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/courses/:courseId/ratings
 * Lister les notations d'un cours
 */
router.get('/courses/:courseId/ratings', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'cr.created_at DESC';
    if (sort === 'rating') orderBy = 'cr.rating DESC, cr.created_at DESC';
    if (sort === 'helpful') orderBy = 'cr.rating DESC';

    const result = await db.query(
      `SELECT 
        cr.*,
        u.first_name,
        u.last_name,
        u.email,
        CASE WHEN cr.is_anonymous THEN NULL ELSE u.avatar END as avatar
       FROM course_ratings cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.course_id = $1 AND cr.status = 'approved'
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [courseId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM course_ratings WHERE course_id = $1 AND status = $2',
      [courseId, 'approved']
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/courses/:courseId/ratings/stats
 * Statistiques des notations
 */
router.get('/courses/:courseId/ratings/stats', async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as rating_count,
        COUNT(CASE WHEN would_recommend = true THEN 1 END) as recommendation_count,
        jsonb_object_agg(
          rating::text, 
          COUNT(*)::int
        ) FILTER (WHERE rating IS NOT NULL) as rating_distribution
       FROM course_ratings
       WHERE course_id = $1 AND status = 'approved'`,
      [courseId]
    );

    const stats = result.rows[0];
    const recommendationRate = stats.rating_count > 0 
      ? (stats.recommendation_count / stats.rating_count) * 100 
      : 0;

    res.json({
      average_rating: parseFloat(stats.average_rating || 0).toFixed(2),
      rating_count: parseInt(stats.rating_count || 0),
      rating_distribution: stats.rating_distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      recommendation_rate: parseFloat(recommendationRate).toFixed(2)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/enrollments/:enrollmentId/can-rate
 * Vérifier si l'étudiant peut noter
 */
router.get('/enrollments/:enrollmentId/can-rate', authenticateToken, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    const enrollment = await db.query(
      'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2',
      [enrollmentId, userId]
    );

    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    const enroll = enrollment.rows[0];

    // Vérifier si le cours est complété
    if (enroll.progress_percentage < 100) {
      return res.json({
        can_rate: false,
        reason: 'course_not_completed',
        progress: enroll.progress_percentage
      });
    }

    // Vérifier si déjà noté
    const existingRating = await db.query(
      'SELECT id FROM course_ratings WHERE enrollment_id = $1',
      [enrollmentId]
    );

    if (existingRating.rows.length > 0) {
      return res.json({
        can_rate: false,
        has_rated: true,
        reason: 'already_rated'
      });
    }

    res.json({
      can_rate: true
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Fonction helper pour mettre à jour les statistiques du cours
 */
async function updateCourseRatingStats(courseId) {
  try {
    const stats = await db.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as count,
        jsonb_object_agg(
          rating::text, 
          COUNT(*)::int
        ) FILTER (WHERE rating IS NOT NULL) as distribution
       FROM course_ratings
       WHERE course_id = $1 AND status = 'approved'`,
      [courseId]
    );

    const result = stats.rows[0];
    
    await db.query(
      `UPDATE courses 
       SET average_rating = $1, 
           rating_count = $2, 
           rating_distribution = $3
       WHERE id = $4`,
      [
        parseFloat(result.avg_rating || 0),
        parseInt(result.count || 0),
        result.distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        courseId
      ]
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
  }
}

module.exports = router;
```

### Frontend - Types TypeScript

**Fichier:** `src/types/rating.ts`

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
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

export interface CourseRatingStats {
  average_rating: string;
  rating_count: number;
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  recommendation_rate: string;
}
```

### Frontend - Service API

**Fichier:** `src/lib/services/ratingService.ts`

```typescript
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
```

---

## 📋 PARTIE 2 : FORUM DE DISCUSSION

### Backend - Base de données

#### 2.1 Créer les tables

```sql
-- Table: course_forums
CREATE TABLE course_forums (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id)
);

-- Table: forum_topics
CREATE TABLE forum_topics (
  id SERIAL PRIMARY KEY,
  forum_id INTEGER NOT NULL REFERENCES course_forums(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP,
  last_reply_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: forum_replies
CREATE TABLE forum_replies (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: forum_reactions
CREATE TABLE forum_reactions (
  id SERIAL PRIMARY KEY,
  reply_id INTEGER NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) DEFAULT 'upvote' CHECK (reaction_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reply_id, user_id, reaction_type)
);

-- Index
CREATE INDEX idx_forum_topics_forum_id ON forum_topics(forum_id);
CREATE INDEX idx_forum_topics_user_id ON forum_topics(user_id);
CREATE INDEX idx_forum_replies_topic_id ON forum_replies(topic_id);
CREATE INDEX idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
CREATE INDEX idx_forum_reactions_reply_id ON forum_reactions(reply_id);
CREATE INDEX idx_forum_reactions_user_id ON forum_reactions(user_id);
```

#### 2.2 Endpoints API Backend

**Fichier:** `routes/forumRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GET /api/courses/:courseId/forum
 * Récupérer ou créer le forum d'un cours
 */
router.get('/courses/:courseId/forum', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est inscrit au cours
    const enrollment = await db.query(
      'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );

    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'Vous devez être inscrit au cours pour accéder au forum' });
    }

    // Récupérer ou créer le forum
    let forum = await db.query(
      'SELECT * FROM course_forums WHERE course_id = $1',
      [courseId]
    );

    if (forum.rows.length === 0) {
      // Créer le forum automatiquement
      const course = await db.query('SELECT title FROM courses WHERE id = $1', [courseId]);
      const result = await db.query(
        `INSERT INTO course_forums (course_id, title, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [courseId, `Forum - ${course.rows[0].title}`, 'Forum de discussion pour ce cours']
      );
      forum = result;
    }

    // Compter les topics et réponses
    const topicCount = await db.query(
      'SELECT COUNT(*) FROM forum_topics WHERE forum_id = $1',
      [forum.rows[0].id]
    );

    const replyCount = await db.query(
      `SELECT COUNT(*) FROM forum_replies fr
       JOIN forum_topics ft ON fr.topic_id = ft.id
       WHERE ft.forum_id = $1`,
      [forum.rows[0].id]
    );

    res.json({
      ...forum.rows[0],
      topic_count: parseInt(topicCount.rows[0].count),
      reply_count: parseInt(replyCount.rows[0].count)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du forum:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/forums/:forumId/topics
 * Lister les topics d'un forum
 */
router.get('/forums/:forumId/topics', authenticateToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const { page = 1, limit = 20, sort = 'recent', search } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'ft.created_at DESC';
    if (sort === 'popular') orderBy = 'ft.reply_count DESC, ft.view_count DESC';
    if (sort === 'pinned') orderBy = 'ft.is_pinned DESC, ft.created_at DESC';

    let query = `
      SELECT 
        ft.*,
        u.first_name,
        u.last_name,
        u.avatar,
        lr.first_name as last_reply_first_name,
        lr.last_name as last_reply_last_name
      FROM forum_topics ft
      JOIN users u ON ft.user_id = u.id
      LEFT JOIN users lr ON ft.last_reply_by = lr.id
      WHERE ft.forum_id = $1
    `;
    const params = [forumId];

    if (search) {
      query += ` AND (ft.title ILIKE $${params.length + 1} OR ft.content ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      search 
        ? `SELECT COUNT(*) FROM forum_topics WHERE forum_id = $1 AND (title ILIKE $2 OR content ILIKE $2)`
        : `SELECT COUNT(*) FROM forum_topics WHERE forum_id = $1`,
      search ? [forumId, `%${search}%`] : [forumId]
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des topics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/forums/:forumId/topics
 * Créer un topic
 */
router.post('/forums/:forumId/topics', authenticateToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Le titre et le contenu sont requis' });
    }

    const result = await db.query(
      `INSERT INTO forum_topics (forum_id, user_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [forumId, userId, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du topic:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/topics/:topicId/replies
 * Lister les réponses d'un topic
 */
router.get('/topics/:topicId/replies', authenticateToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    // Incrémenter le compteur de vues
    await db.query(
      'UPDATE forum_topics SET view_count = view_count + 1 WHERE id = $1',
      [topicId]
    );

    let orderBy = 'fr.created_at ASC';
    if (sort === 'votes') orderBy = '(fr.upvotes - fr.downvotes) DESC, fr.created_at ASC';

    const result = await db.query(
      `SELECT 
        fr.*,
        u.first_name,
        u.last_name,
        u.avatar,
        EXISTS(
          SELECT 1 FROM forum_reactions 
          WHERE reply_id = fr.id AND user_id = $1 AND reaction_type = 'upvote'
        ) as has_upvoted,
        EXISTS(
          SELECT 1 FROM forum_reactions 
          WHERE reply_id = fr.id AND user_id = $1 AND reaction_type = 'downvote'
        ) as has_downvoted
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.topic_id = $2 AND fr.parent_reply_id IS NULL
      ORDER BY ${orderBy}
      LIMIT $3 OFFSET $4`,
      [userId, topicId, limit, offset]
    );

    // Récupérer les réponses imbriquées pour chaque réponse principale
    for (let reply of result.rows) {
      const nestedReplies = await db.query(
        `SELECT 
          fr.*,
          u.first_name,
          u.last_name,
          u.avatar
        FROM forum_replies fr
        JOIN users u ON fr.user_id = u.id
        WHERE fr.parent_reply_id = $1
        ORDER BY fr.created_at ASC`,
        [reply.id]
      );
      reply.replies = nestedReplies.rows;
    }

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/topics/:topicId/replies
 * Créer une réponse
 */
router.post('/topics/:topicId/replies', authenticateToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;
    const { content, parent_reply_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Le contenu est requis' });
    }

    const result = await db.query(
      `INSERT INTO forum_replies (topic_id, user_id, content, parent_reply_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [topicId, userId, content, parent_reply_id || null]
    );

    // Mettre à jour le compteur de réponses du topic
    await db.query(
      `UPDATE forum_topics 
       SET reply_count = reply_count + 1,
           last_reply_at = CURRENT_TIMESTAMP,
           last_reply_by = $1
       WHERE id = $2`,
      [userId, topicId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/replies/:replyId/reactions
 * Ajouter une réaction (upvote/downvote)
 */
router.post('/replies/:replyId/reactions', authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;
    const { reaction_type } = req.body;

    if (!['upvote', 'downvote'].includes(reaction_type)) {
      return res.status(400).json({ error: 'Type de réaction invalide' });
    }

    // Vérifier si l'utilisateur a déjà réagi
    const existing = await db.query(
      'SELECT * FROM forum_reactions WHERE reply_id = $1 AND user_id = $2',
      [replyId, userId]
    );

    if (existing.rows.length > 0) {
      // Mettre à jour la réaction existante
      await db.query(
        'UPDATE forum_reactions SET reaction_type = $1 WHERE reply_id = $2 AND user_id = $3',
        [reaction_type, replyId, userId]
      );
    } else {
      // Créer une nouvelle réaction
      await db.query(
        'INSERT INTO forum_reactions (reply_id, user_id, reaction_type) VALUES ($1, $2, $3)',
        [replyId, userId, reaction_type]
      );
    }

    // Mettre à jour les compteurs de votes
    const upvotes = await db.query(
      'SELECT COUNT(*) FROM forum_reactions WHERE reply_id = $1 AND reaction_type = $2',
      [replyId, 'upvote']
    );

    const downvotes = await db.query(
      'SELECT COUNT(*) FROM forum_reactions WHERE reply_id = $1 AND reaction_type = $2',
      [replyId, 'downvote']
    );

    await db.query(
      'UPDATE forum_replies SET upvotes = $1, downvotes = $2 WHERE id = $3',
      [parseInt(upvotes.rows[0].count), parseInt(downvotes.rows[0].count), replyId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/replies/:replyId/mark-solution
 * Marquer une réponse comme solution
 */
router.post('/replies/:replyId/mark-solution', authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    // Récupérer la réponse et le topic
    const reply = await db.query(
      `SELECT fr.*, ft.user_id as topic_author_id
       FROM forum_replies fr
       JOIN forum_topics ft ON fr.topic_id = ft.id
       WHERE fr.id = $1`,
      [replyId]
    );

    if (reply.rows.length === 0) {
      return res.status(404).json({ error: 'Réponse non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur du topic
    if (reply.rows[0].topic_author_id !== userId) {
      return res.status(403).json({ error: 'Seul l\'auteur du topic peut marquer une solution' });
    }

    // Désactiver les autres solutions du topic
    await db.query(
      `UPDATE forum_replies 
       SET is_solution = false 
       WHERE topic_id = (SELECT topic_id FROM forum_replies WHERE id = $1) AND id != $1`,
      [replyId]
    );

    // Marquer cette réponse comme solution
    await db.query(
      'UPDATE forum_replies SET is_solution = true WHERE id = $1',
      [replyId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage de la solution:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

### Frontend - Types TypeScript

**Fichier:** `src/types/forum.ts`

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
```

### Frontend - Service API

**Fichier:** `src/lib/services/forumService.ts`

```typescript
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

  static async markAsSolution(replyId: number): Promise<void> {
    await apiRequest(`/replies/${replyId}/mark-solution`, {
      method: "POST",
    });
  }
}

export const forumService = ForumService;
```

---

## 🚀 Checklist d'Implémentation

### Backend
- [ ] Créer les tables de base de données (notation)
- [ ] Créer les tables de base de données (forum)
- [ ] Implémenter les endpoints API pour la notation
- [ ] Implémenter les endpoints API pour le forum
- [ ] Tester les endpoints avec Postman/Thunder Client

### Frontend
- [ ] Créer les types TypeScript
- [ ] Créer les services API
- [ ] Créer les composants React (voir `GUIDE_DEMARRAGE_RAPIDE.md`)
- [ ] Intégrer dans les pages existantes
- [ ] Tester le workflow complet

---

## ⚡ Points Importants

1. **Validation Backend** : Toujours valider les permissions côté serveur
2. **Performance** : Utiliser la pagination pour les listes
3. **Sécurité** : Vérifier que l'utilisateur est inscrit au cours avant d'accéder au forum
4. **Statistiques** : Mettre à jour automatiquement les statistiques après chaque notation

---

Bon développement ! 🎉

