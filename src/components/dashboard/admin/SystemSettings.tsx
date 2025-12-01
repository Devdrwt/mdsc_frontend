'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  Database, 
  Mail, 
  Shield, 
  Server, 
  Brain,
  Users,
  BookOpen,
  Award,
  Bell,
  Lock,
  Key,
  Upload,
  Download,
  Zap,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  Copy,
  CheckCircle2,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import toast from '../../../lib/utils/toast';
import {
  getPaymentProviders,
  createPaymentProvider,
  updatePaymentProvider,
  deletePaymentProvider,
  togglePaymentProviderStatus,
  PaymentProvider,
  PaymentProviderFormData,
} from '../../../lib/services/adminPaymentConfigService';

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
  };
  features: {
    enableGamification: boolean;
    enableChatIA: boolean;
    enableCertificates: boolean;
    enableAnalytics: boolean;
    enableNotifications: boolean;
  };
  integrations: {
    moodleUrl: string;
    moodleToken: string;
    openaiApiKey: string;
    minioEndpoint: string;
    minioAccessKey: string;
    minioSecretKey: string;
  };
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'Maison de la Société Civile',
      siteDescription: 'Plateforme d\'apprentissage pour les organisations de la société civile',
      siteUrl: 'https://mdsc.ci',
      defaultLanguage: 'fr',
      timezone: 'Africa/Abidjan',
      maintenanceMode: false
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'datainnovation12@gmail.com',
      smtpPassword: '••••••••••••••••',
      fromEmail: 'noreply@mdsc.ci',
      fromName: 'MdSC Platform'
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: true,
      enableTwoFactor: false
    },
    features: {
      enableGamification: true,
      enableChatIA: true,
      enableCertificates: true,
      enableAnalytics: true,
      enableNotifications: true
    },
    integrations: {
      moodleUrl: 'http://localhost/moodle',
      moodleToken: '••••••••••••••••',
      openaiApiKey: '••••••••••••••••',
      minioEndpoint: 'http://localhost:9000',
      minioAccessKey: '••••••••••••••••',
      minioSecretKey: '••••••••••••••••'
    }
  });
  
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'features' | 'integrations' | 'payments'>('general');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // États pour les providers de paiement
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [providerForm, setProviderForm] = useState<PaymentProviderFormData>({
    provider_name: 'kkiapay',
    public_key: '',
    secret_key: '',
    private_key: '',
    is_active: true,
    is_sandbox: true,
    base_url: '',
    metadata: null,
  });
  const [platformMoneyInput, setPlatformMoneyInput] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulation de la sauvegarde - dans un vrai projet, on enverrait à l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      toast.success('Configuration sauvegardée', 'Les paramètres ont été enregistrés avec succès.');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur', 'Impossible de sauvegarder la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const resetMetadataFields = () => {
    setPlatformMoneyInput('');
  };

  const getFrontendBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  };

  const getGobipayRedirectUrls = () => {
    const base = getFrontendBaseUrl();
    const dashboard = `${base}/dashboard/student/courses`;
    const personalSpace = `${base}/dashboard/student`;
    return {
      success: `${personalSpace}?payment=success`,
      failed: `${dashboard}?payment=failed`,
      cancelled: `${dashboard}?payment=cancelled`,
      default: `${dashboard}`,
    };
  };

  const handleProviderSelectChange = (value: 'kkiapay' | 'fedapay' | 'gobipay') => {
    setProviderForm((prev) => ({
      ...prev,
      provider_name: value,
      base_url: value === 'gobipay' ? (prev.base_url || 'https://api-pay.gobiworld.com/api') : '',
    }));
    if (value !== 'gobipay') {
      resetMetadataFields();
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié', `${label} copié dans le presse-papiers`);
  };

  const getAutomaticBaseUrl = () => {
    if (providerForm.provider_name === 'kkiapay') {
      return providerForm.is_sandbox
        ? 'https://api-sandbox.kkiapay.me'
        : 'https://api.kkiapay.me';
    }
    if (providerForm.provider_name === 'fedapay') {
      return providerForm.is_sandbox
        ? 'https://sandbox-api.fedapay.com'
        : 'https://api.fedapay.com';
    }
    return providerForm.base_url || 'https://api-pay.gobiworld.com/api';
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Globe, color: 'from-blue-500 to-blue-600' },
    { id: 'email', label: 'Email', icon: Mail, color: 'from-purple-500 to-purple-600' },
    { id: 'security', label: 'Sécurité', icon: Shield, color: 'from-blue-600 to-indigo-600' },
    { id: 'features', label: 'Fonctionnalités', icon: Zap, color: 'from-green-500 to-green-600' },
    { id: 'integrations', label: 'Intégrations', icon: Server, color: 'from-orange-500 to-orange-600' },
    { id: 'payments', label: 'Paiements', icon: CreditCard, color: 'from-emerald-500 to-teal-600' }
  ];

  // Charger les providers de paiement
  useEffect(() => {
    if (activeTab === 'payments') {
      loadPaymentProviders();
    }
  }, [activeTab]);

  const loadPaymentProviders = async () => {
    setLoadingProviders(true);
    try {
      const providers = await getPaymentProviders();
      setPaymentProviders(providers);
    } catch (error: any) {
      console.error('Erreur lors du chargement des providers:', error);
      toast.error('Erreur', 'Impossible de charger les providers de paiement');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!providerForm.public_key || !providerForm.secret_key) {
      toast.error('Erreur', 'La clé publique et la clé secrète sont requises');
      return;
    }
    const isGobipay = providerForm.provider_name === 'gobipay';
    if (isGobipay && !providerForm.base_url?.trim()) {
      toast.error('Erreur', 'L’URL de base Gobipay est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const normalizedPlatformMoney = platformMoneyInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const metadataPayload: Record<string, any> = {};
      if (normalizedPlatformMoney.length) {
        metadataPayload.platform_money_list = normalizedPlatformMoney;
      }
      if (isGobipay) {
        metadataPayload.redirect_urls = getGobipayRedirectUrls();
      }
      const finalMetadata = Object.keys(metadataPayload).length ? metadataPayload : null;

      // Ne pas envoyer base_url, elle sera générée automatiquement côté backend
      const formData = {
        ...providerForm,
        base_url:
          providerForm.provider_name === 'gobipay'
            ? (providerForm.base_url?.trim() || 'https://api-pay.gobiworld.com/api')
            : undefined,
        metadata: finalMetadata,
      };
      
      if (editingProvider?.id) {
        await updatePaymentProvider(editingProvider.id, formData);
        toast.success('Succès', 'Provider mis à jour avec succès');
      } else {
        await createPaymentProvider(formData);
        toast.success('Succès', 'Provider créé avec succès');
      }
      setEditingProvider(null);
      setProviderForm({
        provider_name: 'kkiapay',
        public_key: '',
        secret_key: '',
        private_key: '',
        is_active: true,
        is_sandbox: true,
        base_url: '',
        metadata: null,
      });
      resetMetadataFields();
      await loadPaymentProviders();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur', error.message || 'Impossible de sauvegarder le provider');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce provider ?')) {
      return;
    }

    setLoading(true);
    try {
      await deletePaymentProvider(id);
      toast.success('Succès', 'Provider supprimé avec succès');
      await loadPaymentProviders();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur', 'Impossible de supprimer le provider');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProviderStatus = async (id: number) => {
    setLoading(true);
    try {
      await togglePaymentProviderStatus(id);
      toast.success('Succès', 'Statut du provider mis à jour');
      await loadPaymentProviders();
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur', 'Impossible de changer le statut du provider');
    } finally {
      setLoading(false);
    }
  };

  const startEditProvider = async (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setLoading(true);
    try {
      // Charger les clés complètes depuis le backend pour l'édition
      const { getPaymentProvider } = await import('../../../lib/services/adminPaymentConfigService');
      const fullProvider = await getPaymentProvider(provider.id!, true); // forEdit = true
      
      setProviderForm({
        provider_name: fullProvider.provider_name,
        public_key: fullProvider.public_key || '',
        secret_key: fullProvider.secret_key || '',
        private_key: fullProvider.private_key || '',
        is_active: fullProvider.is_active,
        is_sandbox: fullProvider.is_sandbox,
        base_url: fullProvider.base_url || '',
        metadata: fullProvider.metadata || null,
      });
      const metadata = fullProvider.metadata || {};
      const platformList = Array.isArray(metadata.platform_money_list)
        ? metadata.platform_money_list.join(', ')
        : '';
      setPlatformMoneyInput(platformList);
    } catch (error: any) {
      console.error('Erreur lors du chargement des clés complètes:', error);
      toast.error('Erreur', 'Impossible de charger les clés complètes pour l\'édition');
      // Fallback sur les données masquées si le chargement échoue
      setProviderForm({
        provider_name: provider.provider_name,
        public_key: '',
        secret_key: '',
        private_key: '',
        is_active: provider.is_active,
        is_sandbox: provider.is_sandbox,
        base_url: provider.base_url || '',
        metadata: null,
      });
      resetMetadataFields();
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingProvider(null);
    setProviderForm({
      provider_name: 'kkiapay',
      public_key: '',
      secret_key: '',
      private_key: '',
      is_active: true,
      is_sandbox: true,
      base_url: '',
      metadata: null,
    });
    resetMetadataFields();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* En-tête moderne */}
      <div className="relative bg-gradient-to-br from-mdsc-blue-dark via-[#0C3C5C] to-[#1a4d6b] rounded-xl p-8 text-white shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Configuration Système</h1>
            </div>
            <p className="text-white/90 text-base max-w-2xl">
              Gérez les paramètres de votre plateforme d'apprentissage et configurez les intégrations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="group relative bg-gradient-to-r from-mdsc-gold to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Message de sauvegarde */}
      {saved && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 shadow-md animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-semibold">Configuration sauvegardée avec succès !</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets moderne */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sticky top-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:scale-102'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8">
            {/* Onglet Général */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuration Générale</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Paramètres de base de votre plateforme</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nom du site
                    </label>
                    <input
                      type="text"
                      value={config.general.siteName}
                      onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-slate-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      URL du site
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={config.general.siteUrl}
                        onChange={(e) => handleConfigChange('general', 'siteUrl', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-slate-500 pr-10"
                      />
                      <button
                        onClick={() => copyToClipboard(config.general.siteUrl, 'URL')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                        title="Copier"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description du site
                    </label>
                    <textarea
                      value={config.general.siteDescription}
                      onChange={(e) => handleConfigChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Langue par défaut
                    </label>
                    <select
                      value={config.general.defaultLanguage}
                      onChange={(e) => handleConfigChange('general', 'defaultLanguage', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <select
                      value={config.general.timezone}
                      onChange={(e) => handleConfigChange('general', 'timezone', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    >
                      <option value="Africa/Abidjan">Afrique/Abidjan</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-start p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={config.general.maintenanceMode}
                        onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
                        className="mt-1 h-5 w-5 text-mdsc-gold focus:ring-mdsc-gold border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor="maintenanceMode" className="block text-sm font-semibold text-gray-900">
                          Mode maintenance
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Désactive l'accès public à la plateforme. Seuls les administrateurs pourront se connecter.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Email */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Configuration Email</h3>
                    <p className="text-sm text-gray-500">Paramètres SMTP pour l'envoi d'emails</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Serveur SMTP
                    </label>
                    <input
                      type="text"
                      value={config.email.smtpHost}
                      onChange={(e) => handleConfigChange('email', 'smtpHost', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Port SMTP
                    </label>
                    <input
                      type="number"
                      value={config.email.smtpPort}
                      onChange={(e) => handleConfigChange('email', 'smtpPort', parseInt(e.target.value) || 587)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom d'utilisateur SMTP
                    </label>
                    <input
                      type="email"
                      value={config.email.smtpUser}
                      onChange={(e) => handleConfigChange('email', 'smtpUser', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mot de passe SMTP
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.smtpPassword ? 'text' : 'password'}
                        value={config.email.smtpPassword}
                        onChange={(e) => handleConfigChange('email', 'smtpPassword', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('smtpPassword')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                      >
                        {showPasswords.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email expéditeur
                    </label>
                    <input
                      type="email"
                      value={config.email.fromEmail}
                      onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom expéditeur
                    </label>
                    <input
                      type="text"
                      value={config.email.fromName}
                      onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Configuration Sécurité</h3>
                    <p className="text-sm text-gray-500">Paramètres de sécurité et authentification</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Timeout de session (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tentatives de connexion max
                    </label>
                    <input
                      type="number"
                      value={config.security.maxLoginAttempts}
                      onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Longueur minimale du mot de passe
                    </label>
                    <input
                      type="number"
                      value={config.security.passwordMinLength}
                      onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value) || 8)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={config.security.requireEmailVerification}
                        onChange={(e) => handleConfigChange('security', 'requireEmailVerification', e.target.checked)}
                        className="mt-1 h-5 w-5 text-mdsc-blue-primary focus:ring-mdsc-blue-primary border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor="requireEmailVerification" className="block text-sm font-semibold text-gray-900">
                          Exiger la vérification email
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Les utilisateurs devront vérifier leur email avant de pouvoir utiliser la plateforme.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        checked={config.security.enableTwoFactor}
                        onChange={(e) => handleConfigChange('security', 'enableTwoFactor', e.target.checked)}
                        className="mt-1 h-5 w-5 text-mdsc-blue-primary focus:ring-mdsc-blue-primary border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor="enableTwoFactor" className="block text-sm font-semibold text-gray-900">
                          Activer l'authentification à deux facteurs (2FA)
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Ajoute une couche de sécurité supplémentaire avec un code de vérification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Fonctionnalités */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Fonctionnalités de la Plateforme</h3>
                    <p className="text-sm text-gray-500">Activez ou désactivez les fonctionnalités disponibles</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'enableGamification', label: 'Gamification', desc: 'Badges, points, niveaux', icon: Award, color: 'from-yellow-500 to-amber-600' },
                    { key: 'enableChatIA', label: 'Chat IA', desc: 'Assistant intelligent', icon: Brain, color: 'from-purple-500 to-indigo-600' },
                    { key: 'enableCertificates', label: 'Attestations', desc: 'Attestations de complétion', icon: Award, color: 'from-blue-500 to-blue-600' },
                    { key: 'enableAnalytics', label: 'Analytics', desc: 'Statistiques et rapports', icon: Users, color: 'from-green-500 to-emerald-600' },
                    { key: 'enableNotifications', label: 'Notifications', desc: 'Alertes et notifications', icon: Bell, color: 'from-orange-500 to-red-600' },
                  ].map((feature) => {
                    const Icon = feature.icon;
                    const isEnabled = config.features[feature.key as keyof typeof config.features] as boolean;
                    return (
                      <div
                        key={feature.key}
                        className={`group relative p-5 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                          isEnabled
                            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => handleConfigChange('features', feature.key, !isEnabled)}
                      >
                        <div className="flex items-start">
                          <div className={`p-3 rounded-lg ${isEnabled ? `bg-gradient-to-br ${feature.color}` : 'bg-gray-100'} transition-all duration-200`}>
                            <Icon className={`h-5 w-5 ${isEnabled ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-gray-900 cursor-pointer">
                                {feature.label}
                              </label>
                              <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                isEnabled ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Onglet Intégrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <Server className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Intégrations Externes</h3>
                    <p className="text-sm text-gray-500">Connectez votre plateforme à des services externes</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Moodle */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-gray-900">Moodle LMS</h4>
                          <p className="text-xs text-gray-500">Intégration avec Moodle Learning Management System</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.integrations.moodleUrl, 'URL Moodle')}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Copier l'URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          URL Moodle
                        </label>
                        <input
                          type="url"
                          value={config.integrations.moodleUrl}
                          onChange={(e) => handleConfigChange('integrations', 'moodleUrl', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Token API
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.moodleToken ? 'text' : 'password'}
                            value={config.integrations.moodleToken}
                            onChange={(e) => handleConfigChange('integrations', 'moodleToken', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('moodleToken')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                          >
                            {showPasswords.moodleToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OpenAI */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-gray-900">OpenAI API</h4>
                          <p className="text-xs text-gray-500">Intégration avec OpenAI pour l'assistant IA</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Clé API OpenAI
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.openaiApiKey ? 'text' : 'password'}
                          value={config.integrations.openaiApiKey}
                          onChange={(e) => handleConfigChange('integrations', 'openaiApiKey', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('openaiApiKey')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                        >
                          {showPasswords.openaiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MinIO */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                          <Database className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-gray-900">MinIO Storage</h4>
                          <p className="text-xs text-gray-500">Stockage d'objets pour les médias et fichiers</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Endpoint
                        </label>
                        <input
                          type="url"
                          value={config.integrations.minioEndpoint}
                          onChange={(e) => handleConfigChange('integrations', 'minioEndpoint', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Access Key
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.minioAccessKey ? 'text' : 'password'}
                            value={config.integrations.minioAccessKey}
                            onChange={(e) => handleConfigChange('integrations', 'minioAccessKey', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('minioAccessKey')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                          >
                            {showPasswords.minioAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Secret Key
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.minioSecretKey ? 'text' : 'password'}
                            value={config.integrations.minioSecretKey}
                            onChange={(e) => handleConfigChange('integrations', 'minioSecretKey', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('minioSecretKey')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                          >
                            {showPasswords.minioSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Paiements */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Configuration des Paiements</h3>
                    <p className="text-sm text-gray-500">Gérez les providers de paiement (Kkiapay, Fedapay, Gobipay)</p>
                  </div>
                </div>

                {loadingProviders ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-mdsc-blue-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Liste des providers existants */}
                    {paymentProviders.length > 0 && paymentProviders.map((provider) => {
                      const isKkiapayProvider = provider.provider_name === 'kkiapay';
                      const isFedapayProvider = provider.provider_name === 'fedapay';
                      const isGobipayProvider = provider.provider_name === 'gobipay';
                      const badgeGradient = provider.is_active
                        ? isKkiapayProvider
                          ? 'bg-gradient-to-br from-[#3B7C8A] to-[#2d5f6a]'
                          : isFedapayProvider
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : isGobipayProvider
                          ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gray-300';
                      return (
                      <div
                        key={provider.id}
                        className="border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${badgeGradient}`}>
                              <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-md font-bold text-gray-900 uppercase">
                                  {provider.provider_name}
                                </h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    provider.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {provider.is_active ? 'Actif' : 'Inactif'}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    provider.is_sandbox
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {provider.is_sandbox ? 'Sandbox' : 'Live'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate max-w-xs" title={provider.public_key || 'Non configurée'}>
                                Clé publique: <span className="font-mono text-xs">{provider.public_key || 'Non configurée'}</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs" title={provider.secret_key || 'Non configurée'}>
                                Clé secrète: <span className="font-mono text-xs">{provider.secret_key || 'Non configurée'}</span>
                              </p>
                              {isGobipayProvider && provider.base_url && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs" title={provider.base_url}>
                                  Base URL: <span className="font-mono text-xs">{provider.base_url}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleProviderStatus(provider.id!)}
                              className={`p-2 rounded-lg transition-colors ${
                                provider.is_active
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={provider.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {provider.is_active ? (
                                <PowerOff className="h-5 w-5" />
                              ) : (
                                <Power className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => startEditProvider(provider)}
                              className="p-2 text-mdsc-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(provider.id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}

                    {/* Formulaire d'ajout/édition */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-bold text-gray-900">
                          {editingProvider ? 'Modifier le provider' : 'Ajouter un nouveau provider'}
                        </h4>
                        {editingProvider && (
                          <button
                            onClick={cancelEdit}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Provider
                          </label>
                          <select
                            value={providerForm.provider_name}
                            onChange={(e) =>
                              handleProviderSelectChange(e.target.value as 'kkiapay' | 'fedapay' | 'gobipay')
                            }
                            disabled={!!editingProvider}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 disabled:bg-gray-100"
                          >
                            <option value="kkiapay">Kkiapay</option>
                            <option value="fedapay">Fedapay</option>
                            <option value="gobipay">Gobipay</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mode
                          </label>
                          <select
                            value={providerForm.is_sandbox ? 'sandbox' : 'live'}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                is_sandbox: e.target.value === 'sandbox',
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                          >
                            <option value="sandbox">Sandbox (Test)</option>
                            <option value="live">Live (Production)</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Clé publique
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords[`public_${editingProvider?.id || 'new'}`] ? 'text' : 'password'}
                              value={providerForm.public_key}
                              onChange={(e) =>
                                setProviderForm({ ...providerForm, public_key: e.target.value })
                              }
                              placeholder={editingProvider ? 'Laissez vide pour ne pas modifier' : 'Entrez la clé publique'}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility(`public_${editingProvider?.id || 'new'}`)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                            >
                              {showPasswords[`public_${editingProvider?.id || 'new'}`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Clé secrète
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords[`secret_${editingProvider?.id || 'new'}`] ? 'text' : 'password'}
                              value={providerForm.secret_key}
                              onChange={(e) =>
                                setProviderForm({ ...providerForm, secret_key: e.target.value })
                              }
                              placeholder={editingProvider ? 'Laissez vide pour ne pas modifier' : 'Entrez la clé secrète'}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility(`secret_${editingProvider?.id || 'new'}`)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                            >
                              {showPasswords[`secret_${editingProvider?.id || 'new'}`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Clé privée (optionnelle)
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords[`private_${editingProvider?.id || 'new'}`] ? 'text' : 'password'}
                              value={providerForm.private_key || ''}
                              onChange={(e) =>
                                setProviderForm({ ...providerForm, private_key: e.target.value })
                              }
                              placeholder={editingProvider ? 'Laissez vide pour ne pas modifier' : 'Entrez la clé privée (optionnel)'}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400 pr-10 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility(`private_${editingProvider?.id || 'new'}`)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-mdsc-blue-primary transition-colors"
                            >
                              {showPasswords[`private_${editingProvider?.id || 'new'}`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            URL de base {providerForm.provider_name === 'gobipay' ? '(obligatoire)' : '(générée automatiquement)'}
                          </label>
                          {providerForm.provider_name === 'gobipay' ? (
                            <input
                              type="url"
                              value={providerForm.base_url || ''}
                              onChange={(e) =>
                                setProviderForm({
                                  ...providerForm,
                                  base_url: e.target.value,
                                })
                              }
                              placeholder="https://api-pay.gobiworld.com/api"
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                            />
                          ) : (
                            <input
                              type="url"
                              value={getAutomaticBaseUrl()}
                              readOnly
                              disabled
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {providerForm.provider_name === 'gobipay'
                              ? 'Entrez l’URL de l’API Gobipay fournie par l’équipe technique.'
                              : "Cette URL est générée automatiquement selon le provider et l'environnement sélectionnés."}
                          </p>
                        </div>

                        {providerForm.provider_name === 'gobipay' && (
                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Plateformes Mobile Money autorisées
                              </label>
                              <input
                                type="text"
                                value={platformMoneyInput}
                                onChange={(e) => setPlatformMoneyInput(e.target.value)}
                                placeholder="Ex: MTN_BEN_XOF, MOOV_BEN_XOF"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-mdsc-blue-primary focus:ring-2 focus:ring-mdsc-blue-primary/20 transition-all duration-200 bg-white hover:border-gray-400"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Séparez chaque portefeuille par une virgule. Par défaut : MTN_BEN_XOF.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <div className="flex items-start p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                            <input
                              type="checkbox"
                              id="providerActive"
                              checked={providerForm.is_active}
                              onChange={(e) =>
                                setProviderForm({ ...providerForm, is_active: e.target.checked })
                              }
                              className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <label htmlFor="providerActive" className="block text-sm font-semibold text-gray-900">
                                Activer ce provider
                              </label>
                              <p className="text-xs text-gray-600 mt-1">
                                Les providers actifs seront disponibles pour les paiements.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                          <button
                            onClick={handleSaveProvider}
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Sauvegarde...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                {editingProvider ? 'Mettre à jour' : 'Créer'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
