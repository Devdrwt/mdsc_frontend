'use client';

import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Calendar, ArrowRight, Mail, Tag } from 'lucide-react';

// Types pour les articles
interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  featured?: boolean;
}

// Données de démonstration
const sampleArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Lancement de la plateforme MOOC Maison de la Société Civile',
    excerpt: 'La Maison de la Société Civile lance officiellement sa plateforme d\'apprentissage en ligne dédiée aux organisations de la société civile. Cette initiative vise à démocratiser l\'accès à la formation et à renforcer les capacités des acteurs du secteur.',
    category: 'Formations',
    date: '12 octobre 2025',
    image: '/apprenant.png',
    featured: true
  },
  {
    id: '2',
    title: 'Nouvelle session de formation en gouvernance associative',
    excerpt: 'Une nouvelle session de formation sur la gouvernance associative est ouverte. Cette formation s\'adresse aux dirigeants d\'organisations et couvre les aspects juridiques, financiers et éthiques de la gestion associative.',
    category: 'Formations',
    date: '10 octobre 2025',
    image: '/apprenant.png'
  },
  {
    id: '3',
    title: 'Partenariat avec l\'Université d\'Abomey-Calavi',
    excerpt: 'La Maison de la Société Civile signe un partenariat stratégique avec l\'Université d\'Abomey-Calavi pour développer des programmes de formation certifiants et renforcer la recherche sur la société civile.',
    category: 'Partenariats',
    date: '8 octobre 2025',
    image: '/apprenant.png'
  },
  {
    id: '4',
    title: 'Renforcement du dispositif de certification',
    excerpt: 'Le système de certification des compétences est renforcé avec de nouveaux modules et une reconnaissance internationale. Les participants pourront désormais obtenir des certifications reconnues.',
    category: 'Formations',
    date: '6 octobre 2025',
    image: '/apprenant.png'
  },
  {
    id: '5',
    title: 'Forum annuel de la société civile 2025',
    excerpt: 'Le forum annuel de la société civile se tiendra le 15 novembre 2025. Cet événement rassemblera plus de 500 participants pour échanger sur les enjeux actuels et futurs du secteur.',
    category: 'Vie associative',
    date: '5 octobre 2025',
    image: '/apprenant.png'
  },
  {
    id: '6',
    title: 'Lancement du programme de mentorat',
    excerpt: 'Un nouveau programme de mentorat est lancé pour accompagner les jeunes leaders de la société civile. Ce programme permettra un transfert de compétences et d\'expérience entre générations.',
    category: 'Vie associative',
    date: '3 octobre 2025',
    image: '/apprenant.png'
  },
  {
    id: '7',
    title: 'Atelier sur l\'innovation sociale',
    excerpt: 'Un atelier dédié à l\'innovation sociale aura lieu le 20 octobre. Les participants découvriront les dernières tendances et outils pour innover dans leurs projets sociaux.',
    category: 'Formations',
    date: '1 octobre 2025',
    image: '/apprenant.png'
  }
];

const popularArticles = [
  'Comment structurer une organisation de société civile',
  'Guide de la levée de fonds pour les OSC',
  'Les clés d\'une gouvernance associative efficace'
];

const tags = [
  'Formation', 'Gouvernance', 'Innovation', 'Partenariat', 'Certification', 'Leadership'
];

const categories = ['Toutes', 'Formations', 'Partenariats', 'Vie associative'];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [email, setEmail] = useState('');

  // Filtrer les articles
  const filteredArticles = selectedCategory === 'Toutes' 
    ? sampleArticles 
    : sampleArticles.filter(article => article.category === selectedCategory);

  const featuredArticle = sampleArticles.find(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter l'inscription à la newsletter
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary py-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Actualités de la Maison de la Société Civile
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Découvrez nos dernières initiatives, projets et événements autour de la société civile.
          </p>
        </div>
      </section>

      <main className="py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne principale - Articles */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Article à la une */}
              {featuredArticle && (
                <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="relative">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-mdsc-blue-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{featuredArticle.category}</span>
                        <span>•</span>
                        <span>{featuredArticle.date}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-mdsc-blue-dark mb-4">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>
                    <button className="inline-flex items-center text-mdsc-blue-dark font-medium hover:text-mdsc-blue-primary transition-colors">
                      Lire la suite
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </article>
              )}

              {/* Filtres */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-mdsc-blue-dark text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Grille d'articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {regularArticles.map((article) => (
                  <article key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-mdsc-blue-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          {article.date}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-mdsc-blue-dark mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <button className="inline-flex items-center text-mdsc-blue-dark text-sm font-medium hover:text-mdsc-blue-primary transition-colors">
                        Lire l'article
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center space-x-2 pt-8">
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Précédent
                </button>
                <button className="px-3 py-2 bg-mdsc-blue-dark text-white rounded">
                  1
                </button>
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  2
                </button>
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  3
                </button>
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Suivant
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Articles populaires */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-mdsc-blue-dark mb-4">
                  Articles populaires
                </h3>
                <ol className="space-y-3">
                  {popularArticles.map((title, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-mdsc-blue-primary text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <a href="#" className="text-sm text-gray-700 hover:text-mdsc-blue-dark transition-colors line-clamp-2">
                        {title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-mdsc-blue-dark mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-300 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-mdsc-blue-dark mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Newsletter
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Recevez nos actualités directement dans votre boîte mail.
                </p>
                <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-mdsc-gold text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                  >
                    S'abonner
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
