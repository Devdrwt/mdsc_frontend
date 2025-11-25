'use client';

import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CoursePreview from '../components/home/CoursePreview';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';
import CertificateQuickVerify from '../components/home/CertificateQuickVerify';
import { courseService } from '../lib/services/courseService';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularCourses = async () => {
      try {
        setLoading(true);
        // Récupérer les cours populaires triés par nombre d'inscrits (limit 3)
        const courses = await courseService.getPopularCourses(3);
        
        // Transformer les données de l'API au format attendu par CoursePreview
        const formattedCourses = courses.map((course: any) => ({
          id: String(course.id),
          slug: course.slug || String(course.id),
          title: course.title,
          description: course.description || course.short_description || '',
          instructor: course.instructor 
            ? `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim()
            : 'Instructeur',
          duration: course.duration_minutes 
            ? course.duration_minutes >= 60
              ? `${Math.floor(course.duration_minutes / 60)}h${course.duration_minutes % 60 > 0 ? course.duration_minutes % 60 + 'min' : ''}`
              : `${course.duration_minutes}min`
            : 'Non spécifié',
          students: course.enrollment_count || 0,
          thumbnail: course.thumbnail_url || '/apprenant.png',
          category: course.category?.name || 'Formation',
          level: course.difficulty === 'beginner' ? 'Débutant' as const
            : course.difficulty === 'intermediate' ? 'Intermédiaire' as const
            : course.difficulty === 'advanced' ? 'Avancé' as const
            : 'Intermédiaire' as const,
          price: course.price || 0,
          total_lessons: course.total_lessons || 0,
        }));
        
        setFeaturedCourses(formattedCourses);
      } catch (error) {
        console.error('Erreur lors du chargement des cours populaires:', error);
        // En cas d'erreur, utiliser un tableau vide
        setFeaturedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadPopularCourses();
  }, []);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Wrap header + hero in same gradient to remove white gap */}
      <div className="relative" style={{
        background: 'linear-gradient(180deg, #0C3C5C 0%, #3B7C8A 100%)'
      }}>
        <Header />
        <HeroSection />
      </div>
      <main>
        <CertificateQuickVerify />

        {loading ? (
          <div className="section-mdsc bg-white">
            <div className="max-w-full mx-auto text-center py-12 px-20">
              <p className="text-gray-600">Chargement des formations populaires...</p>
            </div>
          </div>
        ) : (
          <CoursePreview courses={featuredCourses} />
        )}
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
