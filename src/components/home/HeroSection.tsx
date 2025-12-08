'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { ArrowRight, Users, BookOpen, Award, Globe } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  
  const features = [
    {
      icon: Users,
      title: 'Formation OSC',
      description: 'Renforcez les capacités de votre organisation'
    },
    {
      icon: BookOpen,
      title: 'Cours interactifs',
      description: 'Apprentissage adapté aux défis locaux'
    },
    {
      icon: Award,
      title: 'Certifications',
      description: 'Reconnaissance officielle des compétences'
    },
    {
      icon: Globe,
      title: 'Accès universel',
      description: 'Disponible partout, même hors ligne'
    }
  ];

  return (
<section
  className="min-h-screen flex items-center relative overflow-hidden bg-cover bg-center"
  style={{
    backgroundImage: `url('/Hero.png')`
  }}
>

      {/* Very subtle line pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(800px 600px at 20% 20%, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(600px 400px at 80% 80%, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '100px 100px, 120px 120px',
          backgroundRepeat: 'repeat'
        }}
      />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20 pt-28 md:pt-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl text-display text-white dark:text-white" style={{color: 'white', fontFamily: 'var(--font-playfair)'}}>
                <span className="text-[#FAD6A4]">Apprends</span> à ton rythme, <span className="text-[#FAD6A4]">transmets</span> ton savoir et <span className="text-[#FAD6A4]">inspire</span> la prochaine génération.
              </h1>
              <p className="text-xl text-body-large text-white dark:text-white" style={{color: 'white'}}>
                Accède à des cours exclusifs, des sessions live interactives et des certifications reconnues. 
                Crée et partage tes contenus, anime des sessions live, évalue les utilisateurs et suis leurs 
                progrès en temps réel. Ton expertise mérite une scène : fais-la briller ici.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
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

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[48px] shadow-2xl">
              <img
                src="/apprenant.png"
                alt="Apprentissage en ligne"
                className="w-full h-auto object-cover rounded-[48px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
