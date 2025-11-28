# 🧪 Guide de test du PWA en développement

## ⚠️ Note importante

Le PWA est **désactivé par défaut en mode développement** pour éviter les problèmes de cache pendant le développement. Pour tester le PWA, vous devez construire l'application en mode production.

## 🚀 Méthode 1 : Build et test local (Recommandé)

### Étape 1 : Build l'application en production

```bash
cd /home/drwintech/Documents/mdsc_frontend
npm run build
```

### Étape 2 : Démarrer le serveur de production

```bash
npm start
```

Le serveur démarre généralement sur `http://localhost:3000`

### Étape 3 : Tester le PWA

1. **Ouvrir Chrome/Edge** (les meilleurs navigateurs pour tester PWA)
2. Aller sur `http://localhost:3000`
3. Ouvrir les **DevTools** (F12)
4. Aller dans l'onglet **Application** (ou **Applications** en français)
5. Vérifier :
   - **Service Workers** : Vous devriez voir un service worker actif
   - **Manifest** : Vérifier que le manifest.json est chargé
   - **Cache Storage** : Vérifier que les caches sont créés

### Étape 4 : Test d'installation

1. Chercher l'icône **"Installer"** dans la barre d'adresse Chrome/Edge
2. Ou utiliser le menu Chrome (⋮) > **Installer l'application**
3. Vérifier que l'application s'installe et s'ouvre en mode standalone

### Étape 5 : Test avec Lighthouse

1. Dans les DevTools, aller dans l'onglet **Lighthouse**
2. Sélectionner **"Progressive Web App"**
3. Cliquer sur **"Analyze page load"**
4. Vérifier le score (objectif : 100/100)

## 🔧 Méthode 2 : Activer le PWA en mode développement (Optionnel)

Si vous voulez tester le PWA directement avec `npm run dev`, vous pouvez modifier temporairement la configuration :

### Modification temporaire de next.config.ts

```typescript
disable: false, // Activer même en développement (temporairement)
```

⚠️ **Attention** : N'oubliez pas de remettre `disable: process.env.NODE_ENV === "development"` après vos tests pour éviter les problèmes de cache pendant le développement.

## 📱 Test sur mobile (via réseau local)

### Étape 1 : Trouver l'IP locale

```bash
# Sur Linux/Mac
ip addr show | grep "inet " | grep -v 127.0.0.1

# Ou
hostname -I

# Exemple de résultat : 192.168.1.100
```

### Étape 2 : Démarrer le serveur avec l'IP locale

```bash
# Option 1 : Modifier le package.json pour accepter les connexions externes
# Dans package.json, modifier le script start :
# "start": "next start -H 0.0.0.0"

# Option 2 : Utiliser une variable d'environnement
HOST=0.0.0.0 npm start
```

### Étape 3 : Accéder depuis le mobile

1. Assurez-vous que votre mobile est sur le même réseau WiFi
2. Ouvrir le navigateur mobile sur : `http://192.168.1.100:3000`
3. Tester l'installation PWA depuis le mobile

## 🔍 Vérifications rapides

### ✅ Checklist de test

- [ ] Service Worker enregistré et actif
- [ ] Manifest.json chargé correctement
- [ ] Icônes PWA présentes (192x192, 512x512)
- [ ] Prompt d'installation apparaît
- [ ] Application installable
- [ ] Mode offline fonctionne (couper la connexion)
- [ ] Lighthouse score ≥ 90/100
- [ ] Mise à jour automatique détectée

### 🐛 Dépannage

**Le service worker ne se charge pas :**
- Vérifier que vous êtes en HTTPS ou localhost
- Vider le cache du navigateur (Ctrl+Shift+Delete)
- Aller dans Application > Service Workers > "Unregister"

**L'installation ne fonctionne pas :**
- Vérifier que le manifest.json est valide
- Vérifier que toutes les icônes existent
- Vérifier la console pour les erreurs

**Le mode offline ne fonctionne pas :**
- Attendre quelques secondes après le chargement
- Vérifier que le service worker a bien mis en cache les ressources
- Tester avec des pages visitées récemment

## 📊 Commandes utiles

```bash
# Build la production
npm run build

# Démarrer en production
npm start

# Build + Start en une commande
npm run build && npm start

# Vérifier les fichiers générés par next-pwa
ls -la public/sw.js
ls -la public/workbox-*.js

# Nettoyer le cache (si problème)
rm -rf .next/
rm -rf public/sw.js
rm -rf public/workbox-*.js
npm run build
```

## 🎯 Test rapide (5 minutes)

```bash
# 1. Build
npm run build

# 2. Start
npm start

# 3. Ouvrir http://localhost:3000 dans Chrome

# 4. DevTools (F12) > Application > Service Workers
#    Vérifier qu'un service worker est actif

# 5. DevTools > Application > Manifest
#    Vérifier que le manifest est chargé

# 6. Cliquer sur l'icône d'installation dans la barre d'adresse
#    Ou menu Chrome > Installer l'application

# 7. Tester l'application installée
```

## 📝 Notes

- Le PWA nécessite **HTTPS** en production (sauf localhost)
- Les service workers ne fonctionnent pas en navigation privée sur certains navigateurs
- Le cache est configuré pour se mettre à jour automatiquement
- Les utilisateurs recevront une notification lors des mises à jour

