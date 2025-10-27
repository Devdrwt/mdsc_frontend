# ========================================
# MDSC Frontend - Setup Rapide
# ========================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MDSC Frontend - Configuration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
Write-Host "Vérification de Node.js..." -ForegroundColor Blue
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    Write-Host "Installez Node.js depuis: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Installation des dépendances
Write-Host "Installation des dépendances npm..." -ForegroundColor Blue
Write-Host "(Cela peut prendre 2-3 minutes)" -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dépendances installées avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Créer .env.local depuis le template
Write-Host "Configuration de .env.local..." -ForegroundColor Blue
if (Test-Path "env-frontend.example") {
    Copy-Item "env-frontend.example" ".env.local" -Force
    Write-Host "✓ Fichier .env.local créé" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
    Write-Host "   Vous devrez ajouter le TOKEN API Moodle plus tard dans .env.local" -ForegroundColor Yellow
    Write-Host "   Variable à modifier: NEXT_PUBLIC_MOODLE_TOKEN" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Fichier env-frontend.example introuvable" -ForegroundColor Yellow
    Write-Host "   Créez .env.local manuellement" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ✅ Configuration Frontend Terminée!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Attendez que le backend soit démarré" -ForegroundColor White
Write-Host "  2. Obtenez le TOKEN API depuis le backend" -ForegroundColor White
Write-Host "  3. Ajoutez-le dans .env.local" -ForegroundColor White
Write-Host "  4. Lancez le frontend avec: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pour lancer le frontend maintenant (sans token):" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""

