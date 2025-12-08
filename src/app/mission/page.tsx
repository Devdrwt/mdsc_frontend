'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Target, Globe, Users, Lightbulb, Heart, Shield, ArrowRight, CheckCircle, Award, Network, BookOpen, Building } from 'lucide-react';

export default function MissionPage() {
  const missionPoints = [
    {
      icon: Users,
      title: 'Renforcer les capacités des OSC',
      description: 'Accompagner les organisations de la société civile dans leur développement institutionnel et le renforcement de leurs compétences techniques et managériales.'
    },
    {
      icon: Network,
      title: 'Promouvoir la synergie et les partenariats',
      description: 'Faciliter la mise en réseau des acteurs de la société civile et encourager les collaborations inter-organisationnelles pour un impact collectif plus fort.'
    },
    {
      icon: Lightbulb,
      title: 'Favoriser l\'innovation sociale',
      description: 'Soutenir les initiatives innovantes qui répondent aux défis sociaux et environnementaux de manière créative et durable.'
    },
    {
      icon: Shield,
      title: 'Améliorer la crédibilité et la redevabilité',
      description: 'Promouvoir la transparence, la bonne gouvernance et la redevabilité au sein des organisations de la société civile.'
    },
    {
      icon: BookOpen,
      title: 'Faciliter l\'accès aux financements',
      description: 'Aider les OSC à accéder aux opportunités de financement et aux marchés publics en renforçant leurs capacités de montage de projets.'
    },
    {
      icon: Building,
      title: 'Appui institutionnel et technique',
      description: 'Fournir un accompagnement personnalisé aux organisations dans leur structuration, leur gouvernance et leur développement stratégique.'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Solidarité',
      description: 'La coopération et l\'entraide au cœur de notre action'
    },
    {
      icon: Shield,
      title: 'Intégrité',
      description: 'Respect, transparence et éthique dans toutes nos actions'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Approches créatives et solutions numériques pour répondre aux défis'
    },
    {
      icon: Target,
      title: 'Crédibilité',
      description: 'Fiabilité, professionnalisme et excellence dans nos services'
    }
  ];

  const objectives = [
    'Renforcer les capacités techniques et managériales des OSC membres',
    'Faciliter l\'accès aux financements et aux opportunités de partenariat',
    'Promouvoir la mise en réseau et la collaboration entre les acteurs',
    'Développer des outils numériques innovants pour l\'apprentissage',
    'Améliorer la visibilité et la crédibilité des organisations de la société civile',
    'Contribuer à la bonne gouvernance et à la redevabilité des OSC'
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="py-16"
        style={{
          backgroundImage: `url('/Hero.png')`
        }}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="text-white opacity-75 mb-6">
            <span className="flex items-center justify-center space-x-2">
              <span>Accueil</span>
              <ArrowRight className="h-4 w-4" />
              <span>Notre mission</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Notre Mission
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Renforcer les capacités des organisations de la société civile pour une société plus juste et inclusive.
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mission principale */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-2xl p-8 md:p-12 text-white">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Notre Mission</h2>
              </div>
              <p className="text-xl md:text-2xl leading-relaxed opacity-95">
                La Maison de la Société Civile a pour mission de renforcer les capacités 
                des organisations de la société civile (OSC) au Bénin, en leur fournissant les outils, 
                les compétences et les ressources nécessaires pour accroître leur crédibilité, leur 
                innovation et leur impact dans la promotion du développement durable et de la bonne gouvernance.
              </p>
            </div>
          </section>

          {/* Vision */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-[#D79A49] rounded-full flex items-center justify-center mr-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Notre Vision</h2>
              </div>
              <p className="text-xl text-gray-700 leading-relaxed">
                Être un acteur de référence d'une société civile forte, inclusive, innovante et 
                capable de contribuer efficacement au développement durable du Bénin et de la 
                sous-région ouest-africaine.
              </p>
            </div>
          </section>

          {/* Domaines d'action */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nos Domaines d'Action
              </h2>
              <p className="text-lg text-gray-600">
                Les piliers de notre engagement pour le renforcement de la société civile
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missionPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-mdsc-blue-primary rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Objectifs */}
          <section className="mb-16">
            <div className="bg-gray-50 rounded-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Nos Objectifs Stratégiques
                </h2>
                <p className="text-lg text-gray-600">
                  Les résultats que nous visons à travers nos actions
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="h-6 w-6 text-mdsc-blue-primary flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{objective}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Valeurs */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nos Valeurs
              </h2>
              <p className="text-lg text-gray-600">
                Les principes qui guident notre action quotidienne
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                    <div className="w-16 h-16 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Impact */}
          <section className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-2xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <Award className="h-16 w-16 text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Notre Impact</h2>
              <p className="text-xl opacity-90">
                Depuis notre création, nous avons accompagné des centaines d'organisations 
                de la société civile dans leur développement et leur professionnalisation.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">0+</div>
                <div className="text-sm opacity-90">OSC membres</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">0+</div>
                <div className="text-sm opacity-90">OSC formées</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">0+</div>
                <div className="text-sm opacity-90">Projets réalisés</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">0+</div>
                <div className="text-sm opacity-90">OSC labellisées</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

