# Spécifications Backend - Gestion des Témoignages

## Vue d'ensemble

Le frontend attend une API REST pour gérer les témoignages affichés sur la page d'accueil. Les témoignages sont affichés dans un carousel avec défilement automatique.

## Structure de la base de données

### Table: `testimonials`

```sql
CREATE TABLE testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'ID de l\'étudiant qui a créé le témoignage',
  course_id INT NULL COMMENT 'ID du cours associé (optionnel, pour témoignages liés à un cours spécifique)',
  quote TEXT NOT NULL COMMENT 'Le texte du témoignage',
  author VARCHAR(255) NOT NULL COMMENT 'Le nom de l\'auteur du témoignage',
  title VARCHAR(255) NULL COMMENT 'Titre/fonction de l\'auteur (ex: Apprenant)',
  avatar VARCHAR(2) NULL COMMENT 'Initiales pour l\'avatar (optionnel, peut être généré depuis le nom)',
  rating TINYINT DEFAULT 5 COMMENT 'Note sur 5 étoiles (1-5)',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Statut de modération',
  rejection_reason TEXT NULL COMMENT 'Raison du rejet si le témoignage est rejeté',
  is_active BOOLEAN DEFAULT FALSE COMMENT 'Si le témoignage est actif et visible sur le site (seulement si approuvé)',
  display_order INT DEFAULT 0 COMMENT 'Ordre d\'affichage (pour trier les témoignages)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_course_id (course_id),
  INDEX idx_is_active (is_active)
);
```

## Endpoints API requis

### Base URL

Tous les endpoints sont préfixés par `/api/testimonials` (ou selon votre convention d'API)

### 1. GET `/testimonials` - Récupérer les témoignages

**Description**: Récupère la liste des témoignages

**Query Parameters (optionnels)**:

- `limit` (int): Nombre maximum de témoignages à retourner
- `order` (string): `asc` ou `desc` - Ordre de tri
- `order_by` (string): `display_order` ou `created_at` - Champ de tri

**Réponse attendue**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quote": "Les formations MdSC m'ont permis d'acquérir des compétences essentielles...",
      "author": "CC Christelle Cakpa",
      "title": "Formatrice certifiée",
      "avatar": "CC",
      "rating": 5,
      "is_active": true,
      "display_order": 0,
      "course_id": 123,
      "course_title": "Introduction au Management",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**OU** (structure alternative acceptée):

```json
{
  "testimonials": [
    {
      "id": 1,
      "quote": "...",
      "author": "...",
      ...
    }
  ],
  "total": 10
}
```

**Filtrage**:

- Par défaut, retourner uniquement les témoignages avec `is_active = true` ET `status = 'approved'`
- Si l'utilisateur est admin, retourner tous les témoignages (y compris en attente) si `includePending=true` est passé en paramètre

**Tri par défaut**: Par `display_order` ASC, puis par `id` ASC

---

### 2. GET `/testimonials/:id` - Récupérer un témoignage spécifique

**Description**: Récupère un témoignage par son ID

**Réponse attendue**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "quote": "...",
    "author": "...",
    "title": "...",
    "avatar": "CC",
    "rating": 5,
    "is_active": true,
    "display_order": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. GET `/testimonials/my` - Récupérer mes témoignages (Étudiant)

**Description**: Récupère les témoignages de l'étudiant connecté

**Headers**:

```
Authorization: Bearer <student_token>
```

**Réponse attendue**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quote": "...",
      "author": "...",
      "status": "pending",
      "is_active": false,
      ...
    }
  ]
}
```

---

### 4. POST `/testimonials` - Créer un témoignage (Étudiant ou Admin)

**Description**: Crée un nouveau témoignage. Les étudiants créent des témoignages en attente de modération.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (pour les étudiants):

```json
{
  "quote": "Le texte du témoignage...",
  "rating": 5,
  "course_id": 123
}
```

**Note**: `course_id` est optionnel. Si fourni, le témoignage sera lié à un cours spécifique. Les étudiants créent généralement des témoignages depuis la page des favoris en cliquant sur un cours.

**Body** (pour les admins - tous les champs peuvent être fournis):

```json
{
  "quote": "Le texte du témoignage...",
  "author": "Nom de l'auteur",
  "title": "Titre/Fonction (optionnel)",
  "avatar": "CC (optionnel, 2 caractères max)",
  "rating": 5,
  "is_active": true,
  "display_order": 0,
  "course_id": 123
}
```

**Comportement**:

- **Pour les étudiants**:
  - `author`, `title`, `avatar` sont automatiquement remplis depuis le profil de l'utilisateur
  - `status` est automatiquement défini à `'pending'`
  - `is_active` est automatiquement défini à `false`
  - `user_id` est automatiquement rempli avec l'ID de l'utilisateur connecté
  - `course_id` peut être fourni si le témoignage est créé depuis la page des favoris pour un cours spécifique
- **Pour les admins**: Tous les champs peuvent être fournis manuellement

**Validation**:

- `quote`: Requis, minimum 20 caractères
- `rating`: Optionnel, entre 1 et 5, défaut: 5
- Pour les admins uniquement: `author`, `title`, `avatar`, `is_active`, `display_order`

**Réponse attendue**:

```json
{
  "success": true,
  "message": "Témoignage créé avec succès",
  "data": {
    "id": 1,
    "quote": "...",
    "author": "...",
    ...
  }
}
```

---

### 5. PUT `/testimonials/:id` - Mettre à jour un témoignage (Admin seulement)

**Description**: Met à jour un témoignage existant

**Headers**:

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body** (tous les champs sont optionnels, seuls les champs fournis seront mis à jour):

```json
{
  "quote": "Nouveau texte...",
  "author": "Nouveau nom",
  "title": "Nouveau titre",
  "avatar": "AB",
  "rating": 4,
  "is_active": false,
  "display_order": 2,
  "course_id": 123
}
```

**Réponse attendue**:

```json
{
  "success": true,
  "message": "Témoignage mis à jour avec succès",
  "data": {
    "id": 1,
    "quote": "Nouveau texte...",
    ...
  }
}
```

---

### 6. DELETE `/testimonials/:id` - Supprimer un témoignage (Admin seulement)

**Description**: Supprime un témoignage

**Headers**:

```
Authorization: Bearer <admin_token>
```

**Réponse attendue**:

```json
{
  "success": true,
  "message": "Témoignage supprimé avec succès"
}
```

---

### 7. POST `/testimonials/:id/approve` - Approuver un témoignage (Admin seulement)

**Description**: Approuve un témoignage en attente et le rend visible sur le site

**Headers**:

```
Authorization: Bearer <admin_token>
```

**Réponse attendue**:

```json
{
  "success": true,
  "message": "Témoignage approuvé avec succès",
  "data": {
    "id": 1,
    "status": "approved",
    "is_active": true,
    ...
  }
}
```

**Comportement**:

- Met à jour `status` à `'approved'`
- Met à jour `is_active` à `true`
- Le témoignage devient visible sur la page d'accueil

---

### 8. POST `/testimonials/:id/reject` - Rejeter un témoignage (Admin seulement)

**Description**: Rejette un témoignage en attente

**Headers**:

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:

```json
{
  "reason": "Raison du rejet (optionnel)"
}
```

**Réponse attendue**:

```json
{
  "success": true,
  "message": "Témoignage rejeté",
  "data": {
    "id": 1,
    "status": "rejected",
    "rejection_reason": "Raison du rejet",
    "is_active": false,
    ...
  }
}
```

**Comportement**:

- Met à jour `status` à `'rejected'`
- Met à jour `is_active` à `false`
- Enregistre la raison du rejet si fournie
- Le témoignage n'est pas visible sur la page d'accueil

---

## Gestion des erreurs

Toutes les erreurs doivent suivre ce format:

```json
{
  "success": false,
  "message": "Message d'erreur descriptif",
  "errors": [
    {
      "field": "quote",
      "message": "Le texte du témoignage est requis"
    }
  ]
}
```

**Codes HTTP**:

- `200`: Succès
- `201`: Créé avec succès
- `400`: Erreur de validation
- `401`: Non authentifié
- `403`: Non autorisé (pas admin)
- `404`: Témoignage non trouvé
- `500`: Erreur serveur

---

## Notes importantes

1. **Création par les étudiants**:

   - Les étudiants peuvent créer des témoignages via `POST /testimonials`
   - Les étudiants créent généralement des témoignages depuis la page des favoris (`/dashboard/student/favorites`) en cliquant sur le bouton "Faire un témoignage" d'un cours
   - Les témoignages créés par les étudiants sont automatiquement en statut `pending` et `is_active = false`
   - Les informations de l'auteur (`author`, `title`, `avatar`) sont automatiquement remplies depuis le profil de l'étudiant
   - `user_id` doit être automatiquement rempli avec l'ID de l'utilisateur connecté
   - `course_id` peut être fourni si le témoignage est lié à un cours spécifique
   - Si `course_id` est fourni, le backend doit inclure `course_title` dans la réponse pour l'affichage dans l'interface admin

2. **Modération par les admins**:

   - Les admins peuvent voir tous les témoignages (y compris en attente) via `GET /testimonials?includePending=true`
   - Les admins peuvent approuver (`POST /testimonials/:id/approve`) ou rejeter (`POST /testimonials/:id/reject`) les témoignages
   - Seuls les témoignages avec `status = 'approved'` ET `is_active = true` sont visibles sur la page d'accueil

3. **Sécurité**:

   - Les étudiants ne peuvent créer que leurs propres témoignages
   - Les endpoints de modération (approve/reject) nécessitent une authentification admin
   - Les endpoints de modification/suppression nécessitent une authentification admin

4. **Filtrage**:

   - Par défaut, `GET /testimonials` retourne uniquement les témoignages avec `status = 'approved'` ET `is_active = true`
   - Pour les admins avec `includePending=true`, retourner tous les témoignages

5. **Tri**: Les témoignages doivent être triés par `display_order` ASC par défaut

6. **Avatar**: Si `avatar` est vide, le frontend génère automatiquement les initiales depuis le nom de l'auteur

7. **Ordre d'affichage**: Permet de réorganiser l'ordre des témoignages dans le carousel (uniquement pour les témoignages approuvés)

---

## Exemple de données de test

```sql
INSERT INTO testimonials (quote, author, title, avatar, rating, is_active, display_order) VALUES
('Les formations MdSC m\'ont permis d\'acquérir des compétences essentielles en management. Je recommande vivement cette plateforme !', 'CC Christelle Cakpa', 'Formatrice certifiée', 'CC', 5, TRUE, 0),
('Une plateforme excellente avec des cours de qualité. Les certificats ont renforcé la confiance de mes apprenants.', 'CC Christelle Cakpa', 'Formatrice certifiée', 'CC', 5, TRUE, 1),
('Interface intuitive, contenu riche et accompagnement de qualité. C\'est un outil indispensable pour la société civile.', 'CC Christelle Cakpa', 'Formatrice certifiée', 'CC', 5, TRUE, 2);
```

---

## Questions ou clarifications

Si vous avez des questions sur ces spécifications, n'hésitez pas à contacter l'équipe frontend.
