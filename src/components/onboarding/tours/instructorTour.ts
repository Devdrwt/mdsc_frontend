import { OnboardingStep } from '../../../hooks/useOnboarding';

export const instructorTourSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    target: '[data-onboarding="welcome-section"]',
    title: 'Bienvenue dans votre espace formateur ! 👨‍🏫',
    content: 'Gérez vos cours, suivez vos étudiants et accompagnez-les vers la réussite depuis cet espace dédié.',
    position: 'bottom',
  },
  {
    id: 'stats',
    target: '[data-onboarding="stats-section"]',
    title: 'Vos statistiques de formateur',
    content: 'Consultez le nombre d\'utilisateurs, de cours publiés, vos revenus et votre note moyenne.',
    position: 'bottom',
  },
  {
    id: 'course-performance',
    target: '[data-onboarding="course-performance"]',
    title: 'Performance de vos cours',
    content: 'Suivez les performances de vos cours : nombre d\'utilisateurs, taux de complétion, notes et revenus.',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    target: '[data-onboarding="quick-actions"]',
    title: 'Actions rapides',
    content: 'Accédez rapidement aux fonctionnalités principales : créer un cours, gérer vos modules, voir vos étudiants, analytics, etc.',
    position: 'top',
  },
  {
    id: 'notifications',
    target: '[data-onboarding="notifications"]',
    title: 'Vos notifications',
    content: 'Restez informé des nouvelles inscriptions, avis reçus, messages et autres activités importantes.',
    position: 'left',
  },
];

