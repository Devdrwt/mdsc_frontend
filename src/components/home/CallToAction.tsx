'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function CallToAction() {
  return (
    <section className="section-mdsc bg-mdsc-blue-primary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl text-display text-mdsc-white mb-6" style={{color: 'white'}}>
          Prêt à commencer votre parcours d'apprentissage ?
        </h2>
        <p className="text-xl text-body-large text-mdsc-white opacity-80 mb-8 max-w-2xl mx-auto" style={{color: 'white'}}>
          Inscrivez-vous gratuitement et accédez à des centaines de cours certifiants
        </p>
        <Button 
          variant="secondary" 
          size="lg"
          className="inline-flex items-center text-lg px-8 py-4"
          onClick={() => window.location.href = '/register'}
        >
          Créer mon compte gratuitement
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
