import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Maison de la Société Civile',
  description: 'Créez votre compte MdSC pour accéder à nos formations et rejoindre la communauté des organisations de la société civile.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* Bouton retour accueil */}
      <a 
        href="/" 
        className="absolute top-4 left-4 z-20 flex items-center text-gray-600 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </a>
      
      {/* Colonne gauche - Image de fond avec texte */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-600 to-cyan-700">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/Woman.png)'
          }}
        />
        {/* Overlay avec texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-cyan-900/70 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white p-12">
            <h1 className="text-5xl font-bold mb-4">FORMATEUR</h1>
            <p className="text-2xl mb-8 text-center">Créer et animer des formations</p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Création de cours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Gestion des apprenants</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Support IA pour formateurs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Évaluation et certification</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-2xl p-8">
          <SimpleRegisterForm />
        </div>
      </div>
    </div>
  );
}
