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
  Download
} from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'features' | 'integrations'>('general');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulation de la sauvegarde - dans un vrai projet, on enverrait à l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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

  const tabs = [
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'features', label: 'Fonctionnalités', icon: Settings },
    { id: 'integrations', label: 'Intégrations', icon: Server }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-mdsc-blue-dark to-gray-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configuration Système ⚙️</h1>
            <p className="text-gray-300">
              Gérez les paramètres de votre plateforme d'apprentissage et configurez les intégrations.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-mdsc-gold hover:bg-yellow-600 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message de sauvegarde */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Configuration sauvegardée avec succès !</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-mdsc-blue-dark text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Onglet Général */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
                  Configuration Générale
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du site
                    </label>
                    <input
                      type="text"
                      value={config.general.siteName}
                      onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL du site
                    </label>
                    <input
                      type="url"
                      value={config.general.siteUrl}
                      onChange={(e) => handleConfigChange('general', 'siteUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du site
                    </label>
                    <textarea
                      value={config.general.siteDescription}
                      onChange={(e) => handleConfigChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue par défaut
                    </label>
                    <select
                      value={config.general.defaultLanguage}
                      onChange={(e) => handleConfigChange('general', 'defaultLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <select
                      value={config.general.timezone}
                      onChange={(e) => handleConfigChange('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    >
                      <option value="Africa/Abidjan">Afrique/Abidjan</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={config.general.maintenanceMode}
                        onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                        Mode maintenance (désactive l'accès public)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Email */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
                  Configuration Email
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serveur SMTP
                    </label>
                    <input
                      type="text"
                      value={config.email.smtpHost}
                      onChange={(e) => handleConfigChange('email', 'smtpHost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port SMTP
                    </label>
                    <input
                      type="number"
                      value={config.email.smtpPort}
                      onChange={(e) => handleConfigChange('email', 'smtpPort', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d'utilisateur SMTP
                    </label>
                    <input
                      type="email"
                      value={config.email.smtpUser}
                      onChange={(e) => handleConfigChange('email', 'smtpUser', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe SMTP
                    </label>
                    <input
                      type="password"
                      value={config.email.smtpPassword}
                      onChange={(e) => handleConfigChange('email', 'smtpPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email expéditeur
                    </label>
                    <input
                      type="email"
                      value={config.email.fromEmail}
                      onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom expéditeur
                    </label>
                    <input
                      type="text"
                      value={config.email.fromName}
                      onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
                  Configuration Sécurité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout de session (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tentatives de connexion max
                    </label>
                    <input
                      type="number"
                      value={config.security.maxLoginAttempts}
                      onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longueur minimale du mot de passe
                    </label>
                    <input
                      type="number"
                      value={config.security.passwordMinLength}
                      onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={config.security.requireEmailVerification}
                        onChange={(e) => handleConfigChange('security', 'requireEmailVerification', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
                        Exiger la vérification email
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        checked={config.security.enableTwoFactor}
                        onChange={(e) => handleConfigChange('security', 'enableTwoFactor', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <label htmlFor="enableTwoFactor" className="ml-2 block text-sm text-gray-700">
                        Activer l'authentification à deux facteurs
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Fonctionnalités */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
                  Fonctionnalités de la Plateforme
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableGamification"
                        checked={config.features.enableGamification}
                        onChange={(e) => handleConfigChange('features', 'enableGamification', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor="enableGamification" className="text-sm font-medium text-gray-700">
                          Gamification
                        </label>
                        <p className="text-xs text-gray-500">Badges, points, niveaux</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableChatIA"
                        checked={config.features.enableChatIA}
                        onChange={(e) => handleConfigChange('features', 'enableChatIA', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor="enableChatIA" className="text-sm font-medium text-gray-700">
                          Chat IA
                        </label>
                        <p className="text-xs text-gray-500">Assistant intelligent</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableCertificates"
                        checked={config.features.enableCertificates}
                        onChange={(e) => handleConfigChange('features', 'enableCertificates', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor="enableCertificates" className="text-sm font-medium text-gray-700">
                          Certificats
                        </label>
                        <p className="text-xs text-gray-500">Certificats de complétion</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableAnalytics"
                        checked={config.features.enableAnalytics}
                        onChange={(e) => handleConfigChange('features', 'enableAnalytics', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor="enableAnalytics" className="text-sm font-medium text-gray-700">
                          Analytics
                        </label>
                        <p className="text-xs text-gray-500">Statistiques et rapports</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableNotifications"
                        checked={config.features.enableNotifications}
                        onChange={(e) => handleConfigChange('features', 'enableNotifications', e.target.checked)}
                        className="h-4 w-4 text-mdsc-blue-dark focus:ring-mdsc-blue-dark border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700">
                          Notifications
                        </label>
                        <p className="text-xs text-gray-500">Alertes et notifications</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Intégrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Server className="h-5 w-5 mr-2 text-mdsc-blue-dark" />
                  Intégrations Externes
                </h3>
                
                <div className="space-y-6">
                  {/* Moodle */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                      Moodle LMS
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL Moodle
                        </label>
                        <input
                          type="url"
                          value={config.integrations.moodleUrl}
                          onChange={(e) => handleConfigChange('integrations', 'moodleUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Token API
                        </label>
                        <input
                          type="password"
                          value={config.integrations.moodleToken}
                          onChange={(e) => handleConfigChange('integrations', 'moodleToken', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OpenAI */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      OpenAI API
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clé API OpenAI
                      </label>
                      <input
                        type="password"
                        value={config.integrations.openaiApiKey}
                        onChange={(e) => handleConfigChange('integrations', 'openaiApiKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* MinIO */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Database className="h-5 w-5 mr-2 text-blue-600" />
                      MinIO Storage
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endpoint
                        </label>
                        <input
                          type="url"
                          value={config.integrations.minioEndpoint}
                          onChange={(e) => handleConfigChange('integrations', 'minioEndpoint', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Access Key
                        </label>
                        <input
                          type="password"
                          value={config.integrations.minioAccessKey}
                          onChange={(e) => handleConfigChange('integrations', 'minioAccessKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secret Key
                        </label>
                        <input
                          type="password"
                          value={config.integrations.minioSecretKey}
                          onChange={(e) => handleConfigChange('integrations', 'minioSecretKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
