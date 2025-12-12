'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, BookOpen, Award, Sparkles, TrendingUp } from 'lucide-react';
import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';
import { useTranslations } from 'next-intl';

function RegisterContent() {
  const t = useTranslations('home.hero');
  const tNav = useTranslations('nav');
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  const content = {
    image: '/Colleagues.png',
    title: t('welcomeTitle'),
    subtitle: t('welcomeSubtitleRegister'),
    features: [
      { text: t('featureAccessCourses'), icon: BookOpen },
      { text: t('featureCertifications'), icon: Award },
      { text: t('featureAIAssistant'), icon: Sparkles },
      { text: t('featureProgressTracking'), icon: TrendingUp }
    ],
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Bouton retour accueil */}
      <a
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center text-gray-700 hover:text-gray-900 transition-all duration-200 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg border border-gray-200/50"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">{tNav('backToHome')}</span>
      </a>

      {/* Colonne gauche - Image de fond avec texte */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 overflow-hidden">
        {/* Motif décoratif animé */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>
        </div>
        
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700"
          style={{
            backgroundImage: `url(${content.image})`,
          }}
        />
        
        {/* Overlay avec dégradé moderne */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-cyan-900/75 to-blue-900/80 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white px-12 py-12 relative">
            <div className="max-w-lg text-center space-y-6">
              <h1 className="text-5xl font-extrabold mb-2 leading-tight tracking-tight">
                {content.title}
              </h1>
              <p className="text-xl text-cyan-100 font-medium mb-10">
                {content.subtitle}
              </p>
              
              <div className="space-y-4">
                {content.features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-lg font-medium flex-1 text-left">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex items-start justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-y-auto">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full max-w-2xl px-8 pt-16 pb-16 relative z-10">
          {message && (
            <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50/90 backdrop-blur-sm p-4 text-sm text-blue-900 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span className="font-medium">{message}</span>
            </div>
          )}
          <SimpleRegisterForm />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark mx-auto" />
            <p className="text-gray-600 text-sm">Chargement de la page d'inscription...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
