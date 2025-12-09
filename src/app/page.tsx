'use client';

import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CoursePreview from '../components/home/CoursePreview';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';
import { getPopularCourses, Course } from '../lib/services/modernCourseService';

export default function HomePage() {
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const loadPopularCourses = async () => {
      try {
        setLoadingCourses(true);
        const courses = await getPopularCourses(6); // Récupérer les 6 cours les plus populaires
        setPopularCourses(courses || []);
      } catch (error) {
        console.error('Erreur lors du chargement des cours populaires:', error);
        setPopularCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadPopularCourses();
  }, []);

  // Transformer les cours pour le format attendu par CoursePreview
  const transformedCourses = popularCourses.map((course) => {
    const courseAny = course as any;
    return {
      id: String(course.id),
      slug: courseAny.slug || course.id,
      title: course.title || 'Cours sans titre',
      description: course.description || courseAny.description || '',
      instructor: typeof course.instructor === 'string' ? course.instructor : courseAny.instructor?.name || courseAny.instructor_name || courseAny.instructorName || 'Formateur',
      duration: course.duration || courseAny.duration_minutes ? `${courseAny.duration_minutes} min` : 'N/A',
      students: course.students || courseAny.enrollments || courseAny.total_enrollments || courseAny.students_count || 0,
      thumbnail: course.thumbnail || courseAny.thumbnail_url || courseAny.thumbnailUrl || '',
      category: typeof course.category === 'string' ? course.category : courseAny.category?.name || 'Sans catégorie',
      price: course.price || courseAny.cost || 0,
      total_lessons: courseAny.total_lessons || courseAny.lessons_count || courseAny.lessons?.length || 0,
    };
  });

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
        {/* Section des cours les plus demandés */}
        {!loadingCourses && transformedCourses.length > 0 && (
          <CoursePreview courses={transformedCourses} />
        )}

        {/* Call to Action */}
        <CallToAction />

        {/* Section des témoignages */}
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

