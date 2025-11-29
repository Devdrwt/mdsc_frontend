# Spécifications Backend - Gestion des Cours en Live

## 📋 Vue d'ensemble

Ce document décrit les spécifications backend nécessaires pour supporter le nouveau workflow de gestion des cours en live implémenté côté frontend.

## 🎯 Objectif

Permettre aux instructeurs de configurer leurs cours en live via un workflow guidé en 4 étapes :
1. Récapitulatif des informations
2. Upload de support de cours (optionnel)
3. Création de l'évaluation finale (obligatoire)
4. Demande d'approbation admin

## 📝 Prérequis Backend

### 1. Validation des Cours en Live

#### Endpoint : `GET /api/courses/{courseId}`
**Modifications nécessaires :**
- Retourner le champ `course_type` avec les valeurs `'live'` ou `'on_demand'`
- S'assurer que les champs suivants sont présents pour les cours en live :
  - `enrollment_deadline` (obligatoire pour live)
  - `course_start_date` (obligatoire pour live)
  - `course_end_date` (obligatoire pour live)
  - `max_students` (obligatoire pour live)

**Exemple de réponse :**
```json
{
  "id": 1,
  "title": "Cours en Live",
  "course_type": "live",
  "enrollment_deadline": "2025-12-01T23:59:00Z",
  "course_start_date": "2025-12-02T08:00:00Z",
  "course_end_date": "2025-12-03T20:00:00Z",
  "max_students": 50,
  ...
}
```

### 2. Upload de Fichiers de Support

#### Endpoint : `POST /api/media/upload-bulk`
**Spécifications :**
- Accepter plusieurs fichiers en une seule requête
- Paramètres requis :
  - `files[]` : Tableau de fichiers
  - `file_category` : `'document'` pour les supports de cours
  - `course_id` : ID du cours
- Retourner un tableau des fichiers uploadés avec leurs métadonnées

**Exemple de requête :**
```
POST /api/media/upload-bulk
Content-Type: multipart/form-data

files[0]: [fichier PDF]
files[1]: [fichier Word]
file_category: document
course_id: 123
```

**Exemple de réponse :**
```json
[
  {
    "id": 1,
    "filename": "support_cours.pdf",
    "original_filename": "Support_Cours.pdf",
    "file_type": "application/pdf",
    "file_category": "document",
    "file_size": 1024000,
    "url": "https://storage.example.com/media/1/support_cours.pdf",
    "course_id": 123,
    "uploaded_at": "2025-11-26T10:00:00Z"
  }
]
```

#### Endpoint : `GET /api/media/course/{courseId}`
**Spécifications :**
- Retourner tous les fichiers média associés à un cours
- Filtrer par `file_category` si nécessaire
- Inclure les métadonnées complètes

**Exemple de réponse :**
```json
[
  {
    "id": 1,
    "filename": "support_cours.pdf",
    "file_category": "document",
    "url": "...",
    ...
  }
]
```

#### Endpoint : `DELETE /api/media/{mediaId}`
**Spécifications :**
- Supprimer un fichier média
- Vérifier que l'utilisateur a les droits (instructeur du cours)
- Retourner un statut de succès

### 3. Gestion de l'Évaluation Finale

#### Endpoint : `GET /api/evaluations/courses/{courseId}`
**Spécifications :**
- Retourner l'évaluation finale du cours si elle existe
- Retourner `null` ou `404` si aucune évaluation n'existe
- Inclure toutes les questions et leurs réponses

**Exemple de réponse :**
```json
{
  "id": 1,
  "course_id": 123,
  "title": "Évaluation finale",
  "description": "Évaluation pour obtenir le certificat",
  "type": "final",
  "is_final": true,
  "passing_score": 70,
  "duration_minutes": 60,
  "max_attempts": 3,
  "questions": [
    {
      "id": 1,
      "question": "Question 1?",
      "type": "multiple_choice",
      "options": [...],
      "correct_answer": "A",
      "points": 10
    }
  ],
  "created_at": "2025-11-26T10:00:00Z"
}
```

#### Endpoint : `POST /api/evaluations`
**Spécifications :**
- Créer une évaluation finale pour un cours
- Valider que :
  - Le cours existe
  - L'utilisateur est l'instructeur du cours
  - Le cours est de type `'live'` ou `'on_demand'`
  - Au moins une question est fournie
- Marquer automatiquement `is_final: true` et `type: 'final'`

**Exemple de requête :**
```json
{
  "course_id": 123,
  "title": "Évaluation finale",
  "description": "Évaluation pour obtenir le certificat",
  "passing_score": 70,
  "duration_minutes": 60,
  "max_attempts": 3,
  "questions": [...]
}
```

#### Endpoint : `PUT /api/evaluations/{evaluationId}`
**Spécifications :**
- Mettre à jour une évaluation finale existante
- Mêmes validations que pour la création
- Vérifier que l'évaluation appartient au cours de l'instructeur

### 4. Demande d'Approbation

#### Endpoint : `POST /api/courses/{courseId}/request-publication`
**Spécifications :**
- Valider que toutes les conditions sont remplies :
  - ✅ Titre valide (min. 5 caractères)
  - ✅ Description valide (min. 10 caractères)
  - ✅ Pour les cours en live :
    - `enrollment_deadline` défini
    - `course_start_date` défini
    - `course_end_date` défini
    - `max_students` défini et > 0
  - ✅ **Évaluation finale créée** (OBLIGATOIRE)
  - ✅ Au moins un module avec des leçons
- Changer le statut du cours à `'pending_approval'`
- Créer une notification pour tous les administrateurs
- Retourner le cours mis à jour

**Exemple de requête :**
```
POST /api/courses/123/request-publication
```

**Exemple de réponse :**
```json
{
  "id": 123,
  "title": "Cours en Live",
  "status": "pending_approval",
  "requested_at": "2025-11-26T10:00:00Z",
  ...
}
```

**Erreurs possibles :**
- `400 Bad Request` : Conditions non remplies (avec détails)
- `404 Not Found` : Cours introuvable
- `403 Forbidden` : L'utilisateur n'est pas l'instructeur du cours

**Messages d'erreur détaillés :**
```json
{
  "success": false,
  "message": "Conditions de publication non remplies",
  "errors": {
    "evaluation": "L'évaluation finale est obligatoire pour demander la publication",
    "max_students": "Le nombre maximum d'étudiants est obligatoire pour les cours en live",
    "enrollment_deadline": "La date limite d'inscription est obligatoire pour les cours en live"
  }
}
```

### 5. Validation Admin

#### Endpoint : `GET /api/admin/courses/pending`
**Spécifications :**
- Retourner tous les cours en attente d'approbation
- Inclure les informations complètes :
  - Informations du cours
  - Informations de l'instructeur
  - Modules et leçons
  - **Évaluation finale** (si elle existe)
  - Fichiers de support (si disponibles)
- Filtrer par statut `'pending_approval'`

**Exemple de réponse :**
```json
{
  "courses": [
    {
      "id": 123,
      "title": "Cours en Live",
      "course_type": "live",
      "instructor": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "enrollment_deadline": "2025-12-01T23:59:00Z",
      "course_start_date": "2025-12-02T08:00:00Z",
      "course_end_date": "2025-12-03T20:00:00Z",
      "max_students": 50,
      "modules": [...],
      "final_evaluation": {
        "id": 1,
        "title": "Évaluation finale",
        "questions_count": 10,
        ...
      },
      "support_files": [
        {
          "id": 1,
          "filename": "support.pdf",
          "url": "..."
        }
      ],
      "request_date": "2025-11-26T10:00:00Z",
      "status": "pending_approval"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### Endpoint : `POST /api/admin/courses/{courseId}/approve`
**Spécifications :**
- Approuver un cours en attente
- Vérifier que :
  - Le cours est en statut `'pending_approval'`
  - Toutes les conditions sont remplies (même validation que pour la demande)
  - **L'évaluation finale existe** (OBLIGATOIRE)
- Changer le statut à `'approved'` puis `'published'`
- Notifier l'instructeur de l'approbation
- Retourner le cours approuvé

**Exemple de requête :**
```
POST /api/admin/courses/123/approve
Content-Type: application/json

{
  "comments": "Cours approuvé avec succès"
}
```

#### Endpoint : `POST /api/admin/courses/{courseId}/reject`
**Spécifications :**
- Rejeter un cours en attente
- Changer le statut à `'rejected'`
- Notifier l'instructeur avec le motif de rejet
- Retourner le cours rejeté

**Exemple de requête :**
```json
{
  "reason": "Évaluation finale manquante",
  "comments": "Veuillez créer une évaluation finale avant de redemander l'approbation"
}
```

## 🔒 Règles Métier

### 1. Validation des Cours en Live

**Lors de la création :**
- `course_type: 'live'` → Tous les champs suivants sont **OBLIGATOIRES** :
  - `enrollment_deadline`
  - `course_start_date`
  - `course_end_date`
  - `max_students` (doit être > 0)

**Lors de la mise à jour :**
- Si `course_type` est changé de `'on_demand'` à `'live'` → Valider les champs obligatoires
- Si `course_type` est changé de `'live'` à `'on_demand'` → Les dates deviennent optionnelles

### 2. Évaluation Finale

**Règles :**
- **OBLIGATOIRE** pour tous les cours (live et on_demand) avant publication
- Un cours ne peut avoir qu'**une seule** évaluation finale
- L'évaluation finale doit avoir au moins **une question**
- Le `passing_score` doit être entre 0 et 100
- `max_attempts` doit être >= 1

**Validation lors de la demande d'approbation :**
- Si `final_evaluation` est `null` → **REJETER** la demande avec message d'erreur

### 3. Demande d'Approbation

**Conditions obligatoires :**
1. Titre : min. 5 caractères
2. Description : min. 10 caractères
3. Au moins un module avec des leçons
4. **Évaluation finale créée** (OBLIGATOIRE)
5. Pour les cours en live :
   - Dates définies et valides
   - `max_students` défini et > 0

**Workflow :**
```
draft → request-publication → pending_approval → (approve → published) | (reject → draft)
```

### 4. Certificats

**Règle importante :**
- Un étudiant ne peut obtenir un certificat que si :
  - Le cours a une évaluation finale
  - L'étudiant a complété tous les modules
  - L'étudiant a réussi l'évaluation finale (score >= passing_score)

## 📊 Modifications Base de Données

### Table `courses`
**Champs à vérifier/ajouter :**
- `course_type` : `ENUM('live', 'on_demand')` ou `VARCHAR` → **OBLIGATOIRE**
- `enrollment_deadline` : `DATETIME` → **OBLIGATOIRE pour live**
- `course_start_date` : `DATETIME` → **OBLIGATOIRE pour live**
- `course_end_date` : `DATETIME` → **OBLIGATOIRE pour live**
- `max_students` : `INTEGER` → **OBLIGATOIRE pour live, NULL pour on_demand**
- `status` : `ENUM('draft', 'pending_approval', 'approved', 'rejected', 'published')`

### Table `evaluations`
**Champs à vérifier :**
- `course_id` : `INTEGER` → Foreign key vers `courses`
- `type` : `ENUM('final', 'quiz', 'exam')` ou `VARCHAR`
- `is_final` : `BOOLEAN` → **TRUE pour l'évaluation finale**
- `passing_score` : `INTEGER` (0-100)
- `max_attempts` : `INTEGER` (>= 1)

**Contrainte :**
- Un cours ne peut avoir qu'**une seule** évaluation avec `is_final = true`

### Table `media_files`
**Champs à vérifier :**
- `course_id` : `INTEGER` → Foreign key vers `courses` (nullable)
- `file_category` : `ENUM('video', 'document', 'audio', 'image', 'presentation', 'h5p', 'other')`
- `uploaded_by` : `INTEGER` → Foreign key vers `users`

## 🔔 Notifications

### Notification : Demande d'approbation
**Déclencheur :** `POST /api/courses/{courseId}/request-publication`
**Destinataires :** Tous les administrateurs
**Type :** `course_moderation`
**Métadonnées :**
```json
{
  "course_id": 123,
  "course_title": "Cours en Live",
  "instructor_name": "John Doe",
  "action_url": "/dashboard/admin/courses?tab=pending"
}
```

### Notification : Cours approuvé
**Déclencheur :** `POST /api/admin/courses/{courseId}/approve`
**Destinataire :** Instructeur du cours
**Type :** `course_approved`
**Métadonnées :**
```json
{
  "course_id": 123,
  "course_title": "Cours en Live",
  "action_url": "/instructor/courses/123"
}
```

### Notification : Cours rejeté
**Déclencheur :** `POST /api/admin/courses/{courseId}/reject`
**Destinataire :** Instructeur du cours
**Type :** `course_rejected`
**Métadonnées :**
```json
{
  "course_id": 123,
  "course_title": "Cours en Live",
  "rejection_reason": "Évaluation finale manquante",
  "action_url": "/instructor/courses/123"
}
```

## ✅ Checklist Backend

### Endpoints à implémenter/vérifier :
- [ ] `GET /api/courses/{courseId}` - Retourner `course_type` et champs live
- [ ] `POST /api/media/upload-bulk` - Upload multiple fichiers avec `file_category`
- [ ] `GET /api/media/course/{courseId}` - Récupérer fichiers d'un cours
- [ ] `DELETE /api/media/{mediaId}` - Supprimer un fichier
- [ ] `GET /api/evaluations/courses/{courseId}` - Récupérer évaluation finale
- [ ] `POST /api/evaluations` - Créer évaluation finale
- [ ] `PUT /api/evaluations/{evaluationId}` - Mettre à jour évaluation
- [ ] `POST /api/courses/{courseId}/request-publication` - Demander approbation
- [ ] `GET /api/admin/courses/pending` - Liste cours en attente
- [ ] `POST /api/admin/courses/{courseId}/approve` - Approuver cours
- [ ] `POST /api/admin/courses/{courseId}/reject` - Rejeter cours

### Validations à implémenter :
- [ ] Validation champs obligatoires pour cours en live
- [ ] Validation évaluation finale obligatoire avant approbation
- [ ] Validation dates (enrollment_deadline < course_start_date < course_end_date)
- [ ] Validation max_students > 0 pour cours live
- [ ] Contrainte : une seule évaluation finale par cours

### Notifications à implémenter :
- [ ] Notification admin lors de demande d'approbation
- [ ] Notification instructeur lors d'approbation
- [ ] Notification instructeur lors de rejet

### Base de données :
- [ ] Vérifier champs `course_type`, dates, `max_students` dans table `courses`
- [ ] Vérifier contrainte évaluation finale unique par cours
- [ ] Vérifier champs `file_category` dans table `media_files`

## 📝 Notes Importantes

1. **Évaluation finale obligatoire** : C'est la règle la plus importante. Un cours ne peut pas être approuvé sans évaluation finale.

2. **Cours en live** : Les dates et `max_students` sont obligatoires uniquement pour les cours en live, pas pour les cours à la demande.

3. **Workflow** : Le workflow frontend guide l'instructeur étape par étape, mais le backend doit valider toutes les conditions à chaque étape.

4. **Certificats** : L'évaluation finale est nécessaire pour que les étudiants puissent obtenir un certificat. Cette règle doit être respectée côté backend lors de la génération des certificats.

## 🚀 Priorités

1. **Haute priorité** :
   - Validation évaluation finale obligatoire
   - Endpoint demande d'approbation avec validations complètes
   - Endpoint upload fichiers de support

2. **Priorité moyenne** :
   - Endpoints admin (approbation/rejet)
   - Notifications

3. **Priorité basse** :
   - Améliorations UX (messages d'erreur détaillés)

