'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import toast from '../../../../lib/utils/toast';
import InstructorService from '../../../../lib/services/instructorService';
import {
  Settings,
  UserCog,
  Mail,
  ShieldCheck,
  Smartphone,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

interface NotificationPreferences {
  courseUpdates: boolean;
  studentActivity: boolean;
  platformNews: boolean;
  weeklyDigest: boolean;
}

interface SecurityPreferences {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  deviceTrust: boolean;
}

const SettingToggle = ({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-start justify-between w-full rounded-lg border px-4 py-3 transition ${
      enabled ? 'border-mdsc-blue-primary bg-blue-50/60' : 'border-gray-200 hover:border-mdsc-blue-primary/50'
    }`}
  >
    <div className="text-left">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <span
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition ${
        enabled ? 'bg-mdsc-blue-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </span>
  </button>
);

export default function InstructorSettingsPage() {
  const { user } = useAuthStore();
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    courseUpdates: true,
    studentActivity: true,
    platformNews: false,
    weeklyDigest: true,
  });
  const [securityPreferences, setSecurityPreferences] = useState<SecurityPreferences>({
    twoFactorAuth: false,
    loginAlerts: true,
    deviceTrust: true,
  });
  const [communicationLanguage, setCommunicationLanguage] = useState<'fr' | 'en'>('fr');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfirm, setExportConfirm] = useState(false);
  const [exportProcessing, setExportProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const instructorEmail = useMemo(() => user?.email ?? '—', [user?.email]);
  const instructorName = useMemo(() => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Formateur', [
    user?.firstName,
    user?.lastName,
  ]);

  useEffect(() => {
    // Charger les préférences depuis localStorage si disponibles
    if (typeof window !== 'undefined') {
      try {
        const storedPrefs = localStorage.getItem('instructor_preferences');
        if (storedPrefs) {
          const preferences = JSON.parse(storedPrefs);
          if (preferences.notifications) {
            setNotificationPreferences((prev) => ({
              ...prev,
              courseUpdates: preferences.notifications.course_updates ?? prev.courseUpdates,
              studentActivity: preferences.notifications.student_activity ?? prev.studentActivity,
              platformNews: preferences.notifications.platform_news ?? prev.platformNews,
              weeklyDigest: preferences.notifications.weekly_digest ?? prev.weeklyDigest,
            }));
          }
          if (preferences.security) {
            setSecurityPreferences((prev) => ({
              ...prev,
              twoFactorAuth: preferences.security.two_factor_auth ?? prev.twoFactorAuth,
              loginAlerts: preferences.security.login_alerts ?? prev.loginAlerts,
              deviceTrust: preferences.security.device_trust ?? prev.deviceTrust,
            }));
          }
          if (preferences.language) {
            setCommunicationLanguage(preferences.language);
          }
          if (preferences.theme) {
            setThemePreference(preferences.theme);
          }
          if (preferences.policies?.accepted) {
            setPoliciesAccepted(true);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      } finally {
        setPreferencesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (themePreference === 'system') {
      document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      localStorage.removeItem('mdsc-theme');
    } else {
      document.documentElement.dataset.theme = themePreference;
      localStorage.setItem('mdsc-theme', themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mdsc-language', communicationLanguage);
  }, [communicationLanguage]);

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSecurityToggle = (key: keyof SecurityPreferences) => {
    setSecurityPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      const preferencesPayload = {
        language: communicationLanguage,
        theme: themePreference,
        notifications: {
          course_updates: notificationPreferences.courseUpdates,
          student_activity: notificationPreferences.studentActivity,
          platform_news: notificationPreferences.platformNews,
          weekly_digest: notificationPreferences.weeklyDigest,
        },
        security: {
          two_factor_auth: securityPreferences.twoFactorAuth,
          login_alerts: securityPreferences.loginAlerts,
          device_trust: securityPreferences.deviceTrust,
        },
      };

      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('instructor_preferences', JSON.stringify(preferencesPayload));
      }
      
      toast.success('Préférences enregistrées', 'Vos paramètres seront pris en compte pour les prochaines sessions.');
    } catch (error) {
      toast.errorFromApi('Erreur', error, 'Impossible de sauvegarder vos préférences pour le moment.');
    }
  };

  const handleDataExport = () => {
    setExportConfirm(false);
    setIsExportModalOpen(true);
  };

  const handleAccountDeletion = () => {
    setDeleteReason('');
    setDeleteConfirmInput('');
    setIsDeleteModalOpen(true);
  };

  const submitDataExport = async () => {
    try {
      setExportProcessing(true);
      // TODO: Implémenter l'export de données via API
      toast.success('Demande envoyée', 'Nous vous avertirons par email dès que l\'export sera prêt.');
      setIsExportModalOpen(false);
    } catch (error) {
      toast.errorFromApi('Erreur export', error, 'Impossible d\'enregistrer la demande pour le moment.');
    } finally {
      setExportProcessing(false);
    }
  };

  const submitAccountDeletion = async () => {
    try {
      setDeleteProcessing(true);
      // TODO: Implémenter la demande de suppression de compte via API
      toast.warning('Demande transmise', 'Notre équipe reviendra vers vous pour finaliser la suppression.');
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.errorFromApi('Suppression impossible', error, 'Veuillez réessayer plus tard.');
    } finally {
      setDeleteProcessing(false);
    }
  };

  return (
    <AuthGuard requiredRole="instructor">
      <DashboardLayout userRole="instructor">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-mdsc-gold text-white">
            <div className="absolute" />
            <div className="relative z-10 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Centre de préférences</p>
                  <h1 className="mt-2 text-3xl font-bold">Paramètres de votre espace formateur</h1>
                  <p className="mt-2 max-w-2xl text-white/80">
                    Personnalisez vos préférences de communication, de sécurité et d'intégration pour gagner du temps et
                    rester informé.
                  </p>
                </div>
                <div className="flex flex-col gap-3 rounded-xl bg-white/10 p-4 backdrop-blur border border-white/20">
                  <div className="flex items-center gap-3">
                    <Settings className="h-10 w-10" />
                    <div>
                      <p className="text-sm text-white/80">Connecté en tant que</p>
                      <p className="text-lg font-semibold">{instructorName}</p>
                      <p className="text-xs text-white/70">{instructorEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <CheckCircle className="h-4 w-4" />
                    Profil formateur vérifié
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Actions rapides</p>
                <div className="space-y-3 text-sm">
                  <Link href="/dashboard/instructor/profile" className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition">
                    <span className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Modifier mon profil
                    </span>
                    <span aria-hidden>→</span>
                  </Link>
                  <Link href="/dashboard/instructor/messages" className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Ouvrir la messagerie
                    </span>
                    <span aria-hidden>→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleDataExport}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exporter mes données
                    </span>
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Guides ressources</p>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>
                    <a href="#notifications" className="hover:text-mdsc-blue-primary">
                      Notifications et communication
                    </a>
                  </li>
                  <li>
                    <a href="#security" className="hover:text-mdsc-blue-primary">
                      Sécurité & accès
                    </a>
                  </li>
                  <li>
                    <a href="#appearance" className="hover:text-mdsc-blue-primary">
                      Apparence & langue
                    </a>
                  </li>
                  <li>
                    <a href="#integrations" className="hover:text-mdsc-blue-primary">
                      Intégrations & API
                    </a>
                  </li>
                </ul>
              </div>
            </aside>

            <section className="space-y-6">
              <div id="account" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Informations du compte</h2>
                    <p className="text-sm text-gray-500">Mettez à jour vos informations personnelles et vos identifiants.</p>
                  </div>
                  <Link
  href="/dashboard/instructor/profile"
  className="inline-flex items-center gap-2 rounded-lg border border-mdsc-blue-primary px-3 py-2 text-sm font-medium text-mdsc-blue-primary hover:bg-mdsc-blue-primary/20 hover:text-mdsc-blue-primary transition"
>
  <UserCog className="h-4 w-4" /> Modifier le profil
</Link>
                </div>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p><strong>Nom complet :</strong> {instructorName}</p>
                  <p><strong>Adresse email :</strong> {instructorEmail}</p>
                  <p><strong>Rôle :</strong> Formateur</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="h-4 w-4" />
                    Vos informations sont sécurisées et chiffrées.
                  </div>
                </div>
              </div>

              <div id="notifications" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Notifications & communications</h2>
                    <p className="text-sm text-gray-500">Choisissez les alertes que vous souhaitez recevoir.</p>
                  </div>
                  <Bell className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <SettingToggle
                    label="Mises à jour de mes cours"
                    description="Recevoir une alerte à chaque modification ou publication liée à vos cours."
                    enabled={notificationPreferences.courseUpdates}
                    onToggle={() => handleNotificationToggle('courseUpdates')}
                  />
                  <SettingToggle
                    label="Activité des utilisateurs"
                    description="Être informé lorsque vos utilisateurs déposent des travaux ou posent des questions."
                    enabled={notificationPreferences.studentActivity}
                    onToggle={() => handleNotificationToggle('studentActivity')}
                  />
                  <SettingToggle
                    label="Nouveautés plateforme"
                    description="Recevoir les annonces produits, mises à jour et webinaires Maison de la Société Civile."
                    enabled={notificationPreferences.platformNews}
                    onToggle={() => handleNotificationToggle('platformNews')}
                  />
                  <SettingToggle
                    label="Résumé hebdomadaire"
                    description="Recevoir chaque semaine un bilan synthétique de vos cours et statistiques."
                    enabled={notificationPreferences.weeklyDigest}
                    onToggle={() => handleNotificationToggle('weeklyDigest')}
                  />
                </div>
              </div>

              <div id="appearance" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Apparence & langue</h2>
                    <p className="text-sm text-gray-500">Adaptez l'interface à vos habitudes.</p>
                  </div>
                </div>
                <div className="px-6 py-5 grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Langue de communication
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Les emails et notifications vous seront envoyés dans cette langue.</p>
                    <div className="mt-4 space-y-2 text-sm">
                      {(['fr', 'en'] as const).map((lang) => (
                        <label key={lang} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="language"
                            value={lang}
                            checked={communicationLanguage === lang}
                            onChange={() => setCommunicationLanguage(lang)}
                            className="text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                          />
                          <span>{lang === 'fr' ? 'Français' : 'English'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Thème de l'interface
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Passez en mode sombre pour travailler confortablement le soir.</p>
                    <div className="mt-4 space-y-2 text-sm">
                      {(
                        [
                          { value: 'light', label: 'Clair', icon: Sun },
                          { value: 'dark', label: 'Sombre', icon: Moon },
                          { value: 'system', label: 'Automatique (suivre le système)', icon: Smartphone },
                        ] as const
                      ).map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setThemePreference(value)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                            themePreference === value ? 'border-mdsc-blue-primary bg-blue-50/60' : 'border-gray-200 hover:border-mdsc-blue-primary/50'
                          }`}
                        >
                          <span>{label}</span>
                          <Icon className="h-4 w-4 text-gray-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div id="security" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sécurité & confidentialité</h2>
                    <p className="text-sm text-gray-500">Renforcez la sécurité de votre compte formateur.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <SettingToggle
                    label="Double authentification"
                    description="Ajoutez une étape de vérification lors des connexions."
                    enabled={securityPreferences.twoFactorAuth}
                    onToggle={() => handleSecurityToggle('twoFactorAuth')}
                  />
                  <SettingToggle
                    label="Alertes de connexion"
                    description="Recevez un email lorsqu'une nouvelle connexion est détectée."
                    enabled={securityPreferences.loginAlerts}
                    onToggle={() => handleSecurityToggle('loginAlerts')}
                  />
                  <SettingToggle
                    label="Appareils de confiance"
                    description="Ne pas demander la double authentification sur vos appareils habituels."
                    enabled={securityPreferences.deviceTrust}
                    onToggle={() => handleSecurityToggle('deviceTrust')}
                  />
                  <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Vous pourrez gérer la liste de vos appareils connectés dans une prochaine version.</span>
                  </div>
                </div>
              </div>

              <div id="integrations" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Intégrations & outils associés</h2>
                    <p className="text-sm text-gray-500">Connectez vos outils de visioconférence ou CRM.</p>
                  </div>
                </div>
                <div className="px-6 py-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">Zoom / Visio</p>
                    <p className="text-xs text-gray-500 mt-1">Planifier vos classes virtuelles sans quitter la plateforme.</p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                      onClick={() => toast.info('À venir', 'L’intégration Zoom sera disponible prochainement.')}
                    >
                      Configurer
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-900">CRM & Emailing</p>
                    <p className="text-xs text-gray-500 mt-1">Synchronisez vos contacts pour des relances ciblées.</p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                      onClick={() => toast.info('À venir', 'Des connecteurs CRM seront bientôt proposés.')}
                    >
                      Ajouter une intégration
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <h2 className="text-lg font-semibold text-gray-900">Gestion des données</h2>
                  <p className="text-sm text-gray-500">Exportez ou supprimez votre compte en accord avec le RGPD.</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <Link
                    href="/dashboard/instructor/policies"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <Lock className="h-4 w-4" /> Consulter les règles & confidentialité
                  </Link>
                  <button
                    type="button"
                    onClick={handleDataExport}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <Download className="h-4 w-4" /> Demander un export complet
                  </button>
                  <button
                    type="button"
                    onClick={handleAccountDeletion}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" /> Demander la suppression du compte
                  </button>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Conformément au RGPD, un délai de 30 jours peut être nécessaire pour traiter votre demande.
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-mdsc-blue-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-mdsc-blue-dark transition"
                  disabled={preferencesLoading}
                >
                  <CheckCircle className="h-4 w-4" /> Enregistrer les modifications
                </button>
              </div>
            </section>
          </div>

          {preferencesLoading && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="rounded-full border-4 border-white/30 border-t-white h-14 w-14 animate-spin" />
            </div>
          )}

          {isExportModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Demander un export de données</h3>
                    <p className="text-xs text-gray-500">Par mesure de sécurité, cette opération nécessite une confirmation explicite.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p>
                    Votre export contiendra vos cours, inscriptions et données associées. Un email vous sera envoyé dès que le téléchargement sera prêt.
                  </p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={exportConfirm}
                      onChange={(e) => setExportConfirm(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    />
                    <span>J'autorise l'export de toutes mes données formateur et je confirme être le détenteur du compte.</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                    disabled={exportProcessing}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={submitDataExport}
                    disabled={!exportConfirm || exportProcessing}
                    className="inline-flex items-center gap-2 rounded-lg bg-mdsc-blue-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {exportProcessing ? 'Envoi...' : 'Confirmer la demande'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600">Demande de suppression de compte</h3>
                    <p className="text-xs text-gray-500">Cette opération est définitive après validation par l'équipe Maison de la Société Civile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4 text-sm text-gray-600">
                  <p>
                    Votre demande sera transmise à notre équipe qui vérifiera votre identité avant toute suppression. Indiquez la raison afin de nous aider à améliorer la plateforme.
                  </p>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Motif (optionnel)</label>
                    <textarea
                      rows={3}
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400"
                      placeholder="Expliquez brièvement la raison de votre départ"
                    />
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous puis envoyez la demande.</span>
                  </div>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400 uppercase"
                    placeholder="SUPPRIMER"
                  />
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                    disabled={deleteProcessing}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={submitAccountDeletion}
                    disabled={deleteConfirmInput !== 'SUPPRIMER' || deleteProcessing}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {deleteProcessing ? 'Envoi...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

