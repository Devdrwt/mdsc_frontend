'use client';

import React from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import ChatIA from '../../../../components/dashboard/student/ChatIA';

export default function ChatIAPage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary via-mdsc-blue-dark to-mdsc-blue-primary rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Assistant IA Personnel 
            </h1>
            <p className="text-purple-100">
              Votre compagnon d'apprentissage intelligent. Posez des questions, obtenez des résumés et des recommandations personnalisées.
            </p>
          </div>

          {/* Chat IA */}
          <div className="h-[600px]">
            <ChatIA />
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Questions & Réponses</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Posez des questions sur vos cours, concepts difficiles ou demandez des explications détaillées.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Résumés Automatiques</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Obtenez des résumés intelligents de vos modules terminés avec les points clés et recommandations.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recommandations</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Recevez des suggestions de cours personnalisées basées sur votre profil et vos intérêts.
              </p>
            </div>
          </div>

          {/* Conseils d'utilisation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3"> Conseils d'utilisation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Questions efficaces :</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "Explique-moi le concept de..."</li>
                  <li>• "Quelle est la différence entre... et... ?"</li>
                  <li>• "Peux-tu me donner un exemple de... ?"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Demandes spéciales :</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "Résume ce module"</li>
                  <li>• "Recommande-moi des cours"</li>
                  <li>• "Crée un plan d'étude"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
