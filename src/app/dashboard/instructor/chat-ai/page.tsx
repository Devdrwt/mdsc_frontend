'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import InstructorChatIA from '../../../../components/dashboard/instructor/InstructorChatIA';

export default function InstructorChatIAPage() {
  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-mdsc-gold to-yellow-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Assistant IA Formateur 🤖
            </h1>
            <p className="text-yellow-100">
              Votre compagnon pédagogique intelligent. Créez du contenu, analysez les performances et optimisez vos cours.
            </p>
          </div>

          {/* Chat IA */}
          <div className="h-[600px]">
            <InstructorChatIA />
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-mdsc-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Création de Contenu</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Générez des cours, quiz, exercices et supports pédagogiques adaptés à vos objectifs d'apprentissage.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Analyse des Performances</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Analysez les données de vos étudiants, identifiez les points d'amélioration et optimisez vos cours.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Optimisation Pédagogique</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Recevez des conseils personnalisés pour améliorer l'efficacité de vos cours et l'engagement des étudiants.
              </p>
            </div>
          </div>

          {/* Conseils d'utilisation */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">💡 Conseils d'utilisation pour formateurs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Création de contenu :</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• "Crée un cours sur [sujet] pour [niveau]"</li>
                  <li>• "Génère des exercices pratiques pour..."</li>
                  <li>• "Conçois un plan de cours structuré"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Analyse et optimisation :</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• "Comment améliorer l'engagement ?"</li>
                  <li>• "Analyse les performances de mes étudiants"</li>
                  <li>• "Suggestions pour optimiser ce cours"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
