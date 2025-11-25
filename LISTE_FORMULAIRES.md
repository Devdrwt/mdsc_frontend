# Liste complète des formulaires du projet MdSC

## 📋 Table des matières
1. [Authentification](#authentification)
2. [Gestion des cours](#gestion-des-cours)
3. [Gestion des modules et leçons](#gestion-des-modules-et-leçons)
4. [Évaluations et quiz](#évaluations-et-quiz)
5. [Forum et discussions](#forum-et-discussions)
6. [Notation des cours](#notation-des-cours)
7. [Messages](#messages)
8. [Profil utilisateur](#profil-utilisateur)
9. [Administration](#administration)
10. [Paiements](#paiements)
11. [Contact et autres](#contact-et-autres)

---

## 🔐 Authentification

### 1. **LoginForm** 
- **Fichier**: `src/components/auth/LoginForm.tsx`
- **Description**: Formulaire de connexion utilisateur
- **Champs**: Email, Mot de passe
- **Fonctionnalité**: Authentification standard

### 2. **AdminLoginForm**
- **Fichier**: `src/components/auth/AdminLoginForm.tsx`
- **Description**: Formulaire de connexion administrateur
- **Champs**: Email, Mot de passe
- **Fonctionnalité**: Authentification admin

### 3. **RegisterForm**
- **Fichier**: `src/components/auth/RegisterForm.tsx`
- **Description**: Formulaire d'inscription standard
- **Champs**: Nom, Prénom, Email, Mot de passe, Confirmation mot de passe
- **Fonctionnalité**: Création de compte utilisateur

### 4. **MultiStepRegisterForm**
- **Fichier**: `src/components/auth/MultiStepRegisterForm.tsx`
- **Description**: Formulaire d'inscription multi-étapes
- **Champs**: Informations personnelles, Informations professionnelles, etc.
- **Fonctionnalité**: Inscription guidée étape par étape

### 5. **SimpleRegisterForm**
- **Fichier**: `src/components/auth/SimpleRegisterForm.tsx`
- **Description**: Formulaire d'inscription simplifié
- **Champs**: Informations essentielles
- **Fonctionnalité**: Inscription rapide

### 6. **ForgotPasswordForm**
- **Fichier**: `src/components/auth/ForgotPasswordForm.tsx`
- **Description**: Formulaire de réinitialisation de mot de passe
- **Champs**: Email
- **Fonctionnalité**: Demande de réinitialisation

### 7. **ResetPasswordForm**
- **Fichier**: `src/components/auth/ResetPasswordForm.tsx`
- **Description**: Formulaire de nouveau mot de passe
- **Champs**: Nouveau mot de passe, Confirmation
- **Fonctionnalité**: Définition du nouveau mot de passe

---

## 📚 Gestion des cours

### 8. **CourseEditModal**
- **Fichier**: `src/components/dashboard/instructor/CourseEditModal.tsx`
- **Description**: Modal d'édition/création de cours
- **Champs**: 
  - Titre, Description courte, Description complète
  - Catégorie, Niveau de difficulté
  - Durée, Prix, Devise
  - Langue, Type de cours (live/on_demand)
  - Nombre max d'étudiants
  - Cours prérequis
  - Dates (début, fin, deadline inscription)
  - Thumbnail, Vidéo de présentation
- **Fonctionnalité**: Création et modification de cours

### 9. **CourseManagement** (formulaire de création)
- **Fichier**: `src/components/dashboard/instructor/CourseManagement.tsx`
- **Description**: Formulaire de création de cours dans le dashboard
- **Champs**: Similaire à CourseEditModal
- **Fonctionnalité**: Création rapide de cours

---

## 📖 Gestion des modules et leçons

### 10. **ModuleManagement**
- **Fichier**: `src/components/dashboard/instructor/ModuleManagement.tsx`
- **Description**: Formulaire de création/édition de modules
- **Champs**: 
  - Titre, Description
  - Ordre (order_index)
  - Image du module
  - Cours associé
- **Fonctionnalité**: Gestion complète des modules

### 11. **LessonManagement**
- **Fichier**: `src/components/dashboard/instructor/LessonManagement.tsx`
- **Description**: Formulaire de création/édition de leçons
- **Champs**: 
  - Titre, Description
  - Type de contenu (vidéo, texte, document, audio, etc.)
  - URL du contenu, Contenu texte
  - Module associé
  - Durée, Ordre
  - Obligatoire, Publié
  - Fichier média (upload)
- **Fonctionnalité**: Gestion complète des leçons

### 12. **SequenceManagement**
- **Fichier**: `src/components/dashboard/instructor/SequenceManagement.tsx`
- **Description**: Formulaire de gestion des séquences
- **Champs**: Organisation des séquences de cours
- **Fonctionnalité**: Réorganisation des contenus

---

## ✅ Évaluations et quiz

### 13. **EvaluationBuilder**
- **Fichier**: `src/components/dashboard/instructor/EvaluationBuilder.tsx`
- **Description**: Constructeur d'évaluations
- **Champs**: 
  - Titre, Description
  - Questions et réponses
  - Critères d'évaluation
- **Fonctionnalité**: Création d'évaluations finales

### 14. **ModuleQuizBuilder**
- **Fichier**: `src/components/dashboard/instructor/ModuleQuizBuilder.tsx`
- **Description**: Constructeur de quiz pour modules
- **Champs**: 
  - Titre du quiz
  - Questions (multiple choice, vrai/faux, réponse courte)
  - Options de réponse
  - Réponses correctes
  - Points par question
- **Fonctionnalité**: Création de quiz interactifs

### 15. **QuizBuilder**
- **Fichier**: `src/components/dashboard/instructor/QuizBuilder.tsx`
- **Description**: Constructeur de quiz générique
- **Champs**: Similaire à ModuleQuizBuilder
- **Fonctionnalité**: Quiz pour leçons ou modules

### 16. **QuizComponent** (soumission)
- **Fichier**: `src/components/courses/QuizComponent.tsx`
- **Description**: Formulaire de soumission de quiz
- **Champs**: Réponses aux questions
- **Fonctionnalité**: Répondre à un quiz

### 17. **ModuleQuizPlayer** (soumission)
- **Fichier**: `src/components/dashboard/student/ModuleQuizPlayer.tsx`
- **Description**: Interface de réponse aux quiz de module
- **Champs**: Réponses aux questions
- **Fonctionnalité**: Passer un quiz de module

### 18. **CourseEvaluationPlayer** (soumission)
- **Fichier**: `src/components/dashboard/student/CourseEvaluationPlayer.tsx`
- **Description**: Interface de soumission d'évaluation finale
- **Champs**: Réponses à l'évaluation
- **Fonctionnalité**: Soumettre une évaluation de cours

### 19. **EvaluationSubmissionPage**
- **Fichier**: `src/app/dashboard/student/evaluations/[id]/page.tsx`
- **Description**: Page de soumission d'évaluation
- **Champs**: Réponses complètes
- **Fonctionnalité**: Soumettre une évaluation

---

## 💬 Forum et discussions

### 20. **TopicForm**
- **Fichier**: `src/components/forum/TopicForm.tsx`
- **Description**: Formulaire de création de commentaire/topic
- **Champs**: 
  - Titre, Contenu
- **Fonctionnalité**: Créer un nouveau commentaire dans le forum

### 21. **ReplyForm**
- **Fichier**: `src/components/forum/ReplyForm.tsx`
- **Description**: Formulaire de réponse à un commentaire
- **Champs**: 
  - Contenu de la réponse
  - Réponse à un autre commentaire (optionnel)
- **Fonctionnalité**: Répondre à un commentaire du forum

---

## ⭐ Notation des cours

### 22. **RatingForm**
- **Fichier**: `src/components/courses/RatingForm.tsx`
- **Description**: Formulaire de notation de cours
- **Champs**: 
  - Note (1-5 étoiles)
  - Commentaire
  - Points positifs
  - Points négatifs
- **Fonctionnalité**: Noter un cours complété

---

## 📧 Messages

### 23. **MessageComposer**
- **Fichier**: `src/components/messages/MessageComposer.tsx`
- **Description**: Formulaire de composition de message
- **Champs**: 
  - Destinataire (email)
  - Sujet
  - Contenu du message
- **Fonctionnalité**: Envoyer un message à un utilisateur

### 24. **Messages** (réponse)
- **Fichier**: `src/components/dashboard/shared/Messages.tsx`
- **Description**: Interface de messagerie avec formulaire de réponse
- **Champs**: Réponse rapide
- **Fonctionnalité**: Répondre aux messages

---

## 👤 Profil utilisateur

### 25. **Student Profile**
- **Fichier**: `src/app/dashboard/student/profile/page.tsx`
- **Description**: Formulaire de modification du profil étudiant
- **Champs**: 
  - Nom, Prénom
  - Email, Téléphone
  - Photo de profil
  - Informations personnelles
- **Fonctionnalité**: Mise à jour du profil

### 26. **Instructor Profile**
- **Fichier**: `src/app/dashboard/instructor/profile/page.tsx`
- **Description**: Formulaire de modification du profil instructeur
- **Champs**: 
  - Informations personnelles
  - Bio, Spécialités
  - Photo de profil
  - Informations professionnelles
- **Fonctionnalité**: Mise à jour du profil instructeur

### 27. **Admin Profile**
- **Fichier**: `src/app/dashboard/admin/profile/page.tsx`
- **Description**: Formulaire de modification du profil admin
- **Champs**: Informations administratives
- **Fonctionnalité**: Mise à jour du profil admin

---

## 🛠️ Administration

### 28. **SystemSettings**
- **Fichier**: `src/components/dashboard/admin/SystemSettings.tsx`
- **Description**: Formulaire de configuration système
- **Champs**: 
  - **Onglet Général**: Nom du site, URL, Description, Langue, Timezone, Mode maintenance
  - **Onglet Email**: SMTP (host, port, user, password), Email expéditeur
  - **Onglet Sécurité**: Timeout session, Tentatives login, Longueur min mot de passe, Vérification email, 2FA
  - **Onglet Fonctionnalités**: Activer/désactiver (Gamification, Chat IA, Certificats, Analytics, Notifications)
  - **Onglet Intégrations**: Moodle, OpenAI, MinIO
- **Fonctionnalité**: Configuration complète de la plateforme

### 29. **DomainManagement**
- **Fichier**: `src/components/dashboard/admin/DomainManagement.tsx`
- **Description**: Formulaire de gestion des domaines
- **Champs**: 
  - Nom du domaine
  - Description
- **Fonctionnalité**: Créer/modifier des domaines

### 30. **UserManagement** (invitation)
- **Fichier**: `src/components/dashboard/admin/UserManagement.tsx`
- **Description**: Formulaire d'invitation d'utilisateurs
- **Champs**: 
  - Emails des utilisateurs à inviter
- **Fonctionnalité**: Inviter des utilisateurs en masse

### 31. **CourseModeration**
- **Fichier**: `src/components/dashboard/admin/CourseModeration.tsx`
- **Description**: Interface de modération avec formulaires d'approbation
- **Champs**: Actions de modération
- **Fonctionnalité**: Approuver/rejeter des cours

### 32. **CourseApprovalPanel**
- **Fichier**: `src/components/dashboard/admin/CourseApprovalPanel.tsx`
- **Description**: Panel d'approbation de cours
- **Champs**: Commentaires d'approbation
- **Fonctionnalité**: Approuver des cours avec commentaires

### 33. **CertificateManagementPanel**
- **Fichier**: `src/components/dashboard/admin/CertificateManagementPanel.tsx`
- **Description**: Gestion des certificats
- **Champs**: Paramètres de certificats
- **Fonctionnalité**: Configuration des certificats

### 34. **CertificateApprovalPanel**
- **Fichier**: `src/components/dashboard/admin/CertificateApprovalPanel.tsx`
- **Description**: Panel d'approbation de certificats
- **Champs**: Actions d'approbation
- **Fonctionnalité**: Approuver des demandes de certificats

### 35. **Admin Dashboard** (événements/notifications)
- **Fichier**: `src/app/dashboard/admin/page.tsx`
- **Description**: Formulaires de création d'événements et notifications
- **Champs**: 
  - Titre, Description, Date
  - Type d'événement
- **Fonctionnalité**: Créer des événements et notifications

---

## 💳 Paiements

### 36. **PaymentForm**
- **Fichier**: `src/components/payments/PaymentForm.tsx`
- **Description**: Formulaire de paiement
- **Champs**: 
  - Informations de paiement
  - Méthode de paiement
- **Fonctionnalité**: Traiter les paiements de cours

---

## 📞 Contact et autres

### 37. **Contact Page**
- **Fichier**: `src/app/contact/page.tsx`
- **Description**: Formulaire de contact
- **Champs**: 
  - Nom, Email
  - Sujet, Message
- **Fonctionnalité**: Envoyer un message de contact

### 38. **News Page** (abonnement)
- **Fichier**: `src/app/news/page.tsx`
- **Description**: Formulaire d'abonnement à la newsletter
- **Champs**: Email
- **Fonctionnalité**: S'abonner aux actualités

### 39. **Chat IA** (étudiant et instructeur)
- **Fichiers**: 
  - `src/components/dashboard/student/ChatIA.tsx`
  - `src/components/dashboard/instructor/InstructorChatIA.tsx`
  - `src/components/dashboard/admin/AdminChatIA.tsx`
- **Description**: Interface de chat avec IA
- **Champs**: Message texte
- **Fonctionnalité**: Poser des questions à l'assistant IA

---

## 📝 Composants de formulaire réutilisables

### 40. **FormInput**
- **Fichier**: `src/components/shared/FormInput.tsx`
- **Description**: Composant input réutilisable
- **Types**: text, email, number, url, datetime-local, textarea

### 41. **FormSection**
- **Fichier**: `src/components/shared/FormSection.tsx`
- **Description**: Section de formulaire réutilisable
- **Fonctionnalité**: Structurer les formulaires

---

## 📊 Statistiques

- **Total de formulaires identifiés**: 41
- **Formulaires d'authentification**: 7
- **Formulaires de gestion de contenu**: 15
- **Formulaires d'administration**: 8
- **Formulaires utilisateur**: 6
- **Formulaires de communication**: 5

---

## 🔍 Notes importantes

1. Certains formulaires sont intégrés dans des modals (CourseEditModal, ModuleManagement)
2. Les formulaires de quiz et évaluations ont des variantes pour création et soumission
3. Les formulaires de profil sont adaptés selon le rôle (student, instructor, admin)
4. Les formulaires de chat IA utilisent des textareas pour la saisie de messages
5. Tous les formulaires utilisent la validation côté client et l'intégration avec les services API correspondants

