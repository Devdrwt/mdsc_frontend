'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../lib/stores/authStore';

export default function CallToAction() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const handleClick = () => {
    if (isAuthenticated && user) {
      // Rediriger vers le dashboard selon le rôle
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'instructor') {
        router.push('/dashboard/instructor');
      } else {
        router.push('/dashboard/student');
      }
    } else {
      // Rediriger vers l'inscription si non connecté
      router.push('/register');
    }
  };

  return (
    <section className="section-mdsc bg-mdsc-blue-primary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl text-display text-mdsc-white mb-6" style={{color: 'white'}}>
          {isAuthenticated ? "Continuez votre parcours d'apprentissage" : "Prêt à commencer votre parcours d'apprentissage ?"}
        </h2>
        <p className="text-xl text-body-large text-mdsc-white opacity-80 mb-8 max-w-2xl mx-auto" style={{color: 'white'}}>
          {isAuthenticated 
            ? 'Accédez à votre espace personnel et continuez vos formations'
            : 'Inscrivez-vous gratuitement et accédez à des centaines de cours certifiants'
          }
        </p>
        <Button 
          variant="secondary" 
          size="lg"
          className="inline-flex items-center text-lg px-8 py-4"
          onClick={handleClick}
        >
          {isAuthenticated ? 'Accéder à mon espace' : 'Créer mon compte gratuitement'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
