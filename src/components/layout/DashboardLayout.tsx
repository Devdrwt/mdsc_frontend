'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  User,
  Trophy,
  MessageSquare,
  FileText,
  Calendar,
  Award,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Activity,
  Grid3x3
} from 'lucide-react';
import { useAuthStore } from '../../lib/stores/authStore';
import NotificationContainer from '../ui/NotificationContainer';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'student' | 'instructor' | 'admin';
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  children?: NavigationItem[];
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Navigation items par rôle
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { name: 'Tableau de bord', href: `/dashboard/${userRole}`, icon: Home },
    ];

    switch (userRole) {
      case 'student':
        return [
          ...baseItems,
          { 
            name: 'Formations', 
            href: `/dashboard/${userRole}/courses`, 
            icon: BookOpen,
            children: [
              { name: 'Catalogue', href: '/courses', icon: Grid3x3 },
              { name: 'Mes Cours', href: `/dashboard/${userRole}/courses`, icon: BookOpen }
            ]
          },
          { name: 'Progression', href: `/dashboard/${userRole}/progress`, icon: BarChart3 },
          { name: 'Évaluations', href: `/dashboard/${userRole}/evaluations`, icon: FileText },
          { name: 'Certificats', href: `/dashboard/${userRole}/certificates`, icon: Award },
          { name: 'Gamification', href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: 'Assistant IA', href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: 'Calendrier', href: `/dashboard/${userRole}/calendar`, icon: Calendar },
          { name: 'Messages', href: `/dashboard/${userRole}/messages`, icon: MessageSquare },
          { name: 'Profil', href: `/dashboard/${userRole}/profile`, icon: User },
          { name: 'Paramètres', href: `/dashboard/${userRole}/settings`, icon: Settings },
        ];

      case 'instructor':
        return [
          ...baseItems,
          { 
            name: 'Mes Cours', 
            href: `/dashboard/${userRole}/courses`, 
            icon: BookOpen,
            children: [
              { name: 'Gestion des Cours', href: `/dashboard/${userRole}/courses`, icon: BookOpen },
              { name: 'Modules', href: `/dashboard/${userRole}/modules`, icon: BookOpen }
            ]
          },
          { name: 'Mes Étudiants', href: `/dashboard/${userRole}/students`, icon: Users },
          { name: 'Analytics', href: `/dashboard/${userRole}/analytics`, icon: BarChart3 },
          { name: 'Évaluations', href: `/dashboard/${userRole}/evaluations`, icon: FileText },
          { name: 'Gamification', href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: 'Assistant IA', href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: 'Messages', href: `/dashboard/${userRole}/messages`, icon: MessageSquare },
          { name: 'Profil', href: `/dashboard/${userRole}/profile`, icon: User },
          { name: 'Paramètres', href: `/dashboard/${userRole}/settings`, icon: Settings },
        ];

      case 'admin':
        return [
          ...baseItems,
          { name: 'Domaines', href: `/dashboard/${userRole}/domains`, icon: BookOpen },
          { name: 'Utilisateurs', href: `/dashboard/${userRole}/users`, icon: Users },
          { name: 'Cours', href: `/dashboard/${userRole}/courses`, icon: BookOpen },
          { name: 'Statistiques', href: `/dashboard/${userRole}/statistics`, icon: BarChart3 },
          { name: 'Surveillance', href: `/dashboard/${userRole}/monitoring`, icon: Activity },
          { name: 'Gamification', href: `/dashboard/${userRole}/gamification`, icon: Trophy },
          { name: 'Assistant IA', href: `/dashboard/${userRole}/chat-ai`, icon: Brain },
          { name: 'Configuration', href: `/dashboard/${userRole}/settings`, icon: Settings },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  // Couleurs par rôle
  const getRoleColors = () => {
    switch (userRole) {
      case 'student':
        return {
          primary: 'bg-mdsc-blue-primary',
          primaryHover: 'hover:bg-mdsc-blue-dark',
          accent: 'text-mdsc-blue-primary',
          border: 'border-mdsc-blue-primary',
        };
      case 'instructor':
        return {
          primary: 'bg-mdsc-gold',
          primaryHover: 'hover:bg-yellow-600',
          accent: 'text-mdsc-gold',
          border: 'border-mdsc-gold',
        };
      case 'admin':
        return {
          primary: 'bg-mdsc-blue-dark',
          primaryHover: 'hover:bg-gray-800',
          accent: 'text-mdsc-blue-dark',
          border: 'border-mdsc-blue-dark',
        };
      default:
        return {
          primary: 'bg-gray-600',
          primaryHover: 'hover:bg-gray-700',
          accent: 'text-gray-600',
          border: 'border-gray-600',
        };
    }
  };

  const colors = getRoleColors();

  // Gestion du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Si pas de thème sauvegardé, utiliser le thème du système
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      localStorage.setItem('theme', systemTheme);
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    }
  }, []);

  // Ouvrir automatiquement le sous-menu si un enfant est actif
  useEffect(() => {
    const openActiveSubmenu = () => {
      navigationItems.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => isActive(child.href));
          if (hasActiveChild) {
            setOpenSubmenus(prev => new Set(prev).add(item.name));
          }
        }
      });
    };
    openActiveSubmenu();
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: NavigationItem, isMobile: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSubmenus.has(item.name);
    const active = isActive(item.href);

    if (hasChildren && !sidebarCollapsed) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active
                ? `${colors.primary} text-white`
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          {isOpen && item.children && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children.map((child) => (
                <a
                  key={child.name}
                  href={child.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(child.href)
                      ? `${colors.primary} text-white`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <child.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="ml-3">{child.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <a
        key={item.name}
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isMobile ? '' : 'group'} ${
          active
            ? `${colors.primary} text-white`
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={sidebarCollapsed && !isMobile ? item.name : undefined}
      >
        <item.icon className={`${isMobile ? 'mr-3' : ''} h-5 w-5 flex-shrink-0`} />
        {!isMobile && !sidebarCollapsed && (
          <>
            <span className="ml-3">{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
          </>
        )}
        {sidebarCollapsed && !isMobile && item.badge && (
          <span className="absolute ml-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {item.badge}
          </span>
        )}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Image 
                src="/mdsc-logo1.png" 
                alt="MdSC Logo" 
                width={80} 
                height={80}
                style={{ height: 'auto', width: '100%', maxWidth: '120px' }}
                priority
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => renderNavItem(item, true))}
          </nav>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-20 items-center justify-between px-4">
            <div className="flex items-center w-full">
              <Image 
                src="/mdsc-logo1.png" 
                alt="MdSC Logo" 
                width={100} 
                height={100}
                style={{ height: 'auto', width: '100%', maxWidth: sidebarCollapsed ? '50px' : '140px' }}
                priority
              />
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => renderNavItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:transition-all lg:duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => isActive(item.href))?.name || 'Tableau de bord'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <div className="h-8 w-8 bg-mdsc-blue-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block">{user?.firstName} {user?.lastName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <a
                    href={`/dashboard/${userRole}/profile`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mon Profil
                  </a>
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Paramètres
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <NotificationContainer />
    </div>
  );
}
