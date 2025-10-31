# 🗄️ Schéma de Base de Données - MdSC MOOC Backend

## 📋 Vue d'ensemble
Ce document liste toutes les tables et relations nécessaires pour le backend MdSC MOOC selon l'architecture définie.

---

## 👤 1. Table Utilisateurs

### `users`
**Description:** Utilisateurs de la plateforme (étudiants, instructeurs, admins)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'password_hash',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  organization VARCHAR(255),
  country VARCHAR(100),
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  refresh_token VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email),
  INDEX idx_role (role)
);
```

---

## 📁 2. Table Catégories

### `categories`
**Description:** Catégories de cours

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(20),
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name (name),
  INDEX idx_is_active (is_active)
);
```

---

## 📚 3. Table Cours

### `courses`
**Description:** Cours de formation

```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  instructor_id INT NOT NULL,
  category_id INT NOT NULL,
  prerequisite_course_id INT NULL COMMENT 'Cours prérequis (NULL si aucun)',
  description TEXT,
  short_description VARCHAR(500),
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500),
  duration_minutes INT,
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  language VARCHAR(10) DEFAULT 'fr',
  price DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'XOF',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  enrollment_deadline DATETIME,
  course_start_date DATETIME,
  course_end_date DATETIME,
  enrollment_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE SET NULL,
  UNIQUE KEY unique_slug (slug),
  INDEX idx_instructor (instructor_id),
  INDEX idx_category (category_id),
  INDEX idx_is_published (is_published),
  INDEX idx_prerequisite (prerequisite_course_id)
);
```

---

## 📑 4. Table Modules

### `modules`
**Description:** Modules dans un cours

```sql
CREATE TABLE modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) COMMENT 'Image d\'identification du module',
  order_index INT NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_course_order (course_id, order_index),
  INDEX idx_is_unlocked (is_unlocked)
);
```

---

## 📝 5. Table Leçons

### `lessons`
**Description:** Leçons dans un cours (peut être liée à un module ou directement au cours)

```sql
CREATE TABLE lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  module_id INT NULL COMMENT 'NULL si leçon directement liée au cours',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type ENUM('video', 'text', 'quiz', 'h5p', 'assignment', 'document', 'audio', 'presentation') NOT NULL,
  media_file_id INT NULL,
  content_url VARCHAR(500),
  content_text TEXT,
  video_url VARCHAR(500),
  duration_minutes INT,
  order_index INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE SET NULL,
  INDEX idx_course (course_id),
  INDEX idx_module (module_id),
  INDEX idx_order (order_index),
  INDEX idx_is_published (is_published),
  INDEX idx_content_type (content_type)
);
```

---

## 📂 6. Table Fichiers Média

### `media_files`
**Description:** Fichiers multimédias uploadés

```sql
CREATE TABLE media_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NULL COMMENT 'NULL si fichier lié directement au cours',
  course_id INT NULL COMMENT 'NULL si fichier lié à une leçon',
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL COMMENT 'MIME type',
  file_category ENUM('video', 'document', 'audio', 'image', 'presentation', 'h5p', 'other') NOT NULL,
  file_size BIGINT NOT NULL COMMENT 'Taille en bytes',
  storage_type ENUM('local', 's3', 'minio') DEFAULT 'local',
  bucket_name VARCHAR(100),
  storage_path VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INT COMMENT 'Pour vidéos/audio (secondes)',
  metadata JSON COMMENT 'Infos supplémentaires (dimensions, codec, etc.)',
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_course (course_id),
  INDEX idx_file_category (file_category),
  INDEX idx_uploaded_by (uploaded_by)
);
```

---

## 📥 7. Table Inscriptions

### `enrollments`
**Description:** Inscriptions des utilisateurs aux cours

```sql
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  status ENUM('enrolled', 'in_progress', 'completed', 'certified') DEFAULT 'enrolled',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '0-100',
  completed_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMP NULL,
  UNIQUE KEY unique_enrollment (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status),
  INDEX idx_is_active (is_active)
);
```

---

## 📊 8. Table Progression

### `progress`
**Description:** Progression détaillée par leçon

```sql
CREATE TABLE progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  lesson_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  completion_percentage INT DEFAULT 0 COMMENT '0-100',
  time_spent INT DEFAULT 0 COMMENT 'Temps passé en secondes',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (enrollment_id, lesson_id),
  INDEX idx_enrollment (enrollment_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_status (status)
);
```

---

## ❓ 9. Tables Quiz

### `quizzes`
**Description:** Quiz d'évaluation

```sql
CREATE TABLE quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  lesson_id INT NULL COMMENT 'NULL si quiz final du cours',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit_minutes INT COMMENT 'NULL si pas de limite de temps',
  passing_score DECIMAL(5,2) DEFAULT 70.00 COMMENT 'Score minimum pour réussir (0-100)',
  max_attempts INT DEFAULT 3,
  is_final BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_course (course_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_is_published (is_published)
);
```

### `quiz_questions`
**Description:** Questions de quiz

```sql
CREATE TABLE quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
  options JSON COMMENT 'Pour multiple_choice: [{"text": "...", "correct": true}]',
  correct_answer TEXT COMMENT 'Pour true_false et short_answer',
  points DECIMAL(5,2) DEFAULT 1.00,
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_quiz (quiz_id),
  INDEX idx_order (order_index),
  INDEX idx_is_active (is_active)
);
```

### `quiz_attempts`
**Description:** Tentatives de quiz

```sql
CREATE TABLE quiz_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  answers JSON NOT NULL COMMENT '{questionId: answer}',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  score DECIMAL(5,2) NULL COMMENT 'Score obtenu',
  total_points DECIMAL(5,2) NULL COMMENT 'Points totaux possibles',
  percentage DECIMAL(5,2) NULL COMMENT 'Pourcentage (0-100)',
  is_passed BOOLEAN DEFAULT FALSE,
  time_spent_minutes INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_is_passed (is_passed)
);
```

---

## 🏆 10. Tables Certificats

### `certificates`
**Description:** Certificats délivrés

```sql
CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificate_code VARCHAR(100) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  certificate_number VARCHAR(50),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'NULL si certificat sans expiration',
  verified BOOLEAN DEFAULT FALSE,
  pdf_url VARCHAR(500),
  qr_code_url VARCHAR(500),
  is_valid BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP NULL,
  revoked_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_code (certificate_code),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_verified (verified),
  INDEX idx_is_valid (is_valid)
);
```

---

## 🏅 11. Tables Badges et Gamification

### `badges`
**Description:** Badges de gamification (avec rendu PDF téléchargeable)

```sql
CREATE TABLE badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  pdf_url VARCHAR(500) COMMENT 'URL du rendu PDF du badge',
  category VARCHAR(50),
  criteria JSON NOT NULL COMMENT '{"type": "course_completion", "value": 1}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
);
```

### `user_badges`
**Description:** Badges obtenus par les utilisateurs

```sql
CREATE TABLE user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_badge (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_badge (badge_id)
);
```

---

## 🎮 12. Tables Gamification

### `user_xp`
**Description:** Points d'expérience et niveaux des utilisateurs

```sql
CREATE TABLE user_xp (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,
  xp_to_next_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id),
  INDEX idx_xp (total_xp),
  INDEX idx_level (current_level)
);
```

### `user_streaks`
**Description:** Séries de progression des utilisateurs

```sql
CREATE TABLE user_streaks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  daily_streak INT DEFAULT 0,
  perfect_quiz_streak INT DEFAULT 0,
  last_activity_date DATE,
  longest_daily_streak INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id),
  INDEX idx_daily_streak (daily_streak)
);
```

### `challenges`
**Description:** Défis hebdomadaires, mensuels et saisonniers

```sql
CREATE TABLE challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('weekly', 'monthly', 'seasonal', 'event') NOT NULL,
  criteria JSON NOT NULL COMMENT 'Conditions du défi',
  reward_xp INT DEFAULT 0,
  reward_badge_id INT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reward_badge_id) REFERENCES badges(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_is_active (is_active)
);
```

### `user_challenges`
**Description:** Participation des utilisateurs aux défis

```sql
CREATE TABLE user_challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  progress JSON COMMENT 'Progression du défi',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_challenge (user_id, challenge_id),
  INDEX idx_user (user_id),
  INDEX idx_challenge (challenge_id)
);
```

---

## 💬 13. Table Messages

### `messages`
**Description:** Messages entre utilisateurs

```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  recipient_id INT NULL COMMENT 'NULL pour messages broadcast',
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('direct', 'broadcast') DEFAULT 'direct',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sender (sender_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_is_read (is_read),
  INDEX idx_message_type (message_type)
);
```

---

## 🔔 14. Table Notifications

### `notifications`
**Description:** Notifications système

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  payload TEXT NOT NULL COMMENT 'JSON ou texte de la notification',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_is_read (is_read)
);
```

---

## 🔐 15. Tables d'Authentification

### `email_verification_tokens`
**Description:** Tokens de vérification d'email

```sql
CREATE TABLE email_verification_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_token (token),
  INDEX idx_user (user_id)
);
```

### `password_reset_tokens`
**Description:** Tokens de réinitialisation de mot de passe

```sql
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_token (token),
  INDEX idx_user (user_id)
);
```

### `refresh_tokens`
**Description:** Refresh tokens JWT

```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_token (token),
  INDEX idx_user (user_id)
);
```

### `user_sessions`
**Description:** Sessions utilisateurs

```sql
CREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session (session_id),
  INDEX idx_user (user_id)
);
```

---

## 🔍 Relations Principales

### Hiérarchie des Cours
```
categories (1:N) → courses
courses (1:N) → modules
courses (1:N) → lessons (directement liées au cours)
modules (1:N) → lessons (leçons dans un module)
lessons (N:1) → media_files
courses (N:1) → courses (prerequisite)
```

### Parcours Apprenant
```
users (1:N) → enrollments (N:1) ← courses
enrollments (1:N) → progress (1:1) ← lessons
enrollments (1:1) → certificates
```

### Quiz et Évaluations
```
courses (1:N) → quizzes
lessons (1:1) → quizzes
quizzes (1:N) → quiz_questions
users (1:N) → quiz_attempts (1:1) ← quizzes
```

### Gamification
```
users (1:1) → user_xp
users (1:1) → user_streaks
users (1:N) → user_badges (N:1) ← badges
users (1:N) → user_challenges (N:1) ← challenges
```

### Communication
```
users (1:N) → messages (sender)
users (1:N) → messages (recipient)
users (1:N) → notifications
```

### Authentification
```
users (1:N) → email_verification_tokens
users (1:N) → password_reset_tokens
users (1:N) → refresh_tokens
users (1:N) → user_sessions
```

---

## 📈 Index et Performance

### Index déjà définis dans les tables
- **UNIQUE**: email, slug, certificate_code, session_id, tokens
- **INDEX simples**: role, category, status, is_published, is_active, etc.
- **INDEX composites**: (course_id, order_index), (enrollment_id, lesson_id)
- **INDEX pour FOREIGN KEYS**: automatiquement créés

### Recommandations supplémentaires
- Index sur created_at pour les tris chronologiques
- Index composés pour requêtes fréquentes de jointure
- Index FULLTEXT sur description, content_text pour recherches

---

## 🔐 Permissions et Rôles

Les rôles sont gérés via `users.role`:
- **student**: Inscription, visualisation, progression, quiz, certificats
- **instructor**: Création/édition cours, modules, leçons, quiz, vue progrès étudiants
- **admin**: Accès total + gestion utilisateurs, catégories

---

## 📝 Notes d'Implémentation

### 1. Types de Données JSON
- `quiz_questions.options`: Options de questions à choix multiples
- `badges.criteria`: Critères d'attribution
- `media_files.metadata`: Métadonnées fichiers
- `quiz_attempts.answers`: Réponses utilisateur
- `notifications.payload`: Données de notification
- `challenges.criteria`: Conditions du défi
- `user_challenges.progress`: Progression du défi

### 2. Contraintes à Ajouter
- CHECK pour pourcentages (0-100)
- CHECK pour dates (course_start_date < course_end_date)
- CHECK pour prix >= 0

### 3. Soft Deletes (Optionnel)
Ajouter `deleted_at TIMESTAMP NULL` aux tables critiques:
- courses, modules, lessons
- users
- messages

### 4. Migration et ORM
Recommandé: **Prisma** ou **Sequelize**

---

## ✅ Checklist Backend

### Phase 1: Base de Données
- [ ] Créer toutes les tables avec contraintes
- [ ] Ajouter tous les index (performance)
- [ ] Implémenter migrations (Prisma/Sequelize)
- [ ] Peupler tables de référence (categories, badges initiaux)

### Phase 2: Backend Core
- [ ] Modèles (Models) avec relations
- [ ] Controllers pour toutes les entités
- [ ] Routes API RESTful
- [ ] Middleware auth (JWT)
- [ ] Middleware validation (Zod/Joi)
- [ ] Middleware errors

### Phase 3: Services Métier
- [ ] Service upload fichiers (Multer + MinIO/S3)
- [ ] Service génération certificats (PDF + QR)
- [ ] Service badges automatiques
- [ ] Service progression automatique
- [ ] Service email (Nodemailer)
- [ ] Service analytics

### Phase 4: Sécurité
- [ ] Hashage mots de passe (bcrypt)
- [ ] Tokens JWT (access + refresh)
- [ ] Rate limiting
- [ ] CORS configuré
- [ ] Validation sanitization

### Phase 5: Tests
- [ ] Tests unitaires
- [ ] Tests d'intégration API
- [ ] Tests E2E

---

## 📊 Statistiques Base de Données

- **Total tables**: 20 tables principales
- **Tables avec JSON**: 7 tables
- **Tables d'auth**: 4 tables
- **Tables gamification**: 4 tables
- **Total Foreign Keys**: ~30 relations
- **Total Index**: ~50 index

---

## 🔗 Fichiers Backend Nécessaires

### Structure suggérée
```
backend/
├── src/
│   ├── models/          # 20 modèles Prisma/Sequelize
│   ├── controllers/     # 18 controllers
│   ├── services/        # 12 services métier
│   ├── routes/          # 12+ fichiers routes
│   ├── middleware/      # auth, validation, errors
│   ├── utils/           # helpers, constants
│   └── config/          # database, env
├── migrations/          # Fichiers de migrations
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🎮 Stratégie de Gamification

Pour implémenter une gamification attrayante et professionnelle, voir le fichier dédié: **[GAMIFICATION_STRATEGY.md](./GAMIFICATION_STRATEGY.md)**

### Vue d'ensemble rapide
- **Système de Points (XP)**: Points d'expérience pour chaque action
- **12 Niveaux**: De "Apprenti" à "Phénix" 🐉
- **Badges Stratifiés**: Bronze, Argent, Or, Légendaire
- **Streaks**: Séries quotidiennes, quiz parfaits
- **Leaderboards**: Global, mensuel, par catégorie
- **Défis**: Hebdomadaires, mensuels, saisonniers
- **Récompenses**: Certificats PDF, opportunités de mentorat
- **UX Attrayante**: Animations, feedback, notifications

---

**Version**: 2.1  
**Date**: 2024  
**Auteur**: MdSC MOOC Team
