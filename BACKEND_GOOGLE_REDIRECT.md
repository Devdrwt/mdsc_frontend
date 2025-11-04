# Backend - Configuration de la Redirection Google OAuth

## 🔧 Problème Actuel

Le backend affiche actuellement "Authentification réussie !" dans la popup, mais ne transmet pas les données au frontend. La popup se ferme sans que l'utilisateur soit authentifié dans le frontend.

## ✅ Solution Recommandée

Le backend doit **rediriger vers la page de callback du frontend** avec les données dans les query params, au lieu d'afficher simplement un message HTML.

## 📝 Code à Modifier dans le Backend

### Route de Callback Google OAuth

Voici comment la route `/api/auth/google/callback` doit fonctionner :

```javascript
// Dans votre fichier de routes d'authentification
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      console.log('✅ Google OAuth callback - User authenticated:', req.user);
      
      // Générer le token JWT
      const token = generateToken(req.user); // Votre fonction de génération de token
      
      // Construire l'URL de callback du frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = req.query.callback || `${frontendUrl}/auth/google/callback`;
      
      // Préparer les données utilisateur
      const userData = {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName || req.user.first_name,
        lastName: req.user.lastName || req.user.last_name,
        role: req.user.role,
        phone: req.user.phone || '',
        organization: req.user.organization || '',
        country: req.user.country || '',
        emailVerified: req.user.emailVerified || req.user.email_verified || true,
        isActive: req.user.isActive || req.user.is_active !== false,
      };
      
      // Encoder les données utilisateur en JSON
      const userJson = JSON.stringify(userData);
      
      // Construire l'URL de redirection avec les données
      const redirectUrl = `${callbackUrl}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userJson)}`;
      
      console.log('🔄 Redirecting to frontend callback:', redirectUrl);
      
      // Rediriger vers le frontend
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ Error in Google OAuth callback:', error);
      
      // En cas d'erreur, rediriger vers le frontend avec un message d'erreur
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = req.query.callback || `${frontendUrl}/auth/google/callback`;
      res.redirect(`${callbackUrl}?error=${encodeURIComponent('Erreur lors de l\'authentification')}`);
    }
  }
);
```

## 🔄 Flux Complet

```
1. Frontend ouvre popup vers: 
   http://localhost:5000/api/auth/google?role=instructor&callback=http://localhost:3000/auth/google/callback

2. Backend redirige vers Google OAuth

3. Utilisateur s'authentifie sur Google

4. Google redirige vers: 
   http://localhost:5000/api/auth/google/callback

5. Backend traite l'authentification et redirige vers:
   http://localhost:3000/auth/google/callback?token=XXX&user=XXX

6. Page de callback frontend envoie postMessage au parent

7. Frontend met à jour le store et redirige vers /dashboard
```

## ⚠️ Points Importants

### 1. Variables d'Environnement

Assurez-vous que le backend a accès à :
- `FRONTEND_URL` : URL du frontend (ex: `http://localhost:3000`)
- `GOOGLE_CLIENT_ID` : ID client Google OAuth
- `GOOGLE_CLIENT_SECRET` : Secret client Google OAuth

### 2. Format des Données Utilisateur

Le backend doit envoyer les données utilisateur dans ce format :

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "phone": "",
  "organization": "",
  "country": "",
  "emailVerified": true,
  "isActive": true
}
```

### 3. Gestion des Erreurs

En cas d'erreur, rediriger vers :
```
http://localhost:3000/auth/google/callback?error=Message d'erreur
```

### 4. Token JWT

Le token doit être valide et contenir les informations nécessaires pour authentifier l'utilisateur dans les requêtes suivantes.

## 🧪 Test

Pour tester si la redirection fonctionne :

1. Ouvrez la console du navigateur
2. Cliquez sur "Continuer avec Google"
3. Après l'authentification, vérifiez que l'URL de la popup devient :
   ```
   http://localhost:3000/auth/google/callback?token=XXX&user=XXX
   ```
4. Vérifiez les logs dans la console :
   ```
   📥 [GOOGLE CALLBACK] Page loaded
   📤 [GOOGLE CALLBACK] Sending GOOGLE_AUTH_SUCCESS to parent
   ✅ [GOOGLE AUTH] Success
   ```

## 🔍 Alternative : PostMessage depuis le Backend

Si vous ne pouvez pas rediriger directement, le backend peut aussi envoyer un `postMessage` depuis une page HTML :

```html
<!-- Page HTML dans le backend -->
<!DOCTYPE html>
<html>
<head>
  <title>Authentification réussie</title>
</head>
<body>
  <script>
    // Récupérer les données depuis l'URL ou les variables serveur
    const token = '<?php echo $token; ?>'; // ou votre méthode de templating
    const user = <?php echo json_encode($user); ?>;
    
    // Envoyer le message au parent (window.opener)
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        user: user,
        token: token
      }, window.location.origin);
      
      // Fermer la popup après un court délai
      setTimeout(() => {
        window.close();
      }, 500);
    }
  </script>
  <p>Authentification réussie ! Cette fenêtre va se fermer automatiquement...</p>
</body>
</html>
```

Mais **la solution recommandée est la redirection vers la page de callback du frontend**, car elle est plus simple et plus fiable.

## 📚 Exemple Complet avec Passport.js

```javascript
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route de démarrage
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'student';
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});

// Route de callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Générer le token
      const token = generateToken(req.user);
      
      // URL de callback du frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = req.query.callback || `${frontendUrl}/auth/google/callback`;
      
      // Préparer les données
      const userData = {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        // ... autres champs
      };
      
      // Rediriger
      const redirectUrl = `${callbackUrl}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = req.query.callback || `${frontendUrl}/auth/google/callback`;
      res.redirect(`${callbackUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }
);

module.exports = router;
```
