'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Mail,
  Search,
  X
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Liste de 10 questions principales
  const faqItems: FAQItem[] = [
    {
      question: 'Qu\'est-ce que la plateforme MdSC ?',
      answer: 'La plateforme MdSC (Maison de la Société Civile) est une plateforme de formation en ligne (MOOC) dédiée au renforcement des capacités des acteurs de la société civile. Elle propose des cours certifiants dans divers domaines pour développer vos compétences professionnelles.'
    },
    {
      question: 'Comment puis-je m\'inscrire sur la plateforme ?',
      answer: 'Pour vous inscrire, cliquez sur le bouton "S\'inscrire" en haut à droite de la page d\'accueil. Remplissez le formulaire avec vos informations personnelles, choisissez votre rôle (étudiant, formateur, etc.) et validez votre adresse email. Une fois votre compte créé, vous pourrez accéder à tous les cours disponibles.'
    },
    {
      question: 'La plateforme est-elle gratuite ?',
      answer: 'Certains cours sont gratuits, tandis que d\'autres peuvent être payants. Le prix de chaque cours est indiqué sur sa page de description. Nous proposons également des promotions et des offres spéciales régulièrement.'
    },
    {
      question: 'Comment m\'inscrire à un cours ?',
      answer: 'Parcourez le catalogue de cours, cliquez sur le cours qui vous intéresse, puis sur "S\'inscrire" ou "Acheter" selon que le cours est gratuit ou payant. Une fois inscrit, le cours apparaîtra dans votre tableau de bord étudiant.'
    },
    {
      question: 'Comment obtenir une attestation ?',
      answer: 'Pour obtenir une attestation, vous devez compléter tous les modules du cours, réussir tous les quiz intermédiaires et passer l\'évaluation finale avec une note minimale requise. Une fois ces conditions remplies, votre attestation sera générée automatiquement.'
    },
    {
      question: 'J\'ai oublié mon mot de passe. Que faire ?',
      answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre adresse email et vous recevrez un lien de réinitialisation. Cliquez sur le lien dans l\'email et suivez les instructions pour créer un nouveau mot de passe sécurisé.'
    },
    {
      question: 'Les leçons sont-elles marquées automatiquement comme complétées ?',
      answer: 'Oui ! Pour les leçons texte, PDF et PowerPoint, la leçon est automatiquement marquée comme complétée lorsque vous scrollez jusqu\'à la fin du contenu. Pour les vidéos et audios, la leçon est complétée uniquement lorsque vous regardez ou écoutez l\'intégralité du contenu sans sauter ou avancer rapidement.'
    },
    {
      question: 'Quels modes de paiement sont acceptés ?',
      answer: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), mobile money (MTN, Moov), et autres méthodes de paiement locales selon votre pays. Tous les paiements sont sécurisés via notre partenaire de paiement certifié.'
    },
    {
      question: 'Comment devenir formateur sur la plateforme ?',
      answer: 'Pour devenir formateur, vous devez créer un compte avec le rôle "Formateur", puis soumettre votre candidature avec vos qualifications et expériences. Notre équipe examinera votre candidature et vous contactera pour la suite du processus.'
    },
    {
      question: 'Puis-je accéder aux cours sur mobile ?',
      answer: 'Oui, notre plateforme est entièrement responsive et optimisée pour les appareils mobiles. Vous pouvez accéder à vos cours depuis votre smartphone ou tablette avec la même expérience utilisateur.'
    }
  ];

  // Fonction de filtrage mémorisée
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqItems;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return faqItems.filter(item => 
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  // Ouvrir automatiquement les questions avec résultats de recherche
  useEffect(() => {
    if (searchQuery.trim() && filteredItems.length > 0) {
      const newOpenItems = new Set<string>();
      filteredItems.forEach((_, index) => {
        newOpenItems.add(`item-${index}`);
      });
      setOpenItems(newOpenItems);
    } else if (!searchQuery.trim()) {
      setOpenItems(new Set());
    }
  }, [searchQuery, filteredItems.length]);

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setOpenItems(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary text-white py-20 md:py-24 overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Centre d'Aide
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
                Trouvez rapidement les réponses à vos questions
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Barre de recherche améliorée */}
            <div className="mb-10 md:mb-12">
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-14 py-5 text-lg border-2 border-gray-200 rounded-xl focus:border-mdsc-blue-primary focus:ring-4 focus:ring-mdsc-blue-primary/10 outline-none text-gray-900 placeholder-gray-400 transition-all shadow-sm hover:shadow-md bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-10"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary/10 text-mdsc-blue-primary rounded-full text-sm font-medium">
                    {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} trouvé{filteredItems.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* FAQ Items */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 md:py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Aucune question ne correspond à votre recherche "{searchQuery}"
                </p>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Effacer la recherche
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item, index) => {
                  const itemId = `item-${index}`;
                  const isOpen = openItems.has(itemId);
                  
                  return (
                    <div
                      key={itemId}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50/50 transition-colors group"
                      >
                        <span className="font-semibold text-gray-900 pr-6 text-base md:text-lg leading-relaxed group-hover:text-mdsc-blue-primary transition-colors">
                          {item.question}
                        </span>
                        <div className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                          isOpen 
                            ? 'bg-mdsc-blue-primary/10 text-mdsc-blue-primary rotate-180' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-mdsc-blue-primary/10 group-hover:text-mdsc-blue-primary'
                        }`}>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-6 py-5 border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white animate-in slide-in-from-top-2 duration-300">
                          <p className="text-gray-700 leading-relaxed text-base">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contact Section améliorée */}
            <div className="mt-16 md:mt-20 bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-grow text-white">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">
                      Besoin d'aide supplémentaire ?
                    </h3>
                    <p className="text-white/90 text-lg mb-6 leading-relaxed">
                      Notre équipe de support est disponible pour répondre à toutes vos questions. Contactez-nous et nous vous répondrons dans les plus brefs délais.
                    </p>
                    <a
                      href="https://mdsc-website.webflow.io/contact-us"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-8 py-4 bg-white text-mdsc-blue-primary rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Nous contacter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

