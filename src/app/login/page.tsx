import LoginForm from '../../components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Maison de la Société Civile',
  description: 'Connectez-vous à votre espace de formation MdSC pour accéder à vos cours et certifications.',
};

export default function LoginPage() {
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
            backgroundImage: 'url(/Colleagues.png)'
          }}
        />
        {/* Overlay avec texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-cyan-900/70 z-10">
          <div className="h-full flex flex-col justify-center items-center text-white p-12">
            <h1 className="text-5xl font-bold mb-4">APPRENANT</h1>
            <p className="text-2xl mb-8 text-center">Suivre des formations</p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Accès à tous les cours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Certifications reconnues</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Assistant IA personnel</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Suivi de progression</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
