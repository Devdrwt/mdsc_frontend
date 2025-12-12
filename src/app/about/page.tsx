'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Download, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16" style={{ backgroundImage: `url('/Hero.png')` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Guide Utilisateur de la Plateforme
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-mdsc-blue-primary rounded-full flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Résumé */}
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6 mb-8">
            <p>
              Ce guide complet présente l'ensemble des fonctionnalités et parcours utilisateurs de la plateforme Maison de la Société Civile. Il constitue une référence exhaustive pour tous les utilisateurs, qu'ils soient Utilisateurs, Formateurs ou administrateurs.
            </p>
            
            <p>
              La plateforme Maison de la Société Civile est conçue pour faciliter la gestion, la coordination et le suivi des organisations de la société civile à travers une expérience d'apprentissage complète, intuitive et personnalisée. Chaque rôle dispose d'outils adaptés pour accomplir ses missions efficacement.
            </p>
            
            <p>
              Pour les Utilisateurs, la plateforme offre un environnement d'apprentissage riche avec suivi de progression, gamification, assistant IA, et délivrance de certificats.
            </p>
            
            <p>
              Nous espérons que ce guide vous aidera à tirer le meilleur parti de la plateforme Maison de la Société Civile et contribuera au succès de vos projets de formation et de développement des compétences au sein des organisations de la société civile.
            </p>
          </div>

          {/* Bouton de téléchargement */}
          <div className="flex justify-center mt-12">
            <a
              href="/Guide Utilisateur Mdsc.pdf"
              download="Guide Utilisateur Mdsc.pdf"
              className="inline-flex items-center px-8 py-4 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Download className="h-5 w-5 mr-3" />
              Télécharger le guide utilisateur (PDF)
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
