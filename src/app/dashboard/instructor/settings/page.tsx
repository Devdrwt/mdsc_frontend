'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';

export default function InstructorSettingsPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600 mt-1">Gérez vos préférences et votre compte</p>
            </div>

            <div className="space-y-6">
              {/* Section Compte */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du compte</h2>
                <p className="text-gray-600 mb-4">
                  Gérez vos informations personnelles, mot de passe et pièce d'identité.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/instructor/profile'}
                  className="px-4 py-2 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Modifier mon profil
                </button>
              </div>

              {/* Section Cours */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Préférences de cours</h2>
                <p className="text-gray-600 mb-4">
                  Configurez vos préférences pour la création et la gestion de cours (à venir).
                </p>
                <p className="text-sm text-gray-500 italic">Fonctionnalité en développement</p>
              </div>

              {/* Section Notifications */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
                <p className="text-gray-600 mb-4">
                  Configurez vos préférences de notification (à venir).
                </p>
                <p className="text-sm text-gray-500 italic">Fonctionnalité en développement</p>
              </div>

              {/* Section Confidentialité */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Confidentialité</h2>
                <p className="text-gray-600 mb-4">
                  Gérez vos paramètres de confidentialité et de sécurité (à venir).
                </p>
                <p className="text-sm text-gray-500 italic">Fonctionnalité en développement</p>
              </div>

              {/* Section Apparence */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Apparence</h2>
                <p className="text-gray-600 mb-4">
                  Personnalisez l'apparence de la plateforme (à venir).
                </p>
                <p className="text-sm text-gray-500 italic">Fonctionnalité en développement</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

