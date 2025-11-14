'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function CallToAction() {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 md:py-28"
      style={{
        backgroundImage: "url('/Hero.png')",
      }}
    >
      {/* Overlay pour foncer légèrement l'image */}
      <div className="absolute inset-0 z-0" aria-hidden="true"></div>

      {/* Contenu */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <h2
  className="text-3xl md:text-4xl text-display text-mdsc-white mb-3 leading-tight"
  style={{ color: 'white' }}
>
  Prêt à commencer votre parcours d'apprentissage ?
</h2>
<p
  className="text-xl text-body-large text-mdsc-white opacity-80 mb-8 max-w-2xl mx-auto leading-snug"
  style={{ color: 'white' }}
>
  Inscrivez-vous gratuitement et accédez à des centaines de cours certifiants
</p>


        {/* <Button
          variant="secondary"
          size="lg"
          className="inline-flex items-center text-lg px-8 py-4 text-white"
          style={{ backgroundColor: 'var(--mdsc-orange-light)' }}
          onClick={() => (window.location.href = '/register')}
        >
          Créer mon compte gratuitement
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button> */}

        <Button
  onClick={() => (window.location.href = '/register')}
  className="inline-flex items-center justify-center text-lg font-medium text-white px-8 py-4 rounded-lg transition-all duration-300 hover:brightness-110"
  style={{
    backgroundColor: 'var(--mdsc-gold)',
  }}
>
  Créer mon compte gratuitement
  <ArrowRight className="ml-2 h-5 w-5 text-white" />
</Button>

      </div>
    </section>
  );
}
