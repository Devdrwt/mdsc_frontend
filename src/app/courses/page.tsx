'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/courses/CourseCard';
import Button from '../../components/ui/Button';
import { Search, Clock, Users } from 'lucide-react';
import { Course } from '../../types';
import { CourseService, Course as ServiceCourse } from '../../lib/services/courseService';

// Données de démonstration (en attendant l'intégration API)
const sampleCourses: Course[] = [
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
    level: 'Intermédiaire',
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
    level: 'Débutant',
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
    level: 'Avancé',
    price: 25000,
  },
  {
    id: '4',
    title: 'Transformation Numérique',
    description: 'Comprenez les enjeux de la transformation digitale et apprenez à piloter le changement dans votre organisation.',
    instructor: 'M. Koné Ibrahim',
    duration: '7 semaines',
    students: 203,
    rating: 4.6,
    thumbnail: '/apprenant.png',
    category: 'Technologie',
    level: 'Intermédiaire',
    price: 0,
  },
  {
    id: '5',
    title: 'Formation de Formateurs',
    description: 'Devenez un formateur professionnel et apprenez les techniques pédagogiques modernes pour transmettre efficacement vos connaissances.',
    instructor: 'Dr. Diabaté Fatou',
    duration: '12 semaines',
    students: 134,
    rating: 4.8,
    thumbnail: '/apprenant.png',
    category: 'Pédagogie',
    level: 'Avancé',
    price: 20000,
  },
  {
    id: '6',
    title: 'Initiation à l\'Apprentissage en Ligne',
    description: 'Découvrez les fondamentaux de l\'e-learning et apprenez à tirer le meilleur parti des plateformes de formation en ligne.',
    instructor: 'Mme. Ouattara Mariam',
    duration: '4 semaines',
    students: 312,
    rating: 4.9,
    thumbnail: '/apprenant.png',
    category: 'E-learning',
    level: 'Débutant',
    price: 0,
  },
];

const categories = [
  'Toutes les catégories',
  'Management',
  'Communication',
  'Gestion de projet',
  'Technologie',
  'Pédagogie',
  'E-learning'
];

const levels = [
  'Tous les niveaux',
  'Débutant',
  'Intermédiaire',
  'Avancé'
];

// Fonction pour convertir ServiceCourse en Course (pour CourseCard)
const convertToCourse = (serviceCourse: ServiceCourse): any => {
  console.log('🔄 Conversion cours:', serviceCourse);
  console.log('🔗 Slug brut:', serviceCourse.slug, 'ID:', serviceCourse.id);
  
  // Convertir la durée en string pour CourseCard
  const durationInWeeks = Math.ceil((serviceCourse.duration || 0) / 60 / 7); // Convertir minutes en semaines
  const durationString = durationInWeeks > 0 ? `${durationInWeeks} semaines` : 'Durée variable';
  
  // Convertir le niveau pour CourseCard
  const levelString = serviceCourse.level === 'beginner' ? 'Débutant' 
    : serviceCourse.level === 'intermediate' ? 'Intermédiaire' 
    : 'Avancé';

  // Gérer l'instructeur correctement
  let instructorData;
  if (typeof serviceCourse.instructor === 'string') {
    instructorData = { id: '', name: serviceCourse.instructor };
  } else if (serviceCourse.instructor && typeof serviceCourse.instructor === 'object') {
    instructorData = {
      id: serviceCourse.instructor.id || '',
      name: serviceCourse.instructor.name || 'Instructeur',
      avatar: serviceCourse.instructor.avatar
    };
  } else {
    instructorData = { id: '', name: 'Instructeur' };
  }

  const converted = {
    id: serviceCourse.id,
    title: serviceCourse.title,
    slug: serviceCourse.slug || serviceCourse.id, // Utiliser le slug s'il existe, sinon l'id
    description: serviceCourse.description || '',
    shortDescription: serviceCourse.shortDescription || '',
    category: serviceCourse.category || 'non-categorisé',
    level: levelString, // Pour CourseCard
    level_database: serviceCourse.level === 'beginner' ? 'debutant' : serviceCourse.level === 'intermediate' ? 'intermediaire' : 'avance', // Pour le type
    duration: durationString, // String pour CourseCard
    language: 'fr',
    thumbnail_url: serviceCourse.thumbnail,
    instructor: instructorData,
    is_published: serviceCourse.isPublished !== undefined ? serviceCourse.isPublished : true,
    enrollment_count: serviceCourse.totalStudents || 0,
    rating: serviceCourse.rating || 0,
    // Conversions pour CourseCard
    thumbnail: serviceCourse.thumbnail || '/apprenant.png',
    students: serviceCourse.totalStudents || 0,
    price: serviceCourse.price || 0,
  };
  
  console.log('✅ Cours converti:', converted);
  return converted;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [selectedLevel, setSelectedLevel] = useState('Tous les niveaux');
  const [isLoading, setIsLoading] = useState(true);

  // Charger les cours depuis l'API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Chargement des cours depuis l\'API...');
        const response = await CourseService.getAllCourses();
        console.log('📦 Réponse API:', response);
        
        // Extraire les cours de la réponse
        const serviceCourses = response.courses || (Array.isArray(response) ? response : []);
        console.log('📚 Cours extraits:', serviceCourses.length, 'cours');
        
        const convertedCourses = Array.isArray(serviceCourses) 
          ? serviceCourses.map(convertToCourse)
          : [];
        console.log('✅ Cours convertis:', convertedCourses.length, 'cours');
        setCourses(convertedCourses);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des cours:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Filtrage des cours
  useEffect(() => {
    if (!Array.isArray(courses)) {
      setFilteredCourses([]);
      return;
    }

    let filtered = courses;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof course.instructor === 'string' 
          ? course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
          : course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'Toutes les catégories') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filtre par niveau
    if (selectedLevel !== 'Tous les niveaux') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);

    try {
      // TODO: Remplacer par l'appel API réel
      // const results = await searchCourses(query);
      // setCourses(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = (courseId: string) => {
    // TODO: Implémenter l'inscription au cours
    console.log('Enroll in course:', courseId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Catalogue de formations
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Explorez notre collection complète de formations certifiantes et trouvez celle qui correspond à vos objectifs
          </p>
        </div>
      </section>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 -mt-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Recherche */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-4">
                {/* Filtre catégorie */}
                <div className="min-w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre niveau */}
                <div className="min-w-[150px]">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-8">
            <p className="text-lg font-medium text-gray-700">
              {filteredCourses.length} formation{filteredCourses.length > 1 ? 's' : ''} trouvée{filteredCourses.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille des cours */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="bg-gray-300 h-4 rounded"></div>
                    <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                />
              ))}
            </div>
          )}

          {/* Message si aucun cours trouvé */}
          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-mdsc-gray mb-4">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Aucun cours trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
