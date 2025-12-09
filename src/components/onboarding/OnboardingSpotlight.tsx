'use client';

import React, { useEffect, useState, useRef } from 'react';

interface OnboardingSpotlightProps {
  targetSelector: string;
  isActive: boolean;
  padding?: number;
  borderRadius?: number;
  onTargetFound?: (element: HTMLElement) => void;
}

export default function OnboardingSpotlight({
  targetSelector,
  isActive,
  padding = 8,
  borderRadius = 8,
  onTargetFound,
}: OnboardingSpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      try {
        const element = document.querySelector(targetSelector) as HTMLElement;
        
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          setIsVisible(true);
          onTargetFound?.(element);
          
          // Scroll l'élément dans la vue si nécessaire
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        } else {
          setTargetRect(null);
          setIsVisible(false);
        }
      } catch (error) {
        console.warn(`Impossible de trouver l'élément avec le sélecteur: ${targetSelector}`, error);
        setTargetRect(null);
        setIsVisible(false);
      }
    };

    // Attendre un peu pour que le DOM soit prêt
    const timeoutId = setTimeout(findTarget, 100);

    // Observer les changements de taille/position de la fenêtre
    const handleResize = () => {
      findTarget();
    };

    // Observer les changements dans le DOM
    const observer = new MutationObserver(() => {
      findTarget();
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetSelector, isActive, onTargetFound]);

  if (!isActive || !isVisible || !targetRect) {
    return null;
  }

  const spotlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 9998,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(2px)',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isVisible ? 1 : 0,
  };

  // Calculer les coordonnées du spotlight
  const spotlightTop = targetRect.top - padding;
  const spotlightLeft = targetRect.left - padding;
  const spotlightWidth = targetRect.width + padding * 2;
  const spotlightHeight = targetRect.height + padding * 2;

  // Créer un path SVG pour le spotlight (trou dans l'overlay)
  const pathData = `
    M 0,0
    L ${window.innerWidth},0
    L ${window.innerWidth},${window.innerHeight}
    L 0,${window.innerHeight}
    Z
    M ${spotlightLeft},${spotlightTop}
    L ${spotlightLeft + spotlightWidth},${spotlightTop}
    L ${spotlightLeft + spotlightWidth},${spotlightTop + spotlightHeight}
    L ${spotlightLeft},${spotlightTop + spotlightHeight}
    Z
  `;

  return (
    <div style={spotlightStyle}>
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={pathData}
          fill="black"
          fillRule="evenodd"
          opacity={0.6}
          style={{
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      </svg>
      
      {/* Bordure animée autour de l'élément ciblé */}
      <div
        style={{
          position: 'absolute',
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightWidth,
          height: spotlightHeight,
          border: '3px solid #2563eb',
          borderRadius: `${borderRadius}px`,
          boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.2), 0 0 20px rgba(37, 99, 235, 0.4)',
          pointerEvents: 'none',
          animation: 'pulse-border 2s ease-in-out infinite',
        }}
      />
      
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 0 20px rgba(37, 99, 235, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.1), 0 0 30px rgba(37, 99, 235, 0.6);
          }
        }
      `}</style>
    </div>
  );
}

