'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Shield, 
  Globe, 
  CheckCircle2,
  User,
  UserCog,
  Settings,
  Mail,
  Lock,
  Search,
  Smartphone,
  Languages,
  Moon,
  Sun,
  MessageSquare,
  HelpCircle,
  Award,
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  Zap,
  Target,
  Lightbulb,
  Heart,
  Building,
  Network,
  ChevronRight,
  ExternalLink,
  Clock,
  Star,
  TrendingUp,
  Eye,
  Download,
  Share2,
  Link as LinkIcon,
  Menu,
  X
} from 'lucide-react';

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 200;

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id') || '';

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsTocOpen(false);
    }
  };

  const tableOfContents = [
    { id: 'presentation', title: '1. Présentation de la Plateforme', subsections: [
      { id: 'acces', title: '1.1. Accès à la Plateforme' },
      { id: 'types-utilisateurs', title: '1.1.2. Types d\'Utilisateurs' }
    ]},
    { id: 'parcours-Utilisateur', title: '2. Parcours Utilisateur - Utilisateur', subsections: [
      { id: 'inscription-auth', title: '2.1. Inscription et Authentification' },
      { id: 'dashboard-Utilisateur', title: '2.2. Tableau de Bord' },
      { id: 'catalogue', title: '2.3. Menu Catalogue' },
      { id: 'inscription-paiement', title: '2.4. Inscription aux Cours et Paiement' },
      { id: 'mes-cours', title: '2.5. Menu Mes Cours' },
      { id: 'progression', title: '2.6. Menu Progression' },
      { id: 'evaluations', title: '2.7. Menu Évaluations' },
      { id: 'certificats', title: '2.8. Menu Certificats' },
      { id: 'gamification', title: '2.9. Menu Gamification' },
      { id: 'assistant-ia', title: '2.10. Menu Assistant IA' },
      { id: 'calendrier', title: '2.11. Menu Calendrier' },
      { id: 'messagerie', title: '2.12. Menu Messagerie' },
      { id: 'profil', title: '2.13. Menu Profil' },
      { id: 'parametres', title: '2.14. Menu Paramètres' }
    ]},
    { id: 'parcours-Formateur', title: '3. Parcours Utilisateur - Formateur', subsections: [
      { id: 'inscription-Formateur', title: '3.1. Inscription et Authentification' },
      { id: 'dashboard-Formateur', title: '3.2. Tableau de Bord Formateur' },
      { id: 'gestion-cours', title: '3.3. Gestion des Cours' },
      { id: 'gestion-modules', title: '3.4. Gestion des Modules' },
      { id: 'gestion-Utilisateurs', title: '3.5. Gestion des Utilisateurs' },
      { id: 'analytics', title: '3.6. Analytics & Rapports' },
      { id: 'evaluations-Formateur', title: '3.7. Gestion des Évaluations' }
    ]},
    { id: 'parcours-admin', title: '4. Parcours Utilisateur - Administrateur', subsections: [
      { id: 'auth-admin', title: '4.1. Authentification Admin' },
      { id: 'dashboard-admin', title: '4.2. Tableau de Bord Administrateur' },
      { id: 'gestion-utilisateurs', title: '4.3. Gestion des Utilisateurs' },
      { id: 'moderation-cours', title: '4.4. Modération des Cours' }
    ]},
    { id: 'fonctionnalites-transversales', title: '5. Fonctionnalités Transversales', subsections: [
      { id: 'auth-securite', title: '5.1. Authentification et Sécurité' },
      { id: 'recherche', title: '5.2. Recherche Globale' },
      { id: 'pwa', title: '5.3. Application Mobile / PWA' },
      { id: 'multilingue', title: '5.4. Multilingue et Personnalisation' },
      { id: 'support', title: '5.5. Support et Assistance' }
    ]},
      { id: 'annexes', title: '6. Annexes', subsections: [
      { id: 'raccourcis', title: '6.1. Raccourcis Clavier' },
      { id: 'contact', title: '6.2. Contact et Support' }
    ]}
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16" style={{ backgroundImage: `url('/Hero.png')` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Guide Complet Plateforme Maison de la Société Civile
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto mb-6">
            Management de la Société Civile
          </p>
          <p className="text-lg text-white opacity-75 max-w-2xl mx-auto">
            Documentation complète de la plateforme d'apprentissage en ligne pour les organisations de la société civile
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Table des matières</h2>
              <nav className="space-y-2">
                {tableOfContents.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-mdsc-blue-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {section.title}
                    </button>
                    {section.subsections && section.subsections.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => scrollToSection(subsection.id)}
                            className={`w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
                              activeSection === subsection.id
                                ? 'bg-mdsc-blue-primary/10 text-mdsc-blue-primary font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {subsection.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Table of Contents - Mobile */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="w-full flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <span className="font-medium text-gray-900">Table des matières</span>
              {isTocOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {isTocOpen && (
              <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <nav className="space-y-2">
                  {tableOfContents.map((section) => (
                    <div key={section.id} className="space-y-1">
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left text-sm font-medium py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100"
                      >
                        {section.title}
                      </button>
                      {section.subsections && section.subsections.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {section.subsections.map((subsection) => (
                            <button
                              key={subsection.id}
                              onClick={() => scrollToSection(subsection.id)}
                              className="w-full text-left text-xs py-1.5 px-2 rounded text-gray-600 hover:bg-gray-50"
                            >
                              {subsection.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1 prose prose-lg max-w-none">
            {/* Section 1: Présentation */}
            <section id="presentation" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                1. Présentation de la Plateforme
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Maison de la Société Civile est une application web innovante développée pour faciliter la gestion, la coordination et le suivi des organisations de la société civile. Elle centralise les données, automatise les processus administratifs, renforce la traçabilité des actions et améliore l'efficacité des programmes de formation.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                L'application s'adresse principalement aux administrateurs, aux formateurs et aux organisations participantes. Elle offre une variété de fonctionnalités telles que la gestion des inscriptions, le tableau de bord, la planification des sessions, la production de certificats, la communication interne et le stockage sécurisé des données.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Son objectif principal est de renforcer la crédibilité, la productivité et l'innovation au sein des organisations de la société civile.
              </p>

              <div id="acces" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Globe className="h-6 w-6 text-mdsc-blue-primary mr-2" />
                  1.1. Accès à la Plateforme
                </h3>
                <p className="text-gray-700 mb-4">
                  L'application Maison de la Société Civile est accessible en ligne via l'URL suivante :
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <a href="https://mooc.mdscbenin.org/" target="_blank" rel="noopener noreferrer" className="text-mdsc-blue-primary hover:underline flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    https://mooc.mdscbenin.org/
                  </a>
                </div>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.1.1. Pré-requis d'Accès</h4>
                <p className="text-gray-700 mb-3">Pour accéder à la plateforme, l'utilisateur doit disposer :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li>D'une connexion Internet stable</li>
                  <li>D'un navigateur à jour (Google Chrome recommandé)</li>
                  <li>D'un compte utilisateur (identifiants fournis lors de l'inscription)</li>
                </ul>
              </div>

              <div id="types-utilisateurs" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="h-6 w-6 text-mdsc-blue-primary mr-2" />
                  1.1.2. Types d'Utilisateurs et Espaces Associés
                </h3>
                <p className="text-gray-700 mb-6">
                  La plateforme Maison de la Société Civile prend en charge trois types d'utilisateurs, chacun ayant accès à un environnement personnalisé correspondant à ses responsabilités.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mr-3">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Administrateur</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Accès complet à l'ensemble de la plateforme</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Gère les utilisateurs, les contenus, les formations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tableau de bord Administrateur</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-[#D79A49] rounded-full flex items-center justify-center mr-3">
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Formateur</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Création et gestion des formations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Suivi de la progression des Utilisateurs</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tableau de bord Formateur</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Utilisateur</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Suivre les cours et visualiser sa progression</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Télécharger ses certificats</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tableau de bord Utilisateur</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Parcours Utilisateur */}
            <section id="parcours-Utilisateur" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                2. Parcours Utilisateur - Utilisateur
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                L'Utilisateur commence par créer son propre compte avant d'accéder à la plateforme. Cette section détaille toutes les fonctionnalités disponibles pour les Utilisateurs.
              </p>

              <div id="inscription-auth" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.1. Inscription et Authentification</h3>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1.1. Création de Compte</h4>
                <p className="text-gray-700 mb-3">Procédure d'inscription :</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                  <li>Accéder à la page d'accueil via https://mooc.mdscbenin.org/</li>
                  <li>Cliquer sur « S'Inscrire » pour accéder au formulaire d'inscription</li>
                  <li>Sélectionner le rôle « Utilisateur »</li>
                  <li>Remplir le formulaire d'inscription avec les informations requises</li>
                </ol>

                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Informations personnelles (obligatoires) :</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Prénom</li>
                    <li>Nom</li>
                    <li>Adresse email (doit être unique)</li>
                    <li>Téléphone (facultatif)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Informations professionnelles :</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Organisation (facultatif)</li>
                    <li>Pays (obligatoire)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Sécurité du compte :</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Mot de passe (minimum 8 caractères, incluant majuscule, minuscule et chiffre)</li>
                    <li>Confirmer le mot de passe</li>
                  </ul>
                </div>

                <p className="text-gray-700 mb-4">
                  <strong>Options d'authentification externe :</strong> Un lien permet de s'inscrire via un compte externe en cliquant sur « Ou continuer avec » (Google, si disponible).
                </p>

                <div className="bg-gray-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-black">
                    <strong>Note importante :</strong> Les privilèges avancés sont attribués après validation par l'équipe Maison de la Société Civile. Avant de valider son inscription, l'utilisateur doit accepter les Conditions d'utilisation et la Politique de confidentialité. Un email de vérification est envoyé à l'adresse fournie.
                  </p>
                </div>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1.2. Vérification de l'Email</h4>
                <p className="text-gray-700 mb-3">Procédure :</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                  <li>Ouvrir l'email reçu depuis le système Maison de la Société Civile</li>
                  <li>Cliquer sur le lien de vérification dans l'email</li>
                  <li>Ou copier le token et le coller sur la page de vérification</li>
                  <li>Redirection automatique vers la page de connexion</li>
                </ol>
                <p className="text-gray-700 mb-4">
                  <strong>En cas de problème :</strong> Utiliser « Renvoyer l'email de vérification » depuis la page de connexion ou vérifier le dossier spam/courrier indésirable.
                </p>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1.3. Connexion</h4>
                <p className="text-gray-700 mb-3">Procédure de connexion :</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                  <li>Accéder à la page de connexion</li>
                  <li>Entrer l'adresse email et le mot de passe</li>
                  <li>Option : Cocher « Se souvenir de moi » pour garder la session active</li>
                  <li>Cliquer sur « Se connecter »</li>
                </ol>
                <p className="text-gray-700 mb-4">
                  <strong>Options de connexion disponibles :</strong> Connexion classique (email/mot de passe) ou connexion avec Google (si activée).
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Résultat attendu :</strong> Redirection vers le tableau de bord Utilisateur. Session active pour 7 jours (ou 30 jours avec refresh token).
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>En cas d'oubli du mot de passe :</strong> Cliquer sur « Mot de passe oublié ? » pour lancer la réinitialisation automatique.
                </p>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1.4. Réinitialisation du Mot de Passe</h4>
                <p className="text-gray-700 mb-3">Procédure :</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                  <li>Sur la page de connexion, cliquer sur « Mot de passe oublié ? »</li>
                  <li>Entrer l'adresse email du compte</li>
                  <li>Cliquer sur « Envoyer le lien de réinitialisation »</li>
                  <li>Ouvrir l'email reçu</li>
                  <li>Cliquer sur le lien ou copier le token</li>
                  <li>Saisir le nouveau mot de passe (respectant les critères)</li>
                  <li>Confirmer le nouveau mot de passe</li>
                  <li>Cliquer sur « Réinitialiser le mot de passe »</li>
                </ol>
              </div>

              <div id="dashboard-Utilisateur" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.2. Tableau de Bord (Dashboard)</h3>
                <p className="text-gray-700 mb-6">
                  Le tableau de bord permet à l'Utilisateur de suivre facilement sa progression et ses activités sur la plateforme. C'est le point central de navigation et de suivi de l'apprentissage.
                </p>

                <h4 className="text-xl font-semibold text-gray-900 mb-3">2.2.1. Indicateurs de Performance</h4>
                <p className="text-gray-700 mb-3">Le tableau de bord affiche les indicateurs suivants :</p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-mdsc-blue-primary mr-2" />
                      <span className="font-semibold text-gray-900">Cours actifs</span>
                    </div>
                    <p className="text-gray-600 text-sm">Nombre total de cours que vous suivez actuellement</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-gray-900">Cours terminés</span>
                    </div>
                    <p className="text-gray-600 text-sm">Nombre de cours finalisés avec certificats associés</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-semibold text-gray-900">Points</span>
                    </div>
                    <p className="text-gray-600 text-sm">Total des points accumulés grâce à vos activités</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-semibold text-gray-900">Niveau</span>
                    </div>
                    <p className="text-gray-600 text-sm">Votre niveau actuel dans le système de progression</p>
                  </div>
                </div>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2.2. Progression des Cours</h4>
                <p className="text-gray-700 mb-4">Cette section permet de suivre l'avancement de votre apprentissage :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li><strong>Nombre de cours suivis :</strong> Indique combien de cours vous suivez actuellement</li>
                  <li><strong>Objectif hebdomadaire :</strong> Montre votre progression par rapport à votre objectif de la semaine (en pourcentage)</li>
                  <li><strong>Cours restants :</strong> Précise le nombre de cours à compléter pour atteindre votre objectif hebdomadaire</li>
                </ul>

                <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2.3. Actions Rapides des Cours</h4>
                <p className="text-gray-700 mb-4">Cette section offre un accès direct aux fonctionnalités les plus utilisées :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li><strong>Continuer / Reprendre mes cours :</strong> Permet de reprendre rapidement le cours là où vous l'avez laissé</li>
                  <li><strong>Assistant IA — Poser une question :</strong> Possibilité de poser vos questions et d'obtenir de l'aide via l'IA intégrée</li>
                  <li><strong>Évaluations — Quiz et devoirs :</strong> Accès aux évaluations associées à vos cours</li>
                  <li><strong>Favoris — Cours sauvegardés :</strong> Retrouvez facilement les cours marqués comme favoris</li>
                </ul>
              </div>

              {/* Continue avec les autres sections... */}
              {/* Pour économiser de l'espace, je vais créer les sections principales avec les informations essentielles */}
              
              <div id="catalogue" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.3. Menu Catalogue</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Catalogue vous permet d'explorer l'ensemble des formations disponibles sur la plateforme et de choisir celles qui correspondent le mieux à vos objectifs d'apprentissage.
                </p>
                <p className="text-gray-700 mb-4">
                  Vous pouvez parcourir les cours par domaine, consulter leur contenu détaillé et vérifier leur coût, leur durée et le nombre d'inscrits. Utilisez la barre de recherche ou les filtres pour trouver rapidement une formation correspondant à vos besoins.
                </p>
              </div>

              <div id="inscription-paiement" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.4. Inscription aux Cours et Paiement</h3>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">2.4.1. Inscription à un Cours Gratuit</h4>
                <p className="text-gray-700 mb-4">
                  Pour les cours gratuits, l'inscription est immédiate après avoir cliqué sur « S'inscrire maintenant » ou « Commencer ». Vous êtes redirigé vers le lecteur de cours et le cours est ajouté à « Mes Cours ».
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">2.4.2. Inscription à un Cours Payant</h4>
                <p className="text-gray-700 mb-4">
                  Pour les cours payants, vous devez compléter le processus de paiement. Les méthodes disponibles incluent la carte bancaire (via GobiPay, FedaPay) et le Mobile Money. Après validation du paiement, l'accès au cours est activé automatiquement.
                </p>
              </div>

              {/* Sections restantes avec structure similaire */}
              <div id="mes-cours" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.5. Menu Mes Cours</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Mes Cours vous permet de gérer vos formations, suivre votre progression et accéder rapidement à tous vos contenus d'apprentissage. Vous pouvez filtrer par statut (Tous, En cours, Terminés, Certifiés) et accéder directement au contenu des cours.
                </p>
              </div>

              <div id="progression" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.6. Menu Progression</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Ma Progression vous permet de suivre l'évolution de vos apprentissages sur l'ensemble de vos cours, en visualisant à la fois vos réalisations et votre progression globale. Vous pouvez voir le nombre de cours terminés, les leçons complétées, le temps suivi et votre progression globale.
                </p>
              </div>

              <div id="evaluations" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.7. Menu Évaluations</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Mes Évaluations vous permet de suivre l'ensemble de vos quiz, devoirs et examens, ainsi que de consulter vos résultats. Vous pouvez passer les quiz de module et l'évaluation finale, et voir immédiatement vos résultats avec les explications pour chaque question.
                </p>
              </div>

              <div id="certificats" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.8. Menu Certificats</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Mes Certificats vous permet de consulter tous les certificats obtenus à l'issue de vos cours et évaluations. Après avoir complété un cours à 100% et réussi l'évaluation finale, vous pouvez demander votre attestation. Le certificat PDF est généré avec un code de vérification unique et un QR code pour vérification de l'authenticité.
                </p>
              </div>

              <div id="gamification" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.9. Menu Gamification</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Gamification vous permet de suivre votre parcours d'apprentissage de manière ludique, en visualisant vos points, badges et votre niveau dans le système de progression de la plateforme. Vous pouvez voir votre niveau actuel, vos points totaux, vos badges obtenus et votre classement par rapport aux autres Utilisateurs.
                </p>
              </div>

              <div id="assistant-ia" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.10. Menu Assistant IA</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Assistant IA Personnel vous offre un compagnon d'apprentissage intelligent, capable de répondre à vos questions, générer des résumés et recommander des cours adaptés à votre profil. Vous pouvez poser des questions sur vos cours, demander des explications détaillées, générer des résumés automatiques et recevoir des recommandations personnalisées.
                </p>
              </div>

              <div id="calendrier" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.11. Menu Calendrier</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Calendrier vous permet de visualiser et de gérer vos cours, évaluations et événements programmés. Vous pouvez voir tous les jours du mois en cours avec une légende pour identifier chaque type d'événement (cours, quiz, deadline, rappel).
                </p>
              </div>

              <div id="messagerie" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.12. Menu Messagerie</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Messagerie vous permet de gérer toutes vos communications internes avec d'autres utilisateurs de la plateforme. Vous pouvez consulter vos messages reçus et envoyés, et rédiger de nouveaux messages.
                </p>
              </div>

              <div id="profil" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.13. Menu Profil</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Profil Utilisateur vous permet de gérer et mettre à jour toutes vos informations personnelles, incluant votre photo de profil, votre pièce d'identité, et vos informations de contact.
                </p>
              </div>

              <div id="parametres" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2.14. Menu Paramètres et Préférences</h3>
                <p className="text-gray-700 mb-4">
                  Le menu Paramètres vous permet d'adapter votre expérience sur la plateforme. Vous pouvez configurer vos notifications, ajuster vos préférences d'apprentissage, personnaliser l'apparence et la langue, et gérer vos données et confidentialité.
                </p>
              </div>
            </section>

            {/* Section 3: Parcours Formateur */}
            <section id="parcours-Formateur" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <GraduationCap className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                3. Parcours Utilisateur - Formateur
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                L'Formateur (formateur) reçoit ses identifiants depuis l'équipe de gestion du système ou s'inscrit avec le rôle d'Formateur. Après connexion, il est automatiquement redirigé vers son tableau de bord Formateur.
              </p>

              <div id="dashboard-Formateur" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.2. Tableau de Bord Formateur</h3>
                <p className="text-gray-700 mb-4">
                  Le tableau de bord affiche les statistiques clés : nombre total d'Utilisateurs inscrits et actifs, total des cours créés (publiés ou en attente), revenus générés, et note moyenne des évaluations reçues.
                </p>
                <p className="text-gray-700 mb-4">
                  Le formateur peut effectuer directement plusieurs actions depuis le tableau de bord : créer un nouveau cours, gérer les modules, consulter les Utilisateurs, visualiser les analytics, créer et gérer les évaluations, et accéder à la messagerie.
                </p>
              </div>

              <div id="gestion-cours" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.3. Gestion des Cours</h3>
                <p className="text-gray-700 mb-4">
                  Cette section permet à l'Formateur de créer, gérer et suivre l'ensemble de ses cours. La création d'un cours comprend plusieurs étapes : informations de base (titre, description, catégorie), paramètres (prix, durée, prérequis), structure (modules et leçons), et évaluations (quiz par module et évaluation finale).
                </p>
              </div>

              <div id="gestion-modules" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.4. Gestion des Modules</h3>
                <p className="text-gray-700 mb-4">
                  Sur la page « Gestion des Modules », l'Formateur accède à l'ensemble des modules rattachés au cours. Il peut ajouter de nouveaux modules, réorganiser l'ordre, ajouter des leçons/vidéos/quiz, et définir les règles de déblocage.
                </p>
              </div>

              <div id="gestion-Utilisateurs" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.5. Gestion des Utilisateurs</h3>
                <p className="text-gray-700 mb-4">
                  Le menu permet de suivre en temps réel la progression des Utilisateurs inscrits. Le tableau de bord affiche le nombre total d'Utilisateurs, les Utilisateurs actifs, les cours complétés, et la progression moyenne. La liste détaillée montre pour chaque Utilisateur : nom, statut, email, cours inscrit, date d'inscription, dernière activité, et progression.
                </p>
              </div>

              <div id="analytics" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.6. Analytics & Rapports</h3>
                <p className="text-gray-700 mb-4">
                  Le menu permet de mesurer l'efficacité des formations avec des statistiques globales, des graphiques d'évolution mensuelle et d'engagement hebdomadaire, et la performance détaillée de chaque cours (inscriptions, taux de complétion, notes).
                </p>
              </div>

              <div id="evaluations-Formateur" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3.7. Gestion des Évaluations</h3>
                <p className="text-gray-700 mb-4">
                  Le menu rassemble l'ensemble des examens finaux créés avec un résumé (nombre total d'évaluations, publiées, soumissions, taux de réussite global) et un tableau listant toutes les évaluations finales par cours avec les actions disponibles : ouvrir, consulter réponses, attribuer note, modifier statut.
                </p>
              </div>
            </section>

            {/* Section 4: Parcours Administrateur */}
            <section id="parcours-admin" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                4. Parcours Utilisateur - Administrateur
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                L'administrateur dispose d'un accès complet à l'ensemble de la plateforme pour gérer les utilisateurs, les contenus, les formations et le fonctionnement général du système.
              </p>

              <div id="dashboard-admin" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">4.2. Tableau de Bord Administrateur</h3>
                <p className="text-gray-700 mb-4">
                  Le tableau de bord affiche les statistiques globales : nombre total d'utilisateurs (Utilisateurs, Formateurs, admins), nombre total de cours (publiés, en attente, brouillons), inscriptions totales et revenus globaux, taux de complétion moyen et santé du système.
                </p>
              </div>

              <div id="gestion-utilisateurs" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">4.3. Gestion des Utilisateurs</h3>
                <p className="text-gray-700 mb-4">
                  Fonctionnalités disponibles : consulter tous les utilisateurs avec leurs informations complètes, gérer un utilisateur (modifier informations, changer rôle, activer/désactiver, suspendre, supprimer, réinitialiser mot de passe), créer un utilisateur avec formulaire complet, et modérer les utilisateurs (examiner signalements, avertir, suspendre, bannir).
                </p>
              </div>

              <div id="moderation-cours" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">4.4. Modération des Cours</h3>
                <p className="text-gray-700 mb-4">
                  L'administrateur peut approuver ou rejeter un cours en examinant le contenu complet, la qualité, et le respect des règles. Les actions disponibles incluent : approuver (publication automatique), rejeter (avec raison), demander modifications, et gérer les cours publiés (modifier, suspendre, supprimer, voir statistiques).
                </p>
              </div>
            </section>

            {/* Section 5: Fonctionnalités Transversales */}
            <section id="fonctionnalites-transversales" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                5. Fonctionnalités Transversales
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Cette section présente les fonctionnalités communes à tous les types d'utilisateurs de la plateforme.
              </p>

              <div id="auth-securite" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5.1. Authentification et Sécurité</h3>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.1.1. Connexion avec Google</h4>
                <p className="text-gray-700 mb-4">
                  Sur la page de connexion, cliquer sur « Continuer avec Google », autoriser l'accès, et le compte est créé ou connecté automatiquement.
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.1.2. Gestion de Session</h4>
                <p className="text-gray-700 mb-4">
                  Session active pendant 7 jours, refresh automatique du token, déconnexion automatique après inactivité prolongée, déconnexion manuelle disponible.
                </p>
              </div>

              <div id="recherche" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5.2. Recherche Globale</h3>
                <p className="text-gray-700 mb-4">
                  Utiliser la barre de recherche dans le header pour rechercher cours, Formateurs, contenu. Les résultats sont filtrés selon les permissions de l'utilisateur.
                </p>
              </div>

              <div id="pwa" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5.3. Application Mobile / Progressive Web App</h3>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.3.1. Installation PWA</h4>
                <p className="text-gray-700 mb-4">
                  Sur mobile, visiter le site, notification « Ajouter à l'écran d'accueil », installer l'application, utiliser comme une app native.
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.3.2. Utilisation Hors Ligne</h4>
                <p className="text-gray-700 mb-4">
                  Télécharger le contenu pour utilisation hors ligne (vidéos, PDFs), consulter hors ligne, synchronisation automatique au retour en ligne.
                </p>
              </div>

              <div id="multilingue" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5.4. Multilingue et Personnalisation</h3>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.4.1. Changer la Langue</h4>
                <p className="text-gray-700 mb-4">
                  Accéder aux paramètres, sélectionner la langue préférée (Français ou English), l'interface change immédiatement.
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.4.2. Thème (Clair/Sombre)</h4>
                <p className="text-gray-700 mb-4">
                  Paramètres → Apparence, sélectionner le thème (clair, sombre ou automatique), application immédiate.
                </p>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">5.4.3. Rappel de Progression</h4>
                <p className="text-gray-700 mb-4">
                  Le système de rappels automatiques par email permet d'envoyer des notifications aux Utilisateurs qui ont commencé un cours mais qui sont devenus inactifs. Les rappels sont envoyés à des intervalles précis : 3 jours, 7 jours, et 14 jours après la dernière activité, puis tous les 14 jours après le premier rappel à 14 jours.
                </p>
              </div>

              <div id="support" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">5.5. Support et Assistance</h3>
                <p className="text-gray-700 mb-4">
                  Accéder à « Support » ou « Aide » pour : formulaire de contact, email de support, FAQ (Foire aux questions), soumettre une demande d'assistance.
                </p>
              </div>
            </section>

            {/* Section 6: Annexes */}
            <section id="annexes" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="h-8 w-8 text-mdsc-blue-primary mr-3" />
                6. Annexes
              </h2>

              <div id="raccourcis" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">6.1. Raccourcis Clavier</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li><strong>Espace :</strong> Play/Pause (lecture vidéo)</li>
                  <li><strong>Flèches :</strong> Navigation dans les cours</li>
                  <li><strong>M :</strong> Activer/Désactiver le son</li>
                </ul>
              </div>

              <div id="contact" className="mb-8 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">6.2. Contact et Support</h3>
                <p className="text-gray-700 mb-4">Pour toute question ou assistance :</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li><strong>Site web :</strong> <a href="https://mooc.mdscbenin.org/" target="_blank" rel="noopener noreferrer" className="text-mdsc-blue-primary hover:underline">https://mooc.mdscbenin.org/</a></li>
                  <li><strong>Email :</strong> support@mdsc.com</li>
                  <li><strong>Assistance technique :</strong> Disponible via le formulaire de contact sur la plateforme</li>
                </ul>
              </div>
            </section>

            {/* Conclusion */}
            <section className="mb-16 bg-gradient-to-r from-mdsc-blue-primary to-[#3B7C8A] rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
              <p className="text-lg leading-relaxed mb-4">
                Ce guide complet présente l'ensemble des fonctionnalités et parcours utilisateurs de la plateforme Maison de la Société Civile. Il constitue une référence exhaustive pour tous les utilisateurs, qu'ils soient Utilisateurs, Formateurs ou administrateurs.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                La plateforme Maison de la Société Civile est conçue pour faciliter la gestion, la coordination et le suivi des organisations de la société civile à travers une expérience d'apprentissage complète, intuitive et personnalisée. Chaque rôle dispose d'outils adaptés pour accomplir ses missions efficacement.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Pour les Utilisateurs, la plateforme offre un environnement d'apprentissage riche avec suivi de progression, gamification, assistant IA, et délivrance de certificats. Pour les Formateurs, elle propose des outils complets de création de contenu, de suivi des Utilisateurs et d'analyse des performances. Pour les administrateurs, elle garantit un contrôle total sur la plateforme avec des fonctionnalités avancées de gestion et de modération.
              </p>
              <p className="text-lg leading-relaxed">
                Nous espérons que ce guide vous aidera à tirer le meilleur parti de la plateforme Maison de la Société Civile et contribuera au succès de vos projets de formation et de développement des compétences au sein des organisations de la société civile.
              </p>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
