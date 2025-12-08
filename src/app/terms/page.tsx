'use client';

import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';

export default function TermsPage() {
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
              <span>Conditions d'utilisation</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Conditions d'Utilisation
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Règles et conditions d'utilisation de la plateforme
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div className="mb-8">
                <FileText className="h-12 w-12 text-mdsc-blue-primary mb-4" />
                <p className="text-gray-600">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des Conditions</h2>
                <p className="text-gray-700 mb-4">
                  En accédant et en utilisant la plateforme Maison de la Société Civile, vous acceptez d'être lié par ces conditions d'utilisation. 
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Utilisation de la Plateforme</h2>
                <p className="text-gray-700 mb-4">
                  Vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Utiliser la plateforme conformément à la loi</li>
                  <li>Ne pas partager vos identifiants de connexion</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Ne pas perturber le fonctionnement de la plateforme</li>
                  <li>Fournir des informations exactes et à jour</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compte Utilisateur</h2>
                <p className="text-gray-700 mb-4">
                  Vous êtes responsable de la sécurité de votre compte et de toutes les activités qui s'y déroulent. 
                  Vous devez nous informer immédiatement de toute utilisation non autorisée.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriété Intellectuelle</h2>
                <p className="text-gray-700 mb-4">
                  Tout le contenu de la plateforme (cours, vidéos, documents) est protégé par le droit d'auteur. 
                  Vous ne pouvez pas reproduire, distribuer ou modifier ce contenu sans autorisation.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Paiements et Remboursements</h2>
                <p className="text-gray-700 mb-4">
                  Les paiements sont traités de manière sécurisée. Les remboursements sont possibles dans les 7 jours 
                  suivant l'achat, sous certaines conditions. Consultez notre politique de remboursement pour plus de détails.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation de Responsabilité</h2>
                <p className="text-gray-700 mb-4">
                  La plateforme est fournie "en l'état". Nous ne garantissons pas que la plateforme sera exempte d'erreurs 
                  ou d'interruptions. Nous ne serons pas responsables des dommages indirects résultant de l'utilisation de la plateforme.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications des Conditions</h2>
                <p className="text-gray-700 mb-4">
                  Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur 
                  dès leur publication sur la plateforme.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
                <p className="text-gray-700 mb-4">
                  Pour toute question concernant ces conditions, contactez-nous à :
                </p>
                <p className="text-gray-700">
                  <strong>Email :</strong> legal@mdscbenin.org<br />
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

