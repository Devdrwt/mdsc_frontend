# 🎯 Système de Sélection de Rôle - Guide d'Implémentation

## ✅ Migration Base de Données - TERMINÉE ✓

La migration a été exécutée avec succès ! Les colonnes suivantes ont été ajoutées :
- ✅ `google_id` (VARCHAR 255, UNIQUE)
- ✅ `profile_picture` (VARCHAR 500)

---

## 🎨 Nouveau Flux d'Inscription

### Ancien Flux
```
Accueil → Inscription → Dashboard
```

### Nouveau Flux (Implémenté)
```
Accueil → Sélection de Rôle → Inscription → Dashboard
           ↓
    [Apprenant] ou [Formateur]
```

---

## 📁 Fichiers Créés

### ✅ Page de Sélection de Rôle
**Fichier:** `src/app/select-role/page.tsx`

**Fonctionnalités:**
- 🎨 Interface moderne avec 2 cartes : Apprenant et Formateur
- 📝 Description détaillée de chaque rôle
- ✨ Liste des fonctionnalités par rôle
- 🔄 Stockage du rôle dans `sessionStorage`
- ➡️ Redirection automatique vers `/register`

**Rôles disponibles:**

#### 1. **Apprenant (Student)**
- Accès à tous les cours
- Certifications reconnues
- Assistant IA personnel
- Suivi de progression

#### 2. **Formateur (Instructor)**
- Création de cours
- Gestion des apprenants
- Support IA pour formateurs
- Évaluation et certification

---

## 🔧 Modifications Nécessaires

### 1. Mettre à jour le SimpleRegisterForm

Le code suivant a déjà été ajouté au début du composant :

```typescript
// Récupérer le rôle sélectionné depuis sessionStorage
const [selectedRole, setSelectedRole] = useState<'student' | 'instructor'>('student');

React.useEffect(() => {
  const role = sessionStorage.getItem('selectedRole') as 'student' | 'instructor' | null;
  if (role) {
    setSelectedRole(role);
  } else {
    // Si aucun rôle n'est sélectionné, rediriger vers la page de sélection
    router.push('/select-role');
  }
}, [router]);
```

### 2. Ajouter le Rôle à l'Appel API

**Trouvez la fonction `handleSubmit` et modifiez l'appel à `register()` :**

```typescript
const response = await register({
  email: formData.email,
  firstName: formData.firstName,
  lastName: formData.lastName,
  phone: formData.phone,
  organization: formData.organization,
  country: formData.country,
  password: formData.password,
  role: selectedRole  // ← AJOUTER CETTE LIGNE
});
```

### 3. Ajouter un Badge de Rôle dans le Formulaire

**Ajoutez ceci au début du formulaire (après le titre) :**

```tsx
{/* Badge du rôle sélectionné */}
<div className="mb-6 text-center">
  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
    {selectedRole === 'student' ? (
      <>
        <GraduationCap className="h-4 w-4 mr-2" />
        Inscription en tant qu'Apprenant
      </>
    ) : (
      <>
        <Users className="h-4 w-4 mr-2" />
        Inscription en tant que Formateur
      </>
    )}
  </div>
  <button
    type="button"
    onClick={() => router.push('/select-role')}
    className="ml-3 text-sm text-blue-600 hover:text-blue-800 underline"
  >
    Changer de rôle
  </button>
</div>
```

**N'oubliez pas d'importer les icônes :**
```typescript
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, AlertCircle, Home, GraduationCap, Users } from 'lucide-react';
```

---

## 🔄 Mettre à Jour les Liens de Navigation

### 1. Header - Bouton "S'inscrire"
**Fichier:** `src/components/layout/Header.tsx`

**Modifier la ligne :**
```tsx
// AVANT
<a href="/register" ...>S'inscrire</a>

// APRÈS
<a href="/select-role" ...>S'inscrire</a>
```

### 2. Page d'Accueil - HeroSection
**Fichier:** `src/components/home/HeroSection.tsx`

**Modifier le bouton "Commencer maintenant" :**
```tsx
// AVANT
<Button onClick={() => router.push('/register')} ...>
  Commencer maintenant
</Button>

// APRÈS
<Button onClick={() => router.push('/select-role')} ...>
  Commencer maintenant
</Button>
```

### 3. LoginForm - Lien "Créer un compte"
**Fichier:** `src/components/auth/LoginForm.tsx`

**Modifier les liens vers register :**
```tsx
// AVANT
<a href="/register" ...>S'inscrire gratuitement</a>
<Button onClick={() => router.push('/register')} ...>Créer un compte</Button>

// APRÈS
<a href="/select-role" ...>S'inscrire gratuitement</a>
<Button onClick={() => router.push('/select-role')} ...>Créer un compte</Button>
```

---

## 🔐 Gestion des Rôles avec Google OAuth

### Mettre à jour GoogleLoginButton

Pour l'authentification Google, nous devons également permettre la sélection du rôle.

**Option 1: Rediriger vers select-role avant Google Auth**
```typescript
// Dans GoogleLoginButton
const handleGoogleLogin = async () => {
  // Vérifier si un rôle est sélectionné
  const role = sessionStorage.getItem('selectedRole');
  if (!role) {
    router.push('/select-role');
    return;
  }
  // Continuer avec l'authentification Google...
};
```

**Option 2: Envoyer le rôle dans l'URL Google OAuth**
```typescript
const googleAuthUrl = `${apiUrl}/auth/google?role=${selectedRole}`;
```

Puis côté backend, récupérer le rôle dans la query string et l'utiliser lors de la création du compte.

---

## 🎨 Captures d'Écran du Flux

### Étape 1: Page de Sélection de Rôle
```
┌────────────────────────────────────────────────────────────┐
│              Choisissez votre profil                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │   🎓 APPRENANT   │         │   👥 FORMATEUR   │       │
│  │                  │         │                  │       │
│  │ Je souhaite      │         │ Je souhaite      │       │
│  │ suivre des       │         │ créer et animer  │       │
│  │ formations       │         │ des formations   │       │
│  │                  │         │                  │       │
│  │ ✓ Accès cours    │         │ ✓ Création cours │       │
│  │ ✓ Certifications │         │ ✓ Gestion élèves │       │
│  │ ✓ Assistant IA   │         │ ✓ Support IA     │       │
│  │ ✓ Suivi progrès  │         │ ✓ Évaluation     │       │
│  │                  │         │                  │       │
│  │  [Continuer →]   │         │  [Continuer →]   │       │
│  └──────────────────┘         └──────────────────┘       │
│                                                            │
│         Déjà un compte ? Se connecter                      │
│         🏠 Retour à l'accueil                             │
└────────────────────────────────────────────────────────────┘
```

### Étape 2: Page d'Inscription (avec badge de rôle)
```
┌────────────────────────────────────────────────────────────┐
│                  Créer votre compte                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│      🎓 Inscription en tant qu'Apprenant [Changer]        │
│                                                            │
│      [Formulaire d'inscription...]                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Backend - Modifications Nécessaires

### authController.js - Fonction register

**Ajouter la gestion du rôle :**

```javascript
// Dans la fonction register
const { email, password, firstName, lastName, phone, organization, country, role } = req.body;

// Valider le rôle
const validRoles = ['student', 'instructor', 'admin'];
const userRole = validRoles.includes(role) ? role : 'student';

// Insérer avec le rôle
await db.execute(
  `INSERT INTO users (email, password, first_name, last_name, phone, organization, country, role, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [email, hashedPassword, firstName, lastName, phone, organization, country, userRole]
);
```

---

## ✅ Checklist de Configuration

- [x] Migration base de données exécutée
- [x] Page select-role créée
- [x] SimpleRegisterForm modifié (récupération du rôle)
- [ ] SimpleRegisterForm - Ajouter le rôle à l'appel API
- [ ] SimpleRegisterForm - Ajouter le badge de rôle
- [ ] Header - Mettre à jour le lien S'inscrire
- [ ] HeroSection - Mettre à jour le bouton
- [ ] LoginForm - Mettre à jour les liens
- [ ] GoogleLoginButton - Gérer le rôle
- [ ] Backend - Valider et utiliser le rôle
- [ ] Tester le flux complet

---

## 🚀 URLs du Nouveau Flux

1. **Accueil** : http://localhost:3000/
2. **Sélection de rôle** : http://localhost:3000/select-role
3. **Inscription** : http://localhost:3000/register (avec rôle en session)
4. **Dashboard Apprenant** : http://localhost:3000/dashboard/student
5. **Dashboard Formateur** : http://localhost:3000/dashboard/instructor

---

## 📝 Notes Importantes

1. **SessionStorage** : Le rôle est stocké dans `sessionStorage` pour persister pendant la session de navigation
2. **Redirection** : Si l'utilisateur accède directement à `/register` sans passer par `/select-role`, il sera automatiquement redirigé
3. **Google OAuth** : Pour l'authentification Google, il faut également gérer le rôle (voir options ci-dessus)
4. **Rôle par défaut** : Si aucun rôle n'est spécifié, le backend utilise 'student' par défaut

---

**Date de création :** 20 octobre 2025  
**Version :** 1.0.0  
**Status :** En cours d'implémentation

