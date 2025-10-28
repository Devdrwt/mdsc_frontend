import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Maison de la Société Civile',
  description: 'Créez votre compte MdSC pour accéder à nos formations et rejoindre la communauté des organisations de la société civile.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Image de fond avec opacité réduite */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url(/arri_plan.png)'
        }}
      />
      
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <SimpleRegisterForm />
      </div>
    </div>
  );
}
