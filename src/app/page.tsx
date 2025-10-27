import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CoursePreview from '../components/home/CoursePreview';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';

// Données de démonstration pour les cours
const sampleCourses = [
  {
    id: '1',
    title: 'Leadership et Management d\'Équipe',
    description: 'Développez vos compétences en leadership et apprenez à gérer des équipes performantes dans un environnement dynamique.',
    instructor: 'Dr. Kouassi Jean',
    duration: '8 semaines',
    students: 245,
    rating: 4.8,
    thumbnail: '/apprenant.png',
    category: 'Management',
    level: 'Intermédiaire' as const,
    price: 0,
  },
  {
    id: '2',
    title: 'Communication Efficace et Prise de Parole',
    description: 'Maîtrisez l\'art de la communication professionnelle et développez votre aisance à l\'oral dans toutes les situations.',
    instructor: 'Mme. Traoré Aminata',
    duration: '6 semaines',
    students: 189,
    rating: 4.9,
    thumbnail: '/apprenant.png',
    category: 'Communication',
    level: 'Débutant' as const,
    price: 15000,
  },
  {
    id: '3',
    title: 'Gestion de Projet Agile',
    description: 'Apprenez les méthodologies agiles et devenez un chef de projet efficace capable de mener vos équipes au succès.',
    instructor: 'Prof. N\'Guessan Paul',
    duration: '10 semaines',
    students: 167,
    rating: 4.7,
    thumbnail: '/apprenant.png',
    category: 'Gestion de projet',
    level: 'Avancé' as const,
    price: 25000,
  },
  {
    id: '4',
    title: 'Mobilisation communautaire',
    description: 'Techniques éprouvées pour mobiliser et engager efficacement les communautés.',
    instructor: 'M. Koné Ibrahim',
    duration: '5 semaines',
    students: 203,
    rating: 4.6,
    thumbnail: '/apprenant.png',
    category: 'Mobilisation',
    level: 'Intermédiaire' as const,
    price: 0,
  },
  {
    id: '5',
    title: 'Gestion de projet participative',
    description: 'Approches collaboratives pour la planification et l\'exécution de projets sociaux.',
    instructor: 'Dr. Diabaté Fatou',
    duration: '4 semaines',
    students: 178,
    rating: 4.8,
    thumbnail: '/apprenant.png',
    category: 'Gestion',
    level: 'Intermédiaire' as const,
    price: 20000,
  },
  {
    id: '6',
    title: 'Leadership transformationnel',
    description: 'Développez votre leadership pour inspirer et transformer votre organisation.',
    instructor: 'Mme. Ouattara Mariam',
    duration: '3 semaines',
    students: 134,
    rating: 4.9,
    thumbnail: '/apprenant.png',
    category: 'Leadership',
    level: 'Débutant' as const,
    price: 0,
  },
];

export default function Home() {
  // Limiter à 3 cours pour correspondre à la maquette
  const featuredCourses = sampleCourses.slice(0, 3);
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <CoursePreview courses={featuredCourses} />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
