'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { HelpCircle, ArrowRight, BookOpen, Video, Mail, MessageCircle, Search, FileText } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const helpCategories = [
    {
      icon: BookOpen,
      title: 'Guide de démarrage',
      description: 'Apprenez à utiliser la plateforme étape par étape',
      href: '/faq',
      color: 'bg-blue-500'
    },
    {
      icon: Video,
      title: 'Tutoriels vidéo',
      description: 'Regardez nos vidéos explicatives',
      href: '/faq',
      color: 'bg-purple-500'
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Consultez notre documentation complète',
      href: '/faq',
      color: 'bg-green-500'
    },
    {
      icon: MessageCircle,
      title: 'FAQ',
      description: 'Trouvez des réponses aux questions fréquentes',
      href: '/faq',
      color: 'bg-orange-500'
    }
  ];

  const quickLinks = [
    { name: 'Comment s\'inscrire ?', href: '/faq' },
    { name: 'Comment s\'inscrire à un cours ?', href: '/faq' },
    { name: 'Comment obtenir une attestation ?', href: '/faq' },
    { name: 'Problèmes de paiement', href: '/faq' },
    { name: 'Problèmes techniques', href: '/faq' },
    { name: 'Contacter le support', href: '/contact' }
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
              <span>Centre d'aide</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Centre d'Aide
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Trouvez rapidement l'aide dont vous avez besoin
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Catégories d'aide */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={index}
                    href={category.href}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {category.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Liens rapides */}
          <section className="mb-16">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Liens Rapides
                </h2>
                <p className="text-gray-600">
                  Accédez rapidement aux ressources les plus demandées
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 flex items-center space-x-3"
                  >
                    <Search className="h-5 w-5 text-mdsc-blue-primary" />
                    <span className="text-gray-700 font-medium">{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Contact support */}
          <section className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark rounded-2xl p-8 md:p-12 text-white text-center">
            <HelpCircle className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Besoin d'Aide Supplémentaire ?
            </h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Notre équipe de support est disponible pour vous aider. 
              Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white text-mdsc-blue-primary rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                <Mail className="h-5 w-5 mr-2" />
                Nous contacter
              </a>
              <a
                href="/faq"
                className="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-semibold border border-white/30"
              >
                <FileText className="h-5 w-5 mr-2" />
                Voir la FAQ
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

