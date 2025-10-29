# 📚 Architecture de Gestion des Cours - MdSC
## Architecture simple et professionnelle sans Moodle

---

## 🏗️ 1. Structure Backend (Node.js/Express)

```
mdsc_auth_api/
├── src/
│   ├── models/
│   │   ├── Course.js           # Modèle cours
│   │   ├── Module.js           # Modèle module
│   │   ├── Lesson.js           # Modèle leçon
│   │   ├── Enrollment.js       # Modèle inscription
│   │   ├── Progress.js         # Modèle progression
│   │   ├── Quiz.js             # Modèle quiz
│   │   ├── Badge.js            # Modèle badge
│   │   ├── Certificate.js     # Modèle certificat
│   │   └── Media.js            # Modèle médias
│   │
│   ├── controllers/
│   │   ├── courseController.js
│   │   ├── moduleController.js
│   │   ├── lessonController.js
│   │   ├── enrollmentController.js
│   │   ├── progressController.js
│   │   ├── quizController.js
│   │   ├── badgeController.js
│   │   └── certificateController.js
│   │
│   ├── services/
│   │   ├── courseService.js
│   │   ├── progressService.js
│   │   ├── badgeService.js
│   │   ├── certificateService.js
│   │   └── mediaService.js
│   │
│   ├── routes/
│   │   ├── courses.js
│   │   ├── modules.js
│   │   ├── lessons.js
│   │   ├── enrollments.js
│   │   ├── progress.js
│   │   ├── quizzes.js
│   │   ├── badges.js
│   │   └── certificates.js
│   │
│   └── middleware/
│       ├── auth.js
│       ├── roleCheck.js
│       └── upload.js
│
├── public/
│   ├── videos/
│   ├── documents/
│   ├── certificates/
│   └── thumbnails/
│
└── config/
    ├── database.js
    └── storage.js
```

---

## 📊 2. Schéma Base de Données (PostgreSQL/MySQL)

### **Table: courses**
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category ENUM('sante', 'education', 'gouvernance', 'environnement', 'economie') NOT NULL,
  level ENUM('debutant', 'intermediaire', 'avance') DEFAULT 'debutant',
  duration INTEGER, -- en minutes
  language VARCHAR(10) DEFAULT 'fr',
  thumbnail_url VARCHAR(500),
  instructor_id INTEGER REFERENCES users(id),
  prerequisite_course_id INTEGER REFERENCES courses(id), -- Cours prérequis
  is_published BOOLEAN DEFAULT false,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: modules**
```sql
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: lessons**
```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_type ENUM('video', 'text', 'quiz', 'h5p', 'forum', 'assignment', 'document', 'audio', 'presentation') NOT NULL,
  media_file_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL, -- Fichier uploadé
  content_url VARCHAR(500), -- URL après upload (MinIO/S3) ou URL externe (YouTube, etc.)
  content_text TEXT, -- Contenu textuel (pour type 'text')
  duration INTEGER, -- en minutes
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: enrollments**
```sql
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  status ENUM('enrolled', 'in_progress', 'completed', 'certified') DEFAULT 'enrolled',
  progress_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);
```

### **Table: progress**
```sql
CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- en secondes
  completed_at TIMESTAMP,
  UNIQUE(enrollment_id, lesson_id)
);
```

### **Table: quizzes**
```sql
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  passing_score INTEGER DEFAULT 70, -- Score minimum en %
  max_attempts INTEGER DEFAULT 3,
  time_limit INTEGER, -- en minutes
  is_final BOOLEAN DEFAULT false
);
```

### **Table: quiz_questions**
```sql
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
  options JSON, -- Pour multiple_choice: [{"text": "...", "correct": true}]
  correct_answer TEXT, -- Pour true_false et short_answer
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL
);
```

### **Table: quiz_attempts**
```sql
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  quiz_id INTEGER REFERENCES quizzes(id),
  answers JSON NOT NULL, -- {questionId: answer}
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: badges**
```sql
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  category VARCHAR(50),
  criteria JSON NOT NULL, -- {"type": "course_completion", "value": 1}
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: user_badges**
```sql
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

### **Table: certificates**
```sql
CREATE TABLE certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  certificate_code VARCHAR(100) UNIQUE NOT NULL, -- Pour QR code
  pdf_url VARCHAR(500),
  qr_code_url VARCHAR(500),
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optionnel: validité 2 ans
  verified BOOLEAN DEFAULT false
);
```

### **Table: media_files**
```sql
CREATE TABLE media_files (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- MIME type (video/mp4, application/pdf, etc.)
  file_category ENUM('video', 'document', 'audio', 'image', 'presentation', 'h5p', 'other') NOT NULL,
  file_size BIGINT NOT NULL, -- en bytes
  storage_type ENUM('minio', 's3', 'local') DEFAULT 'minio',
  bucket_name VARCHAR(100), -- Pour MinIO/S3
  storage_path VARCHAR(500) NOT NULL, -- Chemin dans le storage
  url VARCHAR(500) NOT NULL, -- URL publique d'accès
  thumbnail_url VARCHAR(500), -- Pour vidéos/images
  duration INTEGER, -- Pour vidéos/audio (en secondes)
  metadata JSON, -- Infos supplémentaires (dimensions, codec, etc.)
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_lesson (lesson_id),
  INDEX idx_course (course_id),
  INDEX idx_category (file_category)
);
```

---

## 🔄 3. Flow des Cours (Simplifié)

### **Création de Cours (Admin/Formateur)**
```
1. Créer cours (title, description, category)
   ↓
2. Ajouter modules (ordre, déverrouillage)
   ↓
3. Ajouter leçons dans chaque module
   ↓
4. Upload médias (vidéos, documents)
   ↓
5. Créer quiz d'évaluation
   ↓
6. Configurer certificat (si applicable)
   ↓
7. Publier le cours
```

### **Parcours Apprenant**
```
1. Voir catalogue → Filtrer par catégorie/niveau
   ↓
2. Inscription au cours (vérifier prérequis)
   ↓
3. Débuter Module 1
   ↓
4. Compléter leçons (vidéo, lecture, quiz)
   ↓
5. Progress tracking automatique
   ↓
6. Déverrouiller Module suivant (si prérequis OK)
   ↓
7. Passer quiz final (score ≥ 80%)
   ↓
8. Générer certificat QR si réussi
   ↓
9. Badge automatique "Maître [Thème]"
```

---

## 🎯 4. Routes API (RESTful)

### **Cours**
```javascript
GET    /api/courses              // Liste tous les cours (filtres: category, level, search)
GET    /api/courses/:id          // Détails d'un cours
POST   /api/courses              // Créer cours (Admin/Formateur)
PUT    /api/courses/:id          // Modifier cours
DELETE /api/courses/:id          // Supprimer cours (Admin)

GET    /api/courses/:id/modules  // Modules d'un cours
GET    /api/courses/popular       // Cours populaires
GET    /api/courses/recommended  // Recommandés pour l'user
```

### **Inscriptions**
```javascript
POST   /api/enrollments          // S'inscrire à un cours
GET    /api/enrollments          // Mes inscriptions
GET    /api/enrollments/:id      // Détails inscription
PUT    /api/enrollments/:id      // Mettre à jour statut
GET    /api/courses/:id/check-enrollment // Vérifier si déjà inscrit
```

### **Progression**
```javascript
GET    /api/progress/:enrollmentId // Progression détaillée
PUT    /api/progress/lesson/:lessonId // Marquer leçon complétée
GET    /api/progress/course/:courseId // Stats de progression d'un cours
```

### **Quiz**
```javascript
GET    /api/quizzes/:lessonId    // Quiz d'une leçon
POST   /api/quizzes/:id/attempt  // Soumettre tentative
GET    /api/quizzes/:id/attempts // Historique des tentatives
GET    /api/quizzes/:id/results  // Résultats d'une tentative
```

### **Badges**
```javascript
GET    /api/badges               // Liste tous les badges
GET    /api/badges/user          // Mes badges gagnés
POST   /api/badges/check-eligibility // Vérifier éligibilité
```

### **Certificats**
```javascript
GET    /api/certificates          // Mes certificats
GET    /api/certificates/:code   // Vérifier certificat (QR code)
POST   /api/certificates/generate // Générer certificat
GET    /api/certificates/:id/download // Télécharger PDF
```

### **Médias & Upload**
```javascript
POST   /api/media/upload           // Upload fichier (multipart/form-data)
POST   /api/media/upload-bulk      // Upload multiple fichiers
GET    /api/media/:id              // Infos fichier
DELETE /api/media/:id              // Supprimer fichier
GET    /api/media/:id/download     // Télécharger fichier
GET    /api/media/lesson/:lessonId // Fichiers d'une leçon
GET    /api/media/course/:courseId // Tous fichiers d'un cours
```

---

## 🏆 5. Système de Badges (Règles)

```javascript
// Badges prédéfinis
const badges = [
  {
    name: "Premiers pas",
    criteria: { type: "profile_completion", completed: true }
  },
  {
    name: "Explorateur MdSC",
    criteria: { type: "pages_visited", count: 3 }
  },
  {
    name: "Engagé",
    criteria: { type: "courses_enrolled", count: 1 }
  },
  {
    name: "Maître [Thématique]",
    criteria: { type: "course_completion", course_category: "sante" }
  },
  {
    name: "Marathonien",
    criteria: { type: "courses_completed", count: 5 }
  }
];
```

---

## 📜 6. Génération de Certificats

```javascript
// Service certificat
class CertificateService {
  async generateCertificate(userId, courseId) {
    // 1. Vérifier que le cours est complété (≥80% quiz final)
    // 2. Générer code unique (UUID)
    // 3. Créer PDF avec QR code (librarie: pdfkit, qrcode)
    // 4. Upload vers storage (MinIO/S3)
    // 5. Sauvegarder en DB
    // 6. Retourner URL du certificat
  }

  async verifyCertificate(code) {
    // Vérifier via code QR
    // Retourner info du certificat (valide/invalide)
  }
}
```

---

## 🎨 7. Types de Contenu Supportés & Upload de Fichiers

### **Types de Contenu avec Formats Acceptés**

```javascript
contentTypes = {
  video: {
    description: "Vidéo uploadée ou URL externe",
    upload_formats: ["mp4", "webm", "mov", "avi", "mkv"],
    max_size: "500MB",
    external_sources: ["YouTube", "Vimeo", "Dailymotion"],
    thumbnail_auto: true
  },
  text: {
    description: "Contenu HTML/Markdown (éditeur WYSIWYG)",
    upload_formats: [],
    use_text_editor: true
  },
  document: {
    description: "Documents PDF, Word, etc.",
    upload_formats: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    max_size: "50MB"
  },
  audio: {
    description: "Fichiers audio pour podcasts",
    upload_formats: ["mp3", "wav", "ogg", "m4a"],
    max_size: "100MB"
  },
  presentation: {
    description: "Présentations PowerPoint",
    upload_formats: ["ppt", "pptx"],
    max_size: "100MB"
  },
  quiz: {
    description: "Quiz intégré (sans fichier)",
    upload_formats: [],
    built_in: true
  },
  h5p: {
    description: "Contenu H5P interactif",
    upload_formats: ["h5p"],
    max_size: "200MB",
    requires_parser: true
  },
  forum: {
    description: "Discussion modérée",
    upload_formats: [],
    built_in: true
  },
  assignment: {
    description: "Devoir à soumettre",
    upload_formats: [],
    allows_student_upload: true
  }
};
```

### **Route d'Upload de Fichiers**

```javascript
// routes/media.js
POST   /api/media/upload              // Upload fichier (multipart/form-data)
GET    /api/media/:id                 // Récupérer infos fichier
DELETE /api/media/:id                 // Supprimer fichier
GET    /api/media/:id/download        // Télécharger fichier
POST   /api/media/upload-bulk         // Upload multiple fichiers

// Middleware upload (multer + MinIO)
const upload = multer({
  storage: multerS3({
    s3: minioClient,
    bucket: 'mdsc-media',
    acl: 'public-read',
    key: (req, file, cb) => {
      const folder = getFolderByContentType(req.body.content_type);
      cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = getAllowedTypes(req.body.content_type);
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});
```

### **Service d'Upload**

```javascript
// services/mediaService.js
class MediaService {
  async uploadFile(file, contentType, userId, courseId = null) {
    // 1. Valider type de fichier selon content_type
    // 2. Upload vers MinIO/S3
    // 3. Extraire métadonnées (durée vidéo, dimensions, etc.)
    // 4. Générer thumbnail si vidéo/image
    // 5. Sauvegarder en DB (media_files)
    // 6. Retourner media_file_id et URL
  }

  async deleteFile(mediaFileId) {
    // 1. Récupérer info fichier
    // 2. Supprimer du storage
    // 3. Supprimer en DB
  }

  getFolderByContentType(contentType) {
    const folders = {
      'video': 'videos',
      'document': 'documents',
      'audio': 'audio',
      'presentation': 'presentations',
      'h5p': 'h5p',
      'image': 'thumbnails'
    };
    return folders[contentType] || 'others';
  }

  getAllowedTypes(contentType) {
    const types = {
      'video': ['video/mp4', 'video/webm', 'video/quicktime'],
      'document': ['application/pdf', 'application/msword', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      'presentation': ['application/vnd.ms-powerpoint',
                      'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      'h5p': ['application/zip']
    };
    return types[contentType] || [];
  }
}
```

### **Exemple d'Upload Frontend (Next.js)**

```javascript
// Frontend: Upload component
const uploadFile = async (file, contentType, lessonId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('content_type', contentType);
  formData.append('lesson_id', lessonId);

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { media_file_id, url } = await response.json();
  
  // Associer à la leçon
  await updateLesson(lessonId, { media_file_id });
};
```

---

## 🔐 8. Permissions par Rôle

```javascript
// Middleware roleCheck
const permissions = {
  admin: ['courses:create', 'courses:delete', 'users:manage'],
  instructor: ['courses:edit', 'courses:publish', 'students:view'],
  student: ['courses:enroll', 'courses:view', 'certificates:download']
};
```

---

## 📁 9. Structure Frontend (Intégration)

```javascript
// Frontend Next.js routes
/dashboard
  /admin
    /courses        // Gestion cours
    /users          // Gestion utilisateurs
  /instructor
    /courses        // Mes cours créés
    /students       // Mes étudiants
  /student
    /courses        // Mes cours
    /progress        // Ma progression
    /badges          // Mes badges
    /certificates    // Mes certificats

/courses            // Catalogue
/courses/[slug]     // Détails cours
/learn/[courseId]   // Player de cours
```

---

## 🚀 10. Technologies Recommandées

| Composant | Technologie |
|-----------|------------|
| Backend | Node.js + Express |
| Base de données | PostgreSQL (ou MySQL) |
| ORM | Prisma (ou Sequelize) |
| Storage fichiers | MinIO / AWS S3 |
| Génération PDF | pdfkit / puppeteer |
| QR Code | qrcode |
| Vidéos | Upload direct ou intégration YouTube |
| Streaming | HLS.js pour vidéos longues |

---

## ✅ 11. Avantages de cette Architecture

✅ **Simple** : Pas de dépendance Moodle, contrôle total
✅ **Scalable** : Base de données propre, API RESTful
✅ **Flexible** : Facile à personnaliser
✅ **Moderne** : Stack JavaScript fullstack
✅ **Mobile-ready** : API REST pour apps mobiles futures
✅ **Maintenable** : Code modulaire et clair

---

## 📝 Prochaines Étapes

1. ✅ Créer les modèles Prisma/Sequelize
2. ✅ Implémenter les routes API
3. ✅ Créer les services (badges, certificats)
4. ✅ Intégrer l'upload de fichiers (MinIO)
5. ✅ Frontend : Pages catalogue et player cours

Souhaitez-vous que je commence par créer les modèles et routes pour les cours ? 🚀


Voici ce que le frontend doit faire pour s’aligner avec cette architecture :

## 📋 Actions requises par le frontend

### 1. Services API — Créer/Mettre à jour

#### `courseService.ts`
```typescript
// Endpoints à ajouter/mettre à jour
- getAllCourses(filters: {category?, level?, search?})
- getCourseById(id)
- getCourseBySlug(slug) // Nouveau: utilisation de slug au lieu d'ID
- getPopularCourses()
- getRecommendedCourses()
- getCourseModules(courseId)
- createCourse(courseData)
- updateCourse(id, courseData)
- deleteCourse(id)
```

#### `enrollmentService.ts` (CRÉER)
```typescript
- enrollInCourse(courseId)
- getMyEnrollments()
- getEnrollmentById(id)
- updateEnrollmentStatus(enrollmentId, status)
- checkEnrollment(courseId) // Vérifier si déjà inscrit
- unenrollFromCourse(courseId)
```

#### `progressService.ts` (CRÉER)
```typescript
- getProgressByEnrollment(enrollmentId)
- markLessonCompleted(lessonId, timeSpent?)
- getCourseProgress(courseId)
- getLessonProgress(lessonId)
```

#### `moduleService.ts` (CRÉER)
```typescript
- getCourseModules(courseId)
- createModule(courseId, moduleData)
- updateModule(moduleId, moduleData)
- deleteModule(moduleId)
- unlockModule(moduleId) // Pour déverrouiller
```

#### `lessonService.ts` (CRÉER)
```typescript
- getModuleLessons(moduleId)
- getLessonById(lessonId)
- createLesson(moduleId, lessonData)
- updateLesson(lessonId, lessonData)
- deleteLesson(lessonId)
```

#### `quizService.ts` (Mettre à jour)
```typescript
- getLessonQuiz(lessonId)
- submitQuizAttempt(quizId, answers)
- getQuizAttempts(quizId)
- getQuizResult(attemptId)
- checkQuizEligibility(quizId) // Vérifier tentatives restantes
```

#### `badgeService.ts` (CRÉER)
```typescript
- getAllBadges()
- getUserBadges()
- checkBadgeEligibility(badgeId)
- getBadgeById(badgeId)
```

#### `certificateService.ts` (CRÉER)
```typescript
- getMyCertificates()
- verifyCertificate(certificateCode) // Via QR code
- generateCertificate(courseId)
- downloadCertificate(certificateId)
- getCertificateByCode(code)
```

#### `mediaService.ts` (CRÉER - IMPORTANT)
```typescript
- uploadFile(file, contentType, lessonId?, courseId?)
- uploadBulkFiles(files[], contentType, lessonId?)
- getMediaFile(mediaId)
- deleteMediaFile(mediaId)
- downloadMediaFile(mediaId)
- getLessonMediaFiles(lessonId)
- getCourseMediaFiles(courseId)
```

---

### 2. Types TypeScript — Créer/Mettre à jour

Créer `src/types/course.ts`:
```typescript
export type CourseCategory = 'sante' | 'education' | 'gouvernance' | 'environnement' | 'economie';
export type CourseLevel = 'debutant' | 'intermediaire' | 'avance';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'certified';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ContentType = 'video' | 'text' | 'quiz' | 'h5p' | 'forum' | 
                          'assignment' | 'document' | 'audio' | 'presentation';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type FileCategory = 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other';
export type StorageType = 'minio' | 's3' | 'local';

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: number;
  language: string;
  thumbnail_url?: string;
  instructor_id: number;
  prerequisite_course_id?: number;
  is_published: boolean;
  enrollment_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_unlocked: boolean;
  created_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_type: ContentType;
  media_file_id?: number;
  content_url?: string;
  content_text?: string;
  duration: number;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: EnrollmentStatus;
  progress_percentage: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Progress {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  status: ProgressStatus;
  completion_percentage: number;
  time_spent: number;
  completed_at?: string;
}

export interface Quiz {
  id: number;
  lesson_id: number;
  title: string;
  passing_score: number;
  max_attempts: number;
  time_limit?: number;
  is_final: boolean;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  question_type: QuestionType;
  options?: Array<{text: string; correct: boolean}>;
  correct_answer?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  answers: Record<number, string>;
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  category: string;
  criteria: Record<string, any>;
  created_at: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  badge?: Badge;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  certificate_code: string;
  pdf_url: string;
  qr_code_url: string;
  issued_at: string;
  expires_at?: string;
  verified: boolean;
}

export interface MediaFile {
  id: number;
  lesson_id?: number;
  course_id?: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_category: FileCategory;
  file_size: number;
  storage_type: StorageType;
  bucket_name?: string;
  storage_path: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
  metadata?: Record<string, any>;
  uploaded_by: number;
  uploaded_at: string;
}
```

---

### 3. Composants à créer/mettre à jour

#### Composants de cours
- `CourseCatalog.tsx` — Catalogue avec filtres (category, level, search)
- `CourseDetail.tsx` — Détails avec modules/leçons, vérification prérequis
- `CoursePlayer.tsx` — Lecteur (vidéo, texte, quiz, etc.)
- `ModuleList.tsx` — Liste des modules avec déverrouillage
- `LessonCard.tsx` — Carte de leçon avec statut de progression
- `CourseEnrollment.tsx` — Gestion d’inscription

#### Composants d’upload
- `MediaUpload.tsx` — Upload de fichiers (vidéo, document, audio, etc.)
- `MediaUploadBulk.tsx` — Upload multiple
- `MediaPreview.tsx` — Aperçu selon type (vidéo, PDF, audio)
- `VideoPlayer.tsx` — Lecteur vidéo avec progression
- `DocumentViewer.tsx` — Visualiseur PDF/DOC
- `AudioPlayer.tsx` — Lecteur audio

#### Composants de gestion (instructeur/admin)
- `CourseEditor.tsx` — Éditeur de cours (CRUD)
- `ModuleEditor.tsx` — Éditeur de modules
- `LessonEditor.tsx` — Éditeur de leçons avec sélection type contenu
- `MediaLibrary.tsx` — Bibliothèque de médias du cours
- `CoursePublish.tsx` — Publication avec validation

#### Composants de progression
- `StudentProgress.tsx` — Vue progression étudiante
- `CourseProgress.tsx` — Progression globale d’un cours
- `ProgressChart.tsx` — Graphique de progression
- `LessonCompletion.tsx` — Marquer leçon complétée

#### Composants de quiz
- `QuizComponent.tsx` — Rendu de quiz
- `QuizQuestion.tsx` — Question selon type (multiple choice, true/false, short answer)
- `QuizAttempt.tsx` — Tentative avec timer si time_limit
- `QuizResults.tsx` — Résultats avec feedback
- `QuizHistory.tsx` — Historique des tentatives

#### Composants de badges
- `BadgeList.tsx` — Liste des badges disponibles
- `UserBadges.tsx` — Badges obtenus par l’utilisateur
- `BadgeCard.tsx` — Carte de badge
- `BadgeEligibility.tsx` — Vérification d’éligibilité

#### Composants de certificats
- `CertificateList.tsx` — Liste des certificats
- `CertificateCard.tsx` — Carte de certificat avec QR code
- `CertificateVerification.tsx` — Vérification par code
- `CertificateDownload.tsx` — Téléchargement PDF

---

### 4. Pages/ Routes à créer

```typescript
// app/courses/
  page.tsx                    // Catalogue avec filtres
  [slug]/page.tsx            // Détails cours (utiliser slug)
  [slug]/enroll/page.tsx     // Page d'inscription

// app/learn/
  [courseId]/page.tsx        // Player principal
  [courseId]/module/[moduleId]/page.tsx
  [courseId]/lesson/[lessonId]/page.tsx

// app/dashboard/student/
  courses/page.tsx           // Mes cours
  progress/page.tsx          // Ma progression
  badges/page.tsx            // Mes badges
  certificates/page.tsx      // Mes certificats

// app/dashboard/instructor/
  courses/page.tsx           // Gestion cours
  courses/[id]/edit/page.tsx // Édition cours
  courses/new/page.tsx       // Création cours
  students/page.tsx          // Mes étudiants
  media/page.tsx             // Bibliothèque médias

// app/dashboard/admin/
  courses/page.tsx           // Tous les cours
  users/page.tsx            // Gestion utilisateurs
  media/page.tsx            // Bibliothèque globale
```

---

### 5. Logique métier à implémenter

#### Système de prérequis
```typescript
// Avant inscription, vérifier:
- Si prerequisite_course_id existe, vérifier que l'utilisateur a complété ce cours
- Afficher message si prérequis non satisfait
```

#### Déverrouillage des modules
```typescript
// Logique:
- Module 1 toujours déverrouillé (is_unlocked = true par défaut)
- Module suivant déverrouillé si:
  - Toutes les leçons du module précédent sont complétées
  - OU si is_unlocked est forcé à true (admin)
```

#### Progression automatique
```typescript
// Quand une leçon est complétée:
1. Créer/mettre à jour l'entrée dans progress
2. Recalculer progress_percentage de l'enrollment
3. Vérifier si module peut être déverrouillé
4. Vérifier si cours peut être complété
5. Déclencher vérification de badges
```

#### Système de quiz
```typescript
// Logique:
- Vérifier max_attempts avant de permettre nouvelle tentative
- Appliquer time_limit si défini (timer côté frontend)
- Calculer score automatiquement
- Vérifier passing_score pour passer/échouer
- Si is_final = true et passed = true, permettre génération certificat
```

#### Génération de certificat
```typescript
// Conditions:
1. Cours complété (completed_at existe)
2. Quiz final réussi (si existe) avec score ≥ passing_score
3. Progression ≥ 80% (ou critère défini)
4. Générer certificat via API
5. Afficher certificat avec QR code
```

---

### 6. Upload de fichiers — Implémentation

#### Composant d’upload
```typescript
// MediaUpload.tsx doit supporter:
- Sélection type de contenu (video, document, audio, etc.)
- Validation format selon contentType
- Barre de progression
- Aperçu avant upload
- Gestion erreurs (taille, format)
- Intégration avec MinIO/S3
```

#### Configuration des types acceptés
```typescript
const CONTENT_TYPE_CONFIG = {
  video: {
    formats: ['mp4', 'webm', 'mov'],
    maxSize: 500 * 1024 * 1024, // 500MB
    accept: 'video/*'
  },
  document: {
    formats: ['pdf', 'doc', 'docx'],
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: '.pdf,.doc,.docx'
  },
  // ... autres types
};
```

---

### 7. Intégrations spécifiques

- Slug: Utiliser `slug` au lieu de `id` pour les URLs (SEO)
- URLs de médias: Utiliser les URLs depuis `media_files.url`
- QR codes: Intégrer bibliothèque QR code pour certificats
- Lecteur vidéo: Utiliser un player adapté (ex: Video.js, Plyr) avec tracking de progression
- Visualiseur PDF: Utiliser `react-pdf` ou iframe pour PDF
- Éditeur de texte: Utiliser `react-quill` ou `draft-js` pour le type `text`

---

### 8. États et stores (Zustand/Context)

```typescript
// courseStore.ts
- courses: Course[]
- currentCourse: Course | null
- enrollments: Enrollment[]
- loading, error states

// progressStore.ts
- progress: Progress[]
- currentProgress: Progress | null
- updateProgress()

// badgeStore.ts
- badges: Badge[]
- userBadges: UserBadge[]
- checkEligibility()
```

---

### 9. Validation et erreurs

- Validation prérequis avant inscription
- Gestion limites de tentatives de quiz
- Messages d’erreur pour upload (format, taille)
- Validation complétion avant certificat
- Feedback temps réel pour progression

---

### 10. Priorités d’implémentation

Phase 1 (base):
- Services API (courses, enrollments, progress)
- Types TypeScript
- Catalogue de cours
- Détails de cours
- Inscription

Phase 2 (contenu):
- Player de cours
- Gestion modules/leçons
- Progression
- Upload de médias

Phase 3 (évaluation):
- Quiz
- Badges
- Certificats

Phase 4 (avancé):
- Recommandations
- Analytics détaillés
- Optimisations

Résumé: Le frontend doit implémenter les services API correspondants, créer les composants pour chaque entité (cours, modules, leçons, médias, quiz, badges, certificats), gérer la progression automatique, le déverrouillage des modules, et intégrer un système d’upload de fichiers robuste.