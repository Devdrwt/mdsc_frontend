'use client';

import React, { useState } from 'react';
import Logo from '../ui/Logo';
import { Menu, X, Moon, Search } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/about' },
    { name: 'Formations', href: '/courses' },
    { name: 'Actualités', href: '/news' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="sm" />
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                       className="text-caption text-gray-700 hover:text-mdsc-blue-dark px-3 py-2 transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Boutons d'action */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
              <Moon className="h-5 w-5" />
            </button>
            <a href="/login" className="btn-mdsc-outline">
              Connexion
            </a>
            <a href="/select-role" className="btn-mdsc-primary">
              S'inscrire
            </a>
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
                     className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                       className="text-body text-gray-700 hover:text-mdsc-blue-dark block px-3 py-2 transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex flex-col space-y-2">
                  <a href="/login" className="btn-mdsc-outline text-center">
                    Se connecter
                  </a>
                  <a href="/select-role" className="btn-mdsc-primary text-center">
                    S'inscrire
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
