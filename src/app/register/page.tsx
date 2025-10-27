import SimpleRegisterForm from '../../components/auth/SimpleRegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Maison de la Société Civile',
  description: 'Créez votre compte MdSC pour accéder à nos formations et rejoindre la communauté des organisations de la société civile.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <SimpleRegisterForm />
      </div>
    </div>
  );
}
