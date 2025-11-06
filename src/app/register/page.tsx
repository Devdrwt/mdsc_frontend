'use client';

import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | null>(null);

  useEffect(() => {
    // Récupérer le rôle sélectionné depuis sessionStorage
    const role = sessionStorage.getItem('selectedRole') as 'student' | 'instructor' | null;
    if (role === 'student' || role === 'instructor') {
      setSelectedRole(role);
    } else {
      // Si aucun rôle n'est sélectionné, rediriger vers la page de sélection
      router.push('/select-role');
    }
  }, [router]);

  // Contenu selon le rôle
  const studentContent = {
    image: '/Colleagues.png',
    title: 'APPRENANT',
    subtitle: 'Suivre des formations',
    features: [
      'Accès à tous les cours',
      'Certifications reconnues',
      'Assistant IA personnel',
      'Suivi de progression'
    ]
  };

  const instructorContent = {
    image: '/Woman.png',
    title: 'FORMATEUR',
    subtitle: 'Créer et animer des formations',
    features: [
      'Création de cours',
      'Gestion des apprenants',
      'Support IA pour formateurs',
      'Évaluation et certification'
    ]
  };

  // Sélectionner le contenu selon le rôle (par défaut student si null)
  const content = selectedRole === 'instructor' ? instructorContent : studentContent;

  // Si aucun rôle n'est sélectionné, ne rien afficher (redirection en cours)
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${content.image})`
          }}
        />
        {/* Overlay avec texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-cyan-900/70 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white p-12">
            <h1 className="text-5xl font-bold mb-4 text-center">{content.title}</h1>
            <p className="text-2xl mb-8 text-center">{content.subtitle}</p>
            <ul className="space-y-4 text-lg text-center">
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-2xl p-8">
          <SimpleRegisterForm />
        </div>
      </div>
    </div>
  );
}
