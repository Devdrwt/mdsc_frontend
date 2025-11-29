'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Users, ArrowRight, Handshake, Globe, Building, Award } from 'lucide-react';

export default function PartnersPage() {
  const partners = [
    {
      name: 'Union Européenne',
      category: 'Institutionnel',
      description: 'Partenariat stratégique pour le renforcement des capacités des OSC',
      logo: '/partners/ue.png'
    },
    {
      name: 'PNUD Bénin',
      category: 'Institutionnel',
      description: 'Appui au développement durable et à la gouvernance',
      logo: '/partners/pnud.png'
    },
    {
      name: 'Université d\'Abomey-Calavi',
      category: 'Académique',
      description: 'Collaboration pour la recherche et la formation',
      logo: '/partners/uac.png'
    },
    {
      name: 'Ministère de la Société Civile',
      category: 'Gouvernemental',
      description: 'Partenariat institutionnel pour le développement de la société civile',
      logo: '/partners/ministere.png'
    },
    {
      name: 'Agence Française de Développement',
      category: 'Institutionnel',
      description: 'Financement et appui technique aux projets',
      logo: '/partners/afd.png'
    },
    {
      name: 'GIZ Bénin',
      category: 'Institutionnel',
      description: 'Coopération technique et renforcement des capacités',
      logo: '/partners/giz.png'
    },
    {
      name: 'Fondation Ford',
      category: 'Fondation',
      description: 'Soutien aux initiatives de la société civile',
      logo: '/partners/ford.png'
    },
    {
      name: 'USAID Bénin',
      category: 'Institutionnel',
      description: 'Appui aux programmes de développement',
      logo: '/partners/usaid.png'
    }
  ];

  const partnerCategories = [
    { name: 'Institutionnel', count: 5, icon: Building },
    { name: 'Académique', count: 1, icon: Award },
    { name: 'Gouvernemental', count: 1, icon: Globe },
    { name: 'Fondation', count: 1, icon: Handshake }
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
              <span>Partenaires</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nos Partenaires
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Des partenariats stratégiques pour un impact durable
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <section className="mb-16 text-center">
            <Handshake className="h-16 w-16 text-mdsc-blue-primary mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              La Maison de la Société Civile travaille en étroite collaboration avec 
              des partenaires institutionnels, académiques et de la société civile pour 
              renforcer les capacités des OSC et promouvoir le développement durable au Bénin.
            </p>
          </section>

          {/* Catégories de partenaires */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Types de Partenariats
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partnerCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                    <div className="w-16 h-16 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {category.count} partenaire{category.count > 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Liste des partenaires */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ils Nous Font Confiance
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partners.map((partner, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-[#D79A49] mb-2">
                    {partner.category}
                  </p>
                  <p className="text-xs text-gray-600">
                    {partner.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Devenir partenaire */}
          <section className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-2xl p-8 md:p-12 text-white text-center">
            <Handshake className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Devenir Partenaire
            </h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Vous souhaitez collaborer avec nous pour renforcer les capacités de la société civile ? 
              Contactez-nous pour discuter des opportunités de partenariat.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-mdsc-blue-primary rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              <Handshake className="h-5 w-5 mr-2" />
              Nous contacter
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

