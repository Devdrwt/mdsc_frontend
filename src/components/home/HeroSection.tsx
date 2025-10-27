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
    <section className="bg-mdsc-blue-primary min-h-screen flex items-center relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl text-display text-white" style={{color: 'white', fontFamily: 'var(--font-playfair)'}}>
                Apprends à ton rythme, transmets ton savoir et inspire la prochaine génération.
              </h1>
              <p className="text-xl text-body-large text-white" style={{color: 'white'}}>
                Accède à des cours exclusifs, des sessions live interactives et des certifications reconnues. 
                Crée et partage tes contenus, anime des sessions live, évalue les apprenants et suis leurs 
                progrès en temps réel. Ton expertise mérite une scène : fais-la briller ici.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="secondary" 
                size="lg" 
                className="group"
                onClick={() => router.push('/select-role')}
              >
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-mdsc-blue-primary"
                onClick={() => router.push('/courses')}
              >
                Découvrir les formations
              </Button>
            </div>

           
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="/apprenant.png"
                alt="Apprentissage en ligne"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-mdsc-gold/20 to-mdsc-blue-primary/20"></div>
            </div>
            {/* Decorative border effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-mdsc-gold to-mdsc-blue-primary rounded-2xl opacity-20 blur-sm"></div>
          </div>
        </div>

        {/* Wave transition */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="white"></path>
          </svg>
        </div>
      </div>
    </section>
  );
}
