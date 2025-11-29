'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import AdminChatIA from '../../../../components/dashboard/admin/AdminChatIA';

export default function AdminChatIAPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin" pageTitle="Chat IA Admin">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-mdsc-blue-dark to-gray-700 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 md:p-6 text-white">
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              Assistant IA Admin 🤖
            </h1>
            <p className="text-gray-100 dark:text-gray-300 text-sm md:text-base">
              Votre assistant administratif intelligent. Gérez la plateforme, analysez les données et optimisez les performances.
            </p>
          </div>

          {/* Chat IA */}
          <div className="h-[500px] md:h-[600px]">
            <AdminChatIA />
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Gestion de la Plateforme</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                Surveillez la santé de la plateforme, gérez les utilisateurs et modérez le contenu de manière intelligente.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Analyse des Données</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                Analysez les métriques globales, les tendances de la plateforme et les performances globales.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Optimisation Système</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                Recevez des recommandations pour améliorer les performances et l'expérience utilisateur.
              </p>
            </div>
          </div>

          {/* Conseils d'utilisation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 md:p-6 border border-blue-100 dark:border-blue-900/30">
            <h3 className="text-base md:text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">💡 Conseils d'utilisation pour administrateurs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2 text-sm md:text-base">Gestion de la plateforme :</h4>
                <ul className="text-xs md:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• "Analyse la santé du système"</li>
                  <li>• "Liste les utilisateurs actifs"</li>
                  <li>• "Génère un rapport de modération"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2 text-sm md:text-base">Analyses et statistiques :</h4>
                <ul className="text-xs md:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• "Montre les tendances d'utilisation"</li>
                  <li>• "Analyse les performances des cours"</li>
                  <li>• "Optimise les ressources système"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

