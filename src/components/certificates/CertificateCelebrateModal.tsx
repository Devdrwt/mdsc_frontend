'use client';

import React, { useEffect, useMemo } from 'react';
import CertificatePreview from './CertificatePreview';

interface CertificateCelebrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  courseTitle: string;
  code?: string;
  issuedAt?: Date;
  location?: string;
}

export default function CertificateCelebrateModal({
  isOpen,
  onClose,
  fullName,
  courseTitle,
  code,
  issuedAt,
  location = 'Cotonou, Bénin',
}: CertificateCelebrateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    // Effet "confettis" simple: émojis en chute
    const container = document.getElementById('confetti-container');
    if (!container) return;
    const particles: HTMLSpanElement[] = [];
    const emojis = ['🎉', '🎊', '✨', '🥳', '🏆'];
    const makeParticle = () => {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.position = 'absolute';
      span.style.left = Math.random() * 100 + 'vw';
      span.style.top = '-40px';
      span.style.fontSize = Math.floor(18 + Math.random() * 20) + 'px';
      span.style.animation = `fall ${4 + Math.random() * 3}s linear forwards`;
      container.appendChild(span);
      particles.push(span);
      setTimeout(() => {
        if (span.parentElement) span.parentElement.removeChild(span);
      }, 8000);
    };
    const interval = setInterval(() => {
      for (let i = 0; i < 8; i++) makeParticle();
    }, 500);
    // Nettoyage
    return () => {
      clearInterval(interval);
      particles.forEach(p => p.parentElement && p.parentElement.removeChild(p));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      <div id="confetti-container" className="pointer-events-none fixed inset-0 z-[1001]"></div>
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[1002] w-[min(1100px,95vw)] max-h-[90vh] overflow-auto bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Félicitations ! Votre certificat est prêt 🎉
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-900"
          >
            Fermer
          </button>
        </div>
        <div className="p-4 sm:p-6">
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


