# 🚀 Guide Rapide - Authentification Google

## ⚡ Configuration en 5 Minutes

### 1️⃣ Exécuter la Migration de Base de Données
```powershell
cd C:\xampp\htdocs\projet_Mdsc\mdsc_auth_api\database
.\run_google_migration.ps1
```

### 2️⃣ Créer un Projet Google Cloud

1. Allez sur https://console.cloud.google.com/
2. Créez un nouveau projet "MdSC MOOC"
3. Activez l'API "Google+ API"
4. Allez dans **APIs & Services** > **Credentials**
5. Cliquez sur **Create Credentials** > **OAuth client ID**
6. Sélectionnez **Web application**

### 3️⃣ Configurer les URLs

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:5000
```

**Authorized redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
```

### 4️⃣ Récupérer les Identifiants

Copiez le **Client ID** et le **Client Secret**

### 5️⃣ Configurer les Variables d'Environnement

#### Backend (`mdsc_auth_api/.env`)
```env
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
```

#### Frontend (`mdsc_frontend/.env.local`)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

### 6️⃣ Démarrer les Serveurs

**Terminal 1 - Backend:**
```bash
cd C:\xampp\htdocs\projet_Mdsc\mdsc_auth_api
npm start
```

**Terminal 2 - Frontend:**
```bash
cd C:\xampp\htdocs\projet_Mdsc\mdsc_frontend
npm run dev
```

### 7️⃣ Tester !

1. Ouvrez http://localhost:3000/login
2. Cliquez sur "Continuer avec Google"
3. Authentifiez-vous avec votre compte Google
4. Profitez ! 🎉

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `mdsc_frontend/GOOGLE_AUTH_IMPLEMENTATION.md` - Documentation complète frontend
- `mdsc_auth_api/GOOGLE_OAUTH_SETUP.md` - Guide de configuration détaillé

---

## 🎯 Ce qui a été implémenté

✅ Bouton "Continuer avec Google" sur la page de login  
✅ Bouton "Continuer avec Google" sur la page d'inscription  
✅ Authentification OAuth 2.0 complète  
✅ Création automatique de compte  
✅ Récupération de la photo de profil  
✅ Email vérifié automatiquement  
✅ Redirection automatique vers le dashboard  
✅ Gestion des erreurs  
✅ Interface utilisateur moderne

---

## ❓ Besoin d'aide ?

Si vous rencontrez des problèmes, consultez la section **Dépannage** dans `GOOGLE_AUTH_IMPLEMENTATION.md`

