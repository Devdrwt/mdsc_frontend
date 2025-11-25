# 📚 Explication du Processus des Cours en Live

## 🎯 Vue d'ensemble

Le système de cours en live permet aux instructeurs de créer et animer des sessions vidéo en temps réel avec leurs étudiants via Jitsi Meet, une plateforme de vidéoconférence open-source.

---

## 🔄 Processus Complet

### 1️⃣ **Création d'une Session Live (Instructeur)**

#### Étape 1 : Accès à la gestion des sessions
- L'instructeur va sur `/dashboard/instructor/courses/[courseId]/live-sessions`
- Il voit la liste de ses sessions existantes (programmées, en direct, terminées)

#### Étape 2 : Création d'une nouvelle session
- Clique sur "Nouvelle session"
- Remplit le formulaire :
  - **Titre** : Nom de la session (ex: "Session 1: Introduction à la gouvernance")
  - **Description** : Détails de la session
  - **Date et heure de début** : Quand la session commence
  - **Date et heure de fin** : Quand la session se termine
  - **Nombre maximum de participants** : Limite d'étudiants (ex: 50)
  - **Enregistrement** : Option pour activer l'enregistrement de la session

#### Étape 3 : Génération automatique
Le backend génère automatiquement :
- **Nom de salle Jitsi** : Identifiant unique sécurisé (ex: `mdsc-course-123-session-1-abc123`)
- **URL du serveur Jitsi** : `https://meet.jit.si` (par défaut) ou serveur personnalisé
- **Mot de passe de salle** : Mot de passe optionnel pour sécuriser l'accès
- **Statut initial** : `scheduled` (programmée)

#### Étape 4 : Sauvegarde
- La session est enregistrée dans la base de données
- Elle apparaît dans la liste des sessions du cours
- Les étudiants inscrits au cours peuvent voir la session programmée

---

### 2️⃣ **Programmation et Notifications**

#### Automatique
- La session apparaît dans le calendrier de l'étudiant
- Les étudiants inscrits peuvent voir la session dans :
  - Leur dashboard (`/dashboard/student/live-sessions`)
  - La page du cours (`/courses/[slug]/live-sessions`)
  - Le calendrier (`/dashboard/student/calendar`)

#### Notifications (optionnel - à implémenter)
- **24h avant** : Rappel de session à venir
- **1h avant** : Dernier rappel
- **Quand la session démarre** : Notification "Session en direct"

---

### 3️⃣ **Démarrage de la Session (Instructeur)**

#### Étape 1 : Démarrer la session
- L'instructeur va sur `/dashboard/instructor/courses/[courseId]/live-sessions`
- Clique sur le bouton "Démarrer" (icône Play) pour une session programmée
- Le backend :
  - Change le statut de `scheduled` à `live`
  - Enregistre `actual_start_at` (heure réelle de démarrage)
  - Génère un JWT (JSON Web Token) pour l'authentification Jitsi

#### Étape 2 : Connexion à Jitsi
- L'instructeur est redirigé vers `/courses/[slug]/live-sessions/[sessionId]/join`
- Le frontend :
  - Charge la bibliothèque Jitsi Meet (`lib-jitsi-meet.min.js`)
  - Récupère le JWT depuis le backend (`/api/live-sessions/:sessionId/jitsi-token`)
  - Se connecte à Jitsi avec le JWT (rôle: `instructor` = modérateur)
  - Affiche l'interface vidéo personnalisée

#### Étape 3 : Interface Jitsi
L'instructeur voit :
- **Sa vidéo locale** (petite fenêtre en bas à droite)
- **Les vidéos des participants** (grille principale)
- **Contrôles** :
  - Micro (mute/unmute)
  - Caméra (on/off)
  - Partage d'écran
  - Quitter la session

---

### 4️⃣ **Rejoindre une Session (Étudiant)**

#### Étape 1 : Voir les sessions disponibles
L'étudiant peut voir les sessions :
- **À venir** : Sessions programmées qu'il peut rejoindre quand elles commencent
- **En direct** : Sessions actuellement en cours
- **Passées** : Sessions terminées (pour consultation)

#### Étape 2 : Rejoindre une session live
- Clique sur "Rejoindre" pour une session `live`
- Le backend vérifie :
  - ✅ L'étudiant est inscrit au cours
  - ✅ La session n'est pas complète (max_participants)
  - ✅ La session n'est pas annulée ou terminée
- Si tout est OK :
  - L'étudiant est enregistré comme participant
  - Le backend génère un JWT (rôle: `participant`)
  - L'étudiant est redirigé vers la page de connexion Jitsi

#### Étape 3 : Connexion à Jitsi
- Le frontend charge Jitsi Meet
- Récupère le JWT depuis le backend
- Se connecte à Jitsi avec le JWT (rôle: `participant`)
- Affiche l'interface vidéo

#### Étape 4 : Participation
L'étudiant peut :
- Voir et entendre l'instructeur et les autres participants
- Activer/désactiver son micro et sa caméra
- Partager son écran (si autorisé)
- Quitter la session

---

### 5️⃣ **Pendant la Session**

#### Gestion des participants
- **Suivi en temps réel** : Le backend enregistre qui rejoint/quitte
- **Durée de présence** : Calcul automatique du temps passé dans la session
- **Statut** : `is_present` mis à jour en temps réel

#### Contrôles de l'instructeur
- **Modérateur** : L'instructeur a des droits de modération (mute participants, etc.)
- **Qualité vidéo** : Configuration automatique (360p par défaut, jusqu'à 20 participants)
- **Partage d'écran** : L'instructeur peut partager son écran pour présenter

#### Chat (optionnel)
- Les participants peuvent envoyer des messages texte
- Types de messages : `text`, `question`, `answer`
- Messages enregistrés dans `live_session_chat`

---

### 6️⃣ **Fin de la Session (Instructeur)**

#### Étape 1 : Terminer la session
- L'instructeur clique sur "Terminer" (icône Square)
- Le backend :
  - Change le statut de `live` à `ended`
  - Enregistre `actual_end_at` (heure réelle de fin)
  - Si l'enregistrement était activé, récupère l'URL de l'enregistrement
  - Calcule la durée totale de la session

#### Étape 2 : Statistiques
- Durée totale de la session
- Nombre de participants
- Durée moyenne de présence par participant
- URL de l'enregistrement (si disponible)

---

### 7️⃣ **Après la Session**

#### Pour l'étudiant
- La session apparaît dans "Sessions passées"
- Peut consulter l'enregistrement (si disponible)
- Peut accéder aux ressources partagées

#### Pour l'instructeur
- Statistiques détaillées de participation
- Enregistrement disponible pour révision
- Possibilité de créer une nouvelle session

---

## 🔐 Sécurité et Authentification

### JWT (JSON Web Token)
- **Génération** : Côté backend avec clé secrète
- **Expiration** : Basée sur la durée de la session
- **Rôles** :
  - `instructor` : Modérateur (peut contrôler la session)
  - `participant` : Utilisateur standard
  - `moderator` : Modérateur supplémentaire

### Vérifications d'accès
- ✅ Vérification d'inscription au cours
- ✅ Vérification du nombre maximum de participants
- ✅ Vérification du statut de la session (pas annulée/terminée)
- ✅ Authentification utilisateur requise

---

## 📊 Flux de Données

### Backend → Frontend
```
1. Instructeur crée session
   → POST /api/courses/:courseId/live-sessions
   ← { id, jitsi_room_name, status: "scheduled" }

2. Étudiant rejoint session
   → POST /api/live-sessions/:sessionId/join
   ← { jitsi_join_url, jitsi_room_password }

3. Génération JWT
   → POST /api/live-sessions/:sessionId/jitsi-token
   ← { jwt, jitsi_join_url, expires_at }

4. Démarrer session
   → POST /api/live-sessions/:sessionId/start
   ← { status: "live", actual_start_at }

5. Terminer session
   → POST /api/live-sessions/:sessionId/end
   ← { status: "ended", actual_end_at, recording_url }
```

### Frontend → Jitsi
```
1. Chargement de lib-jitsi-meet.min.js
2. Initialisation de JitsiMeetJS
3. Connexion avec JWT
4. Création de conférence avec jitsi_room_name
5. Ajout des pistes vidéo/audio locales
6. Réception des pistes distantes (participants)
```

---

## 🎥 Interface Jitsi

### Composants Frontend
- **JitsiMeetPlayer** : Composant principal avec API de bas niveau
- **LiveSessionPlayer** : Wrapper pour gérer le flux complet
- **LiveSessionCard** : Carte d'affichage d'une session
- **LiveSessionList** : Liste avec filtres
- **LiveSessionForm** : Formulaire de création/édition
- **LiveSessionManager** : Gestion complète (instructeur)

### Fonctionnalités
- ✅ Vidéo/audio en temps réel
- ✅ Partage d'écran
- ✅ Contrôles (mute/unmute, on/off)
- ✅ Gestion des participants
- ✅ Configuration de qualité vidéo
- ✅ Interface personnalisée avec dark mode

---

## 📅 Synchronisation Calendrier

### Automatique
- Les sessions live sont automatiquement incluses dans le calendrier
- Format iCal pour export Google Calendar / Outlook
- Filtrage par dates et statut

### Endpoint
```
GET /api/calendar/events?start=2024-03-01&end=2024-03-31
→ Inclut les sessions live avec type: "live_session"
```

---

## 🔄 États d'une Session

1. **`scheduled`** : Programmée (pas encore commencée)
   - Visible par les étudiants inscrits
   - Bouton "Rejoindre" disponible quand la session démarre

2. **`live`** : En direct (en cours)
   - Visible et joignable par les étudiants inscrits
   - Bouton "Rejoindre" actif
   - Badge "En direct" affiché

3. **`ended`** : Terminée
   - Visible dans l'historique
   - Enregistrement disponible (si activé)
   - Plus joignable

4. **`cancelled`** : Annulée
   - Visible dans l'historique
   - Plus joignable
   - Raison d'annulation affichée

---

## 🎯 Cas d'Usage

### Cas 1 : Session de Q&A
1. Instructeur crée une session "Q&A sur la gouvernance"
2. Programme pour le samedi à 14h
3. Les étudiants voient la session dans leur calendrier
4. Le samedi à 14h, l'instructeur démarre la session
5. Les étudiants rejoignent et posent leurs questions
6. L'instructeur répond en direct
7. La session se termine après 1h

### Cas 2 : Cours en direct
1. Instructeur crée une session "Cours 1: Introduction"
2. Programme pour chaque mardi à 10h (série de sessions)
3. Les étudiants s'inscrivent au cours
4. Chaque mardi, l'instructeur démarre la session
5. Les étudiants suivent le cours en direct
6. L'instructeur partage son écran pour présenter
7. La session est enregistrée pour révision

### Cas 3 : Session de révision
1. Instructeur crée une session "Révision avant examen"
2. Programme pour la veille de l'examen
3. Les étudiants rejoignent pour poser des questions
4. L'instructeur répond et clarifie les points difficiles
5. La session est enregistrée pour consultation ultérieure

---

## 🛠️ Technologies Utilisées

### Backend
- **Base de données** : Tables `live_sessions`, `live_session_participants`, `live_session_chat`
- **API REST** : Endpoints pour CRUD, gestion participants, JWT
- **Jitsi Service** : Génération de noms de salle, JWT, URLs

### Frontend
- **Next.js** : Pages et routing
- **React** : Composants interactifs
- **Jitsi Meet API** : Intégration vidéo (lib-jitsi-meet)
- **TypeScript** : Typage fort
- **Tailwind CSS** : Styling

---

## ✅ Avantages

1. **Temps réel** : Interaction directe entre instructeur et étudiants
2. **Flexible** : Sessions programmées ou spontanées
3. **Sécurisé** : Authentification JWT, vérifications d'accès
4. **Enregistrable** : Possibilité d'enregistrer pour révision
5. **Intégré** : Synchronisation calendrier, notifications
6. **Scalable** : Support de nombreuses sessions simultanées

---

## 📝 Notes Importantes

1. **Jitsi Meet** : Utilise le serveur public `meet.jit.si` par défaut (gratuit, ~75 participants)
2. **Self-hosted** : Option pour serveur Jitsi personnalisé (production)
3. **JWT** : Nécessite `JITSI_APP_SECRET` dans `.env` (ou utilise `JWT_SECRET`)
4. **Permissions** : Instructeurs = modérateurs automatiquement
5. **Calendrier** : Synchronisation automatique avec les sessions live

---

*Document créé le : 2025-01-XX*
*Système de cours en live - Processus complet*

