# Plan d'Implémentation - Nouvelles Fonctionnalités

## Vue d'ensemble

Ce document présente le plan détaillé pour l'implémentation de quatre fonctionnalités majeures :

1. **Cours en live** (sessions en direct)
2. **Synchronisation automatique avec le calendrier** lors de l'inscription
3. **Système de notation** avant l'obtention du certificat
4. **Forum de discussion** pour les cours

---

## 1. COURS EN LIVE (Live Courses)

### 1.1 Objectif

Permettre aux instructeurs de créer et animer des sessions de cours en direct, avec interaction en temps réel avec les étudiants.

### 1.2 Architecture Backend (à implémenter côté API)

#### 1.2.1 Modèle de données (avec Jitsi Meet)

```sql
-- Table: live_sessions
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  jitsi_room_name VARCHAR(255) NOT NULL UNIQUE, -- Nom unique de la salle Jitsi (ex: mdsc-course-5-session-1-abc123)
  jitsi_server_url VARCHAR(255) DEFAULT 'https://meet.jit.si', -- URL du serveur Jitsi (cloud ou auto-hébergé)
  max_participants INTEGER DEFAULT 100,
  recording_enabled BOOLEAN DEFAULT TRUE, -- Activer l'enregistrement Jitsi
  recording_url TEXT, -- URL de l'enregistrement après la session (si disponible)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: live_session_participants
CREATE TABLE live_session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  attendance_duration INTEGER, -- en minutes
  UNIQUE(session_id, user_id)
);

-- Table: live_session_chat
CREATE TABLE live_session_chat (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'message', -- message, question, answer
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.2.2 Endpoints API nécessaires

```
POST   /api/courses/:courseId/live-sessions          - Créer une session live
GET    /api/courses/:courseId/live-sessions           - Lister les sessions d'un cours
GET    /api/live-sessions/:sessionId                  - Détails d'une session
PUT    /api/live-sessions/:sessionId                  - Modifier une session
DELETE /api/live-sessions/:sessionId                  - Supprimer une session
POST   /api/live-sessions/:sessionId/join             - Rejoindre une session
POST   /api/live-sessions/:sessionId/leave            - Quitter une session
GET    /api/live-sessions/:sessionId/participants     - Liste des participants
POST   /api/live-sessions/:sessionId/chat             - Envoyer un message
GET    /api/live-sessions/:sessionId/chat             - Récupérer les messages
POST   /api/live-sessions/:sessionId/start            - Démarrer la session (instructeur)
POST   /api/live-sessions/:sessionId/end              - Terminer la session (instructeur)
```

### 1.3 Architecture Frontend

#### 1.3.1 Types TypeScript

**Fichier:** `src/types/liveSession.ts`

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
  updated_at: string;
  course?: {
    id: number;
    title: string;
    slug: string;
  };
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
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

export interface LiveSessionParticipant {
  id: number;
  session_id: number;
  user_id: number;
  enrolled_at: string;
  joined_at?: string;
  left_at?: string;
  attendance_duration?: number;
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
  message_type: "message" | "question" | "answer";
  is_pinned: boolean;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}
```

#### 1.3.2 Service API

**Fichier:** `src/lib/services/liveSessionService.ts`

```typescript
import { apiRequest } from "./api";
import {
  LiveSession,
  LiveSessionParticipant,
  LiveSessionChatMessage,
} from "../../types/liveSession";

export class LiveSessionService {
  // Créer une session live
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

  // Lister les sessions d'un cours
  static async getCourseSessions(courseId: number): Promise<LiveSession[]> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: "GET",
    });
    return response.data;
  }

  // Rejoindre une session (retourne les infos Jitsi)
  static async joinSession(sessionId: number): Promise<JoinSessionData> {
    const response = await apiRequest(`/live-sessions/${sessionId}/join`, {
      method: "POST",
    });
    return response.data;
  }

  // Démarrer une session (instructeur uniquement)
  static async startSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/start`, {
      method: "POST",
    });
    return response.data;
  }

  // Terminer une session (instructeur uniquement)
  static async endSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}/end`, {
      method: "POST",
    });
    return response.data;
  }

  // Quitter une session
  static async leaveSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}/leave`, {
      method: "POST",
    });
  }

  // Envoyer un message dans le chat
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

  // Récupérer les messages du chat
  static async getChatMessages(
    sessionId: number
  ): Promise<LiveSessionChatMessage[]> {
    const response = await apiRequest(`/live-sessions/${sessionId}/chat`, {
      method: "GET",
    });
    return response.data;
  }
}
```

#### 1.3.3 Composants React

**Fichier:** `src/components/courses/LiveSessionCard.tsx`

- Affiche une carte pour une session live avec :
  - Date/heure programmée
  - Statut (programmée, en cours, terminée)
  - Bouton pour rejoindre (si en cours)
  - Nombre de participants

**Fichier:** `src/components/courses/JitsiMeetPlayer.tsx`

- Composant d'intégration Jitsi Meet :
  - Chargement dynamique de l'API Jitsi Meet
  - Configuration de la salle de conférence
  - Contrôles audio/vidéo personnalisés
  - Gestion des événements Jitsi (rejoindre, quitter, participants)
  - Interface utilisateur personnalisée

**Fichier:** `src/components/courses/LiveSessionPlayer.tsx`

- Interface principale pour participer à une session live :
  - Intégration du composant JitsiMeetPlayer
  - Gestion du statut de la session (programmée, en cours, terminée)
  - Boutons de contrôle (rejoindre, démarrer, quitter)
  - Affichage des informations de la session
  - Contrôles pour l'instructeur (démarrer/arrêter)

**Fichier:** `src/components/dashboard/instructor/LiveSessionManager.tsx`

- Gestion des sessions live pour l'instructeur :
  - Créer/éditer/supprimer des sessions
  - Voir les participants
  - Démarrer/arrêter les sessions
  - Gérer les enregistrements

#### 1.3.4 Pages

**Fichier:** `src/app/courses/[slug]/live/page.tsx`

- Page listant toutes les sessions live d'un cours

**Fichier:** `src/app/live/[sessionId]/page.tsx`

- Page de participation à une session live

**Fichier:** `src/app/dashboard/instructor/live-sessions/page.tsx`

- Dashboard instructeur pour gérer les sessions live

### 1.4 Intégration avec Jitsi Meet

#### 1.4.1 Pourquoi Jitsi Meet ?

✅ **Open Source** - Gratuit et sans limites  
✅ **Auto-hébergé** - Contrôle total sur vos données  
✅ **Sans compte** - Les étudiants rejoignent directement  
✅ **API simple** - Intégration facile via iframe  
✅ **Enregistrement** - Support natif de l'enregistrement  
✅ **Chat intégré** - Chat en temps réel inclus

#### 1.4.2 Configuration Jitsi Meet

**Option A : Jitsi Meet Cloud (Recommandé pour démarrer)**

- Utilisez `https://meet.jit.si` comme serveur
- Aucune configuration serveur nécessaire
- Limite : 100 participants par session (gratuit)
- Parfait pour le développement et les tests

**Option B : Auto-hébergement Jitsi Meet (Production)**

- Plus de contrôle et de sécurité
- Pas de limite de participants
- Nécessite un serveur dédié avec Docker
- Configuration plus complexe mais plus flexible

#### 1.4.3 Génération du nom de salle Jitsi

Le backend doit générer un nom de salle unique et sécurisé :

```javascript
// Exemple de génération côté backend
const generateJitsiRoomName = (courseId, sessionId) => {
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return `mdsc-course-${courseId}-session-${sessionId}-${randomSuffix}`;
};
```

#### 1.4.4 Endpoints API Backend pour Jitsi

```javascript
// POST /api/courses/:courseId/live-sessions
// Le backend génère automatiquement jitsi_room_name
{
  title: "Introduction à React",
  scheduled_start_time: "2024-01-15T10:00:00Z",
  scheduled_end_time: "2024-01-15T11:30:00Z",
  max_participants: 50,
  recording_enabled: true
}

// Réponse :
{
  id: 1,
  jitsi_room_name: "mdsc-course-5-session-1-abc123def456",
  jitsi_server_url: "https://meet.jit.si",
  // ... autres champs
}

// GET /api/live-sessions/:sessionId/join
// Retourne les informations pour rejoindre via Jitsi
{
  jitsi_room_name: "mdsc-course-5-session-1-abc123def456",
  jitsi_server_url: "https://meet.jit.si",
  user_display_name: "John Doe",
  user_email: "john@example.com",
  is_instructor: false
}
```

#### 1.4.5 Installation Frontend

**Dépendance :** Aucune installation nécessaire ! Jitsi Meet se charge via un script externe.

**Fichier:** `src/components/courses/JitsiMeetPlayer.tsx`

- Charge dynamiquement le script Jitsi : `https://8x8.vc/external_api.js`
- Initialise l'API Jitsi avec les paramètres de configuration
- Gère les événements (rejoindre, quitter, participants)
- Interface personnalisée avec contrôles audio/vidéo

#### 1.4.6 Configuration Jitsi

**Options de configuration recommandées :**

```javascript
const jitsiConfig = {
  startWithAudioMuted: false,
  startWithVideoMuted: false,
  enableWelcomePage: false,
  enableClosePage: false,
  disableDeepLinking: true,
  enableInsecureRoomNameWarning: false,
  disableInviteFunctions: false,
  disableThirdPartyRequests: true,
};
```

**Interface personnalisée :**

```javascript
const interfaceConfig = {
  TOOLBAR_BUTTONS: [
    "microphone",
    "camera",
    "closedcaptions",
    "desktop",
    "fullscreen",
    "fodeviceselection",
    "hangup",
    "profile",
    "chat",
    "recording",
    "settings",
    "videoquality",
    "filmstrip",
    "feedback",
    "stats",
    "shortcuts",
    "tileview",
  ],
  DEFAULT_BACKGROUND: "#1a1a1a",
};
```

#### 1.4.7 Gestion des enregistrements

Si `recording_enabled` est activé :

- L'instructeur peut démarrer l'enregistrement depuis l'interface Jitsi
- L'enregistrement est stocké sur le serveur Jitsi (ou votre serveur si auto-hébergé)
- L'URL de l'enregistrement est sauvegardée dans `recording_url` après la session

#### 1.4.8 Sécurité et Permissions

- **Noms de salle uniques** : Générés de manière cryptographiquement sécurisée
- **Validation backend** : Vérifier les permissions avant de permettre la connexion
- **Limite de participants** : Gérée côté backend et Jitsi
- **Modération** : L'instructeur a des droits de modérateur dans Jitsi

#### 1.4.9 Documentation Jitsi

- **API Jitsi Meet** : https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **Documentation complète** : https://github.com/jitsi/jitsi-meet/blob/master/doc/api.md
- **Exemples** : https://github.com/jitsi/jitsi-meet/tree/master/doc/example

---

## 2. SYNCHRONISATION CALENDRIER LORS DE L'INSCRIPTION

### 2.1 Objectif

Lorsqu'un étudiant s'inscrit à un cours, créer automatiquement des événements dans son calendrier pour :

- Les sessions live programmées
- Les deadlines de quiz/évaluations
- Les milestones du cours
- Les rappels personnalisés

### 2.2 Architecture Backend

#### 2.2.1 Modification du service d'inscription

Lors de l'inscription (`POST /api/enrollments`), déclencher :

1. Création automatique d'un planning (`schedule`) pour le cours
2. Génération des événements calendrier basés sur :
   - Structure du cours (modules, leçons)
   - Sessions live programmées
   - Dates de quiz/évaluations
   - Durée estimée du cours

#### 2.2.2 Endpoints API supplémentaires

```
POST   /api/enrollments/:enrollmentId/generate-schedule  - Générer le planning
GET    /api/enrollments/:enrollmentId/schedule           - Récupérer le planning
PUT    /api/enrollments/:enrollmentId/schedule           - Mettre à jour le planning
POST   /api/enrollments/:enrollmentId/sync-calendar      - Synchroniser avec calendrier externe (Google, Outlook)
```

### 2.3 Architecture Frontend

#### 2.3.1 Modification du service d'inscription

**Fichier:** `src/lib/services/enrollmentService.ts`

```typescript
// Modifier la méthode enrollInCourse pour inclure la génération automatique du planning
static async enrollInCourse(courseId: number, options?: {
  paymentId?: string;
  autoGenerateSchedule?: boolean; // Nouveau paramètre
}): Promise<Enrollment> {
  // ... code existant ...

  // Après l'inscription réussie, générer automatiquement le planning
  if (options?.autoGenerateSchedule !== false) {
    try {
      await scheduleService.generateCourseSchedule(response.data.id);
    } catch (error) {
      console.warn('Erreur lors de la génération du planning:', error);
      // Ne pas faire échouer l'inscription si la génération du planning échoue
    }
  }

  return response.data;
}
```

#### 2.3.2 Service de planning amélioré

**Fichier:** `src/lib/services/scheduleService.ts` (à améliorer)

```typescript
// Générer automatiquement un planning pour un cours
static async generateCourseSchedule(enrollmentId: number): Promise<CourseSchedule> {
  const response = await apiRequest(`/enrollments/${enrollmentId}/generate-schedule`, {
    method: 'POST',
  });
  return response.data;
}

// Synchroniser avec un calendrier externe (Google Calendar, Outlook)
static async syncWithExternalCalendar(
  enrollmentId: number,
  calendarType: 'google' | 'outlook' | 'ical'
): Promise<{ sync_url?: string; calendar_file?: string }> {
  const response = await apiRequest(`/enrollments/${enrollmentId}/sync-calendar`, {
    method: 'POST',
    body: JSON.stringify({ calendar_type: calendarType }),
  });
  return response.data;
}
```

#### 2.3.3 Composant de synchronisation calendrier

**Fichier:** `src/components/courses/CalendarSyncButton.tsx`

- Bouton pour synchroniser le planning avec Google Calendar, Outlook, ou télécharger un fichier .ics

#### 2.3.4 Mise à jour du composant d'inscription

**Fichier:** `src/components/courses/CourseEnrollmentButton.tsx`

- Ajouter une option pour générer automatiquement le planning lors de l'inscription
- Afficher un message de confirmation avec option de synchronisation calendrier

### 2.4 Logique de génération automatique

**Algorithme proposé:**

1. **Analyser la structure du cours** :

   - Nombre de modules
   - Nombre de leçons par module
   - Durée estimée de chaque leçon
   - Quiz/évaluations et leurs deadlines

2. **Créer un planning échelonné** :

   - Répartir les leçons sur la durée du cours
   - Placer les quiz après les leçons correspondantes
   - Ajouter des milestones (25%, 50%, 75%, 100%)
   - Intégrer les sessions live programmées

3. **Générer les événements calendrier** :
   - Créer des `ScheduleItem` pour chaque élément
   - Créer des `CalendarEvent` pour les événements importants

---

## 3. SYSTÈME DE NOTATION AVANT CERTIFICAT

### 3.1 Objectif

Permettre aux étudiants de noter et commenter un cours une fois terminé, avant d'obtenir leur certificat. Les notes contribuent à la note moyenne du cours.

### 3.2 Architecture Backend

#### 3.2.1 Modèle de données

```sql
-- Table: course_ratings
CREATE TABLE course_ratings (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  pros TEXT, -- Points positifs
  cons TEXT, -- Points à améliorer
  would_recommend BOOLEAN DEFAULT TRUE,
  is_verified_purchase BOOLEAN DEFAULT TRUE, -- L'utilisateur a complété le cours
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, user_id, enrollment_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX idx_course_ratings_user_id ON course_ratings(user_id);
CREATE INDEX idx_course_ratings_status ON course_ratings(status);
```

#### 3.2.2 Mise à jour de la table courses

```sql
-- Ajouter des colonnes pour les statistiques de notation
ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb;
```

#### 3.2.3 Endpoints API

```
POST   /api/courses/:courseId/ratings                    - Créer une notation
GET    /api/courses/:courseId/ratings                   - Lister les notations d'un cours
GET    /api/courses/:courseId/ratings/:ratingId         - Détails d'une notation
PUT    /api/courses/:courseId/ratings/:ratingId         - Modifier sa notation
DELETE /api/courses/:courseId/ratings/:ratingId         - Supprimer sa notation
GET    /api/courses/:courseId/ratings/stats             - Statistiques des notations
GET    /api/enrollments/:enrollmentId/can-rate          - Vérifier si l'étudiant peut noter
```

#### 3.2.4 Logique de validation

- Un étudiant ne peut noter que s'il a **complété le cours** (progress = 100%)
- Un étudiant ne peut noter qu'**une seule fois** par cours
- La notation est **optionnelle** mais recommandée avant d'obtenir le certificat
- Les instructeurs peuvent modérer les commentaires

### 3.3 Architecture Frontend

#### 3.3.1 Types TypeScript

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
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  course?: {
    id: number;
    title: string;
    slug: string;
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
  recommendation_rate: number; // Pourcentage de recommandations
}
```

#### 3.3.2 Service API

**Fichier:** `src/lib/services/ratingService.ts`

```typescript
import { apiRequest } from "./api";
import { CourseRating, CourseRatingStats } from "../../types/rating";

export class RatingService {
  // Créer une notation
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

  // Vérifier si l'étudiant peut noter
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

  // Récupérer les statistiques de notation
  static async getRatingStats(courseId: number): Promise<CourseRatingStats> {
    const response = await apiRequest(`/courses/${courseId}/ratings/stats`, {
      method: "GET",
    });
    return response.data;
  }

  // Lister les notations d'un cours
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
```

#### 3.3.3 Composants React

**Fichier:** `src/components/courses/RatingForm.tsx`

- Formulaire de notation avec :
  - Étoiles (1-5)
  - Champ commentaire
  - Champs pros/cons
  - Checkbox "Je recommande ce cours"
  - Option anonyme

**Fichier:** `src/components/courses/RatingDisplay.tsx`

- Affichage d'une notation individuelle avec :
  - Note en étoiles
  - Commentaire
  - Auteur (ou "Anonyme")
  - Date
  - Bouton "Utile" (si implémenté)

**Fichier:** `src/components/courses/RatingStats.tsx`

- Statistiques globales :
  - Note moyenne
  - Distribution des notes (graphique)
  - Nombre total de notes
  - Pourcentage de recommandations

**Fichier:** `src/components/courses/RatingModal.tsx`

- Modal affichée après la complétion d'un cours
- Invite l'étudiant à noter avant d'obtenir le certificat
- Option "Plus tard" disponible

#### 3.3.4 Intégration avec le flux de certificat

**Fichier:** `src/app/dashboard/student/certificates/page.tsx` (à modifier)

- Avant d'afficher le bouton "Obtenir le certificat", vérifier si l'étudiant a noté
- Afficher une invitation à noter si non noté

**Fichier:** `src/components/certificates/CertificateCelebrateModal.tsx` (à modifier)

- Après la complétion, afficher d'abord le modal de notation
- Ensuite, proposer d'obtenir le certificat

---

## 4. FORUM DE DISCUSSION POUR LES COURS

### 4.1 Objectif

Permettre aux étudiants d'un même cours de discuter, poser des questions et partager des ressources via un forum dédié.

### 4.2 Architecture Backend

#### 4.2.1 Modèle de données

```sql
-- Table: course_forums
CREATE TABLE course_forums (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id) -- Un forum par cours
);

-- Table: forum_topics
CREATE TABLE forum_topics (
  id SERIAL PRIMARY KEY,
  forum_id INTEGER REFERENCES course_forums(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
  topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE, -- Pour les réponses imbriquées
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT FALSE, -- Marquer comme solution (par l'auteur du topic)
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: forum_reactions
CREATE TABLE forum_reactions (
  id SERIAL PRIMARY KEY,
  reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) DEFAULT 'upvote', -- upvote, downvote, like, helpful
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reply_id, user_id, reaction_type)
);

-- Index pour améliorer les performances
CREATE INDEX idx_forum_topics_forum_id ON forum_topics(forum_id);
CREATE INDEX idx_forum_topics_user_id ON forum_topics(user_id);
CREATE INDEX idx_forum_replies_topic_id ON forum_replies(topic_id);
CREATE INDEX idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
```

#### 4.2.2 Endpoints API

```
# Forum
GET    /api/courses/:courseId/forum                    - Récupérer le forum du cours
POST   /api/courses/:courseId/forum                   - Créer le forum (admin/instructeur)

# Topics
GET    /api/forums/:forumId/topics                     - Lister les topics
POST   /api/forums/:forumId/topics                     - Créer un topic
GET    /api/topics/:topicId                            - Détails d'un topic
PUT    /api/topics/:topicId                            - Modifier un topic
DELETE /api/topics/:topicId                            - Supprimer un topic
POST   /api/topics/:topicId/pin                        - Épingler un topic
POST   /api/topics/:topicId/lock                       - Verrouiller un topic

# Replies
GET    /api/topics/:topicId/replies                    - Lister les réponses
POST   /api/topics/:topicId/replies                    - Créer une réponse
PUT    /api/replies/:replyId                           - Modifier une réponse
DELETE /api/replies/:replyId                           - Supprimer une réponse
POST   /api/replies/:replyId/mark-solution             - Marquer comme solution

# Reactions
POST   /api/replies/:replyId/reactions                 - Ajouter une réaction
DELETE /api/replies/:replyId/reactions                 - Retirer une réaction
```

### 4.3 Architecture Frontend

#### 4.3.1 Types TypeScript

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
  course?: {
    id: number;
    title: string;
    slug: string;
  };
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
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  last_reply_user?: {
    id: number;
    first_name: string;
    last_name: string;
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
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  parent_reply?: ForumReply;
  replies?: ForumReply[]; // Réponses imbriquées
  user_reaction?: "upvote" | "downvote" | null;
}
```

#### 4.3.2 Service API

**Fichier:** `src/lib/services/forumService.ts`

```typescript
import { apiRequest } from "./api";
import { CourseForum, ForumTopic, ForumReply } from "../../types/forum";

export class ForumService {
  // Récupérer le forum d'un cours
  static async getCourseForum(courseId: number): Promise<CourseForum> {
    const response = await apiRequest(`/courses/${courseId}/forum`, {
      method: "GET",
    });
    return response.data;
  }

  // Lister les topics d'un forum
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

  // Créer un topic
  static async createTopic(
    forumId: number,
    data: {
      title: string;
      content: string;
    }
  ): Promise<ForumTopic> {
    const response = await apiRequest(`/forums/${forumId}/topics`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Récupérer les réponses d'un topic
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

  // Créer une réponse
  static async createReply(
    topicId: number,
    data: {
      content: string;
      parent_reply_id?: number;
    }
  ): Promise<ForumReply> {
    const response = await apiRequest(`/topics/${topicId}/replies`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Ajouter une réaction
  static async addReaction(
    replyId: number,
    reactionType: "upvote" | "downvote"
  ): Promise<void> {
    await apiRequest(`/replies/${replyId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  }

  // Marquer une réponse comme solution
  static async markAsSolution(replyId: number): Promise<void> {
    await apiRequest(`/replies/${replyId}/mark-solution`, {
      method: "POST",
    });
  }
}
```

#### 4.3.3 Composants React

**Fichier:** `src/components/forum/ForumHeader.tsx`

- En-tête du forum avec :
  - Titre et description
  - Statistiques (topics, réponses)
  - Bouton "Nouveau topic"

**Fichier:** `src/components/forum/TopicList.tsx`

- Liste des topics avec :
  - Topics épinglés en premier
  - Informations (auteur, date, vues, réponses)
  - Badge "Solution" si un topic a une solution
  - Filtres et tri

**Fichier:** `src/components/forum/TopicCard.tsx`

- Carte individuelle d'un topic

**Fichier:** `src/components/forum/TopicDetail.tsx`

- Détails d'un topic avec :
  - Contenu du topic
  - Liste des réponses (imbriquées)
  - Formulaire de réponse
  - Actions (réagir, marquer comme solution)

**Fichier:** `src/components/forum/ReplyCard.tsx`

- Carte d'une réponse avec :
  - Auteur et avatar
  - Contenu (support markdown)
  - Badge "Solution" si marquée
  - Boutons de réaction (upvote/downvote)
  - Bouton "Répondre" pour réponse imbriquée

**Fichier:** `src/components/forum/TopicForm.tsx`

- Formulaire pour créer/modifier un topic

**Fichier:** `src/components/forum/ReplyForm.tsx`

- Formulaire pour créer une réponse (avec support de réponse imbriquée)

#### 4.3.4 Pages

**Fichier:** `src/app/courses/[slug]/forum/page.tsx`

- Page principale du forum d'un cours
- Liste des topics

**Fichier:** `src/app/courses/[slug]/forum/[topicId]/page.tsx`

- Page de détail d'un topic avec toutes les réponses

#### 4.3.5 Intégration dans le lecteur de cours

**Fichier:** `src/components/courses/CoursePlayer.tsx` (à modifier)

- Ajouter un onglet "Forum" dans le lecteur de cours
- Permettre de poser des questions directement depuis une leçon

---

## 5. ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 : Synchronisation Calendrier (Priorité Haute)

**Durée estimée : 1-2 semaines**

- Impact immédiat sur l'expérience utilisateur
- Relativement simple à implémenter
- Améliore l'engagement des étudiants

**Tâches :**

1. Backend : Modifier l'endpoint d'inscription pour générer automatiquement le planning
2. Backend : Créer l'endpoint de génération de planning
3. Frontend : Mettre à jour le service d'inscription
4. Frontend : Créer le composant de synchronisation calendrier
5. Tests : Vérifier la génération automatique

### Phase 2 : Système de Notation (Priorité Haute)

**Durée estimée : 2-3 semaines**

- Important pour la qualité des cours
- Nécessaire avant les certificats
- Améliore la confiance des étudiants

**Tâches :**

1. Backend : Créer les tables et endpoints
2. Backend : Implémenter la logique de validation
3. Frontend : Créer les composants de notation
4. Frontend : Intégrer dans le flux de certificat
5. Tests : Vérifier le workflow complet

### Phase 3 : Forum de Discussion (Priorité Moyenne)

**Durée estimée : 3-4 semaines**

- Améliore l'engagement communautaire
- Complexité moyenne
- Nécessite une modération

**Tâches :**

1. Backend : Créer les tables et endpoints
2. Backend : Implémenter les réactions et réponses imbriquées
3. Frontend : Créer les composants du forum
4. Frontend : Intégrer dans les pages de cours
5. Tests : Vérifier les interactions

### Phase 4 : Cours en Live avec Jitsi Meet (Priorité Moyenne-Basse)

**Durée estimée : 3-4 semaines**

- Complexité moyenne (simplifiée grâce à Jitsi Meet)
- Intégration directe via iframe (pas besoin de WebSocket pour le chat)
- Peut être ajouté progressivement

**Tâches :**

1. Backend : Créer les tables et endpoints avec support Jitsi
2. Backend : Implémenter la génération de noms de salle Jitsi uniques
3. Frontend : Créer le composant JitsiMeetPlayer
4. Frontend : Créer les composants de gestion de session live
5. Frontend : Implémenter l'interface de participation
6. Tests : Vérifier les sessions live end-to-end avec Jitsi
7. Optionnel : Configurer l'auto-hébergement Jitsi pour la production

---

## 6. CONSIDÉRATIONS TECHNIQUES

### 6.1 WebSockets pour le temps réel

Pour le forum et les notifications, considérer l'utilisation de WebSockets :

- **Socket.io** : Solution populaire et robuste
- **WebSocket natif** : Plus léger mais nécessite plus de code
- **Server-Sent Events (SSE)** : Alternative plus simple pour les notifications

**Note :** Pour les sessions live avec Jitsi Meet, le chat est géré directement par Jitsi (pas besoin de WebSocket supplémentaire).

### 6.2 Notifications

Implémenter un système de notifications pour :

- Nouvelles réponses dans le forum
- Nouveaux topics dans les cours suivis
- Rappels de sessions live
- Rappels de deadlines

### 6.3 Performance

- **Pagination** : Tous les endpoints de liste doivent supporter la pagination
- **Cache** : Mettre en cache les statistiques (notes, nombre de topics)
- **Index** : Créer des index sur les colonnes fréquemment interrogées

### 6.4 Sécurité

- **Validation** : Valider toutes les entrées utilisateur
- **Permissions** : Vérifier les permissions (seuls les étudiants inscrits peuvent accéder au forum)
- **Modération** : Permettre aux instructeurs/admins de modérer le contenu
- **Rate limiting** : Limiter le nombre de requêtes pour éviter le spam

---

## 7. RESSOURCES ET DOCUMENTATION

### 7.1 Bibliothèques recommandées

- **date-fns** : Déjà installé, pour la gestion des dates
- **react-markdown** : Pour le support markdown dans le forum
- **socket.io-client** : Pour les WebSockets côté client (forum, notifications)
- **react-calendar** : Pour les composants calendrier (si nécessaire)
- **Jitsi Meet** : Pas de dépendance npm nécessaire, chargement via script externe

### 7.2 Documentation à consulter

- Documentation de l'API backend existante
- **Jitsi Meet API** : https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **Jitsi Meet GitHub** : https://github.com/jitsi/jitsi-meet
- Documentation Next.js pour les routes dynamiques
- **Guide Jitsi détaillé** : Voir `GUIDE_JITSI_MEET.md` pour les détails d'implémentation

---

## 8. CHECKLIST DE VALIDATION

### Synchronisation Calendrier

- [ ] Le planning est généré automatiquement lors de l'inscription
- [ ] Les événements apparaissent dans le calendrier de l'étudiant
- [ ] La synchronisation avec Google Calendar fonctionne
- [ ] Le téléchargement de fichier .ics fonctionne
- [ ] Les mises à jour du planning sont reflétées dans le calendrier

### Système de Notation

- [ ] Un étudiant ne peut noter qu'après avoir complété le cours
- [ ] Un étudiant ne peut noter qu'une seule fois
- [ ] Les notes sont affichées sur la page du cours
- [ ] Les statistiques sont calculées correctement
- [ ] Le modal de notation apparaît après la complétion

### Forum de Discussion

- [ ] Seuls les étudiants inscrits peuvent accéder au forum
- [ ] Les topics peuvent être créés, modifiés et supprimés
- [ ] Les réponses peuvent être créées et imbriquées
- [ ] Les réactions (upvote/downvote) fonctionnent
- [ ] Les topics peuvent être épinglés et verrouillés
- [ ] La modération fonctionne pour les instructeurs

### Cours en Live avec Jitsi Meet

- [ ] Les sessions peuvent être créées par les instructeurs
- [ ] Les noms de salle Jitsi sont générés automatiquement et de manière sécurisée
- [ ] Les étudiants peuvent rejoindre les sessions via Jitsi
- [ ] L'intégration Jitsi fonctionne correctement (audio, vidéo, chat)
- [ ] Les contrôles personnalisés fonctionnent (mute, vidéo on/off)
- [ ] Les enregistrements sont disponibles après la session (si activés)
- [ ] Les notifications sont envoyées avant les sessions
- [ ] La gestion des participants fonctionne
- [ ] Les permissions sont correctement appliquées (instructeur = modérateur)

---

## 9. NOTES FINALES

Ce plan est un guide détaillé pour l'implémentation. Il est recommandé de :

1. Commencer par les fonctionnalités les plus simples (synchronisation calendrier)
2. Tester chaque fonctionnalité de manière isolée avant de les intégrer
3. Obtenir des retours utilisateurs après chaque phase
4. Itérer et améliorer basé sur les retours

Pour toute question ou clarification, référez-vous à ce document ou contactez l'équipe de développement.
