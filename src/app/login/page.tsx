'use client';

import LoginForm from '../../components/auth/LoginForm';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: 'APPRENANT',
      subtitle: 'Suivre des formations',
      features: [
        'Accès à tous les cours',
        'Certifications reconnues',
        'Assistant IA personnel',
        'Suivi de progression'
      ]
    },
    {
      title: 'FORMATEUR',
      subtitle: 'Créer et animer des formations',
      features: [
        'Création de cours',
        'Gestion des apprenants',
        'Support IA pour formateurs',
        'Évaluation et certification'
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Changer de slide toutes les 5 secondes

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="min-h-screen flex relative">
      {/* Bouton retour accueil */}
      <a 
        href="/" 
        className="absolute top-4 left-4 z-20 flex items-center text-gray-600 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </a>
      
      {/* Colonne gauche - Image de fond avec texte */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-600 to-cyan-700">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
            backgroundImage: currentSlide === 0 ? 'url(/Colleagues.png)' : 'url(/Woman.png)'
          }}
        />
        {/* Overlay avec texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-cyan-900/70 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white p-12 relative overflow-hidden">
            <div 
              className="absolute inset-x-0 transition-all duration-700 ease-in-out"
              style={{
                transform: currentSlide === 0 ? 'translateX(0)' : 'translateX(-100%)',
                opacity: currentSlide === 0 ? 1 : 0
              }}
            >
              <h1 className="text-5xl font-bold mb-4 text-center">APPRENANT</h1>
              <p className="text-2xl mb-8 text-center">Suivre des formations</p>
              <ul className="space-y-4 text-lg text-center">
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Accès à tous les cours</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Certifications reconnues</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Assistant IA personnel</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Suivi de progression</span>
                </li>
              </ul>
            </div>
            <div 
              className="absolute inset-x-0 transition-all duration-700 ease-in-out"
              style={{
                transform: currentSlide === 1 ? 'translateX(0)' : 'translateX(100%)',
                opacity: currentSlide === 1 ? 1 : 0
              }}
            >
              <h1 className="text-5xl font-bold mb-4 text-center">FORMATEUR</h1>
              <p className="text-2xl mb-8 text-center">Créer et animer des formations</p>
              <ul className="space-y-4 text-lg text-center">
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Création de cours</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Gestion des apprenants</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Support IA pour formateurs</span>
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>Évaluation et certification</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Indicateurs de slide */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
        <LoginForm />
        </div>
      </div>
    </div>
  );
}
