#!/bin/bash

# Script pour générer les icônes PWA nécessaires
# Requiert ImageMagick: sudo apt-get install imagemagick (Linux) ou brew install imagemagick (macOS)

SOURCE_IMAGE="public/mdsc-logo1.png"
ICON_DIR="public"

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé."
    echo "Installez-le avec:"
    echo "  Linux: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

# Vérifier si l'image source existe
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Image source non trouvée: $SOURCE_IMAGE"
    echo "Veuillez vérifier que le fichier existe dans le dossier public/"
    exit 1
fi

echo "🔄 Génération des icônes PWA..."

# Créer l'icône 192x192
convert "$SOURCE_IMAGE" -resize 192x192 -background none -gravity center -extent 192x192 "$ICON_DIR/icon-192x192.png"
echo "✅ Créé: icon-192x192.png"

# Créer l'icône 512x512
convert "$SOURCE_IMAGE" -resize 512x512 -background none -gravity center -extent 512x512 "$ICON_DIR/icon-512x512.png"
echo "✅ Créé: icon-512x512.png"

# Créer l'icône Apple Touch (180x180 avec fond blanc pour iOS)
convert "$SOURCE_IMAGE" -resize 180x180 -background white -gravity center -extent 180x180 "$ICON_DIR/apple-touch-icon.png"
echo "✅ Créé: apple-touch-icon.png"

echo ""
echo "✨ Toutes les icônes PWA ont été générées avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez les icônes générées dans le dossier public/"
echo "  2. Testez le PWA avec: npm run build && npm start"
echo "  3. Vérifiez avec Lighthouse dans Chrome DevTools"

