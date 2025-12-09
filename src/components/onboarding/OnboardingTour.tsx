'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { OnboardingStep } from '../../hooks/useOnboarding';
import OnboardingSpotlight from './OnboardingSpotlight';

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function OnboardingTour({
  isActive,
  currentStep,
  totalSteps,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onClose,
}: OnboardingTourProps) {
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [tooltipSide, setTooltipSide] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  useEffect(() => {
    if (!isActive || !currentStep) {
      setTooltipPosition(null);
      return;
    }

    const updateTooltipPosition = () => {
      try {
        const element = document.querySelector(currentStep.target) as HTMLElement;
        if (!element) {
          setTooltipPosition(null);
          return;
        }

        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipWidth = 320; // Largeur approximative du tooltip
        const tooltipHeight = 200; // Hauteur approximative du tooltip
        const spacing = 16;

        let top = 0;
        let left = 0;
        let side: 'top' | 'bottom' | 'left' | 'right' = (currentStep.position && currentStep.position !== 'center' ? currentStep.position : 'bottom') || 'bottom';

        // Calculer la position selon le côté préféré
        switch (side) {
          case 'bottom':
            top = rect.bottom + spacing;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            // Si ça dépasse en bas, mettre en haut
            if (top + tooltipHeight > viewportHeight) {
              side = 'top';
              top = rect.top - tooltipHeight - spacing;
            }
            break;
          case 'top':
            top = rect.top - tooltipHeight - spacing;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            // Si ça dépasse en haut, mettre en bas
            if (top < 0) {
              side = 'bottom';
              top = rect.bottom + spacing;
            }
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + spacing;
            // Si ça dépasse à droite, mettre à gauche
            if (left + tooltipWidth > viewportWidth) {
              side = 'left';
              left = rect.left - tooltipWidth - spacing;
            }
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - spacing;
            // Si ça dépasse à gauche, mettre à droite
            if (left < 0) {
              side = 'right';
              left = rect.right + spacing;
            }
            break;
        }

        // Ajuster pour rester dans la vue
        left = Math.max(spacing, Math.min(left, viewportWidth - tooltipWidth - spacing));
        top = Math.max(spacing, Math.min(top, viewportHeight - tooltipHeight - spacing));

        setTooltipPosition({ top, left });
        setTooltipSide(side);
      } catch (error) {
        console.warn('Erreur lors du calcul de la position du tooltip:', error);
        setTooltipPosition(null);
      }
    };

    // Attendre un peu pour que le DOM soit prêt
    const timeoutId = setTimeout(updateTooltipPosition, 150);

    // Mettre à jour lors du scroll/resize
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep || !tooltipPosition) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <>
      {/* Spotlight overlay */}
      <OnboardingSpotlight
        targetSelector={currentStep.target}
        isActive={isActive}
        padding={8}
        borderRadius={8}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: '320px',
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl border-2 border-mdsc-blue-primary overflow-hidden">
          {/* En-tête avec icône */}
          <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">
                Étape {currentStepIndex + 1} sur {totalSteps}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-2 text-base">
              {currentStep.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Passer le tour
            </button>

            <div className="flex items-center space-x-2">
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </button>
              )}
              <button
                onClick={isLastStep ? onClose : onNext}
                className="px-4 py-1.5 bg-mdsc-blue-primary text-white text-sm font-medium rounded-lg hover:bg-mdsc-blue-dark transition-colors flex items-center space-x-1"
              >
                <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Flèche pointant vers l'élément */}
          <div
            className={`absolute w-0 h-0 border-8 ${
              tooltipSide === 'bottom'
                ? 'border-b-white border-t-transparent border-l-transparent border-r-transparent -top-4 left-1/2 -translate-x-1/2'
                : tooltipSide === 'top'
                ? 'border-t-white border-b-transparent border-l-transparent border-r-transparent -bottom-4 left-1/2 -translate-x-1/2'
                : tooltipSide === 'right'
                ? 'border-r-white border-l-transparent border-t-transparent border-b-transparent -left-4 top-1/2 -translate-y-1/2'
                : 'border-l-white border-r-transparent border-t-transparent border-b-transparent -right-4 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      </div>
    </>
  );
}

