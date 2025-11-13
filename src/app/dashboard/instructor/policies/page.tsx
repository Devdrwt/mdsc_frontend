'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import InstructorService from '../../../../lib/services/instructorService';
import toast from '../../../../lib/utils/toast';
import { ShieldCheck, FileText, AlertTriangle, CheckCircle, Lock, Globe, Info } from 'lucide-react';

const POLICIES_VERSION = '2025-11-11';

export default function InstructorPoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<{ policies?: { accepted?: boolean; accepted_at?: string; version?: string } } | null>(null);
  const [ackProcessing, setAckProcessing] = useState(false);

  useEffect(() => {
    // Charger les préférences depuis localStorage
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('instructor_policies_accepted') === 'true';
      const acceptedAt = localStorage.getItem('instructor_policies_accepted_at') || undefined;
      const version = localStorage.getItem('instructor_policies_version') || POLICIES_VERSION;
      
      if (accepted) {
        setPreferences({
          policies: {
            accepted: true,
            accepted_at: acceptedAt,
            version: version,
          },
        });
      }
    }
    setLoading(false);
  }, []);

  const alreadyAccepted = Boolean(preferences?.policies?.accepted && preferences?.policies?.accepted_at);

  const acknowledgePolicies = async () => {
    try {
      setAckProcessing(true);
      
      // Préparer les données des policies pour l'événement
      const acceptedAt = new Date().toISOString();
      
      // Mettre à jour le state avec les nouvelles préférences
      setPreferences({
        policies: {
          accepted: true,
          accepted_at: acceptedAt,
          version: POLICIES_VERSION,
        },
      });
      
      // Notifier les autres composants (comme le dashboard) que les politiques ont été acceptées
      if (typeof window !== 'undefined') {
        // Stocker dans localStorage pour persistance
        localStorage.setItem('instructor_policies_accepted', 'true');
        localStorage.setItem('instructor_policies_accepted_at', acceptedAt);
        localStorage.setItem('instructor_policies_version', POLICIES_VERSION);
        
        // Déclencher un événement personnalisé pour synchroniser les autres pages
        window.dispatchEvent(new CustomEvent('policiesAccepted', { 
          detail: { 
            accepted: true, 
            accepted_at: acceptedAt,
            version: POLICIES_VERSION 
          } 
        }));
      }
      
      toast.success('Merci', 'Vous avez accepté les règles & confidentialité.');
    } catch (error) {
      toast.errorFromApi('Erreur', error, "Impossible d'enregistrer votre validation pour le moment.");
    } finally {
      setAckProcessing(false);
    }
  };

  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-br from-mdsc-blue-primary to-mdsc-gold text-white p-8 shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8" /> Règles & Confidentialité
                </h1>
                <p className="mt-2 text-white/80 max-w-2xl">
                  Découvrez comment nous protégeons vos données, vos contenus et celles de vos étudiants. L’acceptation de ces règles est obligatoire pour continuer à utiliser l’espace instructeur.
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-white/60">Version effective {new Date(POLICIES_VERSION).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="rounded-xl bg-black/10 px-6 py-4 backdrop-blur">
                <p className="text-sm text-white/80">Statut</p>
                <p className="text-lg font-semibold">
                  {alreadyAccepted ? 'Accepté' : 'En attente de validation'}
                </p>
                {preferences?.policies?.accepted_at && (
                  <p className="text-xs text-white/70 mt-1">
                    Accepté le {new Date(preferences.policies.accepted_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="space-y-6">
              <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <header className="border-b border-gray-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileText className="h-5 w-5 text-mdsc-blue-primary" /> Conditions d’utilisation
                  </h2>
                </header>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p>
                    En tant qu’instructeur MDCS, vous vous engagez à publier des contenus respectueux du cadre légal et à garantir la qualité pédagogique des formations proposées. Toute activité frauduleuse ou portant atteinte à l’intégrité de la plateforme est strictement interdite.
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Respecter les droits d’auteur et les licences applicables aux ressources partagées.</li>
                    <li>Assurer un suivi professionnel des étudiants et répondre à leurs demandes dans un délai raisonnable.</li>
                    <li>Ne pas utiliser la plateforme pour des communications abusives ou non sollicitées.</li>
                  </ul>
                </div>
              </article>

              <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <header className="border-b border-gray-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Lock className="h-5 w-5 text-mdsc-blue-primary" /> Protection des données
                  </h2>
                </header>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p>
                    Nous mettons en œuvre des mesures de sécurité avancées pour protéger vos données et celles de vos apprenants. Vos informations personnelles sont stockées dans l’Union Européenne et ne sont utilisées que dans le cadre du service.
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Chiffrement des données sensibles et audits réguliers.</li>
                    <li>Accès restreint aux informations critiques et journalisation des actions.</li>
                    <li>Respect de la réglementation RGPD et possibilité d’export/suppression sur demande.</li>
                  </ul>
                </div>
              </article>

              <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <header className="border-b border-gray-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Globe className="h-5 w-5 text-mdsc-blue-primary" /> Engagements envers les apprenants
                  </h2>
                </header>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p>
                    Les données des apprenants doivent être traitées avec la plus grande confidentialité. Vous ne pouvez les utiliser qu’à des fins pédagogiques dans le cadre de MDCS.
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Ne pas exporter les informations personnelles pour un usage externe sans consentement.</li>
                    <li>Informer MDCS en cas de suspicion de fuite ou d’accès non autorisé.</li>
                    <li>Garantir la conformité de vos sous-traitants (ex. outils externes) avec le RGPD.</li>
                  </ul>
                </div>
              </article>
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-4 w-4 text-mdsc-blue-primary" /> Questions fréquentes
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>Puis-je exporter mes données ?</strong>
                    <p>Oui, via la page Paramètres &gt; Gestion des données, un export complet peut être demandé.</p>
                  </li>
                  <li>
                    <strong>Comment signaler un incident ?</strong>
                    <p>Contactez support@mdsc.ci en détaillant l’événement, nous vous répondrons rapidement.</p>
                  </li>
                  <li>
                    <strong>Mon acceptation est-elle obligatoire ?</strong>
                    <p>Oui, sans acceptation, l’accès complet à l’espace instructeur est bloqué.</p>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <p className="text-sm text-gray-600">
                  En acceptant ces règles, vous confirmez avoir lu et compris nos engagements respectifs. Une copie vous sera envoyée par email.
                </p>
                <button
                  type="button"
                  onClick={acknowledgePolicies}
                  disabled={alreadyAccepted || ackProcessing}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    alreadyAccepted ? 'bg-green-500' : 'bg-mdsc-blue-primary hover:bg-mdsc-blue-dark'
                  } disabled:opacity-60`}
                >
                  {alreadyAccepted ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Règles déjà acceptées
                    </>
                  ) : ackProcessing ? (
                    'Validation...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> J’accepte les règles & confidentialité
                    </>
                  )}
                </button>

                <Link
                  href="/dashboard/instructor/settings"
                  className="block text-center text-xs text-mdsc-blue-primary hover:text-mdsc-blue-dark"
                >
                  Retour aux paramètres
                </Link>

                <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>En l’absence d’acceptation, certaines fonctionnalités (création de cours, messagerie) seront limitées.</span>
                </div>
              </div>
            </aside>
          </div>

          {loading && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="rounded-full border-4 border-white/30 border-t-white h-14 w-14 animate-spin" />
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
