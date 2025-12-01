'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Users, ArrowRight, Mail, Linkedin, Award, GraduationCap, Briefcase } from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      initials: 'AT',
      name: 'Dr. Aminata Traoré',
      role: 'Directrice Exécutive',
      description: 'Experte en gouvernance avec 15 ans d\'expérience dans le renforcement des capacités des OSC',
      email: 'a.traore@mdscbenin.org',
      linkedin: '#'
    },
    {
      initials: 'JD',
      name: 'Jean-Marc Dubois',
      role: 'Responsable Formation',
      description: 'Spécialiste en pédagogie et développement de capacités, expert en e-learning',
      email: 'j.dubois@mdscbenin.org',
      linkedin: '#'
    },
    {
      initials: 'FD',
      name: 'Fatou Diallo',
      role: 'Coordinatrice Programmes',
      description: 'Gestion de projets et innovation sociale, experte en montage de projets',
      email: 'f.diallo@mdscbenin.org',
      linkedin: '#'
    },
    {
      initials: 'YK',
      name: 'Yao Kouadio',
      role: 'Responsable Partenariats',
      description: 'Expert en développement de réseaux institutionnels et relations publiques',
      email: 'y.kouadio@mdscbenin.org',
      linkedin: '#'
    },
    {
      initials: 'MK',
      name: 'Marie Koffi',
      role: 'Responsable Technique',
      description: 'Développement de plateformes numériques et solutions technologiques',
      email: 'm.koffi@mdscbenin.org',
      linkedin: '#'
    },
    {
      initials: 'BA',
      name: 'Bakary Adama',
      role: 'Chargé de Communication',
      description: 'Stratégie de communication et gestion de la visibilité des OSC',
      email: 'b.adama@mdscbenin.org',
      linkedin: '#'
    }
  ];

  const departments = [
    {
      name: 'Direction',
      members: 1,
      description: 'Pilotage stratégique et gouvernance'
    },
    {
      name: 'Formation',
      members: 2,
      description: 'Développement et animation des programmes de formation'
    },
    {
      name: 'Programmes',
      members: 2,
      description: 'Gestion et coordination des projets'
    },
    {
      name: 'Technique',
      members: 1,
      description: 'Développement et maintenance des plateformes'
    }
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
              <span>Équipe</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Notre Équipe
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Une équipe dévouée et expérimentée au service de la société civile
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <section className="mb-16 text-center">
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Notre équipe est composée de professionnels passionnés et expérimentés, 
              dédiés au renforcement des capacités des organisations de la société civile. 
              Chaque membre apporte son expertise unique pour créer un impact positif et durable.
            </p>
          </section>

          {/* Membres de l'équipe */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Membres de l'Équipe
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#D79A49] font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {member.description}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <a
                      href={`mailto:${member.email}`}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-mdsc-blue-primary hover:text-white transition-colors"
                      title="Envoyer un email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                    <a
                      href={member.linkedin}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Départements */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nos Départements
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {departments.map((dept, index) => (
                <div key={index} className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-lg p-6 text-white text-center">
                  <Briefcase className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {dept.name}
                  </h3>
                  <p className="text-sm opacity-90 mb-3">
                    {dept.members} membre{dept.members > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs opacity-75">
                    {dept.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Rejoindre l'équipe */}
          <section className="bg-gray-50 rounded-xl p-8 md:p-12 text-center">
            <Users className="h-16 w-16 text-mdsc-blue-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Rejoignez Notre Équipe
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Vous souhaitez contribuer au renforcement de la société civile ? 
              Consultez nos offres d'emploi et opportunités de collaboration.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-semibold"
            >
              <Mail className="h-5 w-5 mr-2" />
              Nous contacter
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

