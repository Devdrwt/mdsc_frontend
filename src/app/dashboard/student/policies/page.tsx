'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import StudentService, { StudentPreferences } from '../../../../lib/services/studentService';
import { getProfile } from '../../../../lib/services/authService';
import toast from '../../../../lib/utils/toast';
import { ShieldCheck, FileText, AlertTriangle, CheckCircle, Lock, BookOpen } from 'lucide-react';

const POLICIES_VERSION = '2025-11-11';

export default function StudentPoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<StudentPreferences | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadPreferencesAndCheckRegistration = async () => {
      try {
        // Charger les préférences
        const prefs = await StudentService.getPreferences();
        if (mounted) setPreferences(prefs ?? {});
        
        // Si les politiques ne sont pas encore acceptées dans les préférences,
        // vérifier si l'utilisateur a accepté lors de l'inscription
        if (!prefs?.policies?.accepted) {
          try {
            const profileResponse = await getProfile();
            if (profileResponse.success && profileResponse.data) {
              const userData = profileResponse.data.user || profileResponse.data;
              const userDataAny = userData as any;
              
              // Vérifier si l'utilisateur a accepté lors de l'inscription
              // Le backend peut stocker cela dans termsAcceptedAt, policiesAcceptedAt, acceptTerms, ou dans les préférences
              const registrationAcceptance = 
                userDataAny.termsAcceptedAt || 
                userDataAny.policiesAcceptedAt || 
                userDataAny.acceptTermsAt ||
                userDataAny.terms_accepted_at ||
                userDataAny.policies_accepted_at ||
                userDataAny.acceptTerms ||
                (userDataAny.preferences && userDataAny.preferences.policies?.accepted_at);
              
              // Vérifier aussi dans les préférences retournées par le profil
              const profilePreferences = profileResponse.data.preferences || userDataAny.preferences;
              const profilePoliciesAccepted = profilePreferences?.policies?.accepted_at || profilePreferences?.policies?.accepted;
              
              if (registrationAcceptance || profilePoliciesAccepted) {
                // L'utilisateur a accepté lors de l'inscription, mettre à jour les préférences
                try {
                  const updated = await StudentService.acknowledgePolicies(POLICIES_VERSION);
                  if (mounted) {
                    setPreferences((prev) => ({ ...prev, ...updated }));
                    toast.success('Synchronisation', 'Votre acceptation lors de l\'inscription a été enregistrée.');
                  }
                } catch (error) {
                  console.error('Error syncing registration acceptance:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error checking registration acceptance:', error);
          }
        } else {
          // Les politiques sont déjà acceptées, vérifier si la date d'acceptation correspond à l'inscription
          // et mettre à jour si nécessaire
          const acceptedAt = prefs.policies.accepted_at;
          if (acceptedAt) {
            try {
              const profileResponse = await getProfile();
              if (profileResponse.success && profileResponse.data) {
                const userData = profileResponse.data.user || profileResponse.data;
                const userDataAny = userData as any;
                const createdAt = userData.createdAt || userDataAny.created_at;
                
                // Si la date d'acceptation est proche de la date de création du compte,
                // cela signifie que l'acceptation a été faite lors de l'inscription
                if (createdAt && acceptedAt) {
                  const createdDate = new Date(createdAt);
                  const acceptedDate = new Date(acceptedAt);
                  const diffDays = Math.abs((acceptedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Si l'acceptation a été faite dans les 7 jours suivant l'inscription,
                  // considérer que c'est l'acceptation de l'inscription
                  if (diffDays <= 7 && acceptedDate >= createdDate) {
                    // Tout est déjà synchronisé
                    console.log('Policies already synced with registration acceptance');
                  }
                }
              }
            } catch (error) {
              console.error('Error verifying acceptance date:', error);
            }
          }
        }
      } catch (error) {
        toast.error('Impossible de récupérer vos préférences', (error as Error)?.message);
      } finally {
        if (mounted) {
          setLoading(false);
          setCheckingRegistration(false);
        }
      }
    };
    loadPreferencesAndCheckRegistration();
    return () => {
      mounted = false;
    };
  }, []);

  const alreadyAccepted = Boolean(preferences?.policies?.accepted && preferences?.policies?.accepted_at);

  const acknowledgePolicies = async () => {
    try {
      setProcessing(true);
      const updated = await StudentService.acknowledgePolicies(POLICIES_VERSION);
      setPreferences((prev) => ({ ...prev, ...updated }));
      
      // Préparer les données des policies pour l'événement
      const acceptedAt = updated.policies?.accepted_at || new Date().toISOString();
      
      // Mettre à jour le localStorage pour persister l'état
      localStorage.setItem('student_policies_accepted', 'true');
      localStorage.setItem('student_policies_accepted_at', acceptedAt);
      
      // Déclencher un événement personnalisé pour mettre à jour le dashboard
      window.dispatchEvent(new CustomEvent('studentPoliciesAccepted', { 
        detail: { 
          accepted: true,
          accepted_at: acceptedAt,
          version: POLICIES_VERSION 
        } 
      }));
      
      toast.success('Merci', 'Vos règles & confidentialité sont maintenant acceptées.');
    } catch (error) {
      toast.errorFromApi('Erreur', error, 'Impossible de valider pour le moment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-r from-mdsc-blue-primary to-emerald-500 text-white p-8 shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8" /> Règles & confidentialité utilisateur
                </h1>
                <p className="mt-2 text-white/80 max-w-2xl">
                  Ces règles définissent comment nous protégeons vos données, vos notes et vos échanges avec les formateurs. L'acceptation est requise pour continuer à suivre vos cours.
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

          <section className="space-y-6">
            <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="border-b border-gray-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FileText className="h-5 w-5 text-mdsc-blue-primary" /> Utilisation de la plateforme
                </h2>
              </header>
              <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                <p>
                  Votre compte utilisateur est personnel. Vous vous engagez à respecter les règles de conduite, à ne pas partager vos identifiants et à utiliser les ressources pédagogiques uniquement pour votre apprentissage.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Respecter les autres utilisateurs et les formateurs dans tous vos échanges.</li>
                  <li>Ne pas diffuser ou revendre les contenus sans l’autorisation des auteurs.</li>
                  <li>Signaler toute activité suspecte à l'équipe Maison de la Société Civile.</li>
                </ul>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="border-b border-gray-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Lock className="h-5 w-5 text-mdsc-blue-primary" /> Protection de vos données
                </h2>
              </header>
              <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                <p>
                  Vos informations (notes, certificats, activités) sont protégées et ne sont jamais partagées avec des tiers sans votre consentement. Vous pouvez demander un export ou une suppression via la page Paramètres.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Chiffrement des données sensibles en transit et au repos.</li>
                  <li>Accès restreint aux formateurs uniquement sur leurs cours.</li>
                  <li>Possibilité de demander un export/suppression selon le RGPD.</li>
                </ul>
              </div>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="border-b border-gray-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <BookOpen className="h-5 w-5 text-mdsc-blue-primary" /> Utilisation des contenus
                </h2>
              </header>
              <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                <p>
                  Les cours, quiz et ressources disponibles sur Maison de la Société Civile restent la propriété de leurs auteurs. Vous les utilisez dans le cadre de votre formation et vous engagez à respecter leur confidentialité.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Ne pas partager publiquement les supports sans autorisation.</li>
                  <li>Respecter les délais et consignes des évaluations.</li>
                  <li>Utiliser la messagerie de manière professionnelle.</li>
                </ul>
              </div>
            </article>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <button
                type="button"
                onClick={acknowledgePolicies}
                disabled={alreadyAccepted || processing}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  alreadyAccepted ? 'bg-green-500' : 'bg-mdsc-blue-primary hover:bg-mdsc-blue-dark'
                } disabled:opacity-60`}
              >
                {alreadyAccepted ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Règles déjà acceptées
                  </>
                ) : processing ? (
                  'Validation...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> J’accepte les règles & confidentialité
                  </>
                )}
              </button>
              <Link
                href="/dashboard/student"
                className="block text-center text-xs text-mdsc-blue-primary hover:text-mdsc-blue-dark"
              >
                Retour au tableau de bord
              </Link>
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Sans acceptation, l’accès complet aux cours et aux évaluations sera limité.</span>
              </div>
            </div>
          </section>

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
