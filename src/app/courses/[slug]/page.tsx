'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Clock, User, Star, Play, CheckCircle, Lock } from 'lucide-react';
import { Course } from '../../../types/course';
import { courseService } from '../../../lib/services/courseService';
import { courseService as modernCourseService } from '../../../lib/services/modernCourseService';
import CoursePlayer from '../../../components/courses/CoursePlayer';
import Button from '../../../components/ui/Button';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [course, setCourse] = useState<Course | null>(null);
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
      // Essayer d'abord avec le service moderne
      try {
        const data = await modernCourseService.getCourseBySlug(slug);
        setCourse(data);
      } catch {
        // Fallback sur l'ancien service
        const data = await courseService.getCourseById(slug);
        setCourse(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    
    try {
      await courseService.enrollInCourse(course.id);
      setShowPlayer(true);
      router.push(`/learn/${course.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
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

  if (showPlayer && course.modules) {
    return (
      <div className="min-h-screen">
        <CoursePlayer course={course} />
      </div>
    );
  }

  const isEnrolled = course.enrollment !== undefined;
  const categoryLabels = {
    sante: 'Santé',
    education: 'Éducation',
    gouvernance: 'Gouvernance',
    environnement: 'Environnement',
    economie: 'Économie',
  };
  const levelLabels = {
    debutant: 'Débutant',
    intermediaire: 'Intermédiaire',
    avance: 'Avancé',
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
                    <span>{course.instructor?.firstName} {course.instructor?.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{course.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{course.enrollmentCount || 0} inscrits</span>
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

              {course.thumbnailUrl && (
                <div className="relative">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        {course.modules && course.modules.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Contenu du cours</h2>
            <div className="space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-gray-600 mt-2">{module.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {module.lessons && module.lessons.length > 0 && (
                    <div className="divide-y divide-gray-200">
                      {module.lessons.map((lesson, lessonIndex) => (
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
                                <span className="capitalize">{lesson.contentType}</span>
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
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
