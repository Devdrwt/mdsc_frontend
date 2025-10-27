# 📋 Formulaires - Structure Professionnelle MdSC

## 🏥 HIÉRARCHIE COMPLÈTE

```
DOMAINE (Admin) → MODULE (Instructor) → COURS → SÉQUENCE → CONTENU
```

---

## ✅ FORMULAIRES DÉJÀ IMPLÉMENTÉS

### 1. **DomainManagement** (Admin) ✅
- Création/Modification/Suppression de domaines
- Attributs: name, description, icon, color
- Page: `/dashboard/admin/domains`

### 2. **ModuleManagement** (Instructor) ✅
- Création/Modification/Suppression de modules
- Attributs: domain_id, title, description, difficulty, price, duration, certification
- Page: `/dashboard/instructor/modules`

### 3. **CourseManagement** (Instructor) ✅ (Existant)
- Création/Modification de cours
- Page: `/dashboard/instructor/courses`

---

## 📝 FORMULAIRES À IMPLÉMENTER

### Niveau 1: SÉQUENCES (Instructor)

**Fichier:** `src/components/dashboard/instructor/SequenceManagement.tsx`  
**Page:** `/dashboard/instructor/sequences`  
**Détails:**

#### Champs du Formulaire:
```typescript
{
  course_id: number;           // Cours parent
  title: string;               // Nom de la séquence
  description: string;         // Description détaillée
  sequence_order: number;      // Ordre dans le cours
  has_mini_control: boolean;   // Avoir un mini-contrôle
  mini_control_points: number; // Points du mini-contrôle
  is_published: boolean;       // Statut de publication
}
```

#### Actions:
- ✅ Créer une séquence
- ✅ Modifier une séquence
- ✅ Supprimer une séquence
- ✅ Réordonner les séquences (Drag & Drop)
- ✅ Activer/Désactiver mini-contrôle
- ✅ Publier/Dépublier

---

### Niveau 2: CONTENUS DE SÉQUENCE (Instructor)

**Fichier:** `src/components/dashboard/instructor/SequenceContentManagement.tsx`  
**Page:** `/dashboard/instructor/sequences/[id]/contents`  
**Détails:**

#### Types de Contenus:
1. **PDF** 📄
   - Upload de fichier PDF
   - Nom, description, durée estimée
   
2. **VIDÉO** 🎥
   - URL de la vidéo (YouTube, Vimeo, etc.)
   - Durée en minutes
   - Sous-titres (optionnel)

3. **LIVE** 🔴
   - Planification de cours en direct
   - Date/Heure
   - Lien de participation (Zoom, Teams, etc.)

4. **QUIZ** 📝
   - Questions/Réponses
   - Score de passage
   - Limite de temps

5. **EXERCICE** 💪
   - Instructions
   - Correction automatique ou manuelle
   - Solution attendue

#### Champs du Formulaire:
```typescript
{
  sequence_id: number;         // Séquence parente
  title: string;               // Titre du contenu
  description: string;         // Description
  content_type: 'pdf' | 'video' | 'live' | 'quiz' | 'exercise';
  content_url: string;         // URL ou chemin du fichier
  content_order: number;       // Ordre dans la séquence
  is_required: boolean;        // Contenu obligatoire
  duration_minutes: number;    // Durée estimée
}
```

#### Actions:
- ✅ Ajouter un contenu
- ✅ Modifier un contenu
- ✅ Supprimer un contenu
- ✅ Réordonner les contenus
- ✅ Upload de fichiers (PDF, images, etc.)
- ✅ Prévisualisation du contenu

---

### Niveau 3: MINI-CONTRÔLES (Instructor)

**Fichier:** `src/components/dashboard/instructor/MiniControlManagement.tsx`  
**Page:** `/dashboard/instructor/sequences/[id]/mini-control`  
**Détails:**

#### Champs du Formulaire:
```typescript
{
  sequence_id: number;         // Séquence associée
  title: string;               // Titre du mini-contrôle
  questions: Question[];       // Liste des questions
  passing_score: number;       // Score minimum requis (0-100)
  badge_id?: number;           // Badge débloqué si réussi
  time_limit?: number;         // Limite de temps en minutes
}
```

#### Question Structure:
```typescript
{
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options: string[];  // Pour multiple-choice
  correct_answer: string | string[];
  points: number;
  explanation?: string;
}
```

#### Actions:
- ✅ Créer un mini-contrôle
- ✅ Ajouter des questions
- ✅ Configurer les scores
- ✅ Associer des badges
- ✅ Prévisualiser le quiz

---

## 🎓 FORMULAIRES ÉTUDIANT

### ModuleCatalog (Student) 📚

**Fichier:** `src/components/dashboard/student/ModuleCatalog.tsx`  
**Page:** `/dashboard/student/modules`  
**Détails:**

#### Actions Étudiant:
- ✅ Parcourir les modules disponibles
- ✅ Filtrer par domaine
- ✅ Filtrer par difficulté
- ✅ Rechercher des modules
- ✅ Voir les détails d'un module
- ✅ S'inscrire à un module
- ✅ Voir la progression

---

### ModulePlayer (Student) 🎬

**Fichier:** `src/components/dashboard/student/ModulePlayer.tsx`  
**Page:** `/dashboard/student/modules/[id]/learn`  
**Détails:**

#### Actions Étudiant:
- ✅ Naviguer entre les cours du module
- ✅ Consulter les séquences
- ✅ Visualiser les contenus (PDF, vidéo, live)
- ✅ Passer les mini-contrôles
- ✅ Voir la progression globale
- ✅ Marquer comme complété
- ✅ Obtenir des badges
- ✅ Télécharger les certificats

---

### SequencePlayer (Student) 📖

**Fichier:** `src/components/dashboard/student/SequencePlayer.tsx`  
**Composant intégré dans ModulePlayer**

#### Fonctionnalités:
- ✅ Lecture séquentielle des contenus
- ✅ Player vidéo intégré
- ✅ Lecteur PDF
- ✅ Formulaire de quiz interactif
- ✅ Résultats instantanés
- ✅ Badges et récompenses

---

## 🔧 FORMULAIRES ADMINISTRATEUR

### UserManagement (Admin) 👥

**Statut:** Déjà implémenté  
**Page:** `/dashboard/admin/users`

---

### SystemSettings (Admin) ⚙️

**Fichier:** `src/components/dashboard/admin/SystemSettings.tsx`  
**Page:** `/dashboard/admin/settings`  
**Formulaire:**
- Configuration système
- Paramètres de certification
- Configuration des badges
- Paramètres de paiement

---

## 📊 PRIORITÉ D'IMPLÉMENTATION

### ✅ Priorité 1 - Essentiel (Déjà fait)
1. ✅ DomainManagement (Admin)
2. ✅ ModuleManagement (Instructor)
3. ✅ CourseManagement (Instructor)

### 🔴 Priorité 2 - Important
4. **SequenceManagement** (Instructor)
5. **SequenceContentManagement** (Instructor)
6. **ModuleCatalog** (Student)

### 🟡 Priorité 3 - Nice to have
7. **ModulePlayer** (Student)
8. **SequencePlayer** (Student)
9. **MiniControlManagement** (Instructor)

### 🟢 Priorité 4 - Avancé
10. **Badge Management** (Instructor/Admin)
11. **Certificate Generation** (System)
12. **Analytics Dashboard** (All)

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

1. **SéquenceManagement** - Formulaires pour créer/gérer les séquences
2. **SequenceContentManagement** - Upload et gestion des contenus
3. **ModuleCatalog** - Interface étudiants pour parcourir les modules
4. **ModulePlayer** - Lecteur de module avec navigation

---

## 📝 NOTES IMPORTANTES

- Tous les formulaires doivent respecter la structure hiérarchique
- Validation côté client ET serveur obligatoire
- Upload de fichiers via `FileService` existant
- Drag & Drop pour réordonner les contenus
- Prévisualisation en temps réel
- Responsive design pour mobile/tablette
