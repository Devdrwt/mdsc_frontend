import { OnboardingStep } from '../../../hooks/useOnboarding';

export const studentTourSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    target: '[data-onboarding="welcome-section"]',
    title: 'Bienvenue sur votre tableau de bord ! 🎓',
    content: 'Voici votre espace personnel où vous pouvez suivre votre progression, accéder à vos cours et bien plus encore.',
    position: 'bottom',
  },
  {
    id: 'stats',
    target: '[data-onboarding="stats-section"]',
    title: 'Vos statistiques en un coup d\'œil',
    content: 'Consultez rapidement le nombre de cours suivis, complétés et vos certificats obtenus.',
    position: 'bottom',
  },
  {
    id: 'courses-progress',
    target: '[data-onboarding="courses-progress"]',
    title: 'Suivez votre progression',
    content: 'Ici vous pouvez voir tous vos cours en cours et suivre votre avancement en temps réel.',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    target: '[data-onboarding="quick-actions"]',
    title: 'Actions rapides',
    content: 'Accédez rapidement aux fonctionnalités principales : catalogue de cours, favoris, certificats, et plus encore.',
    position: 'top',
  },
  {
    id: 'notifications',
    target: '[data-onboarding="notifications"]',
    title: 'Restez informé',
    content: 'Consultez vos notifications pour ne rien manquer : nouveaux cours, messages, événements, etc.',
    position: 'left',
  },
];

