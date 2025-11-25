'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Target, Globe, Shield, Lightbulb, Heart, Users, BookOpen, Building, Network, GraduationCap, ArrowRight, Quote } from 'lucide-react';

export default function AboutPage() {
  const principles = [
    {
      icon: Shield,
      title: 'Intégrité',
      description: 'Respect et transparence dans toutes nos actions'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Approches numériques et participatives'
    },
    {
      icon: Heart,
      title: 'Solidarité',
      description: 'Coopération au cœur de l\'action'
    },
    {
      icon: Target,
      title: 'Crédibilité',
      description: 'Fiabilité et professionnalisme'
    }
  ];

  const actions = [
    {
      icon: GraduationCap,
      title: 'Formation et renforcement de capacités',
      description: 'Programmes de formation certifiants pour développer les compétences des acteurs de la société civile'
    },
    {
      icon: Building,
      title: 'Appui institutionnel et technique',
      description: 'Accompagnement personnalisé des organisations dans leur structuration et gouvernance'
    },
    {
      icon: Lightbulb,
      title: 'Promotion de l\'innovation sociale',
      description: 'Soutien aux initiatives innovantes pour résoudre les défis sociaux et environnementaux'
    },
    {
      icon: Network,
      title: 'Mise en réseau et plaidoyer',
      description: 'Facilitation des échanges et représentation auprès des instances décisionnelles'
    },
    {
      icon: BookOpen,
      title: 'Gestion de plateformes numériques (MOOC)',
      description: 'Développement d\'outils digitaux pour l\'apprentissage en ligne accessible à tous'
    },
    {
      icon: Users,
      title: 'Accompagnement communautaire',
      description: 'Soutien aux initiatives locales et renforcement des dynamiques communautaires'
    }
  ];

  const team = [
    {
      initials: 'AT',
      name: 'Dr. Aminata Traoré',
      role: 'Directrice Exécutive',
      description: 'Experte en gouvernance avec 15 ans d\'expérience'
    },
    {
      initials: 'JD',
      name: 'Jean-Marc Dubois',
      role: 'Responsable Formation',
      description: 'Spécialiste en pédagogie et développement de capacités'
    },
    {
      initials: 'FD',
      name: 'Fatou Diallo',
      role: 'Coordinatrice Programmes',
      description: 'Gestion de projets et innovation sociale'
    },
    {
      initials: 'YK',
      name: 'Yao Kouadio',
      role: 'Responsable Partenariats',
      description: 'Expert en développement de réseaux institutionnels'
    }
  ];

  const partners = [
    'Union Européenne',
    'PNUD Bénin',
    'Université d\'Abomey-Calavi',
    'Ministère de la Société Civile',
    'Agence Française de Développement',
    'GIZ Bénin',
    'Fondation Ford',
    'USAID Bénin'
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className=" py-16"
      style={{
    backgroundImage: `url('/Hero.png')`
  }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            À propos de la Maison de la Société Civile
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto mb-6">
            Crédibilité, innovation et engagement au service des organisations de la société civile.
          </p>
          <nav className="text-white opacity-75">
            <span className="flex items-center justify-center space-x-2">
              <span>Accueil</span>
              <ArrowRight className="h-4 w-4" />
              <span>À propos</span>
            </span>
          </nav>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mission et Vision */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mr-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Notre Mission</h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Promouvoir la participation citoyenne, la bonne gouvernance et l'innovation sociale au Bénin.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#D79A49] rounded-full flex items-center justify-center mr-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Notre Vision</h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Être un acteur de référence d'une société civile forte, inclusive et innovante.
                </p>
              </div>
            </div>
          </section>

          {/* Ce qui nous guide */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ce qui nous guide
              </h2>
              <p className="text-lg text-gray-600">
                Des principes fondamentaux qui orientent notre action quotidienne.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {principles.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                    <div className="w-16 h-16 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-gray-600">
                      {principle.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Comment nous agissons */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comment nous agissons
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#D79A49] rounded flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Qui sommes-nous */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Qui sommes-nous
              </h2>
              <p className="text-lg text-gray-600">
                Une équipe dévouée et expérimentée au service de la société civile.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div key={index} className="bg-mdsc-blue-primary rounded-lg p-6 text-center text-white">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-mdsc-blue-dark">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#D79A49] font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-sm opacity-90">
                    {member.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ils nous font confiance */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ils nous font confiance
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {partners.map((partner, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {partner}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Témoignage */}
          <section className="text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="w-16 h-16 bg-[#D79A49] rounded-full flex items-center justify-center mx-auto mb-6">
                <Quote className="h-8 w-8 text-white" />
              </div>
              <blockquote className="text-2xl font-bold text-gray-900 mb-4">
                "La société civile est le moteur du changement durable."
              </blockquote>
              <div className="w-24 h-1 bg-[#D79A49] mx-auto"></div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}