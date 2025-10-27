import React from 'react';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Home, Search, ArrowLeft, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="animate-fade-in-up">
            {/* 404 illustration */}
            <div className="mb-8">
              <h1 className="text-9xl font-extrabold text-mdsc-blue mb-4">
                404
              </h1>
              <div className="w-24 h-1 bg-mdsc-orange mx-auto rounded-full"></div>
            </div>

            {/* Message */}
            <h2 className="text-3xl font-bold text-mdsc-blue mb-4">
              Page introuvable
            </h2>
            <p className="text-lg text-mdsc-gray mb-8">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-mdsc-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-6 py-3 bg-mdsc-orange text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Découvrir les cours
              </Link>
            </div>

            {/* Suggestions */}
            <div className="card-mdsc text-left">
              <h3 className="text-lg font-semibold text-mdsc-blue mb-4">
                Pages populaires :
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-mdsc-gray hover:text-mdsc-blue transition-colors flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Page d'accueil
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="text-mdsc-gray hover:text-mdsc-blue transition-colors flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Catalogue de cours
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-mdsc-gray hover:text-mdsc-blue transition-colors flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    À propos de MdSC
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-mdsc-gray hover:text-mdsc-blue transition-colors flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Nous contacter
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
