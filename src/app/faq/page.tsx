'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  User, 
  CreditCard, 
  GraduationCap, 
  HelpCircle, 
  Settings,
  Mail,
  Lock,
  FileText,
  Video,
  Award,
  Search,
  X
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FAQItem[];
}

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const faqCategories: FAQCategory[] = [
    {
      id: 'general',
      title: 'Questions Générales',
      icon: HelpCircle,
      items: [
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
          question: 'Quels types de cours sont disponibles ?',
          answer: 'Notre plateforme propose une large gamme de cours dans différents domaines : management, développement personnel, compétences numériques, leadership, communication, et bien d\'autres. Tous nos cours sont conçus par des experts certifiés et incluent des supports multimédias variés (vidéos, documents, quiz, évaluations).'
        }
      ]
    },
    {
      id: 'account',
      title: 'Compte et Profil',
      icon: User,
      items: [
        {
          question: 'Comment modifier mes informations personnelles ?',
          answer: 'Connectez-vous à votre compte, puis accédez à "Mon Profil" dans le menu de votre tableau de bord. Vous pourrez modifier votre nom, email, photo de profil et autres informations personnelles. N\'oubliez pas de sauvegarder vos modifications.'
        },
        {
          question: 'J\'ai oublié mon mot de passe. Que faire ?',
          answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre adresse email et vous recevrez un lien de réinitialisation. Cliquez sur le lien dans l\'email et suivez les instructions pour créer un nouveau mot de passe sécurisé.'
        },
        {
          question: 'Comment changer mon mot de passe ?',
          answer: 'Dans votre tableau de bord, allez dans "Paramètres" puis "Sécurité". Vous trouverez l\'option pour changer votre mot de passe. Vous devrez entrer votre mot de passe actuel et votre nouveau mot de passe.'
        },
        {
          question: 'Puis-je supprimer mon compte ?',
          answer: 'Oui, vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil. Attention : cette action est irréversible et supprimera toutes vos données, y compris vos certificats et votre progression dans les cours.'
        },
        {
          question: 'Comment vérifier mon adresse email ?',
          answer: 'Lors de votre inscription, un email de vérification vous est envoyé. Si vous ne l\'avez pas reçu, allez dans "Paramètres" > "Email" et cliquez sur "Renvoyer l\'email de vérification". Vérifiez également votre dossier spam.'
        }
      ]
    },
    {
      id: 'courses',
      title: 'Cours et Apprentissage',
      icon: BookOpen,
      items: [
        {
          question: 'Comment m\'inscrire à un cours ?',
          answer: 'Parcourez le catalogue de cours, cliquez sur le cours qui vous intéresse, puis sur "S\'inscrire" ou "Acheter" selon que le cours est gratuit ou payant. Une fois inscrit, le cours apparaîtra dans votre tableau de bord étudiant.'
        },
        {
          question: 'Comment suivre ma progression dans un cours ?',
          answer: 'Dans votre tableau de bord, accédez à "Mes Cours" pour voir tous vos cours en cours. Vous verrez votre pourcentage de progression pour chaque cours. Cliquez sur un cours pour voir le détail de votre progression par module et leçon.'
        },
        {
          question: 'Les leçons sont-elles marquées automatiquement comme complétées ?',
          answer: 'Oui ! Pour les leçons texte, PDF et PowerPoint, la leçon est automatiquement marquée comme complétée lorsque vous scrollez jusqu\'à la fin du contenu. Pour les vidéos et audios, la leçon est complétée uniquement lorsque vous regardez ou écoutez l\'intégralité du contenu sans sauter ou avancer rapidement.'
        },
        {
          question: 'Puis-je télécharger le contenu des cours ?',
          answer: 'Le téléchargement du contenu est désactivé pour protéger la propriété intellectuelle. Cependant, vous pouvez accéder au contenu en ligne à tout moment depuis votre compte, même après avoir terminé le cours.'
        },
        {
          question: 'Que se passe-t-il si je ne termine pas un cours à temps ?',
          answer: 'Il n\'y a pas de limite de temps pour terminer un cours. Vous pouvez suivre le cours à votre rythme. Cependant, vous recevrez des rappels par email si vous restez inactif pendant plusieurs jours pour vous encourager à continuer votre apprentissage.'
        },
        {
          question: 'Puis-je accéder aux cours sur mobile ?',
          answer: 'Oui, notre plateforme est entièrement responsive et optimisée pour les appareils mobiles. Vous pouvez accéder à vos cours depuis votre smartphone ou tablette avec la même expérience utilisateur.'
        }
      ]
    },
    {
      id: 'certificates',
      title: 'Certificats',
      icon: Award,
      items: [
        {
          question: 'Comment obtenir un certificat ?',
          answer: 'Pour obtenir un certificat, vous devez compléter tous les modules du cours, réussir tous les quiz intermédiaires et passer l\'évaluation finale avec une note minimale requise. Une fois ces conditions remplies, votre certificat sera généré automatiquement.'
        },
        {
          question: 'Les certificats sont-ils reconnus ?',
          answer: 'Nos certificats sont délivrés par la Maison de la Société Civile et attestent de votre réussite dans le cours. Ils peuvent être ajoutés à votre CV et partagés sur les réseaux professionnels comme LinkedIn.'
        },
        {
          question: 'Comment télécharger mon certificat ?',
          answer: 'Une fois votre certificat généré, allez dans "Mes Certificats" dans votre tableau de bord. Cliquez sur le certificat souhaité, puis sur "Télécharger" pour obtenir le fichier PDF. Vous pouvez également l\'imprimer directement depuis la page.'
        },
        {
          question: 'Comment vérifier l\'authenticité d\'un certificat ?',
          answer: 'Chaque certificat possède un code unique (format MDSC-XXXXXXXX-BJ). Utilisez la fonction "Vérifier un certificat" sur notre site en entrant ce code pour confirmer son authenticité.'
        },
        {
          question: 'Puis-je obtenir un certificat si je repasse un cours ?',
          answer: 'Si vous avez déjà obtenu un certificat pour un cours, vous ne pouvez pas en obtenir un nouveau en repassant le même cours. Cependant, vous pouvez toujours accéder au contenu pour réviser.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Paiements et Abonnements',
      icon: CreditCard,
      items: [
        {
          question: 'Quels modes de paiement sont acceptés ?',
          answer: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), mobile money (MTN, Moov), et autres méthodes de paiement locales selon votre pays. Tous les paiements sont sécurisés via notre partenaire de paiement certifié.'
        },
        {
          question: 'Les paiements sont-ils sécurisés ?',
          answer: 'Absolument. Tous les paiements sont traités via des passerelles de paiement sécurisées et certifiées. Nous ne stockons jamais vos informations de carte bancaire. Toutes les transactions sont cryptées et conformes aux standards de sécurité internationaux.'
        },
        {
          question: 'Puis-je obtenir un remboursement ?',
          answer: 'Les remboursements sont possibles dans les 7 jours suivant l\'achat d\'un cours, à condition que vous n\'ayez pas complété plus de 20% du cours. Contactez notre service client avec votre numéro de commande pour faire une demande de remboursement.'
        },
        {
          question: 'Y a-t-il des frais cachés ?',
          answer: 'Non, le prix affiché est le prix final que vous payez. Il n\'y a pas de frais cachés. Le prix inclut l\'accès complet au cours, aux ressources, aux quiz et à l\'évaluation finale.'
        },
        {
          question: 'Que se passe-t-il si mon paiement échoue ?',
          answer: 'Si votre paiement échoue, vous recevrez un email avec les détails de l\'erreur. Vérifiez vos informations de paiement et réessayez. Si le problème persiste, contactez notre service client ou votre banque.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Support Technique',
      icon: Settings,
      items: [
        {
          question: 'J\'ai des problèmes de connexion. Que faire ?',
          answer: 'Vérifiez d\'abord votre connexion internet. Essayez de rafraîchir la page (F5) ou de vider le cache de votre navigateur. Si le problème persiste, essayez un autre navigateur ou contactez notre support technique.'
        },
        {
          question: 'Les vidéos ne se chargent pas. Comment résoudre ce problème ?',
          answer: 'Assurez-vous d\'avoir une connexion internet stable. Essayez de réduire la qualité vidéo si disponible, ou attendez que la vidéo se charge complètement. Si le problème persiste, contactez notre support avec les détails de votre navigateur et système d\'exploitation.'
        },
        {
          question: 'Quels navigateurs sont supportés ?',
          answer: 'Nous recommandons d\'utiliser les dernières versions de Chrome, Firefox, Safari ou Edge. Assurez-vous que JavaScript est activé et que les cookies sont autorisés pour une expérience optimale.'
        },
        {
          question: 'Puis-je utiliser la plateforme hors ligne ?',
          answer: 'Non, la plateforme nécessite une connexion internet active pour accéder au contenu des cours. Cependant, certains documents peuvent être consultés si vous les avez ouverts précédemment dans votre navigateur.'
        },
        {
          question: 'Comment signaler un bug ou un problème technique ?',
          answer: 'Contactez notre support technique via le formulaire de contact ou par email à support@mdsc.local. Décrivez le problème en détail, incluez des captures d\'écran si possible, et précisez votre navigateur et système d\'exploitation.'
        }
      ]
    },
    {
      id: 'instructors',
      title: 'Formateurs',
      icon: GraduationCap,
      items: [
        {
          question: 'Comment devenir formateur sur la plateforme ?',
          answer: 'Pour devenir formateur, vous devez créer un compte avec le rôle "Formateur", puis soumettre votre candidature avec vos qualifications et expériences. Notre équipe examinera votre candidature et vous contactera pour la suite du processus.'
        },
        {
          question: 'Comment créer un cours ?',
          answer: 'Une fois votre compte formateur approuvé, accédez à votre tableau de bord formateur et cliquez sur "Créer un cours". Remplissez les informations du cours, ajoutez les modules et leçons, puis soumettez le cours pour validation par notre équipe.'
        },
        {
          question: 'Comment gagner de l\'argent en tant que formateur ?',
          answer: 'Les formateurs reçoivent une commission sur les ventes de leurs cours payants. Le pourcentage de commission est défini dans votre contrat. Les paiements sont effectués mensuellement selon les ventes réalisées.'
        },
        {
          question: 'Quels types de contenu puis-je ajouter à mes cours ?',
          answer: 'Vous pouvez ajouter des vidéos, audios, documents PDF, présentations PowerPoint, textes enrichis, quiz et évaluations. Tous les formats multimédias sont supportés pour créer une expérience d\'apprentissage complète.'
        },
        {
          question: 'Comment suivre les performances de mes cours ?',
          answer: 'Dans votre tableau de bord formateur, accédez à "Analytiques" pour voir les statistiques détaillées : nombre d\'inscriptions, taux de complétion, revenus générés, et retours des étudiants.'
        }
      ]
    }
  ];

  // Fonction de filtrage
  const filterCategories = (categories: FAQCategory[], query: string): FAQCategory[] => {
    if (!query.trim()) {
      return categories;
    }

    const lowerQuery = query.toLowerCase();
    return categories
      .map(category => {
        const filteredItems = category.items.filter(item => 
          item.question.toLowerCase().includes(lowerQuery) ||
          item.answer.toLowerCase().includes(lowerQuery)
        );
        
        if (filteredItems.length > 0) {
          return { ...category, items: filteredItems };
        }
        return null;
      })
      .filter((category): category is FAQCategory => category !== null);
  };

  const filteredCategories = filterCategories(faqCategories, searchQuery);

  // Ouvrir automatiquement les catégories avec résultats de recherche
  useEffect(() => {
    if (searchQuery.trim() && filteredCategories.length > 0) {
      // Ouvrir la première catégorie filtrée
      if (filteredCategories.length > 0) {
        setOpenCategory(filteredCategories[0].id);
      }
      // Ouvrir toutes les questions correspondantes
      const newOpenItems = new Set<string>();
      filteredCategories.forEach(category => {
        category.items.forEach((_, index) => {
          newOpenItems.add(`${category.id}-${index}`);
        });
      });
      setOpenItems(newOpenItems);
    } else if (!searchQuery.trim()) {
      // Réinitialiser quand la recherche est effacée
      setOpenCategory('general');
      setOpenItems(new Set());
    }
  }, [searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

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
    setOpenCategory('general');
    setOpenItems(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Questions Fréquemment Posées
              </h1>
              <p className="text-xl text-white/90">
                Trouvez rapidement les réponses à vos questions
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Barre de recherche */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher dans les questions et réponses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 outline-none text-gray-900 placeholder-gray-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-4 text-sm text-gray-600">
                  {filteredCategories.reduce((total, cat) => total + cat.items.length, 0)} résultat(s) trouvé(s)
                </div>
              )}
            </div>

            {/* Categories */}
            {!searchQuery && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {faqCategories.map((category) => {
                  const Icon = category.icon;
                  const isOpen = openCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isOpen
                          ? 'border-mdsc-blue-primary bg-mdsc-blue-primary/10'
                          : 'border-gray-200 hover:border-mdsc-blue-primary/50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-6 w-6 ${isOpen ? 'text-mdsc-blue-primary' : 'text-gray-600'}`} />
                          <span className={`font-semibold ${isOpen ? 'text-mdsc-blue-primary' : 'text-gray-900'}`}>
                            {category.title}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-mdsc-blue-primary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {category.items.length} question{category.items.length > 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* FAQ Items */}
            {filteredCategories.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune question ne correspond à votre recherche "{searchQuery}"
                </p>
                <button
                  onClick={clearSearch}
                  className="text-mdsc-blue-primary hover:text-mdsc-blue-dark font-semibold"
                >
                  Effacer la recherche
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCategories.map((category) => {
                  // Si recherche active, afficher toutes les catégories filtrées
                  // Sinon, afficher uniquement la catégorie ouverte
                  if (!searchQuery && openCategory !== category.id) return null;
                  
                  return (
                    <div key={category.id} className="space-y-4">
                      <div className="flex items-center space-x-3 mb-6">
                        {React.createElement(category.icon, { className: 'h-6 w-6 text-mdsc-blue-primary' })}
                        <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                      </div>
                      
                      {category.items.map((item, index) => {
                      const itemId = `${category.id}-${index}`;
                      const isOpen = openItems.has(itemId);
                      
                      return (
                        <div
                          key={itemId}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-gray-900 pr-4">
                              {item.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-mdsc-blue-primary flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                              <p className="text-gray-700 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              </div>
            )}

            {/* Contact Section */}
            <div className="mt-12 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-mdsc-blue-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Vous ne trouvez pas la réponse à votre question ?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Notre équipe de support est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-semibold"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Nous contacter
                  </a>
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

