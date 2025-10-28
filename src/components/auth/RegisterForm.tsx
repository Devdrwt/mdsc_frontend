'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import EmailVerification from './EmailVerification';
import { register, ApiError } from '../../lib/services/authService';
import { countries } from '../../lib/constants/countries';
import { Mail, Lock, User, Building, Phone, MapPin, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization: string;
  phone?: string;
  city?: string;
  country: string;
  acceptTerms: boolean;
}

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    city: '',
    country: 'AF', // Afghanistan (premier pays alphabétiquement)
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      return 'Tous les champs obligatoires doivent être remplis.';
    }

    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }

    if (!formData.acceptTerms) {
      return 'Vous devez accepter les conditions d\'utilisation.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Appel à l'API d'inscription (seulement les champs requis par le backend)
      const response = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (response.success) {
        // Montrer la page de vérification d'email
        setShowEmailVerification(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Gérer les erreurs de validation de l'API
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
      console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    // TODO: Intégrer avec l'API pour renvoyer l'email de vérification
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleEmailVerified = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/login?verified=true');
    }, 3000);
  };

  const handleBackToRegistration = () => {
    setShowEmailVerification(false);
    setError(null);
  };

  // Afficher la vérification email si nécessaire
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={formData.email}
        onResendEmail={handleResendEmail}
        onBack={handleBackToRegistration}
        onVerified={handleEmailVerified}
      />
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-mdsc text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Email vérifié avec succès !
          </h2>
          <p className="text-gray-700 mb-6">
            Votre compte est maintenant activé. Vous allez être redirigé vers la page de connexion.
          </p>
          <Button onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card-mdsc">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-mdsc-blue mb-2">
            Créer un compte
          </h2>
          <p className="text-gray-700">
            Rejoignez la communauté MdSC
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600 border border-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-white text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                  placeholder="Jean"
                />
              </div>
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
                placeholder="Kouassi"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-700" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="jean.kouassi@organisation.ci"
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
                placeholder="+225 XX XX XX XX"
              />
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-700" />
              </div>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="Abidjan"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Pays *
            </label>
            <select
              id="country"
              name="country"
              required
              value={formData.country}
              onChange={handleInputChange}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="••••••••"
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
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue focus:border-transparent"
                placeholder="••••••••"
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

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-mdsc-blue focus:ring-mdsc-blue border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="acceptTerms" className="text-gray-700">
                J'accepte les{' '}
                <a href="/terms" className="font-medium text-mdsc-blue hover:bg-white/20 hover:text-mdsc-blue px-1 py-0.5 rounded transition-colors">
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="/privacy" className="font-medium text-mdsc-blue hover:bg-white/20 hover:text-mdsc-blue px-1 py-0.5 rounded transition-colors">
                  politique de confidentialité
                </a>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Création du compte...' : 'Créer mon compte'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-medium text-mdsc-blue hover:bg-white/20 hover:text-mdsc-blue px-2 py-1 rounded transition-colors">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
