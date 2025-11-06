'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Users, BookOpen, Award, TrendingUp, MessageSquare, ArrowRight, Home, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | null>(null);
  const [fromGoogle, setFromGoogle] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur vient de Google
    const from = searchParams?.get('from');
    const msg = searchParams?.get('message');
    if (from === 'google') {
      setFromGoogle(true);
      if (msg) {
        setMessage(decodeURIComponent(msg));
      }
    }
    
    // Récupérer le rôle déjà sélectionné si disponible
    const storedRole = sessionStorage.getItem('selectedRole');
    if (storedRole === 'student' || storedRole === 'instructor') {
      setSelectedRole(storedRole);
    }
  }, [searchParams]);

  const handleRoleSelection = (role: 'student' | 'instructor') => {
    // Stocker le rôle sélectionné dans sessionStorage
    sessionStorage.setItem('selectedRole', role);
    setSelectedRole(role);
    
    // Si l'utilisateur vient de Google, ne pas rediriger vers /register
    // Il pourra utiliser le bouton "Continuer avec Google"
    if (!fromGoogle) {
      router.push('/register');
    }
  };

  const roles = [
    {
      type: 'student' as const,
      title: 'Apprenant',
      subtitle: 'Je souhaite suivre des formations',
      icon: GraduationCap,
      description: 'Accédez à des formations certifiantes pour développer vos compétences et celles de votre organisation.',
      features: [
        { icon: BookOpen, text: 'Accès à tous les cours' },
        { icon: Award, text: 'Certifications reconnues' },
        { icon: MessageSquare, text: 'Assistant IA personnel' },
        { icon: TrendingUp, text: 'Suivi de progression' }
      ],
      color: 'blue',
      bgColor: '#006095',
      bgGradient: 'from-[#006095] to-[#004a75]',
      bgLight: 'bg-[#E6F2F8]',
      textColor: 'text-[#006095]',
      borderColor: 'border-[#006095]/20',
      hoverBorder: 'hover:border-[#006095]'
    },
    {
      type: 'instructor' as const,
      title: 'Formateur',
      subtitle: 'Je souhaite créer et animer des formations',
      icon: Users,
      description: 'Partagez votre expertise et accompagnez les apprenants dans leur développement professionnel.',
      features: [
        { icon: BookOpen, text: 'Création de cours' },
        { icon: Users, text: 'Gestion des apprenants' },
        { icon: MessageSquare, text: 'Support IA pour formateurs' },
        { icon: Award, text: 'Évaluation et certification' }
      ],
      color: 'orange',
      bgColor: '#F4A53A',
      bgGradient: 'from-[#F4A53A] to-[#E08E1F]',
      bgLight: 'bg-[#FEF5E7]',
      textColor: 'text-[#F4A53A]',
      borderColor: 'border-[#F4A53A]/20',
      hoverBorder: 'hover:border-[#F4A53A]'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Bouton retour à l'accueil */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm"
        >
          <Home className="h-5 w-5 mr-2" />
          Retour à l'accueil
        </button>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center text-sm mb-2">
            <a href="/" className="text-white opacity-75 hover:opacity-100">Accueil</a>
            <span className="mx-2 opacity-75">/</span>
            <span className="font-medium">Choisir mon profil</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choisissez votre profil
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Sélectionnez le rôle qui correspond à vos objectifs sur la plateforme MdSC
          </p>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Message d'alerte si l'utilisateur vient de Google */}
        {fromGoogle && message && (
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-800 text-sm font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.type}
                className={`bg-white rounded-2xl shadow-lg border-2 ${role.borderColor} ${role.hoverBorder} hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
              >
                {/* Card Header with Gradient and Background Image */}
                <div className={`bg-gradient-to-br ${role.bgGradient} text-white p-8 text-center relative overflow-hidden`}>
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
                    style={{
                      backgroundImage: role.type === 'student' ? 'url(/Colleagues.png)' : 'url(/Woman.png)'
                    }}
                  />
                  <div className="relative z-10">
                    {/* Avatar Circle */}
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full mb-6 group-hover:scale-110 transition-transform shadow-lg">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ backgroundColor: role.bgColor }}>
                        {role.type === 'student' ? (
                          // Avatar Apprenant
                          <div className="relative">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                              <Icon className="h-10 w-10" style={{ color: role.bgColor }} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                              <BookOpen className="h-5 w-5" style={{ color: role.bgColor }} />
                            </div>
                          </div>
                        ) : (
                          // Avatar Formateur
                          <div className="relative">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                              <Icon className="h-10 w-10" style={{ color: role.bgColor }} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                              <Award className="h-5 w-5" style={{ color: role.bgColor }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{role.title}</h2>
                    <p className="text-white text-opacity-90">{role.subtitle}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                  <p className="text-gray-700 text-center mb-6 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-4 mb-8">
                    {role.features.map((feature, index) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`${role.bgLight} p-2 rounded-lg`}>
                            <FeatureIcon className={`h-5 w-5 ${role.textColor}`} />
                          </div>
                          <span className="text-gray-700 font-medium">{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleRoleSelection(role.type)}
                    className={`w-full bg-gradient-to-r ${role.bgGradient} hover:opacity-90 text-white font-semibold py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center group`}
                  >
                    Continuer en tant que {role.title}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton Google si l'utilisateur vient de Google et a sélectionné un rôle */}
        {fromGoogle && selectedRole && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-sm">
              <p className="text-center text-gray-700 mb-4 font-medium">
                Rôle sélectionné : <span className="text-mdsc-blue-dark capitalize">{selectedRole === 'student' ? 'Apprenant' : 'Formateur'}</span>
              </p>
              {googleError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{googleError}</p>
                </div>
              )}
              <GoogleLoginButton
                onSuccess={() => {
                  // Le GoogleLoginButton gère déjà la redirection vers /dashboard
                  console.log('✅ [SELECT ROLE] Google authentication successful');
                }}
                onError={(error) => {
                  setGoogleError(error);
                }}
              />
              <p className="text-center text-sm text-gray-500 mt-4">
                Vous pouvez modifier votre choix ci-dessus avant de continuer
              </p>
            </div>
          </div>
        )}

        {/* Already have an account */}
        <div className="mt-12 text-center">
          <p className="text-gray-700 mb-4">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-medium text-mdsc-blue-dark hover:text-mdsc-blue-primary underline">
              Se connecter
            </a>
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Pourquoi choisir la plateforme MdSC ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E6F2F8] rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-[#006095]" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Formations de qualité</h4>
                <p className="text-gray-600 text-sm">
                  Des cours conçus par des experts pour renforcer les capacités de la société civile
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FEF5E7] rounded-full mb-4">
                  <Award className="h-8 w-8 text-[#F4A53A]" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Certifications reconnues</h4>
                <p className="text-gray-600 text-sm">
                  Obtenez des certifications valorisées par les institutions partenaires
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Accompagnement IA</h4>
                <p className="text-gray-600 text-sm">
                  Bénéficiez d'un assistant IA pour optimiser votre apprentissage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
