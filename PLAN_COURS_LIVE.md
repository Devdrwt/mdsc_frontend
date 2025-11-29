# Plan d'implémentation - Cours en Live avec Jitsi Meet

## 📋 Vue d'ensemble

Ce document présente le plan complet pour implémenter les cours en live avec intégration Jitsi Meet, incluant le backend (API, modèles, services) et le frontend (composants, pages, services).

---

## 🎯 Objectifs

1. Permettre aux instructeurs de créer et gérer des cours en live
2. Générer automatiquement des sessions Jitsi Meet pour chaque cours live
3. Synchroniser les sessions avec le calendrier des étudiants
4. Gérer les participants et les permissions
5. Enregistrer les sessions (optionnel)
6. Notifier les étudiants des sessions à venir

---

## 🏗️ Architecture Backend

### 1. Modèles de données

#### 1.1 Table `live_sessions`

```sql
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_start_at TIMESTAMP NOT NULL,
  scheduled_end_at TIMESTAMP NOT NULL,
  actual_start_at TIMESTAMP,
  actual_end_at TIMESTAMP,
  jitsi_room_name VARCHAR(255) NOT NULL UNIQUE,
  jitsi_server_url VARCHAR(255) DEFAULT 'https://meet.jit.si',
  jitsi_room_password VARCHAR(100),
  max_participants INTEGER DEFAULT 50,
  is_recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE INDEX idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX idx_live_sessions_instructor ON live_sessions(instructor_id);
CREATE INDEX idx_live_sessions_scheduled_start ON live_sessions(scheduled_start_at);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
```

#### 1.2 Table `live_session_participants`

```sql
CREATE TABLE live_session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id INTEGER REFERENCES enrollments(id),
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  attendance_duration INTEGER DEFAULT 0, -- en minutes
  is_present BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'participant', -- instructor, participant, moderator
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id),
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES live_sessions(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE INDEX idx_participants_session ON live_session_participants(session_id);
CREATE INDEX idx_participants_user ON live_session_participants(user_id);
```

#### 1.3 Table `live_session_chat` (optionnel - chat pendant la session)

```sql
CREATE TABLE live_session_chat (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, question, answer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES live_sessions(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_session ON live_session_chat(session_id);
CREATE INDEX idx_chat_created ON live_session_chat(created_at);
```

#### 1.4 Modification de la table `courses`

```sql
-- Ajouter des colonnes si elles n'existent pas déjà
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_type VARCHAR(50) DEFAULT 'on_demand',
ADD COLUMN IF NOT EXISTS max_students INTEGER,
ADD COLUMN IF NOT EXISTS enrollment_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS course_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS course_end_date TIMESTAMP;

-- Index pour les cours live
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_start_date ON courses(course_start_date);
```

---

## 🔌 Endpoints API Backend

### 2.1 Gestion des sessions live

#### `POST /api/courses/:courseId/live-sessions`

**Créer une session live pour un cours**

```json
Request Body:
{
  "title": "Session 1: Introduction",
  "description": "Première session du cours",
  "scheduled_start_at": "2024-03-15T10:00:00Z",
  "scheduled_end_at": "2024-03-15T12:00:00Z",
  "max_participants": 50,
  "is_recording_enabled": true
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "course_id": 123,
    "instructor_id": 45,
    "title": "Session 1: Introduction",
    "jitsi_room_name": "mdsc-course-123-session-1",
    "jitsi_server_url": "https://meet.jit.si",
    "jitsi_room_password": "secure-password-123",
    "scheduled_start_at": "2024-03-15T10:00:00Z",
    "scheduled_end_at": "2024-03-15T12:00:00Z",
    "status": "scheduled",
    "max_participants": 50,
    "is_recording_enabled": true
  }
}
```

#### `GET /api/courses/:courseId/live-sessions`

**Récupérer toutes les sessions d'un cours**

```json
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Session 1",
      "scheduled_start_at": "2024-03-15T10:00:00Z",
      "scheduled_end_at": "2024-03-15T12:00:00Z",
      "status": "scheduled",
      "participants_count": 25,
      "max_participants": 50
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

#### `GET /api/live-sessions/:sessionId`

**Récupérer les détails d'une session**

```json
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "course_id": 123,
    "course": {
      "id": 123,
      "title": "Leadership et Management"
    },
    "instructor": {
      "id": 45,
      "first_name": "Jean",
      "last_name": "Dupont"
    },
    "title": "Session 1: Introduction",
    "jitsi_room_name": "mdsc-course-123-session-1",
    "jitsi_server_url": "https://meet.jit.si",
    "scheduled_start_at": "2024-03-15T10:00:00Z",
    "scheduled_end_at": "2024-03-15T12:00:00Z",
    "status": "scheduled",
    "participants": [
      {
        "user_id": 100,
        "user": {
          "first_name": "Marie",
          "last_name": "Martin"
        },
        "role": "participant",
        "is_present": false
      }
    ],
    "participants_count": 25,
    "max_participants": 50
  }
}
```

#### `PUT /api/live-sessions/:sessionId`

**Mettre à jour une session**

```json
Request Body:
{
  "title": "Session 1: Introduction (modifiée)",
  "scheduled_start_at": "2024-03-15T11:00:00Z",
  "scheduled_end_at": "2024-03-15T13:00:00Z"
}
```

#### `DELETE /api/live-sessions/:sessionId`

**Supprimer une session**

#### `POST /api/live-sessions/:sessionId/start`

**Démarrer une session (instructeur uniquement)**

```json
Response:
{
  "success": true,
  "data": {
    "session_id": 1,
    "status": "live",
    "actual_start_at": "2024-03-15T10:05:00Z",
    "jitsi_join_url": "https://meet.jit.si/mdsc-course-123-session-1?jwt=..."
  }
}
```

#### `POST /api/live-sessions/:sessionId/end`

**Terminer une session (instructeur uniquement)**

```json
Response:
{
  "success": true,
  "data": {
    "session_id": 1,
    "status": "ended",
    "actual_end_at": "2024-03-15T12:10:00Z",
    "recording_url": "https://recordings.jit.si/..."
  }
}
```

### 2.2 Gestion des participants

#### `GET /api/live-sessions/:sessionId/participants`

**Récupérer les participants d'une session**

```json
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 100,
      "user": {
        "id": 100,
        "first_name": "Marie",
        "last_name": "Martin",
        "email": "marie@example.com"
      },
      "role": "participant",
      "joined_at": "2024-03-15T10:05:00Z",
      "is_present": true,
      "attendance_duration": 120
    }
  ]
}
```

#### `POST /api/live-sessions/:sessionId/join`

**Rejoindre une session (étudiant inscrit)**

```json
Request Body:
{
  "enrollment_id": 456
}

Response:
{
  "success": true,
  "data": {
    "session_id": 1,
    "user_id": 100,
    "jitsi_join_url": "https://meet.jit.si/mdsc-course-123-session-1?jwt=...",
    "jitsi_room_password": "secure-password-123",
    "joined_at": "2024-03-15T10:05:00Z"
  }
}
```

#### `POST /api/live-sessions/:sessionId/leave`

**Quitter une session**

```json
Response:
{
  "success": true,
  "data": {
    "session_id": 1,
    "user_id": 100,
    "left_at": "2024-03-15T12:00:00Z",
    "attendance_duration": 115
  }
}
```

#### `GET /api/student/live-sessions`

**Récupérer les sessions live de l'étudiant connecté**

```json
Response:
{
  "success": true,
  "data": {
    "upcoming": [
      {
        "id": 1,
        "course_id": 123,
        "course_title": "Leadership et Management",
        "title": "Session 1: Introduction",
        "scheduled_start_at": "2024-03-15T10:00:00Z",
        "scheduled_end_at": "2024-03-15T12:00:00Z",
        "status": "scheduled",
        "can_join": true
      }
    ],
    "live": [],
    "past": []
  }
}
```

### 2.3 Génération de JWT pour Jitsi

#### `POST /api/live-sessions/:sessionId/jitsi-token`

**Générer un JWT pour rejoindre Jitsi (authentification)**

```json
Request Body:
{
  "user_id": 100,
  "role": "participant" // ou "instructor", "moderator"
}

Response:
{
  "success": true,
  "data": {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jitsi_join_url": "https://meet.jit.si/mdsc-course-123-session-1?jwt=...",
    "expires_at": "2024-03-15T12:00:00Z"
  }
}
```

### 2.4 Calendrier et notifications

#### `GET /api/student/calendar/live-sessions`

**Récupérer les sessions live pour le calendrier**

```json
Query Params:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Session 1: Introduction",
      "course_title": "Leadership et Management",
      "start": "2024-03-15T10:00:00Z",
      "end": "2024-03-15T12:00:00Z",
      "type": "live_session",
      "url": "/courses/123/live-sessions/1"
    }
  ]
}
```

#### `POST /api/live-sessions/:sessionId/notify`

**Envoyer des notifications aux participants**

```json
Request Body:
{
  "notification_type": "reminder", // reminder, cancelled, rescheduled
  "message": "Rappel: Session dans 1 heure"
}
```

---

## 🎨 Architecture Frontend

### 3. Types TypeScript

#### `src/types/liveSession.ts`

```typescript
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
  };
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
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
```

### 4. Services Frontend

#### `src/lib/services/liveSessionService.ts`

```typescript
import { apiRequest } from "./api";
import {
  LiveSession,
  LiveSessionParticipant,
  CreateLiveSessionData,
  UpdateLiveSessionData,
  JitsiTokenResponse,
} from "../../types/liveSession";

export class LiveSessionService {
  /**
   * Créer une session live pour un cours
   */
  static async createSession(
    courseId: number,
    data: CreateLiveSessionData
  ): Promise<LiveSession> {
    const response = await apiRequest(`/courses/${courseId}/live-sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Récupérer toutes les sessions d'un cours
   */
  static async getCourseSessions(
    courseId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: LiveSession[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiRequest(
      `/courses/${courseId}/live-sessions?${queryParams.toString()}`,
      { method: "GET" }
    );
    return {
      data: Array.isArray(response.data)
        ? response.data
        : response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  }

  /**
   * Récupérer une session spécifique
   */
  static async getSession(sessionId: number): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}`, {
      method: "GET",
    });
    return response.data;
  }

  /**
   * Mettre à jour une session
   */
  static async updateSession(
    sessionId: number,
    data: UpdateLiveSessionData
  ): Promise<LiveSession> {
    const response = await apiRequest(`/live-sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Supprimer une session
   */
  static async deleteSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  /**
   * Démarrer une session (instructeur)
   */
  static async startSession(sessionId: number): Promise<{
    status: string;
    actual_start_at: string;
    jitsi_join_url: string;
  }> {
    const response = await apiRequest(`/live-sessions/${sessionId}/start`, {
      method: "POST",
    });
    return response.data;
  }

  /**
   * Terminer une session (instructeur)
   */
  static async endSession(sessionId: number): Promise<{
    status: string;
    actual_end_at: string;
    recording_url?: string;
  }> {
    const response = await apiRequest(`/live-sessions/${sessionId}/end`, {
      method: "POST",
    });
    return response.data;
  }

  /**
   * Rejoindre une session (étudiant)
   */
  static async joinSession(
    sessionId: number,
    enrollmentId?: number
  ): Promise<{
    jitsi_join_url: string;
    jitsi_room_password?: string;
    joined_at: string;
  }> {
    const response = await apiRequest(`/live-sessions/${sessionId}/join`, {
      method: "POST",
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    });
    return response.data;
  }

  /**
   * Quitter une session
   */
  static async leaveSession(sessionId: number): Promise<void> {
    await apiRequest(`/live-sessions/${sessionId}/leave`, {
      method: "POST",
    });
  }

  /**
   * Récupérer les participants d'une session
   */
  static async getParticipants(
    sessionId: number
  ): Promise<LiveSessionParticipant[]> {
    const response = await apiRequest(
      `/live-sessions/${sessionId}/participants`,
      {
        method: "GET",
      }
    );
    return response.data || [];
  }

  /**
   * Récupérer les sessions live de l'étudiant connecté
   */
  static async getStudentSessions(): Promise<{
    upcoming: LiveSession[];
    live: LiveSession[];
    past: LiveSession[];
  }> {
    const response = await apiRequest("/student/live-sessions", {
      method: "GET",
    });
    return response.data || { upcoming: [], live: [], past: [] };
  }

  /**
   * Générer un JWT pour Jitsi
   */
  static async getJitsiToken(
    sessionId: number,
    role: "instructor" | "participant" | "moderator" = "participant"
  ): Promise<JitsiTokenResponse> {
    const { user } = useAuthStore.getState();
    const response = await apiRequest(
      `/live-sessions/${sessionId}/jitsi-token`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: user?.id,
          role,
        }),
      }
    );
    return response.data;
  }

  /**
   * Récupérer les sessions pour le calendrier
   */
  static async getCalendarSessions(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const response = await apiRequest(
      `/student/calendar/live-sessions?start_date=${startDate}&end_date=${endDate}`,
      { method: "GET" }
    );
    return response.data || [];
  }
}

export const liveSessionService = LiveSessionService;
```

### 5. Composants Frontend

#### 5.1 `src/components/live/LiveSessionCard.tsx`

**Carte affichant une session live**

- Affiche les informations de la session
- Bouton "Rejoindre" si la session est live ou à venir
- Indicateur de statut (scheduled, live, ended)
- Compteur de participants

#### 5.2 `src/components/live/LiveSessionList.tsx`

**Liste des sessions live d'un cours**

- Affichage de toutes les sessions
- Filtres par statut
- Tri par date
- Actions (éditer, supprimer pour instructeur)

#### 5.3 `src/components/live/LiveSessionForm.tsx`

**Formulaire de création/édition de session**

- Champs : titre, description, dates, participants max
- Validation des dates
- Génération automatique du nom de salle Jitsi

#### 5.4 `src/components/live/JitsiMeetPlayer.tsx`

**Intégration Jitsi Meet (API de bas niveau)**

- Chargement dynamique de `lib-jitsi-meet.min.js`
- Initialisation de `JitsiMeetJS`
- Création de connexion et conférence
- Gestion des pistes locales (caméra, micro)
- Gestion des pistes distantes (participants)
- Contrôles vidéo/audio (mute, unmute, start, stop)
- Gestion des événements (connexion, conférence, pistes)
- Configuration des contraintes vidéo (qualité)
- Gestion des permissions (instructeur/participant)

#### 5.5 `src/components/live/LiveSessionPlayer.tsx`

**Player complet pour une session live**

- Intégration Jitsi avec API de bas niveau
- Interface personnalisée avec contrôles
- Chat en temps réel (optionnel)
- Liste des participants en temps réel
- Contrôles instructeur (démarrer/terminer session)
- Gestion de l'enregistrement
- Partage d'écran

#### 5.6 `src/components/live/LiveSessionManager.tsx`

**Gestion complète des sessions (instructeur)**

- CRUD des sessions
- Démarrer/terminer les sessions
- Voir les participants et statistiques

---

## 📅 Pages Frontend

### 6.1 `src/app/courses/[slug]/live-sessions/page.tsx`

**Page listant les sessions live d'un cours**

- Accessible aux étudiants inscrits et instructeurs
- Liste des sessions avec filtres
- Bouton pour créer une session (instructeur)

### 6.2 `src/app/courses/[slug]/live-sessions/[sessionId]/page.tsx`

**Page de détail d'une session**

- Informations de la session
- Bouton "Rejoindre" si disponible
- Historique du chat (si implémenté)
- Participants

### 6.3 `src/app/courses/[slug]/live-sessions/[sessionId]/join/page.tsx`

**Page de participation à une session live**

- Chargement de Jitsi
- Vérification des permissions
- Redirection automatique vers Jitsi

### 6.4 `src/app/dashboard/instructor/courses/[courseId]/live-sessions/page.tsx`

**Page de gestion des sessions (instructeur)**

- Liste des sessions
- Formulaire de création
- Actions (éditer, supprimer, démarrer, terminer)

### 6.5 `src/app/dashboard/student/live-sessions/page.tsx`

**Page des sessions live de l'étudiant**

- Sessions à venir
- Sessions en cours
- Sessions passées
- Intégration calendrier

---

## 🔐 Sécurité et Authentification

### 7.1 Génération sécurisée des noms de salle Jitsi

```typescript
// Backend
function generateJitsiRoomName(courseId: number, sessionId: number): string {
  const prefix = "mdsc";
  const hash = crypto
    .createHash("sha256")
    .update(`${courseId}-${sessionId}-${Date.now()}`)
    .digest("hex")
    .substring(0, 8);
  return `${prefix}-course-${courseId}-session-${sessionId}-${hash}`;
}
```

### 7.2 JWT pour Jitsi

- Génération côté backend avec clé secrète
- Expiration basée sur la durée de la session
- Rôles : instructor (modérateur), participant (utilisateur standard)

### 7.3 Vérifications d'accès

- Vérifier que l'utilisateur est inscrit au cours
- Vérifier que la session n'est pas complète (max_participants)
- Vérifier que la session est dans les dates autorisées
- Vérifier les permissions (instructeur peut démarrer/terminer)

---

## 📧 Notifications et Calendrier

### 8.1 Notifications automatiques

- **24h avant** : Rappel de session à venir
- **1h avant** : Dernier rappel
- **Au démarrage** : Notification que la session est live
- **Annulation** : Notification si session annulée
- **Report** : Notification si session reportée

### 8.2 Synchronisation calendrier

- Génération automatique d'événements iCal
- Export Google Calendar / Outlook
- Intégration avec le service de calendrier existant

---

## 🚀 Étapes d'implémentation

### Phase 1 : Backend (Base)

1. ✅ Créer les tables SQL
2. ✅ Créer les modèles Sequelize/TypeORM
3. ✅ Implémenter les endpoints CRUD de base
4. ✅ Génération des noms de salle Jitsi
5. ✅ Tests unitaires backend

### Phase 2 : Backend (Avancé)

1. ✅ Génération JWT pour Jitsi
2. ✅ Gestion des participants
3. ✅ Système de notifications
4. ✅ Intégration calendrier
5. ✅ Tests d'intégration

### Phase 3 : Frontend (Base)

1. ✅ Créer les types TypeScript
2. ✅ Créer le service `liveSessionService`
3. ✅ Créer les composants de base (Card, List, Form)
4. ✅ Créer les pages de liste et détail
5. ✅ Tests des composants

### Phase 4 : Frontend (Jitsi)

1. ✅ Intégration Jitsi Meet SDK
2. ✅ Composant `JitsiMeetPlayer`
3. ✅ Gestion des permissions
4. ✅ Interface de chat (optionnel)
5. ✅ Tests d'intégration Jitsi

### Phase 5 : Finalisation

1. ✅ Notifications frontend
2. ✅ Synchronisation calendrier
3. ✅ Documentation
4. ✅ Tests end-to-end
5. ✅ Optimisations performance

---

## 📝 Notes techniques

### Jitsi Meet Configuration

- **Serveur par défaut** : `https://meet.jit.si` (gratuit)
- **Serveur self-hosted** : Optionnel pour plus de contrôle
- **Fonctionnalités** : Vidéo, audio, partage d'écran, chat, enregistrement

### Performance

- Cache des sessions à venir (Redis optionnel)
- WebSockets pour les mises à jour en temps réel
- Pagination pour les listes de sessions

### Scalabilité

- Support de plusieurs sessions simultanées
- Limitation par cours (max_sessions)
- Gestion de la charge avec Jitsi

---

## ✅ Checklist de validation

- [ ] Backend : Toutes les tables créées
- [ ] Backend : Tous les endpoints fonctionnels
- [ ] Backend : Génération JWT Jitsi
- [ ] Backend : Vérifications de sécurité
- [ ] Frontend : Types TypeScript
- [ ] Frontend : Service API
- [ ] Frontend : Composants de base
- [ ] Frontend : Intégration Jitsi
- [ ] Frontend : Pages de gestion
- [ ] Notifications : Emails automatiques
- [ ] Calendrier : Synchronisation
- [ ] Tests : Unitaires et intégration
- [ ] Documentation : Guide utilisateur

---

## 📚 Ressources

- [Documentation Jitsi Meet](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [Jitsi Meet API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [JWT pour Jitsi](https://github.com/jitsi/lib-jitsi-meet/blob/master/doc/tokens.md)

---

**Date de création** : 2024
**Version** : 1.0
**Auteur** : Équipe MdSC
