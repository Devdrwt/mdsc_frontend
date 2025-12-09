'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  target: string; // Sélecteur CSS ou data attribute
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Action à exécuter avant d'afficher cette étape
  skipIf?: () => boolean; // Condition pour sauter cette étape
}

export interface OnboardingConfig {
  tourId: string; // Identifiant unique du tour (ex: 'student-dashboard', 'instructor-dashboard')
  steps: OnboardingStep[];
  storageKey?: string; // Clé pour localStorage (par défaut: `onboarding_${tourId}`)
}

interface UseOnboardingReturn {
  isActive: boolean;
  currentStep: number;
  currentStepData: OnboardingStep | null;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  isCompleted: boolean;
  resetTour: () => void;
}

export function useOnboarding(config: OnboardingConfig): UseOnboardingReturn {
  const storageKey = config.storageKey || `onboarding_${config.tourId}`;
  const completedKey = `${storageKey}_completed`;
  const stepKey = `${storageKey}_step`;

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Vérifier si le tour a déjà été complété
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(completedKey) === 'true';
      setIsCompleted(completed);
      
      // Si pas complété, vérifier s'il y a une étape sauvegardée
      if (!completed) {
        const savedStep = localStorage.getItem(stepKey);
        if (savedStep) {
          const stepIndex = parseInt(savedStep, 10);
          if (!isNaN(stepIndex) && stepIndex < config.steps.length) {
            setCurrentStep(stepIndex);
          }
        }
      }
    }
  }, [completedKey, stepKey, config.steps.length]);

  // Filtrer les étapes selon leurs conditions skipIf
  const getFilteredSteps = useCallback(() => {
    return config.steps.filter((step) => {
      if (step.skipIf) {
        try {
          return !step.skipIf();
        } catch (error) {
          console.warn(`Erreur dans skipIf pour l'étape ${step.id}:`, error);
          return true; // Afficher l'étape en cas d'erreur
        }
      }
      return true;
    });
  }, [config.steps]);

  const startTour = useCallback(() => {
    const filteredSteps = getFilteredSteps();
    if (filteredSteps.length === 0) {
      console.warn('Aucune étape disponible pour ce tour');
      return;
    }
    
    setIsActive(true);
    setCurrentStep(0);
    
    // Exécuter l'action de la première étape si présente
    const firstStep = filteredSteps[0];
    if (firstStep.action) {
      try {
        firstStep.action();
      } catch (error) {
        console.warn(`Erreur lors de l'exécution de l'action de l'étape ${firstStep.id}:`, error);
      }
    }
  }, [getFilteredSteps]);

  const nextStep = useCallback(() => {
    const filteredSteps = getFilteredSteps();
    const nextIndex = currentStep + 1;
    
    if (nextIndex < filteredSteps.length) {
      setCurrentStep(nextIndex);
      
      // Sauvegarder la progression
      if (typeof window !== 'undefined') {
        localStorage.setItem(stepKey, nextIndex.toString());
      }
      
      // Exécuter l'action de l'étape suivante si présente
      const nextStepData = filteredSteps[nextIndex];
      if (nextStepData.action) {
        try {
          nextStepData.action();
        } catch (error) {
          console.warn(`Erreur lors de l'exécution de l'action de l'étape ${nextStepData.id}:`, error);
        }
      }
    } else {
      // Tour terminé
      completeTour();
    }
  }, [currentStep, getFilteredSteps, stepKey]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      
      // Sauvegarder la progression
      if (typeof window !== 'undefined') {
        localStorage.setItem(stepKey, prevIndex.toString());
      }
    }
  }, [currentStep, stepKey]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(completedKey, 'true');
      localStorage.removeItem(stepKey); // Nettoyer la progression sauvegardée
    }
  }, [completedKey, stepKey]);

  const resetTour = useCallback(() => {
    setIsCompleted(false);
    setCurrentStep(0);
    setIsActive(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(completedKey);
      localStorage.removeItem(stepKey);
    }
  }, [completedKey, stepKey]);

  const filteredSteps = getFilteredSteps();
  const currentStepData = isActive && filteredSteps[currentStep] ? filteredSteps[currentStep] : null;

  return {
    isActive,
    currentStep,
    currentStepData,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    isCompleted,
    resetTour,
  };
}

