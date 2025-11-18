# Frontend MdSC MOOC - Portail Public

Frontend Next.js pour la plateforme d'apprentissage en ligne de la **Maison de la Société Civile**. Interface moderne et responsive pour le portail public, intégrée avec l'API Moodle et Keycloak SSO.

## Architecture

Cette application fait partie de l'architecture globale MdSC MOOC :

- **Frontend (ce projet)** : Portail public React/Next.js
- **Backend** : Moodle 5.1 + plugins (H5P, Custom Certificate)
- **Services** : Keycloak (SSO), MinIO (stockage), Redis (cache), Jitsi (visioconférence)
- **Infrastructure** : Docker/Kubernetes, MariaDB 11.8

## Charte Graphique

Respecte l'identité visuelle de la Maison de la Société Civile :

- **Couleurs principales** :
  - Bleu foncé (#1e3a8a) : texte principal, éléments de navigation
  - Orange (#f97316) : accents, call-to-actions, éléments interactifs
  - Gris (#6b7280) : texte secondaire, éléments de support

- **Éléments visuels** :
  - Figures humaines stylisées (communauté, collaboration)
  - Arcs protecteurs/connecteurs (soutien, accompagnement)
  - Police moderne sans-serif (Geist)
  - Tagline : "crédibilité, innovation"

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)
- [Technologies utilisées](#technologies-utilisées)
- [Configuration](#configuration)
- [Développement](#développement)
- [Build et déploiement](#build-et-déploiement)
- [Bonnes pratiques](#bonnes-pratiques)
- [Ressources](#ressources)
- [Contribution](#contribution)
- [Licence](#licence)

## Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :

- **Node.js** : version 18.17 ou supérieure
- **npm** / **yarn** / **pnpm** / **bun** : gestionnaire de paquets

Vérifiez vos versions :

```bash
node --version
npm --version
```

## Installation

Clonez le dépôt et installez les dépendances :

```bash
# Cloner le projet
git clone <url-du-repo>
cd <nom-du-projet>

# Installer les dépendance
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

## Démarrage rapide

Lancez le serveur de développement :

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour accéder à la plateforme MOOC.

L'application se recharge automatiquement lorsque vous modifiez les fichiers sources.

## Structure du projet

```
.
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Layout racine
│   ├── page.tsx           # Page d'accueil
│   ├── courses/           # Pages des cours
│   ├── dashboard/         # Tableau de bord étudiant
│   └── ...                # Autres routes
├── public/                # Ressources statiques (images, vidéos)
├── components/            # Composants réutilisables
│   ├── course/           # Composants liés aux cours
│   ├── ui/               # Composants UI génériques
│   └── layout/           # Composants de layout
├── lib/                   # Utilitaires et helpers
├── styles/               # Fichiers de styles globaux
├── next.config.js        # Configuration Next.js
├── package.json          # Dépendances et scripts
├── tsconfig.json         # Configuration TypeScript
└── README.md             # Documentation du projet
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Crée une version optimisée pour la production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run type-check` | Vérifie les types TypeScript |

## Technologies utilisées

- **[Next.js 15](https://nextjs.org/)** - Framework React avec SSR et SSG
- **[React 19](https://react.dev/)** - Bibliothèque UI
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[Geist Font](https://vercel.com/font)** - Police optimisée de Vercel

## Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Exemple de variables d'environnement
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

> **Note** : Les variables préfixées par `NEXT_PUBLIC_` sont exposées côté client.

### Configuration Next.js

Modifiez `next.config.js` selon vos besoins :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com'],
  },
  // Autres options de configuration
}

module.exports = nextConfig
```

## Développement

### Créer une nouvelle page de cours

Créez un fichier dans le dossier `app/courses` :

```typescript
// app/courses/[courseId]/page.tsx
export default function CoursePage({ params }: { params: { courseId: string } }) {
  return (
    <div>
      <h1>Cours {params.courseId}</h1>
      {/* Contenu du cours */}
    </div>
  )
}
```

### Créer un composant de cours

```typescript
// components/course/CourseCard.tsx
interface CourseCardProps {
  title: string
  description: string
  thumbnail: string
  duration: string
}

export default function CourseCard({ title, description, thumbnail, duration }: CourseCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <img src={thumbnail} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-gray-600 mt-2">{description}</p>
        <span className="text-sm text-gray-500 mt-2 block">{duration}</span>
      </div>
    </div>
  )
}
```

### Optimisation des polices

Ce projet utilise [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) pour optimiser et charger automatiquement la police Geist.

## Build et déploiement

### Build local

```bash
npm run build
npm run start
```

### Déploiement sur Vercel

La méthode la plus simple pour déployer votre application Next.js est d'utiliser la [plateforme Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/votre-username/votre-repo)

Consultez la [documentation de déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying) pour plus de détails.

### Autres plateformes de déploiement

- **Netlify** : Support complet de Next.js
- **AWS Amplify** : Déploiement sur AWS
- **Docker** : Conteneurisation pour déploiement personnalisé
- **Cloud Run** : Déploiement sur Google Cloud

## Bonnes pratiques

- Utilisez TypeScript pour un code plus robuste
- Organisez vos composants de manière modulaire
- Implémentez le lazy loading pour les images et composants
- Utilisez les Server Components par défaut
- Optimisez les performances avec les outils de Next.js
- Testez votre application avant chaque déploiement
- Documentez les changements importants

## Ressources

- [Documentation Next.js](https://nextjs.org/docs) - Fonctionnalités et API
- [Tutoriel interactif Next.js](https://nextjs.org/learn) - Apprentissage pratique
- [Dépôt GitHub Next.js](https://github.com/vercel/next.js) - Code source et contributions
- [Communauté Next.js](https://github.com/vercel/next.js/discussions) - Forum de discussion
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) - Exemples officiels

## Fonctionnalités CRUD par Dashboard

La plateforme supporte des actions CRUD complètes pour chaque rôle d'utilisateur. Voir le document [Actions CRUD par Dashboard](./docs/DASHBOARD_CRUD_ACTIONS.md) pour la liste complète.

### Dashboard Étudiant 👨‍🎓
- ✅ Gestion des cours (inscription, progression, certificats)
- ✅ Évaluations (visualisation, soumission)
- ✅ Gamification (points, badges, leaderboard)
- ⏳ Messages et notifications (en développement)
- ⏳ Modification du profil (interface prête)

### Dashboard Instructeur 👨‍🏫
- ✅ Gestion des cours (CRUD complet)
- ⏳ Gestion des leçons (en développement)
- ⏳ Création et gestion des évaluations (backend prêt)
- ✅ Analytics des cours
- ⏳ Messages étudiants (en développement)

### Dashboard Admin 👨‍💼
- ✅ Statistiques globales
- ⏳ Gestion des utilisateurs (en développement)
- ⏳ Gestion des catégories (en développement)
- ⏳ Modération des cours (en développement)

## Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.


Développé avec Next.js pour l'apprentissage en ligne

# Equipe Dev Drwintech inc
