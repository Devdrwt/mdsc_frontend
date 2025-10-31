'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../ui/Logo';
import { Menu, X, Moon, Sun, Search, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../lib/context/ThemeContext';
import { useAuthStore } from '../../lib/stores/authStore';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navigation = [
    { name: 'Formations', href: '/courses' },
    { name: 'Contacts', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const isHome = pathname === '/';
  const isDashboard = pathname?.startsWith('/dashboard');
  const needsSpacer = !isHome && !isDashboard;

  return (
    <>
    <header 
      className={`fixed top-2 md:top-4 left-0 w-full z-50 transition-all duration-300 bg-transparent`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Capsule container */}
        <div className="flex justify-between items-center h-20 md:h-24 bg-white/95 backdrop-blur rounded-[24px] md:rounded-[36px] shadow-md border border-gray-200 px-3 md:px-6">
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
                className="relative px-4 py-2 text-sm font-medium text-[#3380AA] hover:text-[#F8C37B] transition-all duration-200 group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F8C37B] group-hover:w-full transition-all duration-300 rounded-full"></span>
              </a>
            ))}
          </nav>

          {/* Boutons d'action */}
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-mdsc-blue-dark hover:text-[#D79A49] transition-all duration-200 rounded-full hover:bg-gray-100 group"
              aria-label="Toggle dark mode"
              title="Mode clair"
            >
              <Sun className="h-5 w-5" />
            </button>
            {isAuthenticated && user ? (
              <>
                <a 
                  href={`/dashboard/${user.role}`}
                  className="px-4 py-2 rounded-lg bg-[#3380AA] text-white hover:bg-[#2A6A8F] transition-all duration-200 font-medium text-sm"
                  title="Mon tableau de bord"
                >
                  <LayoutDashboard className="h-4 w-4 inline mr-2" />
                  Dashboard
                </a>
                <a 
                  href={`/dashboard/${user.role}/profile`}
                  className="px-4 py-2 rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-white hover:bg-orange-200 hover:text-mdsc-blue-dark transition-all duration-200 font-medium text-sm"
                  title="Mon profil"
                >
                  <User className="h-4 w-4 inline mr-2" />
                  {user.firstName} {user.lastName}
                </a>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-[#D79A49] text-white hover:text-white transition-all duration-200 font-medium text-sm"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4 inline mr-2" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/login" 
                  className="px-4 py-2 rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-white hover:bg-orange-200 hover:text-mdsc-blue-dark transition-all duration-200 font-medium text-sm"
                >
                  Connexion
                </a>
                <a 
                  href="/select-role" 
                  className="px-4 py-2 rounded-lg bg-[#D79A49] text-white hover:text-white transition-all duration-200 font-medium text-sm"
                >
                  S'inscrire
                </a>
              </>
            )}
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-mdsc-blue-dark dark:text-gray-300 hover:text-[#D79A49] focus:outline-none focus:ring-2 focus:ring-[#D79A49] rounded-lg transition-all duration-200"
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
        <div className={`md:hidden mt-2 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white/95 backdrop-blur rounded-[24px] shadow-md border border-gray-200 px-4 py-4 space-y-2">
            {navigation.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-mdsc-blue-dark hover:text-[#D79A49] hover:bg-orange-200 rounded-lg transition-all duration-200 font-medium"
                style={{ 
                  animation: isMenuOpen ? `fadeInUp 0.3s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <button 
                onClick={toggleTheme}
                className="w-full px-4 py-3 text-left text-mdsc-blue-dark hover:text-[#D79A49] rounded-lg hover:bg-orange-200 transition-all duration-200 flex items-center gap-3"
              >
                    <Sun className="h-5 w-5" />
                    Mode clair
              </button>
              {isAuthenticated && user ? (
                <>
                  <a 
                    href={`/dashboard/${user.role}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-left rounded-lg bg-[#3380AA] text-white hover:bg-[#2A6A8F] transition-all duration-200 font-medium flex items-center gap-3"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </a>
                  <a 
                    href={`/dashboard/${user.role}/profile`}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-left rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-transparent hover:bg-orange-200 hover:text-mdsc-blue-dark transition-all duration-200 font-medium flex items-center gap-3"
                  >
                    <User className="h-5 w-5" />
                    {user.firstName} {user.lastName}
                  </a>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 text-center rounded-lg bg-[#D79A49] text-white hover:bg-white/20 hover:text-white transition-all duration-200 font-medium flex items-center justify-center gap-3"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-center rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-transparent hover:bg-orange-200 hover:text-mdsc-blue-dark transition-all duration-200 font-medium"
                  >
                    Connexion
                  </a>
                  <a 
                    href="/select-role"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-center rounded-lg bg-[#D79A49] text-white hover:bg-white/20 hover:text-white transition-all duration-200 font-medium"
                  >
                    S'inscrire
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
    {needsSpacer && (
      <div className="h-20 md:h-24" style={{
        background: 'linear-gradient(180deg, #0C3C5C 0%, #3B7C8A 100%)'
      }} />
    )}
    </>
  );
}
