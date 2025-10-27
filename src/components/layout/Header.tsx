'use client';

import React, { useState, useEffect } from 'react';
import Logo from '../ui/Logo';
import { Menu, X, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '../../lib/context/ThemeContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Formations', href: '/courses' },
    { name: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="sm" />
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-mdsc-blue-dark dark:hover:text-mdsc-gold transition-all duration-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mdsc-gold group-hover:w-full transition-all duration-300 rounded-full"></span>
              </a>
            ))}
          </nav>

          {/* Boutons d'action */}
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-gray-700 dark:text-gray-300 hover:text-mdsc-gold dark:hover:text-mdsc-gold transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group relative"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="h-5 w-5 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>
            <a 
              href="/login" 
              className="px-6 py-2.5 rounded-lg border-2 border-mdsc-blue-dark text-mdsc-blue-dark bg-white dark:bg-gray-800 hover:bg-mdsc-blue-dark hover:text-white dark:hover:text-white transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md hover:scale-105"
            >
              Connexion
            </a>
            <a 
              href="/select-role" 
              className="px-6 py-2.5 rounded-lg bg-mdsc-gold text-white hover:bg-[#c1873f] transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-0.5"
            >
              S'inscrire
            </a>
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-mdsc-gold focus:outline-none focus:ring-2 focus:ring-mdsc-gold rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 top-3' : 'top-1'
                }`}></span>
                <span className={`absolute left-0 top-3 h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 top-3' : 'top-5'
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-4 pb-4 space-y-2">
            {navigation.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-mdsc-blue-dark dark:hover:text-mdsc-gold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium"
                style={{ 
                  animation: isMenuOpen ? `fadeInUp 0.3s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button 
                onClick={toggleTheme}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:text-mdsc-gold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-3"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5" />
                    Mode clair
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    Mode sombre
                  </>
                )}
              </button>
              <a 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-center rounded-lg border-2 border-mdsc-blue-dark text-mdsc-blue-dark dark:text-white dark:border-white hover:bg-mdsc-blue-dark hover:text-white dark:hover:bg-white dark:hover:text-mdsc-blue-dark transition-all duration-300 font-medium"
              >
                Connexion
              </a>
              <a 
                href="/select-role"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-center rounded-lg bg-mdsc-gold text-white hover:bg-[#c1873f] transition-all duration-300 font-medium shadow-md"
              >
                S'inscrire
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
