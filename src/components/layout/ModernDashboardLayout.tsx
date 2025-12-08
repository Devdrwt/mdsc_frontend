'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import ModernSidebar from '../ui/ModernSidebar';
import ModernHeader from '../ui/ModernHeader';
import NotificationContainer from '../ui/NotificationContainer';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  sidebarItems?: any[];
  activeSidebarItem?: string;
  onSidebarItemClick?: (item: any) => void;
  className?: string;
}

export default function ModernDashboardLayout({
  children,
  title,
  sidebarItems = [],
  activeSidebarItem,
  onSidebarItemClick,
  className = ''
}: ModernDashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implémenter la recherche
  };

  const handleProfileClick = () => {
    // TODO: Rediriger vers le profil
  };

  const handleSettingsClick = () => {
    // TODO: Rediriger vers les paramètres
  };

  const handleLogout = async () => {
    await logout();
    // Redirection gérée par le store
  };

  const handleSidebarItemClick = (item: any) => {
    if (onSidebarItemClick) {
      onSidebarItemClick(item);
    }
  };

  // Notifications simulées
  const notifications = [
    {
      id: '1',
      title: 'Nouveau cours disponible',
      message: 'Le cours "Gestion de Projet Agile" est maintenant disponible',
      timestamp: 'Il y a 2 heures',
      unread: true
    },
    {
      id: '2',
      title: 'Quiz terminé',
      message: 'Vous avez terminé le quiz "Communication Efficace"',
      timestamp: 'Il y a 4 heures',
      unread: false
    }
  ];

  const handleNotificationClick = (notification: any) => {
    // TODO: Gérer le clic sur une notification
    console.log('Notification clicked:', notification);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <ModernSidebar
        title="Maison de la Société Civile MOOC"
        items={sidebarItems}
        activeItem={activeSidebarItem}
        onItemClick={handleSidebarItemClick}
        collapsible={true}
        defaultCollapsed={false}
      />

      {/* Main content */}
      <div className="md:ml-64">
        {/* Header */}
        <ModernHeader
          title={title}
          user={user ? {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role === 'student' ? 'Utilisateur' : 
                  user.role === 'instructor' ? 'Formateur' : 'Administrateur'
          } : undefined}
          onSearch={handleSearch}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
        />

        {/* Page content */}
        <main className={`p-6 ${className}`}>
          {children}
        </main>
      </div>

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
}
