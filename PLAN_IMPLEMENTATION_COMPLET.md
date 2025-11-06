# 🚀 Plan d'Implémentation Complet - Plateforme MdSC MOOC

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Analyse de l'Existant](#analyse-de-lexistant)
3. [Architecture Cible](#architecture-cible)
4. [Plan Frontend](#plan-frontend)
5. [Plan Backend](#plan-backend)
6. [Ordre d'Implémentation](#ordre-dimplémentation)
7. [Checklist de Développement](#checklist-de-développement)

---

## 🎯 Vue d'Ensemble

### Objectif
Implémenter toutes les fonctionnalités décrites dans `PARCOURS_UTILISATEURS.md` en suivant un plan structuré et professionnel, en s'appuyant sur l'existant et en ajoutant les fonctionnalités manquantes.

### Principes Directeurs
- ✅ **Réutiliser l'existant** : Analyser et adapter les composants/services déjà présents
- ✅ **Développement incrémental** : Implémenter par phases avec des jalons fonctionnels
- ✅ **Tests à chaque étape** : Valider chaque fonctionnalité avant de passer à la suivante
- ✅ **Documentation continue** : Documenter chaque ajout/modification

---

## 🔍 Analyse de l'Existant

### Frontend - Éléments Déjà Présents

#### ✅ Services API Existants
- `authService.ts` - Authentification (inscription, connexion, OAuth)
- `courseService.ts` - Gestion des cours (CRUD basique)
- `moduleService.ts` - Gestion des modules
- `enrollmentService.ts` - Inscriptions
- `progressService.ts` - Progression
- `evaluationService.ts` - Évaluations
- `quizService.ts` - Quiz
- `certificateService.ts` - Certificats
- `gamificationService.ts` - Gamification
- `messageService.ts` - Messages
- `chatIAService.ts` - Assistant IA
- `analyticsService.ts` - Analytics
- `mediaService.ts` - Médias

#### ✅ Composants Existants
- **Authentification** : LoginForm, RegisterForm, GoogleLoginButton, EmailVerification
- **Dashboard** : DashboardLayout, DashboardStats
- **Instructeur** : CourseManagement, ModuleManagement, LessonManagement, AnalyticsPanel
- **Étudiant** : MyCourses, ProgressPanel, LessonPlayer, ModuleCatalog
- **Admin** : CourseModeration, UserManagement
- **UI** : Button, Modal, DataTable, etc.

#### ❌ Fonctionnalités Manquantes à Implémenter
1. Connexion Admin séparée (`/admin/login`)
2. Système de paiement (carte + mobile money)
3. Quiz de modules (optionnel, pour badges)
4. Évaluation finale obligatoire
5. Validation admin avant publication
6. Progression séquentielle (leçons verrouillées)
7. Demande et validation de certificats
8. Messagerie avec email comme identifiant
9. Type de cours (Live vs à la demande)
10. Gestion des dates obligatoires pour cours Live

### Backend - À Implémenter

#### ✅ Endpoints Probablement Existants
- Authentification (login, register, OAuth)
- Gestion des cours (CRUD basique)
- Gestion des modules et leçons
- Inscriptions

#### ❌ Endpoints Manquants à Créer
1. Système de paiement (initiation, webhooks, vérification)
2. Validation admin (approbation/rejet de cours)
3. Quiz de modules
4. Évaluation finale
5. Progression séquentielle
6. Certificats (demande, validation, génération)
7. Messagerie par email
8. Type de cours et validation conditionnelle

---

## 🏗️ Architecture Cible

### Structure Frontend
```
src/
├── app/
│   ├── admin/
│   │   └── login/                    # NOUVEAU : Connexion admin séparée
│   ├── auth/
│   │   ├── google/
│   │   │   └── callback/            # Existant
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── courses/                      # Existant
│   ├── dashboard/
│   │   ├── instructor/              # Existant (à enrichir)
│   │   ├── student/                 # Existant (à enrichir)
│   │   └── admin/                   # Existant (à enrichir)
│   └── instructor/
│       └── courses/
│           └── [courseId]/          # Existant (à enrichir)
├── components/
│   ├── auth/
│   │   └── AdminLoginForm.tsx       # NOUVEAU
│   ├── payments/                    # NOUVEAU : Composants de paiement
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   └── PaymentSuccess.tsx
│   ├── dashboard/
│   │   ├── instructor/
│   │   │   ├── EvaluationBuilder.tsx # NOUVEAU : Création évaluation finale
│   │   │   └── ModuleQuizBuilder.tsx # NOUVEAU : Quiz de module
│   │   └── student/
│   │       └── CertificateRequest.tsx # NOUVEAU
│   └── messages/
│       └── MessageComposer.tsx      # NOUVEAU : Avec recherche par email
└── lib/
    ├── services/
    │   ├── paymentService.ts        # NOUVEAU
    │   └── adminService.ts          # NOUVEAU : Services admin
```

### Structure Backend
```
backend/
├── routes/
│   ├── auth/
│   │   └── adminAuth.js             # NOUVEAU : Route admin séparée
│   ├── payments/                    # NOUVEAU
│   │   ├── paymentRoutes.js
│   │   └── webhookRoutes.js
│   ├── courses/
│   │   ├── courseRoutes.js          # Existant (à enrichir)
│   │   └── courseApprovalRoutes.js  # NOUVEAU
│   ├── modules/
│   │   └── moduleQuizRoutes.js      # NOUVEAU
│   ├── evaluations/
│   │   └── evaluationRoutes.js      # Existant (à enrichir)
│   ├── certificates/                # NOUVEAU
│   │   └── certificateRoutes.js
│   └── messages/
│       └── messageRoutes.js         # Existant (à enrichir)
├── models/
│   ├── Course.js                    # Existant (à modifier)
│   ├── Payment.js                   # NOUVEAU
│   ├── CourseApproval.js            # NOUVEAU
│   ├── ModuleQuiz.js                # NOUVEAU
│   ├── CertificateRequest.js        # NOUVEAU
│   └── Message.js                   # Existant (à modifier)
└── controllers/
    └── (correspondants aux routes)
```

---

## 💻 Plan Frontend

### Phase 1 : Authentification et Sécurité (Priorité 1)

#### 1.1 Connexion Admin Séparée
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/app/admin/login/page.tsx` - Page de connexion admin
- `src/components/auth/AdminLoginForm.tsx` - Formulaire de connexion admin avec 2FA

**Modifications :**
- `src/lib/services/authService.ts` - Ajouter méthode `adminLogin()`
- `src/lib/middleware/auth.tsx` - Ajouter guard pour admin
- `src/lib/stores/authStore.ts` - Gérer la session admin séparément

**Fonctionnalités :**
- ✅ Route `/admin/login` séparée
- ✅ Formulaire avec 2FA obligatoire
- ✅ Validation email admin (domaine spécifique ou liste blanche)
- ✅ Pas de connexion sociale
- ✅ Session timeout 30 minutes
- ✅ Logs de connexion

#### 1.2 Amélioration Authentification Existante
**Fichiers à modifier :**
- `src/components/auth/LoginForm.tsx` - S'assurer que Google OAuth fonctionne
- `src/components/auth/EmailVerification.tsx` - Vérifier le flux complet

---

### Phase 2 : Gestion des Cours - Type et Dates (Priorité 1)

#### 2.1 Ajout Type de Cours (Live/On Demand)
**Fichiers à modifier :**

**Composants :**
- `src/components/dashboard/instructor/CourseManagement.tsx`
  - Ajouter champ "Type de cours" dans le formulaire
  - Afficher conditionnellement les champs de dates selon le type
  - Validation conditionnelle

- `src/app/instructor/courses/[courseId]/page.tsx`
  - Ajouter sélection du type dans l'onglet Paramètres
  - Gestion conditionnelle des dates

**Services :**
- `src/lib/services/courseService.ts`
  - Interface `Course` : ajouter `course_type?: 'live' | 'on_demand'`
  - Méthodes `createCourse()` et `updateCourse()` : gérer le type

**Types :**
- `src/types/course.ts` (ou créer si n'existe pas)
  - Ajouter `course_type` dans l'interface Course

#### 2.2 Validation Conditionnelle des Dates
**Modifications :**
- Logique de validation dans les formulaires
- Affichage conditionnel des champs selon `course_type`
- Messages d'erreur spécifiques

---

### Phase 3 : Quiz de Modules et Évaluation Finale (Priorité 1)

#### 3.1 Quiz de Modules (Optionnel)
**Fichiers à créer :**

**Nouveau :**
- `src/components/dashboard/instructor/ModuleQuizBuilder.tsx`
  - Création de quiz pour un module
  - Gestion des questions (QCM, vrai/faux, réponse courte)
  - Association avec badge
  - Score minimum requis

**Modifications :**
- `src/app/instructor/courses/[courseId]/page.tsx`
  - Onglet Modules : Ajouter bouton "Créer un quiz" pour chaque module
  - Modal ou page dédiée pour créer/modifier le quiz

- `src/lib/services/moduleService.ts`
  - Ajouter `createModuleQuiz(moduleId, quizData)`
  - Ajouter `getModuleQuiz(moduleId)`
  - Ajouter `updateModuleQuiz(quizId, quizData)`

**Services :**
- `src/lib/services/quizService.ts` (existant, à enrichir)
  - Méthodes pour gérer les quiz de modules

#### 3.2 Évaluation Finale (OBLIGATOIRE)
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/dashboard/instructor/EvaluationBuilder.tsx`
  - Création de l'évaluation finale du cours
  - Gestion des questions (même structure que quiz)
  - Configuration : score minimum, durée, tentatives

**Modifications :**
- `src/app/instructor/courses/[courseId]/page.tsx`
  - Onglet "Évaluations" : Afficher l'évaluation existante ou bouton de création
  - Validation : bloquer la publication si évaluation non créée

- `src/lib/services/evaluationService.ts` (existant, à enrichir)
  - `createCourseEvaluation(courseId, evaluationData)` - OBLIGATOIRE
  - `getCourseEvaluation(courseId)`
  - `updateCourseEvaluation(evaluationId, data)`
  - Validation : un cours ne peut avoir qu'une seule évaluation

---

### Phase 4 : Validation Admin et Publication (Priorité 1)

#### 4.1 Demande de Publication
**Fichiers à modifier :**

- `src/app/instructor/courses/[courseId]/page.tsx`
  - Onglet Paramètres : Bouton "Demander la publication"
  - Vérifier toutes les conditions avant de permettre la demande
  - Afficher le statut (Brouillon, En attente, Approuvé, Rejeté)

- `src/lib/services/courseService.ts`
  - `requestCoursePublication(courseId)` - Mettre le statut à "pending_approval"
  - Validation côté frontend avant envoi

- `src/components/dashboard/instructor/CourseManagement.tsx`
  - Afficher le statut "En attente de validation"
  - Afficher les commentaires de rejet si rejeté

#### 4.2 Interface Admin - Validation des Cours
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/dashboard/admin/CourseApprovalPanel.tsx`
  - Liste des cours en attente
  - Prévisualisation du cours
  - Boutons Approuver/Rejeter
  - Zone de commentaires

**Modifications :**
- `src/app/dashboard/admin/courses/page.tsx`
  - Intégrer CourseApprovalPanel
  - Filtrer les cours en attente

- `src/lib/services/adminService.ts` (créer si n'existe pas)
  - `getPendingCourses()`
  - `approveCourse(courseId, comments)`
  - `rejectCourse(courseId, rejectionReason, comments)`

---

### Phase 5 : Système de Paiement (Priorité 1)

#### 5.1 Composants de Paiement
**Fichiers à créer :**

- `src/components/payments/PaymentMethodSelector.tsx`
  - Sélection : Carte bancaire ou Mobile Money
  - Affichage des options selon le provider

- `src/components/payments/PaymentForm.tsx`
  - Formulaire de paiement (carte)
  - Formulaire de paiement (mobile money)
  - Intégration avec passerelle de paiement

- `src/components/payments/PaymentSuccess.tsx`
  - Confirmation de paiement
  - Redirection vers le cours

- `src/app/payments/[paymentId]/page.tsx`
  - Page de paiement
  - Vérification du statut
  - Redirection après paiement

#### 5.2 Service de Paiement
**Fichiers à créer :**

- `src/lib/services/paymentService.ts`
  - `initiatePayment(courseId, paymentMethod, paymentProvider)`
  - `verifyPayment(paymentId)`
  - `getPaymentStatus(paymentId)`
  - `getMyPayments()`

#### 5.3 Intégration dans le Flux d'Inscription
**Modifications :**

- `src/app/courses/[slug]/page.tsx`
  - Bouton "S'inscrire" : Si cours payant → Redirection vers paiement
  - Si cours gratuit → Inscription directe

- `src/lib/services/enrollmentService.ts`
  - Modifier `enroll()` pour accepter `paymentId` optionnel
  - Vérifier le statut de paiement si cours payant

---

### Phase 6 : Progression Séquentielle (Priorité 1)

#### 6.1 Vérification d'Accès aux Leçons
**Fichiers à modifier :**

- `src/components/dashboard/student/LessonPlayer.tsx`
  - Vérifier l'accès avant d'afficher la leçon
  - Afficher message si leçon verrouillée
  - Vérifier que toutes les leçons précédentes sont complétées

- `src/components/courses/CoursePlayer.tsx`
  - Liste des leçons avec indicateurs verrouillés/déverrouillés
  - Icône cadenas pour les leçons verrouillées
  - Désactiver le clic sur les leçons verrouillées

#### 6.2 Service de Progression
**Modifications :**

- `src/lib/services/progressService.ts`
  - `checkLessonAccess(enrollmentId, lessonId)` - Vérifier l'accès
  - `completeLesson(enrollmentId, lessonId)` - Déverrouiller la suivante
  - `getUnlockedLessons(enrollmentId, courseId)` - Liste des leçons déverrouillées

#### 6.3 Complétion de Leçon
**Modifications :**

- `src/components/dashboard/student/LessonPlayer.tsx`
  - Après complétion : Appeler `completeLesson()`
  - Déverrouiller automatiquement la leçon suivante
  - Afficher modal de félicitations avec badge si applicable

---

### Phase 7 : Quiz de Modules - Côté Étudiant (Priorité 2)

#### 7.1 Interface Quiz de Module
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/dashboard/student/ModuleQuizPlayer.tsx`
  - Affichage du quiz d'un module
  - Questions interactives
  - Calcul du score
  - Attribution de badge si score suffisant

**Modifications :**
- `src/components/courses/CoursePlayer.tsx`
  - Afficher le quiz à la fin d'un module (si existe)
  - Bouton "Passer le quiz" après complétion du module

- `src/lib/services/quizService.ts`
  - `getModuleQuiz(moduleId)`
  - `submitModuleQuiz(enrollmentId, moduleId, answers)`
  - Retourner le score et le badge obtenu

---

### Phase 8 : Évaluation Finale - Côté Étudiant (Priorité 2)

#### 8.1 Interface Évaluation
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/dashboard/student/CourseEvaluationPlayer.tsx`
  - Affichage de l'évaluation finale
  - Gestion du temps (si limité)
  - Soumission de l'évaluation
  - Affichage du score

**Modifications :**
- `src/components/courses/CoursePlayer.tsx`
  - Afficher l'évaluation finale à la fin du cours
  - Vérifier que toutes les leçons sont complétées
  - Vérifier que tous les quiz de modules sont validés

- `src/lib/services/evaluationService.ts`
  - `getCourseEvaluation(courseId)`
  - `submitEvaluation(enrollmentId, courseId, answers)`
  - Vérifier le nombre de tentatives
  - Retourner le score et si éligible pour certificat

---

### Phase 9 : Certificats (Priorité 2)

#### 9.1 Demande de Certificat
**Fichiers à créer :**

- `src/components/dashboard/student/CertificateRequest.tsx`
  - Formulaire de demande de certificat
  - Vérification des informations personnelles
  - Affichage des conditions d'éligibilité
  - Soumission de la demande

**Modifications :**
- `src/app/dashboard/student/certificates/page.tsx`
  - Afficher les certificats obtenus
  - Afficher les demandes en attente
  - Bouton "Demander un certificat" si éligible

- `src/lib/services/certificateService.ts`
  - `checkEligibility(enrollmentId)` - Vérifier les conditions
  - `requestCertificate(enrollmentId, userInfo)`
  - `getMyCertificates()`
  - `getCertificateRequests()` - Liste des demandes

#### 9.2 Validation Admin des Certificats
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/dashboard/admin/CertificateApprovalPanel.tsx`
  - Liste des demandes en attente
  - Vérification des informations
  - Boutons Approuver/Rejeter
  - Génération du certificat PDF

**Modifications :**
- `src/app/dashboard/admin/certificates/page.tsx`
  - Intégrer CertificateApprovalPanel

- `src/lib/services/adminService.ts`
  - `getPendingCertificateRequests()`
  - `approveCertificateRequest(requestId)`
  - `rejectCertificateRequest(requestId, reason)`
  - `generateCertificate(requestId)` - Génération PDF

---

### Phase 10 : Messagerie avec Email (Priorité 2)

#### 10.1 Recherche par Email
**Fichiers à créer/modifier :**

**Nouveau :**
- `src/components/messages/MessageComposer.tsx`
  - Recherche d'utilisateur par email
  - Composition de message
  - Envoi de message

- `src/components/messages/MessageList.tsx`
  - Liste des conversations organisées par email
  - Affichage des messages

**Modifications :**
- `src/components/dashboard/shared/Messages.tsx`
  - Intégrer recherche par email
  - Organiser les conversations par email

- `src/lib/services/messageService.ts`
  - `searchUserByEmail(email)` - Rechercher un utilisateur
  - `sendMessage(recipientEmail, message)`
  - `getConversation(userEmail)` - Récupérer la conversation
  - `getMyConversations()` - Liste des conversations (par email)

---

### Phase 11 : Améliorations et Finitions (Priorité 3)

#### 11.1 Dashboard Instructeur Enrichi
**Modifications :**
- `src/app/dashboard/instructor/page.tsx`
  - Enrichir les statistiques
  - Ajouter graphiques de tendances
  - Activités récentes détaillées

#### 11.2 Dashboard Étudiant Enrichi
**Modifications :**
- `src/app/dashboard/student/page.tsx`
  - Enrichir les statistiques personnelles
  - Graphiques de progression

#### 11.3 Gamification
**Modifications :**
- Intégrer l'attribution de badges après quiz de modules
- Points XP après complétion de leçons
- Tableaux de classement

---

## 🔧 Plan Backend

### Phase 1 : Base de Données et Modèles (Priorité 1)

#### 1.1 Migration Base de Données
**Fichiers SQL à créer :**

```sql
-- Ajout colonnes dans courses
ALTER TABLE courses 
ADD COLUMN course_type ENUM('live', 'on_demand') DEFAULT 'on_demand',
ADD COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'published') DEFAULT 'draft',
ADD COLUMN approved_by INT NULL,
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD COLUMN evaluation_id INT NULL;

-- Table course_approvals
CREATE TABLE course_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  admin_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT NULL,
  comments TEXT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Table module_quizzes
CREATE TABLE module_quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INT DEFAULT 70,
  badge_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Table course_evaluations (si n'existe pas)
CREATE TABLE course_evaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INT DEFAULT 70,
  duration_minutes INT NULL,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table payments
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  payment_method ENUM('card', 'mobile_money') NOT NULL,
  payment_provider VARCHAR(50) NULL,
  provider_transaction_id VARCHAR(255) NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Table certificate_requests
CREATE TABLE certificate_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
  user_info JSON NOT NULL,
  rejection_reason TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  issued_at TIMESTAMP NULL,
  certificate_number VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Table certificates
CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL UNIQUE,
  enrollment_id INT NOT NULL,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  pdf_url VARCHAR(255) NOT NULL,
  qr_code VARCHAR(255) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES certificate_requests(id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Table lesson_progress (si n'existe pas)
CREATE TABLE lesson_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  lesson_id INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  time_spent_seconds INT DEFAULT 0,
  last_accessed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment_lesson (enrollment_id, lesson_id)
);

-- Table messages (modifier pour utiliser email)
ALTER TABLE messages 
ADD COLUMN sender_email VARCHAR(255) NOT NULL,
ADD COLUMN recipient_email VARCHAR(255) NOT NULL,
ADD INDEX idx_sender_email (sender_email),
ADD INDEX idx_recipient_email (recipient_email);
```

#### 1.2 Modèles Backend
**Fichiers à créer/modifier :**

- `models/Course.js` - Ajouter `course_type`, `status`, etc.
- `models/Payment.js` - NOUVEAU
- `models/CourseApproval.js` - NOUVEAU
- `models/ModuleQuiz.js` - NOUVEAU
- `models/CertificateRequest.js` - NOUVEAU
- `models/Certificate.js` - NOUVEAU
- `models/LessonProgress.js` - NOUVEAU ou modifier
- `models/Message.js` - Modifier pour utiliser email

---

### Phase 2 : Authentification Admin (Priorité 1)

#### 2.1 Route Admin Séparée
**Fichiers à créer :**

- `routes/auth/adminAuth.js`
  - `POST /api/admin/auth/login` - Connexion admin avec 2FA
  - `POST /api/admin/auth/verify-2fa` - Vérification 2FA
  - `POST /api/admin/auth/logout` - Déconnexion

**Contrôleur :**
- `controllers/adminAuthController.js`
  - Vérification email admin (domaine ou liste blanche)
  - Génération code 2FA
  - Validation 2FA
  - Génération JWT admin

**Middleware :**
- `middleware/adminAuth.js`
  - Vérification token admin
  - Vérification rôle admin
  - Session timeout 30 minutes

---

### Phase 3 : Gestion des Cours - Type et Dates (Priorité 1)

#### 3.1 Endpoints Cours Enrichis
**Fichiers à modifier :**

- `routes/courses/courseRoutes.js`
  - `POST /api/instructor/courses` - Ajouter `course_type`
  - `PUT /api/instructor/courses/:id` - Gérer `course_type`
  - Validation conditionnelle selon le type

**Contrôleur :**
- `controllers/courseController.js`
  - Validation : Si `course_type = 'live'`, vérifier dates obligatoires
  - Si `course_type = 'on_demand'`, dates optionnelles

---

### Phase 4 : Quiz de Modules et Évaluation (Priorité 1)

#### 4.1 Endpoints Quiz de Modules
**Fichiers à créer :**

- `routes/modules/moduleQuizRoutes.js`
  - `POST /api/instructor/modules/:moduleId/quiz` - Créer un quiz
  - `GET /api/instructor/modules/:moduleId/quiz` - Obtenir le quiz
  - `PUT /api/instructor/modules/:moduleId/quiz/:quizId` - Modifier
  - `DELETE /api/instructor/modules/:moduleId/quiz/:quizId` - Supprimer

**Contrôleur :**
- `controllers/moduleQuizController.js`
  - Création, lecture, modification, suppression
  - Association avec badge

#### 4.2 Endpoints Évaluation Finale
**Fichiers à créer/modifier :**

- `routes/evaluations/evaluationRoutes.js`
  - `POST /api/instructor/courses/:courseId/evaluation` - Créer (OBLIGATOIRE)
  - `GET /api/instructor/courses/:courseId/evaluation` - Obtenir
  - `PUT /api/instructor/evaluations/:id` - Modifier
  - Validation : Un cours = une évaluation

**Contrôleur :**
- `controllers/evaluationController.js`
  - Création avec validation d'unicité
  - Gestion des questions et réponses

---

### Phase 5 : Validation Admin (Priorité 1)

#### 5.1 Endpoints Validation Cours
**Fichiers à créer :**

- `routes/courses/courseApprovalRoutes.js`
  - `POST /api/instructor/courses/:id/request-publication` - Demande de publication
  - `GET /api/admin/courses/pending` - Liste des cours en attente
  - `POST /api/admin/courses/:id/approve` - Approuver
  - `POST /api/admin/courses/:id/reject` - Rejeter

**Contrôleur :**
- `controllers/courseApprovalController.js`
  - Vérifier conditions avant demande
  - Validation admin
  - Mise à jour du statut
  - Notification instructeur

**Validations à effectuer :**
- Au moins un module avec au moins une leçon
- Évaluation finale créée
- Si cours Live : dates obligatoires + max_students

---

### Phase 6 : Système de Paiement (Priorité 1)

#### 6.1 Endpoints Paiement
**Fichiers à créer :**

- `routes/payments/paymentRoutes.js`
  - `POST /api/payments/initiate` - Initier un paiement
  - `GET /api/payments/:id/status` - Vérifier le statut
  - `GET /api/payments/my-payments` - Historique

- `routes/payments/webhookRoutes.js`
  - `POST /api/payments/webhook/:provider` - Webhook provider
  - Vérification signature
  - Mise à jour statut
  - Création automatique d'inscription si succès

**Contrôleur :**
- `controllers/paymentController.js`
  - Initiation de paiement
  - Intégration avec passerelle (Stripe, Mobile Money)
  - Gestion des webhooks
  - Association paiement/inscription

**Services :**
- `services/paymentProviders/stripeService.js` - Intégration Stripe
- `services/paymentProviders/mobileMoneyService.js` - Intégration Mobile Money

---

### Phase 7 : Progression Séquentielle (Priorité 1)

#### 7.1 Endpoints Progression
**Fichiers à modifier/créer :**

- `routes/progress/progressRoutes.js`
  - `GET /api/enrollments/:enrollmentId/lessons/:lessonId/access` - Vérifier accès
  - `POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete` - Compléter
  - `GET /api/enrollments/:enrollmentId/progress` - Obtenir progression

**Contrôleur :**
- `controllers/progressController.js`
  - `checkLessonAccess()` :
    - Vérifier que l'utilisateur est inscrit
    - Si progression séquentielle : vérifier que toutes les leçons précédentes sont complétées
    - Exception : leçons optionnelles peuvent être sautées
  
  - `completeLesson()` :
    - Marquer la leçon comme complétée
    - Recalculer la progression globale
    - Déverrouiller la leçon suivante
    - Attribuer XP (gamification)

---

### Phase 8 : Quiz de Modules - Côté Étudiant (Priorité 2)

#### 8.1 Endpoints Quiz Étudiant
**Fichiers à modifier :**

- `routes/quiz/quizRoutes.js`
  - `GET /api/enrollments/:enrollmentId/modules/:moduleId/quiz` - Obtenir le quiz
  - `POST /api/enrollments/:enrollmentId/modules/:moduleId/quiz/attempt` - Soumettre

**Contrôleur :**
- `controllers/quizController.js`
  - Calculer le score
  - Si score >= passing_score : attribuer badge
  - Enregistrer la tentative
  - Retourner résultat et badge obtenu

---

### Phase 9 : Évaluation Finale - Côté Étudiant (Priorité 2)

#### 9.1 Endpoints Évaluation Étudiant
**Fichiers à modifier :**

- `routes/evaluations/evaluationRoutes.js`
  - `GET /api/enrollments/:enrollmentId/evaluation` - Obtenir l'évaluation
  - `POST /api/enrollments/:enrollmentId/evaluation/attempt` - Soumettre

**Contrôleur :**
- `controllers/evaluationController.js`
  - Vérifier que toutes les leçons sont complétées
  - Vérifier que tous les quiz de modules sont validés
  - Vérifier le nombre de tentatives
  - Calculer le score
  - Si score >= passing_score : marquer comme éligible pour certificat

---

### Phase 10 : Certificats (Priorité 2)

#### 10.1 Endpoints Certificats
**Fichiers à créer :**

- `routes/certificates/certificateRoutes.js`
  - `GET /api/certificates/eligibility/:enrollmentId` - Vérifier éligibilité
  - `POST /api/certificates/request` - Demander un certificat
  - `GET /api/certificates/my-certificates` - Mes certificats
  - `GET /api/certificates/verify/:certificateNumber` - Vérifier (public)

- `routes/certificates/adminCertificateRoutes.js`
  - `GET /api/admin/certificates/pending` - Demandes en attente
  - `POST /api/admin/certificates/:requestId/approve` - Approuver
  - `POST /api/admin/certificates/:requestId/reject` - Rejeter

**Contrôleur :**
- `controllers/certificateController.js`
  - Vérification éligibilité
  - Création de demande
  - Validation admin
  - Génération PDF
  - Génération QR code
  - Numéro de série unique

**Services :**
- `services/certificateGenerator.js` - Génération PDF
- `services/qrCodeGenerator.js` - Génération QR code

---

### Phase 11 : Messagerie avec Email (Priorité 2)

#### 11.1 Endpoints Messagerie
**Fichiers à modifier :**

- `routes/messages/messageRoutes.js`
  - `GET /api/messages/search-user/:email` - Rechercher par email
  - `POST /api/messages/send` - Envoyer (avec email destinataire)
  - `GET /api/messages/conversation/:email` - Obtenir conversation
  - `GET /api/messages/my-conversations` - Liste (organisée par email)

**Contrôleur :**
- `controllers/messageController.js`
  - Recherche d'utilisateur par email
  - Envoi de message avec email comme identifiant
  - Organisation des conversations par email

**Modifications Base de Données :**
- Table `messages` : utiliser `sender_email` et `recipient_email` comme identifiants principaux

---

## 📅 Ordre d'Implémentation

### Sprint 1 : Fondations (Semaine 1-2)
1. ✅ **Phase 1 Backend** : Migration BDD et modèles
2. ✅ **Phase 1 Frontend** : Connexion admin séparée
3. ✅ **Phase 2 Backend** : Authentification admin
4. ✅ **Phase 2 Frontend** : Type de cours et dates conditionnelles

### Sprint 2 : Contenu et Validation (Semaine 3-4)
5. ✅ **Phase 3 Frontend** : Quiz de modules et évaluation finale
6. ✅ **Phase 4 Backend** : Endpoints quiz et évaluation
7. ✅ **Phase 5 Backend** : Validation admin
8. ✅ **Phase 4 Frontend** : Interface validation admin

### Sprint 3 : Paiement et Accès (Semaine 5-6)
9. ✅ **Phase 6 Backend** : Système de paiement
10. ✅ **Phase 5 Frontend** : Composants de paiement
11. ✅ **Phase 7 Backend** : Progression séquentielle
12. ✅ **Phase 6 Frontend** : Vérification d'accès aux leçons

### Sprint 4 : Quiz et Évaluations Étudiants (Semaine 7-8)
13. ✅ **Phase 8 Backend** : Quiz côté étudiant
14. ✅ **Phase 7 Frontend** : Interface quiz de module
15. ✅ **Phase 9 Backend** : Évaluation côté étudiant
16. ✅ **Phase 8 Frontend** : Interface évaluation finale

### Sprint 5 : Certificats et Messagerie (Semaine 9-10)
17. ✅ **Phase 10 Backend** : Certificats
18. ✅ **Phase 9 Frontend** : Demande et validation certificats
19. ✅ **Phase 11 Backend** : Messagerie par email
20. ✅ **Phase 10 Frontend** : Interface messagerie

### Sprint 6 : Finitions et Tests (Semaine 11-12)
21. ✅ **Phase 11 Frontend** : Améliorations dashboard
22. ✅ Tests d'intégration complets
23. ✅ Tests de performance
24. ✅ Documentation finale

---

## ✅ Checklist de Développement

### Frontend

#### Phase 1 : Authentification
- [ ] Créer `/admin/login` page
- [ ] Créer `AdminLoginForm` avec 2FA
- [ ] Ajouter `adminLogin()` dans `authService`
- [ ] Ajouter guard admin dans middleware
- [ ] Tester la connexion admin séparée

#### Phase 2 : Type de Cours
- [ ] Ajouter champ `course_type` dans `CourseManagement`
- [ ] Ajouter logique conditionnelle pour dates
- [ ] Modifier `Course` interface avec `course_type`
- [ ] Tester validation conditionnelle

#### Phase 3 : Quiz et Évaluation
- [ ] Créer `ModuleQuizBuilder` component
- [ ] Créer `EvaluationBuilder` component
- [ ] Ajouter onglet Évaluations dans page cours
- [ ] Ajouter services pour quiz et évaluation
- [ ] Tester création quiz et évaluation

#### Phase 4 : Validation Admin
- [ ] Créer `CourseApprovalPanel` component
- [ ] Ajouter bouton "Demander publication"
- [ ] Ajouter services admin
- [ ] Tester flux de validation

#### Phase 5 : Paiement
- [ ] Créer composants de paiement
- [ ] Créer `paymentService.ts`
- [ ] Intégrer dans flux d'inscription
- [ ] Tester avec providers de test

#### Phase 6 : Progression Séquentielle
- [ ] Modifier `LessonPlayer` pour vérifier accès
- [ ] Ajouter indicateurs verrouillés/déverrouillés
- [ ] Modifier `progressService` pour déverrouillage
- [ ] Tester progression séquentielle

#### Phase 7-8 : Quiz et Évaluation Étudiants
- [ ] Créer `ModuleQuizPlayer`
- [ ] Créer `CourseEvaluationPlayer`
- [ ] Intégrer dans `CoursePlayer`
- [ ] Tester complétion et scores

#### Phase 9 : Certificats
- [ ] Créer `CertificateRequest` component
- [ ] Créer `CertificateApprovalPanel` admin
- [ ] Ajouter services certificats
- [ ] Tester demande et validation

#### Phase 10 : Messagerie
- [ ] Créer `MessageComposer` avec recherche email
- [ ] Modifier `messageService` pour utiliser email
- [ ] Organiser conversations par email
- [ ] Tester messagerie

### Backend

#### Phase 1 : Base de Données
- [ ] Créer migrations SQL
- [ ] Créer/modifier modèles
- [ ] Tester migrations
- [ ] Vérifier relations

#### Phase 2 : Auth Admin
- [ ] Créer route `/api/admin/auth/login`
- [ ] Implémenter 2FA
- [ ] Créer middleware admin
- [ ] Tester connexion admin

#### Phase 3-4 : Cours et Validation
- [ ] Modifier endpoints cours pour `course_type`
- [ ] Ajouter validation conditionnelle
- [ ] Créer endpoints quiz modules
- [ ] Créer endpoints évaluation
- [ ] Tester création et validation

#### Phase 5 : Validation Admin
- [ ] Créer endpoints demande publication
- [ ] Créer endpoints approbation/rejet
- [ ] Implémenter notifications
- [ ] Tester flux complet

#### Phase 6 : Paiement
- [ ] Créer endpoints paiement
- [ ] Intégrer Stripe
- [ ] Intégrer Mobile Money
- [ ] Créer webhooks
- [ ] Tester paiements

#### Phase 7 : Progression
- [ ] Créer endpoints vérification accès
- [ ] Implémenter logique séquentielle
- [ ] Créer endpoint complétion
- [ ] Tester déverrouillage

#### Phase 8-9 : Quiz et Évaluation Étudiants
- [ ] Créer endpoints quiz étudiant
- [ ] Créer endpoints évaluation étudiant
- [ ] Implémenter calcul scores
- [ ] Tester attribution badges

#### Phase 10 : Certificats
- [ ] Créer endpoints certificats
- [ ] Implémenter génération PDF
- [ ] Implémenter génération QR code
- [ ] Créer endpoints admin
- [ ] Tester génération

#### Phase 11 : Messagerie
- [ ] Modifier endpoints pour utiliser email
- [ ] Implémenter recherche par email
- [ ] Organiser par email
- [ ] Tester messagerie

---

## 🔗 Dépendances Entre Fonctionnalités

### Dépendances Critiques
1. **Base de Données** → Toutes les autres phases
2. **Authentification Admin** → Validation Admin
3. **Type de Cours** → Validation conditionnelle → Publication
4. **Évaluation Finale** → Validation Admin → Publication
5. **Paiement** → Inscription cours payant
6. **Progression Séquentielle** → Accès au contenu
7. **Quiz Modules** → Attribution badges → Gamification
8. **Évaluation Finale** → Éligibilité certificat
9. **Certificats** → Validation Admin

### Ordre Logique Recommandé
```
1. BDD + Modèles
2. Auth Admin
3. Type de Cours
4. Quiz/Évaluation (création)
5. Validation Admin
6. Paiement
7. Progression Séquentielle
8. Quiz/Évaluation (étudiant)
9. Certificats
10. Messagerie
```

---

## 📊 Métriques de Succès

### Critères de Validation par Phase
- ✅ Tous les tests unitaires passent
- ✅ Tous les tests d'intégration passent
- ✅ Aucune régression sur l'existant
- ✅ Documentation à jour
- ✅ Code review validé

### Tests Requis
- Tests unitaires (chaque service/fonction)
- Tests d'intégration (flux complets)
- Tests end-to-end (parcours utilisateur)
- Tests de performance (chargement, temps de réponse)
- Tests de sécurité (authentification, autorisations)

---

## 🎯 Points d'Attention

### Sécurité
- ✅ Validation stricte côté backend (jamais faire confiance au frontend)
- ✅ Protection CSRF sur tous les formulaires
- ✅ Rate limiting sur les endpoints sensibles
- ✅ Sanitization des inputs
- ✅ Logs détaillés des actions admin

### Performance
- ✅ Pagination sur les listes
- ✅ Cache pour les données statiques
- ✅ Lazy loading des composants lourds
- ✅ Optimisation des requêtes BDD (index, jointures)

### UX
- ✅ Feedback immédiat (loading, success, error)
- ✅ Messages d'erreur clairs et actionnables
- ✅ Validation en temps réel
- ✅ Sauvegarde automatique des formulaires

---

*Document créé le : 2024-01-XX*
*Dernière mise à jour : 2024-01-XX*

