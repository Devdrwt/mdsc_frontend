# Guide d'Implémentation - Alignement Frontend/Backend

## ✅ Types TypeScript - COMPLETÉ

Tous les types ont été mis à jour dans `src/types/course.ts` avec :
- Support du format backend (snake_case)
- Compatibilité avec l'ancien format (camelCase)
- Tous les nouveaux champs requis

## 🔧 Services à Mettre à Jour/Créer

### ✅ Créé : `moduleService.ts`
Fichier créé dans `src/lib/services/moduleService.ts`

### 📝 À Mettre à Jour : `mediaService.ts`
Remplacer le contenu par celui dans `src/lib/services/mediaService.update.ts`

### 📝 À Mettre à Jour : `courseService.ts`
Ajouter ces méthodes :

```typescript
// Récupérer un cours par slug
static async getCourseBySlug(slug: string): Promise<Course> {
  const response = await apiRequest(`/courses/slug/${slug}`, {
    method: 'GET',
  });
  return response.data;
}

// Récupérer les cours populaires
static async getPopularCourses(limit = 10): Promise<Course[]> {
  const response = await apiRequest(`/courses/popular?limit=${limit}`, {
    method: 'GET',
  });
  return response.data;
}

// Récupérer les cours recommandés
static async getRecommendedCourses(limit = 10): Promise<Course[]> {
  const response = await apiRequest(`/courses/recommended?limit=${limit}`, {
    method: 'GET',
  });
  return response.data;
}

// Vérifier si l'utilisateur est inscrit
static async checkEnrollment(courseId: number): Promise<{ is_enrolled: boolean; enrollment?: Enrollment }> {
  const response = await apiRequest(`/courses/${courseId}/check-enrollment`, {
    method: 'GET',
  });
  return response.data;
}
```

### 📝 À Mettre à Jour : `badgeService.ts`
Mettre à jour les routes :

```typescript
// Récupérer les badges de l'utilisateur
static async getUserBadges(): Promise<UserBadge[]> {
  const response = await apiRequest('/badges/user/my-badges', {
    method: 'GET',
  });
  return response.data;
}

// Vérifier l'éligibilité à un badge
static async checkBadgeEligibility(badgeId: number): Promise<{ eligible: boolean; progress?: number }> {
  const response = await apiRequest(`/badges/${badgeId}/check-eligibility`, {
    method: 'GET',
  });
  return response.data;
}

// Vérifier et attribuer automatiquement les badges
static async checkAndAwardBadges(): Promise<{ badges_awarded: Badge[] }> {
  const response = await apiRequest('/badges/check-and-award', {
    method: 'POST',
  });
  return response.data;
}
```

### 📝 À Mettre à Jour : `progressService.ts`
Mettre à jour toutes les méthodes pour utiliser les nouvelles routes :

```typescript
// Récupérer la progression d'une inscription
static async getEnrollmentProgress(enrollmentId: number): Promise<Progress[]> {
  const response = await apiRequest(`/progress/enrollment/${enrollmentId}`, {
    method: 'GET',
  });
  return response.data;
}

// Récupérer la progression d'un cours
static async getCourseProgress(courseId: number): Promise<CourseProgressStats> {
  const response = await apiRequest(`/progress/course/${courseId}`, {
    method: 'GET',
  });
  return response.data;
}

// Récupérer la progression d'une leçon
static async getLessonProgress(lessonId: number): Promise<Progress[]> {
  const response = await apiRequest(`/progress/lesson/${lessonId}`, {
    method: 'GET',
  });
  return response.data;
}

// Mettre à jour la progression d'une leçon
static async updateLessonProgress(
  enrollmentId: number,
  lessonId: number,
  data: {
    status: 'not_started' | 'in_progress' | 'completed';
    completion_percentage: number;
    time_spent: number;
  }
): Promise<Progress> {
  const response = await apiRequest(
    `/progress/enrollment/${enrollmentId}/lesson/${lessonId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// Marquer une leçon comme complétée
static async markLessonCompleted(
  enrollmentId: number,
  lessonId: number,
  timeSpent?: number
): Promise<Progress> {
  const response = await apiRequest(
    `/progress/enrollment/${enrollmentId}/lesson/${lessonId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ timeSpent }),
    }
  );
  return response.data;
}
```

### 📝 À Mettre à Jour : `enrollmentService.ts`
Modifier pour gérer les prérequis :

```typescript
static async enrollInCourse(courseId: number): Promise<Enrollment> {
  try {
    const response = await apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.prerequisite_course_id) {
      throw {
        ...error,
        prerequisite_course_id: error.response.data.prerequisite_course_id,
        message: error.response.data.message,
      };
    }
    throw error;
  }
}
```

### 📝 À Mettre à Jour : `certificateService.ts`
Ajouter la méthode de vérification publique :

```typescript
// Vérifier un certificat par code (PUBLIQUE - pas besoin d'auth)
static async verifyCertificate(code: string): Promise<{
  valid: boolean;
  certificate?: Certificate;
  message?: string;
}> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/certificates/verify/${code}`
  );
  const data = await response.json();
  return data;
}
```

### 📝 À Mettre à Jour : `quizService.ts`
Modifier `submitQuizAttempt` :

```typescript
static async submitQuizAttempt(
  quizId: number,
  answers: Record<number, any>
): Promise<QuizAttempt> {
  // Convertir en format {questionId: answer}
  const answersFormat: Record<string, any> = {};
  Object.keys(answers).forEach((questionId) => {
    answersFormat[questionId.toString()] = answers[questionId];
  });

  const response = await apiRequest(`/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers: answersFormat }),
  });
  return response.data;
}
```

## 🎨 Composants à Créer/Mettre à Jour

### Priorité HAUTE

1. **ModuleList Component** (NOUVEAU)
   - À créer dans `src/components/courses/ModuleList.tsx`
   - Affiche la liste des modules avec statut de déverrouillage

2. **CourseDetail Component** (MIS À JOUR)
   - Utiliser `getCourseBySlug` au lieu de `getCourseById`
   - Afficher structure modulaire
   - Gérer les prérequis

3. **LessonContent Component** (MIS À JOUR)
   - Utiliser `content_type` au lieu de `contentType`
   - Gérer tous les types de contenu selon le guide
   - Utiliser `content_url` et `content_text`

### Priorité MOYENNE

4. **Pages Routes** :
   - `/courses/[slug]` : Utiliser slug au lieu de ID
   - `/learn/[courseId]` : Afficher modules et déverrouillage
   - `/verify-certificate/[code]` : Page publique de vérification

## 🔄 Prochaines Étapes

1. Mettre à jour tous les services mentionnés ci-dessus
2. Créer le composant ModuleList
3. Mettre à jour CourseDetail et LessonContent
4. Implémenter la logique de déverrouillage progressif
5. Implémenter la gestion des prérequis

Voir le guide complet dans `COURSE_ARCHITECTURE.md` pour plus de détails.

