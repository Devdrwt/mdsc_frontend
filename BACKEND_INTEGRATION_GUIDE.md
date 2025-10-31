# 🔌 Guide d'Intégration Frontend avec Backend

## 📊 Vue d'Ensemble

Ce guide détaille tous les points d'intégration frontend suite aux ajouts backend. Toutes les fonctionnalités décrites ci-dessous sont maintenant opérationnelles côté backend.

---

## ✅ ÉTAT ACTUEL FRONTEND

### **Auth Emails** ✅
- ✅ `verifyEmail()` : `POST /api/auth/verify-email` avec token
- ✅ `resetPassword()` : `POST /api/auth/reset-password` avec token et newPassword
- ✅ Pages `/verify-email` et `/reset-password` implémentées
- ✅ Token lu depuis querystring et renvoyé tel quel au backend

### **Upload Avatar** ✅
- ✅ `uploadAvatar()` : `POST /api/users/me/avatar` 
- ✅ Multipart avec champ `avatar`
- ✅ MIME strict : PNG/JPEG uniquement
- ⚠️ **À VÉRIFIER** : Validation MIME côté frontend

---

## ⚠️ POINTS À INTÉGRER / VÉRIFIER

### **1. Analytics Instructeur** 🔴

**Backend** :
- ✅ `GET /api/analytics/instructor-dashboard` opérationnel
- ⚠️ Sections peuvent être vides si tables non présentes (assignments)

**Frontend** :
```typescript
// Fichier : src/lib/services/analyticsService.ts
static async getInstructorDashboard(): Promise<InstructorDashboard> {
  const response = await apiRequest('/analytics/instructor-dashboard', {
    method: 'GET',
  });
  
  // Actuellement retourne des données vides en cas d'erreur 404
  return response.data;
}
```

**Action** : Vérifier que le service gère correctement les sections vides.

---

### **2. IA Conversations** 🔴

**Backend** :
```
POST /api/ai/conversations
  Body: { title, context? }
  
GET /api/ai/conversations
  
GET /api/ai/conversations/:conversationId
  
POST /api/ai/conversations/:conversationId/messages
  Body: { message, context? }
  Headers: Authorization: Bearer <token> (OBLIGATOIRE)
  
OPENAI_API_KEY requis côté serveur
```

**Frontend** :
- ⚠️ **MANQUE** : Service de conversations IA
- ⚠️ **MANQUE** : Composants de chat IA
- ⚠️ **À VÉRIFIER** : Headers Authorization sur tous les appels IA

**Action** : Créer/Améliorer le service IA avec tous les endpoints.

---

### **3. Modules/Leçons DnD** 🟡

**Backend** :
```
Modules:
GET /api/modules/courses/:courseId/modules
PUT /api/modules/courses/:courseId/reorder
  Body: { modules: [{ id, order_index }] }

Leçons:
PUT /api/courses/:courseId/lessons/:lessonId
  Body: { order_index, ... }
```

**Frontend** :
- ⚠️ **À VÉRIFIER** : Fonctionnalité de drag & drop sur les modules
- ⚠️ **À VÉRIFIER** : Fonctionnalité de drag & drop sur les leçons

**Action** : Vérifier `ModuleManagement.tsx` et ajouter DnD si nécessaire.

---

### **4. Inscriptions Instructeur** 🟡

**Backend** :
```
GET /api/courses/:courseId/enrollments
  QueryParams: page, limit, search, status, sort, order
  Response: { data, pagination }
```

**Frontend** :
- ✅ `StudentManagement.tsx` existe
- ⚠️ **À VÉRIFIER** : Utilisation des bons query params
- ⚠️ **À VÉRIFIER** : Gestion de la pagination

**Action** : Vérifier `StudentManagement.tsx`.

---

### **5. Gamification (Événements Automatiques)** ✅

**Backend** :
- ✅ Leçon complétée → +50 XP automatique
- ✅ Quiz soumis → +100 XP (passé) / +150 XP (perfect)
- ✅ Cours complété → +500 XP + tentative de certificat

**Frontend** :
- ✅ Pas besoin de changer les appels existants
- ✅ Continue à appeler :
  - `PUT /api/enrollments/:courseId/lesson/:lessonId/progress`
  - `PUT /api/quizzes/attempts/:attemptId`
- ✅ Hook `useAutoProgressTracking` déjà créé

**Action** : ✅ Aucun changement nécessaire.

---

### **6. Certificats** 🟡

**Backend** :
- ✅ Génération automatique quand cours complété + quiz final réussi
- ⚠️ Stub PDF/QR pour l'instant

**Frontend** :
```
GET /api/certificates
GET /api/certificates/:id/download
```

**Frontend** :
- ✅ `CertificateCollection.tsx` existe
- ✅ `certificateService` existe
- ⚠️ **À VÉRIFIER** : Téléchargement PDF fonctionne

**Action** : Vérifier le téléchargement de certificats.

---

### **7. "Domains" → "Categories"** 🟡

**Backend** (Compatibilité) :
```
GET /api/professional/domains → liste des catégories
GET /api/professional/modules?domainId=X → cours de la catégorie X
```

**Frontend** :
- ⚠️ **À VÉRIFIER** : `ModuleCatalog.tsx` utilise ces endpoints
- ⚠️ **À VÉRIFIER** : Mapping correct domainId → categoryId

**Action** : Vérifier `ModuleCatalog.tsx` et `ProfessionalService`.

---

### **8. Messages** 🟡

**Backend** :
```
GET /api/messages/received?limit=&offset=
GET /api/messages/sent?limit=&offset=
```

**Frontend** :
- ✅ `Messages.tsx` existe
- ✅ `messageService` existe
- ⚠️ **À VÉRIFIER** : Utilisation des bons query params
- ⚠️ **À VÉRIFIER** : Broadcast/course messages

**Action** : Vérifier `messageService.ts`.

---

## 🔴 URGENT À INTÉGRER

### **1. Service IA Conversations** 🔴

Créer un service complet pour les conversations IA :

```typescript
// src/lib/services/aiConversationService.ts
import { apiRequest } from './api';

export interface Conversation {
  id: string;
  title: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class AIConversationService {
  static async createConversation(title: string, context?: string): Promise<Conversation> {
    const response = await apiRequest('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, context }),
    });
    return response.data;
  }

  static async getConversations(): Promise<Conversation[]> {
    const response = await apiRequest('/ai/conversations', {
      method: 'GET',
    });
    return response.data;
  }

  static async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiRequest(`/ai/conversations/${conversationId}`, {
      method: 'GET',
    });
    return response.data;
  }

  static async sendMessage(
    conversationId: string,
    message: string,
    context?: string
  ): Promise<Message> {
    const response = await apiRequest(`/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    return response.data;
  }
}

export const aiConversationService = AIConversationService;
```

---

### **2. Validation MIME Avatar** 🔴

Ajouter la validation MIME dans `uploadAvatar` :

```typescript
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  // Validation MIME strict : PNG/JPEG uniquement
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new ApiError('Format d\'image non supporté. Utilisez PNG ou JPEG.', 400);
  }
  
  const formData = new FormData();
  formData.append('avatar', file);

  return await fetchAPI<{ avatarUrl: string }>('/users/me/avatar', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}
```

---

## 🟡 À VÉRIFIER

### **1. ModuleManagement - DnD Modules**

```typescript
// Dans ModuleManagement.tsx
const handleReorderModules = async (newOrder: Array<{id: number, order_index: number}>) => {
  await apiRequest(`/modules/courses/${courseId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ modules: newOrder }),
  });
};
```

### **2. StudentManagement - Pagination**

```typescript
// Dans StudentManagement.tsx
const fetchEnrollments = async (page, limit, search, status, sort, order) => {
  const params = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(sort && { sort }),
    ...(order && { order }),
  });
  
  const response = await apiRequest(`/courses/${courseId}/enrollments?${params}`, {
    method: 'GET',
  });
  
  // Response: { data, pagination }
  setStudents(response.data);
  setPagination(response.pagination);
};
```

### **3. Messages - Query Params**

```typescript
// Dans messageService.ts
static async getReceivedMessages(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  
  const response = await apiRequest(`/messages/received?${params}`, {
    method: 'GET',
  });
  return response.data;
}
```

### **4. Certificates - Download**

```typescript
// Dans certificateService.ts
static async downloadCertificate(certificateId: string): Promise<Blob> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/certificates/${certificateId}/download`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement');
  }

  return response.blob();
}
```

---

## ✅ DÉJÀ IMPLÉMENTÉ CORRECTEMENT

### **1. Auth Emails** ✅
- ✅ `verifyEmail()` correct
- ✅ `resetPassword()` correct (maintenant intégré dans ResetPasswordForm.tsx)
- ✅ Pages correctement configurées

### **2. Upload Avatar** ✅
- ✅ Endpoint correct
- ✅ FormData correct
- ⚠️ **Ajouter validation MIME**

### **3. Gamification Automatique** ✅
- ✅ Pas de changement nécessaire
- ✅ XP attribué automatiquement côté backend

---

## 🚨 ERREURS À ÉVITER

1. **401 IA** : Toujours envoyer `Authorization: Bearer <token>`
2. **CORS** : Vérifier que votre origin est autorisé (`FRONTEND_URLS` ou `FRONTEND_URL`)
3. **Tokens emails** : Ne jamais modifier le token dans l'URL, le renvoyer tel quel
4. **MIME Avatar** : Valider PNG/JPEG côté frontend AVANT l'upload

---

## 📋 CHECKLIST D'INTÉGRATION

### **Priorité HAUTE** 🔴
- [ ] Créer `aiConversationService.ts`
- [ ] Ajouter validation MIME dans `uploadAvatar`
- [ ] Vérifier `StudentManagement.tsx` pagination
- [ ] Vérifier `messageService.ts` query params

### **Priorité MOYENNE** 🟡
- [ ] Ajouter DnD modules dans `ModuleManagement.tsx`
- [ ] Ajouter DnD leçons dans leçon editor
- [ ] Vérifier `CertificateCollection.tsx` download
- [ ] Vérifier `ModuleCatalog.tsx` domainId → categoryId

### **Priorité BASSE** 🟢
- [ ] Vérifier `analyticsService.ts` sections vides
- [ ] Tester tous les flows complets
- [ ] Optimiser les performances

---

## 🔗 LIENS UTILES

- **Schéma BD** : `BACKEND_DATABASE_SCHEMA.md`
- **Guide Backend** : `BACKEND_IMPLEMENTATION_GUIDE.md` (supprimé, référence seulement)
- **Processus** : `IMPLEMENTATION_PROCESSUS_COMPLET.md`

---

**Dernière mise à jour** : 30 octobre 2025  
**Statut** : ⚠️ Intégration en cours


