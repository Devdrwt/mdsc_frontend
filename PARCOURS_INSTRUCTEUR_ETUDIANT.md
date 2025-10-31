# 📚 Parcours Instructeur et Étudiant - MDSC MOOC Platform

## 🎓 PARCOURS INSTRUCTEUR

### **1. Authentification et Accès**

#### **Inscription** ✅
```
Route : /register
Composant : SimpleRegisterForm.tsx / MultiStepRegisterForm.tsx
API : POST /api/auth/register

Flow :
1. Sélection du rôle "Instructeur"
2. Formulaire multi-étapes ou simple
3. Vérification email automatique
4. Email de vérification envoyé avec token hashé
5. Clic sur lien → /verify-email?token=...
6. Vérification automatique via POST /api/auth/verify-email
7. Redirection vers /login
```

#### **Connexion** ✅
```
Route : /login
Composant : LoginForm.tsx
API : POST /api/auth/login

Flow :
1. Saisie email/mot de passe
2. Connexion via API
3. Stockage tokens (authToken, refreshToken, user)
4. Redirection vers /dashboard/instructor
```

---

### **2. Dashboard Instructeur**

#### **Page Principale** ✅
```
Route : /dashboard/instructor
Composant : src/app/dashboard/instructor/page.tsx

Informations affichées :
- Statistiques : Cours publiés, Étudiants, Certifications, Revenus
- Liens rapides : Nouveau Cours, Mes Cours, Étudiants, Évaluations
- Activités récentes : Derniers cours créés, nouveaux étudiants
- Graphiques : Progression des inscriptions
```

**Liens rapides disponibles** :
- 📝 Nouveau Cours → `/dashboard/instructor/courses` (modal création)
- 📚 Mes Cours → `/dashboard/instructor/courses`
- 👥 Étudiants → `/dashboard/instructor/students`
- ✅ Évaluations → `/dashboard/instructor/evaluations`
- 📊 Analytics → `/dashboard/instructor/analytics`
- 💬 Messages → `/dashboard/instructor/messages`
- 🤖 Chat IA → `/dashboard/instructor/chat-ai`
- ⚙️ Paramètres → `/dashboard/instructor/settings`

---

### **3. Gestion des Cours**

#### **Création de Cours** ✅
```
Route : /dashboard/instructor/courses
Composant : CourseManagement.tsx
API : POST /api/courses

Formulaire professionnel en sections :
1. Informations générales
   - Titre, Description complète, Description courte
   - Catégorie, Difficulté, Langue
   
2. Configuration du cours
   - Image de couverture (thumbnail_url)
   - Vidéo de présentation (video_url)
   - Durée, Prix, Devise
   - Mis en avant (is_featured)
   
3. Dates et prérequis
   - Date limite d'inscription
   - Date de début/fin
   - Cours prérequis (prerequisite_course_id)

Actions :
- Créer → POST /api/courses
- Modifier → PUT /api/courses/:id
- Supprimer → DELETE /api/courses/:id
- Publier → Toggle is_published
```

#### **Liste des Cours** ✅
```
API : GET /api/courses/my (cours de l'instructeur)

Affichage :
- Tableau avec filtre/recherche
- Actions : Modifier, Supprimer, Voir détails
- Statistiques par cours : Étudiants, Progression moyenne
```

---

### **4. Gestion des Modules**

#### **Création de Modules** ✅
```
Route : /dashboard/instructor/modules
Composant : ModuleManagement.tsx
API : POST /api/modules

Formulaire :
- Cours associé (course_id)
- Titre, Description
- Image d'identification (image_url)
- Ordre (order_index)
- Déverrouillé par défaut (is_unlocked)

Actions :
- Créer → POST /api/modules
- Modifier → PUT /api/modules/:id
- Supprimer → DELETE /api/modules/:id
- Réorganiser → PUT /api/modules/courses/:courseId/reorder
```

**Réorganisation par Drag & Drop** ⚠️ **À IMPLÉMENTER**
```
API : PUT /api/modules/courses/:courseId/reorder
Body : { modules: [{ id, order_index }] }
```

---

### **5. Gestion des Leçons**

#### **Création de Leçons** ✅
```
Route : Intégré dans CourseManagement ou ModuleManagement
Composant : LessonForm (à vérifier)
API : POST /api/lessons

Types de contenu supportés :
- 📹 Vidéo (video_url)
- 📄 Texte (content_text)
- 📝 Quiz (content_type = 'quiz')
- 🎨 H5P (h5p)
- 📋 Devoir (assignment)
- 📎 Document (document)
- 🎵 Audio (audio)
- 📊 Présentation (presentation)

Configuration :
- Cours et Module associés
- Titre, Description, Contenu
- Type de média (media_file_id si upload)
- Durée estimée
- Ordre (order_index)
- Obligatoire (is_required)
- Publiée (is_published)

Actions :
- Créer → POST /api/lessons
- Modifier → PUT /api/lessons/:id
- Supprimer → DELETE /api/lessons/:id
- Réorganiser → PUT /api/courses/:courseId/lessons/:lessonId (order_index)
```

---

### **6. Gestion des Quiz** ✅ **NOUVEAU**

#### **Création de Quiz** 
```
Composant : QuizBuilder.tsx (NOUVEAU)

Deux types de quiz :

1. Quiz Formatif 📚
   - Intégré dans une leçon
   - Non bloquant pour progression
   - Permet refaire
   - Score affiché immédiatement
   - API : POST /api/quizzes avec lesson_id

2. Quiz d'Évaluation 🎯
   - Quiz final d'un cours/module
   - Bloquant pour certificat si échoué
   - Limite de tentatives (max_attempts)
   - Score minimum requis (passing_score)
   - API : POST /api/quizzes avec is_final = true

Configuration commune :
- Titre, Description
- Score minimum (passing_score : 0-100)
- Temps limité (time_limit_minutes, 0 = illimité)
- Nombre de tentatives (max_attempts, 0 = illimité)
- Publié (is_published)

Questions supportées :
- Multiple Choice : 4 options avec 1 bonne réponse
- Vrai/Faux : 2 options (true/false)
- Réponse Courte : Texte libre

Actions :
- Créer → POST /api/quizzes
- Modifier → PUT /api/quizzes/:id
- Supprimer → DELETE /api/quizzes/:id
- Ajouter questions → POST /api/quizzes/:quizId/questions
```

---

### **7. Gestion des Étudiants** ✅

#### **Liste des Étudiants** 
```
Route : /dashboard/instructor/students
Composant : StudentManagement.tsx
API : GET /api/courses/:courseId/enrollments

Fonctionnalités :
- Sélection du cours
- Liste paginée des étudiants
- Filtres : Recherche, Statut, Tri
- Colonnes : Nom, Email, Progression, Dernier accès, Statut

Query Params supportés :
- page : Numéro de page
- limit : Nombre par page
- search : Recherche texte
- status : Statut de l'inscription
- sort : Colonne de tri
- order : ASC/DESC

Response :
{
  data: [...],
  pagination: { page, limit, total, pages }
}
```

---

### **8. Évaluations et Résultats** ✅

#### **Gestion des Évaluations**
```
Route : /dashboard/instructor/evaluations
Composant : EvaluationManagement.tsx
API : GET /api/quizzes (pour cours de l'instructeur)

Informations affichées :
- Liste des quiz par cours
- Statistiques : Tentatives, Moyennes, Taux de réussite
- Détails par étudiant
- Historique des tentatives
```

---

### **9. Analytics** ⚠️

#### **Dashboard Analytics**
```
Route : /dashboard/instructor/analytics
Composant : AnalyticsPanel.tsx
API : GET /api/analytics/instructor-dashboard

Sections disponibles :
- Cours populaires
- Progression moyenne
- Satisfaction
- Assignments (peut être vide si table absente)
```

---

### **10. Messages** ✅

#### **Messagerie**
```
Route : /dashboard/instructor/messages
Composant : Messages.tsx
API : 
- GET /api/messages/received
- GET /api/messages/sent
- POST /api/messages (direct)
- POST /api/messages?courseId=X (broadcast)

Fonctionnalités :
- Inbox : Messages reçus
- Envoyés : Messages envoyés
- Messages du cours : Broadcast aux étudiants
- Nouveau message
- Filtrage et recherche
```

---

### **11. Chat IA** ⚠️

#### **Assistant IA**
```
Route : /dashboard/instructor/chat-ai
Composant : InstructorChatIA.tsx
API : ⚠️ À INTÉGRER

Endpoints à utiliser :
- POST /api/ai/conversations { title, context? }
- GET /api/ai/conversations
- GET /api/ai/conversations/:conversationId
- POST /api/ai/conversations/:conversationId/messages

Header : Authorization: Bearer <token> OBLIGATOIRE
```

---

### **12. Profil Instructeur**

#### **Édition du Profil**
```
Route : /dashboard/instructor/profile
Composant : src/app/dashboard/instructor/profile/page.tsx
API : 
- GET /api/users/me
- PUT /api/users/me
- POST /api/users/me/avatar

Informations :
- Nom, Prénom
- Email, Téléphone
- Organisation
- Pays
- Photo de profil (upload avec validation PNG/JPEG)
- Identité : Carte ID professionnel (instructeur uniquement)
```

---

## 👨‍🎓 PARCOURS ÉTUDIANT

### **1. Authentification et Accès**

#### **Inscription** ✅
```
Route : /register
Composant : SimpleRegisterForm.tsx / MultiStepRegisterForm.tsx
API : POST /api/auth/register

Flow :
1. Sélection du rôle "Apprenant"
2. Formulaire multi-étapes ou simple
3. Vérification email automatique
4. Email de vérification envoyé
5. Clic sur lien → /verify-email?token=...
6. Vérification automatique
7. Redirection vers /login
```

#### **Connexion** ✅
```
Route : /login
Composant : LoginForm.tsx
API : POST /api/auth/login

Flow :
1. Saisie email/mot de passe
2. Connexion via API
3. Stockage tokens
4. Redirection vers /dashboard/student
```

---

### **2. Dashboard Étudiant**

#### **Page Principale** ✅
```
Route : /dashboard/student
Composant : src/app/dashboard/student/page.tsx

Informations affichées :
- Statistiques : Cours inscrits, Cours complétés, Points XP, Niveau
- Progression : Graphiques et cartes de cours
- Activités récentes : Dernières leçons suivies
- Objectifs hebdomadaires : Streaks de connexion
```

**Statistiques** :
- Total de cours
- Cours complétés
- Cours en progression
- Points XP gagnés
- Niveau actuel
- Série de connexion (streak)
- Objectif hebdomadaire et progression

---

### **3. Catalogue et Inscription**

#### **Catalogue de Cours** ✅
```
Route : /dashboard/student/courses (ou home)
Composant : CourseCatalog.tsx / CourseGrid.tsx
API : GET /api/courses

Fonctionnalités :
- Liste de tous les cours disponibles
- Filtres : Catégorie, Difficulté, Prix
- Recherche
- Trier : Popularité, Date, Prix

Inscription :
- Clic sur "S'inscrire"
- API : POST /api/courses/:courseId/enroll
- Redirection vers le cours
```

---

### **4. Suivi des Cours**

#### **Mes Cours** ✅
```
Route : /dashboard/student/courses
Composant : MyCourses.tsx
API : GET /api/courses/my

Affichage :
- Liste des cours auxquels l'étudiant est inscrit
- Progression par cours
- Statut : Non commencé, En cours, Complété
- Actions : Continuer, Voir détails

Filtres :
- Tous, Non commencé, En cours, Complété
```

---

### **5. Lecture des Leçons** ✅ **NOUVEAU**

#### **Lecteur de Leçons**
```
Composant : LessonPlayer.tsx (NOUVEAU)

Fonctionnalités :
- Affichage selon type : Vidéo, PDF, Texte, Quiz
- Tracking automatique de progression :
  - Vidéo : 80% après 80% de durée
  - Texte : 100% après défilement complet
- Compteur de temps réel
- Bouton "Marquer comme complété"
- Navigation Précédent/Suivant

Complétion automatique :
- Mise à jour progression → PUT /api/enrollments/:courseId/lesson/:lessonId
- +50 XP automatique côté backend
- Modal de félicitations avec XP gagné
- Vérification badges éligibles
- Si cours à 100% → Tentative de certificat auto
```

---

### **6. Passage des Quiz** ✅

#### **Quiz Formatif** 📚
```
Composant : QuizComponent.tsx (AMÉLIORÉ)

Caractéristiques :
- Badge bleu "Formatif"
- Intégré dans une leçon
- Non bloquant
- Permet refaire
- Score affiché immédiatement
- Feedback immédiat

Flow :
1. Affichage des questions
2. Réponses par l'étudiant
3. Soumission → PUT /api/quizzes/attempts/:attemptId
4. Calcul score côté backend
5. Affichage résultats
6. +100 XP si passé, +150 XP si score parfait
```

#### **Quiz d'Évaluation** 🎯
```
Composant : QuizComponent.tsx (AMÉLIORÉ)

Caractéristiques :
- Badge violet "Évaluation"
- Alerte : Bloquant pour certificat
- Score minimum requis affiché
- Limite de tentatives respectée
- Timer si temps limité
- Score affiché après soumission

Flow :
1. Lancer le quiz → POST /api/quizzes/:quizId/attempt
2. Répondre aux questions
3. Soumission → PUT /api/quizzes/attempts/:attemptId
4. Calcul score et is_passed
5. Affichage résultats
6. Si échoué : Message d'encouragement, Proposition refaire
7. Si réussi : Progression mis à jour, vérification certificat
```

---

### **7. Évaluations** ✅

#### **Mes Évaluations**
```
Route : /dashboard/student/evaluations
Composant : EvaluationPanel.tsx
API : GET /api/evaluations (à vérifier)

Informations affichées :
- Liste des évaluations à faire
- Historique des évaluations passées
- Statistiques : Score moyen, Total points
- Filtres : Type, Statut

Types :
- Quiz
- Devoirs
- Examens

Statuts :
- Non démarré
- En cours
- Soumis
- Noté
```

---

### **8. Progression** ✅

#### **Suivi de Progression**
```
Route : /dashboard/student/progress
Composant : ProgressPanel.tsx

Sections :
1. Progression globale
   - Courses complétés
   - Leçons complétées
   - Quiz réussis
   - Temps total passé
   
2. Progression par cours
   - Carte pour chaque cours
   - Barre de progression
   - Points clés : Leçons, Quiz, Certificat
   
3. Graphiques
   - Évolution temporelle
   - Distribution des notes
```

---

### **9. Gamification** ✅

#### **Badges et XP**
```
Route : /dashboard/student/gamification
Composant : GamificationPanel.tsx

Sections :
1. Progression personnelle
   - XP total
   - Niveau actuel
   - XP pour prochain niveau
   - Badges obtenus

2. Badges
   - Tous les badges disponibles
   - Badges obtenus (avec date)
   - Badges disponibles (avec progression)
   - Téléchargement PDF

3. Classement
   - Top 10 des apprenants
   - Position actuelle
   - XP et niveau

API :
- GET /api/gamification/xp
- GET /api/badges
- GET /api/badges/user
- GET /api/gamification/leaderboard
```

**Badges disponibles** :
- 🏆 Première Connexion
- 📚 Premier Cours Complété
- 🔥 Série de 7 Jours
- 🌟 Top du Leaderboard
- 👑 Master de la Plateforme
- 🎯 Perfectionniste
- 🚀 Contributeur Actif

**Points XP automatiques** :
- Leçon complétée : +50 XP
- Quiz réussi : +100 XP
- Quiz parfait : +150 XP
- Cours complété : +500 XP
- Badge obtenu : +200 XP

---

### **10. Certificats** ✅

#### **Mes Certificats**
```
Route : /dashboard/student/certificates
Composant : CertificateCollection.tsx

Fonctionnalités :
- Liste des certificats obtenus
- Filtres : Valides, Expirés, Tous
- Téléchargement PDF
- Vérification QR code

Génération automatique :
- Quand : Cours à 100% + Quiz final réussi
- Backend : Génère automatiquement le PDF
- QR code unique pour vérification
- Notification : "Certificat généré !"

API :
- GET /api/certificates
- GET /api/certificates/:id/download
- GET /api/certificates/verify/:code (public)
```

---

### **11. Calendrier** ✅

#### **Calendrier des Cours**
```
Route : /dashboard/student/calendar
Composant : CalendarPanel.tsx

Fonctionnalités :
- Vue mensuelle
- Événements : Échéances, Devoirs, Examens
- Navigation mois/année
- Filtres : Type d'événement
```

---

### **12. Messages** ✅

#### **Messagerie**
```
Route : /dashboard/student/messages
Composant : Messages.tsx
API :
- GET /api/messages/received
- GET /api/messages/sent
- POST /api/messages

Fonctionnalités :
- Inbox : Messages reçus
- Envoyés : Messages envoyés
- Messages du cours : Annonces broadcast
- Nouveau message
- Lecture/Marquer lu
```

---

### **13. Chat IA** ⚠️

#### **Assistant IA Personnel**
```
Route : /dashboard/student/chat-ai
Composant : ChatIA.tsx (actuellement chatIAService appel OpenAI direct)

Fonctionnalités actuelles :
- Chat direct avec OpenAI GPT-4o-mini
- Résumé de cours
- Recommandations personnalisées
- Réponses contextuelles

À INTÉGRER :
- Service de conversations côté backend
- GET /api/ai/conversations
- POST /api/ai/conversations/:conversationId/messages
- Header Authorization obligatoire
```

---

### **14. Profil Étudiant** ✅

#### **Édition du Profil**
```
Route : /dashboard/student/profile
Composant : src/app/dashboard/student/profile/page.tsx
API :
- GET /api/users/me
- PUT /api/users/me
- POST /api/users/me/avatar

Informations :
- Nom, Prénom
- Email, Téléphone
- Organisation, Pays
- Photo de profil (upload avec validation PNG/JPEG)
```

---

## 🔄 FLUX COMPLETS

### **FLUX INSTRUCTEUR : Création d'un Cours Certifiant** 

```
1. Inscription & Connexion
   ↓
2. Dashboard Instructeur
   ↓
3. Créer un Cours
   - Informations générales
   - Configuration
   - Dates et prérequis
   ↓
4. Créer des Modules
   - Module 1, 2, 3...
   - Image d'identification
   - Ordre
   ↓
5. Pour chaque Module :
   a. Créer des Leçons
      - Vidéo, PDF, Texte...
      - Ordre
      - Obligatoire
   
   b. Créer des Quiz Formatifs (optionnel)
      - Titre, Description
      - Questions MCQ/Vrai-Faux
      - Points
      - Publié
   
   c. Créer le Quiz d'Évaluation Final
      - is_final = true
      - passing_score = 70
      - max_attempts = 3
      - Bloquant pour certificat
   ↓
6. Publier le Cours
   ↓
7. Gérer les Étudiants
   - Voir inscriptions
   - Suivre progression
   ↓
8. Consulter Analytics
   - Statistiques globales
   - Performance des quiz
```

---

### **FLUX ÉTUDIANT : Compléter un Cours et Obtenir un Certificat**

```
1. Inscription & Connexion
   ↓
2. Dashboard Étudiant
   ↓
3. Parcourir le Catalogue
   - Filtrer par catégorie
   - Rechercher
   ↓
4. S'inscrire à un Cours
   ↓
5. Suivre les Modules dans l'ordre
   ↓
6. Pour chaque Leçon :
   a. Consulter le contenu
      - Vidéo : Player intégré
      - PDF : Lecteur
      - Texte : Affichage
   
   b. Marquer comme complété
      → +50 XP automatique
      → Progression mise à jour
   
   c. Passer Quiz Formatif (si présent)
      → Score immédiat
      → +100 XP si passé
      → +150 XP si parfait
   ↓
7. Passer le Quiz d'Évaluation Final
   - Timer affiché
   - Score minimum requis affiché
   - Tentative compte
   ↓
8. Résultats du Quiz
   Si ÉCHOUÉ :
   - Message d'encouragement
   - Proposition refaire (si tentatives restantes)
   
   Si RÉUSSI :
   - Félicitations
   - +100 XP ou +150 XP si parfait
   - Progression mis à jour
   ↓
9. Vérification Cours à 100%
   → Certificat généré automatiquement
   → Notification : "Certificat prêt !"
   → +500 XP
   → Badge "Cours Complété"
   ↓
10. Consulter Mes Certificats
    - Télécharger PDF
    - Vérifier QR code
   ↓
11. Consulter Mes Badges
    - Voir collection
    - Télécharger PDF des badges
   ↓
12. Consulter Classement
    - Top 10
    - Position actuelle
```

---

## 🎯 POINTS CLÉS

### **Pour les Instructeurs** 👨‍🏫

1. **Création** : Cours → Modules → Leçons → Quiz
2. **Quiz** : Distinguer Formatif (apprentissage) vs Évaluation (certification)
3. **Configuration** : Score minimum, tentatives, temps pour quiz évaluation
4. **Publication** : Marquer le cours comme publié
5. **Suivi** : Analytics et gestion étudiants
6. **Messages** : Broadcast aux étudiants du cours

### **Pour les Étudiants** 👨‍🎓

1. **Apprentissage** : Suivre les leçons dans l'ordre
2. **Progression** : Marquage "complété" automatique ou manuel
3. **Quiz** : Formatifs pour apprendre, Évaluation pour valider
4. **Motivation** : XP, badges, classement, streaks
5. **Certification** : Générée automatiquement à 100%
6. **Collaboration** : Messages avec instructeur

---

## 📊 STATISTIQUES DE SUIVI

### **Instructeur Peut Voir** :
- Nombre d'étudiants inscrits
- Progression moyenne par cours
- Taux de complétion
- Statistiques de quiz (moyennes, taux de réussite)
- Revenus (si cours payant)

### **Étudiant Peut Voir** :
- Progression globale
- XP gagné et niveau
- Badges obtenus
- Certificats générés
- Position dans le classement
- Temps total passé sur la plateforme
- Streaks de connexion

---

## 🔗 NAVIGATION COMPLÈTE

### **Menu Instructeur** :
```
📊 Dashboard → /
📚 Mes Cours → /courses
📝 Nouveau Cours → /courses (modal)
👥 Étudiants → /students
✅ Évaluations → /evaluations
📈 Analytics → /analytics
💬 Messages → /messages
🤖 Chat IA → /chat-ai
⚙️ Paramètres → /settings
👤 Profil → /profile
🔐 Déconnexion
```

### **Menu Étudiant** :
```
📊 Dashboard → /
📚 Cours → /courses
📖 Mes Cours → /courses
📊 Progression → /progress
📅 Calendrier → /calendar
✅ Évaluations → /evaluations
🏆 Gamification → /gamification
📜 Certificats → /certificates
💬 Messages → /messages
🤖 Chat IA → /chat-ai
👤 Profil → /profile
🔐 Déconnexion
```

---

**Dernière mise à jour** : 30 octobre 2025  
**Statut** : ✅ Parcours complets implémentés  
**Notes** : Les composants marqués ⚠️ nécessitent vérification/intégration


