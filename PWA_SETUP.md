# Configuration PWA - Maison de la Société Civile

## 📱 Icônes nécessaires

Pour que le PWA fonctionne correctement, vous devez créer les icônes suivantes dans le dossier `public/` :

### Icônes requises

1. **icon-192x192.png** (192x192 pixels)
   - Icône principale pour Android et Chrome
   - Format: PNG avec transparence

2. **icon-512x512.png** (512x512 pixels)
   - Icône haute résolution pour Android et Chrome
   - Format: PNG avec transparence

3. **apple-touch-icon.png** (180x180 pixels)
   - Icône pour iOS (iPhone/iPad)
   - Format: PNG sans transparence (fond requis)

### Comment générer les icônes

#### Option 1: Utiliser un outil en ligne

1. Allez sur https://www.pwabuilder.com/imageGenerator
2. Téléchargez votre logo (utilisez `/mdsc-logo1.png` ou `/icon.png`)
3. Générez toutes les tailles nécessaires
4. Téléchargez et placez les fichiers dans `public/`

#### Option 2: Utiliser ImageMagick (ligne de commande)

```bash
# Installer ImageMagick si nécessaire
sudo apt-get install imagemagick  # Linux
brew install imagemagick          # macOS

# Générer les icônes à partir du logo
convert public/mdsc-logo1.png -resize 192x192 public/icon-192x192.png
convert public/mdsc-logo1.png -resize 512x512 public/icon-512x512.png
convert public/mdsc-logo1.png -resize 180x180 public/apple-touch-icon.png
```

#### Option 3: Utiliser GIMP ou Photoshop

1. Ouvrez votre logo dans GIMP/Photoshop
2. Créez un nouveau fichier avec les dimensions requises
3. Redimensionnez et centrez le logo
4. Exportez en PNG

### Captures d'écran (optionnel mais recommandé)

Pour améliorer l'expérience dans les stores PWA, créez également :

- **screenshot-wide.png** (1280x720 pixels) - Pour les écrans larges
- **screenshot-narrow.png** (750x1334 pixels) - Pour les mobiles

## 🔧 Configuration

Le PWA est déjà configuré avec :

- ✅ Service Worker avec cache stratégique
- ✅ Manifest.json avec toutes les métadonnées
- ✅ Composants d'installation et de mise à jour
- ✅ Support iOS et Android
- ✅ Cache offline pour les assets statiques

## 🚀 Test du PWA

### En développement

Le PWA est désactivé en développement par défaut. Pour le tester :

1. Build la production : `npm run build`
2. Démarrer le serveur : `npm start`
3. Ouvrir dans le navigateur
4. Ouvrir les DevTools > Application > Service Workers

### En production

1. Déployer l'application
2. Accéder via HTTPS (requis pour le PWA)
3. Le navigateur proposera automatiquement l'installation

## 📝 Notes importantes

- Le PWA nécessite **HTTPS** en production (sauf localhost)
- Les service workers ne fonctionnent pas en navigation privée sur certains navigateurs
- Le cache est configuré pour mettre à jour automatiquement les ressources
- Les utilisateurs recevront une notification lors des mises à jour

## 🔍 Vérification

Pour vérifier que le PWA fonctionne correctement :

1. Lighthouse (Chrome DevTools)
   - Ouvrir DevTools > Lighthouse
   - Sélectionner "Progressive Web App"
   - Lancer l'audit
   - Score cible : 100/100

2. PWA Builder
   - Aller sur https://www.pwabuilder.com/
   - Entrer l'URL de votre site
   - Vérifier les recommandations

## 🛠️ Dépannage

### Le service worker ne se charge pas

- Vérifier que vous êtes en HTTPS (ou localhost)
- Vérifier la console pour les erreurs
- Vider le cache du navigateur

### L'icône ne s'affiche pas

- Vérifier que les fichiers sont dans `public/`
- Vérifier les chemins dans `manifest.json`
- Vérifier que les images sont au bon format

### L'installation ne fonctionne pas

- Vérifier que le manifest.json est valide
- Vérifier que le service worker est actif
- Vérifier les critères d'installabilité (HTTPS, manifest valide, service worker, etc.)

