'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();

  return (
    <section
      className="relative flex items-center justify-center min-h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/Hero.png')" }}
    >
      {/* Effet décoratif */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(800px 600px at 20% 20%, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(600px 400px at 80% 80%, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '100px 100px, 120px 120px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 md:pt-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center justify-items-center -ml-12">

          {/* Texte principal */}
          <div className="flex flex-col justify-center text-center lg:text-left space-y-6 sm:space-y-8">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-semibold leading-tight text-white"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              <span className="text-[#FAD6A4]">Apprends</span> à ton rythme,{' '}
              <span className="text-[#FAD6A4]">transmets</span> ton savoir et{' '}
              <span className="text-[#FAD6A4]">inspire</span> la prochaine génération.
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white text-justify max-w-2xl mx-auto lg:mx-0">
              Accède à des cours exclusifs, des sessions live interactives et des certifications reconnues. 
              Crée et partage tes contenus, anime des sessions live, évalue les apprenants et suis leurs 
              progrès en temps réel. Ton expertise mérite une scène : fais-la briller ici.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="secondary"
                size="lg"
                className="group"
                onClick={() => router.push('/courses')}
              >
                Découvrir les formations
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/about')}
              >
                En savoir plus
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative overflow-hidden rounded-[100px] shadow-2xl transform sm:scale-100 md:scale-110 lg:scale-125">
            <img
              src="/apprenant.png"
              alt="Apprentissage en ligne"
              className="w-full h-auto object-cover rounded-[100px]"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
