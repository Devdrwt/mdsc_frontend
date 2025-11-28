'use client';

import React, { useEffect, useMemo } from 'react';
import CertificatePreview from './CertificatePreview';

interface CertificateCelebrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  courseTitle: string;
  code?: string; // Code d'affichage et de vérification (certificate_number) - format MDSC-XXXXXX-BJ
  issuedAt?: Date;
  location?: string;
}

export default function CertificateCelebrateModal({
  isOpen,
  onClose,
  fullName,
  courseTitle,
  code, // Code d'affichage et de vérification (certificate_number)
  issuedAt,
  location = 'Cotonou, Bénin',
}: CertificateCelebrateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    // Effet "confettis" amélioré: émojis en chute avec variations
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    const particles: HTMLSpanElement[] = [];
    const emojis = ['🎉', '🎊', '✨', '🥳', '🏆', '🎈', '⭐', '💫'];
    
    const makeParticle = () => {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.position = 'fixed';
      span.style.left = Math.random() * 100 + 'vw';
      span.style.top = '-50px';
      span.style.fontSize = Math.floor(20 + Math.random() * 30) + 'px';
      span.style.zIndex = '1001';
      span.style.pointerEvents = 'none';
      span.style.userSelect = 'none';
      
      // Animation avec rotation et variation de vitesse
      const duration = 3 + Math.random() * 4; // 3-7 secondes
      const rotation = 360 + Math.random() * 720; // 1-3 tours
      span.style.animation = `fall ${duration}s linear forwards`;
      span.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(span);
      particles.push(span);
      
      // Nettoyer après l'animation
      setTimeout(() => {
        if (span.parentElement) {
          span.parentElement.removeChild(span);
        }
      }, duration * 1000 + 1000);
    };
    
    // Créer des confettis en rafale au début
    for (let i = 0; i < 30; i++) {
      setTimeout(() => makeParticle(), i * 50);
    }
    
    // Continuer à créer des confettis périodiquement
    const interval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        makeParticle();
      }
    }, 800);
    
    // Nettoyage
    return () => {
      clearInterval(interval);
      particles.forEach(p => {
        if (p.parentElement) {
          p.parentElement.removeChild(p);
        }
      });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <style>{`
        @keyframes fall {
          0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 1; 
          }
          50% {
            opacity: 0.95;
          }
          100% { 
            transform: translateY(100vh) rotate(720deg); 
            opacity: 0.3; 
          }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-celebrate {
          animation: celebrate 2s ease-in-out infinite;
        }
      `}</style>
      <div id="confetti-container" className="pointer-events-none fixed inset-0 z-[1001] overflow-hidden"></div>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[1002] w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[1100px] max-h-[95vh] overflow-y-auto bg-white rounded-lg sm:rounded-xl shadow-2xl animate-celebrate mx-2 sm:mx-4">
        {/* En-tête responsive */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-yellow-400 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">🎉</span>
              <span className="break-words">Félicitations ! Votre certificat est prêt</span>
            </h3>
            <button
              onClick={onClose}
              className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white transition-colors font-medium flex-shrink-0"
            >
              Fermer
            </button>
          </div>
        </div>
        {/* Contenu avec padding responsive */}
        <div className="p-3 sm:p-4 md:p-6">
          <CertificatePreview
            fullName={fullName}
            courseTitle={courseTitle}
            location={location}
            issuedAt={issuedAt || new Date()}
            code={code || '—'}
          />
        </div>
      </div>
    </div>
  );
}


