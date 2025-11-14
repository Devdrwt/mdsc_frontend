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
        className={`fixed top-2 sm:top-3 md:top-4 left-0 w-full z-50 transition-all duration-300`}
      >
        {/* <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6"> */}
        <div className="max-w-screen-1xl mx-30 px-4 sm:px-4 md:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24 bg-white/95 backdrop-blur rounded-[20px] sm:rounded-[28px] md:rounded-[36px] shadow-md border border-gray-200 px-2 sm:px-4 md:px-6">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo size="sm" />
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              {navigation.map((item) => (
                <a key={item.name} href={item.href} className="custom-link">
                  {item.name}
                  <span></span>
                </a>
              ))}
            </nav>

            {/* Boutons d'action desktop */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-full text-mdsc-blue-dark hover:text-[#D79A49] hover:bg-gray-100 transition-all duration-200"
                aria-label="Toggle dark mode"
                title="Mode clair"
              >
                <Sun className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>

              {isAuthenticated && user ? (
                <>
                  <a
                    href={`/dashboard/${user.role}`}
                    style={{ backgroundColor: 'var(--mdsc-blue-primary)' }}
                    className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-white hover:bg-[#2A6A8F] transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                    title="Mon tableau de bord"
                  >
                    <LayoutDashboard className="h-3 sm:h-4 w-3 sm:w-4" />
                    Dashboard
                  </a>

                  <a
                    href={`/dashboard/${user.role}/profile`}
                    className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-white hover:bg-gray-200 transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                    title="Mon profil"
                  >
                    <User className="h-3 sm:h-4 w-3 sm:w-4" />
                    {user.firstName} {user.lastName}
                  </a>

                  <button
                    onClick={handleLogout}
                    style={{ backgroundColor: 'var(--mdsc-gold)' }}
                    className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-white hover:text-white transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                    title="Se déconnecter"
                  >
                    <LogOut className="h-3 sm:h-4 w-3 sm:w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-white hover:bg-gray-200 transition-all duration-200 font-medium text-xs sm:text-sm"
                  >
                    Connexion
                  </a>
                  <a
  href="/register"
  style={{ backgroundColor: 'var(--mdsc-gold)' }}
  className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-white hover:text-white transition-all duration-200 font-medium text-xs sm:text-sm"
>
  S'inscrire
</a>

                </>
              )}
            </div>

            {/* Menu mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-mdsc-blue-dark hover:text-[#D79A49] focus:outline-none focus:ring-2 focus:ring-[#D79A49] rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          <div
            className={`md:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white/95 backdrop-blur rounded-[20px] shadow-md border border-gray-200 px-3 py-3 space-y-2">
              {navigation.map((item, index) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-mdsc-blue-dark hover:text-[#D79A49] hover:bg-orange-200 rounded-lg transition-all duration-200 font-medium"
                  style={{
                    animation: isMenuOpen ? `fadeInUp 0.3s ease-out ${index * 0.05}s both` : 'none',
                  }}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="w-full px-3 py-2 text-left text-mdsc-blue-dark hover:text-[#D79A49] rounded-lg hover:bg-orange-200 transition-all duration-200 flex items-center gap-2"
                >
                  <Sun className="h-5 w-5" /> Mode clair
                </button>

                {isAuthenticated && user ? (
                  <>
                    <a
                      href={`/dashboard/${user.role}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg bg-[#3380AA] text-white hover:bg-[#2A6A8F] transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-5 w-5" /> Dashboard
                    </a>
                    <a
                      href={`/dashboard/${user.role}/profile`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-transparent hover:bg-orange-200 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <User className="h-5 w-5" /> {user.firstName} {user.lastName}
                    </a>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#D79A49] text-white hover:bg-white/20 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-5 w-5" /> Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-center rounded-lg border border-mdsc-blue-dark text-mdsc-blue-dark bg-transparent hover:bg-orange-200 transition-all duration-200 font-medium"
                    >
                      Connexion
                    </a>
                    <a
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-center rounded-lg bg-[#D79A49] text-white hover:bg-white/20 transition-all duration-200 font-medium"
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
        <div
          className="h-16 sm:h-20 md:h-24"
          style={{
            background: 'linear-gradient(180deg, #0C3C5C 0%, #3B7C8A 100%)',
          }}
        />
      )}
    </>
  );
}
