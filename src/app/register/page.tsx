'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';

const content = {
  image: '/Colleagues.png',
  title: 'Plateforme MdSC',
  subtitle: 'Formations et certifications',
  features: [
    'Accès à tous les cours',
    'Certifications reconnues',
    'Assistant IA personnel',
    'Suivi de progression',
  ],
} as const;

function RegisterContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen flex relative">
      <a
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center text-gray-600 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </a>

      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-600 to-cyan-700">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${content.image})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-cyan-900/70 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white p-12">
            <h1 className="text-5xl font-bold mb-4 text-center">{content.title}</h1>
            <p className="text-2xl mb-8 text-center">{content.subtitle}</p>
            <ul className="space-y-4 text-lg text-center">
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-center justify-center">
                  <span className="mr-3">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-2xl p-8">
          {message && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{message}</span>
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
