'use client';

import React, { useState } from 'react';
import EmailVerification from './EmailVerification';
import { register, ApiError } from '../../lib/services/authService';
import { countries } from '../../lib/constants/countries';
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, GraduationCap, ShieldAlert } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';
import { useNotification } from '../../lib/hooks/useNotification';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  organization: string;
  country: string;
  password: string;
  confirmPassword: string;
}

const SimpleRegisterForm = () => {
  const { error: showError, success: showSuccess } = useNotification();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    country: 'BJ', // Bénin par défaut
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
    width: string;
  }>({
    score: 0,
    label: '',
    color: '',
    width: '0%'
  });

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (!password) {
      return { score: 0, label: '', color: '', width: '0%' };
    }
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1; // Caractères spéciaux
    
    // Déterminer le niveau
    let label = '';
    let color = '';
    let width = '0%';
    
    if (score <= 2) {
      label = 'Faible';
      color = 'bg-red-500';
      width = '33%';
    } else if (score <= 4) {
      label = 'Moyen';
      color = 'bg-yellow-500';
      width = '66%';
    } else {
      label = 'Fort';
      color = 'bg-green-500';
      width = '100%';
    }
    
    return { score, label, color, width };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculer la robustesse du mot de passe
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Effacer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validation email
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Validation prénom
    if (!formData.firstName) {
      errors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation nom
    if (!formData.lastName) {
      errors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation téléphone (optionnel mais si rempli, validation)
    if (formData.phone && formData.phone.length < 8) {
      errors.phone = 'Le numéro de téléphone doit contenir au moins 8 chiffres';
    }

    // Validation pays
    if (!formData.country) {
      errors.country = 'Le pays est requis';
    }

    // Validation mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        organization: formData.organization || undefined,
        country: formData.country,
        role: 'student'
      });

      // Récupérer le token de vérification en mode dev
      if (response.data && response.data.verificationToken) {
        setVerificationToken(response.data.verificationToken);
      }

      showSuccess('Inscription réussie', 'Veuillez vérifier votre email pour activer votre compte');
      setShowEmailVerification(true);
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.errors && Array.isArray(apiError.errors)) {
        const newFieldErrors: Record<string, string> = {};
        apiError.errors.forEach((error: { field: string; message: string }) => {
          newFieldErrors[error.field] = error.message;
        });
        setFieldErrors(newFieldErrors);
        showError('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      } else {
        showError('Erreur d\'inscription', apiError.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailVerification) {
    return <EmailVerification email={formData.email} verificationToken={verificationToken} />;
  }

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Créer un compte
        </h2>
        <p className="text-gray-600 text-base">
          Rejoignez la communauté de la Maison de la Société Civile et commencez votre parcours d'apprentissage
        </p>
      </div>

      {/* Badge d'information */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 rounded-full text-sm font-semibold border border-teal-200/50 shadow-sm">
          <GraduationCap className="h-4 w-4 mr-2" />
          Créez votre accès MdSC
        </div>
        <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldAlert className="h-4 w-4 text-gray-400" />
          Les privilèges avancés sont attribués après validation par l'équipe MdSC.
        </p>
      </div>

      {/* Formulaire */}
      <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section : Informations Personnelles */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Prénom */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                      fieldErrors.firstName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Votre prénom"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{fieldErrors.firstName}</p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                      fieldErrors.lastName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Votre nom"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{fieldErrors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="votre.email@exemple.com"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                        fieldErrors.phone ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section : Informations Professionnelles */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <Building className="h-5 w-5 text-cyan-600" />
                </div>
                Informations Professionnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Organisation */}
                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-2">
                    Organisation
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900"
                    placeholder="Nom de votre organisation"
                  />
                </div>

                {/* Pays */}
                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 ${
                        fieldErrors.country ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.country && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{fieldErrors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section : Sécurité */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Lock className="h-5 w-5 text-purple-600" />
                </div>
                Sécurité
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mot de passe */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-teal-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Indicateur de robustesse */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Robustesse du mot de passe :</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-600' :
                          passwordStrength.score <= 4 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        ></div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs">
                          <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                            {formData.password.length >= 8 ? '✓' : '○'}
                          </span>
                          <span className={formData.password.length >= 8 ? 'text-gray-700' : 'text-gray-500'}>
                            Au moins 8 caractères
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className={`mr-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            {/[a-z]/.test(formData.password) ? '✓' : '○'}
                          </span>
                          <span className={/[a-z]/.test(formData.password) ? 'text-gray-700' : 'text-gray-500'}>
                            Une lettre minuscule
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className={`mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                          </span>
                          <span className={/[A-Z]/.test(formData.password) ? 'text-gray-700' : 'text-gray-500'}>
                            Une lettre majuscule
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className={`mr-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            {/\d/.test(formData.password) ? '✓' : '○'}
                          </span>
                          <span className={/\d/.test(formData.password) ? 'text-gray-700' : 'text-gray-500'}>
                            Un chiffre
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className={`mr-2 ${/[^a-zA-Z\d]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            {/[^a-zA-Z\d]/.test(formData.password) ? '✓' : '○'}
                          </span>
                          <span className={/[^a-zA-Z\d]/.test(formData.password) ? 'text-gray-700' : 'text-gray-500'}>
                            Un caractère spécial (recommandé)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400 text-gray-900 ${
                        fieldErrors.confirmPassword ? 'border-red-500' : 
                        formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' :
                        'border-gray-200'
                      }`}
                      placeholder="Confirmer votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-teal-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Indicateur de correspondance */}
                  {formData.confirmPassword && (
                    <div className="mt-2">
                      {formData.password === formData.confirmPassword ? (
                        <div className="flex items-center text-xs text-green-600">
                          <span className="mr-2">✓</span>
                          <span>Les mots de passe correspondent</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-red-600">
                          <span className="mr-2">✗</span>
                          <span>Les mots de passe ne correspondent pas</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3.5 px-4 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inscription en cours...
                  </span>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </div>

            {/* Séparateur "Ou" */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Ou continuer avec</span>
              </div>
            </div>

            {/* Bouton Google */}
            <div>
            <GoogleLoginButton 
              onError={(err) => showError('Erreur Google', err)}
            />
            </div>

            {/* Lien vers la connexion */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <a href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors inline-flex items-center gap-1">
                  Se connecter
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Note de sécurité */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <a href="/terms" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
              Conditions d'utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
              Politique de confidentialité
            </a>
          </p>
        </div>
    </div>
  );
};

export default SimpleRegisterForm;

