'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Shield, ArrowRight, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
              <span>Politique de confidentialité</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Politique de Confidentialité
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Protection de vos données personnelles
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div className="mb-8">
                <Shield className="h-12 w-12 text-mdsc-blue-primary mb-4" />
                <p className="text-gray-600">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  La Maison de la Société Civile (MdSC) s'engage à protéger votre vie privée et vos données personnelles. 
                  Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Collectées</h2>
                <p className="text-gray-700 mb-4">
                  Nous collectons les données suivantes :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Informations d'identification (nom, prénom, email)</li>
                  <li>Informations de compte (nom d'utilisateur, mot de passe)</li>
                  <li>Données de navigation (adresse IP, cookies)</li>
                  <li>Données de progression dans les cours</li>
                  <li>Informations de paiement (traitées de manière sécurisée)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des Données</h2>
                <p className="text-gray-700 mb-4">
                  Vos données sont utilisées pour :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Fournir et améliorer nos services</li>
                  <li>Gérer votre compte et vos inscriptions</li>
                  <li>Traiter vos paiements</li>
                  <li>Vous envoyer des notifications importantes</li>
                  <li>Analyser l'utilisation de la plateforme</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Protection des Données</h2>
                <p className="text-gray-700 mb-4">
                  Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre 
                  l'accès non autorisé, la modification, la divulgation ou la destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos Droits</h2>
                <p className="text-gray-700 mb-4">
                  Vous avez le droit de :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Accéder à vos données personnelles</li>
                  <li>Rectifier vos données</li>
                  <li>Supprimer vos données</li>
                  <li>Vous opposer au traitement de vos données</li>
                  <li>Demander la portabilité de vos données</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences 
                  de cookies dans les paramètres de votre navigateur.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
                <p className="text-gray-700 mb-4">
                  Pour toute question concernant cette politique, contactez-nous à :
                </p>
                <p className="text-gray-700">
                  <strong>Email :</strong> privacy@mdscbenin.org<br />
                  <strong>Adresse :</strong> Maison de la Société Civile, Cotonou, Bénin
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

