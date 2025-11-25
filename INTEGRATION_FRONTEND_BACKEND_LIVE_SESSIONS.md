# ✅ Intégration Frontend/Backend - Sessions Live

## 📋 Vue d'ensemble

Ce document récapitule l'intégration complète entre le frontend et le backend pour les cours en live avec Jitsi Meet.

---

## ✅ Frontend Implémenté

### 1. Types TypeScript (`src/types/liveSession.ts`)

✅ Toutes les interfaces alignées avec le backend :
- `LiveSession` : Structure complète avec champs snake_case
- `LiveSessionParticipant` : Participants avec rôles
- `LiveSessionChatMessage` : Messages du chat (optionnel)
- Types pour création/mise à jour
- Types pour réponses API (JWT, join, start, end)
- Types pour calendrier et sessions étudiant

### 2. Service API (`src/lib/services/liveSessionService.ts`)

✅ Tous les endpoints backend implémentés :

| Endpoint Backend | Méthode Service | Statut |
|-----------------|-----------------|--------|
| `POST /api/courses/:courseId/live-sessions` | `createSession()` | ✅ |
| `GET /api/courses/:courseId/live-sessions` | `getCourseSessions()` | ✅ |
| `GET /api/live-sessions/:sessionId` | `getSession()` | ✅ |
| `PUT /api/live-sessions/:sessionId` | `updateSession()` | ✅ |
| `DELETE /api/live-sessions/:sessionId` | `deleteSession()` | ✅ |
| `POST /api/live-sessions/:sessionId/start` | `startSession()` | ✅ |
| `POST /api/live-sessions/:sessionId/end` | `endSession()` | ✅ |
| `GET /api/live-sessions/:sessionId/participants` | `getParticipants()` | ✅ |
| `POST /api/live-sessions/:sessionId/join` | `joinSession()` | ✅ |
| `POST /api/live-sessions/:sessionId/leave` | `leaveSession()` | ✅ |
| `GET /api/student/live-sessions` | `getStudentSessions()` | ✅ |
| `POST /api/live-sessions/:sessionId/jitsi-token` | `getJitsiToken()` | ✅ |
| `GET /api/student/calendar/live-sessions` | `getCalendarSessions()` | ✅ |

### 3. Composants React

#### ✅ `JitsiMeetPlayer.tsx` (Composant principal)
- ✅ Intégration API de bas niveau Jitsi Meet
- ✅ Chargement dynamique de `lib-jitsi-meet.min.js`
- ✅ Récupération du JWT depuis le backend (`getJitsiToken`)
- ✅ Connexion avec authentification JWT
- ✅ Gestion des pistes vidéo/audio locales et distantes
- ✅ Contrôles (mute/unmute, vidéo, partage d'écran)
- ✅ Configuration de qualité vidéo
- ✅ Interface personnalisée avec dark mode
- ✅ Gestion d'erreurs et états de chargement

#### ✅ Composants UI
- `LiveSessionCard` : Carte de session avec statut et actions
- `LiveSessionList` : Liste avec filtres (toutes, à venir, live, passées)
- `LiveSessionForm` : Formulaire création/édition avec validation
- `LiveSessionManager` : Gestion complète pour instructeurs (CRUD, démarrer/terminer)
- `LiveSessionPlayer` : Wrapper pour rejoindre une session

### 4. Pages Next.js

✅ 5 pages créées :

1. `/courses/[slug]/live-sessions` - Liste des sessions d'un cours
2. `/courses/[slug]/live-sessions/[sessionId]` - Détail d'une session
3. `/courses/[slug]/live-sessions/[sessionId]/join` - Page de participation
4. `/dashboard/instructor/courses/[courseId]/live-sessions` - Gestion (instructeur)
5. `/dashboard/student/live-sessions` - Sessions de l'étudiant

### 5. Utilitaires

✅ `src/lib/utils/jitsiLoader.ts`
- Chargement dynamique de la bibliothèque Jitsi
- Vérification de disponibilité

---

## 🔌 Alignement Frontend/Backend

### ✅ Structure des Réponses API

Le backend retourne :
```json
{
  "success": true,
  "data": { ... }
}
```

Le frontend utilise `apiRequest` qui extrait automatiquement `response.data`, donc :
- ✅ `liveSessionService.createSession()` → retourne `LiveSession`
- ✅ `liveSessionService.getCourseSessions()` → retourne `{ data: LiveSession[], pagination: {} }`
- ✅ Tous les autres endpoints → retournent les types corrects

### ✅ Authentification JWT Jitsi

**Backend** :
- Endpoint `POST /api/live-sessions/:sessionId/jitsi-token`
- Retourne `{ jwt, jitsi_join_url, expires_at }`

**Frontend** :
- ✅ `JitsiMeetPlayer` appelle `liveSessionService.getJitsiToken()`
- ✅ Le JWT est passé dans `connectionOptions.jwt`
- ✅ Connexion sécurisée à Jitsi avec authentification

### ✅ Rejoindre une Session

**Backend** :
- Endpoint `POST /api/live-sessions/:sessionId/join`
- Retourne `{ jitsi_join_url, jitsi_room_password, joined_at }`

**Frontend** :
- ✅ `LiveSessionPlayer` appelle `liveSessionService.joinSession()`
- ✅ Enregistre la participation dans le backend
- ✅ Puis affiche `JitsiMeetPlayer` pour la connexion

### ✅ Gestion des Statuts

**Backend** : `scheduled`, `live`, `ended`, `cancelled`

**Frontend** :
- ✅ Types TypeScript alignés
- ✅ Affichage des badges de statut
- ✅ Filtres par statut
- ✅ Actions conditionnelles selon le statut

### ✅ Permissions

**Backend** :
- Instructeurs : CRUD sur leurs sessions
- Admins : Accès complet
- Étudiants : Rejoindre uniquement s'inscrits

**Frontend** :
- ✅ Vérification des rôles dans les composants
- ✅ Affichage conditionnel des actions
- ✅ Redirection si permissions insuffisantes

---

## 🚀 Flux d'Utilisation

### 1. Créer une Session (Instructeur)

```
1. Instructeur va sur /dashboard/instructor/courses/[courseId]/live-sessions
2. Clique sur "Nouvelle session"
3. Remplit le formulaire (LiveSessionForm)
4. Soumet → liveSessionService.createSession()
5. Backend crée la session avec nom de salle Jitsi généré
6. Session apparaît dans la liste
```

### 2. Rejoindre une Session (Étudiant)

```
1. Étudiant va sur /courses/[slug]/live-sessions
2. Clique sur "Rejoindre" pour une session live/à venir
3. Redirection vers /courses/[slug]/live-sessions/[sessionId]/join
4. LiveSessionPlayer charge la session
5. Appelle liveSessionService.joinSession() → enregistre la participation
6. Affiche JitsiMeetPlayer
7. JitsiMeetPlayer :
   - Charge lib-jitsi-meet.min.js
   - Appelle getJitsiToken() pour obtenir le JWT
   - Se connecte à Jitsi avec le JWT
   - Affiche l'interface vidéo
```

### 3. Démarrer une Session (Instructeur)

```
1. Instructeur voit sa session "Programmée"
2. Clique sur "Démarrer" (bouton Play)
3. Appelle liveSessionService.startSession()
4. Backend met le statut à "live" et enregistre actual_start_at
5. Session devient "En direct"
6. Les étudiants peuvent maintenant rejoindre
```

### 4. Terminer une Session (Instructeur)

```
1. Instructeur clique sur "Terminer" (bouton Square)
2. Appelle liveSessionService.endSession()
3. Backend met le statut à "ended" et enregistre actual_end_at
4. Session devient "Terminée"
5. Les étudiants ne peuvent plus rejoindre
```

---

## 🔐 Sécurité

### ✅ Authentification
- ✅ Toutes les requêtes utilisent le token d'authentification
- ✅ `apiRequest` ajoute automatiquement les headers d'auth
- ✅ Gestion des erreurs 401/403 avec déconnexion automatique

### ✅ Autorisation
- ✅ Vérification des rôles côté frontend
- ✅ Backend valide également les permissions
- ✅ Redirection si accès non autorisé

### ✅ JWT Jitsi
- ✅ Génération côté backend avec clé secrète
- ✅ Expiration basée sur la durée de la session
- ✅ Rôles : instructor (modérateur), participant (utilisateur standard)

---

## 📊 Données Échangées

### Création de Session

**Frontend → Backend** :
```json
{
  "title": "Session 1: Introduction",
  "description": "Première session du cours",
  "scheduled_start_at": "2024-03-15T10:00:00Z",
  "scheduled_end_at": "2024-03-15T12:00:00Z",
  "max_participants": 50,
  "is_recording_enabled": true
}
```

**Backend → Frontend** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "course_id": 123,
    "instructor_id": 45,
    "title": "Session 1: Introduction",
    "jitsi_room_name": "mdsc-course-123-session-1-abc123",
    "jitsi_server_url": "https://meet.jit.si",
    "status": "scheduled",
    ...
  }
}
```

### Rejoindre une Session

**Frontend → Backend** :
```json
{
  "enrollment_id": 456
}
```

**Backend → Frontend** :
```json
{
  "success": true,
  "data": {
    "session_id": 1,
    "user_id": 789,
    "jitsi_join_url": "https://meet.jit.si/mdsc-course-123-session-1-abc123?jwt=...",
    "jitsi_room_password": "secure-password",
    "joined_at": "2024-03-15T10:05:00Z"
  }
}
```

### Obtenir JWT Jitsi

**Frontend → Backend** :
```json
{
  "user_id": 789,
  "role": "participant"
}
```

**Backend → Frontend** :
```json
{
  "success": true,
  "data": {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jitsi_join_url": "https://meet.jit.si/mdsc-course-123-session-1-abc123?jwt=...",
    "expires_at": "2024-03-15T12:00:00Z"
  }
}
```

---

## ✅ Tests Recommandés

### 1. Tests Frontend
- [ ] Créer une session (instructeur)
- [ ] Modifier une session (instructeur)
- [ ] Supprimer une session (instructeur)
- [ ] Démarrer une session (instructeur)
- [ ] Terminer une session (instructeur)
- [ ] Rejoindre une session (étudiant)
- [ ] Voir la liste des sessions (étudiant/instructeur)
- [ ] Filtrer les sessions par statut
- [ ] Voir les sessions dans le calendrier

### 2. Tests Intégration
- [ ] Connexion Jitsi avec JWT
- [ ] Vidéo/audio fonctionnels
- [ ] Partage d'écran
- [ ] Contrôles (mute/unmute)
- [ ] Gestion des participants
- [ ] Quitter une session
- [ ] Gestion d'erreurs (session annulée, terminée)

### 3. Tests Sécurité
- [ ] Étudiant ne peut pas créer de session
- [ ] Étudiant ne peut rejoindre que s'il est inscrit
- [ ] Instructeur ne peut modifier que ses sessions
- [ ] JWT expire correctement
- [ ] Token d'authentification requis pour toutes les requêtes

---

## 🐛 Dépannage

### Problème : "JitsiMeetJS not loaded"
**Solution** : Vérifier que `lib-jitsi-meet.min.js` se charge correctement. Le script est chargé depuis `https://meet.jit.si/libs/lib-jitsi-meet.min.js`

### Problème : "Échec de connexion à Jitsi Meet"
**Solutions** :
- Vérifier que le JWT est bien généré côté backend
- Vérifier que `jitsi_server_url` est correct
- Vérifier les permissions CORS si serveur self-hosted

### Problème : "Impossible de rejoindre la session"
**Solutions** :
- Vérifier que l'étudiant est bien inscrit au cours
- Vérifier que la session n'est pas complète (max_participants)
- Vérifier que la session n'est pas annulée ou terminée

### Problème : "Route non trouvée"
**Solutions** :
- Vérifier que les routes backend sont bien montées dans `server.js`
- Vérifier que l'URL de l'API est correcte dans `.env` (`NEXT_PUBLIC_API_URL`)

---

## 📝 Notes Importantes

1. **JWT Jitsi** : Le frontend récupère automatiquement le JWT avant de se connecter à Jitsi. Si le JWT n'est pas disponible, la connexion se fait sans authentification (fonctionne pour les serveurs publics).

2. **Mot de passe de salle** : Le backend génère un mot de passe, mais l'API de bas niveau de Jitsi n'utilise pas directement ce mot de passe. Il est utilisé si on utilise l'URL de join complète.

3. **Statuts** : Les statuts sont synchronisés entre frontend et backend. Le frontend met à jour automatiquement l'affichage selon le statut.

4. **Calendrier** : Les sessions live sont automatiquement incluses dans le calendrier via l'endpoint `/api/calendar/events`.

5. **Responsive** : Tous les composants sont responsive et compatibles dark mode.

---

## ✅ Statut Final

- ✅ **Backend** : Implémenté et fonctionnel
- ✅ **Frontend** : Implémenté et aligné avec le backend
- ✅ **Intégration** : Prête pour les tests
- ✅ **Documentation** : Complète

**Prochaine étape** : Tests d'intégration et validation sur différents navigateurs.

---

*Document créé le : 2025-01-XX*
*Intégration Frontend/Backend complète ✅*

