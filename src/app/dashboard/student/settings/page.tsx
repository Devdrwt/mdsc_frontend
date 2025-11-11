'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import StudentService, { StudentPreferences } from '../../../../lib/services/studentService';
import toast from '../../../../lib/utils/toast';
import { useTheme } from '../../../../lib/context/ThemeContext';
import {
  UserCircle,
  BookOpen,
  Bell,
  Send,
  CalendarCheck,
  Trophy,
  Settings,
  Sun,
  Moon,
  Smartphone,
  Globe,
  Clock,
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  Info,
  AlertTriangle,
  Download,
  Trash2,
  X,
} from 'lucide-react';

interface NotificationPreferences {
  courseReminders: boolean;
  quizReminders: boolean;
  newMessages: boolean;
  achievements: boolean;
}

interface LearningPreferences {
  studyMode: 'standard' | 'intensive' | 'relaxed';
  timeReminder: boolean;
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
    className={`flex w-full items-start justify-between rounded-lg border px-4 py-3 transition ${
      enabled ? 'border-mdsc-blue-primary bg-blue-50/70' : 'border-gray-200 hover:border-mdsc-blue-primary/50'
    }`}
  >
    <div className="text-left">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
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

export default function StudentSettingsPage() {
  const { user } = useAuthStore();
  const { theme, setPreference } = useTheme();
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    courseReminders: true,
    quizReminders: true,
    newMessages: true,
    achievements: true,
  });
  const [learningPreferences, setLearningPreferences] = useState<LearningPreferences>({
    studyMode: 'standard',
    timeReminder: true,
  });
  const [communicationLanguage, setCommunicationLanguage] = useState<'fr' | 'en'>('fr');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfirm, setExportConfirm] = useState(false);
  const [exportProcessing, setExportProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const studentName = useMemo(
    () => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Étudiant',
    [user?.firstName, user?.lastName]
  );

  const studentEmail = user?.email ?? '—';

  useEffect(() => {
    let mounted = true;
    const loadPreferences = async () => {
      try {
        const prefs = await StudentService.getPreferences();
        if (!mounted || !prefs) return;
        if (prefs.language) setCommunicationLanguage(prefs.language);
        
        // Synchroniser le thème avec ThemeContext
        const storedTheme = localStorage.getItem('mdsc-theme') as 'light' | 'dark' | 'system' | null;
        const themeToUse = prefs.theme || storedTheme || 'system';
        if (themeToUse === 'light' || themeToUse === 'dark' || themeToUse === 'system') {
          setThemePreference(themeToUse);
          setPreference(themeToUse);
        }
        
        if ((prefs as any).notifications) {
          const prefNotifs = (prefs as any).notifications;
          setNotificationPreferences((prev) => ({
            ...prev,
            courseReminders: prefNotifs.course_reminders ?? prev.courseReminders,
            quizReminders: prefNotifs.quiz_reminders ?? prev.quizReminders,
            newMessages: prefNotifs.new_messages ?? prev.newMessages,
            achievements: prefNotifs.achievements ?? prev.achievements,
          }));
        }
        if ((prefs as any).learning) {
          const prefLearning = (prefs as any).learning;
          setLearningPreferences((prev) => ({
            ...prev,
            studyMode: prefLearning.study_mode ?? prev.studyMode,
            timeReminder: prefLearning.time_reminder ?? prev.timeReminder,
          }));
        }
        if (prefs.policies?.accepted) setPoliciesAccepted(true);
      } catch (error) {
        toast.error('Impossible de charger vos préférences', (error as Error)?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [setPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mdsc-language', communicationLanguage);
    document.documentElement.lang = communicationLanguage;
  }, [communicationLanguage]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Mettre à jour le thème via ThemeContext
      if (themePreference === 'light' || themePreference === 'dark' || themePreference === 'system') {
        setPreference(themePreference);
      }
      
      const payload: StudentPreferences = {
        language: communicationLanguage,
        theme: themePreference,
        policies: policiesAccepted ? { accepted: true } : undefined,
      } as StudentPreferences & {
        notifications?: any;
        learning?: any;
      };
      (payload as any).notifications = {
        course_reminders: notificationPreferences.courseReminders,
        quiz_reminders: notificationPreferences.quizReminders,
        new_messages: notificationPreferences.newMessages,
        achievements: notificationPreferences.achievements,
      };
      (payload as any).learning = {
        study_mode: learningPreferences.studyMode,
        time_reminder: learningPreferences.timeReminder,
      };

      await StudentService.updatePreferences(payload);
      toast.success('Préférences sauvegardées', 'Vos réglages personnels ont été enregistrés.');
    } catch (error) {
      toast.errorFromApi('Sauvegarde impossible', error, 'La gestion détaillée des préférences n’est pas encore disponible.');
    } finally {
      setSaving(false);
    }
  };

  const openExportModal = () => {
    setExportConfirm(false);
    setIsExportModalOpen(true);
  };

  const openDeleteModal = () => {
    setDeleteReason('');
    setDeleteConfirmInput('');
    setIsDeleteModalOpen(true);
  };

  const submitDataExport = async () => {
    try {
      setExportProcessing(true);
      toast.info('Demande enregistrée', 'Nous vous informerons lorsque l’export sera disponible.');
      setIsExportModalOpen(false);
    } finally {
      setExportProcessing(false);
    }
  };

  const submitAccountDeletion = async () => {
    try {
      setDeleteProcessing(true);
      toast.warning('Demande envoyée', 'Un conseiller MDCS vous contactera pour valider la suppression.');
      setIsDeleteModalOpen(false);
    } finally {
      setDeleteProcessing(false);
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-r from-mdsc-blue-primary to-emerald-500 p-8 text-white shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Espace étudiant</p>
                <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
                  <Settings className="h-7 w-7" /> Paramètres & préférences personnelles
                </h1>
                <p className="mt-2 max-w-2xl text-white/80">
                  Adaptez votre expérience d’apprentissage, vos notifications et vos préférences de confidentialité.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur border border-white/20">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10" />
                  <div>
                    <p className="text-sm text-white/70">Connecté en tant que</p>
                    <p className="text-lg font-semibold">{studentName}</p>
                    <p className="text-xs text-white/60">{studentEmail}</p>
                  </div>
                </div>
                {policiesAccepted ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                    <CheckCircle className="h-4 w-4" /> Règles acceptées
                  </p>
                ) : (
                  <Link
                    href="/dashboard/student/policies"
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-100 hover:bg-orange-500/30"
                  >
                    <AlertTriangle className="h-4 w-4" /> Règles à accepter
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Actions rapides</p>
                <div className="space-y-3 text-sm">
                  <Link
                    href="/dashboard/student/profile"
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" /> Mon profil
                    </span>
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/dashboard/student/courses"
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Mes cours
                    </span>
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/dashboard/student/messages"
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Messagerie
                    </span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Guides utiles</p>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>
                    <Link href="#notifications" className="hover:text-mdsc-blue-primary">
                      Gestion des notifications
                    </Link>
                  </li>
                  <li>
                    <Link href="#learning" className="hover:text-mdsc-blue-primary">
                      Préférences d’apprentissage
                    </Link>
                  </li>
                  <li>
                    <Link href="#appearance" className="hover:text-mdsc-blue-primary">
                      Apparence & langue
                    </Link>
                  </li>
                  <li>
                    <Link href="#privacy" className="hover:text-mdsc-blue-primary">
                      Données & confidentialité
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>

            <section className="space-y-6">
              <div id="notifications" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                    <p className="text-sm text-gray-500">
                      Choisissez comment vous souhaitez être averti(e) des événements importants.
                    </p>
                  </div>
                  <Bell className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <SettingToggle
                    label="Rappels de cours"
                    description="Recevoir un rappel avant chaque session planifiée."
                    enabled={notificationPreferences.courseReminders}
                    onToggle={() =>
                      setNotificationPreferences((prev) => ({ ...prev, courseReminders: !prev.courseReminders }))
                    }
                  />
                  <SettingToggle
                    label="Rappels de quiz"
                    description="Être alerté(e) avant la date de rendu d’un quiz ou d’une évaluation."
                    enabled={notificationPreferences.quizReminders}
                    onToggle={() =>
                      setNotificationPreferences((prev) => ({ ...prev, quizReminders: !prev.quizReminders }))
                    }
                  />
                  <SettingToggle
                    label="Nouveaux messages"
                    description="Notification instantanée lorsqu’un instructeur vous écrit."
                    enabled={notificationPreferences.newMessages}
                    onToggle={() =>
                      setNotificationPreferences((prev) => ({ ...prev, newMessages: !prev.newMessages }))
                    }
                  />
                  <SettingToggle
                    label="Succès & badges"
                    description="Recevoir un message lorsque vous débloquez un badge ou un certificat."
                    enabled={notificationPreferences.achievements}
                    onToggle={() =>
                      setNotificationPreferences((prev) => ({ ...prev, achievements: !prev.achievements }))
                    }
                  />
                </div>
              </div>

              <div id="learning" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Préférences d’apprentissage</h2>
                    <p className="text-sm text-gray-500">Adaptez le rythme et les rappels pour rester motivé(e).</p>
                  </div>
                  <CalendarCheck className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rythme d’étude préféré</p>
                    <p className="text-xs text-gray-500">Vous pouvez ajuster votre rythme à tout moment.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
                      {[
                        { value: 'relaxed', label: 'Relaxé', description: '3 sessions par semaine' },
                        { value: 'standard', label: 'Standard', description: '5 sessions par semaine' },
                        { value: 'intensive', label: 'Intensif', description: '2 sessions par jour' },
                      ].map(({ value, label, description }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLearningPreferences((prev) => ({ ...prev, studyMode: value as LearningPreferences['studyMode'] }))}
                          className={`flex h-full flex-col rounded-lg border px-4 py-3 text-left transition ${
                            learningPreferences.studyMode === value
                              ? 'border-mdsc-blue-primary bg-blue-50/70'
                              : 'border-gray-200 hover:border-mdsc-blue-primary/50'
                          }`}
                        >
                          <span className="font-semibold text-gray-900">{label}</span>
                          <span className="mt-1 text-xs text-gray-500">{description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <SettingToggle
                    label="Rappel d’étude quotidien"
                    description="Recevoir une notification si vous n’avez pas étudié depuis 24h."
                    enabled={learningPreferences.timeReminder}
                    onToggle={() =>
                      setLearningPreferences((prev) => ({ ...prev, timeReminder: !prev.timeReminder }))
                    }
                  />
                </div>
              </div>

              <div id="appearance" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Apparence & langue</h2>
                    <p className="text-sm text-gray-500">Ajustez le thème et la langue de communication.</p>
                  </div>
                </div>
                <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Globe className="h-4 w-4" /> Langue de communication
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Vous recevrez vos emails et notifications dans cette langue.</p>
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
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Sun className="h-4 w-4" /> Thème de l’interface
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Choisissez le mode qui vous convient le mieux.</p>
                    <div className="mt-4 space-y-2 text-sm">
                      {[
                        { value: 'light', label: 'Clair', icon: Sun },
                        { value: 'dark', label: 'Sombre', icon: Moon },
                        { value: 'system', label: 'Automatique (système)', icon: Smartphone },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            const newTheme = value as typeof themePreference;
                            setThemePreference(newTheme);
                            if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
                              setPreference(newTheme);
                            }
                          }}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                            themePreference === value
                              ? 'border-mdsc-blue-primary bg-blue-50/70'
                              : 'border-gray-200 hover:border-mdsc-blue-primary/50'
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

              <div id="privacy" className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Données & confidentialité</h2>
                    <p className="text-sm text-gray-500">Consultez vos droits et gérez vos demandes.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <Link
                    href="/dashboard/student/policies"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <Info className="h-4 w-4" /> Consulter les règles & confidentialité
                  </Link>
                  <button
                    type="button"
                    onClick={openExportModal}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-mdsc-blue-primary hover:text-mdsc-blue-primary transition"
                  >
                    <Download className="h-4 w-4" /> Demander un export de mes données
                  </button>
                  <button
                    type="button"
                    onClick={openDeleteModal}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" /> Demander la suppression de mon compte
                  </button>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Nous traitons vos demandes sous 30 jours ouvrés conformément au RGPD.
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-mdsc-blue-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-mdsc-blue-dark transition disabled:opacity-60"
                >
                  {saving ? (
                    'Enregistrement...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          {(loading || saving) && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="rounded-full border-4 border-white/40 border-t-white h-14 w-14 animate-spin" />
            </div>
          )}

          {isExportModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Demande d’export de données</h3>
                    <p className="text-xs text-gray-500">Un lien de téléchargement vous sera envoyé par email.</p>
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
                  <p>Votre export comprendra vos cours suivis, certificats, badges et messages échangés.</p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={exportConfirm}
                      onChange={(e) => setExportConfirm(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-mdsc-blue-primary focus:ring-mdsc-blue-primary"
                    />
                    <span>Je comprends que cette demande peut nécessiter un délai de traitement.</span>
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
                    <p className="text-xs text-gray-500">Cette action est irréversible après validation.</p>
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
                  <p>Expliquez brièvement votre demande afin que nous puissions améliorer la plateforme.</p>
                  <textarea
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-400"
                    placeholder="Motif (optionnel)"
                  />
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Tapez <strong>SUPPRIMER</strong> pour confirmer votre demande.</span>
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

