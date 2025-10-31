'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Clock, User, Star, Play, CheckCircle, Lock } from 'lucide-react';
import { CourseService, Course as ServiceCourse } from '../../../lib/services/courseService';
import { EnrollmentService } from '../../../lib/services/enrollmentService';
import toast from '../../../lib/utils/toast';
import CoursePlayer from '../../../components/courses/CoursePlayer';
import Button from '../../../components/ui/Button';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [course, setCourse] = useState<ServiceCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (slug) {
      loadCourse();
    }
  }, [slug]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      
      // Si le slug est un nombre, utiliser getCourseById, sinon getCourseBySlug
      const isNumeric = !isNaN(Number(slug));
      const data = isNumeric 
        ? await CourseService.getCourseById(slug)
        : await CourseService.getCourseBySlug(slug);
      
      setCourse(data);
    } catch (err: any) {
      console.error('Erreur chargement cours:', err);
      setError(err.message || 'Erreur lors du chargement du cours');
      toast.error('Erreur', err.message || 'Impossible de charger le cours');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) {
      toast.error('Erreur', 'Cours non chargé');
      return;
    }
    
    try {
      const courseId = typeof course.id === 'string' ? parseInt(course.id, 10) : course.id;
      await EnrollmentService.enrollInCourse(courseId);
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours !');
      router.push(`/learn/${course.id}`);
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      toast.error('Erreur', err.message || 'Impossible de s\'inscrire au cours');
    }
  };

  const handleStartLearning = () => {
    if (course) {
      router.push(`/learn/${course.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du cours...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Cours non trouvé'}</p>
            <Button variant="primary" onClick={() => router.push('/courses')}>
              Retour aux cours
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (showPlayer && course.lessons) {
    return (
      <div className="min-h-screen">
        {/* CoursePlayer ne sera utilisé que lorsque nécessaire */}
        <div className="text-center py-12">
          <p>Redirection vers le lecteur de cours...</p>
        </div>
      </div>
    );
  }

  const isEnrolled = course.enrollment !== undefined;
  const categoryLabels: { [key: string]: string } = {
    sante: 'Santé',
    education: 'Éducation',
    gouvernance: 'Gouvernance',
    environnement: 'Environnement',
    economie: 'Économie',
  };
  const levelLabels: { [key: string]: string } = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {categoryLabels[course.category] || course.category}
                  </span>
                  <span className="ml-2 inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {levelLabels[course.level] || course.level}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl text-white/90 mb-6">{course.description}</p>
                
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{course.instructor?.name || 'Instructeur'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{course.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{(course.rating || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{course.totalStudents || 0} inscrits</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {isEnrolled ? (
                    <Button variant="primary" size="lg" onClick={handleStartLearning}>
                      <Play className="h-5 w-5 mr-2" />
                      Continuer l'apprentissage
                    </Button>
                  ) : (
                    <Button variant="primary" size="lg" onClick={handleEnroll}>
                      S'inscrire maintenant
                    </Button>
                  )}
                </div>
              </div>

              {course.thumbnail && (
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        {course.lessons && course.lessons.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Contenu du cours</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {course.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-mdsc-blue-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-mdsc-blue-primary">
                          {lessonIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{lesson.duration} min</span>
                        </div>
                      </div>
                      {isEnrolled && lesson.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {!isEnrolled && (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Informations supplémentaires */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">À propos de ce cours</h3>
              <p className="text-gray-600">{course.shortDescription || course.description}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Informations pratiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Niveau:</span>
                  <span className="font-medium">{levelLabels[course.level] || course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée:</span>
                  <span className="font-medium">{course.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Note:</span>
                  <span className="font-medium">{(course.rating || 0).toFixed(1)} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inscrits:</span>
                  <span className="font-medium">{course.totalStudents || 0} étudiants</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
