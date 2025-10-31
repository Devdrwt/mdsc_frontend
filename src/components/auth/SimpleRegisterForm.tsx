'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import EmailVerification from './EmailVerification';
import { register, ApiError } from '../../lib/services/authService';
import { countries } from '../../lib/constants/countries';
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, GraduationCap, Users } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';

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
  const router = useRouter();
  
  // Récupérer le rôle sélectionné depuis sessionStorage
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor'>('student');
  
  React.useEffect(() => {
    const role = sessionStorage.getItem('selectedRole') as 'student' | 'instructor' | null;
    if (role) {
      setSelectedRole(role);
    } else {
      // Si aucun rôle n'est sélectionné, rediriger vers la page de sélection
      router.push('/select-role');
    }
  }, [router]);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    country: 'CI', // Côte d'Ivoire par défaut
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
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
        role: selectedRole
      });

      // Récupérer le token de vérification en mode dev
      if (response.data && response.data.verificationToken) {
        setVerificationToken(response.data.verificationToken);
      }

      setShowEmailVerification(true);
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.errors && Array.isArray(apiError.errors)) {
        const newFieldErrors: Record<string, string> = {};
        apiError.errors.forEach((error: { field: string; message: string }) => {
          newFieldErrors[error.field] = error.message;
        });
        setFieldErrors(newFieldErrors);
        setError('Veuillez corriger les erreurs dans le formulaire');
      } else {
        setError(apiError.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailVerification) {
    return <EmailVerification email={formData.email} verificationToken={verificationToken} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-orange-200 transition-colors"
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="h-5 w-5 text-mdsc-blue-dark" />
            </button>
            <h2 className="text-3xl font-bold text-mdsc-blue-dark">
              Créer un compte
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez la communauté MdSC et commencez votre parcours d'apprentissage
          </p>
        </div>

        {/* Badge du rôle sélectionné */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {selectedRole === 'student' ? (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Inscription en tant qu'Apprenant
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Inscription en tant que Formateur
              </>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message d'erreur global */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Section : Informations Personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prénom */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                      fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Votre prénom"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.firstName}</p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                      fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Votre nom"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="votre.email@exemple.com"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                        fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section : Informations Professionnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Informations Professionnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organisation */}
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organisation
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Nom de votre organisation"
                  />
                </div>

                {/* Pays */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                        fieldErrors.country ? 'border-red-500' : 'border-gray-300'
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
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section : Sécurité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
                Sécurité
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mot de passe */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent ${
                        fieldErrors.confirmPassword ? 'border-red-500' : 
                        formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' :
                        'border-gray-300'
                      }`}
                      placeholder="Confirmer votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inscription en cours...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </div>

            {/* Séparateur "Ou" */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-700">Ou</span>
              </div>
            </div>

            {/* Bouton Google */}
            <div>
              <GoogleLoginButton 
                onError={(err) => setError(err)}
              /> 
            </div>

            {/* Lien vers la connexion */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <a href="/login" className="font-medium text-mdsc-blue-dark hover:text-mdsc-blue-primary">
                  Se connecter
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Note de sécurité */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <a href="/terms" className="text-mdsc-blue-dark hover:underline">
              Conditions d'utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" className="text-mdsc-blue-dark hover:underline">
              Politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleRegisterForm;

