# 📚 Parcours Utilisateurs Complet - Plateforme MdSC MOOC

## 🎓 Table des matières

1. [Inscription et Authentification](#inscription-et-authentification)
2. [Parcours Instructeur - Gestion des Cours](#parcours-instructeur)
3. [Parcours Étudiant - Accès et Suivi des Cours](#parcours-étudiant)
4. [Parcours Administrateur](#parcours-administrateur)
5. [Fonctionnalités Transversales](#fonctionnalités-transversales)
6. [Flux de Navigation](#flux-de-navigation)

---

## 🔐 Inscription et Authentification

### 1. Inscription

**Route :** `/register`

**Processus d'inscription :**

#### 1.1 Sélection du Rôle
- 👤 **Étudiant** : Accès aux cours et formations
- 👨‍🏫 **Instructeur** : Création et gestion de cours
- 🛡️ **Administrateur** : Gestion de la plateforme (sur invitation uniquement, **connexion séparée**)

#### 1.2 Formulaire d'Inscription Multi-Étapes

**Étape 1 : Informations Personnelles**
- Prénom (obligatoire)
- Nom (obligatoire)
- Email (obligatoire, validation format)
- Mot de passe (obligatoire, min 8 caractères)
- Confirmation du mot de passe
- Téléphone (optionnel)
- Pays (obligatoire)

**Étape 2 : Informations Professionnelles (selon le rôle)**
- **Pour Étudiant :**
  - Organisation (optionnel)
  - Domaine d'intérêt (optionnel)
  
- **Pour Instructeur :**
  - Organisation (obligatoire)
  - Domaine d'expertise (obligatoire)
  - Biographie professionnelle (optionnel)
  - Portfolio/Lien professionnel (optionnel)

**Étape 3 : Confirmation**
- Vérification des informations saisies
- Acceptation des conditions d'utilisation
- Acceptation de la politique de confidentialité
- Validation du formulaire

#### 1.3 Vérification par Email
- 📧 Envoi automatique d'un email de vérification
- 🔗 Lien de vérification avec token unique
- ⏱️ Token valide pendant 24 heures
- 🔄 Possibilité de renvoyer l'email de vérification
- ✅ Redirection vers la page de connexion après vérification

**Composant :** `EmailVerification.tsx`

### 2. Connexion

**⚠️ IMPORTANT : Sécurité des Administrateurs**

La connexion des administrateurs est **totalement séparée** de la voie normale des autres utilisateurs (étudiants et instructeurs) pour des raisons de sécurité renforcée.

#### 2.1 Connexion Étudiants et Instructeurs

**Route :** `/login`

**Méthodes de connexion :**

- **Connexion Classique :**
  - Email
  - Mot de passe
  - Case "Se souvenir de moi" (optionnel)

- **Connexion Sociale (Optionnel) :**
  - 🔵 **Google OAuth** : Connexion via compte Google
  - 🔵 **Facebook** : Connexion via compte Facebook
  - 🔷 **LinkedIn** : Connexion via compte LinkedIn

#### 2.2 Connexion Administrateur

**Route :** `/admin/login` (route séparée et sécurisée)

**Méthodes de connexion :**

- **Connexion Sécurisée :**
  - Email administrateur (domaine spécifique ou liste blanche)
  - Mot de passe fort (min 12 caractères, obligatoire)
  - Authentification à deux facteurs (2FA) **OBLIGATOIRE**
  - Vérification IP (optionnel, pour sécurité renforcée)
  - Pas de connexion sociale (Google OAuth, Facebook, etc.)

**Sécurité renforcée :**
- 🔐 Session timeout plus court (30 minutes d'inactivité)
- 🔒 Logs détaillés de toutes les actions administratives
- 🛡️ Protection contre les attaques par force brute
- 📊 Monitoring des tentatives de connexion
- 🔔 Alertes en cas de connexion suspecte

#### 2.3 Gestion des Sessions
- JWT Access Token (valide 1 heure)
- Refresh Token (valide 7 jours)
- Stockage sécurisé dans le navigateur
- Déconnexion automatique après expiration

### 3. Gestion du Mot de Passe

#### 3.1 Mot de Passe Oublié
- **Route :** `/forgot-password`
- Saisie de l'email
- Envoi d'un lien de réinitialisation par email
- Token unique avec expiration (1 heure)

#### 3.2 Réinitialisation du Mot de Passe
- **Route :** `/reset-password?token=...`
- Saisie du nouveau mot de passe
- Confirmation du nouveau mot de passe
- Validation et mise à jour

### 4. Profil Utilisateur

#### 4.1 Accès au Profil
- **Route :** `/dashboard/[role]/profile`
- Informations personnelles
- Informations professionnelles
- Photo de profil
- Préférences

#### 4.2 Modification du Profil
- Édition des informations
- Upload de photo de profil
- Changement de mot de passe
- Gestion des notifications

---

## 👨‍🏫 Parcours Instructeur - Gestion des Cours

### 1. Accès au Dashboard Instructeur

**Route :** `/dashboard/instructor`

**Accès :** Authentification requise (rôle `instructor`)

**Fonctionnalités du Dashboard :**

#### 1.1 Statistiques Globales
- 📚 **Nombre total de cours** :
  - Cours publiés
  - Cours en brouillon
  - Cours en attente de validation
  
- 👥 **Nombre total d'étudiants** :
  - Tous les étudiants inscrits
  - Étudiants actifs (30 derniers jours)
  - Nouveaux étudiants (ce mois)
  
- 💰 **Revenus** :
  - Revenus totaux
  - Revenus du mois
  - Revenus de la semaine
  - Évolution mensuelle (%)
  
- ⭐ **Note moyenne** :
  - Note moyenne globale de tous les cours
  - Évolution de la note
  
- 📊 **Taux de complétion** :
  - Pourcentage moyen de complétion des cours
  - Évolution du taux
  
- 👁️ **Vues mensuelles** :
  - Nombre de vues des cours
  - Évolution mensuelle (%)

#### 1.2 Graphiques et Tendances
- 📈 Graphique des inscriptions hebdomadaires
- 📊 Graphique de performance par cours
- 📉 Graphique de progression des revenus

#### 1.3 Cours Récents et Performances
- 📋 Liste des cours récemment créés/modifiés
- 📊 Performance de chaque cours :
  - Nombre d'inscrits
  - Taux de complétion
  - Note moyenne
  - Revenus générés

#### 1.4 Activités Récentes
- ✅ Nouveaux étudiants inscrits
- 💬 Nouvelles évaluations/comments
- 📝 Soumissions de quiz
- 🎓 Certificats délivrés
- 📊 Cours publiés/approuvés

#### 1.5 Actions Rapides
- ➕ Créer un nouveau cours
- 📊 Voir les analytics détaillés
- 👥 Gérer les étudiants
- ⚙️ Accéder aux paramètres

### 2. Liste des Cours (Gestion des Cours)

**Route :** `/dashboard/instructor/courses`

**Composant :** `CourseManagement.tsx`

**Fonctionnalités :**

#### 2.1 Consultation des Cours
- 📋 Affichage de tous les cours de l'instructeur dans un tableau
- 🔍 Recherche par titre, catégorie, statut
- 🔄 Filtrage par statut (Tous / Publié / Brouillon)
- 📊 Affichage du statut (Publié / Brouillon)
- 📈 Statistiques par cours (nombre d'étudiants, progression, etc.)

#### 2.2 Création d'un Nouveau Cours
- ➕ Bouton "Créer un cours"
- Formulaire de création avec les champs :
  - **Informations de base :**
    - Titre (5-255 caractères)
    - Description complète (min. 10 caractères)
    - Description courte
    - Catégorie (liste déroulante)
    - Langue (Français, Anglais, etc.)
    - Niveau de difficulté (Débutant, Intermédiaire, Avancé)
  
  - **Médias :**
    - Image de couverture (thumbnail)
    - Vidéo de présentation (optionnelle)
  
  - **Paramètres :**
    - Prix et devise (XOF)
    - Durée estimée (en minutes)
    - Cours prérequis (optionnel)
    - **Type de cours :**
      - Cours en Live (en direct) ou Cours à la demande
      - Si "Cours en Live" est sélectionné :
        - ⚠️ **OBLIGATOIRE** : Date limite d'inscription
        - ⚠️ **OBLIGATOIRE** : Date de début du cours
        - ⚠️ **OBLIGATOIRE** : Date de fin du cours
        - ⚠️ **OBLIGATOIRE** : Nombre maximum d'étudiants
      - Si "Cours à la demande" est sélectionné :
        - Date limite d'inscription (optionnel)
        - Date de début du cours (optionnel)
        - Date de fin du cours (optionnel)
        - Nombre maximum d'étudiants (optionnel)

- ✅ Validation et création du cours
- 🔄 Redirection vers la page de détail du cours

#### 2.3 Actions sur les Cours Existants
- 👁️ **Voir les détails** → Redirection vers `/instructor/courses/[courseId]`
- ✏️ **Modifier** → Modal d'édition (même formulaire que création)
- 🗑️ **Supprimer** → Confirmation puis suppression
- 📊 **Statistiques** → Voir les métriques du cours
- 👥 **Gérer les étudiants** → Liste des inscrits
- 📈 **Analytics** → Graphiques et analyses détaillées
- 📝 **Dupliquer** → Créer une copie du cours
- 🔗 **Partager** → Générer un lien de partage

### 3. Page de Détail d'un Cours

**Route :** `/instructor/courses/[courseId]`

**Composant :** `InstructorCourseDetailPage`

**Onglets disponibles :**

#### 3.1 Onglet "Modules" (📚)
- 📋 Liste des modules du cours
- ➕ Créer un nouveau module
- ✏️ Modifier un module existant
- 🗑️ Supprimer un module
- 🔄 Réorganiser les modules (drag & drop)
- 👁️ Aperçu du contenu du module
- 🖼️ **Image de présentation du module :**
  - Chaque module peut avoir une image de présentation
  - L'image de présentation du module est utilisée pour l'affichage du module
- 🎯 **Création de Quiz pour Module (Optionnel)** :
  - L'instructeur peut choisir d'ajouter un quiz à la fin d'un module
  - Le quiz est optionnel et permet à l'étudiant d'obtenir un badge
  - Le quiz peut contenir des questions à choix multiples, vrai/faux, etc.
  - Score minimum requis pour valider le quiz et obtenir le badge

**Composant :** `ModuleManagement.tsx`

#### 3.2 Onglet "Leçons" (📖)
- 📋 Liste de toutes les leçons du cours (tous modules confondus)
- ➕ Créer une nouvelle leçon
- ✏️ Modifier une leçon existante
- 🗑️ Supprimer une leçon
- 📊 Affichage des informations :
  - Titre, description
  - Type de contenu (vidéo, texte, quiz, H5P, etc.)
  - Durée
  - Module parent
  - Ordre d'affichage
  - Statut (publié/brouillon)
  - Obligatoire/Optionnel

**Composant :** `LessonManagement.tsx`

**Formulaire de création/édition de leçon :**
- Titre
- Description
- Type de contenu (vidéo, texte, quiz, document, audio, présentation)
- URL du contenu ou contenu texte
- Durée (en minutes)
- Module parent (sélection)
- Ordre dans le module
- Statut de publication
- Obligatoire/Optionnel

#### 3.3 Onglet "Médias" (🎬)
- 📁 Liste des fichiers multimédias du cours
- ⬆️ Upload de nouveaux médias
- 🗑️ Supprimer des médias
- 📋 Gestion des médias utilisés dans les leçons

**Composant :** `MediaUpload.tsx`

#### 3.4 Onglet "Paramètres" (⚙️)
- ✅ **Publication :**
  - Activer/Désactiver la publication
  - Mettre en avant (featured)
  
- 🎥 **Type de cours :**
  - Cours en Live (en direct)
  - Cours à la demande
  
- 💰 **Prix et Inscription :**
  - Prix et devise
  
- 📅 **Dates et Capacité (selon le type de cours) :**
  - **Si cours en Live :**
    - ⚠️ **OBLIGATOIRE** : Date limite d'inscription
    - ⚠️ **OBLIGATOIRE** : Date de début du cours
    - ⚠️ **OBLIGATOIRE** : Date de fin du cours
    - ⚠️ **OBLIGATOIRE** : Nombre maximum d'étudiants
  - **Si cours à la demande :**
    - Date limite d'inscription (optionnel)
    - Date de début du cours (optionnel)
    - Date de fin du cours (optionnel)
    - Nombre maximum d'étudiants (optionnel)
  
- 🌐 **Langue :**
  - Langue du cours

- 💾 Sauvegarde automatique des paramètres

#### 3.5 Onglet "Évaluations" (📝) - **OBLIGATOIRE**
- ⚠️ **Création impérative d'une évaluation pour le cours**
- 📝 L'évaluation finale est obligatoire pour permettre aux étudiants d'obtenir un certificat
- ➕ Créer une évaluation pour le cours
- ✏️ Modifier l'évaluation existante
- 📊 Configuration de l'évaluation :
  - Nombre de questions
  - Types de questions (QCM, vrai/faux, questions ouvertes)
  - Score minimum requis pour validation (%)
  - Durée de l'évaluation (si limitée)
  - Nombre de tentatives autorisées
- ✅ Validation : L'évaluation doit être créée avant la publication du cours

**Composant :** `EvaluationManagement.tsx` ou `QuizBuilder.tsx`

### 4. Gestion des Modules

**Route :** `/dashboard/instructor/modules`

**Composant :** `ModuleManagement.tsx`

**Fonctionnalités :**
- 📋 Liste de tous les modules de tous les cours
- 🔍 Recherche et filtrage par cours
- ➕ Créer un module
- ✏️ Modifier un module
- 🗑️ Supprimer un module
- 📊 Ordre des modules
- 📖 Gérer les leçons d'un module

### 5. Publication et Disponibilité

**Processus de publication :**

1. **Création du cours** → Statut : "Brouillon"
2. **Ajout de contenu** :
   - Créer au moins un module
   - Ajouter des leçons dans le module
   - Uploader des médias si nécessaire
   - Créer des quiz pour les modules (optionnel, pour badges)
3. **Création de l'évaluation finale** :
   - ⚠️ **OBLIGATOIRE** : Créer une évaluation pour le cours
   - Cette évaluation est nécessaire pour l'obtention du certificat
4. **Configuration des paramètres** :
   - Remplir toutes les informations requises
   - Définir le prix (si payant)
   - Sélectionner le type de cours (Live ou à la demande)
   - **Si cours en Live :** Définir les dates obligatoires et le nombre maximum d'étudiants
   - **Si cours à la demande :** Les dates sont optionnelles
5. **Demande de publication** :
   - Activer "is_published" dans l'onglet Paramètres
   - Le cours passe en statut "En attente de validation"
6. **Validation par l'Administrateur** :
   - ⚠️ **OBLIGATOIRE** : L'admin doit valider le cours avant publication
   - L'admin vérifie :
     - La qualité du contenu
     - La complétude du cours (modules, leçons, évaluation)
     - La conformité aux règles de la plateforme
   - L'admin peut :
     - ✅ Approuver le cours → Statut "Publié"
     - ❌ Rejeter le cours → Retour à "Brouillon" avec commentaires
7. **Publication effective** :
   - Une fois validé par l'admin, le cours devient visible dans le catalogue
   - Le statut passe à "Publié" dans la liste des cours

**Validations requises pour la demande de publication :**
- ✅ Titre (5-255 caractères)
- ✅ Description (min. 10 caractères)
- ✅ Au moins un module avec au moins une leçon
- ✅ **Évaluation finale créée** (obligatoire)
- ✅ Tous les champs requis remplis
- ✅ **Si cours en Live :**
  - ✅ Nombre maximum d'étudiants (entier positif) - **OBLIGATOIRE**
  - ✅ Date limite d'inscription - **OBLIGATOIRE**
  - ✅ Date de début du cours - **OBLIGATOIRE**
  - ✅ Date de fin du cours - **OBLIGATOIRE**
- ✅ **Si cours à la demande :** Les dates et le nombre maximum d'étudiants sont optionnels

**Validations effectuées par l'Administrateur :**
- ✅ Vérification de la qualité du contenu
- ✅ Vérification de la complétude (modules, leçons, évaluation)
- ✅ Vérification de la conformité aux règles
- ✅ Validation ou rejet avec commentaires

---

## 🎓 Parcours Étudiant - Accès et Suivi des Cours

### 1. Découverte des Cours

#### 1.1 Catalogue des Formations

**Route :** `/courses`

**Fonctionnalités :**
- 📋 Affichage en grille de tous les cours publiés
- 🔍 Recherche par mots-clés
- 🏷️ Filtrage par :
  - Catégorie
  - Niveau de difficulté
  - Prix (Gratuit / Payant)
  - Langue
- 📊 Affichage des informations :
  - Image de couverture du cours (sans fallback)
  - Titre
  - Description courte
  - Instructeur
  - Prix
  - Durée
  - Nombre d'étudiants inscrits
  - Note moyenne (si disponible)

#### 1.2 Page de Détail d'un Cours

**Route :** `/courses/[slug]`

**Fonctionnalités :**

**Section Hero :**
- 🖼️ Image de couverture du cours (sans fallback)
- 📝 Titre et description complète
- 🏷️ Catégorie et niveau
- 👤 Instructeur avec avatar
- 💰 Prix et devise
- ⏱️ Durée estimée
- 👥 Nombre d'inscrits
- ⭐ Note moyenne
- 🔙 Bouton "Retour au catalogue"
- ✅ Bouton "S'inscrire" (si inscription possible)

**Informations affichées :**
- 📚 **Modules du cours :**
  - Liste des modules avec leurs leçons
  - Image de présentation du module (si disponible)
  - Expansion/réduction des modules
  - Durée par module
  - Nombre de leçons par module
  
- 📅 **Dates importantes (si cours en Live) :**
  - Date limite d'inscription (afficher uniquement si cours en Live)
  - Date de début (afficher uniquement si cours en Live)
  - Date de fin (afficher uniquement si cours en Live)
  
- 📋 **Prérequis :**
  - Liste des cours prérequis (si applicable)
  
- 👤 **Instructeur :**
  - Nom et avatar
  - Description
  
- 🌐 **Langue du cours**

**Conditions d'inscription :**
- ✅ **Pour les cours en Live :**
  - ✅ Date limite d'inscription non dépassée
  - ✅ Places disponibles (si limite définie)
- ✅ **Pour tous les cours :**
  - ✅ Prérequis complétés (si applicable)
  - ✅ Utilisateur authentifié
  - 💰 **Paiement effectué** (si cours payant)

**Message si inscription impossible :**
- ⚠️ "La date limite d'inscription est dépassée" (cours en Live uniquement)
- ⚠️ "Le cours est complet" (cours en Live uniquement)
- ⚠️ "Vous devez compléter les prérequis"
- ⚠️ "Le paiement est requis pour ce cours"

### 2. Inscription à un Cours

**Processus d'inscription :**

#### 2.1 Cours Gratuit
1. **Clic sur "S'inscrire"** sur la page de détail
2. **Vérifications automatiques :**
   - Authentification (redirection si non connecté)
   - **Si cours en Live :**
     - Date limite d'inscription non dépassée
     - Places disponibles (si limite définie)
   - Prérequis complétés (si applicable)
3. **Traitement de l'inscription :**
   - Appel API `POST /api/enrollments`
   - Création de l'enregistrement d'inscription
4. **Confirmation :**
   - Message de succès
   - Redirection vers "Mes Cours" ou le cours directement

#### 2.2 Cours Payant
1. **Clic sur "S'inscrire"** sur la page de détail
2. **Vérifications automatiques :**
   - Authentification (redirection si non connecté)
   - **Si cours en Live :**
     - Date limite d'inscription non dépassée
     - Places disponibles (si limite définie)
   - Prérequis complétés (si applicable)
3. **Redirection vers le système de paiement :**
   - ⚠️ **Paiement obligatoire avant l'accès au cours**
   - Affichage du montant et de la devise
   - Sélection du mode de paiement :
     - 💳 **Paiement par Carte Bancaire** :
       - Carte Visa, Mastercard, etc.
       - Intégration avec passerelle de paiement
     - 📱 **Paiement par Mobile Money** :
       - Orange Money
       - MTN Mobile Money
       - Moov Money
       - Autres opérateurs disponibles
4. **Processus de paiement :**
   - Saisie des informations de paiement
   - Validation du paiement
   - Confirmation de transaction
5. **Traitement de l'inscription après paiement :**
   - Appel API `POST /api/enrollments` avec référence de paiement
   - Création de l'enregistrement d'inscription
   - Association du paiement à l'inscription
6. **Confirmation :**
   - Message de succès avec reçu de paiement
   - Redirection vers "Mes Cours" ou le cours directement
   - Accès immédiat au contenu du cours

**Important :**
- 🔒 L'accès au cours est **bloqué** tant que le paiement n'est pas validé
- ✅ Une fois le paiement validé, l'inscription est automatique
- 📧 Confirmation par email avec reçu de paiement

### 3. Mes Cours (Dashboard Étudiant)

**Route :** `/dashboard/student/courses`

**Composant :** `MyCourses.tsx`

**Fonctionnalités :**

#### 3.1 Liste des Cours Inscrits
- 📋 Affichage de tous les cours où l'étudiant est inscrit
- 🔍 Recherche par titre
- 🔄 Filtrage par statut :
  - Tous
  - En cours
  - Terminés
  - Non commencés

#### 3.2 Informations affichées par cours :
- 🖼️ Image de couverture du cours (sans fallback)
- 📝 Titre
- 📊 Progression (%)
- ⏱️ Durée totale
- 📅 Dernière activité
- 👤 Instructeur
- ⭐ Note (si évalué)

#### 3.3 Actions disponibles :
- ▶️ **Continuer** → Accéder au cours et reprendre là où on s'est arrêté
- 👁️ **Voir détails** → Page de détail du cours
- 📊 **Voir progression** → Détails de la progression
- 🗑️ **Se désinscrire** → Confirmation puis désinscription

### 4. Accès au Contenu du Cours

#### 4.1 Navigation dans le Cours

**Depuis "Mes Cours" :**
- Clic sur "Continuer" ou "Voir détails"
- Redirection vers la page de lecture du cours

**Structure du cours :**
- 📚 Liste des modules (sidebar ou menu)
- 📖 Liste des leçons par module
- ▶️ Leçon actuelle en lecture
- ✅ Indicateur de progression (leçons complétées)
- 🔒 **Leçons verrouillées** (progression séquentielle obligatoire) :
  - ⚠️ Les leçons suivantes sont **verrouillées** tant que la leçon précédente n'est pas complétée
  - L'étudiant doit compléter les leçons dans l'ordre
  - Exception : Les leçons optionnelles peuvent être sautées

#### 4.2 Lecture d'une Leçon

**Composant :** `LessonPlayer.tsx`

**Fonctionnalités :**

**Types de contenu supportés :**
- 🎥 **Vidéo** :
  - Lecteur vidéo intégré
  - Suivi de progression automatique
  - Marqueur de fin de lecture
  
- 📄 **Texte** :
  - Affichage du contenu texte
  - Formatage Markdown/HTML
  - Scroll tracking
  
- 📝 **Quiz** :
  - Questions à choix multiples
  - Questions vrai/faux
  - Questions à réponse courte
  - Feedback immédiat
  - Score affiché
  
- 📚 **Document** :
  - Visualiseur PDF
  - Ouverture dans un nouvel onglet
  
- 🎵 **Audio** :
  - Lecteur audio intégré
  - Contrôles de lecture
  
- 📊 **Présentation** :
  - Affichage des slides
  - Navigation entre slides

**Fonctionnalités de navigation :**
- ⬅️ **Leçon précédente** (si disponible)
- ➡️ **Leçon suivante** (si disponible et déverrouillée)
- 📋 **Menu du cours** (navigation directe vers une leçon accessible)
- 🔒 **Leçons verrouillées** :
  - Affichage visuel des leçons verrouillées (icône cadenas)
  - Message : "Complétez la leçon précédente pour déverrouiller"
  - Impossible de cliquer sur une leçon verrouillée

**Suivi de progression :**
- ✅ Marquage automatique de la leçon comme complétée
- 📊 Mise à jour de la progression globale
- 🏆 Attribution de points XP (gamification)
- 🎖️ Badges débloqués (si applicable)
- ⏱️ Temps passé sur la leçon

**Actions après complétion :**
- 🎉 Modal de félicitations
- 🏆 Points XP gagnés affichés
- 🎖️ Badges débloqués affichés (si quiz de module complété)
- 🔓 **Déverrouillage automatique** de la leçon suivante
- ➡️ Bouton "Leçon suivante" (maintenant disponible)

### 5. Progression et Suivi

**Route :** `/dashboard/student/progress`

**Composant :** `ProgressPanel.tsx`

**Fonctionnalités :**
- 📊 Vue d'ensemble de la progression :
  - Cours en cours
  - Cours terminés
  - Pourcentage global de complétion
  - Temps total passé
  
- 📈 Graphiques de progression par cours
- 📅 Activité récente
- 🎯 Objectifs et jalons
- 🏆 Badges et récompenses obtenus

### 6. Évaluations et Quiz

**Route :** `/dashboard/student/evaluations`

**Fonctionnalités :**
- 📝 Liste des quiz et évaluations
- ✅ Quiz complétés
- ⏳ Quiz en attente
- 📊 Scores obtenus
- 📅 Dates d'évaluation

### 7. Certificats

**Route :** `/dashboard/student/certificates`

**Processus d'obtention d'un certificat :**

#### 7.1 Conditions d'éligibilité
- ✅ Toutes les leçons du cours doivent être complétées
- ✅ Tous les quiz de modules doivent être validés (si applicable)
- ✅ L'évaluation finale doit être complétée avec un score suffisant
- ✅ La progression du cours doit être à 100%

#### 7.2 Demande de certificat
1. **Une fois toutes les conditions remplies :**
   - Un bouton "Demander mon certificat" apparaît
   - L'étudiant peut faire une demande de certificat
2. **Vérification des informations du demandeur :**
   - ⚠️ **OBLIGATOIRE** : Vérification des informations personnelles
   - L'étudiant doit vérifier/confirmer :
     - Nom complet
     - Date de naissance
     - Email
     - Numéro de téléphone
     - Autres informations requises
   - Possibilité de modifier les informations si nécessaire
3. **Soumission de la demande :**
   - Validation des informations
   - Soumission de la demande
   - Statut : "En attente de validation"

#### 7.3 Validation par l'Administrateur
- ⚠️ **OBLIGATOIRE** : L'admin doit valider la demande avant l'émission du certificat
- L'admin vérifie :
  - ✅ L'identité du demandeur
  - ✅ La complétion réelle du cours
  - ✅ Les scores obtenus (évaluation finale, quiz)
  - ✅ La conformité des informations
- L'admin peut :
  - ✅ Approuver la demande → Génération du certificat
  - ❌ Rejeter la demande → Retour avec commentaires

#### 7.4 Obtention du certificat
- Une fois validé par l'admin :
  - ✅ Génération automatique du certificat PDF
  - 📧 Envoi par email du certificat
  - 📄 Disponible dans "Mes Certificats"
  - ✅ Statut : "Certificat obtenu"

**Fonctionnalités :**
- 🎓 Liste des certificats obtenus
- 📋 Liste des demandes en attente de validation
- 📄 Téléchargement des certificats PDF
- 📅 Date d'obtention
- ✅ Validation des certificats (QR code, numéro de série)
- 🔍 Vérification en ligne du certificat

---

## 👥 Gestion des Étudiants (Instructeur)

**Route :** `/dashboard/instructor/students`

**Fonctionnalités :**

### 1. Liste des Étudiants
- 📋 Liste de tous les étudiants inscrits aux cours de l'instructeur
- 🔍 Recherche par nom, email, cours
- 🔄 Filtrage par :
  - Cours spécifique
  - Statut (actif, inactif, complété)
  - Date d'inscription

### 2. Détails d'un Étudiant
- 👤 Profil de l'étudiant
- 📚 Liste des cours suivis
- 📊 Progression par cours
- 📝 Historique des activités
- 💬 Communication directe

### 3. Statistiques par Étudiant
- Progression globale
- Temps passé sur la plateforme
- Quiz complétés
- Badges obtenus
- Certificats obtenus

---

## 📊 Analytics et Statistiques (Instructeur)

**Route :** `/dashboard/instructor/analytics`

**Fonctionnalités :**

### 1. Analytics Globaux
- 📈 Vue d'ensemble des performances
- 📊 Graphiques de tendances
- 📉 Analyse comparative

### 2. Analytics par Cours
- Nombre d'inscriptions
- Taux de complétion
- Temps moyen de complétion
- Score moyen des évaluations
- Revenus générés

### 3. Analytics des Étudiants
- Segmentation des étudiants
- Analyse de comportement
- Taux de rétention
- Taux d'abandon

### 4. Rapports Exportables
- Export PDF
- Export Excel
- Rapports personnalisés

---

## 🎮 Gamification (Instructeur)

**Route :** `/dashboard/instructor/gamification`

**Fonctionnalités :**

### 1. Configuration de la Gamification
- 🏆 Création de badges
- 🎯 Définition d'objectifs
- 🏅 Système de points XP
- 📊 Tableaux de classement

### 2. Attribution de Badges
- Badges automatiques (par progression)
- Badges manuels (attribués par l'instructeur)
- Badges pour quiz de modules
- Badges pour complétion de cours

### 3. Statistiques de Gamification
- Badges les plus populaires
- Étudiants les plus actifs
- Points XP distribués

---

## 🤖 Assistant IA (Instructeur)

**Route :** `/dashboard/instructor/chat-ai`

**Fonctionnalités :**

### 1. Chat avec l'IA
- 💬 Questions sur la création de cours
- 📝 Suggestions de contenu
- 🎯 Recommandations pédagogiques
- ✍️ Aide à la rédaction

### 2. Génération de Contenu
- Génération de descriptions de cours
- Création de questions de quiz
- Suggestions de modules et leçons

---

## 💬 Messages (Instructeur)

**Route :** `/dashboard/instructor/messages`

**Fonctionnalités :**

### 1. Messagerie
- 📨 Messages avec les étudiants
- 📬 Messages avec l'administration
- 🔔 Notifications
- 📋 Historique des conversations

**Identifiant de Messagerie :**
- 📧 **L'email est utilisé comme identifiant unique** pour envoyer des messages
- Les utilisateurs peuvent rechercher et envoyer des messages en utilisant l'adresse email
- L'email sert de moyen d'identification principal pour la communication entre instructeurs et étudiants
- Les conversations sont organisées par email de correspondant

### 2. Annonces
- 📢 Création d'annonces pour les cours
- 📧 Envoi d'emails groupés
- 🔔 Notifications push

---

## 🎓 Parcours Administrateur

### 1. Dashboard Administrateur

**Route :** `/dashboard/admin`

**Fonctionnalités :**

#### 1.1 Statistiques Globales
- 👥 Nombre total d'utilisateurs
- 📚 Nombre total de cours
- 💰 Revenus globaux
- 📊 Taux d'engagement

#### 1.2 Vue d'Ensemble
- Cours en attente de validation
- Demandes de certificats en attente
- Signalisations/rapports
- Activités récentes

### 2. Modération des Cours

**Route :** `/dashboard/admin/courses`

**Fonctionnalités :**

#### 2.1 Validation des Cours
- 📋 Liste des cours en attente
- 👁️ Prévisualisation du cours
- ✅ Approbation avec commentaires
- ❌ Rejet avec motif

#### 2.2 Gestion des Cours
- 📊 Liste de tous les cours
- 🔍 Recherche et filtrage
- ✏️ Modification des cours
- 🗑️ Suppression de cours
- 📈 Statistiques globales

### 3. Gestion des Utilisateurs

**Route :** `/dashboard/admin/users`

**Fonctionnalités :**
- 👥 Liste de tous les utilisateurs
- 🔍 Recherche et filtrage
- ✏️ Modification des profils
- 🔒 Activation/Désactivation de comptes
- 🛡️ Gestion des rôles et permissions

### 4. Validation des Certificats

**Route :** `/dashboard/admin/certificates`

**Fonctionnalités :**
- 📋 Liste des demandes de certificats
- 👁️ Vérification des informations
- ✅ Approuver et générer le certificat
- ❌ Rejeter avec motif

### 5. Gestion de la Plateforme

**Route :** `/dashboard/admin/settings`

**Fonctionnalités :**
- ⚙️ Configuration générale
- 🏷️ Gestion des catégories
- 💳 Configuration des paiements
- 📧 Configuration des emails
- 🔔 Gestion des notifications

---

## 🎯 Fonctionnalités Transversales

### 1. Gamification (Étudiant)

**Route :** `/dashboard/student/gamification`

**Fonctionnalités :**

#### 1.1 Points et Niveaux
- 🏆 Points XP gagnés
- 📊 Niveau actuel
- 🎯 Progression vers le niveau suivant
- 📈 Historique des points

#### 1.2 Badges
- 🏅 Liste des badges obtenus
- 🎖️ Badges disponibles
- 📊 Statistiques des badges

#### 1.3 Tableaux de Classement
- 🥇 Classement global
- 🏆 Classement par cours
- 📊 Classement mensuel
- 🎯 Classement par catégorie

#### 1.4 Défis et Objectifs
- 🎯 Objectifs hebdomadaires
- 🏅 Défis spéciaux
- 📊 Progression des objectifs

### 2. Assistant IA (Étudiant)

**Route :** `/dashboard/student/chat-ai`

**Fonctionnalités :**
- 💬 Questions sur les cours
- 📚 Explications de concepts
- 🎯 Suggestions de cours
- ✍️ Aide aux devoirs

### 3. Messages (Étudiant)

**Route :** `/dashboard/student/messages`

**Fonctionnalités :**
- 📨 Messages avec les instructeurs
- 📬 Messages avec l'administration
- 🔔 Notifications
- 📋 Historique des conversations

**Identifiant de Messagerie :**
- 📧 **L'email est utilisé comme identifiant unique** pour envoyer des messages
- Recherche d'utilisateurs par email pour démarrer une conversation
- Les conversations sont identifiées et organisées par l'email du correspondant
- Permet une communication directe entre instructeurs et étudiants via leur adresse email

### 4. Calendrier (Étudiant)

**Route :** `/dashboard/student/calendar`

**Fonctionnalités :**
- 📅 Vue calendrier des cours en Live
- ⏰ Dates importantes
- 📝 Échéances des devoirs
- 🔔 Rappels

### 5. Profil et Paramètres

**Route :** `/dashboard/[role]/profile` et `/dashboard/[role]/settings`

**Fonctionnalités :**

#### 5.1 Profil
- 👤 Informations personnelles
- 📸 Photo de profil
- 📝 Biographie
- 🔗 Liens sociaux

#### 5.2 Paramètres
- 🔐 Sécurité (mot de passe, 2FA)
- 🔔 Notifications (email, push, in-app)
- 🌐 Préférences (langue, fuseau horaire)
- 📧 Gestion des emails
- 🗑️ Suppression de compte

---

## 🗺️ Flux de Navigation

### Inscription et Connexion

```
Page d'accueil (/)
    ↓
    ├─→ Inscription (/register)
    │       ↓
    │   Sélection du rôle (Étudiant/Instructeur)
    │       ↓
    │   Formulaire multi-étapes
    │       ↓
    │   Vérification email
    │       ↓
    │   Connexion (/login)
    │
    └─→ Connexion (/login)
            ├─→ Connexion classique (Étudiants/Instructeurs)
            ├─→ Google OAuth (Étudiants/Instructeurs uniquement)
            └─→ Mot de passe oublié
                    ↓
                Réinitialisation

Connexion Administrateur (/admin/login)
    ↓
    ├─→ Connexion sécurisée (2FA obligatoire)
    ├─→ Vérification IP (optionnel)
    └─→ Dashboard Admin
```

### Instructeur

```
Connexion
    ↓
Dashboard Instructeur (/dashboard/instructor)
    ├─→ Vue statistiques
    ├─→ Cours récents
    ├─→ Activités récentes
    └─→ Actions rapides
    ↓
Gestion des Cours (/dashboard/instructor/courses)
    ↓
    ├─→ Créer un cours → Formulaire de création
    │       ↓
    │   Cours créé (Brouillon)
    │       ↓
    │   Détail du cours (/instructor/courses/[courseId])
    │       ↓
    │   ├─→ Onglet Modules → Créer/Modifier modules
    │   │       └─→ Créer quiz pour module (optionnel, pour badge)
    │   ├─→ Onglet Leçons → Créer/Modifier leçons
    │   ├─→ Onglet Médias → Upload médias
    │   ├─→ Onglet Évaluations → Créer évaluation finale (OBLIGATOIRE)
    │   └─→ Onglet Paramètres → Demander publication
    │           ↓
    │       Demande de validation → Statut "En attente"
    │           ↓
    │       Validation par Admin
    │           ├─→ Approuvé → Cours publié → Visible dans le catalogue
    │           └─→ Rejeté → Retour à "Brouillon" avec commentaires
    │
    ├─→ Modifier un cours → Formulaire d'édition
    ├─→ Supprimer un cours → Confirmation
    └─→ Voir statistiques → Métriques du cours
    
    ├─→ Mes Étudiants (/dashboard/instructor/students)
    │       ├─→ Liste des étudiants
    │       ├─→ Détails d'un étudiant
    │       └─→ Communication
    │
    ├─→ Analytics (/dashboard/instructor/analytics)
    │       ├─→ Analytics globaux
    │       ├─→ Analytics par cours
    │       └─→ Rapports exportables
    │
    ├─→ Gamification (/dashboard/instructor/gamification)
    │       ├─→ Configuration badges
    │       └─→ Statistiques gamification
    │
    ├─→ Assistant IA (/dashboard/instructor/chat-ai)
    │       └─→ Chat avec l'IA
    │
    ├─→ Messages (/dashboard/instructor/messages)
    │       ├─→ Messagerie
    │       └─→ Annonces
    │
    ├─→ Profil (/dashboard/instructor/profile)
    └─→ Paramètres (/dashboard/instructor/settings)
```

### Étudiant

```
Connexion
    ↓
Dashboard Étudiant (/dashboard/student)
    ├─→ Vue statistiques
    ├─→ Cours en cours
    ├─→ Progression
    └─→ Activités récentes
    ↓
Catalogue des Formations (/courses)
    ↓
Page de détail (/courses/[slug])
    ↓
S'inscrire
    ↓
    ├─→ Cours Gratuit → Vérifications → Inscription directe
    └─→ Cours Payant → Système de paiement
            ├─→ Carte bancaire → Validation → Inscription
            └─→ Mobile Money → Validation → Inscription
    ↓
Mes Cours (/dashboard/student/courses)
    ↓
Accéder au cours → Page de lecture
    ↓
Navigation dans le cours (Progression séquentielle)
    ├─→ Liste des modules et leçons
    ├─→ Sélection d'une leçon (déverrouillée)
    └─→ Lecture de la leçon (LessonPlayer)
            ↓
        Complétion de la leçon
            ↓
        Déverrouillage de la leçon suivante
            ↓
        Mise à jour de la progression
            ↓
        Quiz de module (si applicable) → Badge
            ↓
        Leçon suivante ou fin du cours
            ↓
        Évaluation finale → Score suffisant
            ↓
        Demande de certificat → Vérification infos
            ↓
        Validation par admin → Génération certificat
            ↓
        Certificat obtenu
    
    ├─→ Progression (/dashboard/student/progress)
    │       └─→ Vue détaillée de la progression
    │
    ├─→ Évaluations (/dashboard/student/evaluations)
    │       └─→ Liste des quiz et évaluations
    │
    ├─→ Certificats (/dashboard/student/certificates)
    │       └─→ Liste et téléchargement
    │
    ├─→ Gamification (/dashboard/student/gamification)
    │       ├─→ Points et niveaux
    │       ├─→ Badges
    │       └─→ Classements
    │
    ├─→ Assistant IA (/dashboard/student/chat-ai)
    │       └─→ Chat avec l'IA
    │
    ├─→ Messages (/dashboard/student/messages)
    │       └─→ Messagerie
    │
    ├─→ Calendrier (/dashboard/student/calendar)
    │       └─→ Vue calendrier
    │
    ├─→ Profil (/dashboard/student/profile)
    └─→ Paramètres (/dashboard/student/settings)
```

### Administrateur

```
Connexion Admin Séparée (/admin/login)
    ↓
    ⚠️ Connexion sécurisée (2FA obligatoire)
    ↓
    Route séparée : /admin/login
    ↓
Dashboard Admin (/dashboard/admin)
    ├─→ Statistiques globales
    ├─→ Cours en attente
    ├─→ Certificats en attente
    └─→ Activités récentes
    ↓
    ├─→ Modération des Cours (/dashboard/admin/courses)
    │       ├─→ Validation des cours
    │       └─→ Gestion des cours
    │
    ├─→ Gestion des Utilisateurs (/dashboard/admin/users)
    │       └─→ Liste et gestion
    │
    ├─→ Validation des Certificats (/dashboard/admin/certificates)
    │       └─→ Approuver/Rejeter
    │
    └─→ Paramètres Plateforme (/dashboard/admin/settings)
            └─→ Configuration générale
```

---

## 🔑 Points Clés

### Pour les Instructeurs :
1. ✅ Le cours doit être complet (modules + leçons) avant publication
2. ✅ Tous les champs requis doivent être remplis
3. ✅ **L'évaluation finale est OBLIGATOIRE** avant publication
4. ✅ Les quiz de modules sont optionnels mais permettent d'attribuer des badges
5. ✅ La demande de publication nécessite une validation par l'administrateur
6. ✅ Le cours passe en statut "En attente" jusqu'à validation admin
7. ✅ Les modifications peuvent être faites même après publication

### Pour les Étudiants :
1. ✅ L'inscription nécessite une authentification
2. ✅ Les prérequis doivent être complétés
3. ✅ **Pour les cours en Live :** La date limite d'inscription doit être respectée et les places doivent être disponibles
4. ✅ **Pour les cours à la demande :** Pas de contrainte de date ou de places
5. ✅ **Pour les cours payants : le paiement est OBLIGATOIRE avant l'accès**
6. ✅ Le paiement peut se faire par carte bancaire ou mobile money
7. ✅ **La progression est séquentielle : les leçons suivantes sont verrouillées**
8. ✅ Les leçons doivent être complétées dans l'ordre
9. ✅ La progression est sauvegardée automatiquement
10. ✅ Les quiz de modules permettent d'obtenir des badges
11. ✅ L'évaluation finale est nécessaire pour obtenir le certificat
12. ✅ **Le certificat nécessite une validation admin** après vérification des informations

### Pour les Administrateurs :
1. ⚠️ **Connexion totalement séparée** de la voie normale pour sécurité renforcée
2. ✅ Route de connexion dédiée : `/admin/login`
3. ✅ Authentification à deux facteurs (2FA) **OBLIGATOIRE**
4. ✅ Pas de connexion sociale (Google OAuth, Facebook, etc.)
5. ✅ Session timeout plus court (30 minutes d'inactivité)
6. ✅ Logs détaillés de toutes les actions administratives
7. ✅ Monitoring des tentatives de connexion

### Pour la Messagerie :
1. ✅ **L'email est utilisé comme identifiant unique** pour la messagerie
2. ✅ Recherche d'utilisateurs par email pour démarrer une conversation
3. ✅ Les conversations sont organisées par email de correspondant
4. ✅ Communication directe entre instructeurs et étudiants via email

---

## 📝 Notes Techniques

### Routes Principales

**Instructeur :**
- `/dashboard/instructor` - Dashboard
- `/dashboard/instructor/courses` - Liste des cours
- `/instructor/courses/[courseId]` - Détail d'un cours
- `/dashboard/instructor/modules` - Gestion des modules
- `/dashboard/instructor/analytics` - Statistiques

**Étudiant :**
- `/courses` - Catalogue
- `/courses/[slug]` - Détail d'un cours
- `/dashboard/student/courses` - Mes cours
- `/dashboard/student/progress` - Ma progression
- `/dashboard/student/evaluations` - Mes évaluations
- `/dashboard/student/certificates` - Mes certificats

### Services API Utilisés

**Instructeur :**
- `courseService.getInstructorCourses()` - Liste des cours
- `courseService.createCourse()` - Créer un cours
- `courseService.updateCourse()` - Modifier un cours
- `courseService.requestPublication()` - Demander la publication
- `moduleService.getCourseModules()` - Modules d'un cours
- `moduleService.createModule()` - Créer un module
- `moduleService.createModuleQuiz()` - Créer un quiz pour un module (optionnel)
- `lessonService.createLesson()` - Créer une leçon
- `evaluationService.createEvaluation()` - Créer l'évaluation finale (obligatoire)
- `evaluationService.updateEvaluation()` - Modifier l'évaluation

**Étudiant :**
- `courseService.getAllCourses()` - Catalogue
- `courseService.getCourseBySlug()` - Détail d'un cours
- `paymentService.initiatePayment()` - Initier le paiement
- `paymentService.verifyPayment()` - Vérifier le paiement
- `enrollmentService.enroll()` - S'inscrire (après paiement si payant)
- `courseService.getMyCourses()` - Mes cours
- `progressService.updateProgress()` - Mettre à jour la progression
- `progressService.completeLesson()` - Compléter une leçon (déverrouille la suivante)
- `quizService.completeModuleQuiz()` - Compléter un quiz de module (obtient badge)
- `evaluationService.completeEvaluation()` - Compléter l'évaluation finale
- `certificateService.requestCertificate()` - Demander un certificat
- `certificateService.getCertificates()` - Liste des certificats

---

---

## 📋 Checklist des Fonctionnalités Complètes

### ✅ Authentification et Inscription
- [ ] Inscription multi-étapes
- [ ] Sélection du rôle
- [ ] Vérification par email
- [ ] Connexion classique
- [ ] Connexion sociale (Google OAuth)
- [ ] Mot de passe oublié
- [ ] Réinitialisation du mot de passe
- [ ] Gestion de session (JWT)

### ✅ Dashboard Instructeur
- [ ] Statistiques globales
- [ ] Graphiques et tendances
- [ ] Cours récents
- [ ] Activités récentes
- [ ] Actions rapides

### ✅ Gestion des Cours (Instructeur)
- [ ] Création de cours
- [ ] Modification de cours
- [ ] Suppression de cours
- [ ] Gestion des modules
- [ ] Gestion des leçons
- [ ] Quiz de modules
- [ ] Évaluation finale
- [ ] Upload de médias
- [ ] Publication avec validation admin

### ✅ Gestion des Étudiants (Instructeur)
- [ ] Liste des étudiants
- [ ] Détails d'un étudiant
- [ ] Statistiques par étudiant
- [ ] Communication

### ✅ Analytics (Instructeur)
- [ ] Analytics globaux
- [ ] Analytics par cours
- [ ] Analytics des étudiants
- [ ] Rapports exportables

### ✅ Gamification
- [ ] Points XP
- [ ] Badges
- [ ] Niveaux
- [ ] Tableaux de classement
- [ ] Défis et objectifs

### ✅ Dashboard Étudiant
- [ ] Statistiques personnelles
- [ ] Cours en cours
- [ ] Progression globale
- [ ] Activités récentes

### ✅ Parcours Étudiant
- [ ] Catalogue des formations
- [ ] Page de détail d'un cours
- [ ] Inscription (gratuit/payant)
- [ ] Système de paiement
- [ ] Accès au contenu
- [ ] Progression séquentielle
- [ ] Complétion de leçons
- [ ] Quiz de modules
- [ ] Évaluation finale
- [ ] Demande de certificat

### ✅ Messages
- [ ] Messagerie interne
- [ ] Notifications
- [ ] Annonces (instructeur)

### ✅ Assistant IA
- [ ] Chat avec l'IA
- [ ] Génération de contenu (instructeur)
- [ ] Aide aux devoirs (étudiant)

### ✅ Calendrier (Étudiant)
- [ ] Vue calendrier
- [ ] Dates importantes
- [ ] Rappels

### ✅ Profil et Paramètres
- [ ] Modification du profil
- [ ] Upload de photo
- [ ] Gestion du mot de passe
- [ ] Préférences
- [ ] Notifications

### ✅ Administration
- [ ] Dashboard admin
- [ ] Modération des cours
- [ ] Gestion des utilisateurs
- [ ] Validation des certificats
- [ ] Configuration de la plateforme

---

*Document créé le : 2024-01-XX*
*Dernière mise à jour : 2024-01-XX*

