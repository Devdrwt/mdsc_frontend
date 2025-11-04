# Guide de Résolution des Problèmes - Authentification Google OAuth

## 🔍 Problèmes Courants et Solutions

### 1. Vérifier la Configuration dans `.env`

Assurez-vous que les variables suivantes sont définies dans votre fichier `.env` :

```env
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 2. Configuration dans Google Cloud Console

#### Étape 1 : Créer un Projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant

#### Étape 2 : Activer l'API Google+
1. Allez dans "APIs & Services" > "Library"
2. Recherchez "Google+ API" et activez-la

#### Étape 3 : Créer les Identifiants OAuth 2.0
1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth client ID"
3. Sélectionnez "Web application"
4. Configurez :

**Authorized JavaScript origins:**
```
http://localhost:5000
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
```

⚠️ **IMPORTANT** : L'URL de callback DOIT correspondre exactement à celle configurée dans votre backend :
```javascript
callbackURL: `${API_URL}/api/auth/google/callback`
```

### 3. Vérifier la Base de Données

Assurez-vous que la colonne `google_id` existe dans la table `users` :

```sql
-- Vérifier si la colonne existe
DESCRIBE users;

-- Si elle n'existe pas, l'ajouter :
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE;
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL;
```

### 4. Vérifier que le Serveur Backend Démarré

Le serveur doit être démarré et afficher :
```
✅ Google OAuth configuré
```

Si vous voyez :
```
⚠️  Google OAuth non configuré - GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis
```

Cela signifie que les variables d'environnement ne sont pas correctement chargées.

### 5. Tester l'Endpoint de Démarrage

Testez l'endpoint de démarrage Google OAuth :

```bash
curl http://localhost:5000/api/auth/google
```

**Si tout est correct**, vous devriez être redirigé vers Google.

**Si vous obtenez une erreur 503**, vérifiez que :
- `GOOGLE_CLIENT_ID` est défini
- `GOOGLE_CLIENT_SECRET` est défini
- Le serveur a été redémarré après avoir modifié `.env`

### 6. Problèmes Courants

#### Erreur : "redirect_uri_mismatch"
**Cause** : L'URL de callback dans Google Cloud Console ne correspond pas à celle du code.

**Solution** :
1. Vérifiez l'URL dans Google Cloud Console : `http://localhost:5000/api/auth/google/callback`
2. Vérifiez la variable `API_URL` dans `.env` : `API_URL=http://localhost:5000`
3. Redémarrez le serveur backend

#### Erreur : "invalid_client"
**Cause** : `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` incorrect.

**Solution** :
1. Vérifiez que les valeurs dans `.env` correspondent exactement à celles de Google Cloud Console
2. Pas d'espaces avant/après les valeurs
3. Redémarrez le serveur

#### Erreur : "Access blocked: This app's request is invalid"
**Cause** : L'application Google OAuth n'est pas en mode "Testing" ou l'utilisateur n'est pas dans la liste des testeurs.

**Solution** :
1. Dans Google Cloud Console, allez dans "APIs & Services" > "OAuth consent screen"
2. Assurez-vous que l'application est en mode "Testing"
3. Ajoutez votre email Google dans "Test users"

#### La fenêtre popup se ferme sans authentifier
**Cause** : Problème de communication entre la fenêtre popup et la page parent.

**Solution Frontend** :
Le frontend écoute déjà les messages `postMessage` via le composant `GoogleLoginButton`. Vérifiez dans la console du navigateur :

1. **Vérifiez que la popup s'ouvre** :
```
✅ [GOOGLE AUTH] Popup opened successfully
```

2. **Vérifiez que la page de callback se charge** :
```
📥 [GOOGLE CALLBACK] Page loaded
```

3. **Vérifiez que le message est envoyé** :
```
📤 [GOOGLE CALLBACK] Sending GOOGLE_AUTH_SUCCESS to parent
```

4. **Vérifiez que le message est reçu** :
```
📨 [GOOGLE AUTH] Message received
✅ [GOOGLE AUTH] Success
```

**Si la page de callback ne se charge pas**, vérifiez que le backend redirige bien vers :
```
http://localhost:3000/auth/google/callback?token=XXX&user=XXX
```

**Solution Backend** :
Le backend doit rediriger vers l'URL de callback du frontend après authentification :

```javascript
// Dans votre route de callback backend
res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
```

### 7. Vérification Complète

Testez la configuration complète :

1. **Vérifier les variables d'environnement** :
```bash
# Dans PowerShell (Windows)
Get-Content .env | Select-String "GOOGLE"

# Dans bash (Linux/Mac)
grep GOOGLE .env
```

2. **Vérifier que le serveur charge les variables** :
   - Le serveur doit afficher `✅ Google OAuth configuré` au démarrage

3. **Tester l'endpoint** :
```bash
curl http://localhost:5000/api/auth/google
```

4. **Vérifier les logs du serveur** :
   - Ouvrez la console du serveur backend
   - Essayez de vous connecter avec Google
   - Vérifiez les erreurs dans les logs

5. **Vérifier les logs du frontend** :
   - Ouvrez la console du navigateur (F12)
   - Regardez les logs avec les emojis : 🔐 📥 📤 📨 ✅ ❌

### 8. Debug Mode

Pour activer le mode debug dans le backend, ajoutez des logs dans votre route de callback :

```javascript
// Dans votre route /api/auth/google/callback
router.get('/callback', passport.authenticate('google'), async (req, res) => {
  console.log('🔍 Google callback - User:', req.user);
  console.log('🔍 Google callback - Token:', req.user?.token);
  
  // Générer le token JWT
  const token = generateToken(req.user);
  
  // Rediriger vers le frontend avec les données
  const callbackUrl = req.query.callback || `${FRONTEND_URL}/auth/google/callback`;
  const userData = JSON.stringify({
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    // ... autres champs
  });
  
  console.log('🔍 Redirecting to:', `${callbackUrl}?token=${token}&user=${encodeURIComponent(userData)}`);
  res.redirect(`${callbackUrl}?token=${token}&user=${encodeURIComponent(userData)}`);
});
```

### 9. Architecture du Flux OAuth

```
1. Utilisateur clique sur "Continuer avec Google"
   ↓
2. Frontend ouvre popup vers: http://localhost:5000/api/auth/google?role=student&callback=http://localhost:3000/auth/google/callback
   ↓
3. Backend redirige vers Google OAuth
   ↓
4. Utilisateur s'authentifie sur Google
   ↓
5. Google redirige vers: http://localhost:5000/api/auth/google/callback
   ↓
6. Backend traite l'authentification et génère le token
   ↓
7. Backend redirige vers: http://localhost:3000/auth/google/callback?token=XXX&user=XXX
   ↓
8. Page de callback frontend envoie postMessage au parent
   ↓
9. GoogleLoginButton reçoit le message et met à jour le store
   ↓
10. Utilisateur redirigé vers /dashboard
```

### 10. Points d'Attention

#### ⚠️ URLs de Callback

- **Backend callback** : `http://localhost:5000/api/auth/google/callback`
  - Doit être configuré dans Google Cloud Console
  - Doit être configuré dans votre code backend

- **Frontend callback** : `http://localhost:3000/auth/google/callback`
  - Reçoit les données du backend
  - Envoie un postMessage au parent

#### ⚠️ CORS et Origins

Assurez-vous que :
- Le backend autorise les requêtes depuis `http://localhost:3000`
- Google Cloud Console a `http://localhost:3000` dans les "Authorized JavaScript origins"

#### ⚠️ Variables d'Environnement

- Le backend utilise `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
- Le frontend utilise `NEXT_PUBLIC_API_URL` pour construire l'URL de l'API

## 📝 Checklist de Configuration

### Backend
- [ ] `GOOGLE_CLIENT_ID` défini dans `.env`
- [ ] `GOOGLE_CLIENT_SECRET` défini dans `.env`
- [ ] `API_URL` défini dans `.env` (ex: `http://localhost:5000`)
- [ ] `FRONTEND_URL` défini dans `.env` (ex: `http://localhost:3000`)
- [ ] Colonne `google_id` existe dans la table `users`
- [ ] Serveur backend démarré et affiche `✅ Google OAuth configuré`
- [ ] Route `/api/auth/google/callback` redirige vers le frontend avec token et user

### Google Cloud Console
- [ ] Projet créé dans Google Cloud Console
- [ ] Google+ API activée
- [ ] OAuth 2.0 Client ID créé
- [ ] Authorized JavaScript origins configurés (`http://localhost:5000`, `http://localhost:3000`)
- [ ] Authorized redirect URIs configurés (`http://localhost:5000/api/auth/google/callback`)
- [ ] Application en mode "Testing"
- [ ] Email de test ajouté dans "Test users"

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` défini dans `.env.local` (ex: `http://localhost:5000/api`)
- [ ] Page `/auth/google/callback` existe et fonctionne
- [ ] `GoogleLoginButton` écoute les messages `postMessage`
- [ ] Console du navigateur affiche les logs de débogage

## 🆘 Support

Si le problème persiste après avoir suivi ce guide :

1. **Vérifiez les logs du serveur backend** (console)
   - Cherchez les erreurs liées à Google OAuth
   - Vérifiez que les variables d'environnement sont chargées

2. **Vérifiez la console du navigateur** (F12)
   - Regardez les logs avec emojis : 🔐 📥 📤 📨 ✅ ❌
   - Vérifiez les erreurs réseau dans l'onglet "Network"

3. **Vérifiez les logs de Google Cloud Console**
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur votre OAuth 2.0 Client ID
   - Vérifiez les "OAuth 2.0 Playground" pour tester

4. **Partagez les informations suivantes pour un diagnostic** :
   - Messages d'erreur exacts (console navigateur + serveur)
   - URL complète lors de la redirection
   - Logs de la page de callback
   - Configuration Google Cloud Console (sans les secrets)

## 🔗 Ressources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
