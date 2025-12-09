'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import EmailVerification from './EmailVerification';
import { register, ApiError } from '../../lib/services/authService';
import { countries } from '../../lib/constants/countries';
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  // Étape 1 - Informations personnelles
  npi: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  organization: string;
  country: string;
  
  // Étape 2 - Mot de passe
  password: string;
  confirmPassword: string;
  
  // Étape 3 - Documents (optionnel pour l'instant)
  documents: File[];
  
  // Acceptation des conditions
  acceptTerms: boolean;
}

const MultiStepRegisterForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    npi: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    country: 'AF', // Afghanistan par défaut
    password: '',
    confirmPassword: '',
    documents: [],
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = (): string | null => {
    if (!formData.npi || !formData.email || !formData.firstName || !formData.lastName || !formData.country) {
      return 'Tous les champs obligatoires doivent être remplis.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Veuillez entrer un email valide.';
    }
    return null;
  };

  const isStep1Valid = (): boolean => {
    return !!(formData.npi && formData.email && formData.firstName && formData.lastName && formData.country && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email));
  };

  const isStep2Valid = (): boolean => {
    return !!(formData.password && formData.confirmPassword && formData.password.length >= 8 && formData.password === formData.confirmPassword);
  };

  const isStep3Valid = (): boolean => {
    return true; // L'étape 3 (documents) est optionnelle
  };

  const validateStep2 = (): string | null => {
    if (!formData.password || !formData.confirmPassword) {
      return 'Tous les champs obligatoires doivent être remplis.';
    }
    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  };

  const nextStep = () => {
    setError(null);
    
    if (currentStep === 1) {
      const validationError = validateStep1();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (currentStep === 2) {
      const validationError = validateStep2();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validation de l'acceptation des conditions
    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation et la politique de confidentialité pour créer un compte.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Appel à l'API d'inscription avec tous les champs
      const response = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        npi: formData.npi,
        phone: formData.phone,
        organization: formData.organization,
        country: formData.country,
        acceptTerms: formData.acceptTerms
      });

      if (response.success) {
        // Montrer la page de vérification d'email
        setShowEmailVerification(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors && err.errors.length > 0) {
          const errorMessages = err.errors.map(e => `${e.field}: ${e.message}`).join('\n');
          setError(errorMessages);
        } else {
          setError(err.message);
        }
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    // TODO: Intégrer avec l'API pour renvoyer l'email de vérification
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleEmailVerified = () => {
    router.push('/login?verified=true');
  };

  const handleBack = () => {
    setShowEmailVerification(false);
  };

  const getProgressPercentage = () => {
    let completedSteps = 0;
    if (currentStep > 1 || isStep1Valid()) completedSteps++;
    if (currentStep > 2 || isStep2Valid()) completedSteps++;
    if (currentStep > 3 || isStep3Valid()) completedSteps++;
    return (completedSteps / 3) * 100;
  };

  if (showEmailVerification) {
    return (
      <EmailVerification
        email={formData.email}
        onResendEmail={handleResendEmail}
        onBack={handleBack}
        onVerified={handleEmailVerified}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-mdsc">
        {/* En-tête avec logo et titre */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img
              src="/mdsc-logo.png"
              alt="Maison de la Société Civile"
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-mdsc-blue mb-2">
            Créer votre compte
          </h1>
          <p className="text-gray-700">
            Rejoignez la communauté de la Maison de la Société Civile et commencez votre apprentissage
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Étape {currentStep} sur 3
            </span>
            <span className="text-sm font-medium text-mdsc-blue">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-mdsc-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {/* Étape 1 - Informations personnelles */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="npi" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro Personnel d'Identification (NPI) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-700" />
                  </div>
                  <input
                    id="npi"
                    name="npi"
                    type="text"
                    required
                    value={formData.npi}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                    placeholder="Ex: 123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-700" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="+123 456 789 000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Organisation (optionnel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Nom de votre organisation"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-700" />
                </div>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 - Mot de passe */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Choisissez un mot de passe sécurisé"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-700" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Minimum 8 caractères, incluant majuscules, minuscules et chiffres
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Retapez votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Information de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Sécurité de votre compte</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-blue-800">Connexion sécurisée via SSO Keycloak</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-blue-800">Vos données sont protégées et cryptées</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 - Pièces justificatives */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pièces justificatives</h3>
              
              {/* Zone de dépôt */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Déposez vos fichiers ici</p>
                <p className="text-sm text-gray-600 mb-4">ou cliquez pour parcourir</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Parcourir les fichiers
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés : PDF, JPG, PNG (Max 5 MB)
                </p>
              </div>

              {/* Liste des fichiers */}
              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  {formData.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-900">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <span className="sr-only">Supprimer</span>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents requis */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Documents requis :</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Copie de la carte d'identité ou passeport</li>
                  <li>• Justificatif de domicile (facultatif)</li>
                  <li>• Diplômes (si applicable)</li>
                </ul>
              </div>

              {/* Acceptation des conditions */}
              <div className="mt-6 flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-mdsc-blue focus:ring-mdsc-blue border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-gray-700 cursor-pointer">
                    J'accepte les{' '}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-mdsc-blue hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Conditions d'utilisation
                    </a>
                    {' '}et la{' '}
                    <a 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-mdsc-blue hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Politique de confidentialité
                    </a>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex justify-between items-center mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Retour</span>
              </Button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                className="flex items-center space-x-2"
              >
                <span>Continuer</span>
                <span>→</span>
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Créer mon compte</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lien de connexion */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-medium text-mdsc-blue hover:text-blue-700">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiStepRegisterForm;
