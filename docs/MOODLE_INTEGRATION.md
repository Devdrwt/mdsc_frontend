# 📚 Intégration Moodle - Guide Complet

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration Moodle](#configuration-moodle)
3. [Configuration Frontend](#configuration-frontend)
4. [Fonctionnalités disponibles](#fonctionnalités-disponibles)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Tests](#tests)
8. [Déploiement](#déploiement)

---

## Vue d'ensemble

L'intégration Moodle permet à la plateforme MdSC de communiquer avec le LMS Moodle pour :
- ✅ Gérer les cours et le contenu pédagogique
- ✅ Gérer les utilisateurs et les inscriptions
- ✅ Suivre la progression des apprenants
- ✅ Gérer les évaluations (quiz, devoirs)
- ✅ Générer des certificats
- ✅ Récupérer les notes et les résultats

---

## Configuration Moodle

### 1. Activer les Web Services

1. **Administration du site** → **Plugins** → **Services Web** → **Vue d'ensemble**
2. Activer les Web Services
3. Activer les protocoles REST

### 2. Créer un utilisateur de service Web

1. **Administration du site** → **Utilisateurs** → **Comptes** → **Ajouter un utilisateur**
2. Créer un utilisateur dédié (ex: `mdsc_api_user`)
3. Donner les permissions nécessaires

### 3. Créer un rôle personnalisé

1. **Administration du site** → **Utilisateurs** → **Permissions** → **Définir les rôles**
2. Créer un rôle `API User` avec les capacités:
   ```
   webservice/rest:use
   moodle/course:view
   moodle/course:viewhiddencourses
   moodle/user:viewdetails
   moodle/grade:view
   moodle/course:manageactivities
   mod/quiz:attempt
   mod/assign:submit
   ```

### 4. Créer un service Web externe

1. **Administration du site** → **Plugins** → **Services Web** → **Services externes**
2. Cliquer sur **Ajouter**
3. Configurer:
   - Nom: `MdSC Integration`
   - Nom court: `mdsc_api`
   - Activer: ✅
   - Utilisateurs autorisés: Ajouter l'utilisateur créé
   - Capacité requise: (laisser vide)

### 5. Ajouter les fonctions au service

Ajouter les fonctions suivantes au service `MdSC Integration`:

#### Gestion des cours
```
core_course_get_courses
core_course_get_contents
core_course_create_courses
core_course_update_courses
core_course_delete_courses
core_course_search_courses
core_course_get_categories
core_enrol_get_users_courses
```

#### Gestion des utilisateurs
```
core_user_get_users
core_user_create_users
core_user_get_users_by_field
core_enrol_get_enrolled_users
enrol_manual_enrol_users
enrol_manual_unenrol_users
```

#### Quiz et évaluations
```
mod_quiz_get_quizzes_by_courses
mod_quiz_start_attempt
mod_quiz_process_attempt
mod_quiz_get_attempt_review
mod_assign_get_assignments
mod_assign_save_submission
mod_assign_get_submissions
mod_assign_save_grade
```

#### Progression et notes
```
core_completion_get_activities_completion_status
core_completion_get_course_completion_status
core_completion_update_activity_completion_status_manually
gradereport_user_get_grade_items
gradereport_overview_get_course_grades
```

#### Certificats
```
mod_customcert_get_issued_certificates
mod_customcert_issue_certificate
```

### 6. Générer un token

1. **Administration du site** → **Plugins** → **Services Web** → **Gérer les tokens**
2. Cliquer sur **Ajouter**
3. Sélectionner:
   - Utilisateur: `mdsc_api_user`
   - Service: `MdSC Integration`
4. Copier le token généré

---

## Configuration Frontend

### 1. Variables d'environnement

Créer un fichier `.env.local` à la racine du projet frontend:

```env
# Moodle Configuration
NEXT_PUBLIC_MOODLE_URL=http://localhost/moodle
NEXT_PUBLIC_MOODLE_TOKEN=votre_token_ici
```

### 2. Configuration TypeScript

Le service Moodle est déjà configuré dans `src/lib/services/moodleService.ts`.

### 3. Utilisation dans les composants

```typescript
import { moodleService } from '@/lib/services/moodleService';

// Récupérer les cours d'un utilisateur
const courses = await moodleService.getUserCourses(userId);

// Inscrire un utilisateur à un cours
await moodleService.enrollUserInCourse(userId, courseId);

// Récupérer la progression
const progress = await moodleService.getCourseProgress(userId, courseId);
```

---

## Fonctionnalités disponibles

### 📚 Gestion des Cours

#### Récupérer tous les cours
```typescript
const courses = await moodleService.getAllCourses();
```

#### Récupérer les cours d'un utilisateur
```typescript
const userCourses = await moodleService.getUserCourses(userId);
```

#### Récupérer les détails d'un cours
```typescript
const course = await moodleService.getCourseDetails(courseId);
```

#### Récupérer le contenu d'un cours
```typescript
const sections = await moodleService.getCourseContents(courseId);
```

#### Créer un cours
```typescript
const newCourse = await moodleService.createCourse({
  fullname: 'Leadership et Management',
  shortname: 'LEAD101',
  categoryid: 1,
  summary: 'Cours sur le leadership',
  format: 'topics'
});
```

#### Mettre à jour un cours
```typescript
await moodleService.updateCourse(courseId, {
  fullname: 'Nouveau titre',
  summary: 'Nouvelle description'
});
```

#### Supprimer un cours
```typescript
await moodleService.deleteCourse(courseId);
```

### 👥 Gestion des Utilisateurs

#### Récupérer les informations d'un utilisateur
```typescript
const user = await moodleService.getUserInfo(userId);
```

#### Créer un utilisateur
```typescript
const newUser = await moodleService.createUser({
  username: 'marie.kone',
  password: 'SecurePass123!',
  firstname: 'Marie',
  lastname: 'Koné',
  email: 'marie.kone@example.com',
  city: 'Abidjan',
  country: 'CI'
});
```

#### Récupérer les utilisateurs inscrits à un cours
```typescript
const enrolledUsers = await moodleService.getCourseEnrolledUsers(courseId);
```

#### Inscrire un utilisateur à un cours
```typescript
// roleId: 5 = étudiant, 3 = formateur, 1 = administrateur
await moodleService.enrollUserInCourse(userId, courseId, 5);
```

#### Désinscrire un utilisateur d'un cours
```typescript
await moodleService.unenrollUserFromCourse(userId, courseId);
```

### 📝 Gestion des Quiz

#### Récupérer les quiz d'un cours
```typescript
const quizzes = await moodleService.getCourseQuizzes(courseId);
```

#### Démarrer une tentative de quiz
```typescript
const attempt = await moodleService.startQuizAttempt(quizId);
```

#### Soumettre les réponses d'un quiz
```typescript
await moodleService.submitQuizAnswer(attemptId, {
  'q1': 'Réponse 1',
  'q2': 'Réponse 2',
  'q3': 'Réponse 3'
});
```

#### Récupérer les résultats d'un quiz
```typescript
const results = await moodleService.getQuizAttemptResults(attemptId);
```

### 📋 Gestion des Devoirs

#### Récupérer les devoirs d'un cours
```typescript
const assignments = await moodleService.getCourseAssignments(courseId);
```

#### Soumettre un devoir
```typescript
await moodleService.submitAssignment(
  assignmentId,
  'Contenu du devoir en texte'
);
```

#### Récupérer les soumissions d'un devoir
```typescript
const submissions = await moodleService.getAssignmentSubmissions(assignmentId);
```

#### Noter un devoir
```typescript
await moodleService.gradeAssignment(
  assignmentId,
  userId,
  85, // Note sur 100
  'Excellent travail !'
);
```

### 📊 Gestion des Notes

#### Récupérer les notes d'un utilisateur
```typescript
const grades = await moodleService.getUserGrades(userId, courseId);
```

#### Récupérer toutes les notes d'un cours
```typescript
const courseGrades = await moodleService.getCourseGrades(courseId);
```

### 📈 Gestion de la Progression

#### Récupérer la progression dans un cours
```typescript
const progress = await moodleService.getCourseProgress(userId, courseId);
// Retourne un pourcentage: 0-100
```

#### Marquer une activité comme complétée
```typescript
await moodleService.markModuleComplete(moduleId, true);
```

#### Récupérer le statut de complétion d'un cours
```typescript
const status = await moodleService.getCourseCompletionStatus(userId, courseId);
```

### 🏆 Gestion des Certificats

#### Récupérer les certificats d'un utilisateur
```typescript
const certificates = await moodleService.getUserCertificates(userId);
```

#### Générer un certificat
```typescript
await moodleService.issueCertificate(certificateId, userId);
```

#### Télécharger un certificat
```typescript
const downloadUrl = await moodleService.downloadCertificate(certificateId);
```

### 🔍 Recherche et Filtrage

#### Rechercher des cours
```typescript
const results = await moodleService.searchCourses('leadership');
```

#### Récupérer les catégories de cours
```typescript
const categories = await moodleService.getCourseCategories();
```

---

## Exemples d'utilisation

### Exemple 1 : Dashboard Apprenant

```typescript
'use client';

import { useEffect, useState } from 'react';
import { moodleService } from '@/lib/services/moodleService';
import { useAuthStore } from '@/lib/stores/authStore';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Récupérer les cours de l'étudiant
        const userCourses = await moodleService.getUserCourses(parseInt(user.id));
        
        // Enrichir avec la progression
        const coursesWithProgress = await Promise.all(
          userCourses.map(async (course) => {
            const progress = await moodleService.getCourseProgress(
              parseInt(user.id),
              course.id
            );
            return { ...course, progress };
          })
        );

        setCourses(coursesWithProgress);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Mes Cours</h1>
      {courses.map((course) => (
        <div key={course.id}>
          <h2>{course.fullname}</h2>
          <p>Progression: {course.progress}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Exemple 2 : Inscription à un cours

```typescript
'use client';

import { moodleService } from '@/lib/services/moodleService';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CourseEnrollButton({ courseId }: { courseId: number }) {
  const { user } = useAuthStore();
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) return;

    setEnrolling(true);
    try {
      const success = await moodleService.enrollUserInCourse(
        parseInt(user.id),
        courseId
      );

      if (success) {
        alert('Inscription réussie !');
      } else {
        alert('Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'inscription');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={enrolling}
      className="btn-mdsc-primary"
    >
      {enrolling ? 'Inscription...' : 'S\'inscrire au cours'}
    </button>
  );
}
```

### Exemple 3 : Passer un quiz

```typescript
'use client';

import { useState } from 'react';
import { moodleService } from '@/lib/services/moodleService';

export default function QuizPage({ quizId }: { quizId: number }) {
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const startQuiz = async () => {
    const newAttempt = await moodleService.startQuizAttempt(quizId);
    setAttempt(newAttempt);
  };

  const submitQuiz = async () => {
    if (!attempt) return;

    setSubmitting(true);
    try {
      await moodleService.submitQuizAnswer(attempt.id, answers);
      
      // Récupérer les résultats
      const results = await moodleService.getQuizAttemptResults(attempt.id);
      console.log('Résultats:', results);
      
      alert('Quiz soumis avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (!attempt) {
    return (
      <button onClick={startQuiz} className="btn-mdsc-primary">
        Démarrer le quiz
      </button>
    );
  }

  return (
    <div>
      <h1>Quiz en cours</h1>
      {/* Afficher les questions et recueillir les réponses */}
      <button
        onClick={submitQuiz}
        disabled={submitting}
        className="btn-mdsc-primary"
      >
        {submitting ? 'Soumission...' : 'Soumettre le quiz'}
      </button>
    </div>
  );
}
```

---

## Gestion des erreurs

### Types d'erreurs

1. **Erreurs de réseau** : Connexion impossible à Moodle
2. **Erreurs d'authentification** : Token invalide ou expiré
3. **Erreurs de permissions** : Utilisateur non autorisé
4. **Erreurs de données** : Données invalides ou manquantes

### Gestion des erreurs dans les composants

```typescript
try {
  const courses = await moodleService.getUserCourses(userId);
  setCourses(courses);
} catch (error) {
  if (error.message.includes('token')) {
    // Token invalide ou expiré
    console.error('Erreur d\'authentification');
    // Rediriger vers la page de connexion
  } else if (error.message.includes('permission')) {
    // Permissions insuffisantes
    console.error('Permissions insuffisantes');
  } else {
    // Erreur générale
    console.error('Erreur lors de la récupération des cours:', error);
  }
}
```

---

## Tests

### Tests unitaires

```typescript
// __tests__/moodleService.test.ts
import { moodleService } from '@/lib/services/moodleService';

describe('MoodleService', () => {
  it('devrait récupérer les cours d\'un utilisateur', async () => {
    const courses = await moodleService.getUserCourses(1);
    expect(Array.isArray(courses)).toBe(true);
  });

  it('devrait inscrire un utilisateur à un cours', async () => {
    const success = await moodleService.enrollUserInCourse(1, 1);
    expect(success).toBe(true);
  });
});
```

### Tests d'intégration

```bash
# Démarrer Moodle en local
cd /path/to/moodle
php -S localhost:8000

# Lancer les tests
npm run test
```

---

## Déploiement

### 1. Configuration Production

Mettre à jour les variables d'environnement:

```env
NEXT_PUBLIC_MOODLE_URL=https://moodle.mdsc.ci
NEXT_PUBLIC_MOODLE_TOKEN=votre_token_production
```

### 2. Vérifications pré-déploiement

- ✅ Token Moodle valide et testé
- ✅ Toutes les fonctions Web Services activées
- ✅ Permissions utilisateur correctes
- ✅ HTTPS activé sur Moodle
- ✅ CORS configuré sur Moodle

### 3. Monitoring

Surveiller les logs Moodle:
- `moodledata/logs/` pour les erreurs
- Tableau de bord **Rapports** → **Logs** dans Moodle

---

## Ressources

- [Documentation officielle Moodle Web Services](https://docs.moodle.org/dev/Web_services)
- [API Reference Moodle](https://docs.moodle.org/dev/Web_service_API_functions)
- [Forum Moodle](https://moodle.org/mod/forum/index.php)

---

## Support

Pour toute question ou problème:
- 📧 Email: support@mdsc.ci
- 💬 Discord: [MdSC Community](https://discord.gg/mdsc)
- 📖 Documentation: https://docs.mdsc.ci

---

**Dernière mise à jour** : Janvier 2024  
**Version** : 1.0.0

